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
    ConversationsRequestBuilder: vi.fn(() => ({
      setLimit: mockSetLimit,
      build: mockBuild,
    })),
    CometChatHelper: {
      getConversationFromMessage: vi.fn().mockResolvedValue({}),
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
    getLastMessage: () => ({
      getId: () => Number(id.replace(/\D/g, '') || '1'),
      getType: () => 'text',
      getCategory: () => 'message',
      getText: () => 'Hello',
      getSentAt: () => 1000,
      getSender: () => ({ getUid: () => 'logged-in-user', getName: () => 'Me' }),
      getReadAt: () => 0,
      getDeliveredAt: () => 0,
      getDeletedAt: () => null,
      setReadAt: vi.fn(),
      setDeliveredAt: vi.fn(),
    }),
    getUnreadMessageCount: () => unreadCount,
    setUnreadMessageCount: vi.fn(),
  } as unknown as CometChat.Conversation;
}

describe('useCometChatConversations — Extended', () => {
  beforeEach(() => {
    mockFetchNext.mockReset();
    mockFetchNext.mockResolvedValue([createMockConversation('c1'), createMockConversation('c2')]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('deleteConversation', () => {
    it('calls SDK deleteConversation and removes conversation from list', async () => {
      const { CometChat } = await import('@cometchat/chat-sdk-javascript');
      vi.mocked(CometChat.deleteConversation).mockResolvedValue('success');

      const { result } = renderHook(() => useCometChatConversations());

      await waitFor(() => {
        expect(result.current.fetchState).toBe('loaded');
      });
      expect(result.current.conversations).toHaveLength(2);

      await act(async () => {
        await result.current.deleteConversation('c1');
      });

      expect(CometChat.deleteConversation).toHaveBeenCalled();
      expect(
        result.current.conversations.find(c => c.getConversationId() === 'c1')
      ).toBeUndefined();
    });

    it('calls onError when SDK deleteConversation fails', async () => {
      const { CometChat } = await import('@cometchat/chat-sdk-javascript');
      vi.mocked(CometChat.deleteConversation).mockRejectedValue(new Error('Delete failed'));

      const onError = vi.fn();
      const { result } = renderHook(() => useCometChatConversations({ onError }));

      await waitFor(() => {
        expect(result.current.fetchState).toBe('loaded');
      });

      await act(async () => {
        await result.current.deleteConversation('c1');
      });

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });

    it('is a no-op when conversation ID does not exist', async () => {
      const { CometChat } = await import('@cometchat/chat-sdk-javascript');

      const { result } = renderHook(() => useCometChatConversations());

      await waitFor(() => {
        expect(result.current.fetchState).toBe('loaded');
      });

      await act(async () => {
        await result.current.deleteConversation('non-existent');
      });

      expect(CometChat.deleteConversation).not.toHaveBeenCalled();
      expect(result.current.conversations).toHaveLength(2);
    });
  });

  describe('setConversationToBeDeleted', () => {
    it('sets the conversation to be deleted', async () => {
      const { result } = renderHook(() => useCometChatConversations());

      await waitFor(() => {
        expect(result.current.fetchState).toBe('loaded');
      });

      const conv = createMockConversation('c1');
      act(() => {
        result.current.setConversationToBeDeleted(conv);
      });

      expect(result.current.conversationToBeDeleted).toBe(conv);
    });

    it('clears the conversation to be deleted when set to null', async () => {
      const { result } = renderHook(() => useCometChatConversations());

      await waitFor(() => {
        expect(result.current.fetchState).toBe('loaded');
      });

      const conv = createMockConversation('c1');
      act(() => {
        result.current.setConversationToBeDeleted(conv);
      });
      expect(result.current.conversationToBeDeleted).toBe(conv);

      act(() => {
        result.current.setConversationToBeDeleted(null);
      });
      expect(result.current.conversationToBeDeleted).toBeNull();
    });
  });

  describe('Group listener — onGroupMemberJoined', () => {
    it('adds conversation when logged-in user joins a group', async () => {
      const { CometChat } = await import('@cometchat/chat-sdk-javascript');

      const newGroupConv = {
        getConversationId: () => 'group_g1',
        getConversationType: () => 'group',
        getConversationWith: () => ({
          getGuid: () => 'g1',
          getName: () => 'New Group',
          getIcon: () => null,
        }),
        getLastMessage: () => null,
        getUnreadMessageCount: () => 0,
      } as unknown as CometChat.Conversation;

      vi.mocked(CometChat.getConversation).mockResolvedValue(newGroupConv);

      const { result } = renderHook(() => useCometChatConversations());

      await waitFor(() => {
        expect(result.current.fetchState).toBe('loaded');
      });

      // Wait for loggedInUserId to be set (triggers group listener re-attach)
      await waitFor(() => {
        expect(result.current.loggedInUserId).toBe('logged-in-user');
      });

      // Get the LATEST GroupListener callbacks (re-attached after loggedInUserId is set)
      const groupListenerCalls = vi.mocked(CometChat.GroupListener).mock.calls;
      expect(groupListenerCalls.length).toBeGreaterThan(0);

      // Use the last call (most recent listener attachment with loggedInUserId set)
      const lastGroupCallbacks = groupListenerCalls[groupListenerCalls.length - 1]![0] as {
        onGroupMemberJoined?: (
          message: unknown,
          joinedUser: { getUid: () => string },
          joinedGroup: { getGuid: () => string }
        ) => void;
      };

      // Simulate the logged-in user joining a group
      act(() => {
        lastGroupCallbacks.onGroupMemberJoined?.(
          {},
          { getUid: () => 'logged-in-user' },
          { getGuid: () => 'g1' }
        );
      });

      await waitFor(() => {
        const ids = result.current.conversations.map(c => c.getConversationId());
        expect(ids).toContain('group_g1');
      });
    });

    it('does NOT add conversation when another user joins a group', async () => {
      const { CometChat } = await import('@cometchat/chat-sdk-javascript');
      // Ensure getConversationFromMessage returns a promise (may have been reset by restoreAllMocks)
      vi.mocked(CometChat.CometChatHelper.getConversationFromMessage).mockResolvedValue(
        createMockConversation(
          'group_g1'
        ) as unknown as import('@cometchat/chat-sdk-javascript').CometChat.Conversation
      );

      const { result } = renderHook(() => useCometChatConversations());

      await waitFor(() => {
        expect(result.current.fetchState).toBe('loaded');
      });

      await waitFor(() => {
        expect(result.current.loggedInUserId).toBe('logged-in-user');
      });

      // Use the last call (most recent listener attachment with loggedInUserId set)
      const groupListenerCalls = vi.mocked(CometChat.GroupListener).mock.calls;
      const lastGroupCallbacks = groupListenerCalls[groupListenerCalls.length - 1]![0] as {
        onGroupMemberJoined?: (
          message: unknown,
          joinedUser: { getUid: () => string },
          joinedGroup: { getGuid: () => string }
        ) => void;
      };

      act(() => {
        lastGroupCallbacks.onGroupMemberJoined?.(
          {},
          { getUid: () => 'some-other-user' },
          { getGuid: () => 'g1' }
        );
      });

      // Should NOT call getConversation for other users
      expect(CometChat.getConversation).not.toHaveBeenCalled();
      expect(result.current.conversations).toHaveLength(2);
    });
  });

  describe('Receipt handler — onMessagesDelivered', () => {
    it('updates deliveredAt on last message when receipt matches', async () => {
      const { CometChat } = await import('@cometchat/chat-sdk-javascript');

      const setDeliveredAtSpy = vi.fn();
      const setReadAtSpy = vi.fn();

      // Create conversations with last messages that have IDs
      const convWithMsg = {
        getConversationId: () => 'c1',
        getConversationType: () => 'user',
        getConversationWith: () => ({
          getUid: () => 'c1',
          getName: () => 'User c1',
          getStatus: () => 'online',
          getAvatar: () => null,
        }),
        getLastMessage: () => ({
          getId: () => 101,
          getType: () => 'text',
          getCategory: () => 'message',
          getText: () => 'Hello',
          getSentAt: () => 1000,
          getSender: () => ({ getUid: () => 'logged-in-user', getName: () => 'Me' }),
          getReadAt: () => 0,
          getDeliveredAt: () => 0,
          getDeletedAt: () => null,
          setReadAt: setReadAtSpy,
          setDeliveredAt: setDeliveredAtSpy,
        }),
        getUnreadMessageCount: () => 0,
        setUnreadMessageCount: vi.fn(),
      } as unknown as CometChat.Conversation;

      mockFetchNext.mockResolvedValue([convWithMsg]);

      const { result } = renderHook(() => useCometChatConversations());

      await waitFor(() => {
        expect(result.current.fetchState).toBe('loaded');
      });

      // Wait for loggedInUserId to be set (message listener re-attaches)
      await waitFor(() => {
        expect(result.current.loggedInUserId).toBe('logged-in-user');
      });

      // Get the LATEST MessageListener callbacks (after loggedInUserId is set)
      const msgListenerCalls = vi.mocked(CometChat.MessageListener).mock.calls;
      expect(msgListenerCalls.length).toBeGreaterThan(0);

      const lastMsgCallbacks = msgListenerCalls[msgListenerCalls.length - 1]![0] as {
        onMessagesDelivered?: (receipt: {
          getMessageId: () => string;
          getDeliveredAt: () => number;
          getReadAt: () => number;
        }) => void;
      };

      // Simulate delivery receipt
      act(() => {
        lastMsgCallbacks.onMessagesDelivered?.({
          getMessageId: () => '101',
          getDeliveredAt: () => 2000,
          getReadAt: () => 0,
        });
      });

      // The conversation should be updated (dispatch UPDATE_CONVERSATION triggers re-render)
      await waitFor(() => {
        expect(setDeliveredAtSpy).toHaveBeenCalledWith(2000);
      });
    });
  });

  describe('Receipt handler — onMessagesRead', () => {
    it('updates readAt on last message when receipt matches', async () => {
      const { CometChat } = await import('@cometchat/chat-sdk-javascript');

      const setReadAtSpy = vi.fn();
      const setDeliveredAtSpy = vi.fn();
      const setUnreadCountSpy = vi.fn();

      const convWithMsg = {
        getConversationId: () => 'c1',
        getConversationType: () => 'user',
        getConversationWith: () => ({
          getUid: () => 'c1',
          getName: () => 'User c1',
          getStatus: () => 'online',
          getAvatar: () => null,
        }),
        getLastMessage: () => ({
          getId: () => 202,
          getType: () => 'text',
          getCategory: () => 'message',
          getText: () => 'Hi',
          getSentAt: () => 1000,
          getSender: () => ({ getUid: () => 'logged-in-user', getName: () => 'Me' }),
          getReadAt: () => 0,
          getDeliveredAt: () => 0,
          getDeletedAt: () => null,
          setReadAt: setReadAtSpy,
          setDeliveredAt: setDeliveredAtSpy,
        }),
        getUnreadMessageCount: () => 3,
        setUnreadMessageCount: setUnreadCountSpy,
      } as unknown as CometChat.Conversation;

      mockFetchNext.mockResolvedValue([convWithMsg]);

      const { result } = renderHook(() => useCometChatConversations());

      await waitFor(() => {
        expect(result.current.fetchState).toBe('loaded');
      });

      // Wait for loggedInUserId to be set (message listener re-attaches)
      await waitFor(() => {
        expect(result.current.loggedInUserId).toBe('logged-in-user');
      });

      // Get the LATEST MessageListener callbacks
      const msgListenerCalls = vi.mocked(CometChat.MessageListener).mock.calls;
      const lastMsgCallbacks = msgListenerCalls[msgListenerCalls.length - 1]![0] as {
        onMessagesRead?: (receipt: {
          getMessageId: () => string;
          getReadAt: () => number;
          getDeliveredAt: () => number;
        }) => void;
      };

      // Simulate read receipt
      act(() => {
        lastMsgCallbacks.onMessagesRead?.({
          getMessageId: () => '202',
          getReadAt: () => 3000,
          getDeliveredAt: () => 2000,
        });
      });

      // The conversation should be updated with readAt set and unread count cleared
      await waitFor(() => {
        expect(setReadAtSpy).toHaveBeenCalledWith(3000);
      });

      // Unread count should be set to 0
      expect(setUnreadCountSpy).toHaveBeenCalledWith(0);
    });
  });
});
