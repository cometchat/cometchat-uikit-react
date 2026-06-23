/**
 * CometChatNotificationFeed Storybook Stories
 *
 * Interactive stories demonstrating the notification feed component:
 * - Default (loaded with notifications)
 * - Loading state (spinner)
 * - Empty state
 * - Error state
 * - With filter chips (categories)
 * - With unread notifications
 * - Dark theme
 *
 * @module components/CometChatNotificationFeed
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { CometChatNotificationFeed } from './CometChatNotificationFeed';
import { CometChatNotificationFeedContext } from './CometChatNotificationFeed.context';
import type {
  CometChatNotificationFeedContextValue,
  NotificationFeedItem,
  NotificationCategory,
  TimestampGroup,
} from './CometChatNotificationFeed.types';
import { groupByTimestamp } from './utils';

// ============================================
// Mock Data
// ============================================

const now = Math.floor(Date.now() / 1000);

function createMockFeedItem(
  id: string,
  category: string,
  sentAt: number,
  isRead: boolean,
  content: { title?: string; subtitle?: string } = {}
): NotificationFeedItem {
  const cardSchema = {
    version: '1.0',
    body: [
      {
        id: `${id}-title`,
        type: 'text',
        content: content.title ?? 'Notification Title',
        variant: 'heading3',
        fontWeight: 'bold',
      },
      {
        id: `${id}-spacer`,
        type: 'spacer',
        height: 4,
      },
      {
        id: `${id}-subtitle`,
        type: 'text',
        content: content.subtitle ?? 'Your notification message here.',
        variant: 'body',
      },
      {
        id: `${id}-divider`,
        type: 'divider',
        thickness: 1,
        margin: 12,
      },
      {
        id: `${id}-action`,
        type: 'link',
        text: 'Learn More',
        action: {
          type: 'openUrl',
          url: 'https://example.com',
        },
        color: { light: '#6852d6', dark: '#a78bfa' },
      },
    ],
    fallbackText: content.title ?? 'Notification Title',
    style: {
      background: { light: '#f5f5f5', dark: '#2a2a2a' },
      borderRadius: 12,
      padding: { top: 16, right: 16, bottom: 16, left: 16 },
    },
  };

  return {
    getId: () => id,
    getSentAt: () => sentAt,
    getReadAt: () => (isRead ? sentAt + 10 : null),
    setReadAt: () => {
      /* no-op */
    },
    getContent: () => JSON.stringify(cardSchema),
    getCategory: () => category,
  };
}

const mockItems: NotificationFeedItem[] = [
  createMockFeedItem('item-1', 'CATEGORY-1', now - 120, false, {
    title: 'Campaigns is live in v7!!!!',
    subtitle: 'Your announcement message here.',
  }),
  createMockFeedItem('item-2', 'CATEGORY-1', now - 3600, true, {
    title: 'New Feature Available',
    subtitle: 'Check out the latest updates to your dashboard.',
  }),
  createMockFeedItem('item-3', 'CATEGORY-2', now - 7200, true, {
    title: 'Weekly Digest',
    subtitle: 'Here is your weekly summary of activity.',
  }),
  createMockFeedItem('item-4', 'CATEGORY-1', now - 86400, false, {
    title: 'Special Offer',
    subtitle: 'Limited time discount on premium features.',
  }),
  createMockFeedItem('item-5', 'CATEGORY-2', now - 172800, true, {
    title: 'System Maintenance',
    subtitle: 'Scheduled maintenance on Saturday 2AM-4AM UTC.',
  }),
];

const mockCategories: NotificationCategory[] = [
  { id: 'cat-1', label: 'Category-1' },
  { id: 'cat-2', label: 'Category-2' },
];

const mockGroupedItems: TimestampGroup[] = groupByTimestamp(mockItems);

// ============================================
// Context mock helper
// ============================================

function createMockContext(
  overrides: Partial<CometChatNotificationFeedContextValue> = {}
): CometChatNotificationFeedContextValue {
  return {
    items: mockItems,
    groupedItems: mockGroupedItems,
    categories: mockCategories,
    activeCategory: null,
    totalUnreadCount: 2,
    categoryUnreadCounts: new Map([
      ['cat-1', 1],
      ['cat-2', 1],
    ]),
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
    cardThemeOverride: undefined,
    fetchNextPage: async () => {
      /* no-op */
    },
    refresh: async () => {
      /* no-op */
    },
    switchCategory: () => {
      /* no-op */
    },
    markAllAsRead: async () => {
      /* no-op */
    },
    retryPagination: () => {
      /* no-op */
    },
    reportClicked: () => {
      /* no-op */
    },
    reportViewed: () => {
      /* no-op */
    },
    reportRead: () => {
      /* no-op */
    },
    observeItem: () => {
      /* no-op */
    },
    onItemClick: undefined,
    onActionClick: undefined,
    onBackPress: undefined,
    ...overrides,
  };
}

