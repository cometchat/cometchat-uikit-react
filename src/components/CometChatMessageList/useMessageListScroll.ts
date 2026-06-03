import { useCallback } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatMessageListManager } from './CometChatMessageListManager';
import type { CometChatMessageListManagerOptions } from './CometChatMessageList.types';
import { noop } from './messageListHelpers';
import { usePublishEvent } from '../../context/CometChatEventsContext';
import type { MessageListRefs, MessageListDispatch } from './messageListRefs';

// ---------------------------------------------------------------------------
// Scroll-dependent behavior sub-hook
// ---------------------------------------------------------------------------

export interface UseMessageListScrollOptions {
  user: CometChat.User | undefined;
  group: CometChat.Group | undefined;
  messagesRequestBuilder: CometChat.MessagesRequestBuilder | undefined;
  parentMessageId: number | undefined;
  messageTypes: string[];
  messageCategories: string[];
  onError: ((error: CometChat.CometChatException) => void) | null | undefined;
  onConversationMarkedAsRead: ((conversation: CometChat.Conversation) => void) | undefined;
}

export interface UseMessageListScrollReturn {
  fetchPrevious: () => Promise<void>;
  fetchNext: () => Promise<void>;
  setAtBottom: (isAtBottom: boolean) => void;
  clearNewMessageCount: () => void;
  /**
   * Mark the conversation as read if the last message is unread.
   * Called by the bottom sentinel observer (manual scroll, auto-scroll, button scroll).
   * Only calls the SDK if the last message doesn't have readAt set, preventing
   * redundant API calls on every scroll bounce.
   */
  markConversationAsReadIfUnread: () => void;
  scrollToMessage: (messageId: number) => void;
  goToMessage: (messageId: number) => Promise<void>;
  scrollToBottom: () => 'scroll-dom' | 'refetching';
}

/**
 * Scroll-dependent behavior: pagination, scroll state, mark-as-read on scroll,
 * goToMessage, and the complex scrollToBottom logic.
 */
