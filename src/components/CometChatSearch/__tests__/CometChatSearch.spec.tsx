/**
 * Unit tests for CometChatSearch component.
 *
 * Tests rendering states, filter interactions, and search behavior.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockCometChat } from '../../../testing/mock-sdk';

vi.mock('@cometchat/chat-sdk-javascript', () => ({ CometChat: mockCometChat }));

// Mock the sub-list components to isolate Root behavior
vi.mock('../CometChatSearchConversationsList', () => ({
  CometChatSearchConversationsList: () => (
    <div data-testid="conversations-list">Conversations Results</div>
  ),
}));

vi.mock('../CometChatSearchMessagesList', () => ({
  CometChatSearchMessagesList: () => <div data-testid="messages-list">Messages Results</div>,
}));

// Mock CometChatSearchBar
vi.mock('../../base/CometChatSearchBar/CometChatSearchBar', () => ({
  CometChatSearchBar: {
    Root: ({
      children,
      searchText,
      onChange,
      inputRef,
    }: {
      children: React.ReactNode;
      searchText: string;
      onChange: (value: string) => void;
      placeholderText?: string;
      inputRef?: React.RefObject<HTMLInputElement | null>;
      className?: string;
    }) => (
      <div data-testid="search-bar">
        <input
          ref={inputRef}
          data-testid="search-input"
          value={searchText}
          onChange={e => onChange(e.target.value)}
          aria-label="Search"
        />
        {children}
      </div>
    ),
    Input: () => null,
  },
}));

// Mock CometChatLocalize
vi.mock('../../../resources/CometChatLocalize/CometChatLocalize', () => ({
  CometChatLocalize: {
    getSharedInstance: () => ({
      t: (key: string) => {
        const translations: Record<string, string> = {
          search_title: 'Search',
          search_placeholder: 'Search...',
          search_empty_title: 'Search for messages',
          search_empty_subtitle: 'Type to search',
          search_no_result_title: 'No results found',
          search_no_result_subtitle: 'Try a different search',
          search_error_title: 'Something went wrong',
          search_error_subtitle: 'Please try again',
          search_filter_audio: 'Audio',
          search_filter_documents: 'Files',
          search_filter_groups: 'Groups',
          search_filter_links: 'Links',
          search_filter_photos: 'Photos',
          search_filter_unread: 'Unread',
          search_filter_videos: 'Videos',
          search_filter_messages: 'Messages',
          search_filter_conversations: 'Conversations',
          accessibility_back: 'Back',
          accessibility_clear_search: 'Clear search',
        };
        return translations[key] ?? key;
      },
    }),
  },
}));

import { CometChatSearch } from '../CometChatSearch';

describe('CometChatSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('rendering', () => {
    it('renders the search container with role="search"', () => {
      render(<CometChatSearch />);
      expect(screen.getByRole('search')).toBeInTheDocument();
    });

    it('renders the search container with aria-label', () => {
      render(<CometChatSearch />);
      const searchEl = screen.getByRole('search');
      expect(searchEl).toHaveAttribute('aria-label');
    });

    it('renders the search input', () => {
      render(<CometChatSearch />);
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
    });

    it('renders filter chips', () => {
      render(<CometChatSearch />);
      expect(screen.getByTestId('search-filter-audio')).toBeInTheDocument();
      expect(screen.getByTestId('search-filter-photos')).toBeInTheDocument();
      expect(screen.getByTestId('search-filter-videos')).toBeInTheDocument();
      expect(screen.getByTestId('search-filter-files')).toBeInTheDocument();
      expect(screen.getByTestId('search-filter-links')).toBeInTheDocument();
      expect(screen.getByTestId('search-filter-groups')).toBeInTheDocument();
      expect(screen.getByTestId('search-filter-unread')).toBeInTheDocument();
    });

    it('renders the back button by default', () => {
      render(<CometChatSearch />);
      expect(screen.getByTestId('search-back-button')).toBeInTheDocument();
    });

    it('hides the back button when hideBackButton is true', () => {
      render(<CometChatSearch hideBackButton />);
      expect(screen.queryByTestId('search-back-button')).not.toBeInTheDocument();
    });
  });

  describe('initial view', () => {
    it('shows the initial view when no search text and no filters', () => {
      render(<CometChatSearch />);
      expect(screen.getByText('Search for messages')).toBeInTheDocument();
    });

    it('renders custom initialView when provided', () => {
      render(<CometChatSearch initialView={<div data-testid="custom-initial">Custom</div>} />);
      expect(screen.getByTestId('custom-initial')).toBeInTheDocument();
    });
  });

  describe('filter interactions', () => {
    it('filter chips have aria-pressed attribute', () => {
      render(<CometChatSearch />);
      const audioFilter = screen.getByTestId('search-filter-audio');
      expect(audioFilter).toHaveAttribute('aria-pressed', 'false');
    });

    it('clicking a filter toggles aria-pressed to true', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      render(<CometChatSearch />);

      const audioFilter = screen.getByTestId('search-filter-audio');
      await user.click(audioFilter);

      expect(audioFilter).toHaveAttribute('aria-pressed', 'true');
    });

    it('clicking an active filter toggles it off', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      render(<CometChatSearch />);

      const audioFilter = screen.getByTestId('search-filter-audio');
      await user.click(audioFilter);
      expect(audioFilter).toHaveAttribute('aria-pressed', 'true');

      await user.click(audioFilter);
      expect(audioFilter).toHaveAttribute('aria-pressed', 'false');
    });

    it('filter bar has role="toolbar"', () => {
      render(<CometChatSearch />);
      expect(screen.getByRole('toolbar')).toBeInTheDocument();
    });
  });

  describe('search behavior', () => {
    it('shows results sections after typing (debounced)', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      render(<CometChatSearch />);

      const input = screen.getByTestId('search-input');
      await user.type(input, 'hello');

      // Wait for debounce (500ms)
      await waitFor(
        () => {
          expect(screen.getByTestId('conversations-list')).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });

    it('shows clear button when search has text', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      render(<CometChatSearch />);

      const input = screen.getByTestId('search-input');
      await user.type(input, 'hello');

      expect(screen.getByTestId('search-clear-button')).toBeInTheDocument();
    });

    it('clear button has aria-label', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      render(<CometChatSearch />);

      const input = screen.getByTestId('search-input');
      await user.type(input, 'hello');

      const clearBtn = screen.getByTestId('search-clear-button');
      expect(clearBtn).toHaveAttribute('aria-label');
    });

    it('clicking clear button resets search', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      render(<CometChatSearch />);

      const input = screen.getByTestId('search-input');
      await user.type(input, 'hello');

      const clearBtn = screen.getByTestId('search-clear-button');
      await user.click(clearBtn);

      // Should show initial view again
      await waitFor(() => {
        expect(screen.getByText('Search for messages')).toBeInTheDocument();
      });
    });
  });

  describe('callbacks', () => {
    it('calls onBack when back button is clicked', async () => {
      vi.useRealTimers();
      const onBack = vi.fn();
      const user = userEvent.setup();
      render(<CometChatSearch onBack={onBack} />);

      await user.click(screen.getByTestId('search-back-button'));
      expect(onBack).toHaveBeenCalledOnce();
    });
  });

  describe('scoped search', () => {
    it('hides conversation filters when uid is provided', () => {
      render(<CometChatSearch uid="user-1" />);
      expect(screen.queryByTestId('search-filter-groups')).not.toBeInTheDocument();
      expect(screen.queryByTestId('search-filter-unread')).not.toBeInTheDocument();
    });

    it('hides conversation filters when guid is provided', () => {
      render(<CometChatSearch guid="group-1" />);
      expect(screen.queryByTestId('search-filter-groups')).not.toBeInTheDocument();
      expect(screen.queryByTestId('search-filter-unread')).not.toBeInTheDocument();
    });

    it('shows messages list when uid is provided and search text entered', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      render(<CometChatSearch uid="user-1" />);

      const input = screen.getByTestId('search-input');
      await user.type(input, 'hello');

      await waitFor(
        () => {
          expect(screen.getByTestId('messages-list')).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });

    it('shows messages list when guid is provided and search text entered', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      render(<CometChatSearch guid="group-1" />);

      const input = screen.getByTestId('search-input');
      await user.type(input, 'hello');

      await waitFor(
        () => {
          expect(screen.getByTestId('messages-list')).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });

    it('does NOT show conversations list when uid is provided', () => {
      render(<CometChatSearch uid="user-1" />);
      expect(screen.queryByTestId('conversations-list')).not.toBeInTheDocument();
    });
  });

  describe('compound composition', () => {
    it('renders custom children when provided', () => {
      render(
        <CometChatSearch.Root>
          <div data-testid="custom-child">Custom layout</div>
        </CometChatSearch.Root>
      );
      expect(screen.getByTestId('custom-child')).toBeInTheDocument();
    });

    it('does NOT render default layout when children are provided', () => {
      render(
        <CometChatSearch.Root>
          <div data-testid="custom-child">Custom layout</div>
        </CometChatSearch.Root>
      );
      expect(screen.queryByTestId('search-input')).not.toBeInTheDocument();
    });
  });

  describe('searchIn scope', () => {
    it('only shows conversations when searchIn is ["conversations"]', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      render(<CometChatSearch searchIn={['conversations']} />);

      const input = screen.getByTestId('search-input');
      await user.type(input, 'hello');

      await waitFor(
        () => {
          expect(screen.getByTestId('conversations-list')).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
      expect(screen.queryByTestId('messages-list')).not.toBeInTheDocument();
    });

    it('only shows messages when searchIn is ["messages"]', async () => {
      vi.useRealTimers();
      const user = userEvent.setup();
      render(<CometChatSearch searchIn={['messages']} />);

      const input = screen.getByTestId('search-input');
      await user.type(input, 'hello');

      await waitFor(
        () => {
          expect(screen.getByTestId('messages-list')).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
      expect(screen.queryByTestId('conversations-list')).not.toBeInTheDocument();
    });
  });

  describe('defaultSearchText', () => {
    it('pre-populates the search input with defaultSearchText', () => {
      render(<CometChatSearch defaultSearchText="pre-filled" />);
      const input = screen.getByTestId('search-input') as HTMLInputElement;
      expect(input.value).toBe('pre-filled');
    });
  });

  describe('initialSearchFilter', () => {
    it('pre-selects the specified filter on mount', () => {
      render(<CometChatSearch initialSearchFilter="photos" />);
      const photosFilter = screen.getByTestId('search-filter-photos');
      expect(photosFilter).toHaveAttribute('aria-pressed', 'true');
    });
  });
});