// ============================================
// Wrapper styles
// ============================================

const containerStyle: React.CSSProperties = {
  width: '600px',
  height: '700px',
  border: '1px solid var(--cometchat-border-color-light, #eee)',
  borderRadius: '8px',
  overflow: 'hidden',
};

// ============================================
// Meta Configuration
// ============================================

const meta: Meta = {
  title: 'Components/Notification Feed/CometChat Notification Feed',
  component: CometChatNotificationFeed.Root,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Displays a real-time notification feed with card rendering, category filtering, engagement tracking, and infinite scroll pagination.',
      },
    },
    layout: 'centered',
  },
  args: {
    title: 'Notifications',
    showHeader: true,
    showBackButton: false,
    showFilterChips: true,
    cardThemeMode: 'auto',
  },
  argTypes: {
    title: {
      control: 'text',
      description: 'Title displayed in the header',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: '"Notifications"' },
      },
    },
    showHeader: {
      control: 'boolean',
      description: 'Whether to show the header',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
      },
    },
    showBackButton: {
      control: 'boolean',
      description: 'Whether to show the back button in the header',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    showFilterChips: {
      control: 'boolean',
      description: 'Whether to show the category filter chips',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
      },
    },
    cardThemeMode: {
      control: 'select',
      options: ['auto', 'light', 'dark'],
      description: 'Card theme mode forwarded to @cometchat/cards-react',
      table: {
        type: { summary: "'auto' | 'light' | 'dark'" },
        defaultValue: { summary: "'auto'" },
      },
    },
    onItemClick: {
      action: 'onItemClick',
      description: 'Called when a feed item is clicked',
    },
    onActionClick: {
      action: 'onActionClick',
      description: 'Called when a card action button is clicked',
    },
    onBackPress: {
      action: 'onBackPress',
      description: 'Called when the back button is pressed',
    },
    onError: {
      action: 'onError',
      description: 'Called when an error occurs',
    },
  },
  decorators: [
    Story => (
      <div style={containerStyle}>
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof meta>;

// ============================================
// Stories
// ============================================

/** Default loaded state with notifications. */
export const Default: Story = {
  render: args => <DefaultDemo {...args} />,
};

function DefaultDemo(args: Record<string, unknown>) {
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null);

  const filteredItems = activeCategory
    ? mockItems.filter(item => item.getCategory().toLowerCase() === activeCategory.toLowerCase())
    : mockItems;

  const ctx = createMockContext({
    items: filteredItems,
    groupedItems: groupByTimestamp(filteredItems),
    activeCategory,
    title: args.title as string,
    showHeader: args.showHeader as boolean,
    showBackButton: args.showBackButton as boolean,
    showFilterChips: args.showFilterChips as boolean,
    cardThemeMode: args.cardThemeMode as 'auto' | 'light' | 'dark',
    switchCategory: (category: string | null) => {
      setActiveCategory(category);
    },
  });

  return (
    <CometChatNotificationFeedContext.Provider value={ctx}>
      <div className="cometchat-notification-feed" style={{ height: '100%' }}>
        <CometChatNotificationFeed.Header />
        <CometChatNotificationFeed.FilterChips />
        <CometChatNotificationFeed.List />
      </div>
    </CometChatNotificationFeedContext.Provider>
  );
}

/** Loading state with spinner. */
export const LoadingState: Story = {
  render: args => {
    const ctx = createMockContext({
      items: [],
      groupedItems: [],
      screenState: 'loading',
      totalUnreadCount: 0,
      title: args.title as string,
      showHeader: args.showHeader as boolean,
      showBackButton: args.showBackButton as boolean,
      showFilterChips: args.showFilterChips as boolean,
    });
    return (
      <CometChatNotificationFeedContext.Provider value={ctx}>
        <div className="cometchat-notification-feed" style={{ height: '100%' }}>
          <CometChatNotificationFeed.Header />
          <CometChatNotificationFeed.FilterChips />
          <CometChatNotificationFeed.LoadingState />
        </div>
      </CometChatNotificationFeedContext.Provider>
    );
  },
};

/** Empty state when no notifications are available. */
export const EmptyState: Story = {
  render: args => {
    const ctx = createMockContext({
      items: [],
      groupedItems: [],
      screenState: 'empty',
      totalUnreadCount: 0,
      title: args.title as string,
      showHeader: args.showHeader as boolean,
      showBackButton: args.showBackButton as boolean,
      showFilterChips: args.showFilterChips as boolean,
    });
    return (
      <CometChatNotificationFeedContext.Provider value={ctx}>
        <div className="cometchat-notification-feed" style={{ height: '100%' }}>
          <CometChatNotificationFeed.Header />
          <CometChatNotificationFeed.FilterChips />
          <CometChatNotificationFeed.EmptyState />
        </div>
      </CometChatNotificationFeedContext.Provider>
    );
  },
};

/** Error state when fetching fails. */
export const ErrorState: Story = {
  render: args => {
    const ctx = createMockContext({
      items: [],
      groupedItems: [],
      screenState: 'error',
      totalUnreadCount: 0,
      error: { code: 'NETWORK_ERROR', message: 'Network error' } as any,
      title: args.title as string,
      showHeader: args.showHeader as boolean,
      showBackButton: args.showBackButton as boolean,
      showFilterChips: args.showFilterChips as boolean,
    });
    return (
      <CometChatNotificationFeedContext.Provider value={ctx}>
        <div className="cometchat-notification-feed" style={{ height: '100%' }}>
          <CometChatNotificationFeed.Header />
          <CometChatNotificationFeed.FilterChips />
          <CometChatNotificationFeed.ErrorState />
        </div>
      </CometChatNotificationFeedContext.Provider>
    );
  },
};

/** With back button visible. */
export const WithBackButton: Story = {
  args: {
    showBackButton: true,
  },
  render: args => {
    const ctx = createMockContext({
      title: args.title as string,
      showHeader: true,
      showBackButton: true,
      showFilterChips: args.showFilterChips as boolean,
      cardThemeMode: args.cardThemeMode as 'auto' | 'light' | 'dark',
    });
    return (
      <CometChatNotificationFeedContext.Provider value={ctx}>
        <div className="cometchat-notification-feed" style={{ height: '100%' }}>
          <CometChatNotificationFeed.Header />
          <CometChatNotificationFeed.FilterChips />
          <CometChatNotificationFeed.List />
        </div>
      </CometChatNotificationFeedContext.Provider>
    );
  },
};

/** With active category filter applied. */
export const WithActiveCategory: Story = {
  render: args => {
    const filteredItems = mockItems.filter(item => item.getCategory() === 'CATEGORY-1');
    const ctx = createMockContext({
      items: filteredItems,
      groupedItems: groupByTimestamp(filteredItems),
      activeCategory: 'Category-1',
      title: args.title as string,
      showHeader: args.showHeader as boolean,
      showBackButton: args.showBackButton as boolean,
      showFilterChips: args.showFilterChips as boolean,
      cardThemeMode: args.cardThemeMode as 'auto' | 'light' | 'dark',
    });
    return (
      <CometChatNotificationFeedContext.Provider value={ctx}>
        <div className="cometchat-notification-feed" style={{ height: '100%' }}>
          <CometChatNotificationFeed.Header />
          <CometChatNotificationFeed.FilterChips />
          <CometChatNotificationFeed.List />
        </div>
      </CometChatNotificationFeedContext.Provider>
    );
  },
};

/** Loading more items (pagination spinner at bottom). */
export const LoadingMore: Story = {
  render: args => {
    const ctx = createMockContext({
      isLoadingMore: true,
      hasMorePages: true,
      title: args.title as string,
      showHeader: args.showHeader as boolean,
      showBackButton: args.showBackButton as boolean,
      showFilterChips: args.showFilterChips as boolean,
      cardThemeMode: args.cardThemeMode as 'auto' | 'light' | 'dark',
    });
    return (
      <CometChatNotificationFeedContext.Provider value={ctx}>
        <div className="cometchat-notification-feed" style={{ height: '100%' }}>
          <CometChatNotificationFeed.Header />
          <CometChatNotificationFeed.FilterChips />
          <CometChatNotificationFeed.List />
        </div>
      </CometChatNotificationFeedContext.Provider>
    );
  },
};

/** Pagination error state. */
export const PaginationError: Story = {
  render: args => {
    const ctx = createMockContext({
      paginationError: true,
      isLoadingMore: false,
      hasMorePages: true,
      title: args.title as string,
      showHeader: args.showHeader as boolean,
      showBackButton: args.showBackButton as boolean,
      showFilterChips: args.showFilterChips as boolean,
      cardThemeMode: args.cardThemeMode as 'auto' | 'light' | 'dark',
    });
    return (
      <CometChatNotificationFeedContext.Provider value={ctx}>
        <div className="cometchat-notification-feed" style={{ height: '100%' }}>
          <CometChatNotificationFeed.Header />
          <CometChatNotificationFeed.FilterChips />
          <CometChatNotificationFeed.List />
        </div>
      </CometChatNotificationFeedContext.Provider>
    );
  },
};
