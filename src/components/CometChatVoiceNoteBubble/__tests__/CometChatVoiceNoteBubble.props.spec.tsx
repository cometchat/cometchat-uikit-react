/**
 * The public props of <CometChatVoiceNoteBubble />, one case each: the prop is set (or left out) on
 * the real component and the test checks what it changes. The voice note is drawn by the real audio
 * bubble and its caption by the real text bubble. Mocked: the SDK's logged-in user (it decides the
 * side of a bubble rendered without `alignment`) and the vendored WaveSurfer, since jsdom can't
 * decode audio.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatVoiceNoteBubble } from '../CometChatVoiceNoteBubble';
import { CometChatTextFormatter } from '../../../formatters/CometChatTextFormatter';
import { buildMediaMessage, buildUser } from '../../../testing/mock-builders';
import { covers } from '../../../testing/covers';

const wave = vi.hoisted(() => ({ load: vi.fn() }));

// No audio decoding in jsdom: a WaveSurfer that records what it was asked to load.
vi.mock('../../CometChatAudioBubble/wavesurfer', () => ({
  WaveSurfer: {
    create: () => ({
      on: vi.fn(),
      load: (url: string) => {
        wave.load(url);
        return Promise.resolve();
      },
      pause: vi.fn(),
      play: () => Promise.resolve(),
      stop: vi.fn(),
      seekTo: vi.fn(),
      destroy: vi.fn(),
      unAll: vi.fn(),
    }),
  },
}));

const me = buildUser({ uid: 'me', name: 'Me' }) as unknown as CometChat.User;
let signedIn: Promise<CometChat.User>;

beforeEach(() => {
  wave.load.mockClear();
  signedIn = Promise.resolve(me);
  vi.spyOn(CometChat, 'getLoggedinUser').mockReturnValue(signedIn);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function voiceNote({ from = 'them', caption = '', url = 'https://cdn.example.com/notes/hello.webm' } = {}) {
  const sender = buildUser({ uid: from, name: from });
  return {
    ...buildMediaMessage({ type: 'audio', sender }),
    getSender: () => sender,
    getAttachments: () => [{ name: 'hello.webm', url, mimeType: 'audio/webm', extension: 'webm', size: 4096 }],
    getCaption: () => caption,
    getData: () => ({ text: caption }),
    getMetadata: () => ({ audioType: 'voice_note' }),
  } as unknown as CometChat.MediaMessage;
}

/** Renders, then lets the logged-in user (an SDK promise) reach the bubbles. */
async function show(ui: React.ReactElement) {
  const view = render(ui);
  await act(() => signedIn);
  return view;
}

const bubbles = (container: HTMLElement) => Array.from(container.querySelectorAll<HTMLElement>('.cometchat-audio-bubble'));
const captionOf = (bubble: HTMLElement | undefined) => bubble?.querySelector('.cometchat-audio-bubble__caption .cometchat-text-bubble');
const captionText = (container: HTMLElement) =>
  container.querySelector('.cometchat-audio-bubble__caption .cometchat-text-bubble__text')?.textContent;

class Shout extends CometChatTextFormatter {
  readonly id = 'shout';
  override customLogicToFormatText(text: string) {
    return text.toUpperCase();
  }
}

