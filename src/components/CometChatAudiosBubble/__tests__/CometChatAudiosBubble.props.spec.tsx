/**
 * The public props of <CometChatAudiosBubble />, one case each: the prop is set (or left out) on the
 * real component and the test checks what it changes. The caption is drawn by the real text bubble.
 * Only the SDK is touched: the logged-in user, which decides the side of a bubble rendered without
 * `alignment`, comes from CometChat.getLoggedinUser().
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatAudiosBubble } from '../CometChatAudiosBubble';
import { CometChatTextFormatter } from '../../../formatters/CometChatTextFormatter';
import { buildMediaMessage, buildUser } from '../../../testing/mock-builders';
import { covers } from '../../../testing/covers';

const me = buildUser({ uid: 'me', name: 'Me' }) as unknown as CometChat.User;
let signedIn: Promise<CometChat.User>;

beforeEach(() => {
  signedIn = Promise.resolve(me);
  vi.spyOn(CometChat, 'getLoggedinUser').mockReturnValue(signedIn);
});

afterEach(() => {
  vi.restoreAllMocks();
});

interface AudiosOptions {
  from?: string;
  caption?: string;
  files?: { name: string; url: string; duration?: number }[];
}

function audios({ from = 'them', caption = '', files = [{ name: 'track.mp3', url: 'https://cdn.example.com/a/track.mp3' }] }: AudiosOptions = {}) {
  const sender = buildUser({ uid: from, name: from });
  return {
    ...buildMediaMessage({ type: 'audio', sender }),
    getSender: () => sender,
    getAttachments: () =>
      files.map(({ duration, ...file }) => ({
        ...file,
        mimeType: 'audio/mpeg',
        extension: 'mp3',
        size: 102400,
        metadata: duration === undefined ? {} : { duration },
      })),
    getCaption: () => caption,
    getData: () => ({ text: caption }),
    getMetadata: () => ({ audioType: 'attachment' }),
  } as unknown as CometChat.MediaMessage;
}

/** Renders, then lets the logged-in user (an SDK promise) reach the bubbles. */
async function show(ui: React.ReactElement) {
  const view = render(ui);
  await act(() => signedIn);
  return view;
}

const bubbles = (container: HTMLElement) => Array.from(container.querySelectorAll<HTMLElement>('.cometchat-audios-bubble'));
const captionOf = (bubble: HTMLElement | undefined) => bubble?.querySelector('.cometchat-audios-bubble__caption .cometchat-text-bubble');
const captionText = (container: HTMLElement) =>
  container.querySelector('.cometchat-audios-bubble__caption .cometchat-text-bubble__text')?.textContent;

class Shout extends CometChatTextFormatter {
  readonly id = 'shout';
  override customLogicToFormatText(text: string) {
    return text.toUpperCase();
  }
}

