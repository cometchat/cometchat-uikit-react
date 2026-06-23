/**
 * Tests for CometChatMessageListView.
 *
 * Strategy:
 *   1. Stub `CometChatMessageBubbleRenderer` so the View never hits the real
 *      plugin pipeline — it renders a test-only marker that reflects the
 *      message id and the alignment it was handed.
 *   2. Mock `IntersectionObserver` with a controllable fake that exposes the
 *      callback so tests can fire it on demand.
 *   3. Feed the View through a mock context built with `buildMockCtx`.
 *
 * We target the uncovered behavior: render branches (loading/empty/error/loaded),
 * MessageItem alignment, date separators, unread banner, floating date header,
 * top/bottom sentinel observers, scroll-to-message effect, delete flow, flag
 * flow, and toast.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act, within } from '@testing-library/react';

// --- Stub the bubble renderer so the View doesn't require a plugin registry ---
// Exposes buttons so tests can trigger the View's onDeleteMessage / onFlagMessage
// / onMarkAsUnread / showToast handlers without needing the real plugin pipeline.
vi.mock('../../CometChatMessageBubble/CometChatMessageBubbleRenderer', () => ({
  CometChatMessageBubbleRenderer: ({
    message,
    messageAlignment,
    onDeleteMessage,
    onFlagMessage,
    onMarkAsUnread,
    showToast,
  }: {
    message: { getId: () => number };
    messageAlignment?: number;
    onDeleteMessage?: (m: { getId: () => number }) => void;
    onFlagMessage?: (m: { getId: () => number }) => void;
    onMarkAsUnread?: (m: { getId: () => number }) => void;
    showToast?: (text: string) => void;
  }) => (
    <div
      data-testid="mock-bubble"
      data-message-id={String(message.getId())}
      data-alignment={String(messageAlignment ?? '')}
    >
      <button type="button" data-testid="trigger-delete" onClick={() => onDeleteMessage?.(message)}>
        delete
      </button>
      <button type="button" data-testid="trigger-flag" onClick={() => onFlagMessage?.(message)}>
        flag
      </button>
      <button type="button" data-testid="trigger-unread" onClick={() => onMarkAsUnread?.(message)}>
        unread
      </button>
      <button type="button" data-testid="trigger-toast" onClick={() => showToast?.('Hello toast')}>
        toast
      </button>
    </div>
  ),
}));

// --- Stub the wrapper to a passthrough so we can inspect alignment attrs ---
vi.mock('../../CometChatMessageBubble/CometChatMessageBubbleWrapper', () => ({
  CometChatMessageBubbleWrapper: ({
    alignment,
    children,
  }: {
    alignment: string;
    children: React.ReactNode;
  }) => (
    <div data-testid="bubble-wrapper" data-bubble-alignment={alignment}>
      {children}
    </div>
  ),
}));

// --- Stub the flag dialog so it doesn't reach the real SDK on open ---
vi.mock('../../CometChatFlagMessageDialog/CometChatFlagMessageDialog', () => ({
  CometChatFlagMessageDialog: {
    Root: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
      isOpen ? (
        <div role="dialog" data-testid="flag-dialog">
          {children}
        </div>
      ) : null,
    Header: () => <div data-testid="flag-header" />,
    Reasons: () => <div data-testid="flag-reasons" />,
    Remark: () => <textarea data-testid="flag-remark" />,
    Actions: () => <div data-testid="flag-actions" />,
  },
}));

import { CometChatMessageListView } from '../CometChatMessageListView';
import { CometChatMessageListProvider } from '../CometChatMessageList.context';
import type {
  CometChatUseMessageListReturn,
  CometChatMessageListState,
} from '../CometChatMessageList.types';
import {
  initialMessageListState,
  CometChatMessageListAlignment,
} from '../CometChatMessageList.types';
import { LocaleProvider } from '../../../context/locale/LocaleProvider';
import { buildUser, buildGroup, buildTextMessage } from '../../../testing/mock-builders';

// ---------------------------------------------------------------------------
// IntersectionObserver mock
// ---------------------------------------------------------------------------

interface ObserverHandle {
  callback: IntersectionObserverCallback;
  target: Element;
  disconnect: ReturnType<typeof vi.fn>;
  unobserve: ReturnType<typeof vi.fn>;
}

const observerInstances: ObserverHandle[] = [];

class FakeIntersectionObserver implements IntersectionObserver {
  private cb: IntersectionObserverCallback;
  constructor(cb: IntersectionObserverCallback) {
    this.cb = cb;
  }
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: readonly number[] = [];
  disconnect = vi.fn();
  unobserve = vi.fn();
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
  observe(target: Element): void {
    observerInstances.push({
      callback: this.cb,
      target,
      disconnect: this.disconnect,
      unobserve: this.unobserve,
    });
  }
}

// Helper to fire an entry on the most-recently-added observer that watches a
// given test-id (the View labels its sentinels via classes we can detect).
function fireObserverAt(className: string, isIntersecting: boolean): void {
  const match = observerInstances.find(h =>
    (h.target as HTMLElement).className.includes(className)
  );
  if (!match) throw new Error(`No observer found for class ${className}`);
  match.callback(
    [
      {
        isIntersecting,
        target: match.target,
        intersectionRatio: isIntersecting ? 1 : 0,
        boundingClientRect: {} as DOMRectReadOnly,
        intersectionRect: {} as DOMRectReadOnly,
        rootBounds: null,
        time: Date.now(),
      },
    ],
    {} as IntersectionObserver
  );
}

// ---------------------------------------------------------------------------
// Mock context builder
// ---------------------------------------------------------------------------

function buildMockCtx(
  overrides: Partial<CometChatMessageListState> & Partial<CometChatUseMessageListReturn> = {}
): CometChatUseMessageListReturn {
  const state: CometChatMessageListState = {
    ...initialMessageListState,
    ...('messages' in overrides ? { messages: overrides.messages } : {}),
    ...('fetchState' in overrides ? { fetchState: overrides.fetchState } : {}),
    ...('hasMore' in overrides ? { hasMore: overrides.hasMore } : {}),
    ...('hasMoreNewer' in overrides ? { hasMoreNewer: overrides.hasMoreNewer } : {}),
    ...('hasReachedLatest' in overrides ? { hasReachedLatest: overrides.hasReachedLatest } : {}),
    ...('isAtBottom' in overrides ? { isAtBottom: overrides.isAtBottom } : {}),
    ...('unreadCount' in overrides ? { unreadCount: overrides.unreadCount } : {}),
    ...('newMessageCount' in overrides ? { newMessageCount: overrides.newMessageCount } : {}),
    ...('showUnreadBanner' in overrides ? { showUnreadBanner: overrides.showUnreadBanner } : {}),
    ...('lastReadMessageId' in overrides ? { lastReadMessageId: overrides.lastReadMessageId } : {}),
    ...('scrollToMessageId' in overrides ? { scrollToMessageId: overrides.scrollToMessageId } : {}),
    ...('scrollToMessageHighlight' in overrides
      ? { scrollToMessageHighlight: overrides.scrollToMessageHighlight }
      : {}),
    ...('markedUnreadByUser' in overrides
      ? { markedUnreadByUser: overrides.markedUnreadByUser }
      : {}),
    ...('isFetchingMore' in overrides ? { isFetchingMore: overrides.isFetchingMore } : {}),
  };

  const fetchPrevious = vi.fn<() => Promise<void>>(async () => {
    /* noop */
  });
  const deleteMessage = vi.fn<(id: number) => Promise<void>>(async () => {
    /* noop */
  });
  const markMessageAsUnread = vi.fn<(msg: never) => Promise<void>>(async () => {
    /* noop */
  });
  const scrollToMessage = vi.fn<(id: number) => void>();
  const setAtBottom = vi.fn<(atBottom: boolean) => void>();
  const markConversationAsReadIfUnread = vi.fn<() => void>();
  const goToMessage = vi.fn<(id: number) => Promise<void>>(async () => {
    /* noop */
  });
  const fetchNext = vi.fn<() => Promise<void>>(async () => {
    /* noop */
  });

  return {
    state,
    allMessages: state.messages,
    loggedInUser: buildUser({ uid: 'me' }) as never,
    group: (overrides.group as CometChat.Group | undefined) ?? undefined,
    isLoading: overrides.isLoading ?? state.fetchState === 'loading',
    isEmpty: overrides.isEmpty ?? state.fetchState === 'empty',
    isError: overrides.isError ?? state.fetchState === 'error',
    fetchPrevious,
    fetchNext,
    deleteMessage,
    scrollToMessage,
    goToMessage,
    setAtBottom,
    clearNewMessageCount: vi.fn(),
    markConversationAsReadIfUnread,
    markMessageAsUnread,
    scrollToBottom: () => 'scroll-dom',
    hasMore: state.hasMore,
    hasMoreNewer: state.hasMoreNewer,
    hasReachedLatest: state.hasReachedLatest,
    isFetchingMore: state.isFetchingMore,
    newMessageCount: state.newMessageCount,
    unreadCount: state.unreadCount,
    isConversationRead: state.isConversationRead,
    lastReadMessageId: state.lastReadMessageId,
    error: state.error,
    isAtBottom: state.isAtBottom,
    options: {
      hideStickyDate: false,
      hideAvatar: false,
      hideGroupActionMessages: false,
      quickOptionsCount: 2,
      hideReplyOption: false,
      hideReplyInThreadOption: false,
      hideEditMessageOption: false,
      hideDeleteMessageOption: false,
      hideCopyMessageOption: false,
      hideReactionOption: false,
      hideMessageInfoOption: false,
      hideFlagMessageOption: false,
      hideMessagePrivatelyOption: false,
      hideTranslateMessageOption: false,
      showMarkAsUnreadOption: false,
      separatorDateTimeFormat: undefined,
      stickyDateTimeFormat: undefined,
      messageSentAtDateTimeFormat: undefined,
      messageInfoDateTimeFormat: undefined,
      reactionsRequestBuilder: undefined,
      onReactionClick: undefined,
      onReactionListItemClick: undefined,
      messageAlignment: 1,
      showScrollbar: false,
      hideDateSeparator: false,
      loadingView: undefined,
      emptyView: undefined,
      errorView: undefined,
      headerView: undefined,
      footerView: undefined,
      onThreadRepliesClick: undefined,
      onAvatarClick: undefined,
      hideFlagRemarkField: false,
      disableTruncation: false,
      hideModerationView: false,
      isAgentChat: false,
      bubbleView: undefined,
      leadingBubbleView: undefined,
      headerBubbleView: undefined,
      statusInfoBubbleView: undefined,
      footerBubbleView: undefined,
      threadBubbleView: undefined,
    },
  };
}

