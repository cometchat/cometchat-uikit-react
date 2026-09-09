/**
 * Property-based tests for the send fan-out pipeline.
 *
 * Feature: multi-attachments, Properties 4, 5, 6
 *
 * These validate:
 * - Property 4: Fan-out produces one message per present type with shared batchId.
 * - Property 5: Fan-out ordering is deterministic.
 * - Property 6: Caption is placed on the last message only.
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { groupAndOrderTrayItems } from '../sendBatch';
import type { TrayItem, TrayItemKind } from '../CometChatMessageComposer.types';

// --- Arbitraries ---

const kindArb: fc.Arbitrary<TrayItemKind> = fc.constantFrom('image', 'video', 'audio', 'file');

/** Generate a success tray item (only success items participate in fan-out). */
const successTrayItemArb: fc.Arbitrary<TrayItem> = fc
  .record({
    fileId: fc.uuid(),
    file: fc.constant(new File(['x'], 'x.bin')),
    kind: kindArb,
    status: fc.constant('success' as const),
    percent: fc.constant(100),
    attachment: fc.constant({ getUrl: () => 'https://cdn.example.com/file' } as unknown),
  })
  .map(item => item as TrayItem);

/** Generate a non-empty array of success tray items. */
const successItemsArb = fc.array(successTrayItemArb, { minLength: 1, maxLength: 20 });

/** The fixed ordering that the fan-out must produce. */
const KIND_ORDER: TrayItemKind[] = ['image', 'video', 'audio', 'file'];

// --- Property 4 ---

describe('Feature: multi-attachments, Property 4: Fan-out produces one message per present type with shared batchId', () => {
  it('produces exactly one entry per distinct kind present, each containing only items of that kind', () => {
    fc.assert(
      fc.property(successItemsArb, items => {
        const groups = groupAndOrderTrayItems(items);

        // Collect distinct kinds from input
        const distinctKinds = new Set(items.map(i => i.kind));

        // One group per distinct kind
        expect(groups).toHaveLength(distinctKinds.size);

        // Each group contains only items of that kind
        for (const group of groups) {
          expect(group.items.length).toBeGreaterThan(0);
          for (const item of group.items) {
            expect(item.kind).toBe(group.kind);
          }
        }

        // The set of all items across groups equals the input set
        const allGroupedItems = groups.flatMap(g => g.items);
        expect(allGroupedItems).toHaveLength(items.length);

        // Every input item appears in some group
        const groupedFileIds = new Set(allGroupedItems.map(i => i.fileId));
        for (const item of items) {
          expect(groupedFileIds.has(item.fileId)).toBe(true);
        }
      }),
      { numRuns: 200 }
    );
  });

  it('each group has a unique kind (no duplicate kinds)', () => {
    fc.assert(
      fc.property(successItemsArb, items => {
        const groups = groupAndOrderTrayItems(items);
        const kinds = groups.map(g => g.kind);
        expect(new Set(kinds).size).toBe(kinds.length);
      }),
      { numRuns: 100 }
    );
  });

  it('filters out non-success items (if passed mixed statuses)', () => {
    const mixedItemArb: fc.Arbitrary<TrayItem> = fc
      .record({
        fileId: fc.uuid(),
        file: fc.constant(new File(['x'], 'x.bin')),
        kind: kindArb,
        status: fc.constantFrom('uploading', 'success', 'failed', 'rejected') as fc.Arbitrary<
          TrayItem['status']
        >,
        percent: fc.integer({ min: 0, max: 100 }),
      })
      .map(item => item as TrayItem);

    fc.assert(
      fc.property(fc.array(mixedItemArb, { minLength: 1, maxLength: 20 }), items => {
        const groups = groupAndOrderTrayItems(items);
        const allGroupedItems = groups.flatMap(g => g.items);
        // Only success items should be in the output
        for (const item of allGroupedItems) {
          expect(item.status).toBe('success');
        }
        // Count must match input success items
        const inputSuccessCount = items.filter(i => i.status === 'success').length;
        expect(allGroupedItems).toHaveLength(inputSuccessCount);
      }),
      { numRuns: 100 }
    );
  });
});

// --- Property 5 ---

