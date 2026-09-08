import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';

vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
    RECEIVER_TYPE: { USER: 'user', GROUP: 'group' },
    subscribeToThread: vi.fn(),
    unsubscribeFromThread: vi.fn(),
  },
}));

const subscribers = new Set<(event: unknown) => void>();
function emit(event: unknown) {
  act(() => {
    subscribers.forEach(handler => {
      handler(event);
    });
  });
}

vi.mock('../../context/CometChatEventsContext', () => ({
  useCometChatEventsContext: () => ({
    subscribe: (handler: (event: unknown) => void) => {
      subscribers.add(handler);
      return () => subscribers.delete(handler);
    },
    publish: vi.fn(),
  }),
  usePublishEvent: () => vi.fn(),
}));

import { useThreadSubscriptionState } from '../useThreadSubscription';
import { buildTextMessage } from '../../testing/mock-builders';
import type { CometChat } from '@cometchat/chat-sdk-javascript';

const PARENT_ID = 700;

function msg(over: Record<string, unknown> = {}) {
  return buildTextMessage(over) as unknown as CometChat.BaseMessage;
}

/** Stands in for a rendered message bubble reading subscription state. */
function Probe({ message, label }: { message: CometChat.BaseMessage | null; label: string }) {
  const isSubscribed = useThreadSubscriptionState(message);
  return <span data-testid={label}>{isSubscribed ? 'following' : 'not-following'}</span>;
}

beforeEach(() => {
  vi.clearAllMocks();
  subscribers.clear();
});

describe('useThreadSubscriptionState', () => {
  it('seeds from the message flag', () => {
    render(<Probe message={msg({ id: PARENT_ID, threadSubscribed: true })} label="a" />);
    expect(screen.getByTestId('a')).toHaveTextContent('following');
  });

  it('seeds not-following when the message reports unsubscribed', () => {
    render(<Probe message={msg({ id: PARENT_ID, threadSubscribed: false })} label="a" />);
    expect(screen.getByTestId('a')).toHaveTextContent('not-following');
  });

  it('updates on the optimistic UI event', () => {
    render(<Probe message={msg({ id: PARENT_ID })} label="a" />);
    expect(screen.getByTestId('a')).toHaveTextContent('not-following');

    emit({ type: 'ui:thread/subscription-changed', parentMessageId: PARENT_ID, subscribed: true });
    expect(screen.getByTestId('a')).toHaveTextContent('following');
  });

  it('updates on an auto-subscribe mirror (Case 3/4) — same UI event', () => {
    render(<Probe message={msg({ id: PARENT_ID })} label="a" />);
    // A mention-received / own-send mirror publishes the same event.
    emit({ type: 'ui:thread/subscription-changed', parentMessageId: PARENT_ID, subscribed: true });
    expect(screen.getByTestId('a')).toHaveTextContent('following');
  });

  it('writes the change back onto the held message object', () => {
    // So a direct read or a remount sees the current value between fetches.
    const message = msg({ id: PARENT_ID, threadSubscribed: false });
    render(<Probe message={message} label="a" />);

    emit({ type: 'ui:thread/subscription-changed', parentMessageId: PARENT_ID, subscribed: true });
    expect(message.isThreadSubscribed()).toBe(true);
  });

  it('ignores another thread', () => {
    render(<Probe message={msg({ id: PARENT_ID })} label="a" />);
    emit({ type: 'ui:thread/subscription-changed', parentMessageId: 999, subscribed: true });
    expect(screen.getByTestId('a')).toHaveTextContent('not-following');
  });

  it('matches a reply by its PARENT id', () => {
    // A reply resolves to its parent id; the parent's follow flips the reply too.
    render(<Probe message={msg({ id: 9, parentMessageId: PARENT_ID })} label="reply" />);
    emit({ type: 'ui:thread/subscription-changed', parentMessageId: PARENT_ID, subscribed: true });
    expect(screen.getByTestId('reply')).toHaveTextContent('following');
  });

  it('updates EVERY consumer of the same thread at once', () => {
    // A thread's replies all resolve to the same parent id, so following from any
    // surface must relabel all of them — the message list bubble, its replies,
    // and the header bell — not just the one that was clicked.
    render(
      <>
        <Probe message={msg({ id: PARENT_ID })} label="parent" />
        <Probe message={msg({ id: 11, parentMessageId: PARENT_ID })} label="reply-1" />
        <Probe message={msg({ id: 12, parentMessageId: PARENT_ID })} label="reply-2" />
      </>
    );

    emit({ type: 'ui:thread/subscription-changed', parentMessageId: PARENT_ID, subscribed: true });

    expect(screen.getByTestId('parent')).toHaveTextContent('following');
    expect(screen.getByTestId('reply-1')).toHaveTextContent('following');
    expect(screen.getByTestId('reply-2')).toHaveTextContent('following');
  });

  it('re-seeds from a freshly fetched object — fetched wins over a stale mirror', () => {
    // A re-fetch hands down a NEW object carrying the server's flag; it overrides
    // whatever the previous object said.
    const stale = msg({ id: PARENT_ID, threadSubscribed: false });
    const { rerender } = render(<Probe message={stale} label="a" />);
    expect(screen.getByTestId('a')).toHaveTextContent('not-following');

    const fetched = msg({ id: PARENT_ID, threadSubscribed: true });
    rerender(<Probe message={fetched} label="a" />);
    expect(screen.getByTestId('a')).toHaveTextContent('following');
  });

  it('holds not-following and attaches no subscriber when disabled with null', () => {
    render(<Probe message={null} label="a" />);
    expect(screen.getByTestId('a')).toHaveTextContent('not-following');
    // No bus subscriber for a disabled thread.
    expect(subscribers.size).toBe(0);
    // And an event cannot flip it.
    emit({ type: 'ui:thread/subscription-changed', parentMessageId: PARENT_ID, subscribed: true });
    expect(screen.getByTestId('a')).toHaveTextContent('not-following');
  });
});
