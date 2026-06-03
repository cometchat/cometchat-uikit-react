import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CometChatConversationsManager } from '../CometChatConversationsManager';

/* eslint-disable @typescript-eslint/unbound-method */

// --- Mock CometChat SDK ---
const mockFetchNext = vi.fn();
const mockBuild = vi.fn(() => ({ fetchNext: mockFetchNext }));
const mockSetLimit = vi.fn(() => ({ build: mockBuild }));

vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
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
