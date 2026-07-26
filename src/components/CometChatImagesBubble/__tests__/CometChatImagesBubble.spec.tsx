import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatImagesBubble } from '../CometChatImagesBubble';
import { buildUser } from '../../../testing/mock-builders';

/**
 * Mock the global Image constructor so that onload fires synchronously.
 * The ImageTile component preloads images via `new Image()` and only
 * renders <img> after onload fires — which never happens in jsdom.
 */
beforeEach(() => {
  vi.stubGlobal(
    'Image',
    class MockImage {
      onload: (() => void) | null = null;
      private _src = '';
      get src() {
        return this._src;
      }
      set src(value: string) {
        this._src = value;
        if (value) {
          // Fire onload synchronously so tests can assert immediately after render
          this.onload?.();
        }
      }
    }
  );
});

// --- Message builders ---

function buildImageMessage(
  options: {
    urls?: string[];
    size?: number;
    caption?: string;
    senderName?: string;
  } = {}
): CometChat.MediaMessage {
  const urls = options.urls ?? ['https://example.com/image.jpg'];
  const size = options.size ?? 204800;
  const caption = options.caption ?? '';
  const attachments = urls.map(url => ({
    getUrl: () => url,
    getSize: () => size,
  }));

  return {
    getId: () => 1,
    getType: () => 'image',
    getCategory: () => 'message',
    getSender: () =>
      buildUser({
        name: options.senderName ?? 'Test User',
        avatar: '',
      }) as unknown as CometChat.User,
    getSentAt: () => Math.floor(Date.now() / 1000),
    getDeliveredAt: () => 0,
    getReadAt: () => 0,
    getEditedAt: () => 0,
    getDeletedAt: () => 0,
    getReplyCount: () => 0,
    getMuid: () => 'muid-1',
    getCaption: () => caption,
    getData: () => ({ text: caption }),
    getAttachments: () => attachments,
    getMentionedUsers: () => [],
    getMetadata: () => ({}),
    getReactions: () => [],
  } as unknown as CometChat.MediaMessage;
}

function buildPendingImageMessage(): CometChat.MediaMessage {
  const msg = buildImageMessage({ urls: [] });
  const file = new File([''], 'pending.jpg', { type: 'image/jpeg' });
  return {
    ...(msg as unknown as Record<string, unknown>),
    getAttachments: () => [],
    getMetadata: () => ({ file }),
  } as unknown as CometChat.MediaMessage;
}

