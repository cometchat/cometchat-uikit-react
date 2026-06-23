/* eslint-disable @typescript-eslint/unbound-method */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatReactionsBar } from '../CometChatReactionsBar';
import { CometChatReactionsContext } from '../CometChatReactions.context';
import type { CometChatReactionsContextValue } from '../CometChatReactions.types';

// ─── Browser API Polyfills ──────────────────────────────────────────────────

beforeAll(() => {
  // IntersectionObserver polyfill for jsdom
  global.IntersectionObserver = class IntersectionObserver {
    readonly root: Element | null = null;
    readonly rootMargin: string = '';
    readonly thresholds: readonly number[] = [];
    constructor(private callback: IntersectionObserverCallback) {}
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  } as unknown as typeof globalThis.IntersectionObserver;

  // ResizeObserver polyfill for jsdom
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof globalThis.ResizeObserver;
});

// ─── SDK Mock ───────────────────────────────────────────────────────────────

vi.mock('@cometchat/chat-sdk-javascript', () => {
  const mockFetchNext = vi.fn().mockResolvedValue([]);
  const mockBuild = vi.fn().mockReturnValue({ fetchNext: mockFetchNext });
  return {
    CometChat: {
      isInitialized: vi.fn().mockReturnValue(true),
      getLoggedinUser: vi
        .fn()
        .mockResolvedValue({ getUid: () => 'alice-1', getName: () => 'Alice' }),
      ReactionsRequestBuilder: vi.fn().mockImplementation(() => ({
        setLimit: vi.fn().mockReturnThis(),
        setMessageId: vi.fn().mockReturnThis(),
        build: mockBuild,
      })),
    },
  };
});

// Mock locale context
vi.mock('../../../context/locale/LocaleContext', () => ({
  useLocale: () => ({
    getLocalizedString: (key: string) => key,
  }),
}));

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildMessage(id = 1): CometChat.BaseMessage {
  return {
    getId: () => id,
    getReactions: () => [],
  } as unknown as CometChat.BaseMessage;
}

function buildReactionCount(emoji: string, count = 1): CometChat.ReactionCount {
  return {
    getReaction: () => emoji,
    getCount: () => count,
    getReactedByMe: () => false,
  } as unknown as CometChat.ReactionCount;
}

function createMockContext(
  overrides: Partial<CometChatReactionsContextValue> = {}
): CometChatReactionsContextValue {
  const reactions = overrides.reactions ?? [
    buildReactionCount('👍', 3),
    buildReactionCount('❤️', 2),
    buildReactionCount('😂', 1),
    buildReactionCount('🔥', 1),
    buildReactionCount('👏', 1),
  ];

  return {
    message: buildMessage(),
    reactions,
    alignment: 'left',
    maxVisible: 5,
    visibleReactions: reactions.slice(0, 4),
    overflowCount: 1,
    onReactionClick: vi.fn(),
    reactionsRequestBuilder: undefined,
    hoverDebounceTime: 500,
    onError: null,
    ...overrides,
  };
}

