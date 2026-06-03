import { describe, it, expect } from 'vitest';
import {
  messageHeaderReducer,
  initialMessageHeaderState,
  type CometChatMessageHeaderState,
  type CometChatMessageHeaderAction,
} from '../CometChatMessageHeader.reducer';

describe('CometChatMessageHeader.reducer', () => {
  describe('initialMessageHeaderState', () => {
    it('has correct default values', () => {
      expect(initialMessageHeaderState.userStatus).toBe('offline');
      expect(initialMessageHeaderState.lastActiveAt).toBeNull();
      expect(initialMessageHeaderState.typingIndicator).toBeNull();
      expect(initialMessageHeaderState.typingUsers).toEqual([]);
      expect(initialMessageHeaderState.groupMemberCount).toBe(0);
      expect(initialMessageHeaderState.connectionStatus).toBe('connected');
      expect(initialMessageHeaderState.activeCall).toBeNull();
      expect(initialMessageHeaderState.callButtonsDisabled).toBe(false);
      expect(initialMessageHeaderState.showOutgoingCallScreen).toBe(false);
      expect(initialMessageHeaderState.showOngoingCall).toBe(false);
      expect(initialMessageHeaderState.callSessionId).toBe('');
      expect(initialMessageHeaderState.isDirectCalling).toBe(false);
      expect(initialMessageHeaderState.isGroupAudioCall).toBe(false);
    });
  });

  describe('SET_USER_STATUS', () => {
    it('sets user status to online', () => {
      const result = messageHeaderReducer(initialMessageHeaderState, {
        type: 'SET_USER_STATUS',
        status: 'online',
        lastActiveAt: null,
      });
      expect(result.userStatus).toBe('online');
      expect(result.lastActiveAt).toBeNull();
    });

    it('sets user status to offline with lastActiveAt', () => {
      const result = messageHeaderReducer(initialMessageHeaderState, {
        type: 'SET_USER_STATUS',
        status: 'offline',
        lastActiveAt: 1700000000,
      });
      expect(result.userStatus).toBe('offline');
      expect(result.lastActiveAt).toBe(1700000000);
    });

    it('preserves lastActiveAt when not provided', () => {
      const state: CometChatMessageHeaderState = {
        ...initialMessageHeaderState,
        lastActiveAt: 1700000000,
      };
      const result = messageHeaderReducer(state, {
        type: 'SET_USER_STATUS',
        status: 'online',
      });
      expect(result.lastActiveAt).toBe(1700000000);
    });
  });

  describe('SET_TYPING_INDICATOR', () => {
    it('sets typing indicator', () => {
      const mockIndicator = {
        getSender: () => ({ getUid: () => 'u1', getName: () => 'Alice' }),
      } as any;
      const result = messageHeaderReducer(initialMessageHeaderState, {
        type: 'SET_TYPING_INDICATOR',
        indicator: mockIndicator,
      });
      expect(result.typingIndicator).toBe(mockIndicator);
    });

    it('clears typing indicator when null', () => {
      const state: CometChatMessageHeaderState = {
        ...initialMessageHeaderState,
        typingIndicator: {} as any,
      };
      const result = messageHeaderReducer(state, {
        type: 'SET_TYPING_INDICATOR',
        indicator: null,
      });
      expect(result.typingIndicator).toBeNull();
    });
  });

  describe('ADD_TYPING_USER', () => {
    it('adds a typing user', () => {
      const mockUser = { getUid: () => 'u1', getName: () => 'Alice' } as any;
      const result = messageHeaderReducer(initialMessageHeaderState, {
        type: 'ADD_TYPING_USER',
        user: mockUser,
      });
      expect(result.typingUsers).toHaveLength(1);
      expect(result.typingUsers[0]).toBe(mockUser);
    });

    it('does not add duplicate typing user', () => {
      const mockUser = { getUid: () => 'u1', getName: () => 'Alice' } as any;
      const state: CometChatMessageHeaderState = {
        ...initialMessageHeaderState,
        typingUsers: [mockUser],
      };
      const result = messageHeaderReducer(state, {
        type: 'ADD_TYPING_USER',
        user: mockUser,
      });
      expect(result.typingUsers).toHaveLength(1);
      expect(result).toBe(state); // Same reference — no change
    });

    it('adds multiple different typing users', () => {
      const user1 = { getUid: () => 'u1', getName: () => 'Alice' } as any;
      const user2 = { getUid: () => 'u2', getName: () => 'Bob' } as any;
      let state = messageHeaderReducer(initialMessageHeaderState, {
        type: 'ADD_TYPING_USER',
        user: user1,
      });
      state = messageHeaderReducer(state, {
        type: 'ADD_TYPING_USER',
        user: user2,
      });
      expect(state.typingUsers).toHaveLength(2);
    });
  });

  describe('REMOVE_TYPING_USER', () => {
    it('removes a typing user by userId', () => {
      const user1 = { getUid: () => 'u1', getName: () => 'Alice' } as any;
      const user2 = { getUid: () => 'u2', getName: () => 'Bob' } as any;
      const state: CometChatMessageHeaderState = {
        ...initialMessageHeaderState,
        typingUsers: [user1, user2],
      };
      const result = messageHeaderReducer(state, {
        type: 'REMOVE_TYPING_USER',
        userId: 'u1',
      });
      expect(result.typingUsers).toHaveLength(1);
      expect(result.typingUsers[0].getUid()).toBe('u2');
    });

    it('handles removing non-existent user gracefully', () => {
      const result = messageHeaderReducer(initialMessageHeaderState, {
        type: 'REMOVE_TYPING_USER',
        userId: 'non-existent',
      });
      expect(result.typingUsers).toHaveLength(0);
    });
  });

  describe('CLEAR_TYPING', () => {
    it('clears all typing state', () => {
      const state: CometChatMessageHeaderState = {
        ...initialMessageHeaderState,
        typingIndicator: {} as any,
        typingUsers: [{ getUid: () => 'u1' } as any],
      };
      const result = messageHeaderReducer(state, { type: 'CLEAR_TYPING' });
      expect(result.typingIndicator).toBeNull();
      expect(result.typingUsers).toEqual([]);
    });
  });

  describe('SET_GROUP_MEMBER_COUNT', () => {
    it('sets group member count', () => {
      const result = messageHeaderReducer(initialMessageHeaderState, {
        type: 'SET_GROUP_MEMBER_COUNT',
        count: 12,
      });
      expect(result.groupMemberCount).toBe(12);
    });
  });

  describe('INCREMENT_GROUP_MEMBER_COUNT', () => {
    it('increments by 1', () => {
      const state: CometChatMessageHeaderState = {
        ...initialMessageHeaderState,
        groupMemberCount: 5,
      };
      const result = messageHeaderReducer(state, { type: 'INCREMENT_GROUP_MEMBER_COUNT' });
      expect(result.groupMemberCount).toBe(6);
    });
  });

  describe('DECREMENT_GROUP_MEMBER_COUNT', () => {
    it('decrements by 1', () => {
      const state: CometChatMessageHeaderState = {
        ...initialMessageHeaderState,
        groupMemberCount: 5,
      };
      const result = messageHeaderReducer(state, { type: 'DECREMENT_GROUP_MEMBER_COUNT' });
      expect(result.groupMemberCount).toBe(4);
    });

    it('does not go below 0', () => {
      const result = messageHeaderReducer(initialMessageHeaderState, {
        type: 'DECREMENT_GROUP_MEMBER_COUNT',
      });
      expect(result.groupMemberCount).toBe(0);
    });
  });

  describe('SET_CONNECTION_STATUS', () => {
    it('sets connection status', () => {
      const result = messageHeaderReducer(initialMessageHeaderState, {
        type: 'SET_CONNECTION_STATUS',
        status: 'disconnected',
      });
      expect(result.connectionStatus).toBe('disconnected');
    });
  });

  describe('SET_ACTIVE_CALL', () => {
    it('sets active call and disables buttons', () => {
      const mockCall = { getSessionId: () => 'session-1' } as any;
      const result = messageHeaderReducer(initialMessageHeaderState, {
        type: 'SET_ACTIVE_CALL',
        call: mockCall,
      });
      expect(result.activeCall).toBe(mockCall);
      expect(result.callButtonsDisabled).toBe(true);
    });
  });

  describe('SET_CALL_BUTTONS_DISABLED', () => {
    it('sets call buttons disabled state', () => {
      const result = messageHeaderReducer(initialMessageHeaderState, {
        type: 'SET_CALL_BUTTONS_DISABLED',
        disabled: true,
      });
      expect(result.callButtonsDisabled).toBe(true);
    });
  });

  describe('SHOW_OUTGOING_CALL_SCREEN', () => {
    it('shows outgoing call screen', () => {
      const result = messageHeaderReducer(initialMessageHeaderState, {
        type: 'SHOW_OUTGOING_CALL_SCREEN',
        show: true,
      });
      expect(result.showOutgoingCallScreen).toBe(true);
    });
  });

  describe('SHOW_ONGOING_CALL', () => {
    it('sets ongoing call state', () => {
      const result = messageHeaderReducer(initialMessageHeaderState, {
        type: 'SHOW_ONGOING_CALL',
        show: true,
        sessionId: 'session-123',
        isDirectCalling: true,
        isGroupAudioCall: true,
      });
      expect(result.showOngoingCall).toBe(true);
      expect(result.callSessionId).toBe('session-123');
      expect(result.isDirectCalling).toBe(true);
      expect(result.isGroupAudioCall).toBe(true);
      expect(result.showOutgoingCallScreen).toBe(false);
      expect(result.callButtonsDisabled).toBe(true);
    });

    it('defaults isGroupAudioCall to false', () => {
      const result = messageHeaderReducer(initialMessageHeaderState, {
        type: 'SHOW_ONGOING_CALL',
        show: true,
        sessionId: 'session-123',
        isDirectCalling: false,
      });
      expect(result.isGroupAudioCall).toBe(false);
    });
  });

  describe('RESET_CALL_STATE', () => {
    it('resets all call-related state', () => {
      const state: CometChatMessageHeaderState = {
        ...initialMessageHeaderState,
        activeCall: {} as any,
        callButtonsDisabled: true,
        showOutgoingCallScreen: true,
        showOngoingCall: true,
        callSessionId: 'session-123',
        isDirectCalling: true,
        isGroupAudioCall: true,
      };
      const result = messageHeaderReducer(state, { type: 'RESET_CALL_STATE' });
      expect(result.activeCall).toBeNull();
      expect(result.callButtonsDisabled).toBe(false);
      expect(result.showOutgoingCallScreen).toBe(false);
      expect(result.showOngoingCall).toBe(false);
      expect(result.callSessionId).toBe('');
      expect(result.isDirectCalling).toBe(false);
      expect(result.isGroupAudioCall).toBe(false);
    });

    it('preserves non-call state', () => {
      const state: CometChatMessageHeaderState = {
        ...initialMessageHeaderState,
        userStatus: 'online',
        groupMemberCount: 12,
        activeCall: {} as any,
        callButtonsDisabled: true,
      };
      const result = messageHeaderReducer(state, { type: 'RESET_CALL_STATE' });
      expect(result.userStatus).toBe('online');
      expect(result.groupMemberCount).toBe(12);
    });
  });

  describe('RESET', () => {
    it('returns initial state', () => {
      const state: CometChatMessageHeaderState = {
        ...initialMessageHeaderState,
        userStatus: 'online',
        groupMemberCount: 12,
        activeCall: {} as any,
        callButtonsDisabled: true,
        typingUsers: [{ getUid: () => 'u1' } as any],
      };
      const result = messageHeaderReducer(state, { type: 'RESET' });
      expect(result).toEqual(initialMessageHeaderState);
    });
  });

  describe('unknown action', () => {
    it('returns unchanged state', () => {
      const result = messageHeaderReducer(initialMessageHeaderState, {
        type: 'UNKNOWN',
      } as unknown as CometChatMessageHeaderAction);
      expect(result).toBe(initialMessageHeaderState);
    });
  });
});
