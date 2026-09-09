/**
 * Property-based tests for the media grid layout.
 *
 * Feature: multi-attachments, Property 10: Media grid layout by count
 * Validates: Requirements 5.2
 *
 * For any attachment count N, the layout should be:
 * - N=1 -> full (single)
 * - N=2 -> side-by-side (grid)
 * - N=3 -> large+2 (grid)
 * - N=4 -> 2x2 (grid-2x2)
 * - N>=5 -> 2x2 with +(N-4) on the 4th cell (overflow)
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { determineLayout } from '../CometChatImagesBubble.utils';

describe('Feature: multi-attachments, Property 10: Media grid layout by count', () => {
  it('N=1 produces layout "single" with overflowCount 0', () => {
    const result = determineLayout(1);
    expect(result.layoutType).toBe('single');
    expect(result.overflowCount).toBe(0);
  });

  it('N=2 produces layout "grid" with overflowCount 0 (side-by-side)', () => {
    const result = determineLayout(2);
    expect(result.layoutType).toBe('grid');
    expect(result.overflowCount).toBe(0);
  });

  it('N=3 produces layout "grid" with overflowCount 0 (large+2)', () => {
    const result = determineLayout(3);
    expect(result.layoutType).toBe('grid');
    expect(result.overflowCount).toBe(0);
  });

  it('N=4 produces layout "grid-2x2" with overflowCount 0', () => {
    const result = determineLayout(4);
    expect(result.layoutType).toBe('grid-2x2');
    expect(result.overflowCount).toBe(0);
  });

  it('for any N >= 5, layout is "overflow" with overflowCount = N - 4', () => {
    fc.assert(
      fc.property(fc.integer({ min: 5, max: 1000 }), n => {
        const { layoutType, overflowCount } = determineLayout(n);
        expect(layoutType).toBe('overflow');
        expect(overflowCount).toBe(n - 4);
      }),
      { numRuns: 100 }
    );
  });

  it('for any N in [1, 1000], layout is one of the defined types and overflow is correct', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1000 }), n => {
        const { layoutType, overflowCount } = determineLayout(n);

        if (n === 1) {
          expect(layoutType).toBe('single');
          expect(overflowCount).toBe(0);
        } else if (n <= 3) {
          expect(layoutType).toBe('grid');
          expect(overflowCount).toBe(0);
        } else if (n === 4) {
          expect(layoutType).toBe('grid-2x2');
          expect(overflowCount).toBe(0);
        } else {
          expect(layoutType).toBe('overflow');
          expect(overflowCount).toBe(n - 4);
        }
      }),
      { numRuns: 200 }
    );
  });

  it('N=0 produces layout "single" with overflowCount 0 (edge case: empty)', () => {
    const result = determineLayout(0);
    expect(result.layoutType).toBe('single');
    expect(result.overflowCount).toBe(0);
  });

  it('overflowCount is always non-negative for any positive N', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 10000 }), n => {
        const { overflowCount } = determineLayout(n);
        expect(overflowCount).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 100 }
    );
  });

  it('overflow layout always produces exactly (N-4) overflow count', () => {
    fc.assert(
      fc.property(fc.integer({ min: 5, max: 500 }), n => {
        const { layoutType, overflowCount } = determineLayout(n);
        expect(layoutType).toBe('overflow');
        // The +N text on the 4th cell should show +(N-4)
        expect(overflowCount).toBe(n - 4);
      }),
      { numRuns: 100 }
    );
  });
});
