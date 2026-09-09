import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatVideosBubble } from '../CometChatVideosBubble';
import { buildUser } from '../../../testing/mock-builders';

// These tests exercise valid videos (layout, thumbnails, captions). The real
// probe never resolves in jsdom, so force a 'valid' result — the thumbnail and
// duration now render only once the media is confirmed to be a video. Invalid
// behaviour is covered in CometChatVideosBubble.unsupported.spec.tsx.
vi.mock('../../../hooks/useVideoMeta', () => ({
  useVideoMeta: () => ({ duration: null, status: 'valid' }),
}));

// The tile preloads the thumbnail via `new Image()` and only renders it after
// onload — which never fires in jsdom. Stub Image so onload fires synchronously.
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
        if (value) this.onload?.();
      }
    }
  );
});

// --- Message builders ---

function buildVideoMessage(
  options: {
    urls?: string[];
    caption?: string;
    senderName?: string;
    metadata?: Record<string, unknown>;
  } = {}
): CometChat.MediaMessage {
  const urls = options.urls ?? ['https://example.com/video.mp4'];
  const caption = options.caption ?? '';
  const attachments = urls.map(url => ({
    url,
    getUrl: () => url,
    getSize: () => 1024000,
  }));

  return {
    getId: () => 1,
    getType: () => 'video',
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
    getMetadata: () => options.metadata ?? {},
    getReactions: () => [],
  } as unknown as CometChat.MediaMessage;
}

