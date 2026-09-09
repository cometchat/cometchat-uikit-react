import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { carryPinSaveForward } from '../../utils/pinSaveUtils';
import { cloneMessage } from '../CometChatMessageList/CometChatMessageList.utils';
import type {
  CometChatSavedMessagesAction,
  CometChatSavedMessagesState,
} from './CometChatSavedMessages.types';

export const initialSavedMessagesState: CometChatSavedMessagesState = {
  messages: [],
  fetchState: 'idle',
  hasMore: true,
  error: null,
};

/**
 * Newest message first, by when it was *sent* — not by when it was saved. Saving
 * is a bookkeeping act; the list is still a list of messages, so a reply from this
 * morning saved a moment ago belongs above one from last year saved before it.
 *
 * The API paginates by `savedAt`, so ordering has to be re-established here on
 * every merge — a later page can legitimately contain a message newer than
 * anything on the first page, and the list will visibly re-order as it pages.
 */
function sentAtDesc(a: CometChat.BaseMessage, b: CometChat.BaseMessage): number {
  // Guarded: a message reaching the reducer over the socket is not guaranteed to
  // be a fully hydrated SDK instance, and an ordering helper must never throw.
  const at = typeof a.getSentAt === 'function' ? a.getSentAt() : 0;
  const bt = typeof b.getSentAt === 'function' ? b.getSentAt() : 0;
  if (bt !== at) return bt - at;
  // Stable tie-break so equal timestamps don't shuffle between renders.
  return b.getId() - a.getId();
}

export function savedMessagesReducer(
  state: CometChatSavedMessagesState,
  action: CometChatSavedMessagesAction
): CometChatSavedMessagesState {
  switch (action.type) {
    case 'FETCH_START': {
      return {
        ...state,
        fetchState: state.messages.length === 0 ? 'loading' : state.fetchState,
        error: null,
      };
    }

    case 'FETCH_SUCCESS': {
      // De-duplicate on merge: a save arriving over the socket mid-fetch can
      // otherwise land in both the optimistic insert and the page.
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
        messages: merged.sort(sentAtDesc),
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

    case 'MESSAGE_SAVED': {
      // A list that failed to load must not be turned into a partial one-item list
      // by a realtime save. Only append once the list has actually loaded.
      if (state.fetchState === 'error') return state;

      const id = String(action.message.getId());
      if (state.messages.some(m => String(m.getId()) === id)) return state;
      // Insert by sentAt, not at the top: saving an old message must not make it
      // look like the most recent one.
      const next = [...state.messages, action.message].sort(sentAtDesc);
      return {
        ...state,
        messages: next,
        fetchState: 'loaded',
      };
    }

    case 'REMOVE_MESSAGE': {
      const remaining = state.messages.filter(m => String(m.getId()) !== action.messageId);
      if (remaining.length === state.messages.length) return state;
      return {
        ...state,
        messages: remaining,
        // Empty in place rather than closing the surface.
        fetchState: remaining.length === 0 ? 'empty' : state.fetchState,
      };
    }

    /**
     * Replace a row in place. Position is preserved deliberately: editing a message does not change when it was sent.
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
      return initialSavedMessagesState;

    default:
      return state;
  }
}
