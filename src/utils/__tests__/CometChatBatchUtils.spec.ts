/**
 * Property-based and unit tests for batch adjacency utilities.
 *
 * Feature: multi-attachments
 * Properties 7, 8
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  computeBatchPosition,
  getMessageBatchId,
  type BatchPosition,
} from '../CometChatBatchUtils';

// --- Test helpers ---

function makeMessage(batchId?: string | null) {
  const metadata: Record<string, unknown> = {};
  if (batchId) metadata.batchId = batchId;
  return {
    getMetadata: () => (batchId === undefined ? null : metadata),
    getId: () => Math.floor(Math.random() * 1000000),
    getMuid: () => `muid-${Math.random().toString(36).slice(2)}`,
  } as unknown as import('@cometchat/chat-sdk-javascript').CometChat.BaseMessage;
}

// --- Property 7: Batch position from neighbors ---

describe('Feature: multi-attachments, Property 7: Batch position from neighbors', () => {
  const batchIdArb = fc.option(fc.string({ minLength: 1, maxLength: 12 }), { nil: undefined });

  it('returns correct position based on neighbor batchId matching', () => {
    fc.assert(
      fc.property(batchIdArb, batchIdArb, batchIdArb, (prevId, curId, nextId) => {
        const prev = prevId ? makeMessage(prevId) : makeMessage();
        const cur = curId ? makeMessage(curId) : makeMessage();
        const next = nextId ? makeMessage(nextId) : makeMessage();

        const result = computeBatchPosition(prev, cur, next);

        const id = curId;
        if (!id) {
          expect(result).toBe('single');
          return;
        }

        const matchesPrev = id === prevId;
        const matchesNext = id === nextId;

        if (matchesPrev && matchesNext) expect(result).toBe('middle');
        else if (matchesNext) expect(result).toBe('first');
        else if (matchesPrev) expect(result).toBe('last');
        else expect(result).toBe('single');
      }),
      { numRuns: 200 }
    );
  });

  it('messages without batchId always return single', () => {
    fc.assert(
      fc.property(batchIdArb, batchIdArb, (prevId, nextId) => {
        const prev = prevId ? makeMessage(prevId) : makeMessage();
        const cur = makeMessage(); // no batchId
        const next = nextId ? makeMessage(nextId) : makeMessage();
        expect(computeBatchPosition(prev, cur, next)).toBe('single');
      }),
      { numRuns: 100 }
    );
  });

  it('handles null/undefined neighbors gracefully', () => {
    const msg = makeMessage('batch-1');
    expect(computeBatchPosition(undefined, msg, undefined)).toBe('single');
    expect(computeBatchPosition(null, msg, null)).toBe('single');
    expect(computeBatchPosition(undefined, msg, makeMessage('batch-1'))).toBe('first');
    expect(computeBatchPosition(makeMessage('batch-1'), msg, undefined)).toBe('last');
  });
});

// --- Property 8: Batch chrome follows position ---

describe('Feature: multi-attachments, Property 8: Batch chrome follows position', () => {
  // Simulate the chrome logic from the renderer
  function chromeForPosition(pos: BatchPosition) {
    const showAvatar = pos === 'first' || pos === 'single';
    const showHeader = pos === 'first' || pos === 'single';
    const showStatus = pos === 'last' || pos === 'single';
    return { showAvatar, showHeader, showStatus };
  }

  it('avatar + sender name shown only for first and single', () => {
    fc.assert(
      fc.property(fc.constantFrom<BatchPosition>('first', 'middle', 'last', 'single'), pos => {
        const { showAvatar, showHeader } = chromeForPosition(pos);
        if (pos === 'first' || pos === 'single') {
          expect(showAvatar).toBe(true);
          expect(showHeader).toBe(true);
        } else {
          expect(showAvatar).toBe(false);
          expect(showHeader).toBe(false);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('status info shown only for last and single', () => {
    fc.assert(
      fc.property(fc.constantFrom<BatchPosition>('first', 'middle', 'last', 'single'), pos => {
        const { showStatus } = chromeForPosition(pos);
        if (pos === 'last' || pos === 'single') {
          expect(showStatus).toBe(true);
        } else {
          expect(showStatus).toBe(false);
        }
      }),
      { numRuns: 100 }
    );
  });
});

// --- Unit tests: getMessageBatchId ---

describe('getMessageBatchId', () => {
  it('returns the batchId string from metadata', () => {
    expect(getMessageBatchId(makeMessage('batch-123'))).toBe('batch-123');
  });

  it('returns undefined for a message with no batchId', () => {
    expect(getMessageBatchId(makeMessage())).toBeUndefined();
  });

  it('returns undefined for null/undefined message', () => {
    expect(getMessageBatchId(null)).toBeUndefined();
    expect(getMessageBatchId(undefined)).toBeUndefined();
  });

  it('returns undefined when metadata is null', () => {
    const msg = {
      getMetadata: () => null,
    } as unknown as import('@cometchat/chat-sdk-javascript').CometChat.BaseMessage;
    expect(getMessageBatchId(msg)).toBeUndefined();
  });

  it('returns undefined when batchId is empty string', () => {
    const msg = {
      getMetadata: () => ({ batchId: '' }),
    } as unknown as import('@cometchat/chat-sdk-javascript').CometChat.BaseMessage;
    expect(getMessageBatchId(msg)).toBeUndefined();
  });

  it('returns undefined when batchId is not a string', () => {
    const msg = {
      getMetadata: () => ({ batchId: 42 }),
    } as unknown as import('@cometchat/chat-sdk-javascript').CometChat.BaseMessage;
    expect(getMessageBatchId(msg)).toBeUndefined();
  });
});

// --- Integration: interleave splits group (R6.5) ---

describe('batch grouping: interleave splits (R6.5)', () => {
  it('a foreign message between batch messages splits the group', () => {
    const b1 = makeMessage('batch-X');
    const foreign = makeMessage(); // no batchId, or different batchId
    const b2 = makeMessage('batch-X');

    // b1 has no prev match but matches nothing ahead (foreign breaks it)
    expect(computeBatchPosition(undefined, b1, foreign)).toBe('single');
    // b2 has no prev match (foreign) and no next
    expect(computeBatchPosition(foreign, b2, undefined)).toBe('single');
  });
});
