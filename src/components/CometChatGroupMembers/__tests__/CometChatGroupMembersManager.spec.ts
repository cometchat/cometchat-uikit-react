import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CometChatGroupMembersManager } from '../CometChatGroupMembersManager';

/* eslint-disable @typescript-eslint/unbound-method */

// --- Mock CometChat SDK ---
const mockFetchNext = vi.fn();
const mockBuild = vi.fn(() => ({ fetchNext: mockFetchNext }));
const mockSetLimit = vi.fn(() => ({ build: mockBuild }));

vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
    GroupMembersRequestBuilder: vi.fn(() => ({
      setLimit: mockSetLimit,
      build: mockBuild,
    })),
    GroupListener: vi.fn((callbacks: Record<string, unknown>) => callbacks),
    UserListener: vi.fn((callbacks: Record<string, unknown>) => callbacks),
    ConnectionListener: vi.fn((callbacks: Record<string, unknown>) => callbacks),
    addGroupListener: vi.fn(),
    removeGroupListener: vi.fn(),
    addUserListener: vi.fn(),
    removeUserListener: vi.fn(),
    addConnectionListener: vi.fn(),
    removeConnectionListener: vi.fn(),
    kickGroupMember: vi.fn(),
    banGroupMember: vi.fn(),
    unbanGroupMember: vi.fn(),
    updateGroupMemberScope: vi.fn(),
  },
}));

