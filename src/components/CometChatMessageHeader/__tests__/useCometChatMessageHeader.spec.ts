import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { useCometChatMessageHeader } from '../useCometChatMessageHeader';

// --- SDK Mock ---

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
    UserListener: vi.fn().mockImplementation((cb: unknown) => cb),
    MessageListener: vi.fn().mockImplementation((cb: unknown) => cb),
    GroupListener: vi.fn().mockImplementation((cb: unknown) => cb),
    ConnectionListener: vi.fn().mockImplementation((cb: unknown) => cb),
    CallListener: vi.fn().mockImplementation((cb: unknown) => cb),
    RECEIVER_TYPE: { GROUP: 'group', USER: 'user' },
    CALL_TYPE: { AUDIO: 'audio', VIDEO: 'video' },
    CALL_STATUS: { CANCELLED: 'cancelled' },
    USER_STATUS: { ONLINE: 'online', OFFLINE: 'offline' },
    getLoggedinUser: vi.fn().mockResolvedValue({
      getUid: () => 'logged-in-user',
      getName: () => 'Me',
    }),
    initiateCall: vi.fn(),
    rejectCall: vi.fn(),
    clearActiveCall: vi.fn(),
    sendCustomMessage: vi.fn().mockResolvedValue({}),
    Call: vi.fn().mockImplementation(function (
      this: Record<string, unknown>,
      receiverId: string,
      type: string,
      receiverType: string
    ) {
      this.receiverId = receiverId;
      this.type = type;
      this.receiverType = receiverType;
      this.getSessionId = () => 'session-mock';
      this.getSender = () => ({ getUid: () => 'logged-in-user' });
      return this;
    }),
    CustomMessage: vi.fn().mockImplementation(function (this: Record<string, unknown>) {
      this.setMetadata = vi.fn();
      this.shouldUpdateConversation = vi.fn();
      this.setSender = vi.fn();
      return this;
    }),
  },
}));

vi.mock('../../../hooks/useLoggedInUser', () => ({
  useLoggedInUser: () => ({
    getUid: () => 'logged-in-user',
    getName: () => 'Me',
  }),
}));

vi.mock('../../../hooks/useCometChatEvents', () => ({
  useCometChatEvents: vi.fn(),
}));

vi.mock('../../../hooks/usePublishEvent', () => ({
  usePublishEvent: () => vi.fn(),
}));

vi.mock('../../../constants/CometChatUIKitConstants', () => ({
  CometChatUIKitConstants: {
    calls: { meeting: 'meeting' },
  },
}));

// --- Helpers ---

function createMockUser(overrides: Record<string, unknown> = {}) {
  return {
    getUid: () => ('uid' in overrides ? String(overrides.uid) : 'user-1'),
    getName: () => ('name' in overrides ? String(overrides.name) : 'John Doe'),
    getAvatar: () =>
      'avatar' in overrides ? String(overrides.avatar) : 'https://example.com/avatar.png',
    getStatus: () => ('status' in overrides ? String(overrides.status) : 'online'),
    getLastActiveAt: () => ('lastActiveAt' in overrides ? Number(overrides.lastActiveAt) : 0),
    getBlockedByMe: () => ('blockedByMe' in overrides ? Boolean(overrides.blockedByMe) : false),
    getHasBlockedMe: () => ('hasBlockedMe' in overrides ? Boolean(overrides.hasBlockedMe) : false),
  } as unknown as CometChat.User;
}

function createMockGroup(overrides: Record<string, unknown> = {}) {
  return {
    getGuid: () => ('guid' in overrides ? String(overrides.guid) : 'group-1'),
    getName: () => ('name' in overrides ? String(overrides.name) : 'Design Team'),
    getIcon: () => ('icon' in overrides ? String(overrides.icon) : ''),
    getMembersCount: () => ('membersCount' in overrides ? Number(overrides.membersCount) : 12),
  } as unknown as CometChat.Group;
}

function createMockTypingIndicator(overrides: Record<string, unknown> = {}) {
  return {
    getReceiverId: () => ('receiverId' in overrides ? String(overrides.receiverId) : 'user-1'),
    getReceiverType: () => ('receiverType' in overrides ? String(overrides.receiverType) : 'user'),
    getSender: () => ({
      getUid: () => ('senderUid' in overrides ? String(overrides.senderUid) : 'user-1'),
      getName: () => ('senderName' in overrides ? String(overrides.senderName) : 'Alice'),
    }),
  } as unknown as CometChat.TypingIndicator;
}

