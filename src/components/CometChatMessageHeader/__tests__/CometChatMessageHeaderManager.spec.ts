import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  attachUserStatusListener,
  attachTypingListener,
  attachGroupMemberListener,
  attachConnectionListener,
} from '../CometChatMessageHeaderManager';

vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
    addUserListener: vi.fn(),
    removeUserListener: vi.fn(),
    addMessageListener: vi.fn(),
    removeMessageListener: vi.fn(),
    addGroupListener: vi.fn(),
    removeGroupListener: vi.fn(),
    addConnectionListener: vi.fn(),
    removeConnectionListener: vi.fn(),
    addCallListener: vi.fn(),
    removeCallListener: vi.fn(),
    UserListener: vi.fn().mockImplementation((callbacks: unknown) => callbacks),
    MessageListener: vi.fn().mockImplementation((callbacks: unknown) => callbacks),
    GroupListener: vi.fn().mockImplementation((callbacks: unknown) => callbacks),
    ConnectionListener: vi.fn().mockImplementation((callbacks: unknown) => callbacks),
    CallListener: vi.fn().mockImplementation((callbacks: unknown) => callbacks),
    RECEIVER_TYPE: { GROUP: 'group', USER: 'user' },
  },
}));

// Extract mocked SDK methods once to avoid repeated unbound-method warnings.
// eslint-disable-next-line @typescript-eslint/unbound-method
const mockAddUserListener = vi.mocked(CometChat.addUserListener);
// eslint-disable-next-line @typescript-eslint/unbound-method
const mockRemoveUserListener = vi.mocked(CometChat.removeUserListener);
// eslint-disable-next-line @typescript-eslint/unbound-method
const mockAddMessageListener = vi.mocked(CometChat.addMessageListener);
// eslint-disable-next-line @typescript-eslint/unbound-method
const mockRemoveMessageListener = vi.mocked(CometChat.removeMessageListener);
// eslint-disable-next-line @typescript-eslint/unbound-method
const mockAddGroupListener = vi.mocked(CometChat.addGroupListener);
// eslint-disable-next-line @typescript-eslint/unbound-method
const mockRemoveGroupListener = vi.mocked(CometChat.removeGroupListener);
// eslint-disable-next-line @typescript-eslint/unbound-method
const mockAddConnectionListener = vi.mocked(CometChat.addConnectionListener);
// eslint-disable-next-line @typescript-eslint/unbound-method
const mockRemoveConnectionListener = vi.mocked(CometChat.removeConnectionListener);

function getListenerCallbacks(
  mockFn: ReturnType<typeof vi.fn>
): Record<string, (...args: any[]) => void> {
  return mockFn.mock.calls[0]?.[1] as Record<string, (...args: any[]) => void>;
}

