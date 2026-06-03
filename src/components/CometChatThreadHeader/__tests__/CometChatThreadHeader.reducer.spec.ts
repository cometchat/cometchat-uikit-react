import { describe, it, expect } from 'vitest';
import {
  threadHeaderReducer,
  createInitialState,
  type CometChatThreadHeaderState,
  type CometChatThreadHeaderAction,
} from '../CometChatThreadHeader.reducer';

describe('CometChatThreadHeader.reducer', () => {
  describe('createInitialState', () => {
    it('creates initial state with given count', () => {
      const state = createInitialState(5);
      expect(state.replyCount).toBe(5);
      expect(state.processedMessageIds.size).toBe(0);
    });

    it('creates initial state with zero count', () => {
      const state = createInitialState(0);
      expect(state.replyCount).toBe(0);
    });
  });

  describe('SET_REPLY_COUNT', () => {
    it('sets the reply count', () => {
      const state = createInitialState(3);
      const result = threadHeaderReducer(state, { type: 'SET_REPLY_COUNT', count: 10 });
      expect(result.replyCount).toBe(10);
    });

    it('preserves processedMessageIds', () => {
      const state: CometChatThreadHeaderState = {
        replyCount: 3,
        processedMessageIds: new Set([1, 2, 3]),
      };
      const result = threadHeaderReducer(state, { type: 'SET_REPLY_COUNT', count: 10 });
      expect(result.processedMessageIds.size).toBe(3);
    });
  });

  describe('INCREMENT_REPLY_COUNT', () => {
    it('increments count and adds ID to processed set', () => {
      const state = createInitialState(5);
      const result = threadHeaderReducer(state, {
        type: 'INCREMENT_REPLY_COUNT',
        messageId: 100,
      });
      expect(result.replyCount).toBe(6);
      expect(result.processedMessageIds.has(100)).toBe(true);
    });

    it('does NOT increment for already-processed ID', () => {
      const state: CometChatThreadHeaderState = {
        replyCount: 5,
        processedMessageIds: new Set([100]),
      };
      const result = threadHeaderReducer(state, {
        type: 'INCREMENT_REPLY_COUNT',
        messageId: 100,
      });
      expect(result.replyCount).toBe(5);
      expect(result).toBe(state); // Same reference — no state change
    });

    it('handles multiple unique increments', () => {
      let state = createInitialState(0);
      state = threadHeaderReducer(state, { type: 'INCREMENT_REPLY_COUNT', messageId: 1 });
      state = threadHeaderReducer(state, { type: 'INCREMENT_REPLY_COUNT', messageId: 2 });
      state = threadHeaderReducer(state, { type: 'INCREMENT_REPLY_COUNT', messageId: 3 });
      expect(state.replyCount).toBe(3);
      expect(state.processedMessageIds.size).toBe(3);
    });
  });

  describe('RESET', () => {
    it('clears processed IDs and sets initial count', () => {
      const state: CometChatThreadHeaderState = {
        replyCount: 15,
        processedMessageIds: new Set([1, 2, 3, 4, 5]),
      };
      const result = threadHeaderReducer(state, { type: 'RESET', initialCount: 7 });
      expect(result.replyCount).toBe(7);
      expect(result.processedMessageIds.size).toBe(0);
    });

    it('resets to zero', () => {
      const state: CometChatThreadHeaderState = {
        replyCount: 10,
        processedMessageIds: new Set([1, 2]),
      };
      const result = threadHeaderReducer(state, { type: 'RESET', initialCount: 0 });
      expect(result.replyCount).toBe(0);
      expect(result.processedMessageIds.size).toBe(0);
    });
  });

  describe('unknown action', () => {
    it('returns unchanged state for unknown action type', () => {
      const state = createInitialState(5);
      const result = threadHeaderReducer(state, {
        type: 'UNKNOWN',
      } as unknown as CometChatThreadHeaderAction);
      expect(result).toBe(state);
    });
  });
});
