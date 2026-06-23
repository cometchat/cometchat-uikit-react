/**
 * CometChatMessageHeader reducer — manages user status, typing indicators,
 * group member count, and connection status.
 *
 * Call state has been moved to the standalone CometChatCallButtons component.
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
  | { type: 'RESET' };

// --- Initial State ---

export const initialMessageHeaderState: CometChatMessageHeaderState = {
  userStatus: 'offline',
  lastActiveAt: null,
  typingIndicator: null,
  typingUsers: [],
  groupMemberCount: 0,
  connectionStatus: 'connected',
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

    case 'RESET':
      return initialMessageHeaderState;

    default:
      return state;
  }
}
