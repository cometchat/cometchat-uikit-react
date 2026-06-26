import { useMemo, useReducer, useRef } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatUIKit } from '../../CometChatUIKit/CometChatUIKit';
import type { CometChatMessageListManager } from './CometChatMessageListManager';
import { messageListReducer, initialMessageListState } from './CometChatMessageList.reducer';
import type {
  CometChatUseMessageListOptions,
  CometChatUseMessageListReturn,
  CometChatMessageListState,
} from './CometChatMessageList.types';
import {
  useDefaultMessageTypes,
  useDefaultMessageCategories,
} from '../../hooks/useDefaultMessageTypes';
import { useMessageListInit } from './useMessageListInit';
import { useMessageListEvents } from './useMessageListEvents';
import { useMessageListActions } from './useMessageListActions';
import { useMessageListScroll } from './useMessageListScroll';
import type { MessageListRefs } from './messageListRefs';

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useCometChatMessageList — orchestration hook for the message list data layer.
 *
 * Creates a CometChatMessageListManager for SDK calls, uses useReducer for state,
 * subscribes to SDK events via useCometChatEvents, and exposes a clean API.
 *
 *
 * The hook is split into sub-hooks for maintainability:
 * - useMessageListInit      — initialization effect
 * - useMessageListEvents    — real-time SDK event handling
 * - useMessageListActions   — send, edit, delete, mark as unread
 * - useMessageListScroll    — pagination, scroll state, goToMessage, scrollToBottom
 */
