/**
 * CometChatMessageHeader reducer — manages user status, typing indicators,
 * group member count, connection status, and call state.
 */

import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatUserStatus } from './CometChatMessageHeader.types';

// --- State ---

export interface CometChatMessageHeaderState {
  /** User online/offline status. */
  userStatus: CometChatUserStatus;
  /** Last active timestamp (epoch seconds) for offline users. */
  lastActiveAt: number | null;
  /** Current typing indicator (null when not typing). */
  typingIndicator: CometChat.TypingIndicator | null;
  /** Multiple typing users for group conversations. */
  typingUsers: CometChat.User[];
  /** Group member count. */
  groupMemberCount: number;
  /** Connection status. */
  connectionStatus: 'connected' | 'disconnected';
  /** Active outgoing call object. */
  activeCall: CometChat.Call | null;
  /** Whether call buttons are disabled (during active call). */
  callButtonsDisabled: boolean;
  /** Whether to show outgoing call screen. */
  showOutgoingCallScreen: boolean;
  /** Whether to show ongoing call screen. */
  showOngoingCall: boolean;
  /** Call session ID. */
  callSessionId: string;
  /** Whether current call uses direct calling (group) vs default (user). */
  isDirectCalling: boolean;
  /** Whether current group call is audio-only. */
  isGroupAudioCall: boolean;
}

// --- Actions ---

export type CometChatMessageHeaderAction =
  | { type: 'SET_USER_STATUS'; status: CometChatUserStatus; lastActiveAt?: number | null }
  | { type: 'SET_TYPING_INDICATOR'; indicator: CometChat.TypingIndicator | null }
  | { type: 'ADD_TYPING_USER'; user: CometChat.User }
  | { type: 'REMOVE_TYPING_USER'; userId: string }
  | { type: 'CLEAR_TYPING' }
  | { type: 'SET_GROUP_MEMBER_COUNT'; count: number }
  | { type: 'INCREMENT_GROUP_MEMBER_COUNT' }
  | { type: 'DECREMENT_GROUP_MEMBER_COUNT' }
  | { type: 'SET_CONNECTION_STATUS'; status: 'connected' | 'disconnected' }
  | { type: 'SET_ACTIVE_CALL'; call: CometChat.Call }
  | { type: 'SET_CALL_BUTTONS_DISABLED'; disabled: boolean }
  | { type: 'SHOW_OUTGOING_CALL_SCREEN'; show: boolean }
  | {
      type: 'SHOW_ONGOING_CALL';
      show: boolean;
      sessionId: string;
      isDirectCalling: boolean;
      isGroupAudioCall?: boolean;
    }
  | { type: 'RESET_CALL_STATE' }
  | { type: 'RESET' };

// --- Initial State ---

export const initialMessageHeaderState: CometChatMessageHeaderState = {
  userStatus: 'offline',
  lastActiveAt: null,
  typingIndicator: null,
  typingUsers: [],
  groupMemberCount: 0,
  connectionStatus: 'connected',
  activeCall: null,
  callButtonsDisabled: false,
  showOutgoingCallScreen: false,
  showOngoingCall: false,
  callSessionId: '',
  isDirectCalling: false,
  isGroupAudioCall: false,
};

// --- Reducer ---

export function messageHeaderReducer(
  state: CometChatMessageHeaderState,
  action: CometChatMessageHeaderAction
): CometChatMessageHeaderState {
  switch (action.type) {
    case 'SET_USER_STATUS':
      return {
        ...state,
        userStatus: action.status,
        lastActiveAt: action.lastActiveAt !== undefined ? action.lastActiveAt : state.lastActiveAt,
      };

    case 'SET_TYPING_INDICATOR':
      return {
        ...state,
        typingIndicator: action.indicator,
      };

    case 'ADD_TYPING_USER': {
      // Prevent duplicates
      const exists = state.typingUsers.some(u => u.getUid() === action.user.getUid());
      if (exists) return state;
      return {
        ...state,
        typingUsers: [...state.typingUsers, action.user],
      };
    }

    case 'REMOVE_TYPING_USER':
      return {
        ...state,
        typingUsers: state.typingUsers.filter(u => u.getUid() !== action.userId),
      };

    case 'CLEAR_TYPING':
      return {
        ...state,
        typingIndicator: null,
        typingUsers: [],
      };

    case 'SET_GROUP_MEMBER_COUNT':
      return {
        ...state,
        groupMemberCount: action.count,
      };

    case 'INCREMENT_GROUP_MEMBER_COUNT':
      return {
        ...state,
        groupMemberCount: state.groupMemberCount + 1,
      };

    case 'DECREMENT_GROUP_MEMBER_COUNT':
      return {
        ...state,
        groupMemberCount: Math.max(0, state.groupMemberCount - 1),
      };

    case 'SET_CONNECTION_STATUS':
      return {
        ...state,
        connectionStatus: action.status,
      };

    case 'SET_ACTIVE_CALL':
      return {
        ...state,
        activeCall: action.call,
        callButtonsDisabled: true,
      };

    case 'SET_CALL_BUTTONS_DISABLED':
      return {
        ...state,
        callButtonsDisabled: action.disabled,
      };

    case 'SHOW_OUTGOING_CALL_SCREEN':
      return {
        ...state,
        showOutgoingCallScreen: action.show,
      };

    case 'SHOW_ONGOING_CALL':
      return {
        ...state,
        showOngoingCall: action.show,
        callSessionId: action.sessionId,
        isDirectCalling: action.isDirectCalling,
        isGroupAudioCall: action.isGroupAudioCall ?? false,
        showOutgoingCallScreen: false,
        callButtonsDisabled: action.show,
      };

    case 'RESET_CALL_STATE':
      return {
        ...state,
        activeCall: null,
        callButtonsDisabled: false,
        showOutgoingCallScreen: false,
        showOngoingCall: false,
        callSessionId: '',
        isDirectCalling: false,
        isGroupAudioCall: false,
      };

    case 'RESET':
      return initialMessageHeaderState;

    default:
      return state;
  }
}
