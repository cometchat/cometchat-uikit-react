import React from 'react';
import { CometChatMessageListProvider } from '../../CometChatMessageList.context';
import type { CometChatUseMessageListReturn } from '../../CometChatMessageList.types';
import { initialMessageListState } from '../../CometChatMessageList.types';
import { vi } from 'vitest';

const DEFAULT_OPTIONS = {
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
  messageAlignment: 1 as const,
  showScrollbar: false,
  hideDateSeparator: false,
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
  onEditMessage: undefined,
  onReplyMessage: undefined,
  showSmartReplies: false,
  smartRepliesKeywords: ['what', 'when', 'why', 'who', 'where', 'how', '?'],
  smartRepliesDelayDuration: 10000,
  showConversationStarters: false,
  loadLastAgentConversation: false,
};

export function buildMockMessageListContext(
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
    user: undefined,
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
    options: DEFAULT_OPTIONS,
    ...overrides,
  };
}

export function MockMessageListProvider({
  children,
  overrides = {},
}: {
  children: React.ReactNode;
  overrides?: Partial<CometChatUseMessageListReturn>;
}) {
  return (
    <CometChatMessageListProvider value={buildMockMessageListContext(overrides)}>
      {children}
    </CometChatMessageListProvider>
  );
}
