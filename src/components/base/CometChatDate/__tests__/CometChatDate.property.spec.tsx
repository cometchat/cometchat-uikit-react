import { render } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { useCometChatDate } from '../useCometChatDate';
import { CometChatDate } from '../CometChatDate';
import type { CometChatDateVariant } from '../CometChatDate.types';

describe('CometChatDate property-based tests', () => {
  it('for any positive integer timestamp, useCometChatDate returns a non-empty formattedDate', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 2000000000 }), timestamp => {
        const { result } = renderHook(() => useCometChatDate({ timestamp }));
        expect(result.current.formattedDate.length).toBeGreaterThan(0);
      }),
      { numRuns: 50 }
    );
  });

  it('for any positive integer timestamp, isoDate is a valid ISO 8601 string', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 2000000000 }), timestamp => {
        const { result } = renderHook(() => useCometChatDate({ timestamp }));
        const parsed = new Date(result.current.isoDate);
        expect(parsed.toISOString()).toBe(result.current.isoDate);
      }),
      { numRuns: 50 }
    );
  });

  it('for any variant value, root renders with correct data-variant attribute', () => {
    fc.assert(
      fc.property(fc.constantFrom<CometChatDateVariant>('caption', 'body', 'label'), variant => {
        const { container, unmount } = render(
          <CometChatDate.Root timestamp={1713200000} variant={variant}>
            <CometChatDate.Text />
          </CometChatDate.Root>
        );
        const time = container.querySelector('time');
        expect(time?.getAttribute('data-variant')).toBe(variant);
        unmount();
      }),
      { numRuns: 20 }
    );
  });

  it('for any combination of formatConfig fields, component renders without errors', () => {
    fc.assert(
      fc.property(
        fc.record({
          today: fc.option(fc.constant('hh:mm A'), { nil: undefined }),
          yesterday: fc.option(fc.constant('Yesterday'), { nil: undefined }),
          lastWeek: fc.option(fc.constant('dddd'), { nil: undefined }),
          otherDays: fc.option(fc.constant('DD/MM/YYYY'), { nil: undefined }),
        }),
        formatConfig => {
          const { unmount } = render(
            <CometChatDate.Root timestamp={1713200000} formatConfig={formatConfig}>
              <CometChatDate.Text />
            </CometChatDate.Root>
          );
          unmount();
        }
      ),
      { numRuns: 30 }
    );
  });

  it('for any timestamp, the datetime attribute on <time> is a valid ISO 8601 string', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 2000000000 }), timestamp => {
        const { container, unmount } = render(
          <CometChatDate.Root timestamp={timestamp}>
            <CometChatDate.Text />
          </CometChatDate.Root>
        );
        const time = container.querySelector('time');
        const datetime = time?.getAttribute('datetime') ?? '';
        expect(new Date(datetime).toISOString()).toBe(datetime);
        unmount();
      }),
      { numRuns: 50 }
    );
  });
});
