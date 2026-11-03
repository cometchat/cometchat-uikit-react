/**
 * The public props of <CometChatVideosBubble />, one case each: the prop is set (or left out) on the
 * real component and the test checks what it changes. The caption is drawn by the real text bubble
 * and a click opens the real full-screen viewer. Only the SDK is touched: the logged-in user, which
 * decides the side of a bubble rendered without `alignment`, comes from CometChat.getLoggedinUser().
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatVideosBubble } from '../CometChatVideosBubble';
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

interface VideosOptions {
  from?: string;
  caption?: string;
  count?: number;
}

const clipUrl = (i: number) => `https://cdn.example.com/v/clip-${String(i)}.mp4`;
const thumbUrl = (i: number) => `https://cdn.example.com/v/thumb-${String(i)}.jpg`;

function videos({ from = 'them', caption = '', count = 1 }: VideosOptions = {}) {
  const sender = buildUser({ uid: from, name: from });
  const indexes = Array.from({ length: count }, (_, i) => i);
  return {
    ...buildMediaMessage({ type: 'video', sender }),
    getSender: () => sender,
    getAttachments: () =>
      indexes.map(i => ({
        getUrl: () => clipUrl(i),
        getSize: () => 1000 + i,
        getName: () => `clip-${String(i)}.mp4`,
      })),
    getCaption: () => caption,
    getData: () => ({ text: caption }),
    // Thumbnails come from the thumbnail-generation extension, one per attachment.
    getMetadata: () => ({
      '@injected': {
        extensions: {
          'thumbnail-generation': { attachments: indexes.map(i => ({ data: { thumbnails: { url_medium: thumbUrl(i) } } })) },
        },
      },
    }),
  } as unknown as CometChat.MediaMessage;
}

/** Renders, then lets the logged-in user (an SDK promise) reach the bubbles. */
async function show(ui: React.ReactElement) {
  const view = render(ui);
  await act(() => signedIn);
  return view;
}

const bubbles = (container: HTMLElement) => Array.from(container.querySelectorAll<HTMLElement>('.cometchat-videos-bubble'));
const captionOf = (bubble: HTMLElement | undefined) => bubble?.querySelector('.cometchat-videos-bubble__caption .cometchat-text-bubble');
const captionText = (container: HTMLElement) =>
  container.querySelector('.cometchat-videos-bubble__caption .cometchat-text-bubble__text')?.textContent;

class Shout extends CometChatTextFormatter {
  readonly id = 'shout';
  override customLogicToFormatText(text: string) {
    return text.toUpperCase();
  }
}

