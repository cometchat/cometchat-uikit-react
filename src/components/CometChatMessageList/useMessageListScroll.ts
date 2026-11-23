import { useCallback, useRef } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatMessageListManager } from './CometChatMessageListManager';
import type { CometChatMessageListManagerOptions } from './CometChatMessageList.types';
import { noop } from './messageListHelpers';
import { usePublishEvent } from '../../context/CometChatEventsContext';
import type { MessageListRefs, MessageListDispatch } from './messageListRefs';
import { isOfflineOn } from '../../utils/offline/gate';
import { reportsReadError } from '../../utils/offline/entityList';
import { isNotConnectedError } from '../../utils/offline/reconcile';
import {
  failStrandedSends,
  fetchAroundOffline,
  readPageOffline,
  rememberOfflineRead,
  type OfflineListContext,
  jumpToLatest,
} from './messageListOffline';

// ---------------------------------------------------------------------------
// Scroll-dependent behavior sub-hook
// ---------------------------------------------------------------------------

export interface UseMessageListScrollOptions {
  user: CometChat.User | undefined;
  group: CometChat.Group | undefined;
  messagesRequestBuilder: CometChat.MessagesRequestBuilder | undefined;
  parentMessageId: number | undefined;
  messageTypes: string[] | undefined;
  messageCategories: string[];
  onError: ((error: CometChat.CometChatException) => void) | null | undefined;
  onConversationMarkedAsRead: ((conversation: CometChat.Conversation) => void) | undefined;
  isAgentChat: boolean | undefined;
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
  /** Offline support only: show the newest window a sweep read ("Jump to latest"). */
  offlineJumpToLatest: () => void;
}

