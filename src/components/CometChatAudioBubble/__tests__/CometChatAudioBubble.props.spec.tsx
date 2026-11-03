/**
 * The public props of <CometChatAudioBubble />, one case each: the prop is set (or left out) on the
 * real component and the test checks what it changes. The caption is drawn by the real text bubble.
 * Mocked: the SDK's logged-in user (it decides the side of a bubble rendered without `alignment`) and
 * the vendored WaveSurfer, since jsdom can't decode audio.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatAudioBubble } from '../CometChatAudioBubble';
import { CometChatTextFormatter } from '../../../formatters/CometChatTextFormatter';
import { buildMediaMessage, buildUser } from '../../../testing/mock-builders';
import { covers } from '../../../testing/covers';

const wave = vi.hoisted(() => ({ load: vi.fn() }));

// No audio decoding in jsdom: a WaveSurfer that records what it was asked to load.
vi.mock('../wavesurfer', () => ({
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

interface AudioOptions {
  from?: string;
  caption?: string;
  files?: { name: string; url: string }[];
}

function audio({ from = 'them', caption = '', files = [{ name: 'voice.mp3', url: 'https://cdn.example.com/a/voice.mp3' }] }: AudioOptions = {}) {
  const sender = buildUser({ uid: from, name: from });
  return {
    ...buildMediaMessage({ type: 'audio', sender }),
    getSender: () => sender,
    getAttachments: () => files.map(f => ({ ...f, mimeType: 'audio/mpeg', extension: 'mp3', size: 2048 })),
    getCaption: () => caption,
    getData: () => ({ text: caption }),
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

describe('CometChatAudioBubble props', () => {
  it("message is the audio played and the caption shown: the waveform loads the message's first attachment", async () => {
    covers('CometChatAudioBubble.message', 'set');
    const { container } = await show(
      <CometChatAudioBubble
        message={audio({
          caption: 'Listen to this',
          files: [
            { name: 'first.mp3', url: 'https://cdn.example.com/a/first.mp3' },
            { name: 'second.mp3', url: 'https://cdn.example.com/a/second.mp3' },
          ],
        })}
      />
    );
    expect(wave.load).toHaveBeenCalledWith('https://cdn.example.com/a/first.mp3');
    expect(wave.load).not.toHaveBeenCalledWith('https://cdn.example.com/a/second.mp3');
    expect(container.querySelectorAll('.cometchat-audio-bubble__audio-item')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Play audio' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download audio' })).toBeInTheDocument();
    expect(captionText(container)).toBe('Listen to this');
  });

  it('className is added to the bubble; by default it has only its own classes', async () => {
    covers('CometChatAudioBubble.className', 'set', 'default');
    let view = await show(<CometChatAudioBubble message={audio()} className="app-audio" />);
    expect(bubbles(view.container)[0]).toHaveClass('app-audio', 'cometchat-audio-bubble', 'cometchat-audio-bubble--receiver');
    view.unmount();

    view = await show(<CometChatAudioBubble message={audio()} />);
    expect(bubbles(view.container)[0]?.className).toBe('cometchat-audio-bubble cometchat-audio-bubble--receiver');
  });

  it('textFormatters rewrite the caption; by default it reads exactly as sent', async () => {
    covers('CometChatAudioBubble.textFormatters', 'set', 'default');
    const caption = 'Listen to **this**: https://example.com/song';
    let view = await show(<CometChatAudioBubble message={audio({ caption })} textFormatters={[new Shout()]} />);
    expect(captionText(view.container)).toBe('LISTEN TO **THIS**: HTTPS://EXAMPLE.COM/SONG');
    view.unmount();

    // No formatter runs by default: no bold, no link.
    view = await show(<CometChatAudioBubble message={audio({ caption })} />);
    expect(captionText(view.container)).toBe(caption);
    expect(view.container.querySelector('.cometchat-audio-bubble__caption strong, .cometchat-audio-bubble__caption a')).toBeNull();
  });

  describe('alignment', () => {
    it('by default my audio is on the sender side and everyone else’s on the receiver side, captions too', async () => {
      covers('CometChatAudioBubble.alignment', 'default');
      const { container } = await show(
        <>
          <CometChatAudioBubble message={audio({ from: 'me', caption: 'mine' })} />
          <CometChatAudioBubble message={audio({ from: 'them', caption: 'theirs' })} />
        </>
      );
      const [mine, theirs] = bubbles(container);
      expect(mine).toHaveClass('cometchat-audio-bubble--sender');
      expect(captionOf(mine)).toHaveClass('cometchat-text-bubble--outgoing');
      expect(theirs).toHaveClass('cometchat-audio-bubble--receiver');
      expect(captionOf(theirs)).toHaveClass('cometchat-text-bubble--incoming');
    });

    it('"left" puts even my own audio on the receiver side', async () => {
      covers('CometChatAudioBubble.alignment', 'left');
      const { container } = await show(
        <>
          <CometChatAudioBubble message={audio({ from: 'me', caption: 'mine' })} />
          <CometChatAudioBubble message={audio({ from: 'me', caption: 'mine' })} alignment="left" />
        </>
      );
      const [derived, left] = bubbles(container);
      expect(derived).toHaveClass('cometchat-audio-bubble--sender');
      expect(left).toHaveClass('cometchat-audio-bubble--receiver');
      expect(left).not.toHaveClass('cometchat-audio-bubble--sender');
      expect(captionOf(left)).toHaveClass('cometchat-text-bubble--incoming');
    });

    it('"right" puts someone else’s audio on the sender side', async () => {
      covers('CometChatAudioBubble.alignment', 'right');
      const { container } = await show(
        <>
          <CometChatAudioBubble message={audio({ from: 'them', caption: 'theirs' })} />
          <CometChatAudioBubble message={audio({ from: 'them', caption: 'theirs' })} alignment="right" />
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