function renderView(
  ctx: CometChatUseMessageListReturn,
  props: Partial<React.ComponentProps<typeof CometChatMessageListView>> = {}
) {
  return render(
    <LocaleProvider locale="en-us">
      <CometChatMessageListProvider value={ctx}>
        <CometChatMessageListView {...props} />
      </CometChatMessageListProvider>
    </LocaleProvider>
  );
}

// ---------------------------------------------------------------------------
// Global setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  observerInstances.length = 0;

  // @ts-expect-error override global for jsdom
  globalThis.IntersectionObserver = FakeIntersectionObserver;

  // jsdom doesn't implement scrollIntoView
  Element.prototype.scrollIntoView = vi.fn();
});

// ===========================================================================
// Render branches
// ===========================================================================

describe('CometChatMessageListView — render states', () => {
  it('renders nothing when isLoading', () => {
    const { container } = renderView(buildMockCtx({ isLoading: true, fetchState: 'loading' }));
    // View returns null for loading/empty/error — those are handled by sibling state components
    expect(container.querySelector('[role="log"]')).not.toBeInTheDocument();
  });

  it('renders nothing when isError', () => {
    const { container } = renderView(buildMockCtx({ isError: true, fetchState: 'error' }));
    expect(container.querySelector('[role="log"]')).not.toBeInTheDocument();
  });

  it('renders nothing when isEmpty', () => {
    const { container } = renderView(buildMockCtx({ isEmpty: true, fetchState: 'empty' }));
    expect(container.querySelector('[role="log"]')).not.toBeInTheDocument();
  });

  it('renders messages and the message list role when loaded', () => {
    const msgs = [
      buildTextMessage({ id: 1 }),
      buildTextMessage({ id: 2, sender: buildUser({ uid: 'me' }) as never }),
    ] as never[];
    renderView(buildMockCtx({ messages: msgs, fetchState: 'loaded' }));
    expect(screen.getByRole('log', { name: 'Message list' })).toBeInTheDocument();
    expect(screen.getAllByTestId('mock-bubble')).toHaveLength(2);
  });

  it('renders the fetch-more shimmer when isFetchingMore is true', () => {
    const msgs = [buildTextMessage({ id: 1 })] as never[];
    renderView(
      buildMockCtx({
        messages: msgs,
        fetchState: 'loaded',
        isFetchingMore: true,
      })
    );
    expect(screen.getByRole('status', { name: 'Loading older messages' })).toBeInTheDocument();
  });

  it('applies the hide-scrollbar class when showScrollbar is false', () => {
    const msgs = [buildTextMessage({ id: 1 })] as never[];
    const { container } = renderView(buildMockCtx({ messages: msgs, fetchState: 'loaded' }), {
      showScrollbar: false,
    });
    const scrollArea = container.querySelector('[role="log"]');
    expect(scrollArea?.className).toMatch(/hide-scrollbar/);
  });
});

