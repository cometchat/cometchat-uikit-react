import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatVideoBubble } from '../CometChatVideoBubble';
import { buildMediaMessage, buildUser } from '../../../testing/mock-builders';

/** A single raw video attachment as the SDK exposes it (plain properties). */
interface RawVideoAttachment {
  url: string;
  thumbnail?: string;
  metadata?: { width?: number; height?: number; size?: number; mimeType?: string };
}

function makeRawAttachment(overrides?: Partial<RawVideoAttachment>): RawVideoAttachment {
  return {
    url: 'https://example.com/video.mp4',
    thumbnail: 'https://example.com/thumb.jpg',
    metadata: { width: 1920, height: 1080, size: 5242880, mimeType: 'video/mp4' },
    ...overrides,
  };
}

/**
 * Build a video MediaMessage. Uses buildMediaMessage for identity/sender, then
 * overrides the media accessors so the video extractor (which reads the raw
 * attachment objects) sees video-shaped data.
 */
function buildVideoMessage(
  options: {
    attachments?: RawVideoAttachment[];
    caption?: string;
    senderName?: string;
  } = {}
): CometChat.MediaMessage {
  const attachments = options.attachments ?? [makeRawAttachment()];
  const sender = buildUser({ uid: 'user-sender', name: options.senderName ?? 'Test User' });
  const base = buildMediaMessage({ type: 'video', sender });

  return {
    ...base,
    getSender: () => sender,
    getAttachments: () => attachments,
    getCaption: () => options.caption ?? '',
    getData: () => ({ text: options.caption ?? '' }),
    getMetadata: () => ({}),
  } as unknown as CometChat.MediaMessage;
}

