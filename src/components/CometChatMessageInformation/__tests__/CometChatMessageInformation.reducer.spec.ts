import { describe, it, expect } from 'vitest';
import {
  messageInformationReducer,
  initialState,
  type CometChatMessageInformationState,
  type CometChatMessageInformationAction,
} from '../CometChatMessageInformation.reducer';
import { buildUser } from '../../../testing/mock-builders';

/** Helper to create a mock CometChatUserReceiptInfo. */
function buildReceiptInfo(
  overrides: { uid?: string; name?: string; readAt?: number; deliveredAt?: number } = {}
) {
  return {
    user: buildUser({ uid: overrides.uid ?? 'user-1', name: overrides.name ?? 'Alice' }) as never,
    readAt: overrides.readAt ?? 0,
    deliveredAt: overrides.deliveredAt ?? 0,
  };
}

describe('messageInformationReducer', () => {
  // ─── Initial state ──────────────────────────────────────────────────

  it('has correct initial state', () => {
    expect(initialState).toEqual({
      fetchState: 'idle',
      userReceipts: [],
      oneOnOneReadAt: 0,
      oneOnOneDeliveredAt: 0,
      error: null,
    });
  });

  // ─── FETCH_START ────────────────────────────────────────────────────

  describe('FETCH_START', () => {
    it('sets fetchState to loading and clears error', () => {
      const prev: CometChatMessageInformationState = {
        ...initialState,
        fetchState: 'error',
        error: 'previous error',
      };
      const next = messageInformationReducer(prev, { type: 'FETCH_START' });
      expect(next.fetchState).toBe('loading');
      expect(next.error).toBeNull();
    });

    it('preserves existing userReceipts', () => {
      const receipts = [buildReceiptInfo({ uid: 'u1' })];
      const prev: CometChatMessageInformationState = {
        ...initialState,
        userReceipts: receipts,
      };
      const next = messageInformationReducer(prev, { type: 'FETCH_START' });
      expect(next.userReceipts).toBe(receipts);
    });
  });

  // ─── FETCH_SUCCESS_GROUP ────────────────────────────────────────────

  describe('FETCH_SUCCESS_GROUP', () => {
    it('sets fetchState to loaded when receipts are non-empty', () => {
      const receipts = [buildReceiptInfo({ uid: 'u1', readAt: 100 })];
      const next = messageInformationReducer(initialState, {
        type: 'FETCH_SUCCESS_GROUP',
        userReceipts: receipts,
      });
      expect(next.fetchState).toBe('loaded');
      expect(next.userReceipts).toBe(receipts);
    });

    it('sets fetchState to empty when receipts array is empty', () => {
      const next = messageInformationReducer(initialState, {
        type: 'FETCH_SUCCESS_GROUP',
        userReceipts: [],
      });
      expect(next.fetchState).toBe('empty');
      expect(next.userReceipts).toEqual([]);
    });
  });

  // ─── FETCH_SUCCESS_ONE_ON_ONE ───────────────────────────────────────

  describe('FETCH_SUCCESS_ONE_ON_ONE', () => {
    it('sets fetchState to loaded and stores timestamps', () => {
      const next = messageInformationReducer(initialState, {
        type: 'FETCH_SUCCESS_ONE_ON_ONE',
        readAt: 1000,
        deliveredAt: 900,
      });
      expect(next.fetchState).toBe('loaded');
      expect(next.oneOnOneReadAt).toBe(1000);
      expect(next.oneOnOneDeliveredAt).toBe(900);
    });

    it('handles zero timestamps (not yet read/delivered)', () => {
      const next = messageInformationReducer(initialState, {
        type: 'FETCH_SUCCESS_ONE_ON_ONE',
        readAt: 0,
        deliveredAt: 0,
      });
      expect(next.fetchState).toBe('loaded');
      expect(next.oneOnOneReadAt).toBe(0);
      expect(next.oneOnOneDeliveredAt).toBe(0);
    });
  });

  // ─── FETCH_ERROR ────────────────────────────────────────────────────

  describe('FETCH_ERROR', () => {
    it('sets fetchState to error and stores error message', () => {
      const next = messageInformationReducer(initialState, {
        type: 'FETCH_ERROR',
        error: 'Network failure',
      });
      expect(next.fetchState).toBe('error');
      expect(next.error).toBe('Network failure');
    });

    it('preserves existing data', () => {
      const receipts = [buildReceiptInfo({ uid: 'u1' })];
      const prev: CometChatMessageInformationState = {
        ...initialState,
        fetchState: 'loaded',
        userReceipts: receipts,
        oneOnOneReadAt: 500,
      };
      const next = messageInformationReducer(prev, {
        type: 'FETCH_ERROR',
        error: 'Timeout',
      });
      expect(next.userReceipts).toBe(receipts);
      expect(next.oneOnOneReadAt).toBe(500);
    });
  });

  // ─── UPDATE_RECEIPT ─────────────────────────────────────────────────

  describe('UPDATE_RECEIPT', () => {
    it('updates readAt for a matching user', () => {
      const prev: CometChatMessageInformationState = {
        ...initialState,
        fetchState: 'loaded',
        userReceipts: [
          buildReceiptInfo({ uid: 'u1', readAt: 0, deliveredAt: 100 }),
          buildReceiptInfo({ uid: 'u2', readAt: 0, deliveredAt: 200 }),
        ],
      };
      const next = messageInformationReducer(prev, {
        type: 'UPDATE_RECEIPT',
        uid: 'u1',
        readAt: 500,
      });
      expect(next.userReceipts[0]!.readAt).toBe(500);
      expect(next.userReceipts[0]!.deliveredAt).toBe(100); // unchanged
      expect(next.userReceipts[1]!.readAt).toBe(0); // other user unchanged
    });

    it('updates deliveredAt for a matching user', () => {
      const prev: CometChatMessageInformationState = {
        ...initialState,
        fetchState: 'loaded',
        userReceipts: [buildReceiptInfo({ uid: 'u1', readAt: 0, deliveredAt: 100 })],
      };
      const next = messageInformationReducer(prev, {
        type: 'UPDATE_RECEIPT',
        uid: 'u1',
        deliveredAt: 300,
      });
      expect(next.userReceipts[0]!.deliveredAt).toBe(300);
      expect(next.userReceipts[0]!.readAt).toBe(0); // unchanged
    });

    it('updates both readAt and deliveredAt simultaneously', () => {
      const prev: CometChatMessageInformationState = {
        ...initialState,
        fetchState: 'loaded',
        userReceipts: [buildReceiptInfo({ uid: 'u1', readAt: 0, deliveredAt: 0 })],
      };
      const next = messageInformationReducer(prev, {
        type: 'UPDATE_RECEIPT',
        uid: 'u1',
        readAt: 600,
        deliveredAt: 500,
      });
      expect(next.userReceipts[0]!.readAt).toBe(600);
      expect(next.userReceipts[0]!.deliveredAt).toBe(500);
    });

    it('does not modify receipts for non-matching uid', () => {
      const prev: CometChatMessageInformationState = {
        ...initialState,
        fetchState: 'loaded',
        userReceipts: [buildReceiptInfo({ uid: 'u1', readAt: 100, deliveredAt: 50 })],
      };
      const next = messageInformationReducer(prev, {
        type: 'UPDATE_RECEIPT',
        uid: 'u999',
        readAt: 999,
      });
      expect(next.userReceipts[0]!.readAt).toBe(100); // unchanged
    });

    it('preserves existing values when update fields are undefined', () => {
      const prev: CometChatMessageInformationState = {
        ...initialState,
        fetchState: 'loaded',
        userReceipts: [buildReceiptInfo({ uid: 'u1', readAt: 100, deliveredAt: 50 })],
      };
      const next = messageInformationReducer(prev, {
        type: 'UPDATE_RECEIPT',
        uid: 'u1',
      });
      expect(next.userReceipts[0]!.readAt).toBe(100);
      expect(next.userReceipts[0]!.deliveredAt).toBe(50);
    });
  });

  // ─── UPDATE_ONE_ON_ONE_RECEIPT ──────────────────────────────────────

  describe('UPDATE_ONE_ON_ONE_RECEIPT', () => {
    it('updates readAt for 1-on-1 message', () => {
      const prev: CometChatMessageInformationState = {
        ...initialState,
        fetchState: 'loaded',
        oneOnOneReadAt: 0,
        oneOnOneDeliveredAt: 100,
      };
      const next = messageInformationReducer(prev, {
        type: 'UPDATE_ONE_ON_ONE_RECEIPT',
        readAt: 200,
      });
      expect(next.oneOnOneReadAt).toBe(200);
      expect(next.oneOnOneDeliveredAt).toBe(100); // unchanged
    });

    it('updates deliveredAt for 1-on-1 message', () => {
      const prev: CometChatMessageInformationState = {
        ...initialState,
        fetchState: 'loaded',
        oneOnOneReadAt: 100,
        oneOnOneDeliveredAt: 0,
      };
      const next = messageInformationReducer(prev, {
        type: 'UPDATE_ONE_ON_ONE_RECEIPT',
        deliveredAt: 300,
      });
      expect(next.oneOnOneDeliveredAt).toBe(300);
      expect(next.oneOnOneReadAt).toBe(100); // unchanged
    });

    it('preserves existing values when update fields are undefined', () => {
      const prev: CometChatMessageInformationState = {
        ...initialState,
        fetchState: 'loaded',
        oneOnOneReadAt: 100,
        oneOnOneDeliveredAt: 50,
      };
      const next = messageInformationReducer(prev, {
        type: 'UPDATE_ONE_ON_ONE_RECEIPT',
      });
      expect(next.oneOnOneReadAt).toBe(100);
      expect(next.oneOnOneDeliveredAt).toBe(50);
    });
  });

  // ─── RESET ──────────────────────────────────────────────────────────

  describe('RESET', () => {
    it('returns initial state regardless of current state', () => {
      const prev: CometChatMessageInformationState = {
        fetchState: 'loaded',
        userReceipts: [buildReceiptInfo({ uid: 'u1' })],
        oneOnOneReadAt: 999,
        oneOnOneDeliveredAt: 888,
        error: 'some error',
      };
      const next = messageInformationReducer(prev, { type: 'RESET' });
      expect(next).toEqual(initialState);
    });
  });

  // ─── Unknown action ─────────────────────────────────────────────────

  describe('unknown action', () => {
    it('returns the current state for unknown action types', () => {
      const state = { ...initialState, fetchState: 'loaded' as const };
      const next = messageInformationReducer(state, {
        type: 'UNKNOWN_ACTION',
      } as unknown as CometChatMessageInformationAction);
      expect(next).toBe(state);
    });
  });
});
