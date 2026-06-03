import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { CometChatThreadView } from '../CometChatThreadView';

describe('CometChatThreadView property-based tests', () => {
  it('for any replyCount 0–10000, component renders without errors (0 renders nothing)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 10000 }), count => {
        const { container, unmount } = render(
          React.createElement(CometChatThreadView.Root, {
            replyCount: count,
            onClick: vi.fn(),
            children: [
              React.createElement(CometChatThreadView.Icon, { key: 'icon' }),
              React.createElement(CometChatThreadView.ReplyCount, { key: 'count' }),
            ],
          })
        );

        if (count === 0) {
          expect(container.innerHTML).toBe('');
        } else {
          expect(screen.getByRole('button')).toBeInTheDocument();
        }

        unmount();
      }),
      { numRuns: 50 }
    );
  });

  it('for any replyCount >= 1, the formatted text correctly uses singular/plural and 999+ cap', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 10000 }), count => {
        const { unmount } = render(
          React.createElement(CometChatThreadView.Root, {
            replyCount: count,
            onClick: vi.fn(),
            children: React.createElement(CometChatThreadView.ReplyCount, { key: 'count' }),
          })
        );

        const displayCount = count > 999 ? '999+' : String(count);
        const expected = count === 1 ? '1 Reply' : `${displayCount} Replies`;
        expect(screen.getByText(expected)).toBeInTheDocument();

        unmount();
      }),
      { numRuns: 50 }
    );
  });

  it('for any alignment in ["left", "right"], the correct modifier class is applied', () => {
    fc.assert(
      fc.property(fc.constantFrom('left' as const, 'right' as const), alignment => {
        const { unmount } = render(
          React.createElement(CometChatThreadView.Root, {
            replyCount: 1,
            alignment,
            onClick: vi.fn(),
            children: React.createElement(CometChatThreadView.ReplyCount, { key: 'count' }),
          })
        );

        const btn = screen.getByRole('button');
        expect(btn.className).toContain(alignment);

        unmount();
      }),
      { numRuns: 10 }
    );
  });

  it('for any unreadReplyCount 0–100, unread modifier is applied iff count > 0', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100 }), unreadCount => {
        const { unmount } = render(
          React.createElement(CometChatThreadView.Root, {
            replyCount: 5,
            unreadReplyCount: unreadCount,
            onClick: vi.fn(),
            children: React.createElement(CometChatThreadView.ReplyCount, { key: 'count' }),
          })
        );

        const btn = screen.getByRole('button');
        if (unreadCount > 0) {
          expect(btn.className).toContain('unread');
        } else {
          expect(btn.className).not.toContain('unread');
        }

        unmount();
      }),
      { numRuns: 30 }
    );
  });
});