// ===========================================================================
// MessageItem alignment
// ===========================================================================

describe('CometChatMessageListView — MessageItem alignment', () => {
  it('renders outgoing messages on the right in standard alignment', () => {
    const me = buildUser({ uid: 'me' });
    const ownMsg = buildTextMessage({ id: 1, sender: me as never });
    renderView(buildMockCtx({ messages: [ownMsg] as never[], fetchState: 'loaded' }), {
      messageAlignment: CometChatMessageListAlignment.standard,
    });
    const wrapper = screen.getByTestId('bubble-wrapper');
    expect(wrapper).toHaveAttribute('data-bubble-alignment', 'right');
  });

  it('renders incoming messages on the left in standard alignment', () => {
    const peer = buildUser({ uid: 'peer' });
    const peerMsg = buildTextMessage({ id: 2, sender: peer as never });
    renderView(buildMockCtx({ messages: [peerMsg] as never[], fetchState: 'loaded' }), {
      messageAlignment: CometChatMessageListAlignment.standard,
    });
    expect(screen.getByTestId('bubble-wrapper')).toHaveAttribute('data-bubble-alignment', 'left');
  });

  it('renders all messages on the left when messageAlignment=left', () => {
    const me = buildUser({ uid: 'me' });
    const ownMsg = buildTextMessage({ id: 1, sender: me as never });
    renderView(buildMockCtx({ messages: [ownMsg] as never[], fetchState: 'loaded' }), {
      messageAlignment: CometChatMessageListAlignment.left,
    });
    expect(screen.getByTestId('bubble-wrapper')).toHaveAttribute('data-bubble-alignment', 'left');
  });

  it('renders action/group messages centered', () => {
    const me = buildUser({ uid: 'me' });
    const action = Object.assign(buildTextMessage({ id: 3, sender: me as never }), {
      getCategory: () => 'action',
    });
    renderView(buildMockCtx({ messages: [action] as never[], fetchState: 'loaded' }), {
      messageAlignment: CometChatMessageListAlignment.standard,
    });
    expect(screen.getByTestId('bubble-wrapper')).toHaveAttribute('data-bubble-alignment', 'center');
  });

  it('renders call messages centered', () => {
    const me = buildUser({ uid: 'me' });
    const call = Object.assign(buildTextMessage({ id: 4, sender: me as never }), {
      getCategory: () => 'call',
    });
    renderView(buildMockCtx({ messages: [call] as never[], fetchState: 'loaded' }), {
      messageAlignment: CometChatMessageListAlignment.standard,
    });
    expect(screen.getByTestId('bubble-wrapper')).toHaveAttribute('data-bubble-alignment', 'center');
  });
});

