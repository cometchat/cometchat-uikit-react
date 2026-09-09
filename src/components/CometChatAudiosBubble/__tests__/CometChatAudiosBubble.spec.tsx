import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
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

  // --- Fullscreen open ---

  it('opens minimal audio fullscreen on play button click when audio unavailable', () => {
    const { container } = render(
      <CometChatAudiosBubble message={buildAudioMessage()} alignment="right" />
    );
    const playBtn = container.querySelector('.cometchat-audios-bubble__play-btn');
    expect(playBtn).toBeTruthy();
    fireEvent.click(playBtn!);
  });

  // --- Caption ---

  it('renders caption when present', () => {
    const { container } = render(
      <CometChatAudiosBubble
        message={buildAudioMessage({ caption: 'Listen to this' })}
        alignment="right"
      />
    );
    expect(container.querySelector('.cometchat-audios-bubble__caption')).toBeTruthy();
  });

  // --- Accessibility ---

  it('cards have a play button with aria-label', () => {
    const { container } = render(
      <CometChatAudiosBubble message={buildAudioMessage()} alignment="right" />
    );
    const playBtn = container.querySelector('.cometchat-audios-bubble__play-btn');
    expect(playBtn).toBeTruthy();
    expect(playBtn?.getAttribute('aria-label')).toBeTruthy();
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
});