describe('CometChatMessageHeaderManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==================== User Status Listener ====================

  describe('attachUserStatusListener', () => {
    it('attaches an SDK user listener', () => {
      const callbacks = { onUserOnline: vi.fn(), onUserOffline: vi.fn() };
      attachUserStatusListener('test-user-listener', 'user-1', callbacks);
      expect(mockAddUserListener).toHaveBeenCalledWith('test-user-listener', expect.any(Object));
    });

    it('returns a cleanup function that removes the listener', () => {
      const callbacks = { onUserOnline: vi.fn(), onUserOffline: vi.fn() };
      const cleanup = attachUserStatusListener('test-user-listener', 'user-1', callbacks);
      cleanup();
      expect(mockRemoveUserListener).toHaveBeenCalledWith('test-user-listener');
    });

    it('fires onUserOnline for matching user', () => {
      const callbacks = { onUserOnline: vi.fn(), onUserOffline: vi.fn() };
      attachUserStatusListener('test-user-listener', 'user-1', callbacks);

      const listenerCallbacks = getListenerCallbacks(mockAddUserListener);
      const mockUser = { getUid: () => 'user-1' } as CometChat.User;
      listenerCallbacks.onUserOnline(mockUser);

      expect(callbacks.onUserOnline).toHaveBeenCalledWith(mockUser);
    });

    it('does NOT fire onUserOnline for non-matching user', () => {
      const callbacks = { onUserOnline: vi.fn(), onUserOffline: vi.fn() };
      attachUserStatusListener('test-user-listener', 'user-1', callbacks);

      const listenerCallbacks = getListenerCallbacks(mockAddUserListener);
      const mockUser = { getUid: () => 'user-999' } as CometChat.User;
      listenerCallbacks.onUserOnline(mockUser);

      expect(callbacks.onUserOnline).not.toHaveBeenCalled();
    });

    it('fires onUserOffline for matching user', () => {
      const callbacks = { onUserOnline: vi.fn(), onUserOffline: vi.fn() };
      attachUserStatusListener('test-user-listener', 'user-1', callbacks);

      const listenerCallbacks = getListenerCallbacks(mockAddUserListener);
      const mockUser = { getUid: () => 'user-1' } as CometChat.User;
      listenerCallbacks.onUserOffline(mockUser);

      expect(callbacks.onUserOffline).toHaveBeenCalledWith(mockUser);
    });

    it('does NOT fire onUserOffline for non-matching user', () => {
      const callbacks = { onUserOnline: vi.fn(), onUserOffline: vi.fn() };
      attachUserStatusListener('test-user-listener', 'user-1', callbacks);

      const listenerCallbacks = getListenerCallbacks(mockAddUserListener);
      const mockUser = { getUid: () => 'user-999' } as CometChat.User;
      listenerCallbacks.onUserOffline(mockUser);

      expect(callbacks.onUserOffline).not.toHaveBeenCalled();
    });
  });

  // ==================== Typing Listener ====================

  describe('attachTypingListener', () => {
    it('attaches an SDK message listener', () => {
      const callbacks = { onTypingStarted: vi.fn(), onTypingEnded: vi.fn() };
      attachTypingListener('test-typing-listener', 'user-1', 'user', callbacks);
      expect(mockAddMessageListener).toHaveBeenCalledWith(
        'test-typing-listener',
        expect.any(Object)
      );
    });

    it('returns a cleanup function', () => {
      const callbacks = { onTypingStarted: vi.fn(), onTypingEnded: vi.fn() };
      const cleanup = attachTypingListener('test-typing-listener', 'user-1', 'user', callbacks);
      cleanup();
      expect(mockRemoveMessageListener).toHaveBeenCalledWith('test-typing-listener');
    });

    it('fires onTypingStarted for matching user entity', () => {
      const callbacks = { onTypingStarted: vi.fn(), onTypingEnded: vi.fn() };
      attachTypingListener('test-typing-listener', 'user-1', 'user', callbacks);

      const listenerCallbacks = getListenerCallbacks(mockAddMessageListener);
      const mockIndicator = {
        getReceiverId: () => 'me',
        getReceiverType: () => 'user',
        getSender: () => ({ getUid: () => 'user-1', getName: () => 'Alice' }),
      } as unknown as CometChat.TypingIndicator;
      listenerCallbacks.onTypingStarted(mockIndicator);

      expect(callbacks.onTypingStarted).toHaveBeenCalledWith(mockIndicator);
    });

    it('does NOT fire onTypingStarted for non-matching user entity', () => {
      const callbacks = { onTypingStarted: vi.fn(), onTypingEnded: vi.fn() };
      attachTypingListener('test-typing-listener', 'user-1', 'user', callbacks);

      const listenerCallbacks = getListenerCallbacks(mockAddMessageListener);
      const mockIndicator = {
        getReceiverId: () => 'me',
        getReceiverType: () => 'user',
        getSender: () => ({ getUid: () => 'user-999', getName: () => 'Bob' }),
      } as unknown as CometChat.TypingIndicator;
      listenerCallbacks.onTypingStarted(mockIndicator);

      expect(callbacks.onTypingStarted).not.toHaveBeenCalled();
    });

    it('fires onTypingStarted for matching group entity', () => {
      const callbacks = { onTypingStarted: vi.fn(), onTypingEnded: vi.fn() };
      attachTypingListener('test-typing-listener', 'group-1', 'group', callbacks);

      const listenerCallbacks = getListenerCallbacks(mockAddMessageListener);
      const mockIndicator = {
        getReceiverId: () => 'group-1',
        getReceiverType: () => 'group',
        getSender: () => ({ getUid: () => 'user-1', getName: () => 'Alice' }),
      } as unknown as CometChat.TypingIndicator;
      listenerCallbacks.onTypingStarted(mockIndicator);

      expect(callbacks.onTypingStarted).toHaveBeenCalledWith(mockIndicator);
    });

    it('does NOT fire onTypingStarted for non-matching group entity', () => {
      const callbacks = { onTypingStarted: vi.fn(), onTypingEnded: vi.fn() };
      attachTypingListener('test-typing-listener', 'group-1', 'group', callbacks);

      const listenerCallbacks = getListenerCallbacks(mockAddMessageListener);
      const mockIndicator = {
        getReceiverId: () => 'group-999',
        getReceiverType: () => 'group',
        getSender: () => ({ getUid: () => 'user-1', getName: () => 'Alice' }),
      } as unknown as CometChat.TypingIndicator;
      listenerCallbacks.onTypingStarted(mockIndicator);

      expect(callbacks.onTypingStarted).not.toHaveBeenCalled();
    });

    it('fires onTypingEnded for matching entity', () => {
      const callbacks = { onTypingStarted: vi.fn(), onTypingEnded: vi.fn() };
      attachTypingListener('test-typing-listener', 'user-1', 'user', callbacks);

      const listenerCallbacks = getListenerCallbacks(mockAddMessageListener);
      const mockIndicator = {
        getReceiverId: () => 'me',
        getReceiverType: () => 'user',
        getSender: () => ({ getUid: () => 'user-1', getName: () => 'Alice' }),
      } as unknown as CometChat.TypingIndicator;
      listenerCallbacks.onTypingEnded(mockIndicator);

      expect(callbacks.onTypingEnded).toHaveBeenCalledWith(mockIndicator);
    });
  });

  // ==================== Group Member Listener ====================

  describe('attachGroupMemberListener', () => {
    it('attaches an SDK group listener', () => {
      const callbacks = {
        onGroupMemberJoined: vi.fn(),
        onGroupMemberLeft: vi.fn(),
        onGroupMemberKicked: vi.fn(),
        onGroupMemberBanned: vi.fn(),
        onMemberAddedToGroup: vi.fn(),
        onGroupMemberScopeChanged: vi.fn(),
      };
      attachGroupMemberListener('test-group-listener', 'group-1', callbacks);
      expect(mockAddGroupListener).toHaveBeenCalledWith('test-group-listener', expect.any(Object));
    });

    it('returns a cleanup function', () => {
      const callbacks = {
        onGroupMemberJoined: vi.fn(),
        onGroupMemberLeft: vi.fn(),
        onGroupMemberKicked: vi.fn(),
        onGroupMemberBanned: vi.fn(),
        onMemberAddedToGroup: vi.fn(),
        onGroupMemberScopeChanged: vi.fn(),
      };
      const cleanup = attachGroupMemberListener('test-group-listener', 'group-1', callbacks);
      cleanup();
      expect(mockRemoveGroupListener).toHaveBeenCalledWith('test-group-listener');
    });

    it('fires onGroupMemberJoined for matching group', () => {
      const callbacks = {
        onGroupMemberJoined: vi.fn(),
        onGroupMemberLeft: vi.fn(),
        onGroupMemberKicked: vi.fn(),
        onGroupMemberBanned: vi.fn(),
        onMemberAddedToGroup: vi.fn(),
        onGroupMemberScopeChanged: vi.fn(),
      };
      attachGroupMemberListener('test-group-listener', 'group-1', callbacks);

      const listenerCallbacks = getListenerCallbacks(mockAddGroupListener);
      const mockAction = {} as CometChat.Action;
      const mockUser = { getUid: () => 'user-1' } as CometChat.User;
      const mockGroup = { getGuid: () => 'group-1', getMembersCount: () => 13 } as CometChat.Group;
      listenerCallbacks.onGroupMemberJoined(mockAction, mockUser, mockGroup);

      expect(callbacks.onGroupMemberJoined).toHaveBeenCalledWith(mockAction, mockUser, mockGroup);
    });

    it('does NOT fire for non-matching group', () => {
      const callbacks = {
        onGroupMemberJoined: vi.fn(),
        onGroupMemberLeft: vi.fn(),
        onGroupMemberKicked: vi.fn(),
        onGroupMemberBanned: vi.fn(),
        onMemberAddedToGroup: vi.fn(),
        onGroupMemberScopeChanged: vi.fn(),
      };
      attachGroupMemberListener('test-group-listener', 'group-1', callbacks);

      const listenerCallbacks = getListenerCallbacks(mockAddGroupListener);
      const mockAction = {} as CometChat.Action;
      const mockUser = { getUid: () => 'user-1' } as CometChat.User;
      const mockGroup = { getGuid: () => 'group-999', getMembersCount: () => 5 } as CometChat.Group;
      listenerCallbacks.onGroupMemberJoined(mockAction, mockUser, mockGroup);

      expect(callbacks.onGroupMemberJoined).not.toHaveBeenCalled();
    });
  });

  // ==================== Connection Listener ====================

  describe('attachConnectionListener', () => {
    it('attaches an SDK connection listener', () => {
      const callbacks = { onConnected: vi.fn(), onDisconnected: vi.fn() };
      attachConnectionListener('test-conn-listener', callbacks);
      expect(mockAddConnectionListener).toHaveBeenCalledWith(
        'test-conn-listener',
        expect.any(Object)
      );
    });

    it('returns a cleanup function', () => {
      const callbacks = { onConnected: vi.fn(), onDisconnected: vi.fn() };
      const cleanup = attachConnectionListener('test-conn-listener', callbacks);
      cleanup();
      expect(mockRemoveConnectionListener).toHaveBeenCalledWith('test-conn-listener');
    });

    it('fires onConnected callback', () => {
      const callbacks = { onConnected: vi.fn(), onDisconnected: vi.fn() };
      attachConnectionListener('test-conn-listener', callbacks);

      const listenerCallbacks = getListenerCallbacks(mockAddConnectionListener);
      listenerCallbacks.onConnected();

      expect(callbacks.onConnected).toHaveBeenCalled();
    });

    it('fires onDisconnected callback', () => {
      const callbacks = { onConnected: vi.fn(), onDisconnected: vi.fn() };
      attachConnectionListener('test-conn-listener', callbacks);

      const listenerCallbacks = getListenerCallbacks(mockAddConnectionListener);
      listenerCallbacks.onDisconnected();

      expect(callbacks.onDisconnected).toHaveBeenCalled();
    });
  });

  // ==================== Call Listener ====================
});
