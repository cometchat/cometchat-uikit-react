import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

const mockSubscribe = vi.fn();
const mockUnsubscribe = vi.fn();

vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
    RECEIVER_TYPE: { USER: 'user', GROUP: 'group' },
    subscribeToThread: (id: number) => mockSubscribe(id) as unknown,
    unsubscribeFromThread: (id: number) => mockUnsubscribe(id) as unknown,
  },
}));

vi.mock('../../../hooks/useLocale', () => ({
  useLocale: () => ({
    getLocalizedString: (key: string) => {
      const translations: Record<string, string> = {
        thread_subscription_unsubscribe: 'Unsubscribe from thread',
        thread_subscription_subscribe: 'Subscribe to thread',
        thread_subscription_failed: "Couldn't update. Please try again.",
        thread_subscription_subscribed_toast:
          "Subscribed. You'll be notified about new replies in this thread.",
        thread_subscription_unsubscribed_toast:
          'Unsubscribed. Notifications are off until you reply or are mentioned.',
      };
      return translations[key] ?? key;
    },
    language: 'en-us',
  }),
}));

// The bell's own event plumbing is exercised through this fake bus, which is
// the same channel the message option publishes on.
const subscribers = new Set<(event: unknown) => void>();
const publish = vi.fn((event: unknown) => {
  subscribers.forEach(handler => {
    handler(event);
  });
});

vi.mock('../../../context/CometChatEventsContext', () => ({
  useCometChatEventsContext: () => ({
    subscribe: (handler: (event: unknown) => void) => {
      subscribers.add(handler);
      return () => subscribers.delete(handler);
    },
    publish,
  }),
  usePublishEvent: () => publish,
}));

import { CometChatThreadHeaderSubscriptionToggle } from '../CometChatThreadHeaderSubscriptionToggle';
import { CometChatThreadHeaderContext } from '../CometChatThreadHeader.context';
import type { CometChatThreadHeaderContextValue } from '../CometChatThreadHeader.types';
import { resetThreadSubscriptionGuards } from '../../../utils/CometChatThreadSubscription';
import { buildTextMessage } from '../../../testing/mock-builders';

const PARENT_ID = 900;

function parentMessage(receiverType = 'group', threadSubscribed = false) {
  return buildTextMessage({
    id: PARENT_ID,
    receiverType,
    receiverId: receiverType === 'group' ? 'group-1' : 'user-2',
    threadSubscribed,
  }) as unknown as CometChatThreadHeaderContextValue['parentMessage'];
}

function createContext(
  overrides: Partial<CometChatThreadHeaderContextValue> = {}
): CometChatThreadHeaderContextValue {
  return {
    parentMessage: parentMessage(),
    replyCount: 3,
    senderName: 'John Doe',
    ...overrides,
  };
}

/** A context whose parent message reads as already-following. */
function followingContext(overrides: Partial<CometChatThreadHeaderContextValue> = {}) {
  return createContext({ parentMessage: parentMessage('group', true), ...overrides });
}

function renderToggle(ctx: CometChatThreadHeaderContextValue = createContext()) {
  return render(
    <CometChatThreadHeaderContext.Provider value={ctx}>
      <CometChatThreadHeaderSubscriptionToggle />
    </CometChatThreadHeaderContext.Provider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  subscribers.clear();
  resetThreadSubscriptionGuards();
  mockSubscribe.mockResolvedValue('ok');
  mockUnsubscribe.mockResolvedValue('ok');
});

