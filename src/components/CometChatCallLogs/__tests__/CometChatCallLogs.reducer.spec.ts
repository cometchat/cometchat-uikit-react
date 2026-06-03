import { describe, it, expect } from 'vitest';
import {
  callLogsReducer,
  initialCallLogsState,
  type CometChatCallLogsState,
  type CometChatCallLogsAction,
} from '../CometChatCallLogs.reducer';

describe('callLogsReducer', () => {
  // ─── Initial state ──────────────────────────────────────────────────

  it('has correct initial state', () => {
    expect(initialCallLogsState).toEqual({
      callList: [],
      fetchState: 'idle',
      hasMore: true,
      error: null,
    });
  });

  // ─── FETCH_START ────────────────────────────────────────────────────

  describe('FETCH_START', () => {
    it('sets fetchState to loading when callList is empty', () => {
      const next = callLogsReducer(initialCallLogsState, { type: 'FETCH_START' });
      expect(next.fetchState).toBe('loading');
      expect(next.error).toBeNull();
    });

    it('preserves current fetchState when callList is non-empty', () => {
      const prev: CometChatCallLogsState = {
        ...initialCallLogsState,
        callList: [{ id: 1 }],
        fetchState: 'loaded',
      };
      const next = callLogsReducer(prev, { type: 'FETCH_START' });
      expect(next.fetchState).toBe('loaded');
    });

    it('clears error', () => {
      const prev: CometChatCallLogsState = {
        ...initialCallLogsState,
        error: 'previous error',
      };
      const next = callLogsReducer(prev, { type: 'FETCH_START' });
      expect(next.error).toBeNull();
    });

    it('preserves existing callList', () => {
      const calls = [{ id: 1 }, { id: 2 }];
      const prev: CometChatCallLogsState = {
        ...initialCallLogsState,
        callList: calls,
        fetchState: 'loaded',
      };
      const next = callLogsReducer(prev, { type: 'FETCH_START' });
      expect(next.callList).toBe(calls);
    });
  });

  // ─── FETCH_SUCCESS ──────────────────────────────────────────────────

  describe('FETCH_SUCCESS', () => {
    it('appends new calls to existing callList', () => {
      const prev: CometChatCallLogsState = {
        ...initialCallLogsState,
        callList: [{ id: 1 }],
        fetchState: 'loading',
      };
      const next = callLogsReducer(prev, {
        type: 'FETCH_SUCCESS',
        calls: [{ id: 2 }, { id: 3 }],
        hasMore: true,
      });
      expect(next.callList).toHaveLength(3);
      expect(next.callList[0]).toEqual({ id: 1 });
      expect(next.callList[1]).toEqual({ id: 2 });
      expect(next.callList[2]).toEqual({ id: 3 });
    });

    it('sets fetchState to loaded when merged list is non-empty', () => {
      const next = callLogsReducer(initialCallLogsState, {
        type: 'FETCH_SUCCESS',
        calls: [{ id: 1 }],
        hasMore: false,
      });
      expect(next.fetchState).toBe('loaded');
    });

    it('sets fetchState to empty when merged list is empty', () => {
      const next = callLogsReducer(initialCallLogsState, {
        type: 'FETCH_SUCCESS',
        calls: [],
        hasMore: false,
      });
      expect(next.fetchState).toBe('empty');
    });

    it('updates hasMore flag', () => {
      const next = callLogsReducer(initialCallLogsState, {
        type: 'FETCH_SUCCESS',
        calls: [{ id: 1 }],
        hasMore: false,
      });
      expect(next.hasMore).toBe(false);
    });

    it('sets hasMore to true when more data is available', () => {
      const next = callLogsReducer(initialCallLogsState, {
        type: 'FETCH_SUCCESS',
        calls: [{ id: 1 }],
        hasMore: true,
      });
      expect(next.hasMore).toBe(true);
    });
  });

  // ─── FETCH_ERROR ────────────────────────────────────────────────────

  describe('FETCH_ERROR', () => {
    it('sets fetchState to error when callList is empty', () => {
      const next = callLogsReducer(initialCallLogsState, {
        type: 'FETCH_ERROR',
        error: 'Network failure',
      });
      expect(next.fetchState).toBe('error');
      expect(next.error).toBe('Network failure');
    });

    it('preserves current fetchState when callList is non-empty', () => {
      const prev: CometChatCallLogsState = {
        ...initialCallLogsState,
        callList: [{ id: 1 }],
        fetchState: 'loaded',
      };
      const next = callLogsReducer(prev, {
        type: 'FETCH_ERROR',
        error: 'Timeout',
      });
      expect(next.fetchState).toBe('loaded');
      expect(next.error).toBe('Timeout');
    });

    it('stores the error message', () => {
      const next = callLogsReducer(initialCallLogsState, {
        type: 'FETCH_ERROR',
        error: 'Something went wrong',
      });
      expect(next.error).toBe('Something went wrong');
    });
  });

  // ─── RESET ──────────────────────────────────────────────────────────

  describe('RESET', () => {
    it('returns initial state regardless of current state', () => {
      const prev: CometChatCallLogsState = {
        callList: [{ id: 1 }, { id: 2 }],
        fetchState: 'loaded',
        hasMore: false,
        error: 'some error',
      };
      const next = callLogsReducer(prev, { type: 'RESET' });
      expect(next).toEqual(initialCallLogsState);
    });
  });

  // ─── Unknown action ─────────────────────────────────────────────────

  describe('unknown action', () => {
    it('returns the current state for unknown action types', () => {
      const state: CometChatCallLogsState = {
        ...initialCallLogsState,
        fetchState: 'loaded',
        callList: [{ id: 1 }],
      };
      const next = callLogsReducer(state, {
        type: 'UNKNOWN_ACTION',
      } as unknown as CometChatCallLogsAction);
      expect(next).toBe(state);
    });
  });
});
