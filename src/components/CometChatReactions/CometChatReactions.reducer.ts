import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatReactionsFetchState } from './CometChatReactions.types';

/** State for the CometChatReactions component. */
export interface CometChatReactionsState {
  /** Reaction counts from the message. */
  reactions: CometChat.ReactionCount[];
  /** Active tab in the reactor list ('all' or emoji string). */
  activeTab: string;
  /** Reactor details keyed by emoji or 'all'. */
  reactors: Record<string, CometChat.Reaction[]>;
  /** Fetch state for reactor details. */
  reactorsFetchState: CometChatReactionsFetchState;
  /** Whether more reactors can be fetched for the active tab. */
  reactorsHasMore: boolean;
}

/** Actions for the reactions reducer. */
export type CometChatReactionsAction =
  | { type: 'SET_REACTIONS'; reactions: CometChat.ReactionCount[] }
  | {
      type: 'SET_REACTORS';
      emoji: string;
      reactors: CometChat.Reaction[];
      hasMore: boolean;
    }
  | {
      type: 'APPEND_REACTORS';
      emoji: string;
      reactors: CometChat.Reaction[];
      hasMore: boolean;
    }
  | { type: 'REMOVE_REACTOR'; uid: string; emoji: string }
  | { type: 'SET_FETCH_STATE'; fetchState: CometChatReactionsFetchState }
  | { type: 'SET_ACTIVE_TAB'; tab: string }
  | { type: 'RESET' };

export const initialState: CometChatReactionsState = {
  reactions: [],
  activeTab: 'all',
  reactors: {},
  reactorsFetchState: 'idle',
  reactorsHasMore: true,
};

/** Reducer for CometChatReactions state. Pure function — no side effects. */
export function reactionsReducer(
  state: CometChatReactionsState,
  action: CometChatReactionsAction
): CometChatReactionsState {
  switch (action.type) {
    case 'SET_REACTIONS':
      return { ...state, reactions: action.reactions };

    case 'SET_REACTORS':
      return {
        ...state,
        reactors: { ...state.reactors, [action.emoji]: action.reactors },
        reactorsFetchState: action.reactors.length === 0 ? 'empty' : 'loaded',
        reactorsHasMore: action.hasMore,
      };

    case 'APPEND_REACTORS': {
      const existing = state.reactors[action.emoji] ?? [];
      // Deduplicate by uid+emoji to prevent double-appending from race conditions
      const existingKeys = new Set(
        existing.map(r => `${r.getReactedBy().getUid()}-${r.getReaction()}`)
      );
      const newReactors = action.reactors.filter(r => {
        const key = `${r.getReactedBy().getUid()}-${r.getReaction()}`;
        return !existingKeys.has(key);
      });
      return {
        ...state,
        reactors: {
          ...state.reactors,
          [action.emoji]: [...existing, ...newReactors],
        },
        reactorsFetchState: 'loaded',
        reactorsHasMore: action.hasMore,
      };
    }

    case 'SET_FETCH_STATE':
      return { ...state, reactorsFetchState: action.fetchState };

    case 'REMOVE_REACTOR': {
      // Remove the reactor from all cached tab lists
      const updatedReactors: Record<string, CometChat.Reaction[]> = {};
      for (const [key, list] of Object.entries(state.reactors)) {
        updatedReactors[key] = list.filter(
          r => !(r.getReactedBy().getUid() === action.uid && r.getReaction() === action.emoji)
        );
      }
      return {
        ...state,
        reactors: updatedReactors,
      };
    }

    case 'SET_ACTIVE_TAB': {
      // When switching to a tab that already has cached data, preserve its hasMore state.
      // Don't blindly reset reactorsHasMore to true — that causes re-fetches of page 1.
      const hasCachedData = (state.reactors[action.tab]?.length ?? 0) > 0;
      return {
        ...state,
        activeTab: action.tab,
        // Only set idle if no cached data; otherwise keep loaded to avoid shimmer flash
        reactorsFetchState: hasCachedData ? 'loaded' : 'idle',
        // Don't reset hasMore if we have cached data — it was already set correctly
        reactorsHasMore: hasCachedData ? state.reactorsHasMore : true,
      };
    }

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}