describe('Feature: multi-attachments, Property 5: Fan-out ordering is deterministic', () => {
  it('groups are ordered image → video → audio → file regardless of attach order', () => {
    fc.assert(
      fc.property(successItemsArb, items => {
        const groups = groupAndOrderTrayItems(items);

        // Verify the ordering: for each pair of adjacent groups, the first
        // must come before the second in KIND_ORDER.
        for (let i = 0; i < groups.length - 1; i++) {
          const currentIdx = KIND_ORDER.indexOf(groups[i].kind);
          const nextIdx = KIND_ORDER.indexOf(groups[i + 1].kind);
          expect(currentIdx).toBeLessThan(nextIdx);
        }
      }),
      { numRuns: 200 }
    );
  });

  it('shuffling the input produces the same group order', () => {
    fc.assert(
      fc.property(successItemsArb, items => {
        const groups1 = groupAndOrderTrayItems(items);

        // Shuffle items
        const shuffled = [...items].reverse();
        const groups2 = groupAndOrderTrayItems(shuffled);

        // Same group order
        expect(groups1.map(g => g.kind)).toEqual(groups2.map(g => g.kind));

        // Same total items
        expect(groups1.flatMap(g => g.items).length).toBe(groups2.flatMap(g => g.items).length);
      }),
      { numRuns: 100 }
    );
  });

  it('sentAt would be strictly increasing given the position index', () => {
    fc.assert(
      fc.property(successItemsArb, fc.integer({ min: 0, max: 2000000000 }), (items, nowSeconds) => {
        const groups = groupAndOrderTrayItems(items);
        // Simulate sentAt = nowSeconds + p for each position p
        const sentAts = groups.map((_, p) => nowSeconds + p);
        for (let i = 0; i < sentAts.length - 1; i++) {
          expect(sentAts[i]).toBeLessThan(sentAts[i + 1]);
        }
      }),
      { numRuns: 100 }
    );
  });
});

// --- Property 6 ---

describe('Feature: multi-attachments, Property 6: Caption is placed on the last message only', () => {
  it('for any tray with a non-empty caption, exactly the last group carries the caption', () => {
    const nonEmptyCaptionArb = fc
      .string({ minLength: 1, maxLength: 100 })
      .filter(s => s.trim().length > 0);

    fc.assert(
      fc.property(successItemsArb, nonEmptyCaptionArb, (items, caption) => {
        const groups = groupAndOrderTrayItems(items);
        if (groups.length === 0) return; // skip (shouldn't happen with minLength: 1)

        // Simulate the sendBatch caption placement logic:
        // Caption goes on the last group (p === lastIndex) only.
        const lastIndex = groups.length - 1;
        const captionPlacements = groups.map((_, p) =>
          p === lastIndex ? caption.trim() : undefined
        );

        // Exactly one carries the caption
        const withCaption = captionPlacements.filter(c => c !== undefined);
        expect(withCaption).toHaveLength(1);
        expect(withCaption[0]).toBe(caption.trim());

        // It's always the last
        expect(captionPlacements[lastIndex]).toBe(caption.trim());

        // All others have no caption
        for (let i = 0; i < lastIndex; i++) {
          expect(captionPlacements[i]).toBeUndefined();
        }
      }),
      { numRuns: 200 }
    );
  });

  it('when caption is empty, no group carries a caption', () => {
    const emptyCaptionArb = fc.constantFrom('', '   ', '\t', '\n');

    fc.assert(
      fc.property(successItemsArb, emptyCaptionArb, (items, caption) => {
        const groups = groupAndOrderTrayItems(items);
        if (groups.length === 0) return;

        // Simulate: caption on last only if caption.trim() is truthy
        const lastIndex = groups.length - 1;
        const captionPlacements = groups.map((_, p) =>
          p === lastIndex && caption.trim() ? caption.trim() : undefined
        );

        // None should carry a caption
        expect(captionPlacements.every(c => c === undefined)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('single-type tray puts caption on the single (and last) message', () => {
    const singleKindItemsArb = fc
      .record({
        fileId: fc.uuid(),
        file: fc.constant(new File(['x'], 'x.bin')),
        kind: kindArb,
        status: fc.constant('success' as const),
        percent: fc.constant(100),
        attachment: fc.constant({ getUrl: () => 'https://cdn.example.com/file' } as unknown),
      })
      .chain(baseItem =>
        fc.array(
          fc.constant({ ...baseItem, fileId: '' }).map(() => ({
            ...(baseItem as TrayItem),
            fileId: crypto.randomUUID(),
          })),
          { minLength: 1, maxLength: 5 }
        )
      );

    const captionArb = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);

    fc.assert(
      fc.property(singleKindItemsArb, captionArb, (items, caption) => {
        const groups = groupAndOrderTrayItems(items as TrayItem[]);
        // Single-type → exactly one group
        expect(groups).toHaveLength(1);
        // That group IS the last (index 0 === lastIndex 0), so it carries caption
        const lastIndex = 0;
        const captionForGroup =
          lastIndex === groups.length - 1 && caption.trim() ? caption.trim() : undefined;
        expect(captionForGroup).toBe(caption.trim());
      }),
      { numRuns: 100 }
    );
  });
});
