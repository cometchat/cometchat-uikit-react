import { render } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatImageBubble } from '../CometChatImageBubble';
import { buildMediaMessage, buildUser } from '../../../testing/mock-builders';

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

/**
 * Build a mock image MediaMessage with N attachments (and optional caption / sender).
 * The bubble self-extracts attachments + caption from the message, so tests drive
 * everything through the message object rather than discrete props.
 */
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

/** Build a pending (optimistic) image message — no attachments yet, has a File in metadata. */
function buildPendingImageMessage(): CometChat.MediaMessage {
  const msg = buildImageMessage({ urls: [] });
  const file = new File([''], 'pending.jpg', { type: 'image/jpeg' });
  return {
    ...(msg as unknown as Record<string, unknown>),
    getAttachments: () => [],
    getMetadata: () => ({ file }),
  } as unknown as CometChat.MediaMessage;
}

describe('CometChatImageBubble', () => {
  // --- Rendering ---

  it('renders single image', () => {
    const { container } = render(
      <CometChatImageBubble message={buildImageMessage()} alignment="right" />
    );
    const img = container.querySelector('img');
    expect(img).toBeTruthy();
    expect(img?.getAttribute('src')).toBe('https://example.com/image.jpg');
  });

  it('renders nothing when the message has no attachments', () => {
    const { container } = render(
      <CometChatImageBubble message={buildImageMessage({ urls: [] })} alignment="right" />
    );
    expect(container.querySelector('img')).toBeNull();
  });

  it('applies outgoing class for right alignment', () => {
    const { container } = render(
      <CometChatImageBubble message={buildImageMessage()} alignment="right" />
    );
    expect(container.querySelector('[class*="outgoing"]')).toBeTruthy();
  });

  it('applies incoming class for left alignment', () => {
    const { container } = render(
      <CometChatImageBubble message={buildImageMessage()} alignment="left" />
    );
    expect(container.querySelector('[class*="incoming"]')).toBeTruthy();
  });

  it('falls back to incoming alignment when sender is not the logged-in user', () => {
    // No logged-in user in tests, so getBubbleAlignment resolves to 'left' (incoming).
    const { container } = render(<CometChatImageBubble message={buildImageMessage()} />);
    expect(container.querySelector('[class*="incoming"]')).toBeTruthy();
  });

  it('applies custom className', () => {
    const { container } = render(
      <CometChatImageBubble message={buildImageMessage()} alignment="right" className="my-custom" />
    );
    expect(container.firstElementChild?.className).toContain('my-custom');
  });

  // --- Image attributes ---

  it('sets async decoding on images', () => {
    const { container } = render(
      <CometChatImageBubble message={buildImageMessage()} alignment="right" />
    );
    const img = container.querySelector('img');
    expect(img?.getAttribute('decoding')).toBe('async');
  });

  it('sets alt text with sender name', () => {
    const { container } = render(
      <CometChatImageBubble
        message={buildImageMessage({ senderName: 'Alice' })}
        alignment="right"
      />
    );
    const img = container.querySelector('img');
    expect(img?.getAttribute('alt')).toBe('Photo from Alice');
  });

  it('uses the attachment url as src', () => {
    const { container } = render(
      <CometChatImageBubble
        message={buildImageMessage({ urls: ['https://example.com/full.jpg'] })}
        alignment="right"
      />
    );
    const img = container.querySelector('img');
    expect(img?.getAttribute('src')).toBe('https://example.com/full.jpg');
  });

  it('extracts attachment from a buildMediaMessage image message', () => {
    const message = buildMediaMessage({
      type: 'image',
      url: 'https://example.com/built.jpg',
    }) as unknown as CometChat.MediaMessage;
    const { container } = render(<CometChatImageBubble message={message} alignment="right" />);
    const img = container.querySelector('img');
    expect(img?.getAttribute('src')).toBe('https://example.com/built.jpg');
  });

  // --- Placeholder ---

  it('shows placeholder for a pending message (no url yet)', () => {
    const { container } = render(
      <CometChatImageBubble message={buildPendingImageMessage()} alignment="right" />
    );
    expect(container.querySelector('[class*="placeholder"]')).toBeTruthy();
    // No <img> with src should be rendered
    const imgs = container.querySelectorAll('img[src]');
    expect(Array.from(imgs).filter(img => img.getAttribute('src'))).toHaveLength(0);
  });

  it('renders image immediately when loaded (sync mock)', () => {
    // With our sync Image mock, onload fires immediately so image renders on first paint
    const { container } = render(
      <CometChatImageBubble message={buildImageMessage()} alignment="right" />
    );
    const img = container.querySelector('img[src="https://example.com/image.jpg"]');
    expect(img).toBeTruthy();
    // Placeholder should be gone since image loaded immediately
    expect(container.querySelector('[class*="placeholder"]')).toBeNull();
  });

  it('renders custom placeholderImage as img for a pending message', () => {
    const { container } = render(
      <CometChatImageBubble
        message={buildPendingImageMessage()}
        alignment="right"
        placeholderImage="https://example.com/custom-placeholder.png"
      />
    );
    const placeholderImg = container.querySelector(
      'img[src="https://example.com/custom-placeholder.png"]'
    );
    expect(placeholderImg).toBeTruthy();
    expect(placeholderImg?.getAttribute('alt')).toBe('');
  });

  // --- Caption ---

  it('renders caption extracted from the message', () => {
    const { container } = render(
      <CometChatImageBubble
        message={buildImageMessage({ caption: 'Beautiful sunset' })}
        alignment="right"
      />
    );
    expect(container.querySelector('[class*="caption"]')).toBeTruthy();
  });

  it('does not render caption when the message has none', () => {
    const { container } = render(
      <CometChatImageBubble message={buildImageMessage()} alignment="right" />
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
      <CometChatImageBubble message={withDataCaption} alignment="right" />
    );
    expect(container.querySelector('[class*="caption"]')).toBeTruthy();
  });

  // --- Grid layouts ---

  it('renders 2 images in a 2-col grid', () => {
    const { container } = render(
      <CometChatImageBubble
        message={buildImageMessage({
          urls: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
        })}
        alignment="right"
      />
    );
    expect(container.querySelector('[class*="grid--two-col"]')).toBeTruthy();
    expect(container.querySelectorAll('img[src]')).toHaveLength(2);
  });

  it('renders 3 images in a 1+2 grid', () => {
    const { container } = render(
      <CometChatImageBubble
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

  it('renders 4 images in a 2×2 grid', () => {
    const urls = Array.from({ length: 4 }, (_, i) => `https://example.com/img${String(i)}.jpg`);
    const { container } = render(
      <CometChatImageBubble message={buildImageMessage({ urls })} alignment="right" />
    );
    expect(container.querySelector('[class*="grid--2x2"]')).toBeTruthy();
    expect(container.querySelectorAll('img[src]')).toHaveLength(4);
  });

  it('renders overflow indicator for >4 images', () => {
    const urls = Array.from({ length: 6 }, (_, i) => `https://example.com/img${String(i)}.jpg`);
    const { container } = render(
      <CometChatImageBubble message={buildImageMessage({ urls })} alignment="right" />
    );
    expect(container.querySelector('[class*="overflow-tile"]')).toBeTruthy();
    expect(container.querySelector('[class*="overflow-text"]')?.textContent).toContain('+2');
  });

  // --- Accessibility ---

  it('image wrapper has role="button" and tabindex', () => {
    const { container } = render(
      <CometChatImageBubble message={buildImageMessage()} alignment="right" />
    );
    const wrapper = container.querySelector('[class*="image-wrapper"]');
    expect(wrapper?.getAttribute('role')).toBe('button');
    expect(wrapper?.getAttribute('tabindex')).toBe('0');
  });

  it('image wrapper has aria-label', () => {
    const { container } = render(
      <CometChatImageBubble message={buildImageMessage()} alignment="right" />
    );
    const wrapper = container.querySelector('[class*="image-wrapper"]');
    expect(wrapper?.getAttribute('aria-label')).toContain('fullscreen');
  });

  it('placeholder wrapper has tabindex -1', () => {
    const { container } = render(
      <CometChatImageBubble message={buildPendingImageMessage()} alignment="right" />
    );
    const wrapper = container.querySelector('[class*="image-wrapper"]');
    expect(wrapper?.getAttribute('tabindex')).toBe('-1');
  });

  it('overflow text is aria-hidden', () => {
    const urls = Array.from({ length: 6 }, (_, i) => `https://example.com/img${String(i)}.jpg`);
    const { container } = render(
      <CometChatImageBubble message={buildImageMessage({ urls })} alignment="right" />
    );
    const text = container.querySelector('[class*="overflow-text"]');
    expect(text?.getAttribute('aria-hidden')).toBe('true');
  });
});
