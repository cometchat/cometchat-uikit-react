import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatVoiceNoteBubble } from '../CometChatVoiceNoteBubble';
import { buildMediaMessage, buildUser } from '../../../testing/mock-builders';

vi.mock('../../../hooks/useLoggedInUser', () => ({
  useLoggedInUser: () => buildUser({ uid: 'me', name: 'Me' }),
}));

// No real audio decoding in jsdom.
vi.mock('../../CometChatAudioBubble/wavesurfer', () => ({
  WaveSurfer: {
    create: () => ({
      on: vi.fn(),
      load: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn(),
      play: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn(),
      seekTo: vi.fn(),
      destroy: vi.fn(),
      unAll: vi.fn(),
    }),
  },
}));

function voiceNote(senderUid: string): CometChat.MediaMessage {
  const sender = buildUser({ uid: senderUid });
  return {
    ...buildMediaMessage({ type: 'audio', sender }),
    getSender: () => sender,
    getAttachments: () => [
      { name: 'voice.mp3', url: 'https://example.com/voice.mp3', mimeType: 'audio/mpeg', extension: 'mp3', size: 2048 },
    ],
    getCaption: () => '',
    getData: () => ({ text: '' }),
  } as unknown as CometChat.MediaMessage;
}

describe('CometChatVoiceNoteBubble', () => {
  it('renders the audio player for a voice note', () => {
    const { container } = render(<CometChatVoiceNoteBubble message={voiceNote('me')} />);
    expect(container.firstChild).toHaveClass('cometchat-audio-bubble');
  });

  it('passes the alignment on, so a received note sits on the incoming side', () => {
    const { container } = render(<CometChatVoiceNoteBubble message={voiceNote('them')} alignment="left" />);
    expect(container.innerHTML).toMatch(/incoming|receiver/);
  });
});
