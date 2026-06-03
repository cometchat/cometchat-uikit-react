import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatReactionListFetchState } from './CometChatReactionList.types';

/** Groups a flat list of reactions by emoji. */
function groupByEmoji(reactions: CometChat.Reaction[]): Map<string, CometChat.Reaction[]> {
  const map = new Map<string, CometChat.Reaction[]>();
  for (const reaction of reactions) {
    const emoji = reaction.getReaction();
    const existing = map.get(emoji) ?? [];
    map.set(emoji, [...existing, reaction]);
  }
  return map;
}

/** State for the CometChatReactionList component. */
export interface CometChatReactionListState {
  /** All reactions fetched so far (flat list). */
  allReactions: CometChat.Reaction[];
  /** Reactions grouped by emoji. */
  groupedReactions: Map<string, CometChat.Reaction[]>;
  /** Currently selected emoji filter. null = "All". */
  selectedEmoji: string | null;
  /** Fetch state. */
  fetchState: CometChatReactionListFetchState;
  /** Whether more reactions can be fetched. */
  hasMore: boolean;
  /** Whether a fetch is in progress. */
  isFetching: boolean;
}

/** Actions for the reaction list reducer. */
export type CometChatReactionListAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; reactions: CometChat.Reaction[]; hasMore: boolean }
  | { type: 'FETCH_ERROR' }
  | { type: 'SELECT_EMOJI'; emoji: string | null }
  | { type: 'REMOVE_REACTION'; reactionId: string }
  | { type: 'RESET' };

export const initialReactionListState: CometChatReactionListState = {
  allReactions: [],
  groupedReactions: new Map(),
  selectedEmoji: null,
  fetchState: 'idle',
  hasMore: true,
  isFetching: false,
};

/** Reducer for CometChatReactionList state. Pure function — no side effects. */
export function reactionListReducer(
  state: CometChatReactionListState,
  action: CometChatReactionListAction
): CometChatReactionListState {
  switch (action.type) {
    case 'FETCH_START':
      return {
        ...state,
        isFetching: true,
        // Only set fetchState to loading if we have no data yet
        fetchState: state.allReactions.length === 0 ? 'loading' : state.fetchState,
      };

    case 'FETCH_SUCCESS': {
      const merged = [...state.allReactions, ...action.reactions];
      const grouped = groupByEmoji(merged);
      return {
        ...state,
        allReactions: merged,
        groupedReactions: grouped,
        fetchState: merged.length === 0 ? 'empty' : 'loaded',
        hasMore: action.hasMore,
        isFetching: false,
      };
    }

    case 'FETCH_ERROR':
      return {
        ...state,
        fetchState: 'error',
        isFetching: false,
      };

    case 'SELECT_EMOJI':
      return {
        ...state,
        selectedEmoji: action.emoji,
      };

    case 'REMOVE_REACTION': {
      const filtered = state.allReactions.filter(r => {
        // Match by reactedBy UID + emoji (SDK reactions don't have a unique ID)
        const key = `${r.getReactedBy().getUid()}-${r.getReaction()}`;
        return key !== action.reactionId;
      });
      const grouped = groupByEmoji(filtered);
      return {
        ...state,
        allReactions: filtered,
        groupedReactions: grouped,
        fetchState: filtered.length === 0 ? 'empty' : state.fetchState,
      };
    }

    case 'RESET':
      return initialReactionListState;

    default:
      return state;
  }
}
