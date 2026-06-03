import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CometChatUsersManager } from '../CometChatUsersManager';

/* eslint-disable @typescript-eslint/unbound-method */

// --- Mock CometChat SDK ---
const mockFetchNext = vi.fn();
const mockBuild = vi.fn(() => ({ fetchNext: mockFetchNext }));
const mockSetLimit = vi.fn(() => ({ build: mockBuild }));

vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
    UsersRequestBuilder: vi.fn(() => ({
      setLimit: mockSetLimit,
      build: mockBuild,
    })),
    UserListener: vi.fn((callbacks: Record<string, unknown>) => callbacks),
    ConnectionListener: vi.fn((callbacks: Record<string, unknown>) => callbacks),
    addUserListener: vi.fn(),
    removeUserListener: vi.fn(),
    addConnectionListener: vi.fn(),
    removeConnectionListener: vi.fn(),
  },
}));

describe('CometChatUsersManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('creates request with default limit 30 when no builder provided', async () => {
      const { CometChat } = await import('@cometchat/chat-sdk-javascript');
      new CometChatUsersManager();
      expect(CometChat.UsersRequestBuilder).toHaveBeenCalled();
    });

    it('uses provided builder', () => {
      const mockBuilder = { build: vi.fn(() => ({ fetchNext: mockFetchNext })) };
      new CometChatUsersManager(mockBuilder as unknown as CometChat.UsersRequestBuilder);
      expect(mockBuilder.build).toHaveBeenCalled();
    });
  });

  describe('fetchNext', () => {
    it('returns users from SDK', async () => {
      const mockUsers = [{ getUid: () => 'u1' }, { getUid: () => 'u2' }];
      mockFetchNext.mockResolvedValueOnce(mockUsers);

      const manager = new CometChatUsersManager();
      const result = await manager.fetchNext();
      expect(result).toEqual(mockUsers);
    });

    it('returns empty array when exhausted', async () => {
      mockFetchNext.mockResolvedValueOnce([]);

      const manager = new CometChatUsersManager();
      const result = await manager.fetchNext();
      expect(result).toEqual([]);
    });
  });

  describe('attachUserStatusListener', () => {
    it('returns cleanup function', async () => {
      const { CometChat } = await import('@cometchat/chat-sdk-javascript');
      const callbacks = { onUserOnline: vi.fn(), onUserOffline: vi.fn() };
      const cleanup = CometChatUsersManager.attachUserStatusListener('test-id', callbacks);

      expect(CometChat.addUserListener).toHaveBeenCalledWith('test-id', expect.anything());
      expect(typeof cleanup).toBe('function');
    });

    it('cleanup removes the listener', async () => {
      const { CometChat } = await import('@cometchat/chat-sdk-javascript');
      const callbacks = { onUserOnline: vi.fn(), onUserOffline: vi.fn() };
      const cleanup = CometChatUsersManager.attachUserStatusListener('test-id', callbacks);

      cleanup();
      expect(CometChat.removeUserListener).toHaveBeenCalledWith('test-id');
    });
  });

  describe('attachConnectionListener', () => {
    it('returns cleanup function', async () => {
      const { CometChat } = await import('@cometchat/chat-sdk-javascript');
      const callbacks = { onConnected: vi.fn() };
      const cleanup = CometChatUsersManager.attachConnectionListener('conn-id', callbacks);

      expect(CometChat.addConnectionListener).toHaveBeenCalledWith('conn-id', expect.anything());
      expect(typeof cleanup).toBe('function');
    });

    it('cleanup removes the listener', async () => {
      const { CometChat } = await import('@cometchat/chat-sdk-javascript');
      const callbacks = { onConnected: vi.fn() };
      const cleanup = CometChatUsersManager.attachConnectionListener('conn-id', callbacks);

      cleanup();
      expect(CometChat.removeConnectionListener).toHaveBeenCalledWith('conn-id');
    });
  });
});
