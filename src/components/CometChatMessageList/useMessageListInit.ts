import { useEffect } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatMessageListManager } from './CometChatMessageListManager';
import type { CometChatMessageListManagerOptions } from './CometChatMessageList.types';
import { shouldMarkConversationRead } from './CometChatMessageList.utils';
import { noop } from './messageListHelpers';
import { usePublishEvent } from '../../context/CometChatEventsContext';
import type { MessageListRefs, MessageListDispatch } from './messageListRefs';
import { isOfflineOn } from '../../utils/offline/gate';
import { reportsReadError } from '../../utils/offline/entityList';
import {
  fetchAroundOffline,
  readPageOffline,
  rememberOfflineRead,
  rowsOf,
  type OfflineListContext,
} from './messageListOffline';

// ---------------------------------------------------------------------------
// Initialization sub-hook
// ---------------------------------------------------------------------------

export interface UseMessageListInitOptions {
  user: CometChat.User | undefined;
  group: CometChat.Group | undefined;
  loggedInUser: CometChat.User;
  messagesRequestBuilder: CometChat.MessagesRequestBuilder | undefined;
  parentMessageId: number | undefined;
  startFromUnreadMessages: boolean;
  goToMessageId: number | undefined;
  messageTypes: string[] | undefined;
  messageCategories: string[];
  onError: ((error: CometChat.CometChatException) => void) | null | undefined;
  /**
   * When true and no parentMessageId is set, skip the initial fetch and show
   * the empty state immediately
   * isAgentChat && !parentMessageId → States.empty, hasCompletedInitialLoad=true
   */
  isAgentChat?: boolean;
  /**
   * When true (and isAgentChat && !parentMessageId), show loading state instead
   * of empty state — the AI history sidebar will load the last conversation and
   * set parentMessageId, which re-triggers init.
   */
  loadLastAgentConversation?: boolean;
  onActiveChatChanged:
    | ((data: {
        user?: CometChat.User;
        group?: CometChat.Group;
        message?: CometChat.BaseMessage;
        unreadMessageCount?: number;
      }) => void)
    | undefined;
}

/**
 * Initialization effect for the message list.
 *
 * Core initialization logic. Extracted so it can be called from both
 * the initialization effect and the connection/connected handler.
 *
 * Creates a CometChatMessageListManager, fetches conversation unread info,
 * determines the target message (goToMessageId, startFromUnread, or latest),
 * fetches messages around the target, marks as delivered/read, and invokes
 * the onActiveChatChanged callback.
 */
