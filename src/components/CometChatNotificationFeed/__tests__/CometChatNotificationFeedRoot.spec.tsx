/**
 * Integration tests for CometChatNotificationFeedRoot with the real hook and
 * manager over a mocked SDK: the default layout's loading / loaded / empty /
 * error states, prop wiring into context, custom children, real-time items,
 * click and viewed/read engagement through the visibility tracker, and teardown.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';

const sdk = vi.hoisted(() => {
  const feedBuilder = {
    setLimit: vi.fn(),
    setCategory: vi.fn(),
    build: vi.fn(),
  };
  return {
    feedBuilder,
    feedFetchNext: vi.fn(),
    categoriesFetchNext: vi.fn(),
    getNotificationFeedUnreadCount: vi.fn(),
    markFeedItemAsDelivered: vi.fn(),
    markFeedItemAsRead: vi.fn(),
    reportFeedEngagement: vi.fn(),
    addNotificationFeedListener: vi.fn(),
    removeNotificationFeedListener: vi.fn(),
  };
});

vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
    NotificationFeedRequestBuilder: vi.fn(function () {
      return sdk.feedBuilder;
    }),
    NotificationCategoriesRequestBuilder: class {
      setLimit() {
        return this;
      }
      build() {
        return { fetchNext: sdk.categoriesFetchNext };
      }
    },
    NotificationFeedListener: class {
      constructor(public callbacks: { onFeedItemReceived: (item: unknown) => void }) {}
    },
    getNotificationFeedUnreadCount: sdk.getNotificationFeedUnreadCount,
    markFeedItemAsDelivered: sdk.markFeedItemAsDelivered,
    markFeedItemAsRead: sdk.markFeedItemAsRead,
    reportFeedEngagement: sdk.reportFeedEngagement,
    addNotificationFeedListener: sdk.addNotificationFeedListener,
    removeNotificationFeedListener: sdk.removeNotificationFeedListener,
  },
}));

vi.mock('../../../context/locale/LocaleContext', () => ({
  useLocale: () => ({ getLocalizedString: (key: string) => key, language: 'en-us' }),
}));

vi.mock('@cometchat/cards-react', () => ({
  CometChatCardView: ({ cardJson }: { cardJson: string }) => <div data-testid="card">{cardJson}</div>,
}));

vi.mock('../../base/CometChatDate', () => ({
  CometChatDate: () => <time />,
}));

import { CometChatNotificationFeedRoot } from '../CometChatNotificationFeedRoot';
import { useCometChatNotificationFeedContext } from '../CometChatNotificationFeed.context';
import type { NotificationFeedItem } from '../CometChatNotificationFeed.types';

function feedItem(id: string, category = 'Orders') {
  let read: number | null = null;
  return {
    getId: () => id,
    getSentAt: () => Math.floor(Date.now() / 1000),
    getReadAt: () => read,
    setReadAt: (t: number) => {
      read = t;
    },
    getContent: () => ({ title: id }),
    getCategory: () => category,
  } satisfies NotificationFeedItem;
}

const sdkCategory = (id: string, label: string) => ({ getId: () => id, getLabel: () => label });

let intersect: IntersectionObserverCallback;
const observer = { observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn() };

const articles = () => screen.queryAllByRole('article');

async function renderLoaded(props: React.ComponentProps<typeof CometChatNotificationFeedRoot> = {}) {
  const utils = render(<CometChatNotificationFeedRoot {...props} />);
  await screen.findAllByRole('article');
  return utils;
}

describe('CometChatNotificationFeedRoot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sdk.feedBuilder.setLimit.mockReturnValue(sdk.feedBuilder);
    sdk.feedBuilder.setCategory.mockReturnValue(sdk.feedBuilder);
    sdk.feedBuilder.build.mockReturnValue({ fetchNext: sdk.feedFetchNext });
    sdk.feedFetchNext.mockResolvedValueOnce([feedItem('n1'), feedItem('n2')]).mockResolvedValue([]);
    sdk.categoriesFetchNext.mockResolvedValue([sdkCategory('orders', 'Orders')]);
    sdk.getNotificationFeedUnreadCount.mockResolvedValue({ count: 2 });
    for (const fn of [sdk.markFeedItemAsDelivered, sdk.markFeedItemAsRead, sdk.reportFeedEngagement]) {
      fn.mockResolvedValue(undefined);
    }
    vi.stubGlobal(
      'IntersectionObserver',
      vi.fn(function (cb: IntersectionObserverCallback) {
        intersect = cb;
        return observer;
      })
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('shows a loading state, then the header, category chips and items', async () => {
    render(<CometChatNotificationFeedRoot />);
    expect(screen.getByRole('status', { name: 'accessibility_loading_notifications' })).toBeInTheDocument();

    expect(await screen.findAllByRole('article')).toHaveLength(2);
    expect(screen.queryByRole('status', { name: 'accessibility_loading_notifications' })).toBeNull();
    expect(screen.getByRole('heading', { name: 'notifications_title' })).toBeInTheDocument();
    expect(await screen.findByRole('tab', { name: /notifications_filter_all\s*2/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Orders' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'notifications_title' })).toBeInTheDocument();
    expect(sdk.markFeedItemAsDelivered).toHaveBeenCalledTimes(2);
  });

  it('applies title, header, back-button and chip props', async () => {
    const onBackPress = vi.fn();
    await renderLoaded({ title: 'Inbox', showBackButton: true, onBackPress, showFilterChips: false });

    expect(screen.getByRole('heading', { name: 'Inbox' })).toBeInTheDocument();
    expect(screen.queryByRole('tablist')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'accessibility_back' }));
    expect(onBackPress).toHaveBeenCalled();
  });

  it('hides the header when showHeader is false', async () => {
    await renderLoaded({ showHeader: false });
    expect(screen.queryByRole('heading')).toBeNull();
  });

  it('shows the empty state when there are no notifications', async () => {
    sdk.feedFetchNext.mockReset().mockResolvedValue([]);
    render(<CometChatNotificationFeedRoot />);
    expect(await screen.findByText('notifications_empty_title')).toBeInTheDocument();
    expect(articles()).toHaveLength(0);
  });

  it('shows the error state, reports the error, and recovers on retry', async () => {
    const error = { code: 'ERR', message: 'down' };
    const onError = vi.fn();
    sdk.feedFetchNext.mockReset().mockRejectedValueOnce(error).mockResolvedValueOnce([feedItem('n1')]);
    render(<CometChatNotificationFeedRoot onError={onError} />);

    const alert = await screen.findByRole('alert');
    expect(onError).toHaveBeenCalledWith(error);

    fireEvent.click(within(alert).getByRole('button', { name: 'accessibility_retry_notifications' }));
    expect(await screen.findAllByRole('article')).toHaveLength(1);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('renders custom children instead of the default layout, with access to feed state', async () => {
    function Count() {
      const { items, title } = useCometChatNotificationFeedContext();
      return <p>{`${title}: ${String(items.length)}`}</p>;
    }
    render(
      <CometChatNotificationFeedRoot title="Feed">
        <Count />
      </CometChatNotificationFeedRoot>
    );
    expect(await screen.findByText('Feed: 2')).toBeInTheDocument();
    expect(screen.queryByRole('heading')).toBeNull();
    expect(articles()).toHaveLength(0);
  });

  it('shows a real-time item at the top of the list', async () => {
    await renderLoaded();
    const [, listener] = sdk.addNotificationFeedListener.mock.calls[0] as [
      string,
      { callbacks: { onFeedItemReceived: (i: unknown) => void } },
    ];

    act(() => {
      listener.callbacks.onFeedItemReceived(feedItem('fresh'));
    });

    expect(articles()[0]).toHaveAttribute('data-feed-item-id', 'fresh');
    expect(screen.getByRole('tab', { name: /notifications_filter_all\s*3/ })).toBeInTheDocument();
  });

  it('reports a click and calls onItemClick when an item is activated', async () => {
    const onItemClick = vi.fn();
    await renderLoaded({ onItemClick });
    fireEvent.click(articles()[0]!);

    const clicked = onItemClick.mock.calls[0]?.[0] as NotificationFeedItem;
    expect(clicked.getId()).toBe('n1');
    expect(sdk.reportFeedEngagement).toHaveBeenCalledWith(clicked, 'clicked');
  });

  it('reports an item viewed when it scrolls into view and read after a second', async () => {
    await renderLoaded();
    await screen.findByRole('tab', { name: /notifications_filter_all\s*2/ });
    const first = articles()[0]!;
    expect(observer.observe).toHaveBeenCalledWith(first);

    vi.useFakeTimers();
    act(() => {
      intersect(
        [{ target: first, isIntersecting: true } as unknown as IntersectionObserverEntry],
        observer as unknown as IntersectionObserver
      );
    });
    const viewed = sdk.reportFeedEngagement.mock.calls[0]?.[0] as NotificationFeedItem;
    expect(viewed.getId()).toBe('n1');
    expect(sdk.reportFeedEngagement).toHaveBeenCalledWith(viewed, 'viewed');
    expect(sdk.markFeedItemAsRead).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(sdk.markFeedItemAsRead).toHaveBeenCalledWith(viewed);
    expect(articles()[0]).not.toHaveClass('cometchat-notification-feed__item--unread');
    expect(articles()[1]).toHaveClass('cometchat-notification-feed__item--unread');
    expect(screen.getByRole('tab', { name: /notifications_filter_all\s*1/ })).toBeInTheDocument();
  });

  it('stops tracking visibility and real-time updates on unmount', async () => {
    const { unmount } = await renderLoaded();
    const listenerId = sdk.addNotificationFeedListener.mock.calls[0]?.[0] as string;
    unmount();
    expect(observer.disconnect).toHaveBeenCalled();
    expect(sdk.removeNotificationFeedListener).toHaveBeenCalledWith(listenerId);
  });
});
