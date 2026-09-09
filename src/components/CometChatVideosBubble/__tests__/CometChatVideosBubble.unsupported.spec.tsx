import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatVideosBubble } from '../CometChatVideosBubble';
import { buildUser } from '../../../testing/mock-builders';
import { useVideoMeta } from '../../../hooks/useVideoMeta';

// Drive the video-probe result directly so we can exercise the invalid state
// without a real <video> element.
vi.mock('../../../hooks/useVideoMeta', () => ({
  useVideoMeta: vi.fn(),
}));

const mockedUseVideoMeta = vi.mocked(useVideoMeta);

function buildVideoMessage(
  options: { urls?: string[]; thumbnail?: string } = {}
): CometChat.MediaMessage {
  const urls = options.urls ?? ['https://example.com/not-a-video.mp3'];
  const attachments = urls.map(url => ({ url, getUrl: () => url, getSize: () => 1024000 }));
  const metadata = options.thumbnail
    ? {
        '@injected': {
          extensions: {
            'thumbnail-generation': { url_medium: options.thumbnail },
          },
        },
      }
    : {};

  return {
    getId: () => 1,
    getType: () => 'video',
    getCategory: () => 'message',
    getSender: () => buildUser({ name: 'Test User', avatar: '' }) as unknown as CometChat.User,
    getSentAt: () => Math.floor(Date.now() / 1000),
    getDeliveredAt: () => 0,
    getReadAt: () => 0,
    getEditedAt: () => 0,
    getDeletedAt: () => 0,
    getReplyCount: () => 0,
    getMuid: () => 'muid-1',
    getCaption: () => '',
    getData: () => ({ text: '' }),
    getAttachments: () => attachments,
    getMentionedUsers: () => [],
    getMetadata: () => metadata,
    getReactions: () => [],
  } as unknown as CometChat.MediaMessage;
}

describe('CometChatVideosBubble — unsupported / invalid video', () => {
  beforeEach(() => {
    mockedUseVideoMeta.mockReset();
  });

  it('renders the unsupported icon (no play icon, no duration) for an invalid video', () => {
    mockedUseVideoMeta.mockReturnValue({ duration: null, status: 'invalid' });
    const { container } = render(
      <CometChatVideosBubble message={buildVideoMessage()} alignment="right" />
    );
    expect(container.querySelector('.cometchat-videos-bubble__unsupported-icon')).toBeTruthy();
    expect(container.querySelector('.cometchat-videos-bubble__play-icon')).toBeNull();
    expect(container.querySelector('.cometchat-videos-bubble__duration')).toBeNull();
  });

  it('suppresses the thumbnail for an invalid video even when one exists', () => {
    mockedUseVideoMeta.mockReturnValue({ duration: null, status: 'invalid' });
    const { container } = render(
      <CometChatVideosBubble
        message={buildVideoMessage({ thumbnail: 'https://example.com/thumb.jpg' })}
        alignment="right"
      />
    );
    expect(container.querySelector('.cometchat-videos-bubble__thumbnail')).toBeNull();
    expect(container.querySelector('.cometchat-videos-bubble__unsupported-icon')).toBeTruthy();
  });

  it('keeps the invalid tile clickable so fullscreen can offer a download', () => {
    mockedUseVideoMeta.mockReturnValue({ duration: null, status: 'invalid' });
    const onVideoClicked = vi.fn();
    const { container } = render(
      <CometChatVideosBubble
        message={buildVideoMessage()}
        alignment="right"
        onVideoClicked={onVideoClicked}
      />
    );
    const tile = container.querySelector('.cometchat-videos-bubble__tile--unsupported');
    expect(tile?.getAttribute('tabindex')).toBe('0');
    fireEvent.click(tile!);
    expect(onVideoClicked).toHaveBeenCalledTimes(1);
  });

  it('does not show a thumbnail or duration while the probe is still loading', () => {
    mockedUseVideoMeta.mockReturnValue({ duration: 12, status: 'loading' });
    const { container } = render(
      <CometChatVideosBubble
        message={buildVideoMessage({ thumbnail: 'https://example.com/thumb.jpg' })}
        alignment="right"
      />
    );
    // No thumbnail flash and no duration until the media is confirmed a video.
    expect(container.querySelector('.cometchat-videos-bubble__thumbnail')).toBeNull();
    expect(container.querySelector('.cometchat-videos-bubble__duration')).toBeNull();
    // Not yet flagged unsupported either.
    expect(container.querySelector('.cometchat-videos-bubble__unsupported-icon')).toBeNull();
  });

  it('withholds the thumbnail until it has finished preloading', () => {
    // No Image stub here, so the preload never fires onload — the thumbnail <img>
    // must not be mounted yet. This avoids the single-video tile sizing to an
    // unloaded image before its natural dimensions (an extra layout jump).
    mockedUseVideoMeta.mockReturnValue({ duration: null, status: 'valid' });
    const { container } = render(
      <CometChatVideosBubble
        message={buildVideoMessage({ thumbnail: 'https://example.com/thumb.jpg' })}
        alignment="right"
      />
    );
    expect(container.querySelector('.cometchat-videos-bubble__thumbnail')).toBeNull();
    expect(container.querySelector('.cometchat-videos-bubble__play-icon')).toBeTruthy();
  });

  it('does not show the unsupported state while the message is still sending', () => {
    mockedUseVideoMeta.mockReturnValue({ duration: null, status: 'invalid' });
    // A still-sending message has no server id yet → receipt status "wait".
    const pending = {
      ...(buildVideoMessage() as unknown as Record<string, unknown>),
      getId: () => 0,
    } as unknown as CometChat.MediaMessage;
    const { container } = render(<CometChatVideosBubble message={pending} alignment="right" />);
    expect(container.querySelector('.cometchat-videos-bubble__unsupported-icon')).toBeNull();
  });

  it('shows a play icon and no unsupported icon for a valid video', () => {
    mockedUseVideoMeta.mockReturnValue({ duration: 12, status: 'valid' });
    const { container } = render(
      <CometChatVideosBubble message={buildVideoMessage()} alignment="right" />
    );
    expect(container.querySelector('.cometchat-videos-bubble__play-icon')).toBeTruthy();
    expect(container.querySelector('.cometchat-videos-bubble__unsupported-icon')).toBeNull();
    expect(container.querySelector('.cometchat-videos-bubble__duration')?.textContent).toContain(
      '0:12'
    );
  });
});