describe('CometChatThreadHeaderSubscriptionToggle — visibility', () => {
  it('renders a button in a group thread', () => {
    renderToggle();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders a button in a 1:1 thread too', () => {
    renderToggle(createContext({ parentMessage: parentMessage('user') }));
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders nothing when hidden by prop', () => {
    renderToggle(createContext({ hideThreadSubscriptionToggle: true }));
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('CometChatThreadHeaderSubscriptionToggle — state rendering', () => {
  it('shows the crossed bell and the follow action when not following', () => {
    const { container } = renderToggle();

    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Subscribe to thread');
    expect(
      container.querySelector('.cometchat-thread-header__subscription-icon--off')
    ).toBeInTheDocument();
  });

  it('shows the plain bell and the unfollow action when following', () => {
    const { container } = renderToggle(followingContext());

    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Unsubscribe from thread');
    expect(
      container.querySelector('.cometchat-thread-header__subscription-icon--on')
    ).toBeInTheDocument();
  });

  it('renders a message with no flag as the un-followed state, enabled', () => {
    const { container } = renderToggle();

    const button = screen.getByRole('button');
    expect(button).not.toBeDisabled();
    expect(
      container.querySelector('.cometchat-thread-header__subscription-icon--off')
    ).toBeInTheDocument();
  });

  it('shows a tooltip on hover, matching the accessible name', async () => {
    renderToggle();
    const button = screen.getByRole('button');
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    fireEvent.mouseEnter(button);
    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toHaveTextContent('Subscribe to thread');
    });
    // WCAG 2.5.3: the visible label and the accessible name must not diverge.
    expect(button).toHaveAttribute('aria-label', 'Subscribe to thread');

    fireEvent.mouseLeave(button);
    await waitFor(() => {
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });

  it('shows the tooltip on keyboard focus too', async () => {
    renderToggle();
    fireEvent.focus(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });
  });
});

describe('CometChatThreadHeaderSubscriptionToggle — interaction', () => {
  it('subscribes on click and flips immediately, before the ack', async () => {
    let resolveCall: (value: string) => void = () => undefined;
    mockSubscribe.mockReturnValue(
      new Promise<string>(resolve => {
        resolveCall = resolve;
      })
    );

    const { container } = renderToggle();
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(
        container.querySelector('.cometchat-thread-header__subscription-icon--on')
      ).toBeInTheDocument();
    });
    expect(mockSubscribe).toHaveBeenCalledWith(PARENT_ID);

    await act(async () => {
      resolveCall('ok');
      await Promise.resolve();
    });
  });

  it('unsubscribes when already following', async () => {
    renderToggle(followingContext());
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(mockUnsubscribe).toHaveBeenCalledWith(PARENT_ID);
    });
  });

  it('toggles on Enter and Space', async () => {
    renderToggle();
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
    await waitFor(() => {
      expect(mockSubscribe).toHaveBeenCalledTimes(1);
    });
  });

  it('confirms with a toast after subscribing', async () => {
    renderToggle();
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(
        screen.getByText("Subscribed. You'll be notified about new replies in this thread.")
      ).toBeInTheDocument();
    });
  });

  it('confirms with the opposite toast after unsubscribing', async () => {
    renderToggle(followingContext());
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(
        screen.getByText('Unsubscribed. Notifications are off until you reply or are mentioned.')
      ).toBeInTheDocument();
    });
  });

  it('reverts and shows the failure toast when the request fails', async () => {
    mockSubscribe.mockRejectedValue(new Error('network'));
    const { container } = renderToggle();

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText("Couldn't update. Please try again.")).toBeInTheDocument();
    });
    expect(
      container.querySelector('.cometchat-thread-header__subscription-icon--off')
    ).toBeInTheDocument();
  });

  it('reports the change through onThreadSubscriptionChange, but not on mount', async () => {
    const onThreadSubscriptionChange = vi.fn();
    renderToggle(createContext({ onThreadSubscriptionChange }));

    expect(onThreadSubscriptionChange).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(onThreadSubscriptionChange).toHaveBeenCalledWith(true);
    });
  });
});

describe('CometChatThreadHeaderSubscriptionToggle — agreement with the message option', () => {
  it('follows an optimistic flip published by the other surface', async () => {
    const { container } = renderToggle();
    expect(
      container.querySelector('.cometchat-thread-header__subscription-icon--off')
    ).toBeInTheDocument();

    // What toggleThreadSubscription / a Case 3/4 mirror publishes.
    act(() => {
      publish({
        type: 'ui:thread/subscription-changed',
        parentMessageId: PARENT_ID,
        subscribed: true,
      });
    });

    await waitFor(() => {
      expect(
        container.querySelector('.cometchat-thread-header__subscription-icon--on')
      ).toBeInTheDocument();
    });
  });

  it('ignores events for a different thread', async () => {
    const { container } = renderToggle();

    act(() => {
      publish({
        type: 'ui:thread/subscription-changed',
        parentMessageId: 12345,
        subscribed: true,
      });
    });

    await waitFor(() => {
      expect(
        container.querySelector('.cometchat-thread-header__subscription-icon--off')
      ).toBeInTheDocument();
    });
  });
});
