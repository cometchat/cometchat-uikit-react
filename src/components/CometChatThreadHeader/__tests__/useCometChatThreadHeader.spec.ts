import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCometChatThreadHeader } from '../useCometChatThreadHeader';
import type { CometChat } from '@cometchat/chat-sdk-javascript';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Capture the listener callback so tests can invoke it
let messageListenerCallbacks: Record<string, (msg: CometChat.BaseMessage) => void> = {};

vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
    addMessageListener: vi.fn((_id: string, callbacks: Record<string, unknown>) => {
      messageListenerCallbacks = callbacks as Record<string, (msg: CometChat.BaseMessage) => void>;
    }),
    removeMessageListener: vi.fn(),
    MessageListener: vi.fn().mockImplementation((callbacks: unknown) => callbacks),
    getLoggedinUser: vi.fn().mockResolvedValue(null),
  },
}));

// Capture the SDK event handler so tests can invoke it
let sdkEventHandler: ((event: unknown) => void) | null = null;

vi.mock('../../../hooks/useCometChatEvents', () => ({
  useCometChatEvents: vi.fn((handler: (event: unknown) => void) => {
    sdkEventHandler = handler;
  }),
}));

vi.mock('../CometChatThreadHeaderManager', () => ({
  attachThreadHeaderMessageListener: vi.fn(
    (
      _listenerId: string,
      _parentMessageId: number,
      _loggedInUserId: string,
      onNewReply: (msg: CometChat.BaseMessage) => void
    ) => {
      // Store the callback so tests can trigger it
      messageListenerCallbacks = { onNewReply };
      return vi.fn(); // cleanup function
    }
  ),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockMessage(overrides: Record<string, unknown> = {}) {
  return {
    getId: () => overrides.id ?? 1001,
    getType: () => overrides.type ?? 'text',
    getCategory: () => 'message',
    getSender: () => ({
      getUid: () => overrides.senderUid ?? 'user-123',
      getName: () => overrides.senderName ?? 'John Doe',
      getAvatar: () => '',
    }),
    getReplyCount: () => overrides.replyCount ?? 5,
    getSentAt: () => Math.floor(Date.now() / 1000),
    getDeletedAt: () => null,
    getEditedAt: () => null,
    getReadAt: () => null,
    getDeliveredAt: () => null,
    getParentMessageId: () => overrides.parentMessageId ?? 0,
    getText: () => overrides.text ?? 'Hello world',
    getReceiverType: () => 'user',
    getReceiver: () => ({ getUid: () => 'receiver-456', getName: () => 'Jane' }),
    getMuid: () => 'muid-1001',
    getConversationId: () => 'conv-1',
    getRawMessage: () => ({}),
    getMetadata: () => null,
    getData: () => ({}),
    getAttachments: () => [],
    getAttachment: () => null,
    getMentionedUsers: () => [],
    getReactions: () => [],
  } as unknown as CometChat.BaseMessage;
}

function createMockUser(uid = 'logged-in-user', name = 'Me') {
  return {
    getUid: () => uid,
    getName: () => name,
    getAvatar: () => '',
  } as unknown as CometChat.User;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useCometChatThreadHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    messageListenerCallbacks = {};
    sdkEventHandler = null;
  });

  describe('initial state', () => {
    it('returns the replyCount from the prop when provided', () => {
      const parentMessage = createMockMessage({ replyCount: 10 });
      const loggedInUser = createMockUser();

      const { result } = renderHook(() =>
        useCometChatThreadHeader({
          parentMessage,
          replyCount: 42,
          loggedInUser,
        })
      );

      expect(result.current.replyCount).toBe(42);
    });

    it('falls back to parentMessage.getReplyCount() when replyCount prop is undefined', () => {
      const parentMessage = createMockMessage({ replyCount: 7 });
      const loggedInUser = createMockUser();

      const { result } = renderHook(() =>
        useCometChatThreadHeader({
          parentMessage,
          loggedInUser,
        })
      );

      expect(result.current.replyCount).toBe(7);
    });

    it('returns the sender name from the parent message', () => {
      const parentMessage = createMockMessage({ senderName: 'Alice' });
      const loggedInUser = createMockUser();

      const { result } = renderHook(() =>
        useCometChatThreadHeader({
          parentMessage,
          loggedInUser,
        })
      );

      expect(result.current.senderName).toBe('Alice');
    });

    it('returns empty string when sender is null', () => {
      const baseMock = createMockMessage();
      const parentMessage = Object.assign({}, baseMock, {
        getSender: () => null as unknown as ReturnType<CometChat.BaseMessage['getSender']>,
      }) as unknown as CometChat.BaseMessage;

      const loggedInUser = createMockUser();

      const { result } = renderHook(() =>
        useCometChatThreadHeader({
          parentMessage,
          loggedInUser,
        })
      );

      expect(result.current.senderName).toBe('');
    });
  });

  describe('SDK message listener (new reply from other user)', () => {
    it('increments reply count when a new reply arrives via SDK listener', () => {
      const parentMessage = createMockMessage({ id: 100, replyCount: 3 });
      const loggedInUser = createMockUser();

      const { result } = renderHook(() =>
        useCometChatThreadHeader({
          parentMessage,
          loggedInUser,
        })
      );

      expect(result.current.replyCount).toBe(3);

      // Simulate a new reply arriving via the SDK listener
      act(() => {
        const replyMessage = createMockMessage({
          id: 200,
          parentMessageId: 100,
          senderUid: 'other-user',
        });
        messageListenerCallbacks.onNewReply?.(replyMessage);
      });

      expect(result.current.replyCount).toBe(4);
    });

    it('does not double-count the same message ID', () => {
      const parentMessage = createMockMessage({ id: 100, replyCount: 3 });
      const loggedInUser = createMockUser();

      const { result } = renderHook(() =>
        useCometChatThreadHeader({
          parentMessage,
          loggedInUser,
        })
      );

      act(() => {
        const replyMessage = createMockMessage({ id: 200 });
        messageListenerCallbacks.onNewReply?.(replyMessage);
      });

      expect(result.current.replyCount).toBe(4);

      // Same message ID again — should not increment
      act(() => {
        const replyMessage = createMockMessage({ id: 200 });
        messageListenerCallbacks.onNewReply?.(replyMessage);
      });

      expect(result.current.replyCount).toBe(4);
    });
  });

  describe('SDK bridge events (message sent by current user)', () => {
    it('increments reply count for text message sent by current user', () => {
      const parentMessage = createMockMessage({ id: 100, replyCount: 2 });
      const loggedInUser = createMockUser('logged-in-user');

      const { result } = renderHook(() =>
        useCometChatThreadHeader({
          parentMessage,
          loggedInUser,
        })
      );

      expect(result.current.replyCount).toBe(2);

      // Simulate SDK bridge event for a text message sent by the current user
      act(() => {
        sdkEventHandler?.({
          type: 'message/text-received',
          message: createMockMessage({
            id: 300,
            parentMessageId: 100,
            senderUid: 'logged-in-user',
          }),
        });
      });

      expect(result.current.replyCount).toBe(3);
    });

    it('increments reply count for media message sent by current user', () => {
      const parentMessage = createMockMessage({ id: 100, replyCount: 2 });
      const loggedInUser = createMockUser('logged-in-user');

      const { result } = renderHook(() =>
        useCometChatThreadHeader({
          parentMessage,
          loggedInUser,
        })
      );

      act(() => {
        sdkEventHandler?.({
          type: 'message/media-received',
          message: createMockMessage({
            id: 301,
            parentMessageId: 100,
            senderUid: 'logged-in-user',
          }),
        });
      });

      expect(result.current.replyCount).toBe(3);
    });

    it('increments reply count for custom message sent by current user', () => {
      const parentMessage = createMockMessage({ id: 100, replyCount: 2 });
      const loggedInUser = createMockUser('logged-in-user');

      const { result } = renderHook(() =>
        useCometChatThreadHeader({
          parentMessage,
          loggedInUser,
        })
      );

      act(() => {
        sdkEventHandler?.({
          type: 'message/custom-received',
          message: createMockMessage({
            id: 302,
            parentMessageId: 100,
            senderUid: 'logged-in-user',
          }),
        });
      });

      expect(result.current.replyCount).toBe(3);
    });

    it('increments reply count for interactive message sent by current user', () => {
      const parentMessage = createMockMessage({ id: 100, replyCount: 2 });
      const loggedInUser = createMockUser('logged-in-user');

      const { result } = renderHook(() =>
        useCometChatThreadHeader({
          parentMessage,
          loggedInUser,
        })
      );

      act(() => {
        sdkEventHandler?.({
          type: 'message/interactive-received',
          message: createMockMessage({
            id: 303,
            parentMessageId: 100,
            senderUid: 'logged-in-user',
          }),
        });
      });

      expect(result.current.replyCount).toBe(3);
    });

    it('ignores SDK bridge events for a different parent message', () => {
      const parentMessage = createMockMessage({ id: 100, replyCount: 2 });
      const loggedInUser = createMockUser('logged-in-user');

      const { result } = renderHook(() =>
        useCometChatThreadHeader({
          parentMessage,
          loggedInUser,
        })
      );

      act(() => {
        sdkEventHandler?.({
          type: 'message/text-received',
          message: createMockMessage({
            id: 400,
            parentMessageId: 999, // different parent
            senderUid: 'logged-in-user',
          }),
        });
      });

      expect(result.current.replyCount).toBe(2);
    });

    it('ignores SDK bridge events from a different user', () => {
      const parentMessage = createMockMessage({ id: 100, replyCount: 2 });
      const loggedInUser = createMockUser('logged-in-user');

      const { result } = renderHook(() =>
        useCometChatThreadHeader({
          parentMessage,
          loggedInUser,
        })
      );

      act(() => {
        sdkEventHandler?.({
          type: 'message/text-received',
          message: createMockMessage({
            id: 401,
            parentMessageId: 100,
            senderUid: 'other-user', // not the logged-in user
          }),
        });
      });

      expect(result.current.replyCount).toBe(2);
    });

    it('ignores unrelated SDK bridge event types', () => {
      const parentMessage = createMockMessage({ id: 100, replyCount: 2 });
      const loggedInUser = createMockUser('logged-in-user');

      const { result } = renderHook(() =>
        useCometChatThreadHeader({
          parentMessage,
          loggedInUser,
        })
      );

      act(() => {
        sdkEventHandler?.({
          type: 'message/deleted',
          message: createMockMessage({
            id: 500,
            parentMessageId: 100,
            senderUid: 'logged-in-user',
          }),
        });
      });

      expect(result.current.replyCount).toBe(2);
    });
  });

  describe('parentMessage change (reset)', () => {
    it('resets state when parentMessage changes to a different message', () => {
      const parentMessage1 = createMockMessage({ id: 100, replyCount: 5 });
      const parentMessage2 = createMockMessage({ id: 200, replyCount: 10 });
      const loggedInUser = createMockUser();

      const { result, rerender } = renderHook(
        ({ parentMessage }) =>
          useCometChatThreadHeader({
            parentMessage,
            loggedInUser,
          }),
        { initialProps: { parentMessage: parentMessage1 } }
      );

      expect(result.current.replyCount).toBe(5);

      // Change to a different parent message
      rerender({ parentMessage: parentMessage2 });

      expect(result.current.replyCount).toBe(10);
    });
  });

  describe('onError callback', () => {
    it('calls onError when attachThreadHeaderMessageListener throws', async () => {
      const { attachThreadHeaderMessageListener } = await import('../CometChatThreadHeaderManager');
      (attachThreadHeaderMessageListener as Mock).mockImplementationOnce(() => {
        throw new Error('SDK error');
      });

      const onError = vi.fn();
      const parentMessage = createMockMessage({ id: 100 });
      const loggedInUser = createMockUser();

      renderHook(() =>
        useCometChatThreadHeader({
          parentMessage,
          loggedInUser,
          onError,
        })
      );

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
      expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'SDK error' }));
    });
  });

  describe('loggedInUser null', () => {
    it('does not attach SDK listener when loggedInUser is null', async () => {
      const { attachThreadHeaderMessageListener } = await import('../CometChatThreadHeaderManager');
      (attachThreadHeaderMessageListener as Mock).mockClear();

      const parentMessage = createMockMessage({ id: 100 });

      renderHook(() =>
        useCometChatThreadHeader({
          parentMessage,
          loggedInUser: null,
        })
      );

      expect(attachThreadHeaderMessageListener).not.toHaveBeenCalled();
    });
  });
});
