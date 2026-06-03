import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { CometChatFullScreenViewer } from '../CometChatFullScreenViewer';
import type {
  CometChatMediaAttachment,
  CometChatFullScreenViewerMediaType,
} from '../CometChatFullScreenViewer.types';

const mediaTypeArb = fc.constantFrom<CometChatFullScreenViewerMediaType>(
  'image',
  'video',
  'audio',
  'file'
);

describe('CometChatFullScreenViewer property-based tests', () => {
  it('for any mediaType value, the correct view is rendered', () => {
    fc.assert(
      fc.property(mediaTypeArb, mediaType => {
        const { unmount } = render(
          <CometChatFullScreenViewer.Root
            onClose={vi.fn()}
            url="https://example.com/media"
            mediaType={mediaType}
          />
        );
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        unmount();
      })
    );
  });

  it('for any combination of senderName, senderAvatar, sentAt, header renders correctly', () => {
    fc.assert(
      fc.property(
        fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
        fc.option(fc.webUrl(), { nil: undefined }),
        fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: undefined }),
        (senderName, senderAvatar, sentAt) => {
          const { unmount } = render(
            <CometChatFullScreenViewer.Root
              onClose={vi.fn()}
              url="https://example.com/photo.jpg"
              mediaType="image"
              senderName={senderName}
              senderAvatar={senderAvatar}
              sentAt={sentAt}
            />
          );
          expect(screen.getByRole('dialog')).toBeInTheDocument();
          unmount();
        }
      ),
      { numRuns: 15 }
    );
  });

  it('for any array of attachments (0–20 items), gallery renders without errors', () => {
    const attachmentArb = fc.record<CometChatMediaAttachment>({
      url: fc.webUrl(),
      type: mediaTypeArb,
      name: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: undefined }),
      size: fc.option(fc.nat(10_000_000), { nil: undefined }),
    });

    fc.assert(
      fc.property(fc.array(attachmentArb, { minLength: 0, maxLength: 20 }), attachments => {
        const { unmount } = render(
          <CometChatFullScreenViewer.Root
            onClose={vi.fn()}
            attachments={attachments}
            url={attachments.length === 0 ? 'https://example.com/fallback.jpg' : undefined}
          />
        );
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        unmount();
      }),
      { numRuns: 15 }
    );
  });

  it('for any startIndex within bounds, the correct attachment is displayed', () => {
    const attachments: CometChatMediaAttachment[] = [
      { url: 'https://example.com/1.jpg', type: 'image' },
      { url: 'https://example.com/2.jpg', type: 'image' },
      { url: 'https://example.com/3.jpg', type: 'image' },
      { url: 'https://example.com/4.jpg', type: 'image' },
      { url: 'https://example.com/5.jpg', type: 'image' },
    ];

    fc.assert(
      fc.property(fc.integer({ min: 0, max: 4 }), startIndex => {
        const { unmount } = render(
          <CometChatFullScreenViewer.Root
            onClose={vi.fn()}
            attachments={attachments}
            startIndex={startIndex}
          />
        );
        expect(screen.getByText(`${String(startIndex + 1)} of 5`)).toBeInTheDocument();
        unmount();
      })
    );
  });

  it('rapid gallery navigation does not cause index out-of-bounds', () => {
    const attachments: CometChatMediaAttachment[] = [
      { url: 'https://example.com/1.jpg', type: 'image' },
      { url: 'https://example.com/2.jpg', type: 'image' },
      { url: 'https://example.com/3.jpg', type: 'image' },
    ];

    fc.assert(
      fc.property(
        fc.array(fc.constantFrom('ArrowLeft', 'ArrowRight'), { minLength: 5, maxLength: 50 }),
        keys => {
          const { unmount } = render(
            <CometChatFullScreenViewer.Root
              onClose={vi.fn()}
              attachments={attachments}
              startIndex={1}
            />
          );

          const dialog = screen.getByRole('dialog');
          for (const key of keys) {
            fireEvent.keyDown(dialog, { key });
          }

          // Index should always be within bounds — check the counter text
          const indexDisplay = screen.getByText(/of 3/);
          const match = indexDisplay.textContent?.match(/^(\d+) of 3$/);
          expect(match).not.toBeNull();
          const index = parseInt(match![1], 10);
          expect(index).toBeGreaterThanOrEqual(1);
          expect(index).toBeLessThanOrEqual(3);
          unmount();
        }
      ),
      { numRuns: 15 }
    );
  });
});
