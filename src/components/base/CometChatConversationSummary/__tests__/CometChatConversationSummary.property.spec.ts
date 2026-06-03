import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { CometChatConversationSummary } from '../CometChatConversationSummary';

describe('CometChatConversationSummary property-based tests', () => {
  it('for any string content (including unicode, emoji, long text, empty, whitespace-only), the summary renders correctly', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string(), async text => {
        const trimmed = text.trim();
        const getSummary = vi.fn(() => Promise.resolve(text));
        const { unmount } = render(
          React.createElement(CometChatConversationSummary.Root, {
            getConversationSummary: getSummary,
            children: [
              React.createElement(CometChatConversationSummary.Body, { key: 'body' }),
              React.createElement(CometChatConversationSummary.Empty, {
                key: 'empty',
                message: 'Empty',
              }),
            ],
          })
        );

        if (trimmed.length === 0) {
          await waitFor(() => {
            expect(screen.getByText('Empty')).toBeInTheDocument();
          });
        } else {
          await waitFor(() => {
            // Use a function matcher to handle whitespace normalization
            const body = document.querySelector('[class*="cometchat-conversation-summary__body"]');
            expect(body).not.toBeNull();
            expect(body!.textContent).toBe(text);
          });
        }

        unmount();
      }),
      { numRuns: 20 }
    );
  });

  it('for any combination of showCloseButton and onClose, the header renders without errors', () => {
    fc.assert(
      fc.property(fc.boolean(), fc.boolean(), (showClose, hasOnClose) => {
        const getSummary = vi.fn(() => new Promise<string>(() => {}));
        const onClose = hasOnClose ? vi.fn() : undefined;
        const { unmount } = render(
          React.createElement(CometChatConversationSummary.Root, {
            getConversationSummary: getSummary,
            onClose,
            children: React.createElement(CometChatConversationSummary.Header, {
              showCloseButton: showClose,
            }),
          })
        );

        const root = screen.getByRole('region');
        expect(root).toBeInTheDocument();

        unmount();
      }),
      { numRuns: 10 }
    );
  });

  it('onClose callback is never called without user interaction', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string({ minLength: 1, maxLength: 50 }), async text => {
        // Skip strings that are only whitespace — they trigger the empty state, not the body
        if (text.trim().length === 0) return;
        const onClose = vi.fn();
        const getSummary = vi.fn(() => Promise.resolve(text));
        const { unmount } = render(
          React.createElement(CometChatConversationSummary.Root, {
            getConversationSummary: getSummary,
            onClose,
            children: [
              React.createElement(CometChatConversationSummary.Header, { key: 'header' }),
              React.createElement(CometChatConversationSummary.Body, { key: 'body' }),
            ],
          })
        );

        await waitFor(
          () => {
            const body = document.querySelector('[class*="cometchat-conversation-summary__body"]');
            expect(body).not.toBeNull();
          },
          { timeout: 3000 }
        );

        expect(onClose).not.toHaveBeenCalled();
        unmount();
      }),
      { numRuns: 10 }
    );
  });

  it('summary text in context matches exactly what getConversationSummary resolved with (no mutation)', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string({ minLength: 1 }), async text => {
        const getSummary = vi.fn(() => Promise.resolve(text));
        const { unmount } = render(
          React.createElement(CometChatConversationSummary.Root, {
            getConversationSummary: getSummary,
            children: React.createElement(CometChatConversationSummary.Body, { key: 'body' }),
          })
        );

        if (text.trim().length > 0) {
          await waitFor(() => {
            const body = document.querySelector('[class*="cometchat-conversation-summary__body"]');
            expect(body).not.toBeNull();
            expect(body!.textContent).toBe(text);
          });
        }

        unmount();
      }),
      { numRuns: 20 }
    );
  });
});
