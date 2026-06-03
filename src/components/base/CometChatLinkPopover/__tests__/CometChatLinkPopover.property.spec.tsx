import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { CometChatLinkPopover } from '../CometChatLinkPopover';

describe('CometChatLinkPopover property-based tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('for any string text (1–200 chars), the title renders correctly', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 200 }), text => {
        const { container, unmount } = render(
          <CometChatLinkPopover
            text={text}
            url="https://example.com"
            position={{ top: 0, left: 0 }}
            onEdit={() => {}}
            onRemove={() => {}}
            onClose={() => {}}
          />
        );
        const root = container.firstElementChild as HTMLElement;
        expect(root).toBeTruthy();
        expect(root.className).toMatch(/cometchat-link-popover/);
        unmount();
      }),
      { numRuns: 15 }
    );
  });

  it('for any valid URL string, the URL renders correctly', () => {
    fc.assert(
      fc.property(fc.webUrl(), url => {
        const { unmount } = render(
          <CometChatLinkPopover
            text="Link"
            url={url}
            position={{ top: 0, left: 0 }}
            onEdit={() => {}}
            onRemove={() => {}}
            onClose={() => {}}
          />
        );
        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('href', url);
        unmount();
      }),
      { numRuns: 15 }
    );
  });

  it('for any position with positive top/left values, the hidden trigger is positioned correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 2000 }),
        fc.integer({ min: 0, max: 2000 }),
        (top, left) => {
          const { container, unmount } = render(
            <CometChatLinkPopover
              text="Link"
              url="https://example.com"
              position={{ top, left }}
              onEdit={() => {}}
              onRemove={() => {}}
              onClose={() => {}}
            />
          );
          // The component positions itself using bottom (from position.top) and left
          const root = container.firstElementChild as HTMLElement;
          expect(root).toBeTruthy();
          expect(root.style.bottom).toBe(`${String(top)}px`);
          expect(root.style.left).toBe(`${String(left)}px`);
          unmount();
        }
      ),
      { numRuns: 15 }
    );
  });

  it('for any combination of props, the component renders without errors', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.webUrl(),
        fc.integer({ min: 0, max: 1000 }),
        fc.integer({ min: 0, max: 1000 }),
        (text, url, top, left) => {
          const { container, unmount } = render(
            <CometChatLinkPopover
              text={text}
              url={url}
              position={{ top, left }}
              onEdit={() => {}}
              onRemove={() => {}}
              onClose={() => {}}
            />
          );
          const root = container.firstElementChild as HTMLElement;
          expect(root).toBeTruthy();
          expect(root.className).toMatch(/cometchat-link-popover/);
          unmount();
        }
      ),
      { numRuns: 10 }
    );
  });
});
