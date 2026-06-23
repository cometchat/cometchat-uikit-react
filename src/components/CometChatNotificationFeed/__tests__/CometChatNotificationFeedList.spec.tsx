import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CometChatNotificationFeedContext } from '../CometChatNotificationFeed.context';
import { CometChatNotificationFeedList } from '../CometChatNotificationFeedList';
import type {
  CometChatNotificationFeedContextValue,
  NotificationFeedItem,
  TimestampGroup,
} from '../CometChatNotificationFeed.types';

vi.mock('../../../context/locale/LocaleContext', () => ({
  useLocale: () => ({
    getLocalizedString: (key: string) => key,
    language: 'en-us',
  }),
}));

// Mock the Item child component to keep the List test focused and avoid
// pulling in @cometchat/cards-react / CometChatDate.
vi.mock('../CometChatNotificationFeedItem', () => ({
  CometChatNotificationFeedItem: ({ item }: { item: NotificationFeedItem }) => (
    <div data-testid="feed-item" data-id={item.getId()}>
      item:{item.getId()}
    </div>
  ),
}));

function createMockItem(id: string): NotificationFeedItem {
  return {
    getId: () => id,
    getSentAt: () => 1700000000,
    getReadAt: () => null,
    setReadAt: vi.fn(),
    getContent: () => ({ text: id }),
    getCategory: () => 'Orders',
  };
}

function createMockContext(
  overrides: Partial<CometChatNotificationFeedContextValue> = {}
): CometChatNotificationFeedContextValue {
  return {
    items: [],
    groupedItems: [],
    categories: [],
    activeCategory: null,
    totalUnreadCount: 0,
    categoryUnreadCounts: new Map(),
    screenState: 'loaded',
    isLoadingMore: false,
    isRefreshing: false,
    error: null,
    hasMorePages: false,
    paginationError: false,
    title: 'Notifications',
    showHeader: true,
    showBackButton: false,
    showFilterChips: true,
    cardThemeMode: 'auto',
    fetchNextPage: vi.fn().mockResolvedValue(undefined),
    refresh: vi.fn(),
    switchCategory: vi.fn(),
    markAllAsRead: vi.fn(),
    retryPagination: vi.fn(),
    reportClicked: vi.fn(),
    reportViewed: vi.fn(),
    reportRead: vi.fn(),
    observeItem: vi.fn(),
    ...overrides,
  };
}

function renderWithContext(
  ui: React.ReactElement,
  ctx: Partial<CometChatNotificationFeedContextValue> = {}
) {
  const value = createMockContext(ctx);
  const utils = render(
    <CometChatNotificationFeedContext.Provider value={value}>
      {ui}
    </CometChatNotificationFeedContext.Provider>
  );
  return { ...utils, value };
}

const sampleGroups: TimestampGroup[] = [
  { label: 'Today', items: [createMockItem('a'), createMockItem('b')] },
  { label: 'Yesterday', items: [createMockItem('c')] },
];

