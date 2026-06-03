/**
 * Tests for CometChatMessageListRoot — the compound component wrapper.
 *
 * Verifies:
 * - Default layout rendered when no children (LoadingState + ErrorState + EmptyState + View + Footer)
 * - Custom children rendered when provided (compound composition)
 * - Context is provided to children
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CometChatMessageListRoot } from '../CometChatMessageListRoot';
import { useCometChatMessageListContext } from '../CometChatMessageList.context';

// Mock the hook so we don't need SDK
vi.mock('../useCometChatMessageList', () => ({
  useCometChatMessageList: () => ({
    state: {
      messages: [],
      fetchState: 'loading',
      hasMore: true,
      hasMoreNewer: false,
      hasReachedLatest: true,
      isFetchingMore: false,
      error: null,
      scrollToMessageId: null,
      scrollToMessageHighlight: false,
      isAtBottom: true,
      newMessageCount: 0,
      lastReadMessageId: null,
      unreadCount: 0,
      isConversationRead: false,
      markedUnreadByUser: false,
      showUnreadBanner: false,
    },
    allMessages: [],
    loggedInUser: { getUid: () => 'me', getName: () => 'Me' },
    group: undefined,
    isLoading: true,
    isEmpty: false,
    isError: false,
    fetchPrevious: async () => {},
    fetchNext: async () => {},
    deleteMessage: async () => {},
    scrollToMessage: () => {},
    goToMessage: async () => {},
    setAtBottom: () => {},
    clearNewMessageCount: () => {},
    markConversationAsReadIfUnread: () => {},
    markMessageAsUnread: async () => {},
    reactToMessage: async () => {},
    scrollToBottom: () => 'scroll-dom' as const,
    hasMore: true,
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
      quickOptionsCount: 3,
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
  }),
}));

// Mock the plugin registry
vi.mock('../../../hooks/usePluginRegistry', () => ({
  usePluginRegistry: () => ({
    getAllMessageTypes: () => ['text'],
    getAllMessageCategories: () => ['message'],
    findPlugin: () => undefined,
    getAll: () => [],
  }),
}));

const mockLoggedInUser = { getUid: () => 'me', getName: () => 'Me' } as never;

describe('CometChatMessageListRoot', () => {
  it('renders the wrapper div with role="region"', () => {
    render(<CometChatMessageListRoot loggedInUser={mockLoggedInUser} />);
    expect(screen.getByRole('region', { name: 'Message list' })).toBeInTheDocument();
  });

  it('renders default layout (LoadingState visible) when no children', () => {
    render(<CometChatMessageListRoot loggedInUser={mockLoggedInUser} />);
    // The mock returns isLoading: true, so LoadingState should render
    expect(screen.getByRole('status', { name: 'Loading messages' })).toBeInTheDocument();
  });

  it('renders custom children when provided (compound composition)', () => {
    render(
      <CometChatMessageListRoot loggedInUser={mockLoggedInUser}>
        <div data-testid="custom-child">Custom content</div>
      </CometChatMessageListRoot>
    );
    expect(screen.getByTestId('custom-child')).toHaveTextContent('Custom content');
    // Default LoadingState should NOT be rendered
    expect(screen.queryByRole('status', { name: 'Loading messages' })).not.toBeInTheDocument();
  });

  it('provides context to children', () => {
    function ContextConsumer() {
      const ctx = useCometChatMessageListContext();
      return <span data-testid="ctx-check">{ctx.isLoading ? 'loading' : 'not-loading'}</span>;
    }

    render(
      <CometChatMessageListRoot loggedInUser={mockLoggedInUser}>
        <ContextConsumer />
      </CometChatMessageListRoot>
    );
    expect(screen.getByTestId('ctx-check')).toHaveTextContent('loading');
  });
});