describe('CometChatGroupMembersManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('creates request with default limit 30 when no builder provided', async () => {
      const { CometChat } = await import('@cometchat/chat-sdk-javascript');
      new CometChatGroupMembersManager('group-1');
      expect(CometChat.GroupMembersRequestBuilder).toHaveBeenCalledWith('group-1');
    });

    it('uses provided builder', () => {
      const mockBuilder = { build: vi.fn(() => ({ fetchNext: mockFetchNext })) };
      new CometChatGroupMembersManager(
        'group-1',
        mockBuilder as unknown as CometChat.GroupMembersRequestBuilder
      );
      expect(mockBuilder.build).toHaveBeenCalled();
    });
  });

  describe('fetchNext', () => {
    it('returns group members from SDK', async () => {
      const mockMembers = [{ getUid: () => 'u1' }, { getUid: () => 'u2' }];
      mockFetchNext.mockResolvedValueOnce(mockMembers);

      const manager = new CometChatGroupMembersManager('group-1');
      const result = await manager.fetchNext();
      expect(result).toEqual(mockMembers);
    });

    it('returns empty array when exhausted', async () => {
      mockFetchNext.mockResolvedValueOnce([]);

      const manager = new CometChatGroupMembersManager('group-1');
      const result = await manager.fetchNext();
      expect(result).toEqual([]);
    });
  });

  describe('kickMember', () => {
    it('calls CometChat.kickGroupMember with correct params', async () => {
      const { CometChat } = await import('@cometchat/chat-sdk-javascript');
      vi.mocked(CometChat.kickGroupMember).mockResolvedValueOnce({} as never);

      const result = await CometChatGroupMembersManager.kickMember('group-1', 'user-1');
      expect(CometChat.kickGroupMember).toHaveBeenCalledWith('group-1', 'user-1');
      expect(result).toBe(true);
    });

    it('throws on SDK error', async () => {
      const { CometChat } = await import('@cometchat/chat-sdk-javascript');
      vi.mocked(CometChat.kickGroupMember).mockRejectedValueOnce(new Error('Permission denied'));

      await expect(CometChatGroupMembersManager.kickMember('group-1', 'user-1')).rejects.toThrow(
        'Permission denied'
      );
    });
  });

  describe('banMember', () => {
    it('calls CometChat.banGroupMember with correct params', async () => {
      const { CometChat } = await import('@cometchat/chat-sdk-javascript');
      vi.mocked(CometChat.banGroupMember).mockResolvedValueOnce({} as never);

      const result = await CometChatGroupMembersManager.banMember('group-1', 'user-1');
      expect(CometChat.banGroupMember).toHaveBeenCalledWith('group-1', 'user-1');
      expect(result).toBe(true);
    });

    it('throws on SDK error', async () => {
      const { CometChat } = await import('@cometchat/chat-sdk-javascript');
      vi.mocked(CometChat.banGroupMember).mockRejectedValueOnce(new Error('Permission denied'));

      await expect(CometChatGroupMembersManager.banMember('group-1', 'user-1')).rejects.toThrow(
        'Permission denied'
      );
    });
  });

  describe('unbanMember', () => {
    it('calls CometChat.unbanGroupMember with correct params', async () => {
      const { CometChat } = await import('@cometchat/chat-sdk-javascript');
      vi.mocked(CometChat.unbanGroupMember).mockResolvedValueOnce({} as never);

      const result = await CometChatGroupMembersManager.unbanMember('group-1', 'user-1');
      expect(CometChat.unbanGroupMember).toHaveBeenCalledWith('group-1', 'user-1');
      expect(result).toBe(true);
    });

    it('throws on SDK error', async () => {
      const { CometChat } = await import('@cometchat/chat-sdk-javascript');
      vi.mocked(CometChat.unbanGroupMember).mockRejectedValueOnce(new Error('Not found'));

      await expect(CometChatGroupMembersManager.unbanMember('group-1', 'user-1')).rejects.toThrow(
        'Not found'
      );
    });
  });

  describe('changeScope', () => {
    it('calls CometChat.updateGroupMemberScope with correct params', async () => {
      const { CometChat } = await import('@cometchat/chat-sdk-javascript');
      vi.mocked(CometChat.updateGroupMemberScope).mockResolvedValueOnce({} as never);

      const result = await CometChatGroupMembersManager.changeScope('group-1', 'user-1', 'admin');
      expect(CometChat.updateGroupMemberScope).toHaveBeenCalledWith('group-1', 'user-1', 'admin');
      expect(result).toBe(true);
    });

    it('throws on SDK error', async () => {
      const { CometChat } = await import('@cometchat/chat-sdk-javascript');
      vi.mocked(CometChat.updateGroupMemberScope).mockRejectedValueOnce(
        new Error('Permission denied')
      );

      await expect(
        CometChatGroupMembersManager.changeScope('group-1', 'user-1', 'admin')
      ).rejects.toThrow('Permission denied');
    });
  });

  describe('attachGroupListener', () => {
    it('returns cleanup function', async () => {
      const { CometChat } = await import('@cometchat/chat-sdk-javascript');
      const callbacks = {
        onGroupMemberJoined: vi.fn(),
        onGroupMemberLeft: vi.fn(),
        onGroupMemberBanned: vi.fn(),
        onGroupMemberKicked: vi.fn(),
        onGroupMemberScopeChanged: vi.fn(),
      };
      const cleanup = CometChatGroupMembersManager.attachGroupListener('test-id', callbacks);

      expect(CometChat.addGroupListener).toHaveBeenCalledWith('test-id', expect.anything());
      expect(typeof cleanup).toBe('function');
    });

    it('cleanup removes the listener', async () => {
      const { CometChat } = await import('@cometchat/chat-sdk-javascript');
      const callbacks = {
        onGroupMemberJoined: vi.fn(),
        onGroupMemberLeft: vi.fn(),
        onGroupMemberBanned: vi.fn(),
        onGroupMemberKicked: vi.fn(),
        onGroupMemberScopeChanged: vi.fn(),
      };
      const cleanup = CometChatGroupMembersManager.attachGroupListener('test-id', callbacks);

      cleanup();
      expect(CometChat.removeGroupListener).toHaveBeenCalledWith('test-id');
    });
  });

  describe('attachUserListener', () => {
    it('returns cleanup function', async () => {
      const { CometChat } = await import('@cometchat/chat-sdk-javascript');
      const callbacks = {
        onUserOnline: vi.fn(),
        onUserOffline: vi.fn(),
      };
      const cleanup = CometChatGroupMembersManager.attachUserListener('user-id', callbacks);

      expect(CometChat.addUserListener).toHaveBeenCalledWith('user-id', expect.anything());
      expect(typeof cleanup).toBe('function');
    });

    it('cleanup removes the listener', async () => {
      const { CometChat } = await import('@cometchat/chat-sdk-javascript');
      const callbacks = {
        onUserOnline: vi.fn(),
        onUserOffline: vi.fn(),
      };
      const cleanup = CometChatGroupMembersManager.attachUserListener('user-id', callbacks);

      cleanup();
      expect(CometChat.removeUserListener).toHaveBeenCalledWith('user-id');
    });
  });

  describe('attachConnectionListener', () => {
    it('returns cleanup function', async () => {
      const { CometChat } = await import('@cometchat/chat-sdk-javascript');
      const callbacks = { onConnected: vi.fn() };
      const cleanup = CometChatGroupMembersManager.attachConnectionListener('conn-id', callbacks);

      expect(CometChat.addConnectionListener).toHaveBeenCalledWith('conn-id', expect.anything());
      expect(typeof cleanup).toBe('function');
    });

    it('cleanup removes the listener', async () => {
      const { CometChat } = await import('@cometchat/chat-sdk-javascript');
      const callbacks = { onConnected: vi.fn() };
      const cleanup = CometChatGroupMembersManager.attachConnectionListener('conn-id', callbacks);

      cleanup();
      expect(CometChat.removeConnectionListener).toHaveBeenCalledWith('conn-id');
    });
  });
});