describe('CometChatVideosBubble props', () => {
  it("message is what's shown: a tile per video, side by side for two, named after the caption, then the caption", async () => {
    covers('CometChatVideosBubble.message', 'set');
    const { container } = await show(<CometChatVideosBubble message={videos({ count: 2, caption: 'Our trip' })} />);
    expect(container.querySelector('.cometchat-videos-bubble__grid--two-col')).not.toBeNull();
    expect(screen.getAllByRole('button', { name: 'Video: Our trip. Press Enter to play fullscreen.' })).toHaveLength(2);
    expect(captionText(container)).toBe('Our trip');
  });

  it('onVideoClicked gets the clicked video and its index, the "+N" tile reporting the fourth', async () => {
    covers('CometChatVideosBubble.onVideoClicked', 'called');
    const onVideoClicked = vi.fn();
    const { container } = await show(<CometChatVideosBubble message={videos({ count: 6 })} onVideoClicked={onVideoClicked} />);

    fireEvent.click(screen.getAllByRole('button', { name: 'Video message. Press Enter to play fullscreen.' })[1]!);
    expect(onVideoClicked).toHaveBeenCalledTimes(1);
    expect(onVideoClicked).toHaveBeenLastCalledWith({ url: clipUrl(1), size: 1001, name: 'clip-1.mp4', thumbnail: thumbUrl(1) }, 1);
    // The click also opens the full-screen viewer, as without the callback.
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    const overflow = container.querySelector('.cometchat-videos-bubble__overflow-tile');
    expect(overflow).toHaveTextContent('+2');
    fireEvent.click(overflow!);
    expect(onVideoClicked).toHaveBeenCalledTimes(2);
    expect(onVideoClicked).toHaveBeenLastCalledWith({ url: clipUrl(3), size: 1003, name: 'clip-3.mp4', thumbnail: thumbUrl(3) }, 3);
  });

  it('className is added to the bubble; by default it has only its own classes', async () => {
    covers('CometChatVideosBubble.className', 'set', 'default');
    let view = await show(<CometChatVideosBubble message={videos()} className="app-videos" />);
    expect(bubbles(view.container)[0]).toHaveClass('app-videos', 'cometchat-videos-bubble', 'cometchat-videos-bubble--incoming');
    view.unmount();

    view = await show(<CometChatVideosBubble message={videos()} />);
    expect(bubbles(view.container)[0]?.className).toBe(
      'cometchat-videos-bubble cometchat-videos-bubble--incoming cometchat-videos-bubble--single'
    );
  });

  it('textFormatters rewrite the caption; by default it reads exactly as sent', async () => {
    covers('CometChatVideosBubble.textFormatters', 'set', 'default');
    const caption = 'Watch **this**: https://example.com/trip';
    let view = await show(<CometChatVideosBubble message={videos({ caption })} textFormatters={[new Shout()]} />);
    expect(captionText(view.container)).toBe('WATCH **THIS**: HTTPS://EXAMPLE.COM/TRIP');
    view.unmount();

    // No formatter runs by default: no bold, no link.
    view = await show(<CometChatVideosBubble message={videos({ caption })} />);
    expect(captionText(view.container)).toBe(caption);
    expect(view.container.querySelector('.cometchat-videos-bubble__caption strong, .cometchat-videos-bubble__caption a')).toBeNull();
  });

  describe('alignment', () => {
    it('by default my videos are outgoing and everyone else’s incoming, captions too', async () => {
      covers('CometChatVideosBubble.alignment', 'default');
      const { container } = await show(
        <>
          <CometChatVideosBubble message={videos({ from: 'me', caption: 'mine' })} />
          <CometChatVideosBubble message={videos({ from: 'them', caption: 'theirs' })} />
        </>
      );
      const [mine, theirs] = bubbles(container);
      expect(mine).toHaveClass('cometchat-videos-bubble--outgoing');
      expect(captionOf(mine)).toHaveClass('cometchat-text-bubble--outgoing');
      expect(theirs).toHaveClass('cometchat-videos-bubble--incoming');
      expect(captionOf(theirs)).toHaveClass('cometchat-text-bubble--incoming');
    });

    it('"left" makes even my own videos incoming', async () => {
      covers('CometChatVideosBubble.alignment', 'left');
      const { container } = await show(
        <>
          <CometChatVideosBubble message={videos({ from: 'me', caption: 'mine' })} />
          <CometChatVideosBubble message={videos({ from: 'me', caption: 'mine' })} alignment="left" />
        </>
      );
      const [derived, left] = bubbles(container);
      expect(derived).toHaveClass('cometchat-videos-bubble--outgoing');
      expect(left).toHaveClass('cometchat-videos-bubble--incoming');
      expect(left).not.toHaveClass('cometchat-videos-bubble--outgoing');
      expect(captionOf(left)).toHaveClass('cometchat-text-bubble--incoming');
    });

    it('"right" makes someone else’s videos outgoing', async () => {
      covers('CometChatVideosBubble.alignment', 'right');
      const { container } = await show(
        <>
          <CometChatVideosBubble message={videos({ from: 'them', caption: 'theirs' })} />
          <CometChatVideosBubble message={videos({ from: 'them', caption: 'theirs' })} alignment="right" />
        </>
      );
      const [derived, right] = bubbles(container);
      expect(derived).toHaveClass('cometchat-videos-bubble--incoming');
      expect(right).toHaveClass('cometchat-videos-bubble--outgoing');
      expect(right).not.toHaveClass('cometchat-videos-bubble--incoming');
      expect(captionOf(right)).toHaveClass('cometchat-text-bubble--outgoing');
    });
  });
});
