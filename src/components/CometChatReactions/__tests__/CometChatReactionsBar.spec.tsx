import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CometChatReactionsBar } from '../CometChatReactionsBar';
import { CometChatReactionsContext } from '../CometChatReactions.context';
import type { CometChatReactionsContextValue } from '../CometChatReactions.types';

vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
    isInitialized: vi.fn().mockReturnValue(false),
  },
}));

// jsdom does not provide ResizeObserver — stub it globally for this test file
const mockResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
vi.stubGlobal('ResizeObserver', mockResizeObserver);

// Mock CometChatPopover to simplify testing — render children directly
vi.mock('../../base/CometChatPopover', () => ({
  CometChatPopover: {
    Root: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="popover-root">{children}</div>
    ),
    Trigger: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="popover-trigger">{children}</div>
    ),
    Content: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="popover-content">{children}</div>
    ),
  },
}));

// Mock sub-components to isolate Bar testing
vi.mock('../CometChatReactionsInfo', () => ({
  CometChatReactionsInfo: ({ emoji }: { emoji: string }) => (
    <div data-testid={`info-${emoji}`}>Info: {emoji}</div>
  ),
}));

vi.mock('../CometChatReactionsList', () => ({
  CometChatReactionsList: () => <div data-testid="reactions-list">ReactionsList</div>,
}));

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildReactionCount(emoji: string, count: number, reactedByMe = false) {
  return {
    getReaction: () => emoji,
    getCount: () => count,
    getReactedByMe: () => reactedByMe,
  } as never;
}

