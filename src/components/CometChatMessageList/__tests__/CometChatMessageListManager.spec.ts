import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildUser, buildGroup } from '../../../testing/mock-builders';

// Hoist mocks for vi.mock factory
const {
  mockFetchPrevious,
  mockFetchNext,
  mockSendMessage,
  mockSendMediaMessage,
  mockEditMessage,
  mockDeleteMessage,
  mockMarkAsRead,
  mockMarkConversationAsRead,
  mockMarkAsDelivered,
  mockGetConversation,
  mockMarkMessageAsUnread,
  mockBuild,
} = vi.hoisted(() => ({
  mockFetchPrevious: vi.fn().mockResolvedValue([]),
  mockFetchNext: vi.fn().mockResolvedValue([]),
  mockSendMessage: vi.fn().mockResolvedValue({}),
  mockSendMediaMessage: vi.fn().mockResolvedValue({}),
  mockEditMessage: vi.fn().mockResolvedValue({}),
  mockDeleteMessage: vi.fn().mockResolvedValue({}),
  mockMarkAsRead: vi.fn().mockResolvedValue(undefined),
  mockMarkConversationAsRead: vi.fn().mockResolvedValue(undefined),
  mockMarkAsDelivered: vi.fn().mockResolvedValue(undefined),
  mockGetConversation: vi.fn().mockResolvedValue({}),
  mockMarkMessageAsUnread: vi.fn().mockResolvedValue({}),
  mockBuild: vi.fn(),
}));

vi.mock('@cometchat/chat-sdk-javascript', () => {
  const builderInstance = {
    setLimit: vi.fn().mockReturnThis(),
    setUID: vi.fn().mockReturnThis(),
    setGUID: vi.fn().mockReturnThis(),
    setParentMessageId: vi.fn().mockReturnThis(),
    setTypes: vi.fn().mockReturnThis(),
    setCategories: vi.fn().mockReturnThis(),
    setMessageId: vi.fn().mockReturnThis(),
    hideReplies: vi.fn().mockReturnThis(),
    build: mockBuild.mockReturnValue({
      fetchPrevious: mockFetchPrevious,
      fetchNext: mockFetchNext,
    }),
  };

  return {
    CometChat: {
      RECEIVER_TYPE: { USER: 'user', GROUP: 'group' },
      MessagesRequestBuilder: vi.fn().mockImplementation(() => builderInstance),
      TextMessage: vi.fn().mockImplementation(() => ({
        setParentMessageId: vi.fn(),
      })),
      MediaMessage: vi.fn().mockImplementation(() => ({
        setParentMessageId: vi.fn(),
      })),
      sendMessage: mockSendMessage,
      sendMediaMessage: mockSendMediaMessage,
      editMessage: mockEditMessage,
      deleteMessage: mockDeleteMessage,
      markAsRead: mockMarkAsRead,
      markConversationAsRead: mockMarkConversationAsRead,
      markAsDelivered: mockMarkAsDelivered,
      getConversation: mockGetConversation,
      markMessageAsUnread: mockMarkMessageAsUnread,
    },
  };
});

