import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CometChatGroupsManager } from '../CometChatGroupsManager';

/* eslint-disable @typescript-eslint/unbound-method */

// --- Mock CometChat SDK ---
const mockFetchNext = vi.fn();
const mockBuild = vi.fn(() => ({ fetchNext: mockFetchNext }));
const mockSetLimit = vi.fn(() => ({ build: mockBuild }));

vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
    GroupsRequestBuilder: vi.fn(() => ({
      setLimit: mockSetLimit,
      build: mockBuild,
    })),
    GroupListener: vi.fn((callbacks: Record<string, unknown>) => callbacks),
    ConnectionListener: vi.fn((callbacks: Record<string, unknown>) => callbacks),
    addGroupListener: vi.fn(),
    removeGroupListener: vi.fn(),
    addConnectionListener: vi.fn(),
    removeConnectionListener: vi.fn(),
    createGroup: vi.fn(),
    joinGroup: vi.fn(),
    leaveGroup: vi.fn(),
    deleteGroup: vi.fn(),
    GroupType: { Public: 'public', Private: 'private', Password: 'password' },
  },
}));

describe('CometChatGroupsManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('creates request with default limit 30 when no builder provided', async () => {
      const { CometChat } = await import('@cometchat/chat-sdk-javascript');
      new CometChatGroupsManager();
      expect(CometChat.GroupsRequestBuilder).toHaveBeenCalled();
    });

    it('uses provided builder', () => {
      const mockBuilder = { build: vi.fn(() => ({ fetchNext: mockFetchNext })) };
      new CometChatGroupsManager(mockBuilder as unknown as CometChat.GroupsRequestBuilder);
      expect(mockBuilder.build).toHaveBeenCalled();
    });
  });

  describe('fetchNext', () => {
    it('returns groups from SDK', async () => {
      const mockGroups = [{ getGuid: () => 'g1' }, { getGuid: () => 'g2' }];
      mockFetchNext.mockResolvedValueOnce(mockGroups);

      const manager = new CometChatGroupsManager();
      const result = await manager.fetchNext();
      expect(result).toEqual(mockGroups);
    });

    it('returns empty array when exhausted', async () => {
      mockFetchNext.mockResolvedValueOnce([]);

      const manager = new CometChatGroupsManager();
      const result = await manager.fetchNext();
      expect(result).toEqual([]);
    });
  });

  describe('createGroup', () => {
    it('calls CometChat.createGroup', async () => {
      const { CometChat } = await import('@cometchat/chat-sdk-javascript');
      const mockGroup = { getGuid: () => 'g1' } as unknown as CometChat.Group;
      vi.mocked(CometChat.createGroup).mockResolvedValueOnce(mockGroup);

      const result = await CometChatGroupsManager.createGroup(mockGroup);
      expect(CometChat.createGroup).toHaveBeenCalledWith(mockGroup);
      expect(result).toBe(mockGroup);
    });
  });

  describe('joinGroup', () => {
    it('calls CometChat.joinGroup', async () => {
      const { CometChat } = await import('@cometchat/chat-sdk-javascript');
      const mockGroup = { getGuid: () => 'g1' } as unknown as CometChat.Group;
      vi.mocked(CometChat.joinGroup).mockResolvedValueOnce(mockGroup);

      const result = await CometChatGroupsManager.joinGroup('g1', 'public', 'pass123');
      expect(CometChat.joinGroup).toHaveBeenCalledWith('g1', 'public', 'pass123');
      expect(result).toBe(mockGroup);
    });
  });

  describe('leaveGroup', () => {
    it('calls CometChat.leaveGroup', async () => {
      const { CometChat } = await import('@cometchat/chat-sdk-javascript');
      vi.mocked(CometChat.leaveGroup).mockResolvedValueOnce(true);

      const result = await CometChatGroupsManager.leaveGroup('g1');
      expect(CometChat.leaveGroup).toHaveBeenCalledWith('g1');
      expect(result).toBe(true);
    });
  });

  describe('deleteGroup', () => {
    it('calls CometChat.deleteGroup', async () => {
      const { CometChat } = await import('@cometchat/chat-sdk-javascript');
      vi.mocked(CometChat.deleteGroup).mockResolvedValueOnce(true);

      const result = await CometChatGroupsManager.deleteGroup('g1');
      expect(CometChat.deleteGroup).toHaveBeenCalledWith('g1');
      expect(result).toBe(true);
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
      const cleanup = CometChatGroupsManager.attachGroupListener('test-id', callbacks);

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
      const cleanup = CometChatGroupsManager.attachGroupListener('test-id', callbacks);

      cleanup();
      expect(CometChat.removeGroupListener).toHaveBeenCalledWith('test-id');
    });
  });

  describe('attachConnectionListener', () => {
    it('returns cleanup function', async () => {
      const { CometChat } = await import('@cometchat/chat-sdk-javascript');
      const callbacks = { onConnected: vi.fn() };
      const cleanup = CometChatGroupsManager.attachConnectionListener('conn-id', callbacks);

      expect(CometChat.addConnectionListener).toHaveBeenCalledWith('conn-id', expect.anything());
      expect(typeof cleanup).toBe('function');
    });

    it('cleanup removes the listener', async () => {
      const { CometChat } = await import('@cometchat/chat-sdk-javascript');
      const callbacks = { onConnected: vi.fn() };
      const cleanup = CometChatGroupsManager.attachConnectionListener('conn-id', callbacks);

      cleanup();
      expect(CometChat.removeConnectionListener).toHaveBeenCalledWith('conn-id');
    });
  });
});