describe('CometChatNotificationFeedList', () => {
  it('does not render when not loaded and there are no items', () => {
    const { container } = renderWithContext(<CometChatNotificationFeedList />, {
      screenState: 'loading',
      items: [],
    });
    expect(container.firstChild).toBeNull();
  });

  it('renders when screenState is loaded even with no items', () => {
    renderWithContext(<CometChatNotificationFeedList />, {
      screenState: 'loaded',
      items: [],
    });
    expect(screen.getByRole('feed')).toBeInTheDocument();
  });

  it('renders when there are items even if not loaded (e.g. refreshing)', () => {
    renderWithContext(<CometChatNotificationFeedList />, {
      screenState: 'loading',
      items: [createMockItem('a')],
      groupedItems: [{ label: 'Today', items: [createMockItem('a')] }],
    });
    expect(screen.getByRole('feed')).toBeInTheDocument();
    expect(screen.getByTestId('feed-item')).toBeInTheDocument();
  });

  it('sets aria-busy on the content container while loading', () => {
    renderWithContext(<CometChatNotificationFeedList />, {
      screenState: 'loading',
      items: [createMockItem('a')],
      groupedItems: [{ label: 'Today', items: [createMockItem('a')] }],
    });
    const content = document.querySelector('.cometchat-notification-feed__content')!;
    expect(content).toHaveAttribute('aria-busy', 'true');
  });

  it('renders one item per grouped item using the default item component', () => {
    renderWithContext(<CometChatNotificationFeedList />, {
      screenState: 'loaded',
      items: [createMockItem('a'), createMockItem('b'), createMockItem('c')],
      groupedItems: sampleGroups,
    });
    const items = screen.getAllByTestId('feed-item');
    expect(items).toHaveLength(3);
    expect(items.map(el => el.getAttribute('data-id'))).toEqual(['a', 'b', 'c']);
  });

  it('uses the custom itemView render function when provided', () => {
    const itemView = vi.fn((item: NotificationFeedItem) => (
      <span data-testid="custom-item">custom:{item.getId()}</span>
    ));
    renderWithContext(<CometChatNotificationFeedList itemView={itemView} />, {
      screenState: 'loaded',
      items: [createMockItem('a'), createMockItem('b'), createMockItem('c')],
      groupedItems: sampleGroups,
    });
    expect(screen.getAllByTestId('custom-item')).toHaveLength(3);
    expect(screen.queryByTestId('feed-item')).toBeNull();
    expect(itemView).toHaveBeenCalledTimes(3);
  });

  it('shows the loading-more indicator when isLoadingMore is true', () => {
    renderWithContext(<CometChatNotificationFeedList />, {
      screenState: 'loaded',
      items: [createMockItem('a')],
      groupedItems: [{ label: 'Today', items: [createMockItem('a')] }],
      isLoadingMore: true,
    });
    expect(screen.getByText('loading')).toBeInTheDocument();
    expect(
      document.querySelector('.cometchat-notification-feed__loading-more')
    ).toBeInTheDocument();
    const feed = screen.getByRole('feed');
    expect(feed).toHaveAttribute('aria-busy', 'true');
  });

  it('does not show the loading-more indicator when isLoadingMore is false', () => {
    renderWithContext(<CometChatNotificationFeedList />, {
      screenState: 'loaded',
      items: [createMockItem('a')],
      groupedItems: [{ label: 'Today', items: [createMockItem('a')] }],
      isLoadingMore: false,
    });
    expect(screen.queryByText('loading')).toBeNull();
  });

  it('shows the pagination error block when paginationError is true and not loading more', () => {
    renderWithContext(<CometChatNotificationFeedList />, {
      screenState: 'loaded',
      items: [createMockItem('a')],
      groupedItems: [{ label: 'Today', items: [createMockItem('a')] }],
      paginationError: true,
      isLoadingMore: false,
    });
    expect(screen.getByText('notifications_pagination_error')).toBeInTheDocument();
    expect(screen.getByText('notifications_tap_to_retry')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tap to retry loading more' })).toBeInTheDocument();
  });

  it('hides the pagination error block while loading more', () => {
    renderWithContext(<CometChatNotificationFeedList />, {
      screenState: 'loaded',
      items: [createMockItem('a')],
      groupedItems: [{ label: 'Today', items: [createMockItem('a')] }],
      paginationError: true,
      isLoadingMore: true,
    });
    expect(screen.queryByText('notifications_pagination_error')).toBeNull();
  });

  it('calls retryPagination when the error block is clicked', () => {
    const { value } = renderWithContext(<CometChatNotificationFeedList />, {
      screenState: 'loaded',
      items: [createMockItem('a')],
      groupedItems: [{ label: 'Today', items: [createMockItem('a')] }],
      paginationError: true,
    });
    fireEvent.click(screen.getByRole('button', { name: 'Tap to retry loading more' }));
    expect(value.retryPagination).toHaveBeenCalledTimes(1);
  });

  it('calls retryPagination on Enter and Space keydown, but not other keys', () => {
    const { value } = renderWithContext(<CometChatNotificationFeedList />, {
      screenState: 'loaded',
      items: [createMockItem('a')],
      groupedItems: [{ label: 'Today', items: [createMockItem('a')] }],
      paginationError: true,
    });
    const btn = screen.getByRole('button', { name: 'Tap to retry loading more' });
    fireEvent.keyDown(btn, { key: 'Enter' });
    fireEvent.keyDown(btn, { key: ' ' });
    fireEvent.keyDown(btn, { key: 'Escape' });
    expect(value.retryPagination).toHaveBeenCalledTimes(2);
  });

  it('fetches the next page when scrolled near the bottom with more pages', () => {
    const { value } = renderWithContext(<CometChatNotificationFeedList />, {
      screenState: 'loaded',
      items: [createMockItem('a')],
      groupedItems: [{ label: 'Today', items: [createMockItem('a')] }],
      hasMorePages: true,
      isLoadingMore: false,
    });
    const content = document.querySelector('.cometchat-notification-feed__content')!;
    Object.defineProperty(content, 'scrollHeight', { value: 1000, configurable: true });
    Object.defineProperty(content, 'clientHeight', { value: 500, configurable: true });
    Object.defineProperty(content, 'scrollTop', { value: 450, configurable: true });
    fireEvent.scroll(content);
    expect(value.fetchNextPage).toHaveBeenCalledTimes(1);
  });

  it('does not fetch next page when not near the bottom', () => {
    const { value } = renderWithContext(<CometChatNotificationFeedList />, {
      screenState: 'loaded',
      items: [createMockItem('a')],
      groupedItems: [{ label: 'Today', items: [createMockItem('a')] }],
      hasMorePages: true,
      isLoadingMore: false,
    });
    const content = document.querySelector('.cometchat-notification-feed__content')!;
    Object.defineProperty(content, 'scrollHeight', { value: 1000, configurable: true });
    Object.defineProperty(content, 'clientHeight', { value: 500, configurable: true });
    Object.defineProperty(content, 'scrollTop', { value: 0, configurable: true });
    fireEvent.scroll(content);
    expect(value.fetchNextPage).not.toHaveBeenCalled();
  });

  it('does not fetch next page when near bottom but no more pages', () => {
    const { value } = renderWithContext(<CometChatNotificationFeedList />, {
      screenState: 'loaded',
      items: [createMockItem('a')],
      groupedItems: [{ label: 'Today', items: [createMockItem('a')] }],
      hasMorePages: false,
      isLoadingMore: false,
    });
    const content = document.querySelector('.cometchat-notification-feed__content')!;
    Object.defineProperty(content, 'scrollHeight', { value: 1000, configurable: true });
    Object.defineProperty(content, 'clientHeight', { value: 500, configurable: true });
    Object.defineProperty(content, 'scrollTop', { value: 450, configurable: true });
    fireEvent.scroll(content);
    expect(value.fetchNextPage).not.toHaveBeenCalled();
  });

  it('does not fetch next page when near bottom but already loading more', () => {
    const { value } = renderWithContext(<CometChatNotificationFeedList />, {
      screenState: 'loaded',
      items: [createMockItem('a')],
      groupedItems: [{ label: 'Today', items: [createMockItem('a')] }],
      hasMorePages: true,
      isLoadingMore: true,
    });
    const content = document.querySelector('.cometchat-notification-feed__content')!;
    Object.defineProperty(content, 'scrollHeight', { value: 1000, configurable: true });
    Object.defineProperty(content, 'clientHeight', { value: 500, configurable: true });
    Object.defineProperty(content, 'scrollTop', { value: 450, configurable: true });
    fireEvent.scroll(content);
    expect(value.fetchNextPage).not.toHaveBeenCalled();
  });
});
