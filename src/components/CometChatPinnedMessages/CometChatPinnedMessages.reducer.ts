import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { carryPinSaveForward } from '../../utils/pinSaveUtils';
import { cloneMessage } from '../CometChatMessageList/CometChatMessageList.utils';
import type {
  CometChatPinnedMessagesAction,
  CometChatPinnedMessagesState,
} from './CometChatPinnedMessages.types';

export const initialPinnedMessagesState: CometChatPinnedMessagesState = {
  messages: [],
  fetchState: 'idle',
  hasMore: true,
  error: null,
};

export function pinnedMessagesReducer(
  state: CometChatPinnedMessagesState,
  action: CometChatPinnedMessagesAction
): CometChatPinnedMessagesState {
  switch (action.type) {
    case 'FETCH_START': {
      return {
        ...state,
        fetchState: state.messages.length === 0 ? 'loading' : state.fetchState,
        error: null,
      };
    }

    case 'FETCH_SUCCESS': {
      // De-duplicate on merge: a pin broadcast arriving mid-fetch can otherwise
      // land in both the live insert and the page.
      const seen = new Set(state.messages.map(m => String(m.getId())));
      const merged = [...state.messages];
      action.messages.forEach(m => {
        if (!seen.has(String(m.getId()))) {
          seen.add(String(m.getId()));
          merged.push(m);
        }
      });
      return {
        ...state,
        messages: merged,
        hasMore: action.hasMore,
        fetchState: merged.length === 0 ? 'empty' : 'loaded',
      };
    }

    case 'FETCH_ERROR': {
      return {
        ...state,
        fetchState: state.messages.length === 0 ? 'error' : state.fetchState,
        error: action.error,
      };
    }

    case 'MESSAGE_PINNED': {
      // A list that failed to load has an unknown set of pins; a realtime pin must
      // not turn an error state into a partial one-item list. Only append once the
      // list has actually loaded (or is empty/loading).
      if (state.fetchState === 'error') return state;

      const id = String(action.message.getId());
      if (state.messages.some(m => String(m.getId()) === id)) return state;

      // Placed by `pinnedAt` DESC rather than prepended. A fresh pin has the
      // newest timestamp and still lands on top, but a message arriving with an
      // OLDER one keeps its rightful slot — which is what a failed unpin does:
      // it reverts to the original pinnedAt and republishes, and a blind prepend
      // would jump the row to the top of a list nothing had actually changed in.
      const pinnedAtOf = (message: CometChat.BaseMessage): number => message.getPinnedAt() ?? 0;

      const incomingPinnedAt = pinnedAtOf(action.message);
      const index = state.messages.findIndex(m => pinnedAtOf(m) <= incomingPinnedAt);
      const at = index === -1 ? state.messages.length : index;

      return {
        ...state,
        messages: [...state.messages.slice(0, at), action.message, ...state.messages.slice(at)],
        fetchState: 'loaded',
      };
    }

    case 'REMOVE_MESSAGE': {
      const remaining = state.messages.filter(m => String(m.getId()) !== action.messageId);
      if (remaining.length === state.messages.length) return state;
      return {
        ...state,
        messages: remaining,
        // Empty in place — the panel must not close itself.
        fetchState: remaining.length === 0 ? 'empty' : state.fetchState,
      };
    }

    /**
     * Replace a row in place. Position is preserved deliberately: an edit must not reorder a list ordered by pinnedAt.
     */
    case 'MESSAGE_UPDATED': {
      const id = String(action.message.getId());
      const index = state.messages.findIndex(m => String(m.getId()) === id);
      // Not on this surface — nothing to update, and nothing to insert either.
      if (index === -1) return state;

      const previous = state.messages[index];
      if (!previous) return state;

      // A content update makes no promise about pin/save attributes, and losing
      // them would blank the row's indicators. A pin/save event, by contrast, is
      // authoritative — it has to be able to CLEAR them, or an unsave would be
      // undone right here.
      //
      // Applied to a CLONE, not to `action.message`: every caller already hands
      // us a fresh `cloneMessage(...)`, but a reducer that writes to its own
      // action is not replayable and StrictMode runs this twice.
      let incoming = action.message;
      if (!action.pinSaveAuthoritative) {
        incoming = cloneMessage(incoming);
        carryPinSaveForward(previous, incoming);
      }

      const next = [...state.messages];
      next[index] = incoming;
      return { ...state, messages: next };
    }

    case 'RESET':
      return initialPinnedMessagesState;

    default:
      return state;
  }
}
