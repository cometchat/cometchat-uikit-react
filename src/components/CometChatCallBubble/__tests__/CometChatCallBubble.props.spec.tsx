/**
 * The public props of <CometChatCallBubble />, one case each: the prop is set (or left out) on the
 * real component and the test checks what it changes. Only the SDK is mocked: the logged-in user the
 * bubble aligns against comes from the SDK.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatCallBubble } from '../CometChatCallBubble';
import { buildUser } from '../../../testing/mock-builders';
import { covers } from '../../../testing/covers';

const sdk = vi.hoisted(() => ({ getLoggedinUser: vi.fn() }));

// The real SDK's constants (the kit reads them on import), with only the login mocked.
vi.mock('@cometchat/chat-sdk-javascript', async () => {
  const { CometChat } = await vi.importActual<typeof import('@cometchat/chat-sdk-javascript')>('@cometchat/chat-sdk-javascript');
  return { CometChat: Object.assign({}, CometChat, { getLoggedinUser: sdk.getLoggedinUser }) };
});

const me = buildUser({ uid: 'me', name: 'Me' });
const carol = buildUser({ uid: 'carol', name: 'Carol' });

/** 14 Nov 2023, noon UTC; the bubble shows it in local time. */
const NOV_14_2023_NOON_UTC = 1699963200;
const sentDay = (() => {
  const sent = new Date(NOV_14_2023_NOON_UTC * 1000);
  return `${sent.toLocaleString('en-US', { month: 'short' })} ${String(sent.getDate())}`;
})();

/** A group meeting message, as the SDK delivers it. */
function meeting(
  sender: ReturnType<typeof buildUser>,
  { sessionID = 'meeting-1', callType = 'video', sentAt = NOV_14_2023_NOON_UTC } = {}
) {
  return {
    getId: () => 1,
    getCategory: () => 'custom',
    getType: () => 'meeting',
    getSender: () => sender,
    getReceiverType: () => 'group',
    getReceiverId: () => 'design',
    getSentAt: () => sentAt,
    getData: () => ({ customData: { sessionID, callType } }),
  } as unknown as CometChat.BaseMessage;
}

/** Renders, and lets the logged-in user resolve (the bubble re-renders when it does). */
async function renderSettled(ui: React.ReactElement) {
  const view = render(ui);
  await act(() => Promise.resolve());
  return view;
}

const bubbles = (container: HTMLElement) => Array.from(container.querySelectorAll('.cometchat-call-bubble'));
const icon = (bubble: Element) => bubble.querySelector('.cometchat-call-bubble__icon-wrapper-icon');

/**
 * Renders the bubble with the given props next to a bubble for my own message without `alignment`,
 * and waits until that one is outgoing: the logged-in user has resolved, so alignment is no
 * longer the "unknown user" fallback. Returns [the bubble under test, my own bubble].
 */
async function renderAligned(props: React.ComponentProps<typeof CometChatCallBubble>) {
  const view = render(
    <>
      <CometChatCallBubble {...props} />
      <CometChatCallBubble message={meeting(me)} />
    </>
  );
  await waitFor(() => {
    expect(bubbles(view.container)[1]).toHaveClass('cometchat-call-bubble-outgoing');
  });
  const [bubble, mine] = bubbles(view.container);
  if (!bubble || !mine) throw new Error('expected two call bubbles');
  return [bubble, mine] as const;
}

beforeEach(() => {
  sdk.getLoggedinUser.mockReset().mockResolvedValue(me);
});

describe('CometChatCallBubble props', () => {
  describe('alignment', () => {
    it('left shows my own call as incoming', async () => {
      covers('CometChatCallBubble.alignment', 'left');
      const [bubble] = await renderAligned({ message: meeting(me, { callType: 'audio' }), alignment: 'left' });
      expect(bubble).toHaveClass('cometchat-call-bubble-incoming');
      expect(bubble).not.toHaveClass('cometchat-call-bubble-outgoing');
      expect(icon(bubble)).toHaveClass('cometchat-call-bubble__icon--incoming-audio');
    });

    it("right shows someone else's call as outgoing", async () => {
      covers('CometChatCallBubble.alignment', 'right');
      const [bubble] = await renderAligned({ message: meeting(carol, { callType: 'audio' }), alignment: 'right' });
      expect(bubble).toHaveClass('cometchat-call-bubble-outgoing');
      expect(bubble).not.toHaveClass('cometchat-call-bubble-incoming');
      expect(icon(bubble)).toHaveClass('cometchat-call-bubble__icon--outgoing-audio');
    });

    it("by default my calls are outgoing and everyone else's incoming", async () => {
      covers('CometChatCallBubble.alignment', 'default');
      const [theirs, mine] = await renderAligned({ message: meeting(carol) });
      expect(theirs).toHaveClass('cometchat-call-bubble-incoming');
      expect(icon(theirs)).toHaveClass('cometchat-call-bubble__icon--incoming-video');
      // My own message, also without `alignment`, turned outgoing once the logged-in user resolved.
      expect(mine).toHaveClass('cometchat-call-bubble-outgoing');
      expect(icon(mine)).toHaveClass('cometchat-call-bubble__icon--outgoing-video');
    });
  });

  it('message: the title, time and session the bubble shows come from the meeting message', async () => {
    covers('CometChatCallBubble.message', 'set');
    const onJoinClick = vi.fn();
    const { container, unmount } = await renderSettled(
      <CometChatCallBubble message={meeting(carol, { sessionID: 'standup', callType: 'audio' })} onJoinClick={onJoinClick} />
    );
    expect(container.querySelector('.cometchat-call-bubble__body-content-title')).toHaveTextContent('Voice call');
    expect(container.querySelector('.cometchat-call-bubble__body-content-subtitle')).toHaveTextContent(sentDay);
    fireEvent.click(screen.getByRole('button', { name: 'Join' }));
    expect(onJoinClick).toHaveBeenLastCalledWith('standup');
    unmount();

    const view = await renderSettled(<CometChatCallBubble message={meeting(carol, { callType: 'video', sentAt: 0 })} />);
    expect(view.container.querySelector('.cometchat-call-bubble__body-content-title')).toHaveTextContent('Video call');
    expect(view.container.querySelector('.cometchat-call-bubble__body-content-subtitle')).toBeNull();
  });

  it("onJoinClick gets the meeting's session ID when Join is clicked", async () => {
    covers('CometChatCallBubble.onJoinClick', 'called');
    const onJoinClick = vi.fn();
    await renderSettled(<CometChatCallBubble message={meeting(carol, { sessionID: 'design-review' })} onJoinClick={onJoinClick} />);
    expect(onJoinClick).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Join' }));
    expect(onJoinClick).toHaveBeenCalledTimes(1);
    expect(onJoinClick).toHaveBeenCalledWith('design-review');
  });

  it('className is added to the root; by default the root has only its own classes', async () => {
    covers('CometChatCallBubble.className', 'set', 'default');
    const { container, unmount } = await renderSettled(
      <CometChatCallBubble message={meeting(carol)} alignment="left" className="pinned-call" />
    );
    expect(container.firstElementChild).toHaveClass('cometchat-call-bubble', 'pinned-call');
    unmount();

    const view = await renderSettled(<CometChatCallBubble message={meeting(carol)} alignment="left" />);
    expect(view.container.firstElementChild?.getAttribute('class')).toBe(
      'cometchat-call-bubble cometchat-call-bubble-incoming'
    );
  });
});
