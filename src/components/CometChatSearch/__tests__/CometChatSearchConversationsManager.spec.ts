/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-unused-vars */
/**
 * Unit tests for CometChatSearchConversationsManager.
 *
 * Tests SDK call orchestration for conversation search and listener attachment.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
    // Init & Auth
    init: vi.fn().mockResolvedValue(undefined),
    login: vi.fn().mockResolvedValue({}),
    getLoggedinUser: vi.fn().mockResolvedValue(null),
    isInitialized: vi.fn().mockReturnValue(true),
    // Listeners
    addMessageListener: vi.fn(),
    removeMessageListener: vi.fn(),
    addUserListener: vi.fn(),
    removeUserListener: vi.fn(),
    addGroupListener: vi.fn(),
    removeGroupListener: vi.fn(),
    addConnectionListener: vi.fn(),
    removeConnectionListener: vi.fn(),
    // Constructors
    MessageListener: vi.fn().mockImplementation((cb: unknown) => cb),
    UserListener: vi.fn().mockImplementation((cb: unknown) => cb),
    GroupListener: vi.fn().mockImplementation((cb: unknown) => cb),
    ConversationsRequestBuilder: vi.fn(),
    // Constants
    RECEIVER_TYPE: { USER: 'user', GROUP: 'group' },
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
      FILE: 'file',
      IMAGE: 'image',
      AUDIO: 'audio',
      VIDEO: 'video',
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
    GROUP_MEMBER_SCOPE: { ADMIN: 'admin', PARTICIPANT: 'participant', MODERATOR: 'moderator' },
    GROUP_TYPE: { PRIVATE: 'private', PASSWORD: 'password', PUBLIC: 'public' },
    USER_STATUS: { ONLINE: 'online', OFFLINE: 'offline' },
    CALL_STATUS: {
      CANCELLED: 'cancelled',
      REJECTED: 'rejected',
      ONGOING: 'ongoing',
      ENDED: 'ended',
      INITIATED: 'initiated',
      UNANSWERED: 'unanswered',
      BUSY: 'busy',
    },
    CALL_TYPE: { VIDEO: 'video', AUDIO: 'audio' },
    CALL_MODE: {
      DEFAULT: 'DEFAULT',
      GRID: 'GRID',
      SINGLE: 'SINGLE',
      SPOTLIGHT: 'SPOTLIGHT',
      TILE: 'TILE',
    },
    GoalType: { ALL_OF: 'allOf', ANY_OF: 'anyOf', ANY_ACTION: 'anyAction', NONE: 'none' },
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
  },
}));

import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatSearchConversationsManager } from '../CometChatSearchConversationsManager';

// Mock the ConversationsRequestBuilder and ConversationsRequest
const mockFetchNext = vi.fn();
const mockBuild = vi.fn().mockReturnValue({ fetchNext: mockFetchNext });
const mockSetLimit = vi.fn().mockReturnThis();
const mockSetSearchKeyword = vi.fn().mockReturnThis();
const mockSetConversationType = vi.fn().mockReturnThis();
const mockSetUnread = vi.fn().mockReturnThis();

beforeEach(() => {
  vi.clearAllMocks();

  (CometChat.ConversationsRequestBuilder as unknown as ReturnType<typeof vi.fn>).mockImplementation(
    () => ({
      setLimit: mockSetLimit,
      setSearchKeyword: mockSetSearchKeyword,
      setConversationType: mockSetConversationType,
      setUnread: mockSetUnread,
      build: mockBuild,
    })
  );
});

describe('CometChatSearchConversationsManager', () => {
  describe('search', () => {
    it('builds a request and fetches results', async () => {
      const mockConversations = [
        { getConversationId: () => 'conv-1' },
        { getConversationId: () => 'conv-2' },
      ];
      mockFetchNext.mockResolvedValueOnce(mockConversations);

      const manager = new CometChatSearchConversationsManager();
      const result = await manager.search('hello', []);

      expect(CometChat.ConversationsRequestBuilder).toHaveBeenCalled();
      expect(mockFetchNext).toHaveBeenCalledOnce();
      expect(result.results).toHaveLength(2);
    });

    it('uses limit of 3 when no filters are active', async () => {
      mockFetchNext.mockResolvedValueOnce([{ getConversationId: () => 'conv-1' }]);

      const manager = new CometChatSearchConversationsManager();
      await manager.search('hello', []);

      expect(mockSetLimit).toHaveBeenCalledWith(3);
    });

    it('uses limit of 30 when filters are active', async () => {
      mockFetchNext.mockResolvedValueOnce([]);

      const manager = new CometChatSearchConversationsManager();
      await manager.search('hello', ['unread']);

      expect(mockSetLimit).toHaveBeenCalledWith(30);
    });

    it('sets hasMore to true when results length equals limit', async () => {
      const mockConversations = Array.from({ length: 3 }, (_, i) => ({
        getConversationId: () => `conv-${i}`,
      }));
      mockFetchNext.mockResolvedValueOnce(mockConversations);

      const manager = new CometChatSearchConversationsManager();
      const result = await manager.search('hello', []);

      expect(result.hasMore).toBe(true);
    });

    it('sets hasMore to false when results length is less than limit', async () => {
      mockFetchNext.mockResolvedValueOnce([{ getConversationId: () => 'conv-1' }]);

      const manager = new CometChatSearchConversationsManager();
      const result = await manager.search('hello', ['unread']);

      expect(result.hasMore).toBe(false);
    });

    it('sets search keyword on the builder', async () => {
      mockFetchNext.mockResolvedValueOnce([]);

      const manager = new CometChatSearchConversationsManager();
      await manager.search('test query', []);

      expect(mockSetSearchKeyword).toHaveBeenCalledWith('test query');
    });

    it('does not set search keyword when keyword is empty', async () => {
      mockFetchNext.mockResolvedValueOnce([]);

      const manager = new CometChatSearchConversationsManager();
      await manager.search('', ['unread']);

      expect(mockSetSearchKeyword).not.toHaveBeenCalled();
    });

    it('sets unread filter when "unread" is in filters', async () => {
      mockFetchNext.mockResolvedValueOnce([]);

      const manager = new CometChatSearchConversationsManager();
      await manager.search('', ['unread']);

      expect(mockSetUnread).toHaveBeenCalledWith(true);
    });

    it('sets conversation type to group when "groups" is in filters', async () => {
      mockFetchNext.mockResolvedValueOnce([]);

      const manager = new CometChatSearchConversationsManager();
      await manager.search('', ['groups']);

      expect(mockSetConversationType).toHaveBeenCalled();
    });
  });

  describe('loadMore', () => {
    it('fetches the next page of results', async () => {
      const firstPage = Array.from({ length: 3 }, (_, i) => ({
        getConversationId: () => `conv-${i}`,
      }));
      const secondPage = [{ getConversationId: () => 'conv-10' }];
      mockFetchNext.mockResolvedValueOnce(firstPage).mockResolvedValueOnce(secondPage);

      const manager = new CometChatSearchConversationsManager();
      await manager.search('hello', []);
      const result = await manager.loadMore();

      expect(mockFetchNext).toHaveBeenCalledTimes(2);
      expect(result.results).toHaveLength(1);
      expect(result.hasMore).toBe(false);
    });

    it('returns empty results when no search request exists', async () => {
      const manager = new CometChatSearchConversationsManager();
      const result = await manager.loadMore();

      expect(result.results).toEqual([]);
      expect(result.hasMore).toBe(false);
    });

    it('prevents concurrent loadMore calls', async () => {
      const firstPage = Array.from({ length: 3 }, (_, i) => ({
        getConversationId: () => `conv-${i}`,
      }));
      mockFetchNext
        .mockResolvedValueOnce(firstPage)
        .mockImplementationOnce(
          () =>
            new Promise(resolve =>
              setTimeout(() => resolve([{ getConversationId: () => 'conv-10' }]), 100)
            )
        );

      const manager = new CometChatSearchConversationsManager();
      await manager.search('hello', []);

      const [result1, result2] = await Promise.all([manager.loadMore(), manager.loadMore()]);

      // Second call should return empty (isLoadingMore guard)
      expect(result2.results).toEqual([]);
      expect(result2.hasMore).toBe(false);
    });
  });

  describe('reset', () => {
    it('clears the search request state', async () => {
      const mockConversations = Array.from({ length: 3 }, (_, i) => ({
        getConversationId: () => `conv-${i}`,
      }));
      mockFetchNext.mockResolvedValueOnce(mockConversations);

      const manager = new CometChatSearchConversationsManager();
      await manager.search('hello', []);
      manager.reset();

      const result = await manager.loadMore();
      expect(result.results).toEqual([]);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('attachMessageListener', () => {
    it('attaches a message listener and returns a cleanup function', () => {
      const callbacks = {
        onMessageReceived: vi.fn(),
        onMessageEdited: vi.fn(),
        onMessageDeleted: vi.fn(),
      };

      const cleanup = CometChatSearchConversationsManager.attachMessageListener(
        'test-listener',
        callbacks
      );

      expect(CometChat.addMessageListener).toHaveBeenCalledWith('test-listener', expect.anything());
      expect(typeof cleanup).toBe('function');
    });

    it('cleanup function removes the listener', () => {
      const callbacks = {
        onMessageReceived: vi.fn(),
        onMessageEdited: vi.fn(),
        onMessageDeleted: vi.fn(),
      };

      const cleanup = CometChatSearchConversationsManager.attachMessageListener(
        'test-listener',
        callbacks
      );
      cleanup();

      expect(CometChat.removeMessageListener).toHaveBeenCalledWith('test-listener');
    });
  });

  describe('attachUserListener', () => {
    it('attaches a user listener and returns a cleanup function', () => {
      const callbacks = {
        onUserOnline: vi.fn(),
        onUserOffline: vi.fn(),
      };

      const cleanup = CometChatSearchConversationsManager.attachUserListener(
        'test-user-listener',
        callbacks
      );

      expect(CometChat.addUserListener).toHaveBeenCalledWith(
        'test-user-listener',
        expect.anything()
      );
      expect(typeof cleanup).toBe('function');
    });

    it('cleanup function removes the user listener', () => {
      const callbacks = {
        onUserOnline: vi.fn(),
        onUserOffline: vi.fn(),
      };

      const cleanup = CometChatSearchConversationsManager.attachUserListener(
        'test-user-listener',
        callbacks
      );
      cleanup();

      expect(CometChat.removeUserListener).toHaveBeenCalledWith('test-user-listener');
    });
  });

  describe('attachGroupListener', () => {
    it('attaches a group listener and returns a cleanup function', () => {
      const callbacks = {
        onGroupMemberJoined: vi.fn(),
        onGroupMemberLeft: vi.fn(),
        onGroupMemberKicked: vi.fn(),
        onGroupMemberBanned: vi.fn(),
        onMemberAddedToGroup: vi.fn(),
        onGroupMemberScopeChanged: vi.fn(),
      };

      const cleanup = CometChatSearchConversationsManager.attachGroupListener(
        'test-group-listener',
        callbacks
      );

      expect(CometChat.addGroupListener).toHaveBeenCalledWith(
        'test-group-listener',
        expect.anything()
      );
      expect(typeof cleanup).toBe('function');
    });

    it('cleanup function removes the group listener', () => {
      const callbacks = {
        onGroupMemberJoined: vi.fn(),
        onGroupMemberLeft: vi.fn(),
        onGroupMemberKicked: vi.fn(),
        onGroupMemberBanned: vi.fn(),
        onMemberAddedToGroup: vi.fn(),
        onGroupMemberScopeChanged: vi.fn(),
      };

      const cleanup = CometChatSearchConversationsManager.attachGroupListener(
        'test-group-listener',
        callbacks
      );
      cleanup();

      expect(CometChat.removeGroupListener).toHaveBeenCalledWith('test-group-listener');
    });
  });

  describe('attachTypingListener', () => {
    it('attaches a typing listener and returns a cleanup function', () => {
      const callbacks = {
        onTypingStarted: vi.fn(),
        onTypingEnded: vi.fn(),
      };

      const cleanup = CometChatSearchConversationsManager.attachTypingListener(
        'test-typing-listener',
        callbacks
      );

      expect(CometChat.addMessageListener).toHaveBeenCalledWith(
        'test-typing-listener',
        expect.anything()
      );
      expect(typeof cleanup).toBe('function');
    });

    it('cleanup function removes the typing listener', () => {
      const callbacks = {
        onTypingStarted: vi.fn(),
        onTypingEnded: vi.fn(),
      };

      const cleanup = CometChatSearchConversationsManager.attachTypingListener(
        'test-typing-listener',
        callbacks
      );
      cleanup();

      expect(CometChat.removeMessageListener).toHaveBeenCalledWith('test-typing-listener');
    });
  });
});