export function useMessageListScroll(
  options: UseMessageListScrollOptions,
  refs: MessageListRefs,
  dispatch: MessageListDispatch
): UseMessageListScrollReturn {
  const {
    user,
    group,
    messagesRequestBuilder,
    parentMessageId,
    messageTypes,
    messageCategories,
    onError,
  } = options;

  const publish = usePublishEvent();

  // ---------------------------------------------------------------------------
  // Fetch previous (older messages)
  // ---------------------------------------------------------------------------

  const fetchPrevious = useCallback(async () => {
    if (refs.isFetchingPrevRef.current || !refs.managerRef.current) return;
    refs.isFetchingPrevRef.current = true;
    const gen = refs.generationRef.current;

    dispatch({ type: 'FETCH_PREVIOUS_START' });
    try {
      const messages = await refs.managerRef.current.fetchPrevious();
      if (refs.generationRef.current !== gen) return;
      dispatch({
        type: 'FETCH_PREVIOUS_SUCCESS',
        messages,
        hasMore: messages.length > 0,
      });
    } catch (error) {
      if (refs.generationRef.current !== gen) return;
      dispatch({
        type: 'FETCH_PREVIOUS_ERROR',
        error: error instanceof Error ? error.message : 'Fetch previous failed',
      });
      onError?.(error as CometChat.CometChatException);
    } finally {
      refs.isFetchingPrevRef.current = false;
    }
  }, [onError, refs, dispatch]);

  // ---------------------------------------------------------------------------
  // Fetch next (newer messages)
  // ---------------------------------------------------------------------------

  const fetchNext = useCallback(async () => {
    if (refs.isFetchingNextRef.current || !refs.managerRef.current) return;
    refs.isFetchingNextRef.current = true;
    const gen = refs.generationRef.current;

    dispatch({ type: 'FETCH_NEXT_START' });
    try {
      const messages = await refs.managerRef.current.fetchNext();
      if (refs.generationRef.current !== gen) return;

      const hasMoreNewer = messages.length > 0;
      dispatch({
        type: 'FETCH_NEXT_SUCCESS',
        messages,
        hasMoreNewer,
      });

      // When fetchNext exhausts newer messages, set hasReachedLatest to true
      if (!hasMoreNewer) {
        dispatch({ type: 'SET_HAS_REACHED_LATEST', hasReachedLatest: true });
      }
    } catch (error) {
      if (refs.generationRef.current !== gen) return;
      dispatch({
        type: 'FETCH_NEXT_ERROR',
        error: error instanceof Error ? error.message : 'Fetch next failed',
      });
      onError?.(error as CometChat.CometChatException);
    } finally {
      refs.isFetchingNextRef.current = false;
    }
  }, [onError, refs, dispatch]);

  // ---------------------------------------------------------------------------
  // Scroll-dependent behavior
  // ---------------------------------------------------------------------------

  const setAtBottom = useCallback(
    (isAtBottom: boolean) => {
      dispatch({ type: 'SET_AT_BOTTOM', isAtBottom });
    },
    [dispatch]
  );

  const clearNewMessageCount = useCallback(() => {
    dispatch({ type: 'CLEAR_NEW_MESSAGE_COUNT' });
  }, [dispatch]);

  /**
   * Mark the conversation as read, but ONLY if the last message is unread.
   *
   * This is the unified "reached the bottom" handler — called by:
   * - The bottom sentinel observer (manual scroll to bottom)
   * - The scroll-to-bottom button
   * - Auto-scroll on new messages (scrollToBottomOnNewMessages)
   *
   * Checks the last message's readAt to avoid redundant API calls on every
   * scroll bounce. After marking, dispatches SET_CONVERSATION_READ so the
   * check won't fire again until a new unread message arrives.
   */
  const markConversationAsReadIfUnread = useCallback(() => {
    if (!refs.managerRef.current) return;

    if (parentMessageId) return;

    // If the user manually marked a message as unread, don't auto-read
    if (refs.stateRef.current.markedUnreadByUser) {
      return;
    }

    const currentMessages = refs.stateRef.current.messages;
    if (currentMessages.length === 0) {
      return;
    }

    const lastMsg = currentMessages[currentMessages.length - 1];
    if (!lastMsg) return;

    // Only relevant if the last message is from another user
    const senderId = lastMsg.getSender().getUid();
    const loggedInUserId = refs.optionsRef.current.loggedInUser.getUid();
    if (senderId === loggedInUserId) {
      return;
    }

    // Check if already read — readAt > 0 means it's been read
    const readAt = lastMsg.getReadAt();
    if (readAt && readAt > 0) {
      return;
    }

    refs.managerRef.current.markConversationAsRead().catch(noop);

    // Set readAt locally so subsequent observer fires won't re-trigger
    const now = Math.floor(Date.now() / 1000);
    lastMsg.setReadAt(now);

    dispatch({ type: 'SET_CONVERSATION_READ' });

    // Publish UI event so sibling components (conversations list) can react
    const currentMsgs = refs.stateRef.current.messages;
    const lastMessage = currentMsgs[currentMsgs.length - 1];
    if (lastMessage) {
      const conversationId = lastMessage.getConversationId();
      publish({
        type: 'ui:conversation/read',
        conversationId,
      });
    }

    // Fire the callback
    const onConvRead = refs.optionsRef.current.onConversationMarkedAsRead;
    if (onConvRead) {
      refs.managerRef.current.getConversation().then(conversation => {
        onConvRead(conversation);
      }, noop);
    }
  }, [refs, dispatch, publish, parentMessageId]);

  const scrollToMessage = useCallback(
    (messageId: number) => {
      dispatch({ type: 'SET_SCROLL_TO_MESSAGE', messageId });
    },
    [dispatch]
  );

  const goToMessage = useCallback(
    async (messageId: number, highlight = true) => {
      // Check if message is already loaded
      const existing = refs.stateRef.current.messages.find(m => m.getId() === messageId);
      if (existing) {
        dispatch({ type: 'SET_SCROLL_TO_MESSAGE', messageId, highlight });
        return;
      }

      // Not loaded — show loading state and re-fetch around the target
      if (!refs.managerRef.current) return;

      // Show loading shimmer while fetching
      dispatch({ type: 'RESET' });
      dispatch({ type: 'FETCH_PREVIOUS_START' });

      const gen = refs.generationRef.current;

      try {
        const result = await refs.managerRef.current.fetchAroundMessageId(messageId);
        if (refs.generationRef.current !== gen) return;

        dispatch({
          type: 'FETCH_AROUND_SUCCESS',
          messages: result.messages,
          targetMessageId: messageId,
          hasMore: result.messages.length > 0,
          hasMoreNewer: result.hasMoreNewer,
          highlight,
        });
      } catch (error) {
        if (refs.generationRef.current !== gen) return;
        dispatch({
          type: 'FETCH_PREVIOUS_ERROR',
          error: error instanceof Error ? error.message : 'Go to message failed',
        });
        onError?.(error as CometChat.CometChatException);
      }
    },
    [onError, refs, dispatch]
  );

  /**
   * Scroll to the bottom of the conversation.
   *
   * Logic:
   *
   * 1. If hasReachedLatest is true: we already have the latest messages.
   *    Just signal the View to scroll the DOM to bottom, clear counts, mark as read.
   *
   * 2. If hasReachedLatest is false AND there are unread messages (unreadCount > 0
   *    and lastReadMessageId exists): re-fetch around the lastReadMessageId first.
   *    This shows the user where they left off. Mark conv as read. The next click
   *    will go to the actual bottom (since hasReachedLatest may now be true if
   *    all newer messages fit in the window).
   *
   * 3. If hasReachedLatest is false AND no unread messages: re-fetch from scratch
   *    (latest messages) like a normal chat open.
   */
  const scrollToBottom = useCallback(() => {
    const currentState = refs.stateRef.current;

    if (currentState.hasReachedLatest) {
      dispatch({ type: 'CLEAR_NEW_MESSAGE_COUNT' });
      markConversationAsReadIfUnread();
      return 'scroll-dom' as const;
    }

    // hasReachedLatest is false — we're viewing historical messages.
    // Check if there are unread messages AND the lastRead is NOT already loaded.
    // If lastRead IS already loaded, we're already there — go to the actual bottom.
    // IMPORTANT: Only go to lastRead when startFromUnreadMessages is true.
    // When false, always go to the actual bottom regardless of unread state.
    const startFromUnread = refs.optionsRef.current.startFromUnreadMessages ?? false;
    const hasUnread = currentState.unreadCount > 0 && currentState.lastReadMessageId !== null;
    const lastReadAlreadyLoaded =
      hasUnread &&
      currentState.lastReadMessageId !== null &&
      currentState.messages.some(m => m.getId() === currentState.lastReadMessageId);

    // When user manually marked as unread, skip the "go to lastRead" branch —
    // go straight to the actual bottom without marking as read.
    if (
      startFromUnread &&
      hasUnread &&
      !lastReadAlreadyLoaded &&
      currentState.lastReadMessageId &&
      !currentState.markedUnreadByUser
    ) {
      // Capture lastReadMessageId before goToMessage's RESET clears it
      const savedLastReadMessageId = currentState.lastReadMessageId;
      void goToMessage(currentState.lastReadMessageId, false);
      refs.managerRef.current?.markConversationAsRead().catch(noop);
      dispatch({ type: 'CLEAR_NEW_MESSAGE_COUNT' });
      dispatch({ type: 'SET_UNREAD_COUNT', count: 0 });
      // Restore lastReadMessageId (RESET cleared it) so the banner knows where to render
      dispatch({ type: 'SET_LAST_READ_MESSAGE_ID', messageId: savedLastReadMessageId });
      dispatch({ type: 'SET_SHOW_UNREAD_BANNER', value: true });
    } else {
      // Capture values before RESET clears them
      const wasMarkedUnreadByUser = currentState.markedUnreadByUser;
      const wasShowingUnreadBanner = currentState.showUnreadBanner;
      const savedUnreadCount = currentState.unreadCount;
      const savedLastReadMessageId = currentState.lastReadMessageId;

      // Re-fetch from scratch: latest messages, like a normal chat open
      refs.generationRef.current += 1;
      dispatch({ type: 'RESET' });
      // Restore state after RESET so it persists for subsequent scrolls
      if (wasMarkedUnreadByUser) {
        dispatch({ type: 'SET_MARKED_UNREAD_BY_USER', value: true });
        dispatch({ type: 'SET_UNREAD_COUNT', count: savedUnreadCount });
        if (savedLastReadMessageId !== null) {
          dispatch({ type: 'SET_LAST_READ_MESSAGE_ID', messageId: savedLastReadMessageId });
        }
      }
      if (wasShowingUnreadBanner) {
        dispatch({ type: 'SET_SHOW_UNREAD_BANNER', value: true });
        if (savedLastReadMessageId !== null) {
          dispatch({ type: 'SET_LAST_READ_MESSAGE_ID', messageId: savedLastReadMessageId });
        }
      }
      dispatch({ type: 'FETCH_PREVIOUS_START' });

      const managerOpts: CometChatMessageListManagerOptions = {
        messageTypes,
        messageCategories,
      };
      if (user) managerOpts.user = user;
      if (group) managerOpts.group = group;
      if (messagesRequestBuilder) managerOpts.builder = messagesRequestBuilder;
      if (parentMessageId) managerOpts.parentMessageId = parentMessageId;

      const newManager = new CometChatMessageListManager(managerOpts);
      refs.managerRef.current = newManager;

      const gen = refs.generationRef.current;

      const refetch = async () => {
        try {
          const messages = await newManager.fetchPrevious();
          if (refs.generationRef.current !== gen) return;

          dispatch({
            type: 'FETCH_PREVIOUS_SUCCESS',
            messages,
            hasMore: messages.length > 0,
          });
          dispatch({ type: 'SET_HAS_REACHED_LATEST', hasReachedLatest: true });
          dispatch({ type: 'CLEAR_NEW_MESSAGE_COUNT' });

          // Signal that we want to scroll to the actual bottom after render.
          dispatch({ type: 'SET_AT_BOTTOM', isAtBottom: true });

          // Only mark as read if the user didn't manually mark as unread.
          // Use the captured value since RESET cleared the state.
          if (!wasMarkedUnreadByUser) {
            dispatch({ type: 'SET_UNREAD_COUNT', count: 0 });
            newManager.markConversationAsRead().catch(noop);
            dispatch({ type: 'SET_CONVERSATION_READ' });
          }
        } catch (error) {
          if (refs.generationRef.current !== gen) return;
          dispatch({
            type: 'FETCH_PREVIOUS_ERROR',
            error: error instanceof Error ? error.message : 'Scroll to bottom failed',
          });
          onError?.(error as CometChat.CometChatException);
        }
      };

      void refetch();
    }

    return 'refetching' as const;
  }, [
    user,
    group,
    messagesRequestBuilder,
    parentMessageId,
    messageTypes,
    messageCategories,
    onError,
    markConversationAsReadIfUnread,
    goToMessage,
    refs,
    dispatch,
  ]);

  return {
    fetchPrevious,
    fetchNext,
    setAtBottom,
    clearNewMessageCount,
    markConversationAsReadIfUnread,
    scrollToMessage,
    goToMessage,
    scrollToBottom,
  };
}