describe('CometChatVideosBubble', () => {
  // --- Thumbnail present vs fallback (black square + play) ---
  // Thumbnails come from the `@injected` thumbnail-generation metadata (see the
  // metadata test below), not from the attachment — the SDK Attachment has no
  // thumbnail field.

  it('renders play icon over black tile when thumbnail is absent', () => {
    const { container } = render(
      <CometChatVideosBubble
        message={buildVideoMessage({ urls: ['https://example.com/video.mp4'] })}
        alignment="right"
      />
    );
    // No thumbnail image
    expect(container.querySelector('.cometchat-videos-bubble__thumbnail')).toBeNull();
    // Play icon is present
    expect(container.querySelector('.cometchat-videos-bubble__play-icon')).toBeTruthy();
    // Tile has dark background (the default CSS class)
    const tile = container.querySelector('.cometchat-videos-bubble__tile');
    expect(tile).toBeTruthy();
  });

  it('falls back to the top-level thumbnail-generation thumbnail for the first video', () => {
    // No per-attachment `attachments[]` array — the legacy top-level `url_medium`
    // applies to the first video only.
    const { container } = render(
      <CometChatVideosBubble
        message={buildVideoMessage({
          urls: ['https://example.com/video.mp4'],
          metadata: {
            '@injected': {
              extensions: {
                'thumbnail-generation': {
                  url_medium: 'https://example.com/generated-thumb.jpg',
                },
              },
            },
          },
        })}
        alignment="right"
      />
    );
    const thumb = container.querySelector('.cometchat-videos-bubble__thumbnail');
    expect(thumb).toBeTruthy();
    expect(thumb?.getAttribute('src')).toBe('https://example.com/generated-thumb.jpg');
  });

  it('renders a per-video thumbnail from thumbnail-generation attachments[]', () => {
    const { container } = render(
      <CometChatVideosBubble
        message={buildVideoMessage({
          urls: ['https://example.com/v0.mp4', 'https://example.com/v1.mp4'],
          metadata: {
            '@injected': {
              extensions: {
                'thumbnail-generation': {
                  attachments: [
                    { data: { thumbnails: { url_medium: 'https://example.com/thumb0.jpg' } } },
                    { data: { thumbnails: { url_medium: 'https://example.com/thumb1.jpg' } } },
                  ],
                  // Top-level should be ignored when a per-attachment thumbnail exists.
                  url_medium: 'https://example.com/top-level.jpg',
                },
              },
            },
          },
        })}
        alignment="right"
      />
    );
    const thumbs = container.querySelectorAll('.cometchat-videos-bubble__thumbnail');
    expect(thumbs).toHaveLength(2);
    expect(thumbs[0]?.getAttribute('src')).toBe('https://example.com/thumb0.jpg');
    expect(thumbs[1]?.getAttribute('src')).toBe('https://example.com/thumb1.jpg');
  });

  it('uses the top-level thumbnail as fallback only for the first video that lacks one', () => {
    const { container } = render(
      <CometChatVideosBubble
        message={buildVideoMessage({
          urls: ['https://example.com/v0.mp4', 'https://example.com/v1.mp4'],
          metadata: {
            '@injected': {
              extensions: {
                'thumbnail-generation': {
                  attachments: [
                    { data: { thumbnails: {} } }, // first video: no per-attachment thumbnail
                    { data: { thumbnails: { url_medium: 'https://example.com/thumb1.jpg' } } },
                  ],
                  url_medium: 'https://example.com/top-level.jpg',
                },
              },
            },
          },
        })}
        alignment="right"
      />
    );
    const thumbs = container.querySelectorAll('.cometchat-videos-bubble__thumbnail');
    expect(thumbs[0]?.getAttribute('src')).toBe('https://example.com/top-level.jpg');
    expect(thumbs[1]?.getAttribute('src')).toBe('https://example.com/thumb1.jpg');
  });

  // --- Layout counts ---

  it('renders single layout for 1 video', () => {
    const { container } = render(
      <CometChatVideosBubble
        message={buildVideoMessage({ urls: ['https://example.com/v1.mp4'] })}
        alignment="right"
      />
    );
    expect(container.querySelector('[class*="--single"]')).toBeTruthy();
  });

  it('renders side-by-side grid for 2 videos', () => {
    const urls = ['https://example.com/v1.mp4', 'https://example.com/v2.mp4'];
    const { container } = render(
      <CometChatVideosBubble message={buildVideoMessage({ urls })} alignment="right" />
    );
    expect(container.querySelector('[class*="grid--two-col"]')).toBeTruthy();
    expect(container.querySelectorAll('.cometchat-videos-bubble__tile')).toHaveLength(2);
  });

  it('renders 3 videos in grid', () => {
    const urls = Array.from({ length: 3 }, (_, i) => `https://example.com/v${String(i)}.mp4`);
    const { container } = render(
      <CometChatVideosBubble message={buildVideoMessage({ urls })} alignment="right" />
    );
    expect(container.querySelector('[class*="grid--three"]')).toBeTruthy();
  });

  it('renders 4 videos in 2x2 grid', () => {
    const urls = Array.from({ length: 4 }, (_, i) => `https://example.com/v${String(i)}.mp4`);
    const { container } = render(
      <CometChatVideosBubble message={buildVideoMessage({ urls })} alignment="right" />
    );
    expect(container.querySelector('[class*="grid--2x2"]')).toBeTruthy();
  });

  it('renders overflow indicator for 5+ videos', () => {
    const urls = Array.from({ length: 6 }, (_, i) => `https://example.com/v${String(i)}.mp4`);
    const { container } = render(
      <CometChatVideosBubble message={buildVideoMessage({ urls })} alignment="right" />
    );
    expect(container.querySelector('.cometchat-videos-bubble__overflow-tile')).toBeTruthy();
    expect(
      container.querySelector('.cometchat-videos-bubble__overflow-text')?.textContent
    ).toContain('+2');
  });

  // --- Caption ---

  it('renders caption when present', () => {
    const { container } = render(
      <CometChatVideosBubble
        message={buildVideoMessage({ caption: 'Check this out' })}
        alignment="right"
      />
    );
    expect(container.querySelector('.cometchat-videos-bubble__caption')).toBeTruthy();
  });

  it('does not render caption when absent', () => {
    const { container } = render(
      <CometChatVideosBubble message={buildVideoMessage()} alignment="right" />
    );
    expect(container.querySelector('.cometchat-videos-bubble__caption')).toBeNull();
  });

  // --- Fullscreen open ---

  it('opens fullscreen viewer on tile click', () => {
    const onVideoClicked = vi.fn();
    const { container } = render(
      <CometChatVideosBubble
        message={buildVideoMessage()}
        alignment="right"
        onVideoClicked={onVideoClicked}
      />
    );
    const tile = container.querySelector('.cometchat-videos-bubble__tile');
    expect(tile).toBeTruthy();
    fireEvent.click(tile!);
    expect(onVideoClicked).toHaveBeenCalledTimes(1);
  });

  it('opens fullscreen on Enter key press', () => {
    const onVideoClicked = vi.fn();
    const { container } = render(
      <CometChatVideosBubble
        message={buildVideoMessage()}
        alignment="right"
        onVideoClicked={onVideoClicked}
      />
    );
    const tile = container.querySelector('.cometchat-videos-bubble__tile');
    fireEvent.keyDown(tile!, { key: 'Enter' });
    expect(onVideoClicked).toHaveBeenCalled();
  });

  // --- Accessibility ---

  it('tiles have role="button" and tabindex', () => {
    const { container } = render(
      <CometChatVideosBubble message={buildVideoMessage()} alignment="right" />
    );
    const tile = container.querySelector('.cometchat-videos-bubble__tile');
    expect(tile?.getAttribute('role')).toBe('button');
    expect(tile?.getAttribute('tabindex')).toBe('0');
  });
});
