/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatFetchState } from '../../types';
import { CometChatUIKitUtility } from '../../utils/CometChatUIKitUtility';
import { CometChatConversationsManager } from './CometChatConversationsManager';
import {
  carryConversationPinForward,
  insertRespectingPinTiers,
  isConversationPinned,
  placeForNewActivity,
  repositionForPinChange,
  sortByPinTier,
} from './CometChatConversations.utils';
import {
  applyFirstServerPage,
  applyNextServerPage,
  dedupeConversations,
  mergeFirstServerPage,
  reconcileSyncPage,
} from './conversationsOffline';
import { offlineListStates } from '../../utils/offline/entityList';

// ==================== State ====================

export interface CometChatConversationsState {
  /** List of fetched conversations. */
  conversations: CometChat.Conversation[];
  /** Current fetch lifecycle state. */
  fetchState: CometChatFetchState;
  /** Whether more pages are available. */
  hasMore: boolean;
  /** Error message (if fetchState is 'error'). */
  error: string | null;
  /** IDs of selected conversations. */
  selectedConversationIds: string[];
  /** Full conversation objects for selected conversations (persists across search). */
  selectedConversationsMap: Map<string, CometChat.Conversation>;
  /** Currently active/highlighted conversation ID. */
  activeConversationId: string | null;
  /** Current search text. */
  searchText: string;
  /** Offline: a keyword search could not reach the server; nothing saved (offline on only). */
  connectToSearch?: boolean;
  /** Offline: nothing saved and not connected (never set offline off). */
  connectToLoad?: boolean;
  /** Typing indicators keyed by user UID or group GUID. */
  typingIndicatorMap: Map<string, CometChat.TypingIndicator>;
}

// ==================== Actions ====================

export type CometChatConversationsAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; conversations: CometChat.Conversation[]; hasMore: boolean }
  | { type: 'FETCH_ERROR'; error: string }
  | { type: 'UPDATE_CONVERSATION'; conversation: CometChat.Conversation }
  | { type: 'REMOVE_CONVERSATION'; conversationId: string }
  | { type: 'MOVE_TO_TOP'; conversation: CometChat.Conversation }
  /** Pin state changed — re-band the conversation, or ignore it if not listed. */
  | { type: 'CONVERSATION_PIN_CHANGED'; conversation: CometChat.Conversation }
  /** Offline (ON) pin event matched by (type, with) to the listed row `targetId` (UIK-CONV-01). */
  | { type: 'OFFLINE_PIN_EVENT'; conversation: CometChat.Conversation; targetId: string }
  /** Offline (ON) pin event for a chat that was not on screen, fetched and inserted. */
  | { type: 'OFFLINE_PIN_INSERT'; conversation: CometChat.Conversation }
  | { type: 'ADD_CONVERSATION'; conversation: CometChat.Conversation }
  | { type: 'RESET_UNREAD_COUNT'; conversationId: string }
  | {
      type: 'UPDATE_LAST_MESSAGE_AND_PLACE_AT_TOP';
      message: CometChat.BaseMessage;
      group: CometChat.Group;
    }
  | { type: 'SET_SEARCH_TEXT'; searchText: string }
  | { type: 'SELECT_CONVERSATION'; conversation: CometChat.Conversation }
  | { type: 'DESELECT_CONVERSATION'; conversationId: string }
  | { type: 'SELECT_RANGE'; conversations: CometChat.Conversation[] }
  | { type: 'DESELECT_RANGE'; conversationIds: string[] }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SET_ACTIVE_CONVERSATION'; conversationId: string | null }
  | { type: 'ADD_TYPING_INDICATOR'; id: string; indicator: CometChat.TypingIndicator }
  | { type: 'REMOVE_TYPING_INDICATOR'; id: string }
  // --- Offline support (dispatched only with the SDK's offline support on) ---
  /** A page of a two-phase read: `cached` paints first, `server` replaces it. */
  | {
      type: 'OFFLINE_PAGE';
      phase: 'cached' | 'server';
      first: boolean;
      conversations: CometChat.Conversation[];
      /** Ids the cached page of this read showed (server phase of a later page). */
      cachedIds?: string[];
      /** The kit's own re-read of page one: its server page merges into the rows shown. */
      merge?: boolean;
    }
  /** A two-phase read ended without a server page. */
  | {
      type: 'OFFLINE_PAGE_ERROR';
      notConnected: boolean;
      error: string;
      hasMore: boolean;
      /** The read carried a search keyword (absent: no). */
      keyword?: boolean;
    }
  /** The SDK's catch-up sync page, reconciled on the plain list. */
  | { type: 'OFFLINE_SYNC_PAGE'; conversations: CometChat.Conversation[] }
  /** Reconnected after an offline read past the cache closed paging: open it again (R5). */
  | { type: 'OFFLINE_PAGING_REOPEN' }
  | { type: 'RESET' };