/** How long a reconnect waits for the reads in flight before it gives up on the edge. */
const EDGE_SETTLE_POLL_MS = 50;
const EDGE_SETTLE_MAX_TRIES = 200;

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
  /** Counts jumps over rows on screen, so only the latest one's target lookup applies. */
  const jumpSeqRef = useRef(0);

  /** The list's request configuration, for a fresh manager (it reads each option only when set). */
  const managerOptions = useCallback(
    (): CometChatMessageListManagerOptions => ({
      user,
      group,
      builder: messagesRequestBuilder,
      parentMessageId,
      messageTypes,
      messageCategories,
      isAgentChat: options.isAgentChat,
    }),
    [
      user,
      group,
      messagesRequestBuilder,
      parentMessageId,
      messageTypes,
      messageCategories,
      options.isAgentChat,
    ]
  );

  /** Context for one offline (ON-path) operation. */
  const offlineContext = useCallback(
    (): OfflineListContext => ({
      refs,
      dispatch,
      publish,
      user,
      group,
      parentMessageId,
      // Always set by the orchestrator before any operation runs.
      // eslint-disable-next-line @typescript-eslint/non-nullable-type-assertion-style
      loggedInUser: refs.optionsRef.current.loggedInUser as CometChat.User,
      isAgentChat: options.isAgentChat ?? false,
      makeManager: () => new CometChatMessageListManager(managerOptions()),
    }),
    [refs, dispatch, publish, user, group, parentMessageId, options.isAgentChat, managerOptions]
  );

  // ---------------------------------------------------------------------------
  // Fetch previous (older messages)
  // ---------------------------------------------------------------------------

  const readOlder = useCallback(async (kitStarted: boolean) => {
    if (refs.isFetchingPrevRef.current || !refs.managerRef.current) return;
    refs.isFetchingPrevRef.current = true;
    const gen = refs.generationRef.current;

    const offlineOnForThisRead = isOfflineOn();
    // Kill switch, at the next operation: rows the offline path left unsent
    // turn failed (direct) once offline is off (no-op for a list that never
    // used the offline path).
    if (!offlineOnForThisRead) failStrandedSends(offlineContext());
    if (offlineOnForThisRead) {
      // Offline path: two-phase; offline past the cache shows the
      // "Connect to load older messages" footer, never an error.
      dispatch({ type: 'FETCH_PREVIOUS_START' });
      try {
        const page = await readPageOffline(
          offlineContext(),
          refs.managerRef.current,
          'previous',
          gen
        );
        // The "Connect to load more" footer is unchanged: offline past the cache with rows shown
        // is silent. With nothing on screen the read reports; over rows a real error reports
        // unless the kit started the read (D84).
        if (
          !page.stale &&
          page.error !== undefined &&
          reportsReadError(
            page.notConnected,
            refs.stateRef.current.messages.length > 0,
            false,
            kitStarted
          )
        ) {
          onError?.(page.error as CometChat.CometChatException);
        }
      } finally {
        refs.isFetchingPrevRef.current = false;
      }
      return;
    }

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
  }, [onError, refs, dispatch, offlineContext]);
  const fetchPrevious = useCallback(() => readOlder(false), [readOlder]);

  // ---------------------------------------------------------------------------
  // Fetch next (newer messages)
  // ---------------------------------------------------------------------------

  const readNewer = useCallback(async (kitStarted: boolean) => {
    if (refs.isFetchingNextRef.current || !refs.managerRef.current) return;
    refs.isFetchingNextRef.current = true;
    const gen = refs.generationRef.current;

    const offlineOnForThisRead = isOfflineOn();
    // Kill switch, at the next operation (see fetchPrevious).
    if (!offlineOnForThisRead) failStrandedSends(offlineContext());
    if (offlineOnForThisRead) {
      // Offline path: two-phase newer page.
      dispatch({ type: 'FETCH_NEXT_START' });
      try {
        const page = await readPageOffline(offlineContext(), refs.managerRef.current, 'next', gen);
        if (!page.stale && page.moreOnServer === false) {
          dispatch({ type: 'SET_HAS_REACHED_LATEST', hasReachedLatest: true });
        }
        // The "Connect to load more" footer is unchanged: offline past the cache with rows shown
        // is silent. With nothing on screen the read reports; over rows a real error reports
        // unless the kit started the read (D84).
        if (
          !page.stale &&
          page.error !== undefined &&
          reportsReadError(
            page.notConnected,
            refs.stateRef.current.messages.length > 0,
            false,
            kitStarted
          )
        ) {
          onError?.(page.error as CometChat.CometChatException);
        }
      } finally {
        refs.isFetchingNextRef.current = false;
      }
      return;
    }

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
  }, [onError, refs, dispatch, offlineContext]);
  const fetchNext = useCallback(() => readNewer(false), [readNewer]);

  // ---------------------------------------------------------------------------
  // Offline: a blocked edge loads by itself when the connection returns (D84 rule 9)
  // ---------------------------------------------------------------------------

  /**
   * The connection is back: an edge that stopped at "Connect to load more" loads its page once,
   * with no tap. It waits for the reads in flight to settle, and loads only while the window is
   * unchanged and the edge is still blocked: older first, newer after it settles. A jump in
   * flight loads none. The kit started it, so a real error over rows stays silent.
   */
  const loadBlockedEdges = useCallback(async () => {
    const gen = refs.generationRef.current;
    const blocked = (edge: 'offlineFooter' | 'offlineNewerFooter') =>
      refs.generationRef.current === gen &&
      !refs.stateRef.current.offlineScrollAnchor &&
      refs.stateRef.current[edge] === 'connect_to_load_more';
    const settled = async () => {
      const busy = () => refs.isFetchingPrevRef.current || refs.isFetchingNextRef.current;
      for (let tries = 0; tries < EDGE_SETTLE_MAX_TRIES && busy(); tries += 1) {
        await new Promise<void>(resolve => {
          setTimeout(resolve, EDGE_SETTLE_POLL_MS);
        });
      }
      return !busy();
    };
    if (!(await settled())) return;
    if (blocked('offlineFooter')) {
      // The page lands as a prepend: record the bookkeeping first, as the top sentinel
      // and the scroll retry at the footer do, so the rows the user is reading stay
      // where they are instead of the viewport moving with the page.
      refs.markOlderPrependRef?.current?.();
      await readOlder(true);
    }
    if ((await settled()) && blocked('offlineNewerFooter')) await readNewer(true);
  }, [refs, readOlder, readNewer]);
  if (refs.reconnectEdgesRef) {
    refs.reconnectEdgesRef.current = () => {
      void loadBlockedEdges();
    };
  }

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
    const loggedInUserId = refs.optionsRef.current.loggedInUser?.getUid();
    if (senderId === loggedInUserId) {
      return;
    }

    // Check if already read — readAt > 0 means it's been read
    const readAt = lastMsg.getReadAt();
    if (readAt && readAt > 0) {
      return;
    }

    const offlineOn = isOfflineOn();
    refs.managerRef.current
      .markConversationAsRead()
      // Offline: sent again after the next sync (AC-7.4).
      .catch(
        offlineOn
          ? () => {
              rememberOfflineRead(offlineContext());
            }
          : noop
      );

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
  }, [refs, dispatch, publish, parentMessageId, offlineContext]);

  const scrollToMessage = useCallback(
    (messageId: number) => {
      dispatch({ type: 'SET_SCROLL_TO_MESSAGE', messageId });
    },
    [dispatch]
  );

  const goToMessage = useCallback(
    async (messageId: number, highlight = true, resetFirst = false) => {
      // Check if message is already loaded
      const existing = refs.stateRef.current.messages.find(m => m.getId() === messageId);
      if (existing) {
        dispatch({ type: 'SET_SCROLL_TO_MESSAGE', messageId, highlight });
        return;
      }

      // Not loaded — show loading state and re-fetch around the target
      if (!refs.managerRef.current) return;

      // Offline, over rows: look the target up first and replace the rows only once it is
      // found. Not found keeps the rows as they are, with no loader, error or scroll; only a
      // real error reaches onError (Android jumpLocked → showRowsOrError).
      let target: CometChat.BaseMessage | null | undefined;
      if (isOfflineOn() && !resetFirst && refs.stateRef.current.messages.length > 0) {
        const seq = (jumpSeqRef.current += 1);
        const before = refs.generationRef.current;
        let failure: unknown;
        target = await refs.managerRef.current.getMessageDetailsTwoPhase(messageId, error => {
          failure = error;
        });
        // A later jump, a chat switch or a new window took over meanwhile.
        if (jumpSeqRef.current !== seq || refs.generationRef.current !== before) return;
        if (!target) {
          if (failure !== undefined && !isNotConnectedError(failure)) {
            onError?.(failure as CometChat.CometChatException);
          }
          return;
        }
      }

      // A new window: an older-page read still in flight must not land in it.
      refs.generationRef.current += 1;
      // Show loading shimmer while fetching
      dispatch({ type: 'RESET' });
      dispatch({ type: 'FETCH_PREVIOUS_START' });

      const gen = refs.generationRef.current;

      if (isOfflineOn()) {
        // Offline path: the window around the target, two-phase.
        const around = await fetchAroundOffline(
          offlineContext(),
          refs.managerRef.current,
          messageId,
          gen,
          highlight,
          target
        );
        // D84: a jump that could not load reports once with nothing on screen, offline too;
        // over rows only a real error does.
        if (
          !around.stale &&
          around.error !== undefined &&
          reportsReadError(around.notConnected === true, around.rows.length > 0, false, false)
        ) {
          onError?.(around.error as CometChat.CometChatException);
        }
        return;
      }

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
    [onError, refs, dispatch, offlineContext]
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
      // Its restores below follow goToMessage's RESET, so the reset comes first.
      void goToMessage(currentState.lastReadMessageId, false, true);
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

      const newManager = new CometChatMessageListManager(managerOptions());
      refs.managerRef.current = newManager;

      const gen = refs.generationRef.current;

      if (isOfflineOn()) {
        // Offline path: the newest page, two-phase.
        const ctx = offlineContext();
        void readPageOffline(ctx, newManager, 'previous', gen).then(page => {
          if (page.stale) return;
          // D84: this reload (scroll to the latest) reports a failed read once with nothing on
          // screen, offline too; over rows only a real error does.
          if (
            page.error !== undefined &&
            reportsReadError(
              page.notConnected,
              page.cachedPage.length > 0 || refs.stateRef.current.messages.length > 0,
              false,
              false
            )
          ) {
            onError?.(page.error as CometChat.CometChatException);
          }
          dispatch({ type: 'SET_HAS_REACHED_LATEST', hasReachedLatest: true });
          dispatch({ type: 'CLEAR_NEW_MESSAGE_COUNT' });
          dispatch({ type: 'SET_AT_BOTTOM', isAtBottom: true });
          if (!wasMarkedUnreadByUser) {
            dispatch({ type: 'SET_UNREAD_COUNT', count: 0 });
            newManager.markConversationAsRead().catch(() => {
              rememberOfflineRead(ctx);
            });
            dispatch({ type: 'SET_CONVERSATION_READ' });
          }
        });
        return 'refetching' as const;
      }

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
    managerOptions,
    onError,
    markConversationAsReadIfUnread,
    goToMessage,
    refs,
    dispatch,
    offlineContext,
  ]);

  // Offline support: "Jump to latest" after a sweep that missed more than a page.
  const offlineJumpToLatest = useCallback(() => {
    jumpToLatest(offlineContext());
  }, [offlineContext]);

  return {
    fetchPrevious,
    fetchNext,
    setAtBottom,
    clearNewMessageCount,
    markConversationAsReadIfUnread,
    scrollToMessage,
    goToMessage,
    scrollToBottom,
    offlineJumpToLatest,
  };
}
