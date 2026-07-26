/* eslint-disable @typescript-eslint/no-deprecated -- this file intentionally exercises the deprecated legacy bubble it covers */
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

  // Multi-video grid, play overlays, overflow, and grid-tile accessibility moved
  // to the batch-aware CometChatVideosBubble (see its spec). The singular bubble
  // renders one video as an inline <video> element.
});