import { CometChatMessageListManager } from '../CometChatMessageListManager';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('CometChatMessageListManager', () => {
  const user = buildUser({ uid: 'user-1' });
  const group = buildGroup({ guid: 'group-1' });

  it('creates with user', () => {
    const manager = new CometChatMessageListManager({ user: user as never });
    expect(manager.getReceiverId()).toBe('user-1');
    expect(manager.getReceiverType()).toBe('user');
  });

  it('creates with group', () => {
    const manager = new CometChatMessageListManager({ group: group as never });
    expect(manager.getReceiverId()).toBe('group-1');
    expect(manager.getReceiverType()).toBe('group');
  });

  it('fetchPrevious calls SDK', async () => {
    const manager = new CometChatMessageListManager({ user: user as never });
    await manager.fetchPrevious();
    expect(mockFetchPrevious).toHaveBeenCalled();
  });

  it('fetchNext returns empty when no next request', async () => {
    const manager = new CometChatMessageListManager({ user: user as never });
    const result = await manager.fetchNext();
    expect(result).toEqual([]);
  });

  it('fetchNext works after initNextRequest', async () => {
    const manager = new CometChatMessageListManager({ user: user as never });
    manager.initNextRequest(100);
    await manager.fetchNext();
    expect(mockFetchNext).toHaveBeenCalled();
  });

  it('fetchAroundMessageId fetches and initializes next request', async () => {
    const manager = new CometChatMessageListManager({ user: user as never });
    await manager.fetchAroundMessageId(50);
    expect(mockFetchPrevious).toHaveBeenCalled();
    // After fetchAround, fetchNext should work
    await manager.fetchNext();
    expect(mockFetchNext).toHaveBeenCalled();
  });

  it('sendTextMessage calls SDK', async () => {
    const manager = new CometChatMessageListManager({ user: user as never });
    await manager.sendTextMessage('hello');
    expect(mockSendMessage).toHaveBeenCalled();
  });

  it('sendMediaMessage calls SDK', async () => {
    const manager = new CometChatMessageListManager({ user: user as never });
    const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
    await manager.sendMediaMessage(file, 'image');
    expect(mockSendMediaMessage).toHaveBeenCalled();
  });

  it('editMessage calls SDK', async () => {
    const manager = new CometChatMessageListManager({ user: user as never });
    await manager.editMessage({} as never);
    expect(mockEditMessage).toHaveBeenCalled();
  });

  it('deleteMessage calls SDK', async () => {
    const manager = new CometChatMessageListManager({ user: user as never });
    await manager.deleteMessage(123);
    expect(mockDeleteMessage).toHaveBeenCalled();
  });

  it('markAsRead calls SDK', async () => {
    const manager = new CometChatMessageListManager({ user: user as never });
    await manager.markAsRead({} as never);
    expect(mockMarkAsRead).toHaveBeenCalled();
  });

  it('markConversationAsRead calls SDK with correct params', async () => {
    const manager = new CometChatMessageListManager({ user: user as never });
    await manager.markConversationAsRead();
    expect(mockMarkConversationAsRead).toHaveBeenCalledWith('user-1', 'user');
  });

  it('markAsDelivered calls SDK', async () => {
    const manager = new CometChatMessageListManager({ user: user as never });
    await manager.markAsDelivered({} as never);
    expect(mockMarkAsDelivered).toHaveBeenCalled();
  });

  it('getConversation calls SDK', async () => {
    const manager = new CometChatMessageListManager({ user: user as never });
    await manager.getConversation();
    expect(mockGetConversation).toHaveBeenCalledWith('user-1', 'user');
  });

  it('markMessageAsUnread calls SDK and returns conversation', async () => {
    const manager = new CometChatMessageListManager({ user: user as never });
    await manager.markMessageAsUnread({} as never);
    expect(mockMarkMessageAsUnread).toHaveBeenCalled();
  });

  it('sendTextMessage passes parentMessageId when provided', async () => {
    const { CometChat } = await import('@cometchat/chat-sdk-javascript');
    const manager = new CometChatMessageListManager({ user: user as never });
    await manager.sendTextMessage('hello', 42);
    // TextMessage constructor was called
    expect(CometChat.TextMessage).toHaveBeenCalled();
    // The instance should have setParentMessageId called
    const instance = (CometChat.TextMessage as unknown as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value;
    expect(instance.setParentMessageId).toHaveBeenCalledWith(42);
  });

  it('sendMediaMessage passes parentMessageId when provided', async () => {
    const { CometChat } = await import('@cometchat/chat-sdk-javascript');
    const manager = new CometChatMessageListManager({ user: user as never });
    const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
    await manager.sendMediaMessage(file, 'image', 42);
    const instance = (CometChat.MediaMessage as unknown as ReturnType<typeof vi.fn>).mock.results[0]
      ?.value;
    expect(instance.setParentMessageId).toHaveBeenCalledWith(42);
  });

  it('errors propagate (not caught)', async () => {
    mockFetchPrevious.mockRejectedValueOnce(new Error('SDK error'));
    const manager = new CometChatMessageListManager({ user: user as never });
    await expect(manager.fetchPrevious()).rejects.toThrow('SDK error');
  });
});
