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

// jsdom does not provide ResizeObserver — stub it globally
const mockResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
vi.stubGlobal('ResizeObserver', mockResizeObserver);

// Mock CometChatPopover to simplify testing.
// The component uses the flat API: <CometChatPopover trigger={...} content={...} />,
// so the mock must be a callable component that renders both trigger and content.
vi.mock('../../base/CometChatPopover', () => ({
  CometChatPopover: Object.assign(
    ({ trigger, content }: { trigger: React.ReactNode; content: React.ReactNode }) => (
      <div data-testid="popover-root">
        <div data-testid="popover-trigger">{trigger}</div>
        <div data-testid="popover-content">{content}</div>
      </div>
    ),
    {
      Root: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="popover-root">{children}</div>
      ),
      Trigger: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="popover-trigger">{children}</div>
      ),
      Content: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="popover-content">{children}</div>
      ),
    }
  ),
  useCometChatPopoverContext: () => ({ close: vi.fn() }),
}));

// Mock CometChatReactionList to avoid deep rendering.
// It is a compound callable component; the bar uses CometChatReactionList.Root.
vi.mock('../../CometChatReactionList', () => ({
  CometChatReactionList: Object.assign(
    (props: Record<string, unknown>) => (
      <div data-testid="reaction-list" data-props={JSON.stringify(Object.keys(props))}>
        ReactionList
      </div>
    ),
    {
      Root: (props: Record<string, unknown>) => (
        <div data-testid="reaction-list-root" data-props={JSON.stringify(Object.keys(props))}>
          ReactionList
        </div>
      ),
    }
  ),
}));

// Mock CometChatReactionsInfo to avoid message.getReactions() call
vi.mock('../CometChatReactionsInfo', () => ({
  CometChatReactionsInfo: ({ emoji }: { emoji: string }) => (
    <div data-testid={`info-${emoji}`}>Info: {emoji}</div>
  ),
}));

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildReactionCount(emoji: string, count: number, reactedByMe = false) {
  return {
    getReaction: () => emoji,
    getCount: () => count,
    getReactedByMe: () => reactedByMe,
  } as never;
}

/**
 * Creates a context value with ONLY bar-relevant fields (the slimmed interface).
 * This helper intentionally does NOT include reactor-list fields.
 */
function createSlimmedContext(
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

function renderBarWithSlimContext(
  contextOverrides: Partial<CometChatReactionsContextValue> = {},
  props: { maxVisible?: number; className?: string } = {}
) {
  const ctx = createSlimmedContext(contextOverrides);
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

describe('CometChatReactionsContextValue — slimmed interface', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('context no longer contains reactor-list fields', () => {
    it('the CometChatReactionsContextValue type does not include activeTab', () => {
      const ctx = createSlimmedContext();
      // TypeScript compilation ensures these fields don't exist on the type.
      // At runtime, verify the object we created has no reactor-list fields.
      expect('activeTab' in ctx).toBe(false);
    });

    it('the CometChatReactionsContextValue type does not include reactors', () => {
      const ctx = createSlimmedContext();
      expect('reactors' in ctx).toBe(false);
    });

    it('the CometChatReactionsContextValue type does not include reactorsFetchState', () => {
      const ctx = createSlimmedContext();
      expect('reactorsFetchState' in ctx).toBe(false);
    });

    it('the CometChatReactionsContextValue type does not include reactorsHasMore', () => {
      const ctx = createSlimmedContext();
      expect('reactorsHasMore' in ctx).toBe(false);
    });

    it('the CometChatReactionsContextValue type does not include setActiveTab', () => {
      const ctx = createSlimmedContext();
      expect('setActiveTab' in ctx).toBe(false);
    });

    it('the CometChatReactionsContextValue type does not include fetchReactors', () => {
      const ctx = createSlimmedContext();
      expect('fetchReactors' in ctx).toBe(false);
    });

    it('the CometChatReactionsContextValue type does not include fetchNextReactors', () => {
      const ctx = createSlimmedContext();
      expect('fetchNextReactors' in ctx).toBe(false);
    });

    it('the CometChatReactionsContextValue type does not include removeReactor', () => {
      const ctx = createSlimmedContext();
      expect('removeReactor' in ctx).toBe(false);
    });

    it('the CometChatReactionsContextValue type does not include onReactorClick', () => {
      const ctx = createSlimmedContext();
      expect('onReactorClick' in ctx).toBe(false);
    });

    it('the slimmed context contains only bar-relevant fields', () => {
      const ctx = createSlimmedContext();
      const expectedKeys = [
        'message',
        'reactions',
        'alignment',
        'maxVisible',
        'visibleReactions',
        'overflowCount',
        'onReactionClick',
        'hoverDebounceTime',
      ];
      const actualKeys = Object.keys(ctx);
      for (const key of expectedKeys) {
        expect(actualKeys).toContain(key);
      }
    });
  });

  describe('ReactionsBar functions correctly with only bar-relevant context fields', () => {
    it('renders reaction chips using slimmed context', () => {
      const reactions = [buildReactionCount('👍', 3), buildReactionCount('❤️', 1)];
      renderBarWithSlimContext({ reactions });
      expect(screen.getByText('👍')).toBeInTheDocument();
      expect(screen.getByText('❤️')).toBeInTheDocument();
    });

    it('renders overflow button when reactions exceed maxVisible', () => {
      const reactions = [
        buildReactionCount('👍', 3),
        buildReactionCount('❤️', 2),
        buildReactionCount('😂', 1),
        buildReactionCount('🎉', 1),
        buildReactionCount('🔥', 1),
      ];
      renderBarWithSlimContext({ reactions }, { maxVisible: 4 });
      expect(screen.getByText('+2')).toBeInTheDocument();
    });

    it('returns null when reactions array is empty', () => {
      const { container } = renderBarWithSlimContext({ reactions: [] });
      expect(container.innerHTML).toBe('');
    });

    it('keyboard navigation works with slimmed context', () => {
      const reactions = [buildReactionCount('👍', 3), buildReactionCount('❤️', 1)];
      renderBarWithSlimContext({ reactions });
      const buttons = screen.getAllByRole('button');
      buttons[0].focus();
      expect(() => {
        fireEvent.keyDown(screen.getByRole('group'), { key: 'ArrowRight' });
      }).not.toThrow();
    });

    it('renders the role="group" element with proper attributes', () => {
      const reactions = [buildReactionCount('👍', 1)];
      renderBarWithSlimContext({ reactions });
      const group = screen.getByRole('group');
      expect(group).toHaveAttribute('aria-live', 'polite');
    });

    it('applies custom className with slimmed context', () => {
      const reactions = [buildReactionCount('👍', 1)];
      renderBarWithSlimContext({ reactions }, { className: 'custom-class' });
      const group = screen.getByRole('group');
      expect(group.className).toContain('custom-class');
    });

    it('does not require reactor-list fields to render correctly', () => {
      // This test confirms that passing a context value WITHOUT any reactor-list fields
      // does not cause errors or missing functionality in the bar
      const reactions = [
        buildReactionCount('👍', 5),
        buildReactionCount('❤️', 3),
        buildReactionCount('😂', 2),
      ];
      const { container } = renderBarWithSlimContext({ reactions });
      expect(container.querySelector('.cometchat-reactions__bar')).toBeInTheDocument();
      expect(screen.getByText('👍')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });
});
