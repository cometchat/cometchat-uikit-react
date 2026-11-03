/**
 * The public props of <CometChatStickerBubble />, one case each: the prop is set (or left out) on the
 * real component and the test checks what it changes. Only the SDK is touched: the logged-in user,
 * which decides the side of a bubble rendered without `alignment`, comes from
 * CometChat.getLoggedinUser().
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render } from '@testing-library/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatStickerBubble } from '../CometChatStickerBubble';
import { buildUser } from '../../../testing/mock-builders';
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

function sticker({ from = 'them', url = 'https://cdn.example.com/stickers/wave.png', name = 'Wave' } = {}) {
  const sender = buildUser({ uid: from });
  return {
    getId: () => 7,
    getType: () => 'extension_sticker',
    getCategory: () => 'custom',
    getSender: () => sender,
    getMetadata: () => ({ data: { sticker_url: url } }),
    getCustomData: () => ({ sticker_name: name }),
    getDeletedAt: () => 0,
  } as unknown as CometChat.CustomMessage;
}

/** Renders, then lets the logged-in user (an SDK promise) reach the bubbles. */
async function show(ui: React.ReactElement) {
  const view = render(ui);
  await act(() => signedIn);
  return view;
}

const bubbles = (container: HTMLElement) => Array.from(container.querySelectorAll<HTMLElement>('.cometchat-sticker-bubble'));

describe('CometChatStickerBubble props', () => {
  it("message is the sticker drawn: its image from the metadata, named after its custom data", async () => {
    covers('CometChatStickerBubble.message', 'set');
    const { container } = await show(
      <CometChatStickerBubble message={sticker({ url: 'https://cdn.example.com/stickers/party.gif', name: 'Party' })} />
    );
    const [bubble] = bubbles(container);
    expect(bubble).toHaveAttribute('role', 'img');
    expect(bubble).toHaveAttribute('aria-label', 'Party');
    const image = bubble?.querySelector('img');
    expect(image).toHaveAttribute('src', 'https://cdn.example.com/stickers/party.gif');
    expect(image).toHaveAttribute('alt', 'Party');
  });

  it('className is added to the bubble; by default it has only its own classes', async () => {
    covers('CometChatStickerBubble.className', 'set', 'default');
    let view = await show(<CometChatStickerBubble message={sticker()} className="app-sticker" />);
    const [custom] = bubbles(view.container);
    expect(custom).toHaveClass('app-sticker', 'cometchat-sticker-bubble', 'cometchat-sticker-bubble--incoming');
    view.unmount();

    view = await show(<CometChatStickerBubble message={sticker()} />);
    expect(bubbles(view.container)[0]?.className).toBe('cometchat-sticker-bubble cometchat-sticker-bubble--incoming');
  });

  describe('alignment', () => {
    it('by default my stickers sit on the outgoing side and everyone else’s on the incoming side', async () => {
      covers('CometChatStickerBubble.alignment', 'default');
      const { container } = await show(
        <>
          <CometChatStickerBubble message={sticker({ from: 'me' })} />
          <CometChatStickerBubble message={sticker({ from: 'them' })} />
        </>
      );
      const [mine, theirs] = bubbles(container);
      expect(mine).toHaveClass('cometchat-sticker-bubble--outgoing');
      expect(theirs).toHaveClass('cometchat-sticker-bubble--incoming');
    });

    it('"left" puts even my own sticker on the incoming side', async () => {
      covers('CometChatStickerBubble.alignment', 'left');
      const { container } = await show(
        <>
          <CometChatStickerBubble message={sticker({ from: 'me' })} />
          <CometChatStickerBubble message={sticker({ from: 'me' })} alignment="left" />
        </>
      );
      const [derived, left] = bubbles(container);
      expect(derived).toHaveClass('cometchat-sticker-bubble--outgoing');
      expect(left).toHaveClass('cometchat-sticker-bubble--incoming');
      expect(left).not.toHaveClass('cometchat-sticker-bubble--outgoing');
    });

    it('"right" puts someone else’s sticker on the outgoing side', async () => {
      covers('CometChatStickerBubble.alignment', 'right');
      const { container } = await show(
        <>
          <CometChatStickerBubble message={sticker({ from: 'them' })} />
          <CometChatStickerBubble message={sticker({ from: 'them' })} alignment="right" />
        </>
      );
      const [derived, right] = bubbles(container);
      expect(derived).toHaveClass('cometchat-sticker-bubble--incoming');
      expect(right).toHaveClass('cometchat-sticker-bubble--outgoing');
      expect(right).not.toHaveClass('cometchat-sticker-bubble--incoming');
    });
  });
});
