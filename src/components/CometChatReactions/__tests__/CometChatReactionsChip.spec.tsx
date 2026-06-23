import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CometChatReactionsChip } from '../CometChatReactionsChip';
import { CometChatReactionsContext } from '../CometChatReactions.context';
import type { CometChatReactionsContextValue } from '../CometChatReactions.types';

vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
    isInitialized: vi.fn().mockReturnValue(false),
  },
}));

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Build a mock ReactionCount object. */
function buildReactionCount(emoji: string, count: number, reactedByMe = false) {
  return {
    getReaction: () => emoji,
    getCount: () => count,
    getReactedByMe: () => reactedByMe,
  } as never;
}

/** Create a minimal context value for testing. */
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
    onReactionClick: vi.fn(),
    hoverDebounceTime: 500,
    ...overrides,
  };
}

/** Render the Chip within a context provider. */
function renderChip(
  reaction: ReturnType<typeof buildReactionCount>,
  contextOverrides: Partial<CometChatReactionsContextValue> = {},
  className?: string
) {
  const ctx = createMockContext(contextOverrides);
  return {
    ctx,
    ...render(
      <CometChatReactionsContext.Provider value={ctx}>
        <CometChatReactionsChip reaction={reaction} className={className} />
      </CometChatReactionsContext.Provider>
    ),
  };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('CometChatReactionsChip', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Rendering ──────────────────────────────────────────────────────

  it('renders the emoji', () => {
    renderChip(buildReactionCount('👍', 3));
    expect(screen.getByText('👍')).toBeInTheDocument();
  });

  it('renders the count', () => {
    renderChip(buildReactionCount('👍', 3));
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders as a button element', () => {
    renderChip(buildReactionCount('👍', 3));
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('type', 'button');
  });

  // ─── Active state ─────────────────────────────────────────────────

  it('sets aria-pressed to true when reactedByMe is true', () => {
    renderChip(buildReactionCount('👍', 3, true));
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('sets aria-pressed to false when reactedByMe is false', () => {
    renderChip(buildReactionCount('👍', 3, false));
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  it('applies active CSS class when reactedByMe is true', () => {
    const { container } = renderChip(buildReactionCount('👍', 3, true));
    const button = container.querySelector('button');
    expect(button?.className).toContain('active');
  });

  it('does not apply active CSS class when reactedByMe is false', () => {
    const { container } = renderChip(buildReactionCount('👍', 3, false));
    const button = container.querySelector('button');
    expect(button?.className).not.toContain('active');
  });

  // ─── Accessibility ────────────────────────────────────────────────

  it('has an aria-label with emoji and count for count=1', () => {
    renderChip(buildReactionCount('❤️', 1));
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', '❤️ reacted by 1');
  });

  it('has an aria-label with emoji and count for count>1', () => {
    renderChip(buildReactionCount('❤️', 5));
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', '❤️ reacted by 5');
  });

  // ─── Click handler ────────────────────────────────────────────────

  it('calls onReactionClick with the emoji when clicked', () => {
    const { ctx } = renderChip(buildReactionCount('👍', 3));
    fireEvent.click(screen.getByRole('button'));
    expect(ctx.onReactionClick).toHaveBeenCalledWith('👍');
    expect(ctx.onReactionClick).toHaveBeenCalledTimes(1);
  });

  it('calls onReactionClick with the correct emoji for different reactions', () => {
    const { ctx } = renderChip(buildReactionCount('🎉', 2));
    fireEvent.click(screen.getByRole('button'));
    expect(ctx.onReactionClick).toHaveBeenCalledWith('🎉');
  });

  // ─── Custom className ─────────────────────────────────────────────

  it('applies custom className to the button', () => {
    const { container } = renderChip(buildReactionCount('👍', 1), {}, 'my-custom-chip');
    const button = container.querySelector('button');
    expect(button?.className).toContain('my-custom-chip');
  });

  it('renders without custom className', () => {
    const { container } = renderChip(buildReactionCount('👍', 1));
    const button = container.querySelector('button');
    expect(button).toBeInTheDocument();
  });

  // ─── Different emoji/count combinations ───────────────────────────

  it('renders various emoji correctly', () => {
    const emojis = ['😂', '🔥', '💯', '🙏', '😍'];
    for (const emoji of emojis) {
      const { unmount } = renderChip(buildReactionCount(emoji, 1));
      expect(screen.getByText(emoji)).toBeInTheDocument();
      unmount();
    }
  });

  it('renders large counts', () => {
    renderChip(buildReactionCount('👍', 999));
    expect(screen.getByText('999')).toBeInTheDocument();
  });
});