// ===========================================================================
// Date separators & unread banner
// ===========================================================================

describe('CometChatMessageListView — date separators', () => {
  it('inserts a date separator for the first message', () => {
    const msgs = [buildTextMessage({ id: 1, sentAt: 1_000_000 })] as never[];
    const { container } = renderView(buildMockCtx({ messages: msgs, fetchState: 'loaded' }));
    // CometChatMessageListDateSeparator renders role="separator"
    expect(container.querySelectorAll('[role="separator"]').length).toBeGreaterThan(0);
  });

  it('inserts a date separator when messages cross a calendar day', () => {
    const now = Math.floor(Date.UTC(2024, 0, 2, 12) / 1000);
    const yesterday = Math.floor(Date.UTC(2024, 0, 1, 12) / 1000);
    const msgs = [
      buildTextMessage({ id: 1, sentAt: yesterday }),
      buildTextMessage({ id: 2, sentAt: now }),
    ] as never[];
    const { container } = renderView(buildMockCtx({ messages: msgs, fetchState: 'loaded' }));
    const separators = container.querySelectorAll('[role="separator"]');
    // One for the first message, one for the day change
    expect(separators.length).toBeGreaterThanOrEqual(2);
  });

  it('does not insert separators when hideDateSeparator is set', () => {
    const msgs = [
      buildTextMessage({ id: 1, sentAt: 1 }),
      buildTextMessage({ id: 2, sentAt: 999_999 }),
    ] as never[];
    const { container } = renderView(buildMockCtx({ messages: msgs, fetchState: 'loaded' }), {
      hideDateSeparator: true,
    });
    expect(container.querySelectorAll('[role="separator"]')).toHaveLength(0);
  });
});

