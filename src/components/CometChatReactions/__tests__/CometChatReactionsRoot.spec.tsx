import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { CometChatReactionsRoot } from '../CometChatReactionsRoot';
import { useCometChatReactionsContext } from '../CometChatReactions.context';
import type { CometChat } from '@cometchat/chat-sdk-javascript';

vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
    isInitialized: vi.fn().mockReturnValue(false),
    ReactionsRequestBuilder: vi.fn().mockImplementation(() => ({
      setLimit: vi.fn().mockReturnThis(),
      setMessageId: vi.fn().mockReturnThis(),
      setReaction: vi.fn().mockReturnThis(),
      build: vi.fn().mockReturnValue({ fetchNext: vi.fn().mockResolvedValue([]) }),
    })),
  },
}));

// jsdom does not provide ResizeObserver — stub it globally for this test file
const mockResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
vi.stubGlobal('ResizeObserver', mockResizeObserver);

// Mock CometChatPopover to simplify testing
vi.mock('../../base/CometChatPopover', () => ({
  CometChatPopover: {
    Root: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Trigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Content: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  },
}));

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildReactionCount(emoji: string, count: number, reactedByMe = false) {
  return {
    getReaction: () => emoji,
    getCount: () => count,
    getReactedByMe: () => reactedByMe,
  };
}

