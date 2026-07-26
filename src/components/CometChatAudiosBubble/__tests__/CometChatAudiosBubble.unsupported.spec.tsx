import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatAudiosBubble } from '../CometChatAudiosBubble';
import { buildUser } from '../../../testing/mock-builders';

function buildAudioMessage(
  attachments: { url: string; name: string; mimeType: string }[]
): CometChat.MediaMessage {
  const built = attachments.map(att => ({
    url: att.url,
    name: att.name,
    getUrl: () => att.url,
    getName: () => att.name,
    getMimeType: () => att.mimeType,
    getExtension: () => att.name.split('.').pop() ?? '',
    getSize: () => 102400,
    metadata: {},
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
    getCaption: () => '',
    getData: () => ({ text: '' }),
    getAttachments: () => built,
    getMentionedUsers: () => [],
    getMetadata: () => ({ audioType: 'attachment' }),
    getReactions: () => [],
  } as unknown as CometChat.MediaMessage;
}

describe('CometChatAudiosBubble — type mismatch', () => {
  it('renders an unsupported card (no player) when the mime type is not audio', () => {
    const { container } = render(
      <CometChatAudiosBubble
        message={buildAudioMessage([
          { url: 'https://example.com/data.bin', name: 'data.bin', mimeType: 'image/png' },
        ])}
        alignment="right"
      />
    );
    // Unsupported icon replaces the play button.
    expect(container.querySelector('.cometchat-audios-bubble__unsupported-icon')).toBeTruthy();
    expect(container.querySelector('.cometchat-audios-bubble__play-btn')).toBeNull();
    // No slider and no time readout.
    expect(container.querySelector('.cometchat-audios-bubble__slider')).toBeNull();
    expect(container.querySelector('.cometchat-audios-bubble__time')).toBeNull();
    // File name is still shown.
    expect(container.querySelector('.cometchat-audios-bubble__name')?.textContent).toBe('data.bin');
    // Download action is preserved.
    expect(container.querySelector('[class*="download"]')).toBeTruthy();
  });

  it('renders a normal player for a genuine audio mime type', () => {
    const { container } = render(
      <CometChatAudiosBubble
        message={buildAudioMessage([
          { url: 'https://example.com/a.mp3', name: 'song.mp3', mimeType: 'audio/mpeg' },
        ])}
        alignment="right"
      />
    );
    expect(container.querySelector('.cometchat-audios-bubble__play-btn')).toBeTruthy();
    expect(container.querySelector('.cometchat-audios-bubble__slider')).toBeTruthy();
    expect(container.querySelector('.cometchat-audios-bubble__unsupported-icon')).toBeNull();
  });
});
