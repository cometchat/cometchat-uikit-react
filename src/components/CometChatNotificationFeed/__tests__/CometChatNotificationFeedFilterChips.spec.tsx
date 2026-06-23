import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CometChatNotificationFeedContext } from '../CometChatNotificationFeed.context';
import { CometChatNotificationFeedFilterChips } from '../CometChatNotificationFeedFilterChips';
import type {
  CometChatNotificationFeedContextValue,
  NotificationCategory,
} from '../CometChatNotificationFeed.types';

vi.mock('../../../context/locale/LocaleContext', () => ({
  useLocale: () => ({
    getLocalizedString: (key: string) => key,
    language: 'en-us',
  }),
}));

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
    fetchNextPage: vi.fn(),
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

const categories: NotificationCategory[] = [
  { id: 'cat-orders', label: 'Orders' },
  { id: 'cat-promos', label: 'Promos' },
];

describe('CometChatNotificationFeedFilterChips', () => {
  it('does not render when showFilterChips is false', () => {
    const { container } = renderWithContext(<CometChatNotificationFeedFilterChips />, {
      showFilterChips: false,
    });
    expect(container.firstChild).toBeNull();
  });

  it('renders the tablist container when showFilterChips is true', () => {
    renderWithContext(<CometChatNotificationFeedFilterChips />);
    const tablist = screen.getByRole('tablist');
    expect(tablist).toBeInTheDocument();
    expect(tablist).toHaveAttribute('aria-label', 'Filter notifications by category');
  });

  it('renders the "All" chip and category chips', () => {
    renderWithContext(<CometChatNotificationFeedFilterChips />, { categories });
    expect(screen.getByText('notifications_filter_all')).toBeInTheDocument();
    expect(screen.getByText('Orders')).toBeInTheDocument();
    expect(screen.getByText('Promos')).toBeInTheDocument();
    // All + 2 categories = 3 tabs
    expect(screen.getAllByRole('tab')).toHaveLength(3);
  });

  it('marks the "All" chip active and selected when activeCategory is null', () => {
    renderWithContext(<CometChatNotificationFeedFilterChips />, {
      categories,
      activeCategory: null,
    });
    const allChip = screen.getByText('notifications_filter_all').closest('button')!;
    expect(allChip).toHaveClass('cometchat-notification-feed__chip--active');
    expect(allChip).toHaveAttribute('aria-selected', 'true');
  });

  it('marks "All" chip inactive (no badge) when a category is active and no unread', () => {
    renderWithContext(<CometChatNotificationFeedFilterChips />, {
      categories,
      activeCategory: 'Orders',
      totalUnreadCount: 0,
    });
    const allChip = screen.getByText('notifications_filter_all').closest('button')!;
    expect(allChip).toHaveClass('cometchat-notification-feed__chip--inactive');
    expect(allChip).toHaveAttribute('aria-selected', 'false');
  });

  it('marks "All" chip inactive-with-badge when not active but has unread', () => {
    renderWithContext(<CometChatNotificationFeedFilterChips />, {
      categories,
      activeCategory: 'Orders',
      totalUnreadCount: 5,
    });
    const allChip = screen.getByText('notifications_filter_all').closest('button')!;
    expect(allChip).toHaveClass('cometchat-notification-feed__chip--inactive-with-badge');
  });

  it('does not render the "All" badge when totalUnreadCount is 0', () => {
    const { container } = renderWithContext(<CometChatNotificationFeedFilterChips />, {
      totalUnreadCount: 0,
    });
    const allChip = screen.getByText('notifications_filter_all').closest('button')!;
    expect(allChip.querySelector('.cometchat-notification-feed__chip-badge')).toBeNull();
    // sanity: container present
    expect(container.firstChild).not.toBeNull();
  });

  it('renders the "All" badge with active styling when active and has unread', () => {
    renderWithContext(<CometChatNotificationFeedFilterChips />, {
      activeCategory: null,
      totalUnreadCount: 7,
    });
    const badge = document.querySelector('.cometchat-notification-feed__chip-badge')!;
    expect(badge).toHaveTextContent('7');
    expect(badge).toHaveClass('cometchat-notification-feed__chip-badge--active');
  });

  it('renders the "All" badge with inactive styling when not active', () => {
    renderWithContext(<CometChatNotificationFeedFilterChips />, {
      categories,
      activeCategory: 'Orders',
      totalUnreadCount: 7,
    });
    const allChip = screen.getByText('notifications_filter_all').closest('button')!;
    const badge = allChip.querySelector('.cometchat-notification-feed__chip-badge')!;
    expect(badge).toHaveClass('cometchat-notification-feed__chip-badge--inactive');
  });

  it('caps the "All" badge at 99+ when totalUnreadCount exceeds 99', () => {
    renderWithContext(<CometChatNotificationFeedFilterChips />, { totalUnreadCount: 150 });
    const badge = document.querySelector('.cometchat-notification-feed__chip-badge')!;
    expect(badge).toHaveTextContent('99+');
  });

  it('calls switchCategory(null) when the "All" chip is clicked', () => {
    const { value } = renderWithContext(<CometChatNotificationFeedFilterChips />, { categories });
    fireEvent.click(screen.getByText('notifications_filter_all').closest('button')!);
    expect(value.switchCategory).toHaveBeenCalledWith(null);
  });

  it('calls switchCategory(label) when a category chip is clicked', () => {
    const { value } = renderWithContext(<CometChatNotificationFeedFilterChips />, { categories });
    fireEvent.click(screen.getByText('Orders').closest('button')!);
    expect(value.switchCategory).toHaveBeenCalledWith('Orders');
  });

  it('marks a category chip active/selected when it is the activeCategory', () => {
    renderWithContext(<CometChatNotificationFeedFilterChips />, {
      categories,
      activeCategory: 'Orders',
    });
    const ordersChip = screen.getByText('Orders').closest('button')!;
    expect(ordersChip).toHaveClass('cometchat-notification-feed__chip--active');
    expect(ordersChip).toHaveAttribute('aria-selected', 'true');
  });

  it('renders a category badge when its unread count > 0 and caps at 99+', () => {
    renderWithContext(<CometChatNotificationFeedFilterChips />, {
      categories,
      categoryUnreadCounts: new Map([
        ['cat-orders', 3],
        ['cat-promos', 120],
      ]),
    });
    const ordersBadge = screen
      .getByText('Orders')
      .closest('button')!
      .querySelector('.cometchat-notification-feed__chip-badge')!;
    const promosBadge = screen
      .getByText('Promos')
      .closest('button')!
      .querySelector('.cometchat-notification-feed__chip-badge')!;
    expect(ordersBadge).toHaveTextContent('3');
    expect(promosBadge).toHaveTextContent('99+');
  });

  it('does not render a category badge when its unread count is 0 / missing', () => {
    renderWithContext(<CometChatNotificationFeedFilterChips />, {
      categories,
      categoryUnreadCounts: new Map(),
    });
    const ordersChip = screen.getByText('Orders').closest('button')!;
    expect(ordersChip.querySelector('.cometchat-notification-feed__chip-badge')).toBeNull();
    expect(ordersChip).toHaveClass('cometchat-notification-feed__chip--inactive');
  });

  it('uses inactive-with-badge styling for an inactive category with unread', () => {
    renderWithContext(<CometChatNotificationFeedFilterChips />, {
      categories,
      activeCategory: 'Promos',
      categoryUnreadCounts: new Map([['cat-orders', 2]]),
    });
    const ordersChip = screen.getByText('Orders').closest('button')!;
    expect(ordersChip).toHaveClass('cometchat-notification-feed__chip--inactive-with-badge');
  });

  it('uses active badge styling for the active category badge', () => {
    renderWithContext(<CometChatNotificationFeedFilterChips />, {
      categories,
      activeCategory: 'Orders',
      categoryUnreadCounts: new Map([['cat-orders', 4]]),
    });
    const badge = screen
      .getByText('Orders')
      .closest('button')!
      .querySelector('.cometchat-notification-feed__chip-badge')!;
    expect(badge).toHaveClass('cometchat-notification-feed__chip-badge--active');
  });

  it('renders custom children instead of the default chips', () => {
    renderWithContext(
      <CometChatNotificationFeedFilterChips>
        <button>Custom Chip</button>
      </CometChatNotificationFeedFilterChips>,
      { categories }
    );
    expect(screen.getByText('Custom Chip')).toBeInTheDocument();
    // Default "All" chip should not be rendered
    expect(screen.queryByText('notifications_filter_all')).toBeNull();
  });
});
