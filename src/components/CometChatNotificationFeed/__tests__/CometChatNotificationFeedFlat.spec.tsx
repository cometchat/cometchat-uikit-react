/**
 * Unit tests for the flat <CometChatNotificationFeed /> API: the default layout
 * without convenience props, and headerView / loadingView / errorView /
 * emptyView / itemView replacing their slots per screen state while Root props
 * keep working. The data hook is mocked so each state can be set directly.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type {
  CometChatUseCometChatNotificationFeedReturn,
  NotificationFeedItem,
  ScreenState,
} from '../CometChatNotificationFeed.types';

const hook = vi.hoisted(() => ({
  state: {} as Record<string, unknown>,
  options: undefined as unknown,
}));

vi.mock('../useCometChatNotificationFeed', () => ({
  useCometChatNotificationFeed: (options: unknown) => {
    hook.options = options;
    return hook.state;
  },
}));

vi.mock('../../../context/locale/LocaleContext', () => ({
  useLocale: () => ({ getLocalizedString: (key: string) => key, language: 'en-us' }),
}));

vi.mock('../CometChatNotificationFeedItem', () => ({
  CometChatNotificationFeedItem: ({ item }: { item: NotificationFeedItem }) => (
    <div data-testid="default-item">{item.getId()}</div>
  ),
}));

import { CometChatNotificationFeed } from '../CometChatNotificationFeed';

const item = (id: string) =>
  ({ getId: () => id, getCategory: () => 'Orders' }) as unknown as NotificationFeedItem;

function setState(screenState: ScreenState, items: NotificationFeedItem[] = []) {
  hook.state = {
    items,
    groupedItems: items.length ? [{ label: 'Today', items }] : [],
    categories: [],
    activeCategory: null,
    totalUnreadCount: 0,
    categoryUnreadCounts: new Map(),
    screenState,
    isLoadingMore: false,
    isRefreshing: false,
    error: null,
    hasMorePages: false,
    paginationError: false,
    fetchNextPage: vi.fn(),
    refresh: vi.fn(),
    switchCategory: vi.fn(),
    markAllAsRead: vi.fn(),
    retryPagination: vi.fn(),
    reportClicked: vi.fn(),
    reportViewed: vi.fn(),
    reportRead: vi.fn(),
  } satisfies CometChatUseCometChatNotificationFeedReturn;
}

describe('CometChatNotificationFeed (flat API)', () => {
  beforeEach(() => {
    setState('loaded', [item('a'), item('b')]);
  });

  it('renders the default layout when no convenience props are given', () => {
    render(<CometChatNotificationFeed title="Inbox" />);
    expect(screen.getByRole('heading', { name: 'Inbox' })).toBeInTheDocument();
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getAllByTestId('default-item').map(e => e.textContent)).toEqual(['a', 'b']);
  });

  it('forwards data options to the hook', () => {
    const feedBuilder = { fetchNext: vi.fn() };
    const onError = vi.fn();
    render(<CometChatNotificationFeed notificationFeedRequestBuilder={feedBuilder} onError={onError} />);
    expect(hook.options).toMatchObject({ notificationFeedRequestBuilder: feedBuilder, onError });
  });

  it('replaces the header with headerView but keeps chips and items', () => {
    render(<CometChatNotificationFeed title="Inbox" headerView={<h1>My header</h1>} />);
    expect(screen.getByRole('heading', { name: 'My header' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Inbox' })).toBeNull();
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getAllByTestId('default-item')).toHaveLength(2);
  });

  it('renders itemView for each item instead of the default item', () => {
    render(<CometChatNotificationFeed itemView={i => <p>custom {i.getId()}</p>} />);
    expect(screen.getByText('custom a')).toBeInTheDocument();
    expect(screen.getByText('custom b')).toBeInTheDocument();
    expect(screen.queryByTestId('default-item')).toBeNull();
  });

  it('shows loadingView only while loading', () => {
    setState('loading');
    const { rerender } = render(<CometChatNotificationFeed loadingView={<p>Fetching…</p>} />);
    expect(screen.getByRole('status', { name: 'accessibility_loading_notifications' })).toHaveTextContent(
      'Fetching…'
    );

    setState('loaded', [item('a')]);
    rerender(<CometChatNotificationFeed loadingView={<p>Fetching…</p>} />);
    expect(screen.queryByText('Fetching…')).toBeNull();
    expect(screen.getByTestId('default-item')).toBeInTheDocument();
  });

  it('shows errorView in the error state', () => {
    setState('error');
    render(<CometChatNotificationFeed errorView={<p>Could not load</p>} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load');
    expect(screen.queryByRole('button', { name: 'accessibility_retry_notifications' })).toBeNull();
  });

  it('shows emptyView in the empty state', () => {
    setState('empty');
    render(<CometChatNotificationFeed emptyView={<p>All caught up</p>} />);
    expect(screen.getByRole('status')).toHaveTextContent('All caught up');
    expect(screen.queryByText('notifications_empty_title')).toBeNull();
  });

  it('keeps default views for states without an override', () => {
    setState('error');
    const { rerender } = render(<CometChatNotificationFeed emptyView={<p>All caught up</p>} />);
    expect(screen.getByRole('button', { name: 'accessibility_retry_notifications' })).toBeInTheDocument();

    setState('loading');
    rerender(<CometChatNotificationFeed emptyView={<p>All caught up</p>} />);
    expect(screen.getByText('loading')).toBeInTheDocument();

    setState('empty');
    rerender(<CometChatNotificationFeed errorView={<p>Could not load</p>} />);
    expect(screen.getByText('notifications_empty_title')).toBeInTheDocument();
  });

  it('still honours Root props such as onBackPress alongside convenience props', () => {
    const onBackPress = vi.fn();
    render(
      <CometChatNotificationFeed
        showBackButton
        onBackPress={onBackPress}
        emptyView={<p>All caught up</p>}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'accessibility_back' }));
    expect(onBackPress).toHaveBeenCalled();
  });

  it('exposes the compound parts for custom composition', () => {
    render(
      <CometChatNotificationFeed.Root title="Composed">
        <CometChatNotificationFeed.Header />
        <CometChatNotificationFeed.List />
      </CometChatNotificationFeed.Root>
    );
    expect(screen.getByRole('heading', { name: 'Composed' })).toBeInTheDocument();
    expect(screen.queryByRole('tablist')).toBeNull();
    expect(screen.getAllByTestId('default-item')).toHaveLength(2);
  });
});
