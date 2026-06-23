import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CometChatNotificationFeedContext } from '../CometChatNotificationFeed.context';
import { CometChatNotificationFeedHeader } from '../CometChatNotificationFeedHeader';
import { CometChatNotificationFeedEmptyState } from '../CometChatNotificationFeedEmptyState';
import { CometChatNotificationFeedErrorState } from '../CometChatNotificationFeedErrorState';
import { CometChatNotificationFeedLoadingState } from '../CometChatNotificationFeedLoadingState';
import type { CometChatNotificationFeedContextValue } from '../CometChatNotificationFeed.types';

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
  return render(
    <CometChatNotificationFeedContext.Provider value={createMockContext(ctx)}>
      {ui}
    </CometChatNotificationFeedContext.Provider>
  );
}

describe('CometChatNotificationFeedHeader', () => {
  it('renders the title from context', () => {
    renderWithContext(<CometChatNotificationFeedHeader />, { title: 'My Notifications' });
    expect(screen.getByText('My Notifications')).toBeInTheDocument();
  });

  it('renders custom children instead of default title', () => {
    renderWithContext(
      <CometChatNotificationFeedHeader>
        <span>Custom Header</span>
      </CometChatNotificationFeedHeader>
    );
    expect(screen.getByText('Custom Header')).toBeInTheDocument();
  });

  it('does not render when showHeader is false', () => {
    const { container } = renderWithContext(<CometChatNotificationFeedHeader />, {
      showHeader: false,
    });
    expect(container.firstChild).toBeNull();
  });
});

describe('CometChatNotificationFeedEmptyState', () => {
  it('renders when screenState is empty', () => {
    renderWithContext(<CometChatNotificationFeedEmptyState />, { screenState: 'empty' });
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('does not render when screenState is not empty', () => {
    const { container } = renderWithContext(<CometChatNotificationFeedEmptyState />, {
      screenState: 'loaded',
    });
    expect(container.firstChild).toBeNull();
  });

  it('renders custom children when provided', () => {
    renderWithContext(
      <CometChatNotificationFeedEmptyState>
        <span>Nothing here</span>
      </CometChatNotificationFeedEmptyState>,
      { screenState: 'empty' }
    );
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });
});

describe('CometChatNotificationFeedErrorState', () => {
  it('renders when screenState is error', () => {
    renderWithContext(<CometChatNotificationFeedErrorState />, { screenState: 'error' });
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('does not render when screenState is not error', () => {
    const { container } = renderWithContext(<CometChatNotificationFeedErrorState />, {
      screenState: 'loaded',
    });
    expect(container.firstChild).toBeNull();
  });

  it('renders custom children when provided', () => {
    renderWithContext(
      <CometChatNotificationFeedErrorState>
        <span>Error!</span>
      </CometChatNotificationFeedErrorState>,
      { screenState: 'error' }
    );
    expect(screen.getByText('Error!')).toBeInTheDocument();
  });
});

describe('CometChatNotificationFeedLoadingState', () => {
  it('renders when screenState is loading', () => {
    const { container } = renderWithContext(<CometChatNotificationFeedLoadingState />, {
      screenState: 'loading',
    });
    expect(container.firstChild).not.toBeNull();
  });

  it('does not render when screenState is not loading', () => {
    const { container } = renderWithContext(<CometChatNotificationFeedLoadingState />, {
      screenState: 'loaded',
    });
    expect(container.firstChild).toBeNull();
  });

  it('renders custom children when provided', () => {
    renderWithContext(
      <CometChatNotificationFeedLoadingState>
        <span>Loading...</span>
      </CometChatNotificationFeedLoadingState>,
      { screenState: 'loading' }
    );
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