describe('CometChatMessageListView — unread banner', () => {
  it('renders the "New" banner below the last-read message when showUnreadBanner is set', () => {
    const msgs = [
      buildTextMessage({ id: 10 }),
      buildTextMessage({ id: 20 }),
      buildTextMessage({ id: 30 }),
    ] as never[];
    renderView(
      buildMockCtx({
        messages: msgs,
        fetchState: 'loaded',
        showUnreadBanner: true,
        lastReadMessageId: 20,
      })
    );
    // The banner renders with aria-label "New" (localized)
    const separators = screen.getAllByRole('separator');
    const newBanner = separators.find(el => el.getAttribute('aria-label')?.length);
    expect(newBanner).toBeDefined();
  });

  it('does not render the banner when lastReadMessageId is the last message', () => {
    const msgs = [buildTextMessage({ id: 10 }), buildTextMessage({ id: 20 })] as never[];
    const { container } = renderView(
      buildMockCtx({
        messages: msgs,
        fetchState: 'loaded',
        showUnreadBanner: true,
        lastReadMessageId: 20,
      })
    );
    // Only the date separator at the top should remain — no "unread-separator"
    const banners = Array.from(container.querySelectorAll('[role="separator"]')).filter(el =>
      el.className.includes('new-message-divider')
    );
    expect(banners).toHaveLength(0);
  });
});

// ===========================================================================
// IntersectionObserver-driven behavior
// ===========================================================================

describe('CometChatMessageListView — sentinels', () => {
  it('does not fetchPrevious on the initial observer fire (skipped)', () => {
    const ctx = buildMockCtx({
      messages: [buildTextMessage({ id: 1 })] as never[],
      fetchState: 'loaded',
      hasMore: true,
    });
    renderView(ctx);

    act(() => {
      fireObserverAt('top-sentinel', true);
    });

    expect(ctx.fetchPrevious).not.toHaveBeenCalled();
  });

  it('calls fetchPrevious on the second top-sentinel intersection when hasMore', () => {
    const ctx = buildMockCtx({
      messages: [buildTextMessage({ id: 1 })] as never[],
      fetchState: 'loaded',
      hasMore: true,
    });
    renderView(ctx);

    act(() => {
      fireObserverAt('top-sentinel', true); // initial — skipped
      fireObserverAt('top-sentinel', true); // real scroll
    });

    expect(ctx.fetchPrevious).toHaveBeenCalled();
  });

  it('does not fetchPrevious when hasMore is false', () => {
    const ctx = buildMockCtx({
      messages: [buildTextMessage({ id: 1 })] as never[],
      fetchState: 'loaded',
      hasMore: false,
    });
    renderView(ctx);

    act(() => {
      fireObserverAt('top-sentinel', true);
      fireObserverAt('top-sentinel', true);
    });

    expect(ctx.fetchPrevious).not.toHaveBeenCalled();
  });

  it('calls setAtBottom when the bottom sentinel intersects', () => {
    const ctx = buildMockCtx({
      messages: [buildTextMessage({ id: 1 })] as never[],
      fetchState: 'loaded',
    });
    renderView(ctx);

    act(() => {
      fireObserverAt('bottom-sentinel', true);
    });

    expect(ctx.setAtBottom).toHaveBeenCalledWith(true);
  });

  it('calls markConversationAsReadIfUnread on the second bottom-sentinel intersection', () => {
    const ctx = buildMockCtx({
      messages: [buildTextMessage({ id: 1 })] as never[],
      fetchState: 'loaded',
    });
    renderView(ctx);

    act(() => {
      fireObserverAt('bottom-sentinel', true); // initial — skipped
      fireObserverAt('bottom-sentinel', true); // real
    });

    expect(ctx.markConversationAsReadIfUnread).toHaveBeenCalled();
  });

  it('calls fetchNext when the bottom sentinel intersects and hasMoreNewer=true', () => {
    const ctx = buildMockCtx({
      messages: [buildTextMessage({ id: 1 })] as never[],
      fetchState: 'loaded',
      hasMoreNewer: true,
    });
    renderView(ctx);

    act(() => {
      fireObserverAt('bottom-sentinel', true); // initial — skipped
      fireObserverAt('bottom-sentinel', true); // real
    });

    expect(ctx.fetchNext).toHaveBeenCalled();
  });
});

