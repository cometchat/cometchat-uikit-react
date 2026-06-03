import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { CometChatChangeScope } from '../CometChatChangeScope';
import type { CometChatChangeScopeOptionData } from '../CometChatChangeScope.types';

function renderChangeScope(options: CometChatChangeScopeOptionData[], defaultSelection?: string) {
  return render(
    React.createElement(
      CometChatChangeScope.Root,
      {
        options,
        defaultSelection,
        onScopeChanged: () => Promise.resolve(),
        onClose: () => {},
      },
      React.createElement(
        CometChatChangeScope.ScopeList,
        null,
        ...options.map(opt =>
          React.createElement(CometChatChangeScope.ScopeOption, { key: opt.id, option: opt })
        )
      ),
      React.createElement(CometChatChangeScope.Actions)
    )
  );
}

describe('CometChatChangeScope property-based tests', () => {
  it('renders without errors for any array of 1–10 options', () => {
    const optionArb = fc.record({
      id: fc.string({ minLength: 1, maxLength: 20 }),
      label: fc.string({ minLength: 1, maxLength: 50 }),
    });

    fc.assert(
      fc.property(fc.array(optionArb, { minLength: 1, maxLength: 10 }), options => {
        // Ensure unique ids
        const uniqueOptions = options.reduce<CometChatChangeScopeOptionData[]>((acc, opt) => {
          if (!acc.find(o => o.id === opt.id)) acc.push(opt);
          return acc;
        }, []);
        if (uniqueOptions.length === 0) return;

        const { unmount } = renderChangeScope(uniqueOptions);
        unmount();
      }),
      { numRuns: 30 }
    );
  });

  it('for any defaultSelection matching an option id, that option is initially selected', () => {
    const options: CometChatChangeScopeOptionData[] = [
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B' },
      { id: 'c', label: 'C' },
    ];

    fc.assert(
      fc.property(fc.constantFrom('a', 'b', 'c'), defaultSelection => {
        const { container, unmount } = renderChangeScope(options, defaultSelection);
        const radios = container.querySelectorAll<HTMLInputElement>('input[type="radio"]');
        const selected = Array.from(radios).find(r => r.checked);
        expect(selected?.value).toBe(defaultSelection);
        unmount();
      }),
      { numRuns: 10 }
    );
  });

  it('renders correct number of radio inputs for any option count', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 8 }), count => {
        const options = Array.from({ length: count }, (_, i) => ({
          id: `opt-${String(i)}`,
          label: `Option ${String(i)}`,
        }));
        const { container, unmount } = renderChangeScope(options);
        const radios = container.querySelectorAll('input[type="radio"]');
        expect(radios.length).toBe(count);
        unmount();
      }),
      { numRuns: 20 }
    );
  });
});