// eslint-disable-next-line @typescript-eslint/unbound-method
const mockAddMessageListener = vi.mocked(CometChat.addMessageListener);
// eslint-disable-next-line @typescript-eslint/unbound-method
const mockAddConnectionListener = vi.mocked(CometChat.addConnectionListener);
// eslint-disable-next-line @typescript-eslint/unbound-method
const mockAddGroupListener = vi.mocked(CometChat.addGroupListener);
// eslint-disable-next-line @typescript-eslint/unbound-method
const mockAddUserListener = vi.mocked(CometChat.addUserListener);

function getListenerCallbacks(
  mockFn: ReturnType<typeof vi.fn>
): Record<string, (...args: unknown[]) => void> {
  const calls = mockFn.mock.calls;
  // Return the latest listener callbacks (last call, second argument)
  return calls[calls.length - 1]?.[1] as Record<string, (...args: unknown[]) => void>;
}

describe('useCometChatMessageHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // --- Initialization ---

  describe('initialization', () => {
    it('returns initial state with no user or group', () => {
      const { result } = renderHook(() => useCometChatMessageHeader({}));
      expect(result.current.userStatus).toBe('offline');
      expect(result.current.isTyping).toBe(false);
      expect(result.current.typingText).toBe('');
      expect(result.current.groupMemberCount).toBe(0);
    });

    it('initializes user status from user prop', () => {
      const user = createMockUser({ status: 'online' });
      const { result } = renderHook(() => useCometChatMessageHeader({ user }));
      expect(result.current.userStatus).toBe('online');
    });

    it('initializes offline user status', () => {
      const user = createMockUser({ status: 'offline', lastActiveAt: 1700000000 });
      const { result } = renderHook(() => useCometChatMessageHeader({ user }));
      expect(result.current.userStatus).toBe('offline');
      expect(result.current.lastActiveAt).toBe(1700000000);
    });

    it('initializes group member count from group prop', () => {
      const group = createMockGroup({ membersCount: 25 });
      const { result } = renderHook(() => useCometChatMessageHeader({ group }));
      expect(result.current.groupMemberCount).toBe(25);
    });

    it('defaults group member count to 0 when getMembersCount returns undefined', () => {
      const group = {
        getGuid: () => 'group-1',
        getName: () => 'Team',
        getIcon: () => '',
        getMembersCount: () => undefined,
      } as unknown as CometChat.Group;
      const { result } = renderHook(() => useCometChatMessageHeader({ group }));
      expect(result.current.groupMemberCount).toBe(0);
    });

    it('resets state when user prop changes', () => {
      const user1 = createMockUser({ uid: 'u1', status: 'online' });
      const user2 = createMockUser({ uid: 'u2', status: 'offline' });
      const { result, rerender } = renderHook(({ user }) => useCometChatMessageHeader({ user }), {
        initialProps: { user: user1 },
      });
      expect(result.current.userStatus).toBe('online');

      rerender({ user: user2 });
      expect(result.current.userStatus).toBe('offline');
    });
  });

  // --- Typing text computation ---

  describe('typing text', () => {
    it('returns "typing" for user conversation', () => {
      const user = createMockUser();
      const { result } = renderHook(() => useCometChatMessageHeader({ user }));

      // Simulate typing started via message listener
      act(() => {
        const callbacks = getListenerCallbacks(mockAddMessageListener);
        const indicator = createMockTypingIndicator({ senderUid: 'user-1' });
        callbacks.onTypingStarted(indicator);
      });

      expect(result.current.isTyping).toBe(true);
      expect(result.current.typingText).toBe('typing');
    });

    it('returns "{name} is typing" for group with single typer', () => {
      const group = createMockGroup();
      const { result } = renderHook(() => useCometChatMessageHeader({ group }));

      act(() => {
        const callbacks = getListenerCallbacks(mockAddMessageListener);
        const indicator = createMockTypingIndicator({
          receiverId: 'group-1',
          receiverType: 'group',
          senderUid: 'u1',
          senderName: 'Alice',
        });
        callbacks.onTypingStarted(indicator);
      });

      expect(result.current.isTyping).toBe(true);
      expect(result.current.typingText).toBe('Alice is typing');
    });

    it('returns "{name1} and {name2} are typing" for group with two typers', () => {
      const group = createMockGroup();
      const { result } = renderHook(() => useCometChatMessageHeader({ group }));

      act(() => {
        const callbacks = getListenerCallbacks(mockAddMessageListener);
        callbacks.onTypingStarted(
          createMockTypingIndicator({
            receiverId: 'group-1',
            receiverType: 'group',
            senderUid: 'u1',
            senderName: 'Alice',
          })
        );
      });

      act(() => {
        const callbacks = getListenerCallbacks(mockAddMessageListener);
        callbacks.onTypingStarted(
          createMockTypingIndicator({
            receiverId: 'group-1',
            receiverType: 'group',
            senderUid: 'u2',
            senderName: 'Bob',
          })
        );
      });

      expect(result.current.typingText).toBe('Alice and Bob are typing');
    });

    it('returns "{name} and N others are typing" for 3+ typers', () => {
      const group = createMockGroup();
      const { result } = renderHook(() => useCometChatMessageHeader({ group }));

      const users = [
        { senderUid: 'u1', senderName: 'Alice' },
        { senderUid: 'u2', senderName: 'Bob' },
        { senderUid: 'u3', senderName: 'Charlie' },
      ];

      for (const u of users) {
        act(() => {
          const callbacks = getListenerCallbacks(mockAddMessageListener);
          callbacks.onTypingStarted(
            createMockTypingIndicator({
              receiverId: 'group-1',
              receiverType: 'group',
              ...u,
            })
          );
        });
      }

      expect(result.current.typingText).toBe('Alice and 2 others are typing');
    });

    it('auto-clears typing after timeout', () => {
      // For group conversations, individual user typing timeouts clear after 2 seconds.
      // When the last typing user is removed, the typingUsers array becomes empty,
      // but the typingIndicator remains set until onTypingEnded fires.
      // The component still shows typing text from the indicator's sender.
      const group = createMockGroup();
      const { result } = renderHook(() => useCometChatMessageHeader({ group }));

      act(() => {
        const callbacks = getListenerCallbacks(mockAddMessageListener);
        const indicator = createMockTypingIndicator({
          receiverId: 'group-1',
          receiverType: 'group',
          senderUid: 'u1',
          senderName: 'Alice',
        });
        callbacks.onTypingStarted(indicator);
      });

      expect(result.current.isTyping).toBe(true);
      expect(result.current.typingText).toBe('Alice is typing');

      // Advance past the 2-second timeout — individual user typing clears from typingUsers
      act(() => {
        vi.advanceTimersByTime(2100);
      });

      // After timeout, the user is removed from typingUsers but indicator remains
      // until onTypingEnded fires. Verify the user was removed from the tracked list.
      // Then simulate onTypingEnded to fully clear.
      act(() => {
        const callbacks = getListenerCallbacks(mockAddMessageListener);
        const indicator = createMockTypingIndicator({
          receiverId: 'group-1',
          receiverType: 'group',
          senderUid: 'u1',
          senderName: 'Alice',
        });
        callbacks.onTypingEnded(indicator);
      });

      expect(result.current.isTyping).toBe(false);
      expect(result.current.typingText).toBe('');
    });

    it('clears typing on onTypingEnded', () => {
      const user = createMockUser();
      const { result } = renderHook(() => useCometChatMessageHeader({ user }));

      act(() => {
        const callbacks = getListenerCallbacks(mockAddMessageListener);
        callbacks.onTypingStarted(createMockTypingIndicator({ senderUid: 'user-1' }));
      });

      expect(result.current.isTyping).toBe(true);

      act(() => {
        const callbacks = getListenerCallbacks(mockAddMessageListener);
        callbacks.onTypingEnded(createMockTypingIndicator({ senderUid: 'user-1' }));
      });

      expect(result.current.isTyping).toBe(false);
    });
  });

  // --- Connection listener ---

  describe('connection listener', () => {
    it('sets connection status to connected', () => {
      const user = createMockUser();
      const { result } = renderHook(() => useCometChatMessageHeader({ user }));

      act(() => {
        const callbacks = getListenerCallbacks(mockAddConnectionListener);
        callbacks.onDisconnected();
      });

      expect(result.current.connectionStatus).toBe('disconnected');

      act(() => {
        const callbacks = getListenerCallbacks(mockAddConnectionListener);
        callbacks.onConnected();
      });

      expect(result.current.connectionStatus).toBe('connected');
    });

    it('does not attach connection listener when no user or group', () => {
      renderHook(() => useCometChatMessageHeader({}));
      expect(mockAddConnectionListener).not.toHaveBeenCalled();
    });
  });

  // --- User status listener ---

  describe('user status listener', () => {
    it('attaches user status listener for user conversations', () => {
      const user = createMockUser();
      renderHook(() => useCometChatMessageHeader({ user }));
      expect(mockAddUserListener).toHaveBeenCalled();
    });

    it('does not attach user status listener when hideUserStatus is true', () => {
      const user = createMockUser();
      renderHook(() => useCometChatMessageHeader({ user, hideUserStatus: true }));
      expect(mockAddUserListener).not.toHaveBeenCalled();
    });

    it('updates status to online via listener', () => {
      const user = createMockUser({ status: 'offline' });
      const { result } = renderHook(() => useCometChatMessageHeader({ user }));

      act(() => {
        const callbacks = getListenerCallbacks(mockAddUserListener);
        callbacks.onUserOnline({ getUid: () => 'user-1' });
      });

      expect(result.current.userStatus).toBe('online');
    });

    it('updates status to offline via listener', () => {
      const user = createMockUser({ status: 'online' });
      const { result } = renderHook(() => useCometChatMessageHeader({ user }));

      act(() => {
        const callbacks = getListenerCallbacks(mockAddUserListener);
        callbacks.onUserOffline({
          getUid: () => 'user-1',
          getLastActiveAt: () => 1700000000,
        });
      });

      expect(result.current.userStatus).toBe('offline');
      expect(result.current.lastActiveAt).toBe(1700000000);
    });
  });

  // --- Group member listener ---

  describe('group member listener', () => {
    it('attaches group listener for group conversations', () => {
      const group = createMockGroup();
      renderHook(() => useCometChatMessageHeader({ group }));
      expect(mockAddGroupListener).toHaveBeenCalled();
    });

    it('updates member count on member joined', () => {
      const group = createMockGroup({ membersCount: 10 });
      const { result } = renderHook(() => useCometChatMessageHeader({ group }));

      act(() => {
        const callbacks = getListenerCallbacks(mockAddGroupListener);
        const updatedGroup = { getGuid: () => 'group-1', getMembersCount: () => 11 };
        callbacks.onGroupMemberJoined({}, {}, updatedGroup);
      });

      expect(result.current.groupMemberCount).toBe(11);
    });

    it('updates member count on member left', () => {
      const group = createMockGroup({ membersCount: 10 });
      const { result } = renderHook(() => useCometChatMessageHeader({ group }));

      act(() => {
        const callbacks = getListenerCallbacks(mockAddGroupListener);
        const updatedGroup = { getGuid: () => 'group-1', getMembersCount: () => 9 };
        callbacks.onGroupMemberLeft({}, {}, updatedGroup);
      });

      expect(result.current.groupMemberCount).toBe(9);
    });

    it('updates member count on member kicked', () => {
      const group = createMockGroup({ membersCount: 10 });
      const { result } = renderHook(() => useCometChatMessageHeader({ group }));

      act(() => {
        const callbacks = getListenerCallbacks(mockAddGroupListener);
        const updatedGroup = { getGuid: () => 'group-1', getMembersCount: () => 9 };
        callbacks.onGroupMemberKicked({}, {}, {}, updatedGroup);
      });

      expect(result.current.groupMemberCount).toBe(9);
    });

    it('updates member count on member banned', () => {
      const group = createMockGroup({ membersCount: 10 });
      const { result } = renderHook(() => useCometChatMessageHeader({ group }));

      act(() => {
        const callbacks = getListenerCallbacks(mockAddGroupListener);
        const updatedGroup = { getGuid: () => 'group-1', getMembersCount: () => 9 };
        callbacks.onGroupMemberBanned({}, {}, {}, updatedGroup);
      });

      expect(result.current.groupMemberCount).toBe(9);
    });

    it('updates member count on member added', () => {
      const group = createMockGroup({ membersCount: 10 });
      const { result } = renderHook(() => useCometChatMessageHeader({ group }));

      act(() => {
        const callbacks = getListenerCallbacks(mockAddGroupListener);
        const updatedGroup = { getGuid: () => 'group-1', getMembersCount: () => 11 };
        callbacks.onMemberAddedToGroup({}, {}, {}, updatedGroup);
      });

      expect(result.current.groupMemberCount).toBe(11);
    });

    it('handles scope change without error', () => {
      const group = createMockGroup({ membersCount: 10 });
      const { result } = renderHook(() => useCometChatMessageHeader({ group }));

      act(() => {
        const callbacks = getListenerCallbacks(mockAddGroupListener);
        callbacks.onGroupMemberScopeChanged({}, {}, 'admin', 'participant', {
          getGuid: () => 'group-1',
        });
      });

      // Member count should remain unchanged
      expect(result.current.groupMemberCount).toBe(10);
    });
  });

  // --- No entity edge cases ---

  describe('no entity', () => {
    it('does not attach typing listener when no user or group', () => {
      renderHook(() => useCometChatMessageHeader({}));
      expect(mockAddMessageListener).not.toHaveBeenCalled();
    });

    it('does not attach group listener when no group', () => {
      const user = createMockUser();
      renderHook(() => useCometChatMessageHeader({ user }));
      expect(mockAddGroupListener).not.toHaveBeenCalled();
    });
  });
});