export function useMessageListInit(
  options: UseMessageListInitOptions,
  refs: MessageListRefs,
  dispatch: MessageListDispatch
): void {
  const {
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
    loadLastAgentConversation,
    onActiveChatChanged,
  } = options;

  const publish = usePublishEvent();

  useEffect(() => {
    if (!user && !group) return;

    // The message list only fetches when a parentMessageId (thread) is provided.
    if (isAgentChat && !parentMessageId) {
      dispatch({ type: 'RESET' });
      if (loadLastAgentConversation) {
        // Show loading state — the AI history sidebar will load the last
        // conversation and set parentMessageId, which re-triggers this effect.
        dispatch({ type: 'FETCH_PREVIOUS_START' });
      } else {
        // No last conversation to load — show empty state immediately
        dispatch({ type: 'FETCH_PREVIOUS_SUCCESS', messages: [], hasMore: false });
        dispatch({ type: 'SET_HAS_REACHED_LATEST', hasReachedLatest: true });
      }
      return;
    }

    refs.generationRef.current += 1;
    dispatch({ type: 'RESET' });

    // The manager reads each option only when it is set.
    const managerOpts: CometChatMessageListManagerOptions = {
      user,
      group,
      builder: messagesRequestBuilder,
      parentMessageId,
      messageTypes,
      messageCategories,
      isAgentChat,
    };

    const initialManager = new CometChatMessageListManager(managerOpts);
    refs.managerRef.current = initialManager;
    refs.groupRef.current = group;

    let aborted = false;

    // `manager` and `gen` are parameters, not closure constants: the reconnect
    // path re-runs this after it has bumped the generation and replaced the
    // manager, so a captured copy would make every re-run bail out as stale.
    const initialize = async (manager: CometChatMessageListManager, gen: number) => {
      // Offline support: read once for this initialization (README §3.1).
      const offlineOn = isOfflineOn();
      const offlineCtx: OfflineListContext = {
        refs,
        dispatch,
        publish,
        user,
        group,
        parentMessageId,
        loggedInUser,
        isAgentChat: isAgentChat ?? false,
        makeManager: () => new CometChatMessageListManager(managerOpts),
      };
      try {
        let lastReadId: number | null = null;
        let convUnreadCount = 0;

        // Fetch conversation for unread info (non-thread mode)
        if (!parentMessageId) {
          try {
            // Offline path: two-phase, so a cached chat opens at once, offline too.
            const conversation = offlineOn
              ? await manager.getConversationTwoPhase()
              : await manager.getConversation();
            if (aborted || refs.generationRef.current !== gen) return;
            if (conversation) {
              const rawLastRead = conversation.getLastReadMessageId();
              lastReadId = rawLastRead ? Number(rawLastRead) : null;
              convUnreadCount = conversation.getUnreadMessageCount() || 0;
            }
          } catch {
            // Proceed without unread info
          }
        }
        if (aborted || refs.generationRef.current !== gen) return;

        // Determine target message
        let target: number | null = null;
        if (goToMessageId) {
          target = goToMessageId;
        } else if (startFromUnreadMessages && lastReadId && convUnreadCount > 0) {
          target = lastReadId;
        }
        let fetchedMessages: CometChat.BaseMessage[] = [];

        if (target && offlineOn) {
          // Offline path: the window around the target, two-phase (cached first).
          dispatch({ type: 'FETCH_PREVIOUS_START' });
          // The open's own read holds both paging flags until it settles (a scroll
          // meanwhile must not start a second read on the same request).
          refs.isFetchingPrevRef.current = true;
          refs.isFetchingNextRef.current = true;
          let around: Awaited<ReturnType<typeof fetchAroundOffline>>;
          try {
            around = await fetchAroundOffline(
              offlineCtx,
              manager,
              target,
              gen,
              Boolean(goToMessageId) && goToMessageId === target
            );
          } finally {
            refs.isFetchingPrevRef.current = false;
            refs.isFetchingNextRef.current = false;
          }
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          if (aborted || around.stale) return;
          fetchedMessages = around.rows;
          // D84: a jump that could not load reports once with nothing on screen, offline too;
          // over rows only a real error does.
          if (
            around.error !== undefined &&
            reportsReadError(around.notConnected === true, fetchedMessages.length > 0, false, false)
          ) {
            onError?.(around.error as CometChat.CometChatException);
          }
        } else if (target) {
          // Fetch around the target message (bidirectional)
          // Dispatch loading state so the View shows the shimmer
          dispatch({ type: 'FETCH_PREVIOUS_START' });
          try {
            const result = await manager.fetchAroundMessageId(target);
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (aborted || refs.generationRef.current !== gen) return;

            fetchedMessages = result.messages;
            dispatch({
              type: 'FETCH_AROUND_SUCCESS',
              messages: result.messages,
              targetMessageId: target,
              hasMore: result.messages.length > 0,
              hasMoreNewer: result.hasMoreNewer,
              // Only flash the highlight when the user explicitly jumped to a
              // message (goToMessageId). For a startFromUnread anchor we scroll
              // to lastRead silently.
              highlight: Boolean(goToMessageId) && goToMessageId === target,
            });
          } catch (fetchError) {
            console.warn('[MessageList INIT] fetchAroundMessageId failed:', fetchError);
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (aborted || refs.generationRef.current !== gen) return;
            // If fetching around a target fails (e.g., message doesn't exist in a
            // newly created group), fall back to showing empty state.
            dispatch({
              type: 'FETCH_PREVIOUS_SUCCESS',
              messages: [],
              hasMore: false,
            });
            dispatch({ type: 'SET_HAS_REACHED_LATEST', hasReachedLatest: true });
          }

          // hasReachedLatest is set by the reducer based on hasMoreNewer
          // (FETCH_AROUND_SUCCESS sets hasReachedLatest = !hasMoreNewer)
        } else if (offlineOn) {
          // Offline path: the newest page, two-phase: the device cache paints
          // first and the server page then replaces the same slice.
          dispatch({ type: 'FETCH_PREVIOUS_START' });
          // The open's own read holds the older-read flag until it settles, so a
          // scroll up during the server phase cannot start a second read.
          refs.isFetchingPrevRef.current = true;
          let page: Awaited<ReturnType<typeof readPageOffline>>;
          try {
            page = await readPageOffline(offlineCtx, manager, 'previous', gen);
          } finally {
            refs.isFetchingPrevRef.current = false;
          }
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          if (aborted || page.stale) return;
          fetchedMessages = rowsOf(page);
          // D84: the open reports a failed read with nothing on screen, "not connected"
          // included; over saved rows only a real error reaches onError (offline is silent).
          if (
            page.error !== undefined &&
            reportsReadError(page.notConnected, fetchedMessages.length > 0, false, false)
          ) {
            onError?.(page.error as CometChat.CometChatException);
          }
          // Agent chat shows the parent question with its thread, as today.
          if (isAgentChat && parentMessageId && fetchedMessages.length > 0) {
            try {
              const { CometChat } = await import('@cometchat/chat-sdk-javascript');
              const parentMsg = await CometChat.getMessageDetails(String(parentMessageId));
              if (refs.generationRef.current === gen) {
                dispatch({ type: 'OFFLINE_UPSERT', messages: [parentMsg] });
                fetchedMessages = [parentMsg, ...fetchedMessages];
              }
            } catch {
              // Offline or gone: proceed without the parent message
            }
          }
          dispatch({ type: 'SET_HAS_REACHED_LATEST', hasReachedLatest: true });
        } else {
          // Normal latest-message init
          dispatch({ type: 'FETCH_PREVIOUS_START' });
          try {
            const messages = await manager.fetchPrevious();
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (aborted || refs.generationRef.current !== gen) return;

            fetchedMessages = messages;

            // In agent chat with parentMessageId: the parent message (user's question)
            // is not included in thread replies. Fetch it separately and prepend.
            if (isAgentChat && parentMessageId && fetchedMessages.length > 0) {
              try {
                const { CometChat } = await import('@cometchat/chat-sdk-javascript');
                const parentMsg = await CometChat.getMessageDetails(String(parentMessageId));
                if (refs.generationRef.current === gen) {
                  // Only prepend if not already in the list
                  const alreadyInList = fetchedMessages.some(m => m.getId() === parentMsg.getId());
                  if (!alreadyInList) {
                    fetchedMessages = [parentMsg, ...fetchedMessages];
                  }
                }
              } catch {
                // Non-fatal — proceed without the parent message
              }
            }

            dispatch({
              type: 'FETCH_PREVIOUS_SUCCESS',
              messages: fetchedMessages,
              hasMore: fetchedMessages.length > 0,
            });
          } catch (fetchError) {
            console.warn('[MessageList INIT] fetchPrevious failed:', fetchError);
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (aborted || refs.generationRef.current !== gen) return;
            const errorMessage =
              fetchError instanceof Error ? fetchError.message : 'Failed to load messages';
            dispatch({ type: 'FETCH_PREVIOUS_ERROR', error: errorMessage });
          }

          // Normal init — we're at the latest
          dispatch({ type: 'SET_HAS_REACHED_LATEST', hasReachedLatest: true });
        }

        // Mark last message as delivered if it's from another user
        if (fetchedMessages.length > 0) {
          const lastMsg = fetchedMessages[fetchedMessages.length - 1];
          if (lastMsg && lastMsg.getSender().getUid() !== loggedInUser.getUid()) {
            manager.markAsDelivered(lastMsg).catch(noop);
          }
        }

        // Mark conversation as read if appropriate
        const shouldMarkRead = shouldMarkConversationRead(
          fetchedMessages,
          lastReadId,
          convUnreadCount,
          parentMessageId
        );
        if (shouldMarkRead) {
          manager
            .markConversationAsRead()
            // Offline: the SDK clears the cached unread count; the server hears
            // about it after the next sync (AC-7.4).
            .catch(
              offlineOn
                ? () => {
                    rememberOfflineRead(offlineCtx);
                  }
                : noop
            );

          const lastFetchedMsg = fetchedMessages[fetchedMessages.length - 1];
          if (lastFetchedMsg) {
            publish({
              type: 'ui:conversation/read',
              conversationId: lastFetchedMsg.getConversationId(),
            });
          }

          // Set readAt locally on the last message so markConversationAsReadIfUnread
          // won't re-trigger when the observer fires after initial scroll to bottom
          if (fetchedMessages.length > 0) {
            const lastMsg = fetchedMessages[fetchedMessages.length - 1];
            if (lastMsg && lastMsg.getSender().getUid() !== loggedInUser.getUid()) {
              const now = Math.floor(Date.now() / 1000);
              lastMsg.setReadAt(now);
            }
          }
        }

        // Set unread tracking state
        if (lastReadId) {
          dispatch({ type: 'SET_LAST_READ_MESSAGE_ID', messageId: lastReadId });
        }
        // Show unread banner if init went to lastRead (startFromUnreadMessages)
        if (target !== null && target === lastReadId) {
          dispatch({ type: 'SET_SHOW_UNREAD_BANNER', value: true });
        }
        if (shouldMarkRead) {
          // Conversation was marked as read — clear unread count
          dispatch({ type: 'SET_UNREAD_COUNT', count: 0 });
        } else if (convUnreadCount > 0) {
          dispatch({ type: 'SET_UNREAD_COUNT', count: convUnreadCount });
        }

        // Invoke onActiveChatChanged callback and publish UI event
        if (!parentMessageId) {
          const activeChatData: {
            user?: CometChat.User;
            group?: CometChat.Group;
            message?: CometChat.BaseMessage;
            unreadMessageCount?: number;
          } = { unreadMessageCount: convUnreadCount };
          if (user) activeChatData.user = user;
          if (group) activeChatData.group = group;
          if (fetchedMessages.length > 0) {
            const lastFetched = fetchedMessages[fetchedMessages.length - 1];
            if (lastFetched) activeChatData.message = lastFetched;
          }
          publish({ type: 'ui:active-chat/changed', ...activeChatData });
          if (onActiveChatChanged) {
            onActiveChatChanged(activeChatData);
          }
        }
      } catch (error) {
        if (aborted || refs.generationRef.current !== gen) return;
        console.error('[MessageList INIT] Initialization failed:', error);
        dispatch({
          type: 'FETCH_PREVIOUS_ERROR',
          error: error instanceof Error ? error.message : 'Initialization failed',
        });
        onError?.(error as CometChat.CometChatException);
      }
    };

    // Store initialize so connection/connected can call it. It runs against the
    // manager and generation current at call time (the caller has just replaced
    // the manager and bumped the generation).
    refs.initializeRef.current = () => {
      const manager = refs.managerRef.current ?? new CometChatMessageListManager(managerOpts);
      refs.managerRef.current = manager;
      void initialize(manager, refs.generationRef.current);
    };

    void initialize(initialManager, refs.generationRef.current);

    return () => {
      aborted = true;
      refs.generationRef.current += 1;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.getUid(), group?.getGuid(), goToMessageId, startFromUnreadMessages]);
}
