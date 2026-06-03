import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { CometChatSearchBar } from '../CometChatSearchBar';

function renderSearchBar(props: Partial<React.ComponentProps<typeof CometChatSearchBar.Root>>) {
  return render(
    React.createElement(
      CometChatSearchBar.Root,
      props,
      React.createElement(CometChatSearchBar.Icon),
      React.createElement(CometChatSearchBar.Input),
      React.createElement(CometChatSearchBar.ClearButton)
    )
  );
}

describe('CometChatSearchBar property-based tests', () => {
  it('renders without errors for any string value (0–1000 chars)', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 0, maxLength: 1000 }), value => {
        const { unmount } = renderSearchBar({ searchText: value });
        unmount();
      }),
      { numRuns: 50 }
    );
  });

  it('renders placeholder correctly for any string', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 0, maxLength: 200 }), placeholderText => {
        const { container, unmount } = renderSearchBar({ placeholderText });
        const input = container.querySelector('input');
        expect(input?.getAttribute('placeholder')).toBe(placeholderText);
        unmount();
      }),
      { numRuns: 50 }
    );
  });

  it('does not throw for any debounceMs value (0–5000)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 5000 }), debounceMs => {
        const { unmount } = renderSearchBar({ debounceMs });
        unmount();
      }),
      { numRuns: 50 }
    );
  });

  it('renders correctly for any combination of disabled and value', () => {
    fc.assert(
      fc.property(fc.boolean(), fc.string({ minLength: 0, maxLength: 500 }), (disabled, value) => {
        const { container, unmount } = renderSearchBar({ disabled, searchText: value });
        const input = container.querySelector('input');
        if (disabled) {
          expect(input?.disabled).toBe(true);
        }
        expect(input?.value).toBe(value);
        unmount();
      }),
      { numRuns: 50 }
    );
  });
});
