/* eslint-disable @typescript-eslint/no-deprecated -- this file intentionally exercises the deprecated legacy bubble it covers */
/**
 * The public props of <CometChatVideoBubble />, one case each: the prop is set (or left out) on the
 * real component and the test checks what it changes. The caption is drawn by the real text bubble.
 * Only the SDK is touched: the logged-in user, which decides the side of a bubble rendered without
 * `alignment`, comes from CometChat.getLoggedinUser().
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatVideoBubble } from '../CometChatVideoBubble';
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

interface VideoOptions {
  from?: string;
  senderName?: string;
  caption?: string;
  clips?: { url: string; thumbnail?: string }[];
}

const clip = { url: 'https://cdn.example.com/v/clip.mp4', thumbnail: 'https://cdn.example.com/v/clip.jpg' };

function video({ from = 'them', senderName = 'Alice', caption = '', clips = [clip] }: VideoOptions = {}) {
  const sender = buildUser({ uid: from, name: senderName });
  return {
    ...buildMediaMessage({ type: 'video', sender }),
    getSender: () => sender,
    // The SDK's raw attachment objects, which this bubble reads by property.
    getAttachments: () => clips,
    getCaption: () => caption,
    getData: () => ({ text: caption }),
    getMetadata: () => ({}),
  } as unknown as CometChat.MediaMessage;
}

/** Renders, then lets the logged-in user (an SDK promise) reach the bubbles. */
async function show(ui: React.ReactElement) {
  const view = render(ui);
  await act(() => signedIn);
  return view;
}

const bubbles = (container: HTMLElement) => Array.from(container.querySelectorAll<HTMLElement>('.cometchat-video-bubble'));
const captionOf = (bubble: HTMLElement | undefined) => bubble?.querySelector('.cometchat-video-bubble__caption .cometchat-text-bubble');
const captionText = (container: HTMLElement) =>
  container.querySelector('.cometchat-video-bubble__caption .cometchat-text-bubble__text')?.textContent;

class Shout extends CometChatTextFormatter {
  readonly id = 'shout';
  override customLogicToFormatText(text: string) {
    return text.toUpperCase();
  }
}

describe('CometChatVideoBubble props', () => {
  it("message is the video played inline: its first attachment, the thumbnail as poster, the sender's name, then the caption", async () => {
    covers('CometChatVideoBubble.message', 'set');
    const second = { url: 'https://cdn.example.com/v/other.mp4', thumbnail: 'https://cdn.example.com/v/other.jpg' };
    const { container } = await show(
      <CometChatVideoBubble message={video({ senderName: 'Bea', caption: 'Our trip', clips: [clip, second] })} />
    );
    const videos = container.querySelectorAll('video');
    expect(videos).toHaveLength(1);
    expect(videos[0]).toHaveAttribute('src', 'https://cdn.example.com/v/clip.mp4');
    expect(videos[0]).toHaveAttribute('poster', 'https://cdn.example.com/v/clip.jpg');
    expect(videos[0]).toHaveAttribute('controls');
    expect(screen.getByLabelText('Video from Bea')).toBe(videos[0]);
    expect(captionText(container)).toBe('Our trip');
  });

  it('className is added to the bubble; by default it has only its own classes', async () => {
    covers('CometChatVideoBubble.className', 'set', 'default');
    let view = await show(<CometChatVideoBubble message={video()} className="app-video" />);
    expect(bubbles(view.container)[0]).toHaveClass('app-video', 'cometchat-video-bubble', 'cometchat-video-bubble--incoming');
    view.unmount();

    view = await show(<CometChatVideoBubble message={video()} />);
    expect(bubbles(view.container)[0]?.className).toBe(
      'cometchat-video-bubble cometchat-video-bubble--incoming cometchat-video-bubble--single'
    );
  });

  it('textFormatters rewrite the caption; by default it reads exactly as sent', async () => {
    covers('CometChatVideoBubble.textFormatters', 'set', 'default');
    const caption = 'Watch **this**: https://example.com/trip';
    let view = await show(<CometChatVideoBubble message={video({ caption })} textFormatters={[new Shout()]} />);
    expect(captionText(view.container)).toBe('WATCH **THIS**: HTTPS://EXAMPLE.COM/TRIP');
    view.unmount();

    // No formatter runs by default: no bold, no link.
    view = await show(<CometChatVideoBubble message={video({ caption })} />);
    expect(captionText(view.container)).toBe(caption);
    expect(view.container.querySelector('.cometchat-video-bubble__caption strong, .cometchat-video-bubble__caption a')).toBeNull();
  });

  describe('alignment', () => {
    it('by default my videos are outgoing and everyone else’s incoming, captions too', async () => {
      covers('CometChatVideoBubble.alignment', 'default');
      const { container } = await show(
        <>
          <CometChatVideoBubble message={video({ from: 'me', caption: 'mine' })} />
          <CometChatVideoBubble message={video({ from: 'them', caption: 'theirs' })} />
        </>
      );
      const [mine, theirs] = bubbles(container);
      expect(mine).toHaveClass('cometchat-video-bubble--outgoing');
      expect(captionOf(mine)).toHaveClass('cometchat-text-bubble--outgoing');
      expect(theirs).toHaveClass('cometchat-video-bubble--incoming');
      expect(captionOf(theirs)).toHaveClass('cometchat-text-bubble--incoming');
    });

    it('"left" makes even my own video incoming', async () => {
      covers('CometChatVideoBubble.alignment', 'left');
      const { container } = await show(
        <>
          <CometChatVideoBubble message={video({ from: 'me', caption: 'mine' })} />
          <CometChatVideoBubble message={video({ from: 'me', caption: 'mine' })} alignment="left" />
        </>
      );
      const [derived, left] = bubbles(container);
      expect(derived).toHaveClass('cometchat-video-bubble--outgoing');
      expect(left).toHaveClass('cometchat-video-bubble--incoming');
      expect(left).not.toHaveClass('cometchat-video-bubble--outgoing');
      expect(captionOf(left)).toHaveClass('cometchat-text-bubble--incoming');
    });

    it('"right" makes someone else’s video outgoing', async () => {
      covers('CometChatVideoBubble.alignment', 'right');
      const { container } = await show(
        <>
          <CometChatVideoBubble message={video({ from: 'them', caption: 'theirs' })} />
          <CometChatVideoBubble message={video({ from: 'them', caption: 'theirs' })} alignment="right" />
        </>
      );
      const [derived, right] = bubbles(container);
      expect(derived).toHaveClass('cometchat-video-bubble--incoming');
      expect(right).toHaveClass('cometchat-video-bubble--outgoing');
      expect(right).not.toHaveClass('cometchat-video-bubble--incoming');
      expect(captionOf(right)).toHaveClass('cometchat-text-bubble--outgoing');
    });
  });
});