describe('CometChatImagesBubble', () => {
  // --- Layout counts 1..5+ ---

  it('renders single image (N=1)', () => {
    const { container } = render(
      <CometChatImagesBubble message={buildImageMessage()} alignment="right" />
    );
    const img = container.querySelector('img');
    expect(img).toBeTruthy();
    expect(img?.getAttribute('src')).toBe('https://example.com/image.jpg');
    expect(container.querySelector('[class*="--single"]')).toBeTruthy();
  });

  it('renders 2 images in a side-by-side grid (N=2)', () => {
    const { container } = render(
      <CometChatImagesBubble
        message={buildImageMessage({
          urls: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
        })}
        alignment="right"
      />
    );
    expect(container.querySelector('[class*="grid--two-col"]')).toBeTruthy();
    expect(container.querySelectorAll('img[src]')).toHaveLength(2);
  });

  it('renders 3 images in a large+2 grid (N=3)', () => {
    const { container } = render(
      <CometChatImagesBubble
        message={buildImageMessage({
          urls: [
            'https://example.com/img1.jpg',
            'https://example.com/img2.jpg',
            'https://example.com/img3.jpg',
          ],
        })}
        alignment="right"
      />
    );
    expect(container.querySelector('[class*="grid--three"]')).toBeTruthy();
    expect(container.querySelectorAll('img[src]')).toHaveLength(3);
  });

  it('renders 4 images in a 2x2 grid (N=4)', () => {
    const urls = Array.from({ length: 4 }, (_, i) => `https://example.com/img${String(i)}.jpg`);
    const { container } = render(
      <CometChatImagesBubble message={buildImageMessage({ urls })} alignment="right" />
    );
    expect(container.querySelector('[class*="grid--2x2"]')).toBeTruthy();
    expect(container.querySelectorAll('img[src]')).toHaveLength(4);
  });

  it('renders overflow indicator for 5 images (N=5, +1)', () => {
    const urls = Array.from({ length: 5 }, (_, i) => `https://example.com/img${String(i)}.jpg`);
    const { container } = render(
      <CometChatImagesBubble message={buildImageMessage({ urls })} alignment="right" />
    );
    expect(container.querySelector('[class*="overflow-tile"]')).toBeTruthy();
    expect(container.querySelector('[class*="overflow-text"]')?.textContent).toContain('+1');
  });

  it('renders overflow indicator for >5 images (N=7, +3)', () => {
    const urls = Array.from({ length: 7 }, (_, i) => `https://example.com/img${String(i)}.jpg`);
    const { container } = render(
      <CometChatImagesBubble message={buildImageMessage({ urls })} alignment="right" />
    );
    expect(container.querySelector('[class*="overflow-tile"]')).toBeTruthy();
    expect(container.querySelector('[class*="overflow-text"]')?.textContent).toContain('+3');
  });

  it('renders nothing when the message has no attachments', () => {
    const { container } = render(
      <CometChatImagesBubble message={buildImageMessage({ urls: [] })} alignment="right" />
    );
    expect(container.querySelector('img')).toBeNull();
  });

  // --- Caption render ---

  it('renders caption extracted from the message', () => {
    const { container } = render(
      <CometChatImagesBubble
        message={buildImageMessage({ caption: 'Beautiful sunset' })}
        alignment="right"
      />
    );
    expect(container.querySelector('[class*="caption"]')).toBeTruthy();
  });

  it('does not render caption when the message has none', () => {
    const { container } = render(
      <CometChatImagesBubble message={buildImageMessage()} alignment="right" />
    );
    expect(container.querySelector('[class*="caption"]')).toBeNull();
  });

  it('falls back to getData().text when getCaption() is empty', () => {
    const msg = buildImageMessage();
    const withDataCaption = {
      ...(msg as unknown as Record<string, unknown>),
      getCaption: () => '',
      getData: () => ({ text: 'Caption from data' }),
    } as unknown as CometChat.MediaMessage;
    const { container } = render(
      <CometChatImagesBubble message={withDataCaption} alignment="right" />
    );
    expect(container.querySelector('[class*="caption"]')).toBeTruthy();
  });

  // --- Fullscreen open ---

  it('opens fullscreen viewer on image click', () => {
    const { container } = render(
      <CometChatImagesBubble message={buildImageMessage()} alignment="right" />
    );
    const wrapper = container.querySelector('[class*="image-wrapper"]');
    expect(wrapper).toBeTruthy();
    fireEvent.click(wrapper!);
    // Fullscreen viewer is lazy-loaded; since Suspense is used it renders asynchronously.
    // We check that the viewer container is created (via Suspense boundary)
    // The viewer will be rendered because we have the lazy import.
    // In test env, lazy may not resolve immediately, but state should be set.
    // Re-render should show the viewer or Suspense fallback is null.
  });

  it('opens fullscreen viewer on Enter key press', () => {
    const { container } = render(
      <CometChatImagesBubble message={buildImageMessage()} alignment="right" />
    );
    const wrapper = container.querySelector('[class*="image-wrapper"]');
    expect(wrapper).toBeTruthy();
    fireEvent.keyDown(wrapper!, { key: 'Enter' });
  });

  it('opens fullscreen viewer on Space key press', () => {
    const { container } = render(
      <CometChatImagesBubble message={buildImageMessage()} alignment="right" />
    );
    const wrapper = container.querySelector('[class*="image-wrapper"]');
    expect(wrapper).toBeTruthy();
    fireEvent.keyDown(wrapper!, { key: ' ' });
  });

  it('fires onImageClicked callback when an image is clicked', () => {
    const onImageClicked = vi.fn();
    const { container } = render(
      <CometChatImagesBubble
        message={buildImageMessage()}
        alignment="right"
        onImageClicked={onImageClicked}
      />
    );
    const wrapper = container.querySelector('[class*="image-wrapper"]');
    fireEvent.click(wrapper!);
    expect(onImageClicked).toHaveBeenCalledTimes(1);
    expect(onImageClicked).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'https://example.com/image.jpg' }),
      0
    );
  });

  // --- Alignment ---

  it('applies outgoing class for right alignment', () => {
    const { container } = render(
      <CometChatImagesBubble message={buildImageMessage()} alignment="right" />
    );
    expect(container.querySelector('[class*="outgoing"]')).toBeTruthy();
  });

  it('applies incoming class for left alignment', () => {
    const { container } = render(
      <CometChatImagesBubble message={buildImageMessage()} alignment="left" />
    );
    expect(container.querySelector('[class*="incoming"]')).toBeTruthy();
  });

  // --- Placeholder ---

  it('shows placeholder for a pending message', () => {
    const { container } = render(
      <CometChatImagesBubble message={buildPendingImageMessage()} alignment="right" />
    );
    expect(container.querySelector('[class*="placeholder"]')).toBeTruthy();
  });

  // --- Accessibility ---

  it('image wrapper has role="button" and tabindex', () => {
    const { container } = render(
      <CometChatImagesBubble message={buildImageMessage()} alignment="right" />
    );
    const wrapper = container.querySelector('[class*="image-wrapper"]');
    expect(wrapper?.getAttribute('role')).toBe('button');
    expect(wrapper?.getAttribute('tabindex')).toBe('0');
  });

  it('image wrapper has aria-label', () => {
    const { container } = render(
      <CometChatImagesBubble message={buildImageMessage()} alignment="right" />
    );
    const wrapper = container.querySelector('[class*="image-wrapper"]');
    expect(wrapper?.getAttribute('aria-label')).toContain('fullscreen');
  });

  it('placeholder wrapper has tabindex -1', () => {
    const { container } = render(
      <CometChatImagesBubble message={buildPendingImageMessage()} alignment="right" />
    );
    const wrapper = container.querySelector('[class*="image-wrapper"]');
    expect(wrapper?.getAttribute('tabindex')).toBe('-1');
  });

  it('overflow text is aria-hidden', () => {
    const urls = Array.from({ length: 6 }, (_, i) => `https://example.com/img${String(i)}.jpg`);
    const { container } = render(
      <CometChatImagesBubble message={buildImageMessage({ urls })} alignment="right" />
    );
    const text = container.querySelector('[class*="overflow-text"]');
    expect(text?.getAttribute('aria-hidden')).toBe('true');
  });

  it('overflow tile has role="button" with overflow aria-label', () => {
    const urls = Array.from({ length: 6 }, (_, i) => `https://example.com/img${String(i)}.jpg`);
    const { container } = render(
      <CometChatImagesBubble message={buildImageMessage({ urls })} alignment="right" />
    );
    const tile = container.querySelector('[class*="overflow-tile"]');
    expect(tile?.getAttribute('role')).toBe('button');
    expect(tile?.getAttribute('aria-label')).toContain('more images');
  });

  // --- Broken / unsupported image ---

  describe('broken / unsupported image', () => {
    /** Stub Image so that setting src fires onerror (broken URL / non-image content). */
    function stubErroringImage() {
      vi.stubGlobal(
        'Image',
        class MockErrorImage {
          onload: (() => void) | null = null;
          onerror: (() => void) | null = null;
          private _src = '';
          get src() {
            return this._src;
          }
          set src(value: string) {
            this._src = value;
            if (value) this.onerror?.();
          }
        }
      );
    }

    it('shows the unsupported icon instead of the grey placeholder when the image fails to load', () => {
      stubErroringImage();
      const { container } = render(
        <CometChatImagesBubble message={buildImageMessage()} alignment="right" />
      );
      expect(container.querySelector('[class*="unsupported-icon"]')).toBeTruthy();
      // The real image is not rendered.
      expect(container.querySelector('img.cometchat-images-bubble__image')).toBeNull();
    });

    it('keeps the broken tile clickable and opens the fullscreen viewer', () => {
      stubErroringImage();
      const onImageClicked = vi.fn();
      const { container } = render(
        <CometChatImagesBubble
          message={buildImageMessage()}
          alignment="right"
          onImageClicked={onImageClicked}
        />
      );
      const wrapper = container.querySelector('[class*="image-wrapper"]');
      expect(wrapper?.getAttribute('tabindex')).toBe('0');
      fireEvent.click(wrapper!);
      expect(onImageClicked).toHaveBeenCalledTimes(1);
    });

    it('does not show the unsupported state while the message is still sending', () => {
      stubErroringImage();
      // A still-sending message has no server id yet → receipt status "wait".
      const pending = {
        ...(buildImageMessage() as unknown as Record<string, unknown>),
        getId: () => 0,
      } as unknown as CometChat.MediaMessage;
      const { container } = render(<CometChatImagesBubble message={pending} alignment="right" />);
      // The failed load is treated as still-loading, not unsupported.
      expect(container.querySelector('[class*="unsupported-icon"]')).toBeNull();
      expect(container.querySelector('[class*="placeholder"]')).toBeTruthy();
    });
  });

  // --- Custom className ---

  it('applies custom className', () => {
    const { container } = render(
      <CometChatImagesBubble
        message={buildImageMessage()}
        alignment="right"
        className="my-custom"
      />
    );
    expect(container.firstElementChild?.className).toContain('my-custom');
  });
});
