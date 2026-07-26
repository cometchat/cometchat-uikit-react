import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, renderHook } from '@testing-library/react';
import {
  CometChatMessageListProvider,
  useCometChatMessageListContext,
} from '../CometChatMessageList.context';
import type { CometChatUseMessageListReturn } from '../CometChatMessageList.types';
import { initialMessageListState } from '../CometChatMessageList.types';

function buildReturn(): CometChatUseMessageListReturn {
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
  };
}

describe('useCometChatMessageListContext', () => {
  it('returns the provided value when used inside the provider', () => {
    const value = buildReturn();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CometChatMessageListProvider value={value}>{children}</CometChatMessageListProvider>
    );

    const { result } = renderHook(() => useCometChatMessageListContext(), { wrapper });
    expect(result.current).toBe(value);
  });

  it('throws a descriptive error when used outside a provider', () => {
    // Suppress the expected React error boundary log noise
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    function Consumer() {
      useCometChatMessageListContext();
      return null;
    }

    expect(() => render(<Consumer />)).toThrow(
      /useCometChatMessageListContext must be used within a CometChatMessageList\.Provider/
    );

    errSpy.mockRestore();
  });
});