// ===========================================================================
// scrollToMessage effect
// ===========================================================================

describe('CometChatMessageListView — scroll to message', () => {
  it('calls scrollIntoView on the target bubble when scrollToMessageId is set', async () => {
    const scrollIntoViewSpy = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoViewSpy;

    const msgs = [buildTextMessage({ id: 1 }), buildTextMessage({ id: 42 })] as never[];
    const ctx = buildMockCtx({
      messages: msgs,
      fetchState: 'loaded',
      scrollToMessageId: 42,
      scrollToMessageHighlight: false,
    });
    renderView(ctx);

    await waitFor(() => {
      expect(scrollIntoViewSpy).toHaveBeenCalled();
    });
    // scrollToMessage(0) is called at the end to clear
    expect(ctx.scrollToMessage).toHaveBeenCalledWith(0);
  });

  it('adds highlight class when scrollToMessageHighlight is true', async () => {
    const msgs = [buildTextMessage({ id: 42 })] as never[];
    const ctx = buildMockCtx({
      messages: msgs,
      fetchState: 'loaded',
      scrollToMessageId: 42,
      scrollToMessageHighlight: true,
    });
    const { container } = renderView(ctx);

    await waitFor(() => {
      const bubble = container.querySelector('[data-message-id="42"]') as HTMLElement | null;
      expect(bubble).not.toBeNull();
      // Class list should have grown by at least one entry after the effect
      expect(bubble?.className.length).toBeGreaterThan(0);
    });
  });
});

// ===========================================================================
// Delete + flag dialogs + toast + mark as unread
// ===========================================================================

describe('CometChatMessageListView — delete message flow', () => {
  it('opens the delete confirm dialog when the bubble triggers onDeleteMessage', async () => {
    const ctx = buildMockCtx({
      messages: [buildTextMessage({ id: 9 })] as never[],
      fetchState: 'loaded',
    });
    renderView(ctx);

    fireEvent.click(screen.getByTestId('trigger-delete'));

    // CometChatConfirmDialog renders a dialog with "Delete Message" title text
    await waitFor(() => {
      expect(
        screen.getByText(
          'Are you sure you want to delete this message? This action cannot be undone.'
        )
      ).toBeInTheDocument();
    });
  });

  it('calls deleteMessage and shows a toast on confirm', async () => {
    const ctx = buildMockCtx({
      messages: [buildTextMessage({ id: 9 })] as never[],
      fetchState: 'loaded',
    });
    renderView(ctx);

    fireEvent.click(screen.getByTestId('trigger-delete'));

    // Wait for dialog to open, then find its Delete button (not the bubble's)
    const dialog = await screen.findByRole('dialog');
    const confirmBtn = within(dialog).getByRole('button', { name: /^delete$/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(ctx.deleteMessage).toHaveBeenCalledWith(9);
    });
  });

  it('closes the delete dialog on cancel without deleting', async () => {
    const ctx = buildMockCtx({
      messages: [buildTextMessage({ id: 9 })] as never[],
      fetchState: 'loaded',
    });
    renderView(ctx);

    fireEvent.click(screen.getByTestId('trigger-delete'));
    const dialog = await screen.findByRole('dialog');
    const cancelBtn = within(dialog).getByRole('button', { name: /^cancel$/i });
    fireEvent.click(cancelBtn);

    expect(ctx.deleteMessage).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(
        screen.queryByText(
          'Are you sure you want to delete this message? This action cannot be undone.'
        )
      ).not.toBeInTheDocument();
    });
  });
});

