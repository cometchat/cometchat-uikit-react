/**
 * Tests for the props added to CometChatMessageList:
 * - hideGroupActionMessages
 * - hideStickyDate
 * - hideAvatar (threaded through to BubbleRenderer)
 * - quickOptionsCount (threaded through to BubbleRenderer)
 * - hide*Option / showMarkAsUnreadOption (option-menu toggles)
 * - separatorDateTimeFormat / stickyDateTimeFormat / messageSentAtDateTimeFormat
 *
 * These tests render the View with a mock context that has the options bag
 * configured, then assert the expected DOM output.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CometChatMessageListView } from '../CometChatMessageListView';
import { CometChatMessageListProvider } from '../CometChatMessageList.context';
import type {
  CometChatUseMessageListReturn,
  CometChatMessageListState,
  CometChatMessageListOptions,
} from '../CometChatMessageList.types';
import { initialMessageListState } from '../CometChatMessageList.types';

// --- Mocks ---

// Mock IntersectionObserver (not available in jsdom)
const mockObserve = vi.fn();
const mockUnobserve = vi.fn();
const mockDisconnect = vi.fn();
vi.stubGlobal(
  'IntersectionObserver',
  vi.fn(() => ({
    observe: mockObserve,
    unobserve: mockUnobserve,
    disconnect: mockDisconnect,
  }))
);

// Mock the SDK's MessageCategory enum used in the View
vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
    MessageCategory: { ACTION: 'action' },
    CATEGORY_ACTION: 'action',
  },
  MessageCategory: { ACTION: 'action' },
}));

vi.mock('../../CometChatMessageBubble/CometChatMessageBubbleRenderer', () => ({
  CometChatMessageBubbleRenderer: (props: Record<string, any>) => (
    <div
      data-testid="mock-bubble"
      data-hide-avatar={String(props.hideAvatar ?? '')}
      data-quick-options-count={String(props.quickOptionsCount ?? '')}
      data-hide-reply-option={String(props.hideReplyOption ?? '')}
      data-hide-edit-option={String(props.hideEditMessageOption ?? '')}
      data-show-mark-unread={String(props.showMarkAsUnreadOption ?? '')}
      data-sent-at-format={props.messageSentAtDateTimeFormat ? 'custom' : 'default'}
    />
  ),
}));

vi.mock('../../CometChatMessageBubble/CometChatMessageBubbleWrapper', () => ({
  CometChatMessageBubbleWrapper: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock('../CometChatMessageListScrollToBottom', () => ({
  CometChatMessageListScrollToBottom: () => <div data-testid="scroll-to-bottom" />,
}));

// --- Helpers ---

function buildUser(overrides: { uid?: string; name?: string } = {}) {
  return {
    getUid: () => overrides.uid ?? 'me',
    getName: () => overrides.name ?? 'Me',
  };
}

function buildMessage(overrides: { id?: number; sentAt?: number; category?: string } = {}) {
  return {
    getId: () => overrides.id ?? 1,
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    getMuid: () => `muid-${overrides.id ?? 1}`,
    getSentAt: () => overrides.sentAt ?? 1_700_000_000,
    getCategory: () => overrides.category ?? 'message',
    getType: () => 'text',
    getSender: () => buildUser({ uid: 'peer' }),
    getDeletedAt: () => null,
    getEditedAt: () => null,
    getReplyCount: () => 0,
    getParentMessageId: () => 0,
    getDeliveredAt: () => 0,
    getReadAt: () => 0,
    getMetadata: () => null,
    getReactions: () => [],
  };
}

function buildActionMessage(id: number) {
  return buildMessage({ id, category: 'action' });
}

const DEFAULT_OPTIONS: CometChatMessageListOptions = {
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
};

function buildCtx(
  messages: unknown[],
  optionOverrides: Partial<CometChatMessageListOptions> = {}
): CometChatUseMessageListReturn {
  const state: CometChatMessageListState = {
    ...initialMessageListState,
    messages: messages as never[],
    fetchState: 'loaded',
  };
  const noop = () => {};
  const noopAsync = async () => {};
  return {
    state,
    allMessages: state.messages,
    loggedInUser: buildUser() as never,
    group: undefined,
    isLoading: false,
    isEmpty: false,
    isError: false,
    fetchPrevious: noopAsync,
    fetchNext: noopAsync,
    deleteMessage: noopAsync,
    scrollToMessage: noop,
    goToMessage: noopAsync,
    setAtBottom: noop,
    clearNewMessageCount: vi.fn(),
    markConversationAsReadIfUnread: noop,
    markMessageAsUnread: noopAsync,
    reactToMessage: noopAsync,
    scrollToBottom: () => 'scroll-dom',
    hasMore: false,
    hasMoreNewer: false,
    hasReachedLatest: true,
    isFetchingMore: false,
    newMessageCount: 0,
    unreadCount: 0,
    isConversationRead: false,
    lastReadMessageId: null,
    error: null,
    isAtBottom: true,
    options: { ...DEFAULT_OPTIONS, ...optionOverrides },
  };
}

function renderView(
  ctx: CometChatUseMessageListReturn,
  props: Partial<React.ComponentProps<typeof CometChatMessageListView>> = {}
) {
  return render(
    <CometChatMessageListProvider value={ctx}>
      <CometChatMessageListView {...props} />
    </CometChatMessageListProvider>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CometChatMessageList — option visibility props', () => {
  describe('hideGroupActionMessages', () => {
    it('renders action messages by default', () => {
      const msgs = [buildMessage({ id: 1 }), buildActionMessage(2)];
      renderView(buildCtx(msgs));
      expect(screen.getAllByTestId('mock-bubble')).toHaveLength(2);
    });

    it('filters out action-category messages when hideGroupActionMessages is true', () => {
      const msgs = [buildMessage({ id: 1 }), buildActionMessage(2)];
      renderView(buildCtx(msgs, { hideGroupActionMessages: true }));
      expect(screen.getAllByTestId('mock-bubble')).toHaveLength(1);
    });
  });

  describe('hideStickyDate', () => {
    it('renders the floating date chip by default', () => {
      const msgs = [buildMessage({ id: 1 })];
      const { container } = renderView(buildCtx(msgs));
      // The floating date has aria-hidden="true"
      const floating = container.querySelector('[aria-hidden="true"]');
      expect(floating).not.toBeNull();
    });

    it('hides the floating date chip when hideStickyDate is true', () => {
      const msgs = [buildMessage({ id: 1 })];
      const { container } = renderView(buildCtx(msgs, { hideStickyDate: true }));
      // No floating date element
      const floating = container.querySelector('[class*="floating-date"]');
      expect(floating).toBeNull();
    });
  });

  describe('hideAvatar', () => {
    it('passes hideAvatar=false to BubbleRenderer by default', () => {
      const msgs = [buildMessage({ id: 1 })];
      renderView(buildCtx(msgs));
      const bubble = screen.getByTestId('mock-bubble');
      expect(bubble.getAttribute('data-hide-avatar')).toBe('false');
    });

    it('passes hideAvatar=true to BubbleRenderer when set', () => {
      const msgs = [buildMessage({ id: 1 })];
      renderView(buildCtx(msgs, { hideAvatar: true }));
      const bubble = screen.getByTestId('mock-bubble');
      expect(bubble.getAttribute('data-hide-avatar')).toBe('true');
    });
  });

  describe('quickOptionsCount', () => {
    it('passes quickOptionsCount=2 by default', () => {
      const msgs = [buildMessage({ id: 1 })];
      renderView(buildCtx(msgs));
      const bubble = screen.getByTestId('mock-bubble');
      expect(bubble.getAttribute('data-quick-options-count')).toBe('2');
    });

    it('passes custom quickOptionsCount to BubbleRenderer', () => {
      const msgs = [buildMessage({ id: 1 })];
      renderView(buildCtx(msgs, { quickOptionsCount: 5 }));
      const bubble = screen.getByTestId('mock-bubble');
      expect(bubble.getAttribute('data-quick-options-count')).toBe('5');
    });
  });

  describe('option-menu toggles', () => {
    it('passes hideReplyOption=false by default', () => {
      const msgs = [buildMessage({ id: 1 })];
      renderView(buildCtx(msgs));
      const bubble = screen.getByTestId('mock-bubble');
      expect(bubble.getAttribute('data-hide-reply-option')).toBe('false');
    });

    it('passes hideReplyOption=true when set', () => {
      const msgs = [buildMessage({ id: 1 })];
      renderView(buildCtx(msgs, { hideReplyOption: true }));
      const bubble = screen.getByTestId('mock-bubble');
      expect(bubble.getAttribute('data-hide-reply-option')).toBe('true');
    });

    it('passes hideEditMessageOption=true when set', () => {
      const msgs = [buildMessage({ id: 1 })];
      renderView(buildCtx(msgs, { hideEditMessageOption: true }));
      const bubble = screen.getByTestId('mock-bubble');
      expect(bubble.getAttribute('data-hide-edit-option')).toBe('true');
    });

    it('passes showMarkAsUnreadOption=true when set', () => {
      const msgs = [buildMessage({ id: 1 })];
      renderView(buildCtx(msgs, { showMarkAsUnreadOption: true }));
      const bubble = screen.getByTestId('mock-bubble');
      expect(bubble.getAttribute('data-show-mark-unread')).toBe('true');
    });
  });

  describe('date format props', () => {
    it('passes default (no custom format) to BubbleRenderer by default', () => {
      const msgs = [buildMessage({ id: 1 })];
      renderView(buildCtx(msgs));
      const bubble = screen.getByTestId('mock-bubble');
      expect(bubble.getAttribute('data-sent-at-format')).toBe('default');
    });

    it('passes custom messageSentAtDateTimeFormat to BubbleRenderer', () => {
      const msgs = [buildMessage({ id: 1 })];
      renderView(
        buildCtx(msgs, {
          messageSentAtDateTimeFormat: {
            today: 'HH:mm',
            yesterday: 'HH:mm',
            lastWeek: 'HH:mm',
            otherDays: 'HH:mm',
          },
        })
      );
      const bubble = screen.getByTestId('mock-bubble');
      expect(bubble.getAttribute('data-sent-at-format')).toBe('custom');
    });

    it('passes custom separatorDateTimeFormat to DateSeparator', () => {
      const msgs = [buildMessage({ id: 1 })];
      const { container } = renderView(
        buildCtx(msgs, {
          separatorDateTimeFormat: {
            today: 'Heute',
            yesterday: 'Gestern',
            lastWeek: 'dddd',
            otherDays: 'DD.MM.YYYY',
          },
        })
      );
      // DateSeparator renders role="separator"
      const separator = container.querySelector('[role="separator"]');
      expect(separator).not.toBeNull();
    });
  });
});
