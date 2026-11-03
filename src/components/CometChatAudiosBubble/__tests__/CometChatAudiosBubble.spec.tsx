import { render, fireEvent, screen } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatAudiosBubble } from '../CometChatAudiosBubble';
import { buildUser } from '../../../testing/mock-builders';

// --- Message builders ---

function buildAudioMessage(
  options: {
    attachments?: { url: string; name: string; duration?: number }[];
    caption?: string;
  } = {}
): CometChat.MediaMessage {
  const rawAttachments = options.attachments ?? [
    { url: 'https://example.com/audio.mp3', name: 'recording.mp3' },
  ];
  const caption = options.caption ?? '';
  const attachments = rawAttachments.map(att => ({
    url: att.url,
    name: att.name,
    getUrl: () => att.url,
    getName: () => att.name,
    getMimeType: () => 'audio/mpeg',
    getExtension: () => 'mp3',
    getSize: () => 102400,
    metadata: att.duration != null ? { duration: att.duration } : {},
  }));

  return {
    getId: () => 1,
    getType: () => 'audio',
    getCategory: () => 'message',
    getSender: () => buildUser({ name: 'Test User', avatar: '' }) as unknown as CometChat.User,
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
    getMetadata: () => ({ audioType: 'attachment' }),
    getReactions: () => [],
  } as unknown as CometChat.MediaMessage;
}

describe('CometChatAudiosBubble', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // --- Row render ---

  it('renders one row per audio attachment', () => {
    const { container } = render(
      <CometChatAudiosBubble
        message={buildAudioMessage({
          attachments: [
            { url: 'https://example.com/a1.mp3', name: 'track1.mp3' },
            { url: 'https://example.com/a2.mp3', name: 'track2.mp3' },
          ],
        })}
        alignment="right"
      />
    );
    const rows = container.querySelectorAll('.cometchat-audios-bubble__card');
    expect(rows).toHaveLength(2);
  });

  it('displays filename in the row', () => {
    const { container } = render(
      <CometChatAudiosBubble
        message={buildAudioMessage({
          attachments: [{ url: 'https://example.com/a.mp3', name: 'my-song.mp3' }],
        })}
        alignment="right"
      />
    );
    const name = container.querySelector('.cometchat-audios-bubble__name');
    expect(name?.textContent).toBe('my-song.mp3');
  });

  // --- Duration from metadata ---

  it('displays duration from attachment metadata', () => {
    const { container } = render(
      <CometChatAudiosBubble
        message={buildAudioMessage({
          attachments: [{ url: 'https://example.com/a.mp3', name: 'track.mp3', duration: 125 }],
        })}
        alignment="right"
      />
    );
    const duration = container.querySelector('.cometchat-audios-bubble__time');
    expect(duration?.textContent).toContain('2:05');
  });

  it('shows 0:00 placeholder when duration is unknown', () => {
    const { container } = render(
      <CometChatAudiosBubble
        message={buildAudioMessage({
          attachments: [{ url: 'https://example.com/a.mp3', name: 'track.mp3' }],
        })}
        alignment="right"
      />
    );
    const duration = container.querySelector('.cometchat-audios-bubble__time');
    expect(duration?.textContent).toContain('0:00');
  });

  // --- Playback ---

  it('plays the file when its play button is clicked, and the button turns to pause', () => {
    // jsdom plays nothing: record what is played, and report it started, as a browser does.
    const play = vi
      .spyOn(HTMLMediaElement.prototype, 'play')
      .mockImplementation(function (this: HTMLMediaElement) {
        this.dispatchEvent(new Event('play'));
        return Promise.resolve();
      });
    render(<CometChatAudiosBubble message={buildAudioMessage()} alignment="right" />);

    fireEvent.click(screen.getByRole('button', { name: 'Play audio' }));

    expect(play.mock.contexts.map(audio => (audio as HTMLAudioElement).src)).toEqual([
      'https://example.com/audio.mp3',
    ]);
    expect(screen.getByRole('button', { name: 'Pause audio' })).toBeInTheDocument();
  });

  // --- Caption ---

  it('renders caption when present', () => {
    const { container } = render(
      <CometChatAudiosBubble
        message={buildAudioMessage({ caption: 'Listen to this' })}
        alignment="right"
      />
    );
    expect(container.querySelector('.cometchat-audios-bubble__caption')).toHaveTextContent(
      'Listen to this'
    );
  });

  // --- Accessibility ---

  it('cards have a play button with aria-label', () => {
    render(<CometChatAudiosBubble message={buildAudioMessage()} alignment="right" />);
    expect(screen.getByRole('button', { name: 'Play audio' })).toHaveClass(
      'cometchat-audios-bubble__play-btn'
    );
  });

  it('cards display filename', () => {
    const { container } = render(
      <CometChatAudiosBubble
        message={buildAudioMessage({
          attachments: [{ url: 'https://example.com/a.mp3', name: 'podcast.mp3' }],
        })}
        alignment="right"
      />
    );
    const name = container.querySelector('.cometchat-audios-bubble__name');
    expect(name?.textContent).toContain('podcast.mp3');
  });

  // --- Show more / Show less ---

  it('labels the toggle "Show less" once the overflowing list is expanded', () => {
    const { container } = render(
      <CometChatAudiosBubble
        message={buildAudioMessage({
          attachments: [1, 2, 3, 4, 5].map(n => ({
            url: `https://example.com/a${String(n)}.mp3`,
            name: `track${String(n)}.mp3`,
          })),
        })}
        alignment="right"
      />
    );
    expect(container.querySelectorAll('.cometchat-audios-bubble__card')).toHaveLength(3);

    const showMore = container.querySelector('.cometchat-audios-bubble__toggle');
    expect(showMore).toHaveAttribute('aria-expanded', 'false');
    if (!showMore) throw new Error('show-more toggle not rendered');
    fireEvent.click(showMore);

    expect(container.querySelectorAll('.cometchat-audios-bubble__card')).toHaveLength(5);
    const showLess = container.querySelector('.cometchat-audios-bubble__toggle');
    expect(showLess).toHaveAttribute('aria-expanded', 'true');
    expect(showLess).toHaveAttribute('aria-label', 'Show less');
    expect(showLess?.textContent).toContain('Show less');
  });
});
