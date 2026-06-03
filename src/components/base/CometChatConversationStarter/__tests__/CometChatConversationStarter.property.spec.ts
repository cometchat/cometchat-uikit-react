import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { CometChatConversationStarter } from '../CometChatConversationStarter';

describe('CometChatConversationStarter property-based tests', () => {
  it('for any array of strings (0–100 items), all items render without errors', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 1 }), { minLength: 0, maxLength: 100 }),
        async suggestions => {
          // Deduplicate since keys must be unique
          const unique = [...new Set(suggestions)];
          const getStarters = vi.fn(() => Promise.resolve(unique));
          const { unmount } = render(
            React.createElement(CometChatConversationStarter.Root, {
              getConversationStarters: getStarters,
              children: React.createElement(CometChatConversationStarter.Loading),
            })
          );

          if (unique.length > 0) {
            await waitFor(() => {
              const buttons = screen.getAllByRole('button');
              expect(buttons.length).toBe(unique.length);
            });
          } else {
            // Empty state — no buttons
            await waitFor(() => {
              const root = screen.getByRole('group');
              expect(root).toBeInTheDocument();
            });
          }

          unmount();
        }
      ),
      { numRuns: 20 }
    );
  });

  it('for any string content (including unicode, emoji), the item renders correctly', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string({ minLength: 1 }), async text => {
        const getStarters = vi.fn(() => Promise.resolve([text]));
        const { unmount } = render(
          React.createElement(CometChatConversationStarter.Root, {
            getConversationStarters: getStarters,
            children: React.createElement(CometChatConversationStarter.Loading),
          })
        );

        await waitFor(() => {
          const button = screen.getByRole('button');
          expect(button.textContent).toBe(text);
        });

        unmount();
      }),
      { numRuns: 20 }
    );
  });

  it('onSuggestionClick is called with the exact string that was provided (no mutation)', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string({ minLength: 1 }), async text => {
        const user = userEvent.setup();
        const onClick = vi.fn();
        const getStarters = vi.fn(() => Promise.resolve([text]));
        const { unmount } = render(
          React.createElement(CometChatConversationStarter.Root, {
            getConversationStarters: getStarters,
            onSuggestionClick: onClick,
            children: React.createElement(CometChatConversationStarter.Loading),
          })
        );

        await waitFor(() => {
          expect(screen.getByRole('button')).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button'));
        expect(onClick).toHaveBeenCalledWith(text);

        unmount();
      }),
      { numRuns: 20 }
    );
  });
});
