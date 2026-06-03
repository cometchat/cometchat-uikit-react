import { render } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CometChatImageBubble } from '../CometChatImageBubble';
import type { CometChatImageBubbleAttachment } from '../CometChatImageBubble.types';

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

function makeAttachment(
  overrides?: Partial<CometChatImageBubbleAttachment>
): CometChatImageBubbleAttachment {
  return {
    url: 'https://example.com/image.jpg',
    size: 204800,
    ...overrides,
  };
}

describe('CometChatImageBubble', () => {
  // --- Rendering ---

  it('renders single image', () => {
    const { container } = render(
      <CometChatImageBubble attachments={[makeAttachment()]} variant="outgoing" />
    );
    const img = container.querySelector('img');
    expect(img).toBeTruthy();
    expect(img?.getAttribute('src')).toBe('https://example.com/image.jpg');
  });

  it('renders nothing when attachments is empty', () => {
    const { container } = render(<CometChatImageBubble attachments={[]} variant="outgoing" />);
    expect(container.querySelector('img')).toBeNull();
  });

  it('applies outgoing class', () => {
    const { container } = render(
      <CometChatImageBubble attachments={[makeAttachment()]} variant="outgoing" />
    );
    expect(container.querySelector('[class*="outgoing"]')).toBeTruthy();
  });

  it('applies incoming class', () => {
    const { container } = render(
      <CometChatImageBubble attachments={[makeAttachment()]} variant="incoming" />
    );
    expect(container.querySelector('[class*="incoming"]')).toBeTruthy();
  });

  it('applies custom className', () => {
    const { container } = render(
      <CometChatImageBubble
        attachments={[makeAttachment()]}
        variant="outgoing"
        className="my-custom"
      />
    );
    expect(container.firstElementChild?.className).toContain('my-custom');
  });

  // --- Image attributes ---

  it('sets async decoding on images', () => {
    const { container } = render(
      <CometChatImageBubble attachments={[makeAttachment()]} variant="outgoing" />
    );
    const img = container.querySelector('img');
    expect(img?.getAttribute('decoding')).toBe('async');
  });

  it('sets alt text with sender name', () => {
    const { container } = render(
      <CometChatImageBubble
        attachments={[makeAttachment()]}
        variant="outgoing"
        senderName="Alice"
      />
    );
    const img = container.querySelector('img');
    expect(img?.getAttribute('alt')).toBe('Photo from Alice');
  });

  it('sets fallback alt text without sender name', () => {
    const { container } = render(
      <CometChatImageBubble attachments={[makeAttachment()]} variant="outgoing" />
    );
    const img = container.querySelector('img');
    expect(img?.getAttribute('alt')).toBe('Photo');
  });

  it('uses url as src', () => {
    const { container } = render(
      <CometChatImageBubble
        attachments={[makeAttachment({ url: 'https://example.com/full.jpg' })]}
        variant="outgoing"
      />
    );
    const img = container.querySelector('img');
    expect(img?.getAttribute('src')).toBe('https://example.com/full.jpg');
  });

  // --- Placeholder ---

  it('shows placeholder when url is empty (pending message)', () => {
    const { container } = render(
      <CometChatImageBubble attachments={[{ url: '' }]} variant="outgoing" />
    );
    expect(container.querySelector('[class*="placeholder"]')).toBeTruthy();
    // No <img> with src should be rendered
    const imgs = container.querySelectorAll('img[src]');
    expect(Array.from(imgs).filter(img => img.getAttribute('src'))).toHaveLength(0);
  });

  it('renders image immediately when loaded (sync mock)', () => {
    // With our sync Image mock, onload fires immediately so image renders on first paint
    const { container } = render(
      <CometChatImageBubble attachments={[makeAttachment()]} variant="outgoing" />
    );
    const img = container.querySelector('img[src="https://example.com/image.jpg"]');
    expect(img).toBeTruthy();
    // Placeholder should be gone since image loaded immediately
    expect(container.querySelector('[class*="placeholder"]')).toBeNull();
  });

  it('renders custom placeholderImage as img when url is empty', () => {
    const { container } = render(
      <CometChatImageBubble
        attachments={[{ url: '' }]}
        variant="outgoing"
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

  it('renders caption when provided', () => {
    const { container } = render(
      <CometChatImageBubble
        attachments={[makeAttachment()]}
        variant="outgoing"
        caption="Beautiful sunset"
      />
    );
    expect(container.querySelector('[class*="caption"]')).toBeTruthy();
  });

  it('does not render caption when not provided', () => {
    const { container } = render(
      <CometChatImageBubble attachments={[makeAttachment()]} variant="outgoing" />
    );
    expect(container.querySelector('[class*="caption"]')).toBeNull();
  });

  // --- Grid layouts ---

  it('renders 2 images in a 2-col grid', () => {
    const { container } = render(
      <CometChatImageBubble
        attachments={[makeAttachment(), makeAttachment({ url: 'https://example.com/img2.jpg' })]}
        variant="outgoing"
      />
    );
    expect(container.querySelector('[class*="grid--two-col"]')).toBeTruthy();
    expect(container.querySelectorAll('img[src]')).toHaveLength(2);
  });

  it('renders 3 images in a 1+2 grid', () => {
    const { container } = render(
      <CometChatImageBubble
        attachments={[
          makeAttachment(),
          makeAttachment({ url: 'https://example.com/img2.jpg' }),
          makeAttachment({ url: 'https://example.com/img3.jpg' }),
        ]}
        variant="outgoing"
      />
    );
    expect(container.querySelector('[class*="grid--three"]')).toBeTruthy();
    expect(container.querySelectorAll('img[src]')).toHaveLength(3);
  });

  it('renders 4 images in a 2×2 grid', () => {
    const atts = Array.from({ length: 4 }, (_, i) =>
      makeAttachment({ url: `https://example.com/img${String(i)}.jpg` })
    );
    const { container } = render(<CometChatImageBubble attachments={atts} variant="outgoing" />);
    expect(container.querySelector('[class*="grid--2x2"]')).toBeTruthy();
    expect(container.querySelectorAll('img[src]')).toHaveLength(4);
  });

  it('renders overflow indicator for >4 images', () => {
    const atts = Array.from({ length: 6 }, (_, i) =>
      makeAttachment({ url: `https://example.com/img${String(i)}.jpg` })
    );
    const { container } = render(<CometChatImageBubble attachments={atts} variant="outgoing" />);
    expect(container.querySelector('[class*="overflow-tile"]')).toBeTruthy();
    expect(container.querySelector('[class*="overflow-text"]')?.textContent).toContain('+2');
  });

  // --- Accessibility ---

  it('image wrapper has role="button" and tabindex', () => {
    const { container } = render(
      <CometChatImageBubble attachments={[makeAttachment()]} variant="outgoing" />
    );
    const wrapper = container.querySelector('[class*="image-wrapper"]');
    expect(wrapper?.getAttribute('role')).toBe('button');
    expect(wrapper?.getAttribute('tabindex')).toBe('0');
  });

  it('image wrapper has aria-label', () => {
    const { container } = render(
      <CometChatImageBubble attachments={[makeAttachment()]} variant="outgoing" />
    );
    const wrapper = container.querySelector('[class*="image-wrapper"]');
    expect(wrapper?.getAttribute('aria-label')).toContain('fullscreen');
  });

  it('placeholder wrapper has tabindex -1', () => {
    const { container } = render(
      <CometChatImageBubble attachments={[{ url: '' }]} variant="outgoing" />
    );
    const wrapper = container.querySelector('[class*="image-wrapper"]');
    expect(wrapper?.getAttribute('tabindex')).toBe('-1');
  });

  it('overflow text is aria-hidden', () => {
    const atts = Array.from({ length: 6 }, (_, i) =>
      makeAttachment({ url: `https://example.com/img${String(i)}.jpg` })
    );
    const { container } = render(<CometChatImageBubble attachments={atts} variant="outgoing" />);
    const text = container.querySelector('[class*="overflow-text"]');
    expect(text?.getAttribute('aria-hidden')).toBe('true');
  });
});