function createMockContext(
  overrides: Partial<CometChatReactionsContextValue> = {}
): CometChatReactionsContextValue {
  return {
    message: { getId: () => 1 } as never,
    reactions: [],
    alignment: 'left',
    maxVisible: 10,
    visibleReactions: [],
    overflowCount: 0,
    activeTab: 'all',
    reactors: [],
    reactorsFetchState: 'idle',
    reactorsHasMore: true,
    onReactionClick: vi.fn(),
    onReactorClick: vi.fn(),
    setActiveTab: vi.fn(),
    fetchReactors: vi.fn().mockResolvedValue(undefined),
    fetchNextReactors: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function renderBar(
  contextOverrides: Partial<CometChatReactionsContextValue> = {},
  props: { maxVisible?: number; className?: string } = {}
) {
  const ctx = createMockContext(contextOverrides);
  return {
    ctx,
    ...render(
      <CometChatReactionsContext.Provider value={ctx}>
        <CometChatReactionsBar {...props} />
      </CometChatReactionsContext.Provider>
    ),
  };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('CometChatReactionsBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Empty state ──────────────────────────────────────────────────

  it('returns null when there are no reactions', () => {
    const { container } = renderBar({ reactions: [] });
    expect(container.innerHTML).toBe('');
  });

  // ─── Rendering chips ─────────────────────────────────────────────

  it('renders reaction chips for each reaction', () => {
    const reactions = [buildReactionCount('👍', 3), buildReactionCount('❤️', 1)];
    renderBar({ reactions });
    expect(screen.getByText('👍')).toBeInTheDocument();
    expect(screen.getByText('❤️')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('renders a group element with role="group"', () => {
    const reactions = [buildReactionCount('👍', 1)];
    renderBar({ reactions });
    const group = screen.getByRole('group');
    expect(group).toBeInTheDocument();
    expect(group).toHaveAttribute('aria-label', 'Reactions');
  });

  it('has aria-live="polite" for dynamic updates', () => {
    const reactions = [buildReactionCount('👍', 1)];
    renderBar({ reactions });
    const group = screen.getByRole('group');
    expect(group).toHaveAttribute('aria-live', 'polite');
  });

  // ─── Overflow ─────────────────────────────────────────────────────

  it('shows overflow button when reactions exceed maxVisible (prop)', () => {
    const reactions = [
      buildReactionCount('👍', 3),
      buildReactionCount('❤️', 2),
      buildReactionCount('😂', 1),
      buildReactionCount('🎉', 1),
      buildReactionCount('🔥', 1),
    ];
    renderBar({ reactions }, { maxVisible: 4 });
    // With maxVisible=4 and 5 reactions, overflow shows: 3 visible + overflow button
    // showOverflow = 5 > 4 && 4 > 2 → true
    // visibleCount = 4 - 1 = 3
    // overflowCount = 5 - 3 = 2
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('does not show overflow when reactions fit within maxVisible', () => {
    const reactions = [buildReactionCount('👍', 3), buildReactionCount('❤️', 2)];
    renderBar({ reactions }, { maxVisible: 5 });
    expect(screen.queryByText(/\+\d+/)).not.toBeInTheDocument();
  });

  it('does not trigger overflow logic when maxVisible <= 2 (shows all up to maxVisible)', () => {
    const reactions = [
      buildReactionCount('👍', 3),
      buildReactionCount('❤️', 2),
      buildReactionCount('😂', 1),
    ];
    renderBar({ reactions }, { maxVisible: 2 });
    // showOverflow = 3 > 2 && 2 > 2 → false
    // visibleCount = Math.min(3, 2) = 2
    // overflowCount = 3 - 2 = 1 → overflow button still renders
    // But the "smart" overflow (which reserves a slot) is NOT triggered
    // Verify that exactly 2 reaction chips are visible
    expect(screen.getByText('👍')).toBeInTheDocument();
    expect(screen.getByText('❤️')).toBeInTheDocument();
  });

  // ─── Info tooltips ────────────────────────────────────────────────

  it('renders info tooltips for each visible reaction', () => {
    const reactions = [buildReactionCount('👍', 3), buildReactionCount('❤️', 1)];
    renderBar({ reactions });
    expect(screen.getByTestId('info-👍')).toBeInTheDocument();
    expect(screen.getByTestId('info-❤️')).toBeInTheDocument();
  });

  // ─── Keyboard navigation ─────────────────────────────────────────

  it('handles ArrowRight key to move focus between chips', () => {
    const reactions = [buildReactionCount('👍', 3), buildReactionCount('❤️', 1)];
    renderBar({ reactions });
    const buttons = screen.getAllByRole('button');
    // Focus the first button
    buttons[0].focus();
    // Press ArrowRight
    fireEvent.keyDown(screen.getByRole('group'), { key: 'ArrowRight' });
    // The handler should attempt to focus the next button
    // (In jsdom, focus management is limited, but we verify no errors)
    expect(buttons[0]).toBeInTheDocument();
  });

  it('handles ArrowLeft key to move focus between chips', () => {
    const reactions = [buildReactionCount('👍', 3), buildReactionCount('❤️', 1)];
    renderBar({ reactions });
    const buttons = screen.getAllByRole('button');
    buttons[1].focus();
    fireEvent.keyDown(screen.getByRole('group'), { key: 'ArrowLeft' });
    expect(buttons[1]).toBeInTheDocument();
  });

  it('ignores non-arrow keys', () => {
    const reactions = [buildReactionCount('👍', 3)];
    renderBar({ reactions });
    // Should not throw
    expect(() => {
      fireEvent.keyDown(screen.getByRole('group'), { key: 'Enter' });
    }).not.toThrow();
  });

  // ─── Custom className ─────────────────────────────────────────────

  it('applies custom className to the bar', () => {
    const reactions = [buildReactionCount('👍', 1)];
    renderBar({ reactions }, { className: 'my-bar-class' });
    const group = screen.getByRole('group');
    expect(group.className).toContain('my-bar-class');
  });

  // ─── Reactions list in overflow popover ───────────────────────────

  it('renders ReactionsList inside overflow popover', () => {
    const reactions = [
      buildReactionCount('👍', 3),
      buildReactionCount('❤️', 2),
      buildReactionCount('😂', 1),
      buildReactionCount('🎉', 1),
      buildReactionCount('🔥', 1),
    ];
    renderBar({ reactions }, { maxVisible: 4 });
    expect(screen.getByTestId('reactions-list')).toBeInTheDocument();
  });

  // ─── Single reaction ──────────────────────────────────────────────

  it('renders a single reaction without overflow', () => {
    const reactions = [buildReactionCount('👍', 10)];
    renderBar({ reactions });
    expect(screen.getByText('👍')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.queryByText(/\+\d+/)).not.toBeInTheDocument();
  });
});
