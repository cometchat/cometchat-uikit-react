import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CometChatMessageListScrollToBottom } from '../CometChatMessageListScrollToBottom';
import { CometChatMessageListProvider } from '../CometChatMessageList.context';
import type { CometChatUseMessageListReturn } from '../CometChatMessageList.types';
import { initialMessageListState } from '../CometChatMessageList.types';

function buildCtx(
  overrides: Partial<CometChatUseMessageListReturn> = {}
): CometChatUseMessageListReturn {
  const noop = () => {
    /* noop */
  };
  const noopAsync = async () => {
    /* noop */
  };
  return {
    state: initialMessageListState,
    allMessages: [],
    loggedInUser: { getUid: () => 'me', getName: () => 'Me' } as never,
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
    clearNewMessageCount: noop,
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
    },
    ...overrides,
  };
}

function renderScrollToBottom(
  ctx: CometChatUseMessageListReturn,
  props: React.ComponentProps<typeof CometChatMessageListScrollToBottom> = {}
) {
  return render(
    <CometChatMessageListProvider value={ctx}>
      <CometChatMessageListScrollToBottom {...props} />
    </CometChatMessageListProvider>
  );
}

describe('CometChatMessageListScrollToBottom', () => {
  it('hides the scroll-to-bottom button when at bottom and hasReachedLatest=true', () => {
    renderScrollToBottom(buildCtx({ isAtBottom: true, hasReachedLatest: true }));
    expect(screen.queryByRole('button', { name: /scroll to bottom/i })).not.toBeInTheDocument();
  });

  it('shows the button when scrolled up (isAtBottom=false)', () => {
    renderScrollToBottom(buildCtx({ isAtBottom: false, hasReachedLatest: true }));
    expect(screen.getByRole('button', { name: /scroll to bottom/i })).toBeInTheDocument();
  });

  it('shows the button when hasReachedLatest=false even if at bottom of loaded window', () => {
    renderScrollToBottom(buildCtx({ isAtBottom: true, hasReachedLatest: false }));
    expect(screen.getByRole('button', { name: /scroll to bottom/i })).toBeInTheDocument();
  });

  it('hides the button while loading', () => {
    renderScrollToBottom(buildCtx({ isAtBottom: false, isLoading: true }));
    expect(screen.queryByRole('button', { name: /scroll to bottom/i })).not.toBeInTheDocument();
  });

  it('shows a numeric unread badge equal to max(newMessageCount, unreadCount)', () => {
    renderScrollToBottom(buildCtx({ isAtBottom: false, newMessageCount: 2, unreadCount: 5 }));
    const btn = screen.getByRole('button', { name: /scroll to bottom, 5 new messages/i });
    expect(btn).toHaveTextContent('5');
  });

  it('caps the badge at 999+', () => {
    renderScrollToBottom(buildCtx({ isAtBottom: false, newMessageCount: 1234, unreadCount: 0 }));
    expect(screen.getByRole('button', { name: /1234 new messages/i })).toHaveTextContent('999+');
  });

  it('uses the "Scroll to bottom" label without count when no unread', () => {
    renderScrollToBottom(buildCtx({ isAtBottom: false, newMessageCount: 0, unreadCount: 0 }));
    expect(screen.getByRole('button', { name: 'Scroll to bottom' })).toBeInTheDocument();
  });

  it('calls scrollToBottom on click and, when it returns scroll-dom, updates the container', () => {
    const scrollToBottom = vi.fn<[], 'scroll-dom' | 'refetching'>(() => 'scroll-dom');
    const container = document.createElement('div');
    Object.defineProperty(container, 'scrollHeight', { configurable: true, value: 500 });
    container.scrollTop = 0;
    const ref = { current: container };

    renderScrollToBottom(buildCtx({ isAtBottom: false, scrollToBottom }), {
      scrollContainerRef: ref,
    });

    fireEvent.click(screen.getByRole('button', { name: /scroll to bottom/i }));
    expect(scrollToBottom).toHaveBeenCalled();
    expect(container.scrollTop).toBe(500);
  });

  it('does not set scrollTop when scrollToBottom returns refetching', () => {
    const scrollToBottom = vi.fn<[], 'scroll-dom' | 'refetching'>(() => 'refetching');
    const container = document.createElement('div');
    Object.defineProperty(container, 'scrollHeight', { configurable: true, value: 500 });
    container.scrollTop = 10;
    const ref = { current: container };

    renderScrollToBottom(buildCtx({ isAtBottom: false, scrollToBottom }), {
      scrollContainerRef: ref,
    });

    fireEvent.click(screen.getByRole('button', { name: /scroll to bottom/i }));
    expect(container.scrollTop).toBe(10);
  });

  it('supports Enter and Space keyboard activation', () => {
    const scrollToBottom = vi.fn<[], 'scroll-dom' | 'refetching'>(() => 'refetching');
    renderScrollToBottom(buildCtx({ isAtBottom: false, scrollToBottom }));

    const btn = screen.getByRole('button', { name: /scroll to bottom/i });
    fireEvent.keyDown(btn, { key: 'Enter' });
    expect(scrollToBottom).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(btn, { key: ' ' });
    expect(scrollToBottom).toHaveBeenCalledTimes(2);

    fireEvent.keyDown(btn, { key: 'Escape' });
    expect(scrollToBottom).toHaveBeenCalledTimes(2);
  });

  it('has the correct display name', () => {
    expect(CometChatMessageListScrollToBottom.displayName).toBe(
      'CometChatMessageListScrollToBottom'
    );
  });
});
