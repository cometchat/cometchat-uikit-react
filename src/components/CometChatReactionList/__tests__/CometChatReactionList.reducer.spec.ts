import { describe, it, expect } from 'vitest';
import {
  reactionListReducer,
  initialReactionListState,
  type CometChatReactionListState,
  type CometChatReactionListAction,
} from '../CometChatReactionList.reducer';
import type { CometChat } from '@cometchat/chat-sdk-javascript';

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildReaction(emoji: string, uid: string, name: string): CometChat.Reaction {
  return {
    getReaction: () => emoji,
    getReactedBy: () => ({
      getUid: () => uid,
      getName: () => name,
      getAvatar: () => `https://example.com/${uid}.png`,
    }),
    getMessageId: () => 1,
  } as unknown as CometChat.Reaction;
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('reactionListReducer', () => {
  // ─── Initial state ────────────────────────────────────────────────

  it('has correct initial state', () => {
    expect(initialReactionListState).toMatchObject({
      allReactions: [],
      selectedEmoji: null,
      fetchState: 'idle',
      hasMore: true,
      isFetching: false,
    });
    expect(initialReactionListState.groupedReactions).toBeInstanceOf(Map);
    expect(initialReactionListState.groupedReactions.size).toBe(0);
  });

  // ─── FETCH_START ──────────────────────────────────────────────────

  describe('FETCH_START', () => {
    it('sets isFetching to true', () => {
      const next = reactionListReducer(initialReactionListState, { type: 'FETCH_START' });
      expect(next.isFetching).toBe(true);
    });

    it('sets fetchState to loading when allReactions is empty', () => {
      const next = reactionListReducer(initialReactionListState, { type: 'FETCH_START' });
      expect(next.fetchState).toBe('loading');
    });

    it('preserves fetchState when allReactions is non-empty (pagination)', () => {
      const prev: CometChatReactionListState = {
        ...initialReactionListState,
        allReactions: [buildReaction('👍', 'u1', 'Alice')],
        fetchState: 'loaded',
      };
      const next = reactionListReducer(prev, { type: 'FETCH_START' });
      expect(next.fetchState).toBe('loaded');
      expect(next.isFetching).toBe(true);
    });
  });

  // ─── FETCH_SUCCESS ────────────────────────────────────────────────

  describe('FETCH_SUCCESS', () => {
    it('appends reactions to allReactions', () => {
      const reactions = [buildReaction('👍', 'u1', 'Alice'), buildReaction('❤️', 'u2', 'Bob')];
      const next = reactionListReducer(initialReactionListState, {
        type: 'FETCH_SUCCESS',
        reactions,
        hasMore: false,
      });
      expect(next.allReactions).toHaveLength(2);
    });

    it('groups reactions by emoji', () => {
      const reactions = [
        buildReaction('👍', 'u1', 'Alice'),
        buildReaction('👍', 'u2', 'Bob'),
        buildReaction('❤️', 'u3', 'Charlie'),
      ];
      const next = reactionListReducer(initialReactionListState, {
        type: 'FETCH_SUCCESS',
        reactions,
        hasMore: false,
      });
      expect(next.groupedReactions.get('👍')).toHaveLength(2);
      expect(next.groupedReactions.get('❤️')).toHaveLength(1);
    });

    it('sets fetchState to loaded when reactions are non-empty', () => {
      const reactions = [buildReaction('👍', 'u1', 'Alice')];
      const next = reactionListReducer(initialReactionListState, {
        type: 'FETCH_SUCCESS',
        reactions,
        hasMore: false,
      });
      expect(next.fetchState).toBe('loaded');
    });

    it('sets fetchState to empty when reactions array is empty', () => {
      const next = reactionListReducer(initialReactionListState, {
        type: 'FETCH_SUCCESS',
        reactions: [],
        hasMore: false,
      });
      expect(next.fetchState).toBe('empty');
    });

    it('sets hasMore correctly', () => {
      const reactions = [buildReaction('👍', 'u1', 'Alice')];
      const next = reactionListReducer(initialReactionListState, {
        type: 'FETCH_SUCCESS',
        reactions,
        hasMore: true,
      });
      expect(next.hasMore).toBe(true);
    });

    it('sets isFetching to false', () => {
      const prev: CometChatReactionListState = {
        ...initialReactionListState,
        isFetching: true,
      };
      const next = reactionListReducer(prev, {
        type: 'FETCH_SUCCESS',
        reactions: [],
        hasMore: false,
      });
      expect(next.isFetching).toBe(false);
    });

    it('appends to existing reactions on pagination', () => {
      const existing = [buildReaction('👍', 'u1', 'Alice')];
      const prev: CometChatReactionListState = {
        ...initialReactionListState,
        allReactions: existing,
        groupedReactions: new Map([['👍', existing]]),
        fetchState: 'loaded',
      };
      const newReactions = [buildReaction('👍', 'u2', 'Bob')];
      const next = reactionListReducer(prev, {
        type: 'FETCH_SUCCESS',
        reactions: newReactions,
        hasMore: false,
      });
      expect(next.allReactions).toHaveLength(2);
      expect(next.groupedReactions.get('👍')).toHaveLength(2);
    });
  });

  // ─── FETCH_ERROR ──────────────────────────────────────────────────

  describe('FETCH_ERROR', () => {
    it('sets fetchState to error', () => {
      const next = reactionListReducer(initialReactionListState, { type: 'FETCH_ERROR' });
      expect(next.fetchState).toBe('error');
    });

    it('sets isFetching to false', () => {
      const prev: CometChatReactionListState = {
        ...initialReactionListState,
        isFetching: true,
      };
      const next = reactionListReducer(prev, { type: 'FETCH_ERROR' });
      expect(next.isFetching).toBe(false);
    });

    it('preserves existing reactions', () => {
      const reactions = [buildReaction('👍', 'u1', 'Alice')];
      const prev: CometChatReactionListState = {
        ...initialReactionListState,
        allReactions: reactions,
      };
      const next = reactionListReducer(prev, { type: 'FETCH_ERROR' });
      expect(next.allReactions).toBe(reactions);
    });
  });

  // ─── SELECT_EMOJI ─────────────────────────────────────────────────

  describe('SELECT_EMOJI', () => {
    it('sets selectedEmoji to the given emoji', () => {
      const next = reactionListReducer(initialReactionListState, {
        type: 'SELECT_EMOJI',
        emoji: '👍',
      });
      expect(next.selectedEmoji).toBe('👍');
    });

    it('sets selectedEmoji to null for "All" tab', () => {
      const prev: CometChatReactionListState = {
        ...initialReactionListState,
        selectedEmoji: '👍',
      };
      const next = reactionListReducer(prev, { type: 'SELECT_EMOJI', emoji: null });
      expect(next.selectedEmoji).toBeNull();
    });

    it('preserves other state fields', () => {
      const reactions = [buildReaction('👍', 'u1', 'Alice')];
      const prev: CometChatReactionListState = {
        ...initialReactionListState,
        allReactions: reactions,
        fetchState: 'loaded',
      };
      const next = reactionListReducer(prev, { type: 'SELECT_EMOJI', emoji: '👍' });
      expect(next.allReactions).toBe(reactions);
      expect(next.fetchState).toBe('loaded');
    });
  });

  // ─── REMOVE_REACTION ──────────────────────────────────────────────

  describe('REMOVE_REACTION', () => {
    it('removes the reaction matching the reactionId', () => {
      const reactions = [buildReaction('👍', 'u1', 'Alice'), buildReaction('👍', 'u2', 'Bob')];
      const prev: CometChatReactionListState = {
        ...initialReactionListState,
        allReactions: reactions,
        groupedReactions: new Map([['👍', reactions]]),
        fetchState: 'loaded',
      };
      // reactionId = uid-emoji
      const next = reactionListReducer(prev, {
        type: 'REMOVE_REACTION',
        reactionId: 'u1-👍',
      });
      expect(next.allReactions).toHaveLength(1);
      expect(next.allReactions[0]?.getReactedBy().getUid()).toBe('u2');
    });

    it('regroups reactions after removal', () => {
      const reactions = [buildReaction('👍', 'u1', 'Alice'), buildReaction('❤️', 'u1', 'Alice')];
      const prev: CometChatReactionListState = {
        ...initialReactionListState,
        allReactions: reactions,
        groupedReactions: new Map([
          ['👍', [reactions[0]!]],
          ['❤️', [reactions[1]!]],
        ]),
        fetchState: 'loaded',
      };
      const next = reactionListReducer(prev, {
        type: 'REMOVE_REACTION',
        reactionId: 'u1-👍',
      });
      expect(next.groupedReactions.has('👍')).toBe(false);
      expect(next.groupedReactions.get('❤️')).toHaveLength(1);
    });

    it('sets fetchState to empty when last reaction is removed', () => {
      const reactions = [buildReaction('👍', 'u1', 'Alice')];
      const prev: CometChatReactionListState = {
        ...initialReactionListState,
        allReactions: reactions,
        groupedReactions: new Map([['👍', reactions]]),
        fetchState: 'loaded',
      };
      const next = reactionListReducer(prev, {
        type: 'REMOVE_REACTION',
        reactionId: 'u1-👍',
      });
      expect(next.allReactions).toHaveLength(0);
      expect(next.fetchState).toBe('empty');
    });

    it('does nothing when reactionId does not match', () => {
      const reactions = [buildReaction('👍', 'u1', 'Alice')];
      const prev: CometChatReactionListState = {
        ...initialReactionListState,
        allReactions: reactions,
        groupedReactions: new Map([['👍', reactions]]),
        fetchState: 'loaded',
      };
      const next = reactionListReducer(prev, {
        type: 'REMOVE_REACTION',
        reactionId: 'u99-👍',
      });
      expect(next.allReactions).toHaveLength(1);
    });
  });

  // ─── RESET ────────────────────────────────────────────────────────

  describe('RESET', () => {
    it('returns initial state regardless of current state', () => {
      const prev: CometChatReactionListState = {
        allReactions: [buildReaction('👍', 'u1', 'Alice')],
        groupedReactions: new Map([['👍', [buildReaction('👍', 'u1', 'Alice')]]]),
        selectedEmoji: '👍',
        fetchState: 'loaded',
        hasMore: false,
        isFetching: false,
      };
      const next = reactionListReducer(prev, { type: 'RESET' });
      expect(next.allReactions).toHaveLength(0);
      expect(next.selectedEmoji).toBeNull();
      expect(next.fetchState).toBe('idle');
      expect(next.hasMore).toBe(true);
      expect(next.isFetching).toBe(false);
    });
  });

  // ─── Unknown action ───────────────────────────────────────────────

  describe('unknown action', () => {
    it('returns the current state for unknown action types', () => {
      const state = { ...initialReactionListState, selectedEmoji: '👍' as string | null };
      const next = reactionListReducer(state, {
        type: 'UNKNOWN_ACTION',
      } as unknown as CometChatReactionListAction);
      expect(next).toBe(state);
    });
  });
});