describe('CometChatVoiceNoteBubble props', () => {
  it("message is the voice note played: the waveform loads its recording and its caption is shown", async () => {
    covers('CometChatVoiceNoteBubble.message', 'set');
    const { container } = await show(
      <CometChatVoiceNoteBubble message={voiceNote({ url: 'https://cdn.example.com/notes/standup.webm', caption: 'Standup notes' })} />
    );
    expect(wave.load).toHaveBeenCalledWith('https://cdn.example.com/notes/standup.webm');
    expect(container.querySelectorAll('.cometchat-audio-bubble__audio-item')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Play audio' })).toBeInTheDocument();
    expect(captionText(container)).toBe('Standup notes');
  });

  it('className is added to the bubble; by default it has only its own classes', async () => {
    covers('CometChatVoiceNoteBubble.className', 'set', 'default');
    let view = await show(<CometChatVoiceNoteBubble message={voiceNote()} className="app-voice-note" />);
    expect(bubbles(view.container)[0]).toHaveClass('app-voice-note', 'cometchat-audio-bubble', 'cometchat-audio-bubble--receiver');
    view.unmount();

    view = await show(<CometChatVoiceNoteBubble message={voiceNote()} />);
    expect(bubbles(view.container)[0]?.className).toBe('cometchat-audio-bubble cometchat-audio-bubble--receiver');
  });

  it('textFormatters rewrite the caption; by default it reads exactly as sent', async () => {
    covers('CometChatVoiceNoteBubble.textFormatters', 'set', 'default');
    const caption = 'Call me **now**: https://example.com/call';
    let view = await show(<CometChatVoiceNoteBubble message={voiceNote({ caption })} textFormatters={[new Shout()]} />);
    expect(captionText(view.container)).toBe('CALL ME **NOW**: HTTPS://EXAMPLE.COM/CALL');
    view.unmount();

    // No formatter runs by default: no bold, no link.
    view = await show(<CometChatVoiceNoteBubble message={voiceNote({ caption })} />);
    expect(captionText(view.container)).toBe(caption);
    expect(view.container.querySelector('.cometchat-audio-bubble__caption strong, .cometchat-audio-bubble__caption a')).toBeNull();
  });

  describe('alignment', () => {
    it('by default my voice notes are on the sender side and everyone else’s on the receiver side, captions too', async () => {
      covers('CometChatVoiceNoteBubble.alignment', 'default');
      const { container } = await show(
        <>
          <CometChatVoiceNoteBubble message={voiceNote({ from: 'me', caption: 'mine' })} />
          <CometChatVoiceNoteBubble message={voiceNote({ from: 'them', caption: 'theirs' })} />
        </>
      );
      const [mine, theirs] = bubbles(container);
      expect(mine).toHaveClass('cometchat-audio-bubble--sender');
      expect(captionOf(mine)).toHaveClass('cometchat-text-bubble--outgoing');
      expect(theirs).toHaveClass('cometchat-audio-bubble--receiver');
      expect(captionOf(theirs)).toHaveClass('cometchat-text-bubble--incoming');
    });

    it('"left" puts even my own voice note on the receiver side', async () => {
      covers('CometChatVoiceNoteBubble.alignment', 'left');
      const { container } = await show(
        <>
          <CometChatVoiceNoteBubble message={voiceNote({ from: 'me', caption: 'mine' })} />
          <CometChatVoiceNoteBubble message={voiceNote({ from: 'me', caption: 'mine' })} alignment="left" />
        </>
      );
      const [derived, left] = bubbles(container);
      expect(derived).toHaveClass('cometchat-audio-bubble--sender');
      expect(left).toHaveClass('cometchat-audio-bubble--receiver');
      expect(left).not.toHaveClass('cometchat-audio-bubble--sender');
      expect(captionOf(left)).toHaveClass('cometchat-text-bubble--incoming');
    });

    it('"right" puts someone else’s voice note on the sender side', async () => {
      covers('CometChatVoiceNoteBubble.alignment', 'right');
      const { container } = await show(
        <>
          <CometChatVoiceNoteBubble message={voiceNote({ from: 'them', caption: 'theirs' })} />
          <CometChatVoiceNoteBubble message={voiceNote({ from: 'them', caption: 'theirs' })} alignment="right" />
        </>
      );
      const [derived, right] = bubbles(container);
      expect(derived).toHaveClass('cometchat-audio-bubble--receiver');
      expect(right).toHaveClass('cometchat-audio-bubble--sender');
      expect(right).not.toHaveClass('cometchat-audio-bubble--receiver');
      expect(captionOf(right)).toHaveClass('cometchat-text-bubble--outgoing');
    });
  });
});
