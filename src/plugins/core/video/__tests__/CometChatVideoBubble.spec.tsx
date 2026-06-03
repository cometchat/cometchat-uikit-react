import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CometChatVideoBubble } from '../CometChatVideoBubble';
import type { CometChatVideoBubbleAttachment } from '../CometChatVideoBubble.types';

function makeAttachment(
  overrides?: Partial<CometChatVideoBubbleAttachment>
): CometChatVideoBubbleAttachment {
  return {
    url: 'https://example.com/video.mp4',
    thumbnail: 'https://example.com/thumb.jpg',
    duration: 125,
    width: 1920,
    height: 1080,
    size: 5242880,
    mimeType: 'video/mp4',
    ...overrides,
  };
}

describe('CometChatVideoBubble', () => {
  // --- Single video (inline <video>) ---

  it('renders inline <video> for single attachment', () => {
    const { container } = render(
      <CometChatVideoBubble attachments={[makeAttachment()]} variant="outgoing" />
    );
    const video = container.querySelector('video');
    expect(video).toBeTruthy();
    expect(video?.getAttribute('controls')).not.toBeNull();
  });

  it('sets poster from thumbnail', () => {
    const { container } = render(
      <CometChatVideoBubble
        attachments={[makeAttachment({ thumbnail: 'https://example.com/poster.jpg' })]}
        variant="outgoing"
      />
    );
    const video = container.querySelector('video');
    expect(video?.getAttribute('poster')).toBe('https://example.com/poster.jpg');
  });

  it('sets preload="metadata" on video', () => {
    const { container } = render(
      <CometChatVideoBubble attachments={[makeAttachment()]} variant="outgoing" />
    );
    const video = container.querySelector('video');
    expect(video?.getAttribute('preload')).toBe('metadata');
  });

  it('sets aria-label with sender name on video', () => {
    const { container } = render(
      <CometChatVideoBubble
        attachments={[makeAttachment()]}
        variant="outgoing"
        senderName="Alice"
      />
    );
    const video = container.querySelector('video');
    expect(video?.getAttribute('aria-label')).toBe('Video from Alice');
  });

  it('sets fallback aria-label without sender name', () => {
    const { container } = render(
      <CometChatVideoBubble attachments={[makeAttachment()]} variant="outgoing" />
    );
    const video = container.querySelector('video');
    expect(video?.getAttribute('aria-label')).toBe('Video message');
  });

  it('renders nothing when attachments is empty', () => {
    const { container } = render(<CometChatVideoBubble attachments={[]} variant="outgoing" />);
    expect(container.querySelector('video')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
  });

  // --- Variant styling ---

  it('applies outgoing class', () => {
    const { container } = render(
      <CometChatVideoBubble attachments={[makeAttachment()]} variant="outgoing" />
    );
    expect(container.querySelector('[class*="outgoing"]')).toBeTruthy();
  });

  it('applies incoming class', () => {
    const { container } = render(
      <CometChatVideoBubble attachments={[makeAttachment()]} variant="incoming" />
    );
    expect(container.querySelector('[class*="incoming"]')).toBeTruthy();
  });

  it('applies custom className', () => {
    const { container } = render(
      <CometChatVideoBubble
        attachments={[makeAttachment()]}
        variant="outgoing"
        className="my-custom"
      />
    );
    expect(container.firstElementChild?.className).toContain('my-custom');
  });

  // --- Caption ---

  it('renders caption when provided', () => {
    const { container } = render(
      <CometChatVideoBubble
        attachments={[makeAttachment()]}
        variant="outgoing"
        caption="Check this out"
      />
    );
    expect(container.querySelector('[class*="caption"]')).toBeTruthy();
  });

  it('does not render caption when not provided', () => {
    const { container } = render(
      <CometChatVideoBubble attachments={[makeAttachment()]} variant="outgoing" />
    );
    expect(container.querySelector('[class*="caption"]')).toBeNull();
  });

  // --- Multi-video grid (thumbnails + play overlay) ---

  it('renders thumbnails (not <video>) for 2 attachments', () => {
    const atts = [makeAttachment(), makeAttachment({ url: 'https://example.com/v2.mp4' })];
    const { container } = render(<CometChatVideoBubble attachments={atts} variant="outgoing" />);
    expect(container.querySelectorAll('img[class*="thumbnail"]')).toHaveLength(2);
    expect(container.querySelector('video')).toBeNull();
  });

  it('renders play overlay on grid tiles', () => {
    const atts = [makeAttachment(), makeAttachment({ url: 'https://example.com/v2.mp4' })];
    const { container } = render(<CometChatVideoBubble attachments={atts} variant="outgoing" />);
    expect(container.querySelectorAll('[class*="play-overlay"]')).toHaveLength(2);
  });

  it('renders 2-col grid for 2 videos', () => {
    const atts = [makeAttachment(), makeAttachment({ url: 'https://example.com/v2.mp4' })];
    const { container } = render(<CometChatVideoBubble attachments={atts} variant="outgoing" />);
    expect(container.querySelector('[class*="grid--two-col"]')).toBeTruthy();
  });

  it('renders 1+2 grid for 3 videos', () => {
    const atts = Array.from({ length: 3 }, (_, i) =>
      makeAttachment({ url: `https://example.com/v${String(i)}.mp4` })
    );
    const { container } = render(<CometChatVideoBubble attachments={atts} variant="outgoing" />);
    expect(container.querySelector('[class*="grid--three"]')).toBeTruthy();
  });

  it('renders 2×2 grid for 4 videos', () => {
    const atts = Array.from({ length: 4 }, (_, i) =>
      makeAttachment({ url: `https://example.com/v${String(i)}.mp4` })
    );
    const { container } = render(<CometChatVideoBubble attachments={atts} variant="outgoing" />);
    expect(container.querySelector('[class*="grid--2x2"]')).toBeTruthy();
  });

  it('renders overflow indicator for >4 videos', () => {
    const atts = Array.from({ length: 6 }, (_, i) =>
      makeAttachment({ url: `https://example.com/v${String(i)}.mp4` })
    );
    const { container } = render(<CometChatVideoBubble attachments={atts} variant="outgoing" />);
    expect(container.querySelector('[class*="overflow-tile"]')).toBeTruthy();
    expect(container.querySelector('[class*="overflow-text"]')?.textContent).toContain('+2');
  });

  // --- Accessibility ---

  it('grid tile has role="button" and tabindex', () => {
    const atts = [makeAttachment(), makeAttachment({ url: 'https://example.com/v2.mp4' })];
    const { container } = render(<CometChatVideoBubble attachments={atts} variant="outgoing" />);
    const wrapper = container.querySelector('[class*="video-wrapper"]');
    expect(wrapper?.getAttribute('role')).toBe('button');
    expect(wrapper?.getAttribute('tabindex')).toBe('0');
  });

  it('grid tile has aria-label', () => {
    const atts = [makeAttachment(), makeAttachment({ url: 'https://example.com/v2.mp4' })];
    const { container } = render(<CometChatVideoBubble attachments={atts} variant="outgoing" />);
    const wrapper = container.querySelector('[class*="video-wrapper"]');
    const label = wrapper?.getAttribute('aria-label');
    expect(label).toContain('Play video');
  });

  it('play overlay is aria-hidden', () => {
    const atts = [makeAttachment(), makeAttachment({ url: 'https://example.com/v2.mp4' })];
    const { container } = render(<CometChatVideoBubble attachments={atts} variant="outgoing" />);
    const overlay = container.querySelector('[class*="play-overlay"]');
    expect(overlay?.getAttribute('aria-hidden')).toBe('true');
  });

  it('overflow text is aria-hidden', () => {
    const atts = Array.from({ length: 6 }, (_, i) =>
      makeAttachment({ url: `https://example.com/v${String(i)}.mp4` })
    );
    const { container } = render(<CometChatVideoBubble attachments={atts} variant="outgoing" />);
    const text = container.querySelector('[class*="overflow-text"]');
    expect(text?.getAttribute('aria-hidden')).toBe('true');
  });
});