export function useCometChatMessageList(
  options: CometChatUseMessageListOptions
): CometChatUseMessageListReturn {
  const {
    user,
    group,
    loggedInUser: loggedInUserProp,
    messagesRequestBuilder,
    parentMessageId,
    startFromUnreadMessages = false,
    goToMessageId,
    messageTypes: messageTypesProp,
    messageCategories: messageCategoriesProp,
    disableSoundForMessages = false,
    customSoundForMessages,
    scrollToBottomOnNewMessages = false,
    hideReceipts = false,
    isAgentChat = false,
    onError,
    onActiveChatChanged,
    onMessageDeleted,
    onConversationMarkedAsRead,
    onConversationUpdated,
  } = options;

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const loggedInUser = (loggedInUserProp ?? CometChatUIKit.getLoggedInUser())!;

  // --- Default types/categories from the active plugin registry ---
  const defaultMessageTypes = useDefaultMessageTypes();
  const defaultMessageCategories = useDefaultMessageCategories();
  const messageTypes = messageTypesProp ?? defaultMessageTypes;
  const messageCategories = messageCategoriesProp ?? defaultMessageCategories;

  // --- Reducer ---
  const [state, dispatch] = useReducer(messageListReducer, initialMessageListState);

  // --- Refs ---
  const generationRef = useRef(0);
  const managerRef = useRef<CometChatMessageListManager | null>(null);
  const isFetchingPrevRef = useRef(false);
  const isFetchingNextRef = useRef(false);
  const lastUnreadMarkedIdRef = useRef('');
  const groupRef = useRef<CometChat.Group | undefined>(group);

  // stateRef tracks current state so the useCometChatEvents handler can read it
  // without re-subscribing on every state change.
  const stateRef = useRef<CometChatMessageListState>(state);
  stateRef.current = state;

  // Keep callback refs stable so the event handler doesn't re-subscribe.
  // Store the resolved loggedInUser (prop or SDK fallback) so consumers reading
  // through the ref get the same value as the rest of the hook.
  const optionsRef = useRef(options);
  optionsRef.current = { ...options, loggedInUser };

  /**
   * Core initialization logic. Extracted so it can be called from both
   * the initialization effect and the connection/connected handler.
   */
  const initializeRef = useRef<(() => void) | null>(null);

  // --- Shared refs object (memoized so sub-hook useCallback deps stay stable) ---
  // Each individual ref is already stable (from useRef), but the container object
  // must also be stable to avoid re-creating useCallbacks on every render.
  const refs: MessageListRefs = useMemo(
    () => ({
      generationRef,
      managerRef,
      isFetchingPrevRef,
      isFetchingNextRef,
      lastUnreadMarkedIdRef,
      groupRef,
      stateRef,
      optionsRef,
      initializeRef,
      pendingMessagesMap: {},
    }),
    []
  );

  // ---------------------------------------------------------------------------
  // Sub-hooks
  // ---------------------------------------------------------------------------

  // --- Initialization ---
  useMessageListInit(
    {
      user,
      group,
      loggedInUser,
      messagesRequestBuilder,
      parentMessageId,
      startFromUnreadMessages,
      goToMessageId,
      messageTypes,
      messageCategories,
      onError,
      isAgentChat,
      loadLastAgentConversation: options.loadLastAgentConversation ?? false,
      onActiveChatChanged,
    },
    refs,
    dispatch
  );

  // --- Real-time event handling ---
  useMessageListEvents(
    {
      user,
      group,
      loggedInUser,
      messagesRequestBuilder,
      parentMessageId,
      messageTypes,
      messageCategories,
      disableSoundForMessages,
      customSoundForMessages,
      scrollToBottomOnNewMessages,
      hideReceipts,
    },
    refs,
    dispatch
  );

  // --- Message actions (delete, mark as unread, react) ---
  const { deleteMessage, markMessageAsUnread, reactToMessage } = useMessageListActions(
    {
      onError,
      onMessageDeleted,
      onConversationUpdated,
    },
    refs,
    dispatch
  );

  // --- Scroll-dependent behavior (pagination, goToMessage, scrollToBottom) ---
  const {
    fetchPrevious,
    fetchNext,
    setAtBottom,
    clearNewMessageCount,
    markConversationAsReadIfUnread,
    scrollToMessage,
    goToMessage,
    scrollToBottom,
  } = useMessageListScroll(
    {
      user,
      group,
      messagesRequestBuilder,
      parentMessageId,
      messageTypes,
      messageCategories,
      onError,
      onConversationMarkedAsRead,
    },
    refs,
    dispatch
  );

  // ---------------------------------------------------------------------------
  // Computed values
  // ---------------------------------------------------------------------------

  // `state.messages` is the single source of truth (pending + confirmed +
  // edited + moderated + failed all coexist in one list)
  const allMessages = state.messages;

  const isLoading = state.fetchState === 'loading';
  const isEmpty = state.fetchState === 'empty';
  const isError = state.fetchState === 'error';

  // ---------------------------------------------------------------------------
  // Visual / option / date-format bag
  // ---------------------------------------------------------------------------
  // Grouped into a single object so the View / BubbleRenderer / DateSeparator
  const {
    hideStickyDate = false,
    hideAvatar = false,
    hideGroupActionMessages = false,
    quickOptionsCount = 2,
    hideReplyOption = false,
    hideReplyInThreadOption: hideReplyInThreadOptionProp = false,
    hideEditMessageOption = false,
    hideDeleteMessageOption = false,
    hideCopyMessageOption = false,
    hideReactionOption = false,
    hideMessageInfoOption = false,
    hideFlagMessageOption = false,
    hideMessagePrivatelyOption = false,
    hideTranslateMessageOption = false,
    showMarkAsUnreadOption: showMarkAsUnreadOptionProp = false,
    separatorDateTimeFormat,
    stickyDateTimeFormat,
    messageSentAtDateTimeFormat,
    messageInfoDateTimeFormat,
    reactionsRequestBuilder,
    onReactionClick,
    onReactionListItemClick,
    messageAlignment = 1,
    showScrollbar = false,
    hideDateSeparator = false,
    onThreadRepliesClick,
    onAvatarClick,
    onEditMessage,
    onReplyMessage,
    hideFlagRemarkField = false,
    disableTruncation = false,
    hideModerationView = false,
    bubbleView,
    showSmartReplies = false,
    smartRepliesKeywords = ['what', 'when', 'why', 'who', 'where', 'how', '?'],
    smartRepliesDelayDuration = 10000,
    showConversationStarters = false,
    loadLastAgentConversation = false,
  } = options;

  const hideReplyInThreadOption = parentMessageId ? true : hideReplyInThreadOptionProp;
  const showMarkAsUnreadOption = parentMessageId ? false : showMarkAsUnreadOptionProp;

  const optionsBag = useMemo(
    () => ({
      hideStickyDate,
      hideAvatar,
      hideGroupActionMessages,
      quickOptionsCount,
      hideReplyOption,
      hideReplyInThreadOption,
      hideEditMessageOption,
      hideDeleteMessageOption,
      hideCopyMessageOption,
      hideReactionOption,
      hideMessageInfoOption,
      hideFlagMessageOption,
      hideMessagePrivatelyOption,
      hideTranslateMessageOption,
      showMarkAsUnreadOption,
      separatorDateTimeFormat,
      stickyDateTimeFormat,
      messageSentAtDateTimeFormat,
      messageInfoDateTimeFormat,
      reactionsRequestBuilder,
      onReactionClick,
      onReactionListItemClick,
      messageAlignment,
      showScrollbar,
      hideDateSeparator,
      onThreadRepliesClick,
      onAvatarClick,
      onEditMessage,
      onReplyMessage,
      hideFlagRemarkField,
      disableTruncation,
      hideModerationView,
      isAgentChat,
      bubbleView,
      showSmartReplies,
      smartRepliesKeywords,
      smartRepliesDelayDuration,
      showConversationStarters,
      loadLastAgentConversation,
    }),
    [
      hideStickyDate,
      hideAvatar,
      hideGroupActionMessages,
      quickOptionsCount,
      hideReplyOption,
      hideReplyInThreadOption,
      hideEditMessageOption,
      hideDeleteMessageOption,
      hideCopyMessageOption,
      hideReactionOption,
      hideMessageInfoOption,
      hideFlagMessageOption,
      hideMessagePrivatelyOption,
      hideTranslateMessageOption,
      showMarkAsUnreadOption,
      separatorDateTimeFormat,
      stickyDateTimeFormat,
      messageSentAtDateTimeFormat,
      messageInfoDateTimeFormat,
      reactionsRequestBuilder,
      onReactionClick,
      onReactionListItemClick,
      messageAlignment,
      showScrollbar,
      hideDateSeparator,
      onThreadRepliesClick,
      onAvatarClick,
      onEditMessage,
      onReplyMessage,
      hideFlagRemarkField,
      disableTruncation,
      hideModerationView,
      isAgentChat,
      bubbleView,
      showSmartReplies,
      smartRepliesKeywords,
      smartRepliesDelayDuration,
      showConversationStarters,
      loadLastAgentConversation,
    ]
  );

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    state,
    allMessages,
    loggedInUser,
    user,
    group,
    isLoading,
    isEmpty,
    isError,
    fetchPrevious,
    fetchNext,
    deleteMessage,
    scrollToMessage,
    goToMessage,
    setAtBottom,
    clearNewMessageCount,
    markConversationAsReadIfUnread,
    markMessageAsUnread,
    reactToMessage,
    scrollToBottom,
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
    options: optionsBag,
  };
}
