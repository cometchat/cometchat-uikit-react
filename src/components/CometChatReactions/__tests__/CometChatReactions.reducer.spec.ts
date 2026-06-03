import { describe, it, expect } from 'vitest';
import {
  reactionsReducer,
  initialState,
  type CometChatReactionsState,
  type CometChatReactionsAction,
} from '../CometChatReactions.reducer';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Build a mock ReactionCount object matching the SDK shape. */
function buildReactionCount(emoji: string, count: number, reactedByMe = false) {
  return {
    getReaction: () => emoji,
    getCount: () => count,
    getReactedByMe: () => reactedByMe,
  } as never;
}

/** Build a mock Reaction (reactor detail) object. */
function buildReaction(emoji: string, uid: string, name: string) {
  return {
    getReaction: () => emoji,
    getReactedBy: () => ({
      getUid: () => uid,
      getName: () => name,
      getAvatar: () => `https://example.com/${uid}.png`,
    }),
  } as never;
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('reactionsReducer', () => {
  // ─── Initial state ────────────────────────────────────────────────

  it('has correct initial state', () => {
    expect(initialState).toEqual({
      reactions: [],
      activeTab: 'all',
      reactors: {},
      reactorsFetchState: 'idle',
      reactorsHasMore: true,
    });
  });

  // ─── SET_REACTIONS ────────────────────────────────────────────────

  describe('SET_REACTIONS', () => {
    it('sets the reactions array', () => {
      const reactions = [buildReactionCount('👍', 3), buildReactionCount('❤️', 1)];
      const next = reactionsReducer(initialState, {
        type: 'SET_REACTIONS',
        reactions,
      });
      expect(next.reactions).toBe(reactions);
      expect(next.reactions).toHaveLength(2);
    });

    it('replaces existing reactions', () => {
      const prev: CometChatReactionsState = {
        ...initialState,
        reactions: [buildReactionCount('😂', 5)],
      };
      const newReactions = [buildReactionCount('🎉', 2)];
      const next = reactionsReducer(prev, {
        type: 'SET_REACTIONS',
        reactions: newReactions,
      });
      expect(next.reactions).toBe(newReactions);
    });

    it('preserves other state fields', () => {
      const prev: CometChatReactionsState = {
        ...initialState,
        activeTab: '👍',
        reactorsFetchState: 'loaded',
      };
      const next = reactionsReducer(prev, {
        type: 'SET_REACTIONS',
        reactions: [],
      });
      expect(next.activeTab).toBe('👍');
      expect(next.reactorsFetchState).toBe('loaded');
    });
  });

  // ─── SET_REACTORS ─────────────────────────────────────────────────

  describe('SET_REACTORS', () => {
    it('stores reactors for a given emoji key', () => {
      const reactors = [buildReaction('👍', 'u1', 'Alice')];
      const next = reactionsReducer(initialState, {
        type: 'SET_REACTORS',
        emoji: '👍',
        reactors,
        hasMore: true,
      });
      expect(next.reactors['👍']).toBe(reactors);
      expect(next.reactorsHasMore).toBe(true);
    });

    it('sets fetchState to loaded when reactors are non-empty', () => {
      const reactors = [buildReaction('👍', 'u1', 'Alice')];
      const next = reactionsReducer(initialState, {
        type: 'SET_REACTORS',
        emoji: '👍',
        reactors,
        hasMore: false,
      });
      expect(next.reactorsFetchState).toBe('loaded');
    });

    it('sets fetchState to empty when reactors array is empty', () => {
      const next = reactionsReducer(initialState, {
        type: 'SET_REACTORS',
        emoji: '👍',
        reactors: [],
        hasMore: false,
      });
      expect(next.reactorsFetchState).toBe('empty');
      expect(next.reactorsHasMore).toBe(false);
    });

    it('preserves reactors for other emoji keys', () => {
      const prev: CometChatReactionsState = {
        ...initialState,
        reactors: { '❤️': [buildReaction('❤️', 'u2', 'Bob')] },
      };
      const thumbsReactors = [buildReaction('👍', 'u1', 'Alice')];
      const next = reactionsReducer(prev, {
        type: 'SET_REACTORS',
        emoji: '👍',
        reactors: thumbsReactors,
        hasMore: true,
      });
      expect(next.reactors['❤️']).toHaveLength(1);
      expect(next.reactors['👍']).toBe(thumbsReactors);
    });
  });

  // ─── APPEND_REACTORS ──────────────────────────────────────────────

  describe('APPEND_REACTORS', () => {
    it('appends reactors to existing list for the emoji', () => {
      const existing = [buildReaction('👍', 'u1', 'Alice')];
      const prev: CometChatReactionsState = {
        ...initialState,
        reactors: { '👍': existing },
      };
      const newReactors = [buildReaction('👍', 'u2', 'Bob')];
      const next = reactionsReducer(prev, {
        type: 'APPEND_REACTORS',
        emoji: '👍',
        reactors: newReactors,
        hasMore: false,
      });
      expect(next.reactors['👍']).toHaveLength(2);
      expect(next.reactorsHasMore).toBe(false);
      expect(next.reactorsFetchState).toBe('loaded');
    });

    it('creates a new list when no existing reactors for the emoji', () => {
      const newReactors = [buildReaction('🎉', 'u1', 'Alice')];
      const next = reactionsReducer(initialState, {
        type: 'APPEND_REACTORS',
        emoji: '🎉',
        reactors: newReactors,
        hasMore: true,
      });
      expect(next.reactors['🎉']).toHaveLength(1);
    });

    it('sets fetchState to loaded', () => {
      const next = reactionsReducer(initialState, {
        type: 'APPEND_REACTORS',
        emoji: '👍',
        reactors: [],
        hasMore: false,
      });
      expect(next.reactorsFetchState).toBe('loaded');
    });
  });

  // ─── SET_FETCH_STATE ──────────────────────────────────────────────

  describe('SET_FETCH_STATE', () => {
    it('sets reactorsFetchState to loading', () => {
      const next = reactionsReducer(initialState, {
        type: 'SET_FETCH_STATE',
        fetchState: 'loading',
      });
      expect(next.reactorsFetchState).toBe('loading');
    });

    it('sets reactorsFetchState to error', () => {
      const next = reactionsReducer(initialState, {
        type: 'SET_FETCH_STATE',
        fetchState: 'error',
      });
      expect(next.reactorsFetchState).toBe('error');
    });

    it('preserves other state fields', () => {
      const prev: CometChatReactionsState = {
        ...initialState,
        reactions: [buildReactionCount('👍', 3)],
        activeTab: '👍',
      };
      const next = reactionsReducer(prev, {
        type: 'SET_FETCH_STATE',
        fetchState: 'loading',
      });
      expect(next.reactions).toBe(prev.reactions);
      expect(next.activeTab).toBe('👍');
    });
  });

  // ─── SET_ACTIVE_TAB ───────────────────────────────────────────────

  describe('SET_ACTIVE_TAB', () => {
    it('sets the active tab', () => {
      const next = reactionsReducer(initialState, {
        type: 'SET_ACTIVE_TAB',
        tab: '👍',
      });
      expect(next.activeTab).toBe('👍');
    });

    it('resets reactorsFetchState to idle when no cached data for tab', () => {
      const prev: CometChatReactionsState = {
        ...initialState,
        reactorsFetchState: 'loaded',
      };
      const next = reactionsReducer(prev, {
        type: 'SET_ACTIVE_TAB',
        tab: '❤️',
      });
      expect(next.reactorsFetchState).toBe('idle');
    });

    it('keeps reactorsFetchState as loaded when tab has cached data', () => {
      const prev: CometChatReactionsState = {
        ...initialState,
        reactorsFetchState: 'loaded',
        reactors: { '❤️': [buildReaction('❤️', 'u1', 'Alice')] },
      };
      const next = reactionsReducer(prev, {
        type: 'SET_ACTIVE_TAB',
        tab: '❤️',
      });
      expect(next.reactorsFetchState).toBe('loaded');
    });

    it('resets reactorsHasMore to true when tab has no cached data', () => {
      const prev: CometChatReactionsState = {
        ...initialState,
        reactorsHasMore: false,
      };
      const next = reactionsReducer(prev, {
        type: 'SET_ACTIVE_TAB',
        tab: 'all',
      });
      expect(next.reactorsHasMore).toBe(true);
    });

    it('preserves reactorsHasMore when tab has cached data', () => {
      const prev: CometChatReactionsState = {
        ...initialState,
        reactorsHasMore: false,
        reactors: { '👍': [buildReaction('👍', 'u1', 'Alice')] },
      };
      const next = reactionsReducer(prev, {
        type: 'SET_ACTIVE_TAB',
        tab: '👍',
      });
      expect(next.reactorsHasMore).toBe(false);
    });

    it('preserves existing reactors data', () => {
      const prev: CometChatReactionsState = {
        ...initialState,
        reactors: { '👍': [buildReaction('👍', 'u1', 'Alice')] },
      };
      const next = reactionsReducer(prev, {
        type: 'SET_ACTIVE_TAB',
        tab: '❤️',
      });
      expect(next.reactors['👍']).toHaveLength(1);
    });
  });

  // ─── RESET ────────────────────────────────────────────────────────

  describe('RESET', () => {
    it('returns initial state regardless of current state', () => {
      const prev: CometChatReactionsState = {
        reactions: [buildReactionCount('👍', 5)],
        activeTab: '👍',
        reactors: { '👍': [buildReaction('👍', 'u1', 'Alice')] },
        reactorsFetchState: 'loaded',
        reactorsHasMore: false,
      };
      const next = reactionsReducer(prev, { type: 'RESET' });
      expect(next).toEqual(initialState);
    });
  });

  // ─── Unknown action ───────────────────────────────────────────────

  describe('unknown action', () => {
    it('returns the current state for unknown action types', () => {
      const state = { ...initialState, activeTab: '👍' };
      const next = reactionsReducer(state, {
        type: 'UNKNOWN_ACTION',
      } as unknown as CometChatReactionsAction);
      expect(next).toBe(state);
    });
  });
});