function createMockMessage(reactions: ReturnType<typeof buildReactionCount>[] = []) {
  return {
    getId: () => 42,
    getReactions: () => reactions,
    getSender: () => ({ getUid: () => 'u1', getName: () => 'Alice' }),
    getReceiverType: () => 'user',
    getReceiverId: () => 'u2',
    getType: () => 'text',
    getCategory: () => 'message',
    getSentAt: () => Date.now(),
    getDeliveredAt: () => 0,
    getReadAt: () => 0,
    getDeletedAt: () => 0,
    getEditedAt: () => 0,
    getMetadata: () => ({}),
    getMuid: () => 'muid-42',
    getParentMessageId: () => 0,
    getReplyCount: () => 0,
    getMentionedUsers: () => [],
  } as unknown as CometChat.BaseMessage;
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('CometChatReactionsRoot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Empty state ──────────────────────────────────────────────────

  it('returns null when message has no reactions', () => {
    const message = createMockMessage([]);
    const { container } = render(<CometChatReactionsRoot message={message} />);
    expect(container.innerHTML).toBe('');
  });

  // ─── Rendering ────────────────────────────────────────────────────

  it('renders when message has reactions', () => {
    const reactions = [buildReactionCount('👍', 3)];
    const message = createMockMessage(reactions);
    const { container } = render(<CometChatReactionsRoot message={message} />);
    expect(container.innerHTML).not.toBe('');
  });

  it('renders default Bar layout when no children provided', () => {
    const reactions = [buildReactionCount('👍', 3)];
    const message = createMockMessage(reactions);
    render(<CometChatReactionsRoot message={message} />);
    // The default layout renders a Bar which has role="group"
    expect(screen.getByRole('group')).toBeInTheDocument();
  });

  it('renders custom children when provided', () => {
    const reactions = [buildReactionCount('👍', 3)];
    const message = createMockMessage(reactions);
    render(
      <CometChatReactionsRoot message={message}>
        <div data-testid="custom-child">Custom content</div>
      </CometChatReactionsRoot>
    );
    expect(screen.getByTestId('custom-child')).toBeInTheDocument();
  });

  // ─── Custom className ─────────────────────────────────────────────

  it('applies custom className to the root element', () => {
    const reactions = [buildReactionCount('👍', 3)];
    const message = createMockMessage(reactions);
    const { container } = render(
      <CometChatReactionsRoot message={message} className="my-reactions" />
    );
    const root = container.firstElementChild;
    expect(root?.className).toContain('my-reactions');
  });

  // ─── Context provision ────────────────────────────────────────────

  it('provides context values to children', () => {
    function ContextConsumer() {
      const ctx = useCometChatReactionsContext();
      return (
        <div>
          <span data-testid="alignment">{ctx.alignment}</span>
          <span data-testid="active-tab">{ctx.activeTab}</span>
          <span data-testid="fetch-state">{ctx.reactorsFetchState}</span>
          <span data-testid="has-more">{String(ctx.reactorsHasMore)}</span>
        </div>
      );
    }

    const reactions = [buildReactionCount('👍', 3)];
    const message = createMockMessage(reactions);
    render(
      <CometChatReactionsRoot message={message}>
        <ContextConsumer />
      </CometChatReactionsRoot>
    );

    expect(screen.getByTestId('alignment')).toHaveTextContent('left');
    expect(screen.getByTestId('active-tab')).toHaveTextContent('all');
    expect(screen.getByTestId('fetch-state')).toHaveTextContent('idle');
    expect(screen.getByTestId('has-more')).toHaveTextContent('true');
  });

  it('provides custom alignment from props', () => {
    function ContextConsumer() {
      const ctx = useCometChatReactionsContext();
      return <span data-testid="alignment">{ctx.alignment}</span>;
    }

    const reactions = [buildReactionCount('👍', 3)];
    const message = createMockMessage(reactions);
    render(
      <CometChatReactionsRoot message={message} alignment="right">
        <ContextConsumer />
      </CometChatReactionsRoot>
    );

    expect(screen.getByTestId('alignment')).toHaveTextContent('right');
  });

  it('provides reactions from the message', () => {
    function ContextConsumer() {
      const ctx = useCometChatReactionsContext();
      return <span data-testid="count">{ctx.reactions.length}</span>;
    }

    const reactions = [buildReactionCount('👍', 3), buildReactionCount('❤️', 1)];
    const message = createMockMessage(reactions);
    render(
      <CometChatReactionsRoot message={message}>
        <ContextConsumer />
      </CometChatReactionsRoot>
    );

    expect(screen.getByTestId('count')).toHaveTextContent('2');
  });

  // ─── onReactionClick callback ─────────────────────────────────────

  it('calls onReactionClick prop when a reaction is clicked via context', () => {
    const onReactionClick = vi.fn();

    function ContextConsumer() {
      const ctx = useCometChatReactionsContext();
      return <button onClick={() => ctx.onReactionClick('👍')}>Click Reaction</button>;
    }

    const reactions = [buildReactionCount('👍', 3)];
    const message = createMockMessage(reactions);
    render(
      <CometChatReactionsRoot message={message} onReactionClick={onReactionClick}>
        <ContextConsumer />
      </CometChatReactionsRoot>
    );

    fireEvent.click(screen.getByText('Click Reaction'));
    expect(onReactionClick).toHaveBeenCalledWith('👍', message);
  });

  it('does not throw when onReactionClick is not provided', () => {
    function ContextConsumer() {
      const ctx = useCometChatReactionsContext();
      return <button onClick={() => ctx.onReactionClick('👍')}>Click Reaction</button>;
    }

    const reactions = [buildReactionCount('👍', 3)];
    const message = createMockMessage(reactions);
    render(
      <CometChatReactionsRoot message={message}>
        <ContextConsumer />
      </CometChatReactionsRoot>
    );

    expect(() => {
      fireEvent.click(screen.getByText('Click Reaction'));
    }).not.toThrow();
  });

  // ─── onReactorClick callback ──────────────────────────────────────

  it('calls onReactorClick prop when a reactor is clicked via context', () => {
    const onReactorClick = vi.fn();
    const mockReaction = {
      getReaction: () => '👍',
      getReactedBy: () => ({ getUid: () => 'u1', getName: () => 'Alice' }),
    } as unknown as CometChat.Reaction;

    function ContextConsumer() {
      const ctx = useCometChatReactionsContext();
      return <button onClick={() => ctx.onReactorClick(mockReaction)}>Click Reactor</button>;
    }

    const reactions = [buildReactionCount('👍', 3)];
    const message = createMockMessage(reactions);
    render(
      <CometChatReactionsRoot message={message} onReactorClick={onReactorClick}>
        <ContextConsumer />
      </CometChatReactionsRoot>
    );

    fireEvent.click(screen.getByText('Click Reactor'));
    expect(onReactorClick).toHaveBeenCalledWith(mockReaction, message);
  });

  // ─── setActiveTab ─────────────────────────────────────────────────

  it('provides setActiveTab that updates the active tab', () => {
    function ContextConsumer() {
      const ctx = useCometChatReactionsContext();
      return (
        <div>
          <span data-testid="active-tab">{ctx.activeTab}</span>
          <button onClick={() => ctx.setActiveTab('👍')}>Set Tab</button>
        </div>
      );
    }

    const reactions = [buildReactionCount('👍', 3)];
    const message = createMockMessage(reactions);
    render(
      <CometChatReactionsRoot message={message}>
        <ContextConsumer />
      </CometChatReactionsRoot>
    );

    expect(screen.getByTestId('active-tab')).toHaveTextContent('all');
    fireEvent.click(screen.getByText('Set Tab'));
    expect(screen.getByTestId('active-tab')).toHaveTextContent('👍');
  });

  // ─── Context throws outside Root ──────────────────────────────────

  it('throws when context is used outside Root', () => {
    function ContextConsumer() {
      useCometChatReactionsContext();
      return null;
    }

    // Suppress console.error for expected error
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<ContextConsumer />)).toThrow(
      'useCometChatReactionsContext must be used within <CometChatReactions.Root>'
    );
    spy.mockRestore();
  });

  // ─── Default alignment ────────────────────────────────────────────

  it('defaults alignment to left when not specified', () => {
    function ContextConsumer() {
      const ctx = useCometChatReactionsContext();
      return <span data-testid="alignment">{ctx.alignment}</span>;
    }

    const reactions = [buildReactionCount('👍', 3)];
    const message = createMockMessage(reactions);
    render(
      <CometChatReactionsRoot message={message}>
        <ContextConsumer />
      </CometChatReactionsRoot>
    );

    expect(screen.getByTestId('alignment')).toHaveTextContent('left');
  });

  // ─── fetchReactors via context ──────────────────────────────────

  it('provides fetchReactors that can be called from children', async () => {
    let fetchFn: (() => Promise<void>) | undefined;

    function ContextConsumer() {
      const ctx = useCometChatReactionsContext();
      fetchFn = ctx.fetchReactors;
      return <span data-testid="fetch-state">{ctx.reactorsFetchState}</span>;
    }

    const reactions = [buildReactionCount('👍', 3)];
    const message = createMockMessage(reactions);
    render(
      <CometChatReactionsRoot message={message}>
        <ContextConsumer />
      </CometChatReactionsRoot>
    );

    expect(fetchFn).toBeDefined();
    // Calling fetchReactors should not throw
    await act(async () => {
      await fetchFn!();
    });
  });

  it('provides fetchNextReactors that can be called from children', async () => {
    let fetchNextFn: (() => Promise<void>) | undefined;

    function ContextConsumer() {
      const ctx = useCometChatReactionsContext();
      fetchNextFn = ctx.fetchNextReactors;
      return <span data-testid="has-more">{String(ctx.reactorsHasMore)}</span>;
    }

    const reactions = [buildReactionCount('👍', 3)];
    const message = createMockMessage(reactions);
    render(
      <CometChatReactionsRoot message={message}>
        <ContextConsumer />
      </CometChatReactionsRoot>
    );

    expect(fetchNextFn).toBeDefined();
    // Calling fetchNextReactors should not throw
    await act(async () => {
      await fetchNextFn!();
    });
  });

  // ─── onError callback ─────────────────────────────────────────────

  it('provides onError from props to context', () => {
    const onError = vi.fn();

    function ContextConsumer() {
      const ctx = useCometChatReactionsContext();
      return <span data-testid="has-error">{String(!!ctx.onError)}</span>;
    }

    const reactions = [buildReactionCount('👍', 3)];
    const message = createMockMessage(reactions);
    render(
      <CometChatReactionsRoot message={message} onError={onError}>
        <ContextConsumer />
      </CometChatReactionsRoot>
    );

    expect(screen.getByTestId('has-error')).toHaveTextContent('true');
  });

  // ─── reactionsRequestBuilder ──────────────────────────────────────

  it('provides reactionsRequestBuilder from props to context', () => {
    const mockBuilder = {
      setLimit: vi.fn().mockReturnThis(),
      setMessageId: vi.fn().mockReturnThis(),
      setReaction: vi.fn().mockReturnThis(),
      build: vi.fn().mockReturnValue({ fetchNext: vi.fn().mockResolvedValue([]) }),
    } as unknown as CometChat.ReactionsRequestBuilder;

    function ContextConsumer() {
      const ctx = useCometChatReactionsContext();
      return <span data-testid="has-builder">{String(!!ctx.reactionsRequestBuilder)}</span>;
    }

    const reactions = [buildReactionCount('👍', 3)];
    const message = createMockMessage(reactions);
    render(
      <CometChatReactionsRoot message={message} reactionsRequestBuilder={mockBuilder}>
        <ContextConsumer />
      </CometChatReactionsRoot>
    );

    expect(screen.getByTestId('has-builder')).toHaveTextContent('true');
  });

  // ─── Multiple reactions ───────────────────────────────────────────

  it('renders all reactions in the default Bar layout', () => {
    const reactions = [
      buildReactionCount('👍', 3),
      buildReactionCount('❤️', 2),
      buildReactionCount('😂', 1),
    ];
    const message = createMockMessage(reactions);
    render(<CometChatReactionsRoot message={message} />);

    // Each emoji appears in both the chip and the info tooltip, so use getAllByText
    expect(screen.getAllByText('👍').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('❤️').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('😂').length).toBeGreaterThanOrEqual(1);
    // Verify the reaction bar group is rendered
    expect(screen.getByRole('group')).toBeInTheDocument();
  });
});
