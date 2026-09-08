import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const mockSubscribe = vi.fn();
const mockUnsubscribe = vi.fn();

vi.mock('@cometchat/chat-sdk-javascript', () => {
  const noop = vi.fn();
  return {
    CometChat: {
      RECEIVER_TYPE: { USER: 'user', GROUP: 'group' },
      subscribeToThread: (id: number) => mockSubscribe(id) as unknown,
      unsubscribeFromThread: (id: number) => mockUnsubscribe(id) as unknown,
      // The kit no longer registers a thread listener; the remaining listener
      // constructors just carry the callback bag.
      MessageListener: function () {},
      UserListener: function () {},
      GroupListener: function () {},
      CallListener: function () {},
      ConnectionListener: function () {},
      addMessageListener: noop,
      removeMessageListener: noop,
      addUserListener: noop,
      removeUserListener: noop,
      addGroupListener: noop,
      removeGroupListener: noop,
      addCallListener: noop,
      removeCallListener: noop,
      addConnectionListener: noop,
      removeConnectionListener: noop,
    },
  };
});

vi.mock('../../CometChatUIKit/CometChatUIKit', () => ({
  CometChatUIKit: { _setEmit: vi.fn(), getLoggedInUser: () => ({ getUid: () => 'me' }) },
}));

import { CometChatEventsProvider } from '../../context/CometChatEventsProvider';
import { useThreadSubscription, useThreadSubscriptionState } from '../useThreadSubscription';
import {
  resetThreadSubscriptionGuards,
  toggleThreadSubscription,
  mirrorThreadSubscribed,
} from '../../utils/CometChatThreadSubscription';
import { usePublishEvent } from '../../context/CometChatEventsContext';
import { buildTextMessage } from '../../testing/mock-builders';
import type { CometChat } from '@cometchat/chat-sdk-javascript';

const PARENT_ID = 555;

function parentMessage() {
  return buildTextMessage({
    id: PARENT_ID,
    receiverType: 'group',
  }) as unknown as CometChat.BaseMessage;
}

/** Stands in for the thread-header bell. */
function Bell() {
  const { isSubscribed, toggle } = useThreadSubscription(parentMessage());
  return (
    <button type="button" data-testid="bell" onClick={toggle}>
      {isSubscribed ? 'on' : 'off'}
    </button>
  );
}

/** Stands in for a message bubble's option, which publishes through the same bus. */
function OptionRow({ toggleId }: { toggleId?: number }) {
  const publish = usePublishEvent();
  const isSubscribed = useThreadSubscriptionState(parentMessage());
  return (
    <button
      type="button"
      data-testid="option"
      onClick={() => {
        void toggleThreadSubscription({
          parentMessageId: toggleId ?? PARENT_ID,
          subscribe: !isSubscribed,
          publish,
        });
      }}
    >
      {isSubscribed ? 'on' : 'off'}
    </button>
  );
}

/** Stands in for a Case 3/4 auto-subscribe mirror publishing through the bus. */
function MirrorButton() {
  const publish = usePublishEvent();
  return (
    <button
      type="button"
      data-testid="mirror"
      onClick={() => {
        mirrorThreadSubscribed(PARENT_ID, publish);
      }}
    >
      mirror
    </button>
  );
}

function renderBoth() {
  return render(
    <CometChatEventsProvider>
      <Bell />
      <OptionRow />
    </CometChatEventsProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  resetThreadSubscriptionGuards();
  mockSubscribe.mockResolvedValue('ok');
  mockUnsubscribe.mockResolvedValue('ok');
});

describe('thread subscription — cross-surface agreement through the real event bus', () => {
  it('option → bell', async () => {
    renderBoth();
    expect(screen.getByTestId('bell')).toHaveTextContent('off');

    screen.getByTestId('option').click();

    await waitFor(() => {
      expect(screen.getByTestId('bell')).toHaveTextContent('on');
    });
  });

  it('bell → option', async () => {
    renderBoth();
    screen.getByTestId('bell').click();

    await waitFor(() => {
      expect(screen.getByTestId('option')).toHaveTextContent('on');
    });
  });

  it('a string id on one surface still matches a number on the other', async () => {
    // Regression: ids are typed `number` but arrive as strings from some
    // payloads. The bus matches with `===`, so an unnormalized string id made
    // every cross-surface update silently no-op.
    render(
      <CometChatEventsProvider>
        <Bell />
        <OptionRow toggleId={String(PARENT_ID) as unknown as number} />
      </CometChatEventsProvider>
    );

    screen.getByTestId('option').click();

    await waitFor(() => {
      expect(screen.getByTestId('bell')).toHaveTextContent('on');
    });
  });

  it('an auto-subscribe mirror (Case 3/4) reaches both surfaces', async () => {
    render(
      <CometChatEventsProvider>
        <Bell />
        <OptionRow />
        <MirrorButton />
      </CometChatEventsProvider>
    );

    screen.getByTestId('mirror').click();

    await waitFor(() => {
      expect(screen.getByTestId('bell')).toHaveTextContent('on');
      expect(screen.getByTestId('option')).toHaveTextContent('on');
    });
    // A mirror is local only — it never issues the server write.
    expect(mockSubscribe).not.toHaveBeenCalled();
  });
});
