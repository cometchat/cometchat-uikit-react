import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CometChatConversationsManager } from '../CometChatConversationsManager';

/* eslint-disable @typescript-eslint/unbound-method */

// --- Mock CometChat SDK ---
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
    markAsRead: vi.fn(),
  },
}));

describe('CometChatConversationsManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('creates request with default limit 30 when no builder provided', async () => {
      const { CometChat } = await import('@cometchat/chat-sdk-javascript');
      new CometChatConversationsManager();
      expect(CometChat.ConversationsRequestBuilder).toHaveBeenCalled();
    });

    it('uses provided builder', () => {
      const mockBuilder = { build: vi.fn(() => ({ fetchNext: mockFetchNext })) };
      new CometChatConversationsManager(
        mockBuilder as unknown as CometChat.ConversationsRequestBuilder
      );
      expect(mockBuilder.build).toHaveBeenCalled();
    });
  });

  describe('fetchNext', () => {
    it('returns conversations from SDK', async () => {
      const mockConversations = [
        { getConversationId: () => 'c1' },
        { getConversationId: () => 'c2' },
      ];
      mockFetchNext.mockResolvedValueOnce(mockConversations);

      const manager = new CometChatConversationsManager();
      const result = await manager.fetchNext();
      expect(result).toEqual(mockConversations);
    });

    it('returns empty array when exhausted', async () => {
      mockFetchNext.mockResolvedValueOnce([]);

      const manager = new CometChatConversationsManager();
      const result = await manager.fetchNext();
      expect(result).toEqual([]);
    });
  });

  describe('deleteConversation', () => {
    it('calls SDK deleteConversation with correct params', async () => {
      const { CometChat } = await import('@cometchat/chat-sdk-javascript');
      vi.mocked(CometChat.deleteConversation).mockResolvedValueOnce('success');

      const result = await CometChatConversationsManager.deleteConversation('user1', 'user');
      expect(CometChat.deleteConversation).toHaveBeenCalledWith('user1', 'user');
      expect(result).toBe('success');
    });
  });

  describe('markAsRead', () => {
    it('calls SDK markAsRead', async () => {
      const { CometChat } = await import('@cometchat/chat-sdk-javascript');
      vi.mocked(CometChat.markAsRead).mockResolvedValueOnce(undefined);

      const mockMessage = { getId: () => 1 } as unknown as CometChat.BaseMessage;
      await CometChatConversationsManager.markAsRead(mockMessage);
      expect(CometChat.markAsRead).toHaveBeenCalledWith(mockMessage);
    });
  });

  describe('attachMessageListener', () => {
    it('returns cleanup function', async () => {
      const { CometChat } = await import('@cometchat/chat-sdk-javascript');
      const callbacks = {
        onTextMessageReceived: vi.fn(),
        onMediaMessageReceived: vi.fn(),
        onCustomMessageReceived: vi.fn(),
      };
      const cleanup = CometChatConversationsManager.attachMessageListener('test-id', callbacks);

      expect(CometChat.addMessageListener).toHaveBeenCalledWith('test-id', expect.anything());
      expect(typeof cleanup).toBe('function');
    });

    it('cleanup removes the listener', async () => {
      const { CometChat } = await import('@cometchat/chat-sdk-javascript');
      const callbacks = { onTextMessageReceived: vi.fn() };
      const cleanup = CometChatConversationsManager.attachMessageListener('test-id', callbacks);

      cleanup();
      expect(CometChat.removeMessageListener).toHaveBeenCalledWith('test-id');
    });
  });

  describe('attachUserStatusListener', () => {
    it('returns cleanup function', async () => {
      const { CometChat } = await import('@cometchat/chat-sdk-javascript');
      const callbacks = { onUserOnline: vi.fn(), onUserOffline: vi.fn() };
      const cleanup = CometChatConversationsManager.attachUserStatusListener('user-id', callbacks);

      expect(CometChat.addUserListener).toHaveBeenCalledWith('user-id', expect.anything());
      expect(typeof cleanup).toBe('function');
    });

    it('cleanup removes the listener', async () => {
      const { CometChat } = await import('@cometchat/chat-sdk-javascript');
      const callbacks = { onUserOnline: vi.fn(), onUserOffline: vi.fn() };
      const cleanup = CometChatConversationsManager.attachUserStatusListener('user-id', callbacks);

      cleanup();
      expect(CometChat.removeUserListener).toHaveBeenCalledWith('user-id');
    });
  });

  describe('attachGroupListener', () => {
    it('returns cleanup function', async () => {
      const { CometChat } = await import('@cometchat/chat-sdk-javascript');
      const callbacks = { onGroupMemberLeft: vi.fn() };
      const cleanup = CometChatConversationsManager.attachGroupListener('group-id', callbacks);

      expect(CometChat.addGroupListener).toHaveBeenCalledWith('group-id', expect.anything());
      expect(typeof cleanup).toBe('function');
    });

    it('cleanup removes the listener', async () => {
      const { CometChat } = await import('@cometchat/chat-sdk-javascript');
      const callbacks = { onGroupMemberLeft: vi.fn() };
      const cleanup = CometChatConversationsManager.attachGroupListener('group-id', callbacks);

      cleanup();
      expect(CometChat.removeGroupListener).toHaveBeenCalledWith('group-id');
    });
  });

  describe('attachConnectionListener', () => {
    it('returns cleanup function', async () => {
      const { CometChat } = await import('@cometchat/chat-sdk-javascript');
      const callbacks = { onConnected: vi.fn() };
      const cleanup = CometChatConversationsManager.attachConnectionListener('conn-id', callbacks);

      expect(CometChat.addConnectionListener).toHaveBeenCalledWith('conn-id', expect.anything());
      expect(typeof cleanup).toBe('function');
    });

    it('cleanup removes the listener', async () => {
      const { CometChat } = await import('@cometchat/chat-sdk-javascript');
      const callbacks = { onConnected: vi.fn() };
      const cleanup = CometChatConversationsManager.attachConnectionListener('conn-id', callbacks);

      cleanup();
      expect(CometChat.removeConnectionListener).toHaveBeenCalledWith('conn-id');
    });
  });
});