describe('CometChatAudiosBubble props', () => {
  it("message is what's listed: a card per audio file with its name, length and download, then the caption", async () => {
    covers('CometChatAudiosBubble.message', 'set');
    const { container } = await show(
      <CometChatAudiosBubble
        message={audios({
          caption: 'Both takes',
          files: [
            { name: 'take-1.mp3', url: 'https://cdn.example.com/a/take-1.mp3', duration: 125 },
            { name: 'take-2.mp3', url: 'https://cdn.example.com/a/take-2.mp3', duration: 61 },
          ],
        })}
      />
    );
    const cards = Array.from(container.querySelectorAll('.cometchat-audios-bubble__card'));
    expect(cards.map(card => card.querySelector('.cometchat-audios-bubble__name')?.textContent)).toEqual(['take-1.mp3', 'take-2.mp3']);
    expect(cards.map(card => card.querySelector('.cometchat-audios-bubble__time')?.textContent)).toEqual(['0:00/2:05', '0:00/1:01']);
    expect(screen.getByRole('button', { name: 'Download take-1.mp3' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download take-2.mp3' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Play audio' })).toHaveLength(2);
    expect(captionText(container)).toBe('Both takes');
  });

  it('className is added to the bubble; by default it has only its own classes', async () => {
    covers('CometChatAudiosBubble.className', 'set', 'default');
    let view = await show(<CometChatAudiosBubble message={audios()} className="app-audios" />);
    expect(bubbles(view.container)[0]).toHaveClass('app-audios', 'cometchat-audios-bubble', 'cometchat-audios-bubble--incoming');
    view.unmount();

    view = await show(<CometChatAudiosBubble message={audios()} />);
    expect(bubbles(view.container)[0]?.className).toBe('cometchat-audios-bubble cometchat-audios-bubble--incoming');
  });

  it('textFormatters rewrite the caption; by default it reads exactly as sent', async () => {
    covers('CometChatAudiosBubble.textFormatters', 'set', 'default');
    const caption = 'Mix **two**: https://example.com/mix';
    let view = await show(<CometChatAudiosBubble message={audios({ caption })} textFormatters={[new Shout()]} />);
    expect(captionText(view.container)).toBe('MIX **TWO**: HTTPS://EXAMPLE.COM/MIX');
    view.unmount();

    // No formatter runs by default: no bold, no link.
    view = await show(<CometChatAudiosBubble message={audios({ caption })} />);
    expect(captionText(view.container)).toBe(caption);
    expect(view.container.querySelector('.cometchat-audios-bubble__caption strong, .cometchat-audios-bubble__caption a')).toBeNull();
  });

  describe('alignment', () => {
    it('by default my audio is outgoing and everyone else’s incoming, captions too', async () => {
      covers('CometChatAudiosBubble.alignment', 'default');
      const { container } = await show(
        <>
          <CometChatAudiosBubble message={audios({ from: 'me', caption: 'mine' })} />
          <CometChatAudiosBubble message={audios({ from: 'them', caption: 'theirs' })} />
        </>
      );
      const [mine, theirs] = bubbles(container);
      expect(mine).toHaveClass('cometchat-audios-bubble--outgoing');
      expect(captionOf(mine)).toHaveClass('cometchat-text-bubble--outgoing');
      expect(theirs).toHaveClass('cometchat-audios-bubble--incoming');
      expect(captionOf(theirs)).toHaveClass('cometchat-text-bubble--incoming');
    });

    it('"left" makes even my own audio incoming', async () => {
      covers('CometChatAudiosBubble.alignment', 'left');
      const { container } = await show(
        <>
          <CometChatAudiosBubble message={audios({ from: 'me', caption: 'mine' })} />
          <CometChatAudiosBubble message={audios({ from: 'me', caption: 'mine' })} alignment="left" />
        </>
      );
      const [derived, left] = bubbles(container);
      expect(derived).toHaveClass('cometchat-audios-bubble--outgoing');
      expect(left).toHaveClass('cometchat-audios-bubble--incoming');
      expect(left).not.toHaveClass('cometchat-audios-bubble--outgoing');
      expect(captionOf(left)).toHaveClass('cometchat-text-bubble--incoming');
    });

    it('"right" makes someone else’s audio outgoing', async () => {
      covers('CometChatAudiosBubble.alignment', 'right');
      const { container } = await show(
        <>
          <CometChatAudiosBubble message={audios({ from: 'them', caption: 'theirs' })} />
          <CometChatAudiosBubble message={audios({ from: 'them', caption: 'theirs' })} alignment="right" />
        </>
      );
      const [derived, right] = bubbles(container);
      expect(derived).toHaveClass('cometchat-audios-bubble--incoming');
      expect(right).toHaveClass('cometchat-audios-bubble--outgoing');
      expect(right).not.toHaveClass('cometchat-audios-bubble--incoming');
      expect(captionOf(right)).toHaveClass('cometchat-text-bubble--outgoing');
    });
  });
});