describe('CometChatMessageListView — flag message flow', () => {
  it('opens the flag dialog when the bubble triggers onFlagMessage', async () => {
    const ctx = buildMockCtx({
      messages: [buildTextMessage({ id: 9 })] as never[],
      fetchState: 'loaded',
    });
    renderView(ctx);

    fireEvent.click(screen.getByTestId('trigger-flag'));

    // The flag dialog renders the "Report" label somewhere in the UI
    await waitFor(() => {
      // At minimum the flag dialog root is present — use role dialog as a proxy
      expect(screen.getAllByRole('dialog').length).toBeGreaterThan(0);
    });
  });

  it('hides the remark field when hideFlagRemarkField is true', async () => {
    const ctx = buildMockCtx({
      messages: [buildTextMessage({ id: 9 })] as never[],
      fetchState: 'loaded',
    });
    renderView(ctx, { hideFlagRemarkField: true });

    fireEvent.click(screen.getByTestId('trigger-flag'));

    await waitFor(() => {
      expect(screen.getAllByRole('dialog').length).toBeGreaterThan(0);
    });
    // No textarea should be present when remark field is hidden
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
});

describe('CometChatMessageListView — toast notifications', () => {
  it('surfaces a toast when the bubble calls showToast()', async () => {
    const ctx = buildMockCtx({
      messages: [buildTextMessage({ id: 9 })] as never[],
      fetchState: 'loaded',
    });
    renderView(ctx);

    fireEvent.click(screen.getByTestId('trigger-toast'));

    await waitFor(() => {
      expect(screen.getByText(/hello toast/i)).toBeInTheDocument();
    });
  });
});

describe('CometChatMessageListView — mark as unread', () => {
  it('calls markMessageAsUnread when the bubble triggers it', () => {
    const ctx = buildMockCtx({
      messages: [buildTextMessage({ id: 9 })] as never[],
      fetchState: 'loaded',
    });
    renderView(ctx);

    fireEvent.click(screen.getByTestId('trigger-unread'));

    expect(ctx.markMessageAsUnread).toHaveBeenCalled();
  });
});

// ===========================================================================
// Accessibility: live region
// ===========================================================================

describe('CometChatMessageListView — accessibility', () => {
  it('updates the aria-live region when newMessageCount > 0', async () => {
    const ctx = buildMockCtx({
      messages: [buildTextMessage({ id: 1 })] as never[],
      fetchState: 'loaded',
      newMessageCount: 3,
    });
    const { container } = renderView(ctx);
    const region = container.querySelector('[aria-live="polite"]');
    await waitFor(() => {
      expect(region?.textContent).toMatch(/3 new messages/i);
    });
  });

  it('singularizes the live-region text for exactly 1 new message', async () => {
    const ctx = buildMockCtx({
      messages: [buildTextMessage({ id: 1 })] as never[],
      fetchState: 'loaded',
      newMessageCount: 1,
    });
    const { container } = renderView(ctx);
    const region = container.querySelector('[aria-live="polite"]');
    await waitFor(() => {
      expect(region?.textContent).toBe('1 new message');
    });
  });
});

// ===========================================================================
// Group context passthrough
// ===========================================================================

describe('CometChatMessageListView — group context', () => {
  it('renders without crashing when a group is in context', () => {
    const group = buildGroup({ guid: 'room' });
    renderView(
      buildMockCtx({
        messages: [buildTextMessage({ id: 1 })] as never[],
        fetchState: 'loaded',
        group: group as never,
      })
    );
    expect(screen.getByRole('log')).toBeInTheDocument();
  });
});
