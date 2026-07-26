/**
 * Property-based tests for the composer tray send-gating selector.
 *
 * Feature: multi-attachments, Property 2: Send gating is exactly all-or-nothing
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { selectCanSend } from '../CometChatMessageComposer.reducer';
import type {
  TrayItem,
  TrayItemKind,
  TrayItemStatus,
  TrayState,
} from '../CometChatMessageComposer.types';

const kindArb: fc.Arbitrary<TrayItemKind> = fc.constantFrom('image', 'video', 'audio', 'file');

const statusArb: fc.Arbitrary<TrayItemStatus> = fc.constantFrom(
  'uploading',
  'success',
  'failed',
  'rejected'
);

const trayItemArb: fc.Arbitrary<TrayItem> = fc.record({
  fileId: fc.string({ minLength: 1, maxLength: 12 }),
  file: fc.constant(new File(['x'], 'x.bin')),
  kind: kindArb,
  status: statusArb,
  percent: fc.integer({ min: 0, max: 100 }),
});

const trayStateArb: fc.Arbitrary<TrayState> = fc.record({
  batchId: fc.option(fc.string({ minLength: 1, maxLength: 12 }), { nil: null }),
  items: fc.array(trayItemArb, { minLength: 0, maxLength: 15 }),
});

describe('Feature: multi-attachments, Property 2: Send gating is exactly all-or-nothing', () => {
  it('canSend is true iff items.length > 0 AND every item status is "success"', () => {
    fc.assert(
      fc.property(trayStateArb, tray => {
        const expected = tray.items.length > 0 && tray.items.every(i => i.status === 'success');
        expect(selectCanSend(tray)).toBe(expected);
      }),
      { numRuns: 200 }
    );
  });

  it('canSend is false when any item is uploading, failed, or rejected', () => {
    fc.assert(
      fc.property(trayStateArb, tray => {
        const hasBlocking = tray.items.some(
          i => i.status === 'uploading' || i.status === 'failed' || i.status === 'rejected'
        );
        if (hasBlocking) {
          expect(selectCanSend(tray)).toBe(false);
        }
      }),
      { numRuns: 200 }
    );
  });

  it('canSend is false for an empty tray regardless of batchId', () => {
    fc.assert(
      fc.property(fc.option(fc.string(), { nil: null }), batchId => {
        expect(selectCanSend({ batchId, items: [] })).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('canSend is true for a non-empty tray where all items are success', () => {
    const successItemArb: fc.Arbitrary<TrayItem> = trayItemArb.map(item => ({
      ...item,
      status: 'success' as const,
    }));
    fc.assert(
      fc.property(
        fc.array(successItemArb, { minLength: 1, maxLength: 15 }),
        fc.option(fc.string({ minLength: 1 }), { nil: null }),
        (items, batchId) => {
          expect(selectCanSend({ batchId, items })).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
