import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCometChatConversations } from '../useCometChatConversations';

/* eslint-disable @typescript-eslint/unbound-method */

// --- Mock SDK ---
const mockFetchNext = vi.fn();
const mockBuild = vi.fn(() => ({ fetchNext: mockFetchNext }));
const mockSetLimit = vi.fn(() => ({ build: mockBuild }));

vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
    CATEGORY_MESSAGE: 'message',
    CATEGORY_CUSTOM: 'custom',
    CATEGORY_ACTION: 'action',
    CATEGORY_CALL: 'call',
    CATEGORY_INTERACTIVE: 'interactive',
    MessageCategory: { AGENTIC: 'agentic' },
    ModerationStatus: {
      PENDING: 'pending',
      APPROVED: 'approved',
      DISAPPROVED: 'disapproved',
      UNMODERATED: 'unmoderated',
    },
    MESSAGE_TYPE: {
      TEXT: 'text',
      IMAGE: 'image',
      VIDEO: 'video',
      AUDIO: 'audio',
      FILE: 'file',
      ASSISTANT: 'assistant',
      TOOL_ARGUMENTS: 'tool_arguments',
      TOOL_RESULT: 'tool_result',
    },
    ACTION_TYPE: {
      MEMBER_JOINED: 'joined',
      MEMBER_LEFT: 'left',
      MEMBER_ADDED: 'added',
      MEMBER_BANNED: 'banned',
      MEMBER_UNBANNED: 'unbanned',
      MEMBER_KICKED: 'kicked',
      MEMBER_INVITED: 'invited',
      MEMBER_SCOPE_CHANGED: 'scopeChanged',
    },
    GROUP_TYPE: { PRIVATE: 'private', PASSWORD: 'password', PUBLIC: 'public' },
    CALL_MODE: {
      DEFAULT: 'default',
      GRID: 'grid',
      SINGLE: 'single',
      SPOTLIGHT: 'spotlight',
      TILE: 'tile',
    },
    GoalType: { ALL_OF: 'allOf', ANY_OF: 'anyOf', ANY_ACTION: 'anyAction', NONE: 'none' },
    RECEIVER_TYPE: { USER: 'user', GROUP: 'group' },
    USER_STATUS: { ONLINE: 'online', OFFLINE: 'offline' },
    GROUP_MEMBER_SCOPE: { ADMIN: 'admin', PARTICIPANT: 'participant', MODERATOR: 'moderator' },
    CALL_STATUS: {
      ONGOING: 'ongoing',
      ENDED: 'ended',
      INITIATED: 'initiated',
      CANCELLED: 'cancelled',
      REJECTED: 'rejected',
      UNANSWERED: 'unanswered',
      BUSY: 'busy',
    },
    AI_ASSISTANT_EVENTS: {
      RUN_STARTED: 'run_started',
      TEXT_MESSAGE_START: 'text_message_start',
      TEXT_MESSAGE_CONTENT: 'text_message_content',
      TEXT_MESSAGE_END: 'text_message_end',
      RUN_FINISHED: 'run_finished',
      TOOL_CALL_STARTED: 'tool_call_start',
      TOOL_CALL_ENDED: 'tool_call_end',
      TOOL_CALL_ARGUMENT: 'tool_call_args',
      TOOL_CALL_RESULT: 'tool_call_result',
    },
    ConversationsRequestBuilder: vi.fn(() => ({
      setLimit: mockSetLimit,
      build: mockBuild,
    })),
    CometChatHelper: {
      getConversationFromMessage: vi.fn(),
    },
    MessageListener: vi.fn((callbacks: Record<string, unknown>) => callbacks),
    UserListener: vi.fn((callbacks: Record<string, unknown>) => callbacks),
    GroupListener: vi.fn((callbacks: Record<string, unknown>) => callbacks),
    ConnectionListener: vi.fn((callbacks: Record<string, unknown>) => callbacks),
    addMessageListener: vi.fn(),
    removeMessageListener: vi.fn(),
    addUserListener: vi.fn(),
    removeUserListener: vi.fn(),
    addGroupListener: vi.fn(),
    removeGroupListener: vi.fn(),
    addConnectionListener: vi.fn(),
    removeConnectionListener: vi.fn(),
    deleteConversation: vi.fn(),
    getLoggedinUser: vi.fn(() => Promise.resolve({ getUid: () => 'logged-in-user' })),
    getConversation: vi.fn(),
  },
}));