// ==================== Initial State ====================

export const initialConversationsState: CometChatConversationsState = {
  conversations: [],
  fetchState: 'idle',
  hasMore: true,
  error: null,
  selectedConversationIds: [],
  selectedConversationsMap: new Map(),
  activeConversationId: null,
  searchText: '',
  typingIndicatorMap: new Map(),
};

// ==================== Reducer ====================

export function conversationsReducer(
  state: CometChatConversationsState,
  action: CometChatConversationsAction
): CometChatConversationsState {
  switch (action.type) {
    case 'FETCH_START': {
      return {
        ...state,
        fetchState: state.conversations.length === 0 ? 'loading' : state.fetchState,
        error: null,
      };
    }

    case 'FETCH_SUCCESS': {
      // The server pin-orders each page, but a realtime insert between pages can
      // still leave the merged list out of band order — re-assert it.
      // A conversation moved to the top by a realtime event can also arrive on a
      // later page: keep the listed (fresher) row and drop the page's copy.
      const listedIds = new Set(state.conversations.map(c => c.getConversationId()));
      const pageIds = new Set<string>();
      const fresh = action.conversations.filter(c => {
        const id = c.getConversationId();
        if (listedIds.has(id) || pageIds.has(id)) return false;
        pageIds.add(id);
        return true;
      });
      const merged = sortByPinTier([...state.conversations, ...fresh]);
      const fetchState: CometChatFetchState = merged.length === 0 ? 'empty' : 'loaded';
      return {
        ...state,
        conversations: merged,
        fetchState,
        hasMore: action.hasMore,
      };
    }

    case 'FETCH_ERROR': {
      return {
        ...state,
        fetchState: state.conversations.length === 0 ? 'error' : state.fetchState,
        error: action.error,
      };
    }

    case 'UPDATE_CONVERSATION': {
      const convId = action.conversation.getConversationId();
      const idx = state.conversations.findIndex(c => c.getConversationId() === convId);
      if (idx === -1) return state;

      // Create a new array with the updated conversation to force re-render
      const updatedConversations = [...state.conversations];
      updatedConversations[idx] = action.conversation;
      return {
        ...state,
        conversations: updatedConversations,
      };
    }

    case 'REMOVE_CONVERSATION': {
      const filtered = state.conversations.filter(
        c => c.getConversationId() !== action.conversationId
      );
      if (filtered.length === state.conversations.length) return state;
      return {
        ...state,
        conversations: filtered,
        fetchState: filtered.length === 0 ? 'empty' : state.fetchState,
      };
    }

    case 'MOVE_TO_TOP': {
      // Top of its OWN tier, not of the list: a message in an unpinned chat must
      // not jump above the pinned block.
      //
      // The incoming conversation is often rebuilt from a message and carries no
      // pin state, so it has to be taken from the listed row or a pinned chat
      // would fall out of its tier on every new message. Carried onto a CLONE
      // rather than onto `action.conversation`: a reducer that writes to its own
      // action is not replayable, and StrictMode invokes this twice.
      //
      // Only clones when there is something to carry — a message in an unpinned
      // chat, which is the overwhelming majority, takes the payload untouched.
      const existing = state.conversations.find(
        c => c.getConversationId() === action.conversation.getConversationId()
      );
      let incoming = action.conversation;
      if (existing && isConversationPinned(existing) && !isConversationPinned(incoming)) {
        incoming = CometChatUIKitUtility.clone(incoming);
        carryConversationPinForward(existing, incoming);
      }

      return {
        ...state,
        conversations: placeForNewActivity(state.conversations, incoming),
        fetchState: 'loaded',
      };
    }

    case 'ADD_CONVERSATION': {
      const convId = action.conversation.getConversationId();
      // Don't add if already exists
      const alreadyExists = state.conversations.some(c => c.getConversationId() === convId);
      if (alreadyExists) return state;
      // A brand-new conversation is unpinned, so it lands below every pin.
      return {
        ...state,
        conversations: insertRespectingPinTiers(state.conversations, action.conversation),
        fetchState: 'loaded',
      };
    }

    case 'CONVERSATION_PIN_CHANGED': {
      const convId = action.conversation.getConversationId();
      const existing = state.conversations.find(c => c.getConversationId() === convId);
      // Not on this page — the next fetch will place it correctly. Inserting here
      // would surface a conversation the user has not scrolled to.
      if (!existing) return state;

      // Carry the new pin attributes onto the listed object rather than swapping
      // it wholesale: the event payload is a Conversation built by the server and
      // may not carry the unread count or last message this row is showing.
      const merged = CometChatUIKitUtility.clone(existing);
      merged.setPinnedAt(action.conversation.getPinnedAt());
      merged.setPinnedBy(action.conversation.getPinnedBy());

      return {
        ...state,
        conversations: repositionForPinChange(state.conversations, merged),
      };
    }

    case 'OFFLINE_PIN_EVENT': {
      const existing = state.conversations.find(
        c => c.getConversationId() === action.targetId
      );
      if (!existing) return state;
      // As CONVERSATION_PIN_CHANGED: only the pin attributes move onto the row.
      const merged = CometChatUIKitUtility.clone(existing);
      merged.setPinnedAt(action.conversation.getPinnedAt());
      merged.setPinnedBy(action.conversation.getPinnedBy());
      return {
        ...state,
        conversations: repositionForPinChange(state.conversations, merged),
      };
    }

    case 'OFFLINE_PIN_INSERT': {
      const convId = action.conversation.getConversationId();
      if (state.conversations.some(c => c.getConversationId() === convId)) return state;
      return {
        ...state,
        conversations: repositionForPinChange(state.conversations, action.conversation),
        fetchState: 'loaded',
      };
    }

    case 'RESET_UNREAD_COUNT': {
      const idx = state.conversations.findIndex(
        c => c.getConversationId() === action.conversationId
      );
      if (idx === -1) return state;

      const cloned = CometChatUIKitUtility.clone(state.conversations[idx]!);
      cloned.setUnreadMessageCount(0);

      const updatedConversations = [...state.conversations];
      updatedConversations[idx] = cloned;
      return {
        ...state,
        conversations: updatedConversations,
      };
    }

    case 'UPDATE_LAST_MESSAGE_AND_PLACE_AT_TOP': {
      const { group, message } = action;
      const targetConversationId = message.getConversationId();

      if (!CometChatConversationsManager.shouldLastMessageAndUnreadCountBeUpdated(message)) {
        return state;
      }

      const targetIdx = state.conversations.findIndex(
        conv => conv.getConversationId() === targetConversationId
      );
      if (targetIdx === -1) return state;

      const newConv = CometChatUIKitUtility.clone(state.conversations[targetIdx]!);
      newConv.setConversationWith(group);
      newConv.setLastMessage(message);

      return {
        ...state,
        conversations: placeForNewActivity(state.conversations, newConv),
      };
    }

    case 'SET_SEARCH_TEXT': {
      return {
        ...state,
        searchText: action.searchText,
      };
    }

    case 'SELECT_CONVERSATION': {
      const convId = action.conversation.getConversationId();
      if (state.selectedConversationIds.includes(convId)) return state;

      const newMap = new Map(state.selectedConversationsMap);
      newMap.set(convId, action.conversation);
      return {
        ...state,
        selectedConversationIds: [...state.selectedConversationIds, convId],
        selectedConversationsMap: newMap,
      };
    }

    case 'DESELECT_CONVERSATION': {
      if (!state.selectedConversationIds.includes(action.conversationId)) return state;

      const newMap = new Map(state.selectedConversationsMap);
      newMap.delete(action.conversationId);
      return {
        ...state,
        selectedConversationIds: state.selectedConversationIds.filter(
          id => id !== action.conversationId
        ),
        selectedConversationsMap: newMap,
      };
    }

    case 'SELECT_RANGE': {
      const newIds = action.conversations
        .map(c => c.getConversationId())
        .filter(id => !state.selectedConversationIds.includes(id));

      if (newIds.length === 0) return state;

      const newMap = new Map(state.selectedConversationsMap);
      action.conversations.forEach(c => {
        newMap.set(c.getConversationId(), c);
      });

      return {
        ...state,
        selectedConversationIds: [...state.selectedConversationIds, ...newIds],
        selectedConversationsMap: newMap,
      };
    }

    case 'DESELECT_RANGE': {
      const idsToRemove = new Set(action.conversationIds);
      const newMap = new Map(state.selectedConversationsMap);
      action.conversationIds.forEach(id => newMap.delete(id));

      return {
        ...state,
        selectedConversationIds: state.selectedConversationIds.filter(id => !idsToRemove.has(id)),
        selectedConversationsMap: newMap,
      };
    }

    case 'CLEAR_SELECTION': {
      return {
        ...state,
        selectedConversationIds: [],
        selectedConversationsMap: new Map(),
      };
    }

    case 'SET_ACTIVE_CONVERSATION': {
      return {
        ...state,
        activeConversationId: action.conversationId,
      };
    }

    case 'ADD_TYPING_INDICATOR': {
      const newMap = new Map(state.typingIndicatorMap);
      newMap.set(action.id, action.indicator);
      return { ...state, typingIndicatorMap: newMap };
    }

    case 'REMOVE_TYPING_INDICATOR': {
      if (!state.typingIndicatorMap.has(action.id)) return state;
      const newMap = new Map(state.typingIndicatorMap);
      newMap.delete(action.id);
      return { ...state, typingIndicatorMap: newMap };
    }

    case 'OFFLINE_PAGE': {
      let conversations: CometChat.Conversation[];
      if (action.phase === 'cached') {
        conversations = dedupeConversations([...state.conversations, ...action.conversations]);
      } else if (action.first && action.merge) {
        conversations = mergeFirstServerPage(
          state.conversations,
          new Set(action.cachedIds ?? []),
          action.conversations
        );
      } else if (action.first) {
        conversations = applyFirstServerPage(state.conversations, action.conversations);
      } else {
        conversations = applyNextServerPage(
          state.conversations,
          new Set(action.cachedIds ?? []),
          action.conversations
        );
      }
      const sorted = sortByPinTier(conversations);
      const isServer = action.phase === 'server';
      return {
        ...state,
        conversations: sorted,
        // A cached page, even empty, never ends the list; only a server one does.
        fetchState: sorted.length > 0 ? 'loaded' : isServer ? 'empty' : state.fetchState,
        hasMore: isServer ? action.conversations.length > 0 : state.hasMore,
        ...(isServer && { error: null, connectToSearch: false, connectToLoad: false }),
      };
    }

    case 'OFFLINE_PAGE_ERROR': {
      const none = state.conversations.length === 0;
      const offline = offlineListStates(
        action.notConnected,
        action.keyword === true,
        state.conversations.length
      );
      if (action.notConnected) {
        // Offline past the cache: keep the saved chats. With none: "Connect to search" for a
        // keyword (an empty state, no error), else the error state worded "Connect to load".
        return {
          ...state,
          fetchState: !none ? 'loaded' : action.keyword === true ? 'empty' : 'error',
          hasMore: action.hasMore,
          ...(none && action.keyword !== true && { error: action.error }),
          ...offline,
        };
      }
      return {
        ...state,
        fetchState: none ? 'error' : state.fetchState,
        error: action.error,
        ...offline,
      };
    }

    case 'OFFLINE_SYNC_PAGE': {
      const conversations = sortByPinTier(
        reconcileSyncPage(state.conversations, action.conversations)
      );
      return {
        ...state,
        conversations,
        fetchState: conversations.length === 0 ? state.fetchState : 'loaded',
      };
    }

    case 'OFFLINE_PAGING_REOPEN': {
      return state.hasMore ? state : { ...state, hasMore: true };
    }

    case 'RESET': {
      // Preserve selection across resets (search, reconnect)
      return {
        ...initialConversationsState,
        selectedConversationIds: state.selectedConversationIds,
        selectedConversationsMap: state.selectedConversationsMap,
        activeConversationId: state.activeConversationId,
        searchText: state.searchText,
      };
    }

    default: {
      return state;
    }
  }
}