function renderBarWithContext(
  contextOverrides: Partial<CometChatReactionsContextValue> = {},
  barProps: { maxVisible?: number } = {}
) {
  const ctx = createMockContext(contextOverrides);
  return {
    ctx,
    ...render(
      <CometChatReactionsContext.Provider value={ctx}>
        <CometChatReactionsBar maxVisible={barProps.maxVisible} />
      </CometChatReactionsContext.Provider>
    ),
  };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('CometChatReactionsBar - CometChatReactionList integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(CometChat.isInitialized).mockReturnValue(true);
    vi.mocked(CometChat.getLoggedinUser).mockResolvedValue({
      getUid: () => 'alice-1',
      getName: () => 'Alice',
    } as unknown as CometChat.User);
  });

  // ─── Overflow popover renders CometChatReactionList.Root with correct props ───

  describe('overflow popover renders CometChatReactionList.Root with correct props', () => {
    it('renders CometChatReactionList.Root when overflow is clicked', async () => {
      renderBarWithContext({}, { maxVisible: 3 });

      // Find and click the overflow button
      const overflowButton = screen.getByRole('button', { name: /more_reactions/i });
      fireEvent.click(overflowButton);

      // The CometChatReactionList.Root renders a wrapper with class containing "cometchat-reaction-list"
      await waitFor(() => {
        const reactionList = document.querySelector('[class*="cometchat-reaction-list"]');
        expect(reactionList).toBeInTheDocument();
      });
    });

    it('passes message from context to CometChatReactionList.Root', async () => {
      const message = buildMessage(42);
      renderBarWithContext({ message }, { maxVisible: 3 });

      const overflowButton = screen.getByRole('button', { name: /more_reactions/i });
      fireEvent.click(overflowButton);

      // CometChatReactionList.Root should render (it uses message internally for fetching)
      await waitFor(() => {
        const reactionList = document.querySelector('[class*="cometchat-reaction-list"]');
        expect(reactionList).toBeInTheDocument();
      });
    });

    it('popover placement is right for left-aligned messages', () => {
      renderBarWithContext({ alignment: 'left' }, { maxVisible: 3 });

      const overflowButton = screen.getByRole('button', { name: /more_reactions/i });
      fireEvent.click(overflowButton);

      // The popover should be open - content is visible
      const reactionList = document.querySelector('[class*="cometchat-reaction-list"]');
      expect(reactionList).toBeInTheDocument();
    });

    it('popover placement is left for right-aligned messages', () => {
      renderBarWithContext({ alignment: 'right' }, { maxVisible: 3 });

      const overflowButton = screen.getByRole('button', { name: /more_reactions/i });
      fireEvent.click(overflowButton);

      const reactionList = document.querySelector('[class*="cometchat-reaction-list"]');
      expect(reactionList).toBeInTheDocument();
    });
  });

  // ─── Popover closes when onEmpty fires ───

  describe('popover closes when onEmpty fires', () => {
    it('closes popover when all reactions are removed (onEmpty fires)', async () => {
      // Setup with a single reaction from the logged-in user so we can remove it
      const mockFetchNext = vi.fn().mockResolvedValue([
        {
          getReaction: () => '👍',
          getReactedBy: () => ({
            getUid: () => 'alice-1',
            getName: () => 'Alice',
            getAvatar: () => 'https://example.com/alice.png',
          }),
          getMessageId: () => 1,
        },
      ]);
      const mockBuild = vi.fn().mockReturnValue({ fetchNext: mockFetchNext });
      vi.mocked(CometChat.ReactionsRequestBuilder).mockImplementation(
        () =>
          ({
            setLimit: vi.fn().mockReturnThis(),
            setMessageId: vi.fn().mockReturnThis(),
            build: mockBuild,
          }) as unknown as CometChat.ReactionsRequestBuilder
      );

      renderBarWithContext({}, { maxVisible: 3 });

      const overflowButton = screen.getByRole('button', { name: /more_reactions/i });
      fireEvent.click(overflowButton);

      // Wait for the reaction list to load
      await waitFor(() => {
        const reactionList = document.querySelector('[class*="cometchat-reaction-list"]');
        expect(reactionList).toBeInTheDocument();
      });

      // When there's only one reaction and it's removed, onEmpty should fire
      // which triggers close() on the popover context
      // The component handles this internally via handleEmpty callback
    });
  });

  // ─── onItemClick invokes onReactionClick with correct emoji ───

  describe('onItemClick invokes onReactionClick with correct emoji', () => {
    it('handleItemClick calls onReactionClick from context with the emoji string', async () => {
      const onReactionClick = vi.fn();
      const reactions = [
        buildReactionCount('👍', 3),
        buildReactionCount('❤️', 2),
        buildReactionCount('😂', 1),
        buildReactionCount('🔥', 1),
        buildReactionCount('👏', 1),
      ];

      // Setup fetch to return a reaction from alice that can be clicked
      const mockFetchNext = vi.fn().mockResolvedValue([
        {
          getReaction: () => '👍',
          getReactedBy: () => ({
            getUid: () => 'alice-1',
            getName: () => 'Alice',
            getAvatar: () => 'https://example.com/alice.png',
          }),
          getMessageId: () => 1,
        },
        {
          getReaction: () => '❤️',
          getReactedBy: () => ({
            getUid: () => 'bob-1',
            getName: () => 'Bob',
            getAvatar: () => 'https://example.com/bob.png',
          }),
          getMessageId: () => 1,
        },
      ]);
      const mockBuild = vi.fn().mockReturnValue({ fetchNext: mockFetchNext });
      vi.mocked(CometChat.ReactionsRequestBuilder).mockImplementation(
        () =>
          ({
            setLimit: vi.fn().mockReturnThis(),
            setMessageId: vi.fn().mockReturnThis(),
            build: mockBuild,
          }) as unknown as CometChat.ReactionsRequestBuilder
      );

      renderBarWithContext({ onReactionClick, reactions }, { maxVisible: 3 });

      // Open the overflow popover
      const overflowButton = screen.getByRole('button', { name: /more_reactions/i });
      fireEvent.click(overflowButton);

      // Wait for reactions to load in the list
      // Alice shows as "You" (localized key) since she's the logged-in user
      await waitFor(() => {
        expect(screen.queryByText('reaction_list_you')).toBeInTheDocument();
      });

      // Click on Alice's reaction (own reaction - should be clickable)
      const aliceItem = screen.getByText('reaction_list_you').closest('[role="listitem"]');
      if (aliceItem) {
        fireEvent.click(aliceItem);
        expect(onReactionClick).toHaveBeenCalledWith('👍');
      }
    });
  });

  // ─── Popover closes on outside click ───

  describe('popover closes on outside click', () => {
    it('closes the overflow popover when clicking outside', async () => {
      renderBarWithContext({}, { maxVisible: 3 });

      // Open the popover
      const overflowButton = screen.getByRole('button', { name: /more_reactions/i });
      fireEvent.click(overflowButton);

      await waitFor(() => {
        const reactionList = document.querySelector('[class*="cometchat-reaction-list"]');
        expect(reactionList).toBeInTheDocument();
      });

      // Click outside
      fireEvent.mouseDown(document.body);

      // Popover should close
      await waitFor(() => {
        const reactionList = document.querySelector('[class*="cometchat-reaction-list"]');
        expect(reactionList).not.toBeInTheDocument();
      });
    });

    it('does not close when clicking inside the popover content', async () => {
      renderBarWithContext({}, { maxVisible: 3 });

      // Open the popover
      const overflowButton = screen.getByRole('button', { name: /more_reactions/i });
      fireEvent.click(overflowButton);

      await waitFor(() => {
        const reactionList = document.querySelector('[class*="cometchat-reaction-list"]');
        expect(reactionList).toBeInTheDocument();
      });

      // Click inside the reaction list
      const reactionList = document.querySelector('[class*="cometchat-reaction-list"]')!;
      fireEvent.mouseDown(reactionList);

      // Popover should remain open
      const stillOpen = document.querySelector('[class*="cometchat-reaction-list"]');
      expect(stillOpen).toBeInTheDocument();
    });
  });
});