function createMockConversation(id: string, unreadCount = 0) {
  return {
    getConversationId: () => id,
    getConversationType: () => 'user',
    getConversationWith: () => ({
      getUid: () => id,
      getName: () => `User ${id}`,
      getStatus: () => 'online',
      getAvatar: () => null,
    }),
    getLastMessage: () => null,
    getUnreadMessageCount: () => unreadCount,
  } as unknown as CometChat.Conversation;
}

describe('useCometChatConversations', () => {
  beforeEach(() => {
    mockFetchNext.mockReset();
    mockFetchNext.mockResolvedValue([createMockConversation('c1'), createMockConversation('c2')]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches first page on mount and transitions to loaded', async () => {
    const { result } = renderHook(() => useCometChatConversations());

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });
    expect(result.current.conversations).toHaveLength(2);
    expect(result.current.hasMore).toBe(true);
  });

  it('sets fetchState to empty when first fetch returns empty array', async () => {
    mockFetchNext.mockResolvedValue([]);
    const onEmpty = vi.fn();

    const { result } = renderHook(() => useCometChatConversations({ onEmpty }));

    await waitFor(() => {
      expect(result.current.fetchState).toBe('empty');
    });
    expect(onEmpty).toHaveBeenCalled();
  });

  it('sets fetchState to error on SDK error', async () => {
    mockFetchNext.mockRejectedValue(new Error('Network error'));
    const onError = vi.fn();

    const { result } = renderHook(() => useCometChatConversations({ onError }));

    await waitFor(() => {
      expect(result.current.fetchState).toBe('error');
    });
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  it('selectConversation adds conversation to selection', async () => {
    const { result } = renderHook(() => useCometChatConversations());

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });

    const conv = createMockConversation('c1');
    act(() => {
      result.current.selectConversation(conv);
    });

    expect(result.current.selectedConversationIds).toContain('c1');
    expect(result.current.selectedConversationsMap.get('c1')).toBe(conv);
  });

  it('deselectConversation removes conversation from selection', async () => {
    const { result } = renderHook(() => useCometChatConversations());

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });

    const conv = createMockConversation('c1');
    act(() => {
      result.current.selectConversation(conv);
    });
    act(() => {
      result.current.deselectConversation('c1');
    });

    expect(result.current.selectedConversationIds).not.toContain('c1');
  });

  it('clearSelection empties selection', async () => {
    const { result } = renderHook(() => useCometChatConversations());

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });

    act(() => {
      result.current.selectConversation(createMockConversation('c1'));
      result.current.selectConversation(createMockConversation('c2'));
    });
    act(() => {
      result.current.clearSelection();
    });

    expect(result.current.selectedConversationIds).toEqual([]);
  });

  it('setSearchText resets list and re-fetches', async () => {
    const { result } = renderHook(() => useCometChatConversations());

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });

    mockFetchNext.mockResolvedValue([createMockConversation('c3')]);

    act(() => {
      result.current.setSearchText('alice');
    });

    await waitFor(() => {
      expect(result.current.conversations).toHaveLength(1);
    });
    expect(result.current.searchText).toBe('alice');
  });

  it('handleItemClick calls onItemClick callback', async () => {
    const onItemClick = vi.fn();
    const { result } = renderHook(() => useCometChatConversations({ onItemClick }));

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });

    const conv = createMockConversation('c1');
    act(() => {
      result.current.handleItemClick(conv);
    });

    expect(onItemClick).toHaveBeenCalledWith(conv);
  });

  it('handleItemClick in multiple mode toggles selection', async () => {
    const onSelect = vi.fn();
    const { result } = renderHook(() =>
      useCometChatConversations({ selectionMode: 'multiple', onSelect })
    );

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });

    const conv = result.current.conversations[0]!;
    act(() => {
      result.current.handleItemClick(conv);
    });

    expect(result.current.selectedConversationIds).toContain(conv.getConversationId());
    expect(onSelect).toHaveBeenCalledWith(conv, true);
  });

  it('handleItemClick in multiple mode deselects already-selected conversation', async () => {
    const onSelect = vi.fn();
    const { result } = renderHook(() =>
      useCometChatConversations({ selectionMode: 'multiple', onSelect })
    );

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });

    const conv = result.current.conversations[0]!;
    act(() => {
      result.current.handleItemClick(conv);
    });
    act(() => {
      result.current.handleItemClick(conv);
    });

    expect(result.current.selectedConversationIds).not.toContain(conv.getConversationId());
    expect(onSelect).toHaveBeenLastCalledWith(conv, false);
  });

  it('handleItemClick with shiftKey in multiple mode selects range', async () => {
    const onSelect = vi.fn();
    const { result } = renderHook(() =>
      useCometChatConversations({ selectionMode: 'multiple', onSelect })
    );

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });

    const firstConv = result.current.conversations[0]!;
    act(() => {
      result.current.handleItemClick(firstConv);
    });

    const secondConv = result.current.conversations[1]!;
    act(() => {
      result.current.handleItemClick(secondConv, { shiftKey: true });
    });

    expect(result.current.selectedConversationIds).toContain(firstConv.getConversationId());
    expect(result.current.selectedConversationIds).toContain(secondConv.getConversationId());
  });

  it('handleItemClick in single mode selects conversation and clears previous', async () => {
    const onSelect = vi.fn();
    const { result } = renderHook(() =>
      useCometChatConversations({ selectionMode: 'single', onSelect })
    );

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });

    const firstConv = result.current.conversations[0]!;
    const secondConv = result.current.conversations[1]!;

    act(() => {
      result.current.handleItemClick(firstConv);
    });
    expect(result.current.selectedConversationIds).toContain(firstConv.getConversationId());

    act(() => {
      result.current.handleItemClick(secondConv);
    });
    expect(result.current.selectedConversationIds).toContain(secondConv.getConversationId());
    expect(result.current.selectedConversationIds).not.toContain(firstConv.getConversationId());
  });

  it('setActiveConversation updates activeConversationId', async () => {
    const { result } = renderHook(() => useCometChatConversations());

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });

    act(() => {
      result.current.setActiveConversation('c1');
    });
    expect(result.current.activeConversationId).toBe('c1');

    act(() => {
      result.current.setActiveConversation(null);
    });
    expect(result.current.activeConversationId).toBeNull();
  });

  it('fetchNext appends more conversations to the list', async () => {
    const { result } = renderHook(() => useCometChatConversations());

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });
    expect(result.current.conversations).toHaveLength(2);

    mockFetchNext.mockResolvedValue([createMockConversation('c3'), createMockConversation('c4')]);

    await act(async () => {
      await result.current.fetchNext();
    });

    expect(result.current.conversations).toHaveLength(4);
  });

  it('fetchNext is no-op when hasMore is false', async () => {
    mockFetchNext.mockResolvedValueOnce([]);
    const { result } = renderHook(() => useCometChatConversations());

    await waitFor(() => {
      expect(result.current.fetchState).toBe('empty');
    });
    expect(result.current.hasMore).toBe(false);

    const callCountBefore = mockFetchNext.mock.calls.length;
    await act(async () => {
      await result.current.fetchNext();
    });

    expect(mockFetchNext.mock.calls.length).toBe(callCountBefore);
  });

  it('cleans up listeners on unmount', async () => {
    const { CometChat } = await import('@cometchat/chat-sdk-javascript');

    const { unmount } = renderHook(() => useCometChatConversations());

    await waitFor(() => {
      // Wait for initial fetch
    });

    unmount();

    expect(CometChat.removeConnectionListener).toHaveBeenCalled();
    expect(CometChat.removeMessageListener).toHaveBeenCalled();
    expect(CometChat.removeGroupListener).toHaveBeenCalled();
  });

  it('connection listener triggers re-fetch when onConnected fires', async () => {
    const { CometChat } = await import('@cometchat/chat-sdk-javascript');

    renderHook(() => useCometChatConversations());

    await waitFor(() => {
      // Wait for initial fetch
    });

    const connListenerCallbacks = vi.mocked(CometChat.ConnectionListener).mock.calls[0]?.[0] as
      | { onConnected?: () => void }
      | undefined;
    expect(connListenerCallbacks?.onConnected).toBeDefined();

    const callsBefore = mockFetchNext.mock.calls.length;
    mockFetchNext.mockResolvedValue([createMockConversation('c5')]);

    act(() => {
      connListenerCallbacks?.onConnected?.();
    });

    await waitFor(() => {
      expect(mockFetchNext.mock.calls.length).toBeGreaterThan(callsBefore);
    });
  });

  // Regression: per-user receipts apply only to 1:1 (receiverType 'user');
  // groups advance only on delivered-to-all / read-by-all.
  describe('receipt sync between group and 1:1 conversations', () => {
    function createConvWithLastMessage(id: string, convType: 'user' | 'group', messageId: number) {
      const lastMessage = {
        getId: () => messageId,
        getSender: () => ({ getUid: () => 'logged-in-user', getName: () => 'me' }),
        getCategory: () => 'message',
        getType: () => 'text',
        getDeliveredAt: vi.fn(() => 0),
        getReadAt: vi.fn(() => 0),
        setDeliveredAt: vi.fn(),
        setReadAt: vi.fn(),
      };
      const conv = {
        getConversationId: () => id,
        getConversationType: () => convType,
        getConversationWith: () => ({
          getUid: () => id,
          getName: () => id,
          getStatus: () => 'online',
          getAvatar: () => null,
        }),
        getLastMessage: () => lastMessage,
        getUnreadMessageCount: () => 0,
        setUnreadMessageCount: vi.fn(),
      } as unknown as CometChat.Conversation;
      return { conv, lastMessage };
    }

    function makeReceipt(messageId: number, receiverType: 'user' | 'group') {
      return {
        getMessageId: () => String(messageId),
        getDeliveredAt: () => 555,
        getReadAt: () => 666,
        getReceiverType: () => receiverType,
        getSender: () => ({ getUid: () => 'someone-else' }),
        getReceiver: () => 'x',
      } as unknown as CometChat.MessageReceipt;
    }

    async function getMessageCallbacks() {
      const { CometChat } = await import('@cometchat/chat-sdk-javascript');
      const calls = vi.mocked(CometChat.addMessageListener).mock.calls;
      const last = calls[calls.length - 1];
      return last?.[1] as unknown as {
        onMessagesDelivered: (r: CometChat.MessageReceipt) => void;
        onMessagesDeliveredToAll: (r: CometChat.MessageReceipt) => void;
      };
    }

    it('group: drops a per-user receipt (receiverType group), honors delivered-to-all', async () => {
      const { conv, lastMessage } = createConvWithLastMessage('g1', 'group', 100);
      mockFetchNext.mockResolvedValue([conv]);

      const { result } = renderHook(() => useCometChatConversations());
      await waitFor(() => {
        expect(result.current.fetchState).toBe('loaded');
      });

      const cbs = await getMessageCallbacks();

      // A group message's per-user receipt carries receiverType 'group' — it must be
      // dropped so a single member's delivery doesn't mark the whole group delivered.
      act(() => {
        cbs.onMessagesDelivered(makeReceipt(100, 'group'));
      });
      expect(lastMessage.setDeliveredAt).not.toHaveBeenCalled();

      // The delivered-to-all broadcast is what advances a group conversation.
      act(() => {
        cbs.onMessagesDeliveredToAll(makeReceipt(100, 'group'));
      });
      expect(lastMessage.setDeliveredAt).toHaveBeenCalledWith(555);
    });

    it('1:1: honors a per-user receipt (receiverType user)', async () => {
      const { conv, lastMessage } = createConvWithLastMessage('u1', 'user', 200);
      mockFetchNext.mockResolvedValue([conv]);

      const { result } = renderHook(() => useCometChatConversations());
      await waitFor(() => {
        expect(result.current.fetchState).toBe('loaded');
      });

      const cbs = await getMessageCallbacks();

      act(() => {
        cbs.onMessagesDelivered(makeReceipt(200, 'user'));
      });
      expect(lastMessage.setDeliveredAt).toHaveBeenCalledWith(555);
    });
  });
});