describe('CometChatVideoBubble', () => {
  // --- Single video (inline <video>) ---

  it('renders inline <video> for single attachment', () => {
    const { container } = render(<CometChatVideoBubble message={buildVideoMessage()} />);
    const video = container.querySelector('video');
    expect(video).toBeTruthy();
    expect(video?.getAttribute('controls')).not.toBeNull();
  });

  it('sets poster from thumbnail', () => {
    const { container } = render(
      <CometChatVideoBubble
        message={buildVideoMessage({
          attachments: [makeRawAttachment({ thumbnail: 'https://example.com/poster.jpg' })],
        })}
      />
    );
    const video = container.querySelector('video');
    expect(video?.getAttribute('poster')).toBe('https://example.com/poster.jpg');
  });

  it('sets preload="metadata" on video', () => {
    const { container } = render(<CometChatVideoBubble message={buildVideoMessage()} />);
    const video = container.querySelector('video');
    expect(video?.getAttribute('preload')).toBe('metadata');
  });

  it('sets aria-label with sender name on video', () => {
    const { container } = render(
      <CometChatVideoBubble message={buildVideoMessage({ senderName: 'Alice' })} />
    );
    const video = container.querySelector('video');
    expect(video?.getAttribute('aria-label')).toBe('Video from Alice');
  });

  it('sets fallback aria-label when the sender has no name', () => {
    const { container } = render(
      <CometChatVideoBubble message={buildVideoMessage({ senderName: '' })} />
    );
    const video = container.querySelector('video');
    expect(video?.getAttribute('aria-label')).toBe('Video message');
  });

  it('renders nothing when there are no attachments', () => {
    const { container } = render(
      <CometChatVideoBubble message={buildVideoMessage({ attachments: [] })} />
    );
    expect(container.querySelector('video')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
  });

  // --- Variant styling (derived from alignment) ---

  it('applies outgoing class for right alignment', () => {
    const { container } = render(
      <CometChatVideoBubble message={buildVideoMessage()} alignment="right" />
    );
    expect(container.querySelector('[class*="outgoing"]')).toBeTruthy();
  });

  it('applies incoming class for left alignment', () => {
    const { container } = render(
      <CometChatVideoBubble message={buildVideoMessage()} alignment="left" />
    );
    expect(container.querySelector('[class*="incoming"]')).toBeTruthy();
  });

  it('derives incoming alignment from sender when alignment omitted', () => {
    // No logged-in user in tests, so sender never matches → left/incoming.
    const { container } = render(<CometChatVideoBubble message={buildVideoMessage()} />);
    expect(container.querySelector('[class*="incoming"]')).toBeTruthy();
  });

  it('applies custom className', () => {
    const { container } = render(
      <CometChatVideoBubble message={buildVideoMessage()} alignment="right" className="my-custom" />
    );
    expect(container.firstElementChild?.className).toContain('my-custom');
  });

  // --- Caption ---

  it('renders caption when the message has one', () => {
    const { container } = render(
      <CometChatVideoBubble
        message={buildVideoMessage({ caption: 'Check this out' })}
        alignment="right"
      />
    );
    expect(container.querySelector('[class*="caption"]')).toBeTruthy();
  });

  it('does not render caption when the message has none', () => {
    const { container } = render(
      <CometChatVideoBubble message={buildVideoMessage()} alignment="right" />
    );
    expect(container.querySelector('[class*="caption"]')).toBeNull();
  });

  // --- Multi-video grid (thumbnails + play overlay) ---

  it('renders thumbnails (not <video>) for 2 attachments', () => {
    const message = buildVideoMessage({
      attachments: [makeRawAttachment(), makeRawAttachment({ url: 'https://example.com/v2.mp4' })],
    });
    const { container } = render(<CometChatVideoBubble message={message} alignment="right" />);
    expect(container.querySelectorAll('img[class*="thumbnail"]')).toHaveLength(2);
    expect(container.querySelector('video')).toBeNull();
  });

  it('renders play overlay on grid tiles', () => {
    const message = buildVideoMessage({
      attachments: [makeRawAttachment(), makeRawAttachment({ url: 'https://example.com/v2.mp4' })],
    });
    const { container } = render(<CometChatVideoBubble message={message} alignment="right" />);
    expect(container.querySelectorAll('[class*="play-overlay"]')).toHaveLength(2);
  });

  it('renders 2-col grid for 2 videos', () => {
    const message = buildVideoMessage({
      attachments: [makeRawAttachment(), makeRawAttachment({ url: 'https://example.com/v2.mp4' })],
    });
    const { container } = render(<CometChatVideoBubble message={message} alignment="right" />);
    expect(container.querySelector('[class*="grid--two-col"]')).toBeTruthy();
  });

  it('renders 1+2 grid for 3 videos', () => {
    const message = buildVideoMessage({
      attachments: Array.from({ length: 3 }, (_, i) =>
        makeRawAttachment({ url: `https://example.com/v${String(i)}.mp4` })
      ),
    });
    const { container } = render(<CometChatVideoBubble message={message} alignment="right" />);
    expect(container.querySelector('[class*="grid--three"]')).toBeTruthy();
  });

  it('renders 2×2 grid for 4 videos', () => {
    const message = buildVideoMessage({
      attachments: Array.from({ length: 4 }, (_, i) =>
        makeRawAttachment({ url: `https://example.com/v${String(i)}.mp4` })
      ),
    });
    const { container } = render(<CometChatVideoBubble message={message} alignment="right" />);
    expect(container.querySelector('[class*="grid--2x2"]')).toBeTruthy();
  });

  it('renders overflow indicator for >4 videos', () => {
    const message = buildVideoMessage({
      attachments: Array.from({ length: 6 }, (_, i) =>
        makeRawAttachment({ url: `https://example.com/v${String(i)}.mp4` })
      ),
    });
    const { container } = render(<CometChatVideoBubble message={message} alignment="right" />);
    expect(container.querySelector('[class*="overflow-tile"]')).toBeTruthy();
    expect(container.querySelector('[class*="overflow-text"]')?.textContent).toContain('+2');
  });

  // --- Accessibility ---

  it('grid tile has role="button" and tabindex', () => {
    const message = buildVideoMessage({
      attachments: [makeRawAttachment(), makeRawAttachment({ url: 'https://example.com/v2.mp4' })],
    });
    const { container } = render(<CometChatVideoBubble message={message} alignment="right" />);
    const wrapper = container.querySelector('[class*="video-wrapper"]');
    expect(wrapper?.getAttribute('role')).toBe('button');
    expect(wrapper?.getAttribute('tabindex')).toBe('0');
  });

  it('grid tile has aria-label', () => {
    const message = buildVideoMessage({
      attachments: [makeRawAttachment(), makeRawAttachment({ url: 'https://example.com/v2.mp4' })],
    });
    const { container } = render(<CometChatVideoBubble message={message} alignment="right" />);
    const wrapper = container.querySelector('[class*="video-wrapper"]');
    expect(wrapper?.getAttribute('aria-label')).toContain('Play video');
  });

  it('play overlay is aria-hidden', () => {
    const message = buildVideoMessage({
      attachments: [makeRawAttachment(), makeRawAttachment({ url: 'https://example.com/v2.mp4' })],
    });
    const { container } = render(<CometChatVideoBubble message={message} alignment="right" />);
    const overlay = container.querySelector('[class*="play-overlay"]');
    expect(overlay?.getAttribute('aria-hidden')).toBe('true');
  });

  it('overflow text is aria-hidden', () => {
    const message = buildVideoMessage({
      attachments: Array.from({ length: 6 }, (_, i) =>
        makeRawAttachment({ url: `https://example.com/v${String(i)}.mp4` })
      ),
    });
    const { container } = render(<CometChatVideoBubble message={message} alignment="right" />);
    const text = container.querySelector('[class*="overflow-text"]');
    expect(text?.getAttribute('aria-hidden')).toBe('true');
  });
});
