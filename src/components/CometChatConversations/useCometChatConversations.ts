/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-unnecessary-type-conversion */
import { useCallback, useEffect, useId, useReducer, useRef, useState } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatConversationsManager } from './CometChatConversationsManager';
import { usePinConversationActions } from '../../hooks/usePinConversationActions';
import { conversationsReducer, initialConversationsState } from './CometChatConversations.reducer';
import { CometChatSoundManager } from '../../resources/CometChatSoundManager/CometChatSoundManager';
import type {
  CometChatUseCometChatConversationsOptions,
  CometChatUseCometChatConversationsReturn,
} from './CometChatConversations.types';
import { CometChatLogger } from '../../utils/CometChatLogger';
import { useCometChatConversationsEvents } from './useCometChatConversationsEvents';
import { usePublishEvent } from '../../hooks/usePublishEvent';
import { isOfflineOn } from '../../utils/offline/gate';
import { useDeferredLoadMore } from '../../utils/offline/useDeferredLoadMore';
import { isSyncDelivered } from '../../utils/offline/identity';
import { OfflineHub } from '../../utils/offline/hub';
import { fetchTwoPhase } from '../../utils/offline/two-phase';
import { carriesKeyword, reportsReadError } from '../../utils/offline/entityList';
import {
  applyRemotePinEvent,
  findByPinKey,
  foldOntoListedRow,
  keepReadsMadeOffline,
  requestNarrows,
  rowFromMessageOffline,
  strandedPreviewRows,
} from './conversationsOffline';
import { CometChatUIKitUtility } from '../../utils/CometChatUIKitUtility';
import { peerIdOf } from './CometChatConversations.utils';
import {
  runGroupListener,
  sweptGroupEventsForUser,
  type GroupListenerCallbacks,
} from '../../utils/offline/groupActions';

/** Most pages one offline load-more reads while its pages list no new row. */
const MAX_OFFLINE_READ_ON = 10;

/**
 * useCometChatConversations — orchestration hook for the conversations list data layer.
 *
 * Creates the Manager, attaches SDK listeners, dispatches reducer actions,
 * and exposes a clean API to the Provider.
 */
export function useCometChatConversations(
  options: CometChatUseCometChatConversationsOptions = {}
): CometChatUseCometChatConversationsReturn {
  const {
    conversationsRequestBuilder,
    searchRequestBuilder,
    searchKeyword = '',
    hideUserStatus = false,
    disableSoundForMessages = false,
    customSoundForMessages,
    selectionMode = 'none',
    activeConversation,
    onError,
    onEmpty,
    onSelect,
    onItemClick,
  } = options;

  const [state, dispatch] = useReducer(conversationsReducer, initialConversationsState);
  const managerRef = useRef<CometChatConversationsManager | null>(null);
  const fetchIdRef = useRef<string>('');
  const instanceId = useId();
  const anchorIndexRef = useRef<number | null>(null);
  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null);
  /**
   * `id` increments on every raise so that two identical toasts in a row — pin one
   * conversation, pin another — are distinguishable. Keyed on it, the toast
   * remounts and restarts its dismiss timer instead of silently reusing the first
   * one's remaining time.
   */
  const [pinToast, setPinToast] = useState<{
    id: number;
    text: string;
    variant: 'default' | 'error';
  }>({ id: 0, text: '', variant: 'default' });
  const showPinToast = useCallback((text: string, variant: 'default' | 'error' = 'default') => {
    setPinToast(previous => ({ id: previous.id + 1, text, variant }));
  }, []);
  const clearPinToast = useCallback(() => {
    setPinToast(previous => ({ ...previous, text: '' }));
  }, []);
  const pinActions = usePinConversationActions({ showToast: showPinToast });

  const [conversationToBeDeleted, setConversationToBeDeleted] =
    useState<CometChat.Conversation | null>(null);
  const publish = usePublishEvent();

  // --- Get logged-in user ---
  useEffect(() => {
    CometChat.getLoggedinUser()
      .then(user => {
        if (user) {
          setLoggedInUserId(user.getUid());
        }
      })
      .catch(() => {
        // Silently fail — receipts just won't show
      });
  }, []);

  // --- Error handler ---
  const handleError = useCallback(
    (error: unknown) => {
      if (onError) onError(error as CometChat.CometChatException);
      const message = error instanceof Error ? error.message : 'Unknown error';
      dispatch({ type: 'FETCH_ERROR', error: message });
    },
    [onError]
  );

  // --- Build request builder with search ---
  const buildRequestBuilder = useCallback(
    (search: string): CometChat.ConversationsRequestBuilder => {
      let builder: CometChat.ConversationsRequestBuilder;

      if (search && searchRequestBuilder) {
        builder = searchRequestBuilder;
      } else if (conversationsRequestBuilder) {
        builder = conversationsRequestBuilder;
      } else {
        builder = new CometChat.ConversationsRequestBuilder().setLimit(30);
      }

      return builder;
    },
    [conversationsRequestBuilder, searchRequestBuilder]
  );

  /** Set once this list ran an offline-path read; scopes session cleanup. */
  const offlineUsedRef = useRef(false);
  /** The offline page read still waiting for its server phase, if any. */
  const offlineReadInFlightRef = useRef<object | null>(null);
  /** The offline state on screen: the next reconnect reloads the list (D84). */
  const reloadOnConnectRef = useRef(false);
  /** The search keyword of the request the list last loaded, for that reload. */
  const loadedSearchRef = useRef('');
  const errorViewRef = useRef(false);
  /** Set when an offline read past the cache closed paging; reopened on reconnect (R5). */
  const pagingClosedOfflineRef = useRef(false);

  /**
   * Offline path: one two-phase page read (cached page first, server page
   * replaces it). Offline past the cache keeps the saved chats. Resolves to
   * the server page, if one landed for this read. `automatic`: the list started
   * this read itself (reconnect, sync), not the user; a failure of it with chats
   * on screen stays quiet. `merge`: the server page of page one merges into the
   * rows shown instead of replacing them (the kit's own re-read after a sync).
   */
  const fetchPageOffline = useCallback(
    (
      manager: CometChatConversationsManager,
      fetchId: string,
      first: boolean,
      automatic = false,
      merge = false
    ) => {
      offlineUsedRef.current = true;
      if (first) reloadOnConnectRef.current = false;
      const stale = () => fetchIdRef.current !== fetchId;
      let cachedIds: string[] = [];
      let serverPage: CometChat.Conversation[] | undefined;
      // The cached page ends the loading state before the server page lands;
      // no second page read may start on the same request meanwhile.
      const token = {};
      offlineReadInFlightRef.current = token;
      // Cleared when the server phase lands, so a load-more asked for meanwhile runs.
      const settle = () => {
        if (offlineReadInFlightRef.current === token) offlineReadInFlightRef.current = null;
      };
      const read = fetchTwoPhase<CometChat.Conversation>(
        manager.request(),
        'next',
        'conversations',
        {
          onCached: page => {
            if (stale()) return;
            cachedIds = page.map(c => c.getConversationId());
            dispatch({ type: 'OFFLINE_PAGE', phase: 'cached', first, conversations: page });
          },
          onServer: page => {
            settle();
            if (stale()) return;
            serverPage = page;
            // A merge over chats on screen never empties them (D17): not an empty list.
            const keepsShown = merge && conversationsRef.current.length > 0;
            dispatch({
              type: 'OFFLINE_PAGE',
              phase: 'server',
              first,
              conversations: page,
              cachedIds,
              ...(merge && { merge }),
            });
            if (first && page.length === 0 && !keepsShown) onEmpty?.();
          },
          onError: (error, notConnected) => {
            settle();
            if (stale()) return;
            // A cached page painted in this same tick may not have reached the ref yet.
            const shown = conversationsRef.current.length > 0 || cachedIds.length > 0;
            // Quiet: chats stay, no error view or onError; the next reconnect retries.
            if (automatic && !notConnected && shown) return;
            // D84: the first page of a load (open, search, reload) reports a real error, and with
            // nothing on screen "not connected" too (the offline state); offline over chats and
            // an offline keyword search are silent. A load-more page keeps its footer and reports
            // only what the server answered.
            const keyword = carriesKeyword(loadedSearchRef.current, manager.request());
            const reportable = first
              ? reportsReadError(notConnected, shown, keyword, automatic)
              : !notConnected;
            if (reportable) onError?.(error as CometChat.CometChatException);
            // "Connect to search" is the empty state, so it reports `onEmpty` like any empty list.
            if (first && notConnected && keyword && !shown) onEmpty?.();
            // An offline state shown because the device was offline reads again on reconnect.
            if (first) reloadOnConnectRef.current = notConnected && !shown;
            if (notConnected && cachedIds.length === 0) pagingClosedOfflineRef.current = true;
            dispatch({
              type: 'OFFLINE_PAGE_ERROR',
              notConnected,
              error: error instanceof Error ? error.message : 'Unknown error',
              // A cached page, even empty, never ends the list; past the cache, stop.
              hasMore: cachedIds.length > 0,
              keyword,
            });
          },
        }
      );
      return read.finally(settle).then(() => serverPage);
    },
    [onEmpty, onError]
  );

  /**
   * Offline path of a load-more. A server page that lists no new row (the
   * reconnect sync already listed them) is not the end: the read goes on, up to
   * MAX_OFFLINE_READ_ON pages, or the list stops growing with its scroll
   * trigger already spent (R5).
   */
  const readNextOffline = useCallback(
    async (manager: CometChatConversationsManager, fetchId: string, automatic = false) => {
      const listed = new Set(conversationsRef.current.map(c => c.getConversationId()));
      for (let reads = 0; reads < MAX_OFFLINE_READ_ON; reads++) {
        const page = await fetchPageOffline(manager, fetchId, false, automatic);
        if (fetchIdRef.current !== fetchId || !page?.length) return;
        if (page.some(c => !listed.has(c.getConversationId()))) return;
      }
    },
    [fetchPageOffline]
  );
  const readNextOfflineRef = useRef(readNextOffline);
  readNextOfflineRef.current = readNextOffline;

  /**
   * Kill switch (offline turned off mid-session), at the next operation: the
   * previews the offline path left unsent will never send now, so they show
   * failed (direct), as the message list's rows do. Only a list that used the
   * offline path does anything.
   */
  const failStrandedPreviews = useCallback(() => {
    if (!offlineUsedRef.current) return;
    const stranded = strandedPreviewRows(conversationsRef.current);
    if (stranded.length === 0) return;
    const hub = OfflineHub.getInstance();
    for (const conversation of stranded) {
      const last = conversation.getLastMessage() as CometChat.BaseMessage;
      hub.markDirectFailed(last, '');
      // A fresh reference so the row re-renders its preview mark.
      dispatch({
        type: 'UPDATE_CONVERSATION',
        conversation: CometChatUIKitUtility.clone(conversation),
      });
    }
  }, []);

  // --- Fetch next page ---
  const latestFetchNextRef = useRef<() => Promise<void>>(() => Promise.resolve());
  const deferFetchNext = useDeferredLoadMore(
    () => latestFetchNextRef.current(),
    offlineReadInFlightRef
  );
  const fetchNext = useCallback(async () => {
    if (!managerRef.current || !state.hasMore || state.fetchState === 'loading') return;
    // Offline path: a page read still waiting for its server phase. A load-more
    // asked for now runs once that read lands; it is never dropped.
    if (offlineReadInFlightRef.current !== null) {
      deferFetchNext();
      return;
    }

    const currentFetchId = `fetch_${String(Date.now())}`;
    fetchIdRef.current = currentFetchId;
    dispatch({ type: 'FETCH_START' });

    if (isOfflineOn()) {
      await readNextOffline(managerRef.current, currentFetchId);
      return;
    }
    failStrandedPreviews();

    try {
      const conversations = await managerRef.current.fetchNext();
      // Guard against stale fetches
      if (fetchIdRef.current !== currentFetchId) return;

      const hasMore = conversations.length > 0;
      dispatch({ type: 'FETCH_SUCCESS', conversations, hasMore });

      // Emit onEmpty if first fetch returned no results
      if (!hasMore && state.conversations.length === 0) {
        onEmpty?.();
      }
    } catch (error: unknown) {
      if (fetchIdRef.current !== currentFetchId) return;
      handleError(error);
    }
  }, [
    state.hasMore,
    state.fetchState,
    state.conversations.length,
    handleError,
    onEmpty,
    readNextOffline,
    failStrandedPreviews,
    deferFetchNext,
  ]);
  latestFetchNextRef.current = fetchNext;

  // --- Initialize Manager + first fetch ---
  const initializeAndFetch = useCallback(
    (search: string, automatic = false) => {
      const builder = buildRequestBuilder(search);
      loadedSearchRef.current = search;
      managerRef.current = new CometChatConversationsManager(builder);
      pagingClosedOfflineRef.current = false;
      dispatch({ type: 'RESET' });
      // Trigger fetch after reset
      const currentFetchId = `fetch_${String(Date.now())}`;
      fetchIdRef.current = currentFetchId;
      dispatch({ type: 'FETCH_START' });

      if (isOfflineOn()) {
        // Offline path: the cached page paints first, the server page replaces it.
        void fetchPageOffline(managerRef.current, currentFetchId, true, automatic);
        return;
      }

      managerRef.current
        .fetchNext()
        .then(conversations => {
          if (fetchIdRef.current !== currentFetchId) return;
          const hasMore = conversations.length > 0;
          dispatch({ type: 'FETCH_SUCCESS', conversations, hasMore });
          if (!hasMore) onEmpty?.();
        })
        .catch((error: unknown) => {
          if (fetchIdRef.current !== currentFetchId) return;
          handleError(error);
        });
    },
    [buildRequestBuilder, handleError, onEmpty, fetchPageOffline]
  );

  // --- Initial fetch on mount and when builders change ---
  useEffect(() => {
    initializeAndFetch(searchKeyword);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationsRequestBuilder, searchRequestBuilder, searchKeyword]);

  // --- Set search text (triggers re-fetch) ---
  const setSearchText = useCallback(
    (text: string) => {
      dispatch({ type: 'SET_SEARCH_TEXT', searchText: text });
      initializeAndFetch(text);
    },
    [initializeAndFetch]
  );

  // --- Ref to hold current conversations for use in event handlers without re-attaching listeners ---
  const conversationsRef = useRef(state.conversations);
  conversationsRef.current = state.conversations;

  // --- Message listener (real-time updates) ---
  useEffect(() => {
    const listenerId = `CometChatConversations_msg_${instanceId}`;

    /**
     * Determines whether a message should be hidden from this conversation list
     * based on the request builder's agentic filters (onlyAgentic / hideAgentic).
     */
    const shouldHideMessage = (message: CometChat.BaseMessage): boolean => {
      const builder = conversationsRequestBuilder;
      if (!builder) return false;

      const builtRequest = builder.build();
      const isOnlyAgentic = builtRequest.getOnlyAgentic?.() || false;
      const isHideAgentic = builtRequest.getHideAgentic?.() || false;

      if (!isOnlyAgentic && !isHideAgentic) return false;

      const messageReceiverType = message.getReceiverType();

      if (messageReceiverType === 'group') {
        // Group messages are never agentic — hide them from onlyAgentic lists
        if (isOnlyAgentic) return true;
      } else {
        const messageReceiver = message.getReceiver() as CometChat.User;
        const messageSender = message.getSender();
        const senderRole = messageSender?.getRole?.() ?? '';
        const receiverRole = messageReceiver?.getRole?.() ?? '';
        const isAgenticConversation = senderRole === '@agentic' || receiverRole === '@agentic';

        if (isOnlyAgentic && !isAgenticConversation) return true;
        if (isHideAgentic && isAgenticConversation) return true;
      }

      return false;
    };

    const handleNewMessage = (message: CometChat.BaseMessage) => {
      if (shouldHideMessage(message)) return;

      // Check if this message should update the conversation (respects dashboard settings)
      if (!CometChatConversationsManager.shouldLastMessageAndUnreadCountBeUpdated(message)) {
        return;
      }

      // Offline support: a message the SDK's catch-up sweep delivered is
      // already counted in the synced conversation: no +1, no sound, no
      // per-message receipt (UIK-SYNC-02).
      const swept = isOfflineOn() && isSyncDelivered(message);

      // Mark as delivered for messages from other users (v6 parity)
      const senderUid = message.getSender?.()?.getUid?.();
      if (
        senderUid &&
        loggedInUserId &&
        senderUid !== loggedInUserId &&
        !message.getDeliveredAt() &&
        !swept
      ) {
        CometChat.markAsDelivered(message).catch(() => {
          /* non-fatal */
        });
      }

      // Offline support: an own message the sweep delivered can carry a receiver
      // with only an id; the listed row supplies the peer (no row without one).
      const rebuilt: Promise<CometChat.Conversation | null> = isOfflineOn()
        ? rowFromMessageOffline(message, conversationsRef.current)
        : CometChat.CometChatHelper.getConversationFromMessage(message);
      rebuilt
        .then(rebuiltRow => {
          // Offline support: a swept message keeps the listed unread count and
          // never replaces a newer preview (R4); with offline off, unchanged.
          const conversation =
            swept && rebuiltRow
              ? foldOntoListedRow(rebuiltRow, message, conversationsRef.current)
              : rebuiltRow;
          if (!conversation) return;
          // Increment unread count if message is from someone else
          const senderUid = message.getSender?.()?.getUid?.();
          if (
            senderUid &&
            loggedInUserId &&
            senderUid !== loggedInUserId &&
            !message.getReadAt() &&
            !swept
          ) {
            const convId = conversation.getConversationId();
            const existingConv = conversationsRef.current.find(
              c => c.getConversationId() === convId
            );
            const baseCount = existingConv
              ? (existingConv.getUnreadMessageCount() ?? 0)
              : (conversation.getUnreadMessageCount() ?? 0);
            conversation.setUnreadMessageCount(baseCount + 1);

            if (!disableSoundForMessages) {
              CometChatSoundManager.play('incomingMessage', customSoundForMessages);
            }
          }
          dispatch({ type: 'MOVE_TO_TOP', conversation });
        })
        .catch(() => {
          CometChatLogger.warn('CometChatConversations', 'Failed to get conversation from message');
        });
    };

    const handleReceiptUpdate = (receipt: CometChat.MessageReceipt, isRead: boolean) => {
      const messageId = receipt.getMessageId?.();
      if (!messageId) return;

      // Use ref to get the latest conversations without re-attaching the listener
      const currentConversations = conversationsRef.current;

      const targetIdx = currentConversations.findIndex(c => {
        const lastMsg = c.getLastMessage();
        return lastMsg && String(lastMsg.getId()) === String(messageId);
      });

      if (targetIdx === -1) return;

      const targetConv = currentConversations[targetIdx]!;
      const lastMsg = targetConv.getLastMessage();
      if (!lastMsg) return;

      // Update the receipt status on the message object
      if (isRead) {
        lastMsg.setReadAt(receipt.getReadAt());
        targetConv.setUnreadMessageCount(0);
      } else {
        lastMsg.setDeliveredAt(receipt.getDeliveredAt());
      }

      // Dispatch to force re-render with new array reference
      dispatch({ type: 'UPDATE_CONVERSATION', conversation: targetConv });
    };

    const cleanup = CometChatConversationsManager.attachMessageListener(listenerId, {
      onTextMessageReceived: handleNewMessage,
      onMediaMessageReceived: handleNewMessage,
      onCustomMessageReceived: handleNewMessage,
      onCardMessageReceived: handleNewMessage,
      onMessageEdited: (message: CometChat.BaseMessage) => {
        const rebuilt: Promise<CometChat.Conversation | null> = isOfflineOn()
          ? rowFromMessageOffline(message, conversationsRef.current)
          : CometChat.CometChatHelper.getConversationFromMessage(message);
        rebuilt
          .then(conversation => {
            if (conversation) dispatch({ type: 'UPDATE_CONVERSATION', conversation });
          })
          .catch(() => {
            /* skip */
          });
      },
      onMessageDeleted: (message: CometChat.BaseMessage) => {
        const rebuilt: Promise<CometChat.Conversation | null> = isOfflineOn()
          ? rowFromMessageOffline(message, conversationsRef.current)
          : CometChat.CometChatHelper.getConversationFromMessage(message);
        rebuilt
          .then(conversation => {
            if (conversation) dispatch({ type: 'UPDATE_CONVERSATION', conversation });
          })
          .catch(() => {
            /* skip */
          });
      },
      onMessagesDelivered: (receipt: CometChat.MessageReceipt) => {
        if (receipt.getReceiverType() === 'user') {
          handleReceiptUpdate(receipt, false);
        }
      },
      onMessagesRead: (receipt: CometChat.MessageReceipt) => {
        if (receipt.getReceiverType() === 'user') {
          handleReceiptUpdate(receipt, true);
        }
      },
      onMessagesDeliveredToAll: (receipt: CometChat.MessageReceipt) => {
        handleReceiptUpdate(receipt, false);
      },
      onMessagesReadByAll: (receipt: CometChat.MessageReceipt) => {
        handleReceiptUpdate(receipt, true);
      },
    });

    return cleanup;
  }, [
    instanceId,
    loggedInUserId,
    disableSoundForMessages,
    customSoundForMessages,
    conversationsRequestBuilder,
  ]);

  // --- User status listener ---
  useEffect(() => {
    if (hideUserStatus) return;

    const listenerId = `CometChatConversations_user_${instanceId}`;
    const cleanup = CometChatConversationsManager.attachUserStatusListener(listenerId, {
      onUserOnline: (user: CometChat.User) => {
        const uid = user.getUid();
        const conv = conversationsRef.current.find(c => {
          if (c.getConversationType() !== 'user') return false;
          // By id, not by `'getUid' in convWith`: a plain `{ uid }` row from the
          // device store matched nothing, so its status never updated (F3).
          return peerIdOf(c.getConversationWith()) === uid;
        });
        if (conv) {
          const convUser = conv.getConversationWith() as CometChat.User;
          if (convUser.getBlockedByMe?.() || convUser.getHasBlockedMe?.()) return;
          if (typeof convUser.setStatus !== 'function') return;
          convUser.setStatus('online');
          dispatch({ type: 'UPDATE_CONVERSATION', conversation: conv });
        }
      },
      onUserOffline: (user: CometChat.User) => {
        const uid = user.getUid();
        const conv = conversationsRef.current.find(c => {
          if (c.getConversationType() !== 'user') return false;
          // By id, not by `'getUid' in convWith`: a plain `{ uid }` row from the
          // device store matched nothing, so its status never updated (F3).
          return peerIdOf(c.getConversationWith()) === uid;
        });
        if (conv) {
          const convUser = conv.getConversationWith() as CometChat.User;
          if (convUser.getBlockedByMe?.() || convUser.getHasBlockedMe?.()) return;
          if (typeof convUser.setStatus !== 'function') return;
          convUser.setStatus('offline');
          dispatch({ type: 'UPDATE_CONVERSATION', conversation: conv });
        }
      },
    });

    return cleanup;
  }, [instanceId, hideUserStatus]);

  // --- Group listener ---
  useEffect(() => {
    const listenerId = `CometChatConversations_group_${instanceId}`;
    const callbacks: GroupListenerCallbacks = {
      onGroupMemberJoined: (message, joinedUser, joinedGroup) => {
        // If logged-in user joined (or created) a group, add the conversation to the top
        if (loggedInUserId && joinedUser.getUid() === loggedInUserId) {
          CometChat.getConversation(joinedGroup.getGuid(), 'group')
            .then((conversation: CometChat.Conversation) => {
              dispatch({ type: 'ADD_CONVERSATION', conversation });
            })
            .catch(() => {
              /* skip */
            });
        } else {
          // Another user joined — update the conversation's last message (action message)
          CometChat.CometChatHelper.getConversationFromMessage(message)
            .then((conversation: CometChat.Conversation) => {
              dispatch({ type: 'MOVE_TO_TOP', conversation });
            })
            .catch(() => {
              /* skip */
            });
        }
      },
      onGroupMemberLeft: (message, leavingUser, group) => {
        if (loggedInUserId && leavingUser.getUid() === loggedInUserId) {
          const convId = `group_${group.getGuid()}`;
          dispatch({ type: 'REMOVE_CONVERSATION', conversationId: convId });
        } else {
          // Another user left — update the conversation's last message
          CometChat.CometChatHelper.getConversationFromMessage(message)
            .then((conversation: CometChat.Conversation) => {
              dispatch({ type: 'MOVE_TO_TOP', conversation });
            })
            .catch(() => {
              /* skip */
            });
        }
      },
      onGroupMemberKicked: (message, kickedUser, _kickedBy, kickedFrom) => {
        if (loggedInUserId && kickedUser.getUid() === loggedInUserId) {
          const convId = `group_${kickedFrom.getGuid()}`;
          dispatch({ type: 'REMOVE_CONVERSATION', conversationId: convId });
        } else {
          // Another user was kicked — update the conversation's last message
          CometChat.CometChatHelper.getConversationFromMessage(message)
            .then((conversation: CometChat.Conversation) => {
              dispatch({ type: 'MOVE_TO_TOP', conversation });
            })
            .catch(() => {
              /* skip */
            });
        }
      },
      onGroupMemberBanned: (message, bannedUser, _bannedBy, bannedFrom) => {
        if (loggedInUserId && bannedUser.getUid() === loggedInUserId) {
          const convId = `group_${bannedFrom.getGuid()}`;
          dispatch({ type: 'REMOVE_CONVERSATION', conversationId: convId });
        } else {
          // Another user was banned — update the conversation's last message
          CometChat.CometChatHelper.getConversationFromMessage(message)
            .then((conversation: CometChat.Conversation) => {
              dispatch({ type: 'MOVE_TO_TOP', conversation });
            })
            .catch(() => {
              /* skip */
            });
        }
      },
      onMemberAddedToGroup: (message, _addedBy, addedUser, addedTo) => {
        // If the logged-in user was added to a group, add the conversation to the top
        if (loggedInUserId && addedUser.getUid() === loggedInUserId) {
          CometChat.getConversation(addedTo.getGuid(), 'group')
            .then((conversation: CometChat.Conversation) => {
              dispatch({ type: 'ADD_CONVERSATION', conversation });
            })
            .catch(() => {
              /* skip */
            });
        } else {
          // Another user was added — update the conversation's last message (action message)
          CometChat.CometChatHelper.getConversationFromMessage(message)
            .then((conversation: CometChat.Conversation) => {
              dispatch({ type: 'MOVE_TO_TOP', conversation });
            })
            .catch(() => {
              /* skip */
            });
        }
      },
    };
    const cleanup = CometChatConversationsManager.attachGroupListener(listenerId, callbacks);

    // Offline support: a group action that affected the user while offline
    // comes only through the sweep; run the same handler (UIK-SYNC-03).
    const hub = OfflineHub.getInstance();
    const stopSweep = hub.messageSync.subscribe(event => {
      if (event.gen !== hub.gen) return;
      for (const groupEvent of sweptGroupEventsForUser(event.messages, loggedInUserId)) {
        runGroupListener(groupEvent, callbacks);
      }
    });

    return () => {
      cleanup();
      stopSweep();
    };
  }, [instanceId, loggedInUserId]);

  /*
   * The live search text, for the connection listener below.
   *
   * That listener is attached once and deliberately not re-attached when the search text changes,
   * so reading `state.searchText` directly inside it captures whatever the value was at attach
   * time — almost always the empty string. A reconnect mid-search then re-fetched unfiltered and
   * silently replaced the filtered list with the full one.
   */
  const searchTextRef = useRef(state.searchText);
  searchTextRef.current = state.searchText;
  errorViewRef.current =
    (state.fetchState === 'error' || state.connectToSearch === true) &&
    state.conversations.length === 0;

  // --- Connection recovery ---
  useEffect(() => {
    const listenerId = `CometChatConversations_conn_${instanceId}`;
    const cleanup = CometChatConversationsManager.attachConnectionListener(listenerId, {
      onConnected: () => {
        // Offline support: no refetch; the SDK's sweep delivers the changes and
        // its conversation sync page is reconciled below (UIK-SYNC-01). Paging
        // that a read past the cache closed while offline opens again, and the
        // load the user asked for runs now: its scroll trigger is spent (R5).
        if (isOfflineOn()) {
          if (errorViewRef.current) {
            // D84: an offline state reads again once; any other error view stays until the
            // app or the user reloads.
            if (reloadOnConnectRef.current) {
              reloadOnConnectRef.current = false;
              initializeAndFetch(loadedSearchRef.current);
            }
            return;
          }
          if (pagingClosedOfflineRef.current) {
            pagingClosedOfflineRef.current = false;
            dispatch({ type: 'OFFLINE_PAGING_REOPEN' });
            const manager = managerRef.current;
            if (!manager) return;
            if (offlineReadInFlightRef.current !== null) {
              deferFetchNext();
              return;
            }
            const fetchId = `fetch_${String(Date.now())}`;
            fetchIdRef.current = fetchId;
            void readNextOfflineRef.current(manager, fetchId, true);
          }
          return;
        }
        CometChatLogger.info(
          'CometChatConversations',
          'Connection recovered, re-fetching conversations'
        );
        initializeAndFetch(searchTextRef.current);
      },
    });

    return cleanup;
  }, [instanceId, initializeAndFetch, deferFetchNext]);

  // --- Offline support: the hub's private channels (inert with offline off) ---
  const initializeAndFetchRef = useRef(initializeAndFetch);
  initializeAndFetchRef.current = initializeAndFetch;
  // A narrowed list's re-read after a sync: its own request again, two-phase,
  // merged into the rows shown (no reset, so the list never blanks and the rows
  // paged in below page one stay), and one at a time however many sync pages
  // arrive meanwhile (UIK-SYNC-04).
  const syncRereadRef = useRef(false);
  const rereadInPlace = useCallback(() => {
    if (syncRereadRef.current) return;
    syncRereadRef.current = true;
    const manager = new CometChatConversationsManager(buildRequestBuilder(searchTextRef.current));
    managerRef.current = manager;
    const fetchId = `sync_${String(Date.now())}`;
    fetchIdRef.current = fetchId;
    void fetchPageOffline(manager, fetchId, true, true, true).finally(() => {
      syncRereadRef.current = false;
    });
  }, [buildRequestBuilder, fetchPageOffline]);
  const rereadInPlaceRef = useRef(rereadInPlace);
  rereadInPlaceRef.current = rereadInPlace;
  useEffect(() => {
    const hub = OfflineHub.getInstance();
    const unsubscribers = [
      // An own send moves its chat to the top with that preview from the moment
      // it is pending (BEH-CONV-01); a failed one updates the preview's mark.
      hub.sendState.subscribe(event => {
        if (event.gen !== hub.gen) return;
        if (event.state !== 'sending' && event.state !== 'failed') return;
        // A fresh reference (same prototype) so the row re-renders.
        const message = Object.assign(
          Object.create(Object.getPrototypeOf(event.message) as object) as CometChat.BaseMessage,
          event.message
        );
        if (!CometChatConversationsManager.shouldLastMessageAndUnreadCountBeUpdated(message))
          return;
        // A chat that is not listed yet appears when the send is acknowledged.
        rowFromMessageOffline(message, conversationsRef.current)
          .then(rebuilt => {
            if (!rebuilt) return;
            rebuilt.setLastMessage(message);
            // An own send never touches a listed chat's unread count, and a late
            // state event never replaces a newer preview (R7).
            const conversation = foldOntoListedRow(rebuilt, message, conversationsRef.current, 0);
            if (!conversation) return;
            // A send that failed is not new activity in its chat: the row's
            // preview gets the failed mark where it stands. Moving it up would
            // put it above chats that have had messages since it was queued
            // (Prajwal useCometChatConversations.ts:830). A chat not listed at
            // all still appears, so a failed send is never invisible.
            const listed = conversationsRef.current.some(
              row => row.getConversationId() === conversation.getConversationId()
            );
            if (event.state === 'failed' && listed) {
              dispatch({ type: 'UPDATE_CONVERSATION', conversation });
              return;
            }
            dispatch({ type: 'MOVE_TO_TOP', conversation });
          })
          .catch(() => {
            /* skip */
          });
      }),
      hub.conversationSync.subscribe(event => {
        if (event.gen !== hub.gen || !isOfflineOn()) return;
        const narrowed =
          Boolean(loadedSearchRef.current) || requestNarrows(managerRef.current?.request());
        if (narrowed) {
          // A list whose request narrows it (type, tags, search, unread, pinnedBy,
          // agentic) is not the sync page's slice: it re-reads its own request,
          // two-phase, once. Any other list, whatever its builder, is the plain list.
          rereadInPlaceRef.current();
          return;
        }
        dispatch({
          type: 'OFFLINE_SYNC_PAGE',
          // A chat this device read offline stays at zero: its read is flushed
          // only after the message sync, so the page's count is the one the
          // user already cleared (D3).
          conversations: keepReadsMadeOffline(event.conversations),
        });
      }),
      hub.conversationRead.subscribe(event => {
        // A read made offline has reached the server: the chat is read there
        // now, so clear a count the sync page put back before the flush.
        if (event.gen !== hub.gen || !offlineUsedRef.current) return;
        const row = findByPinKey(conversationsRef.current, {
          type: event.type.toLowerCase(),
          with: event.id.toLowerCase(),
        });
        if (!row) return;
        // Only up to where the user actually read. A row whose newest message is
        // past that mark carries messages that arrived during the outage: the
        // server kept them unread, so the count the sync page brought stands
        // (N1, local half). A read with no mark cleared the chat whole.
        const last = row.getLastMessage() as CometChat.BaseMessage | undefined;
        if (event.upToId !== undefined && last && last.getId() > event.upToId) return;
        dispatch({ type: 'RESET_UNREAD_COUNT', conversationId: row.getConversationId() });
      }),
      hub.session.subscribe(() => {
        // Logout or user switch: no frame of the old user's chats. Only a list
        // that used the offline path reacts, so logout with offline off is unchanged.
        if (!offlineUsedRef.current) return;
        fetchIdRef.current = `reset_${String(Date.now())}`;
        dispatch({ type: 'RESET' });
      }),
      hub.login.subscribe(() => {
        // Another user is signed in now (a user switch, or a login after the
        // logout that cleared this list): load their chats. Without this the
        // list stayed on the blank frame `session` left until it was remounted,
        // since the initial-fetch effect only re-runs for a new builder or
        // keyword. Only a list that used the offline path cleared itself, so a
        // login with offline off is unchanged. The kit's own reload: quiet if
        // it fails.
        if (!offlineUsedRef.current) return;
        initializeAndFetchRef.current(searchTextRef.current, true);
      }),
      hub.cacheReset.subscribe(() => {
        // Everything shown came from the old cache: reload, two-phase. The kit's own
        // reload: quiet if it fails over chats on screen.
        initializeAndFetchRef.current(searchTextRef.current, true);
      }),
    ];
    return () => {
      unsubscribers.forEach(stop => {
        stop();
      });
    };
  }, []);

  // --- Active conversation sync ---
  useEffect(() => {
    const convId = activeConversation?.getConversationId() ?? null;
    dispatch({ type: 'SET_ACTIVE_CONVERSATION', conversationId: convId });
  }, [activeConversation]);

  // --- UI Events subscription (cross-component communication) ---
  // Offline (ON) path of a pin/unpin from another device, an admin or the
  // sweep (UIK-CONV-01). With offline off the events hook keeps today's
  // CONVERSATION_PIN_CHANGED and never calls this.
  const loggedInUserIdRef = useRef(loggedInUserId);
  loggedInUserIdRef.current = loggedInUserId;
  const handleRemotePinEvent = useCallback(
    (conversation: CometChat.Conversation, pinned: boolean) => {
      void applyRemotePinEvent(conversation, pinned, {
        list: () => conversationsRef.current,
        loggedInUid: loggedInUserIdRef.current,
        // As Android decides: what the request narrows, not whether a builder was given.
        // A builder that only sets a limit is the plain list.
        filtered:
          Boolean(loadedSearchRef.current) || requestNarrows(managerRef.current?.request()),
        updateRow: (targetId, incoming) => {
          dispatch({ type: 'OFFLINE_PIN_EVENT', conversation: incoming, targetId });
        },
        insertRow: incoming => {
          dispatch({ type: 'OFFLINE_PIN_INSERT', conversation: incoming });
        },
        fetch: (withId, type) => CometChat.getConversation(withId, type),
        gen: () => OfflineHub.getInstance().gen,
        onFetchError: error => {
          CometChatLogger.warn(
            'CometChatConversations',
            'Pinned chat could not be fetched; event ignored:',
            error
          );
        },
      });
    },
    []
  );

  useCometChatConversationsEvents({
    dispatch,
    conversationsRef,
    loggedInUserId,
    onRemotePinEvent: handleRemotePinEvent,
  });

  // --- Selection actions ---
  const selectConversation = useCallback(
    (conversation: CometChat.Conversation) => {
      dispatch({ type: 'SELECT_CONVERSATION', conversation });
      onSelect?.(conversation, true);
    },
    [onSelect]
  );

  const deselectConversation = useCallback(
    (conversationId: string) => {
      const conversation = state.selectedConversationsMap.get(conversationId);
      dispatch({ type: 'DESELECT_CONVERSATION', conversationId });
      if (conversation) onSelect?.(conversation, false);
    },
    [onSelect, state.selectedConversationsMap]
  );

  const selectRange = useCallback(
    (conversations: CometChat.Conversation[]) => {
      dispatch({ type: 'SELECT_RANGE', conversations });
      conversations.forEach(c => {
        if (!state.selectedConversationIds.includes(c.getConversationId())) {
          onSelect?.(c, true);
        }
      });
    },
    [onSelect, state.selectedConversationIds]
  );

  const deselectRange = useCallback(
    (conversationIds: string[]) => {
      conversationIds.forEach(id => {
        const conversation = state.selectedConversationsMap.get(id);
        if (conversation) onSelect?.(conversation, false);
      });
      dispatch({ type: 'DESELECT_RANGE', conversationIds });
    },
    [onSelect, state.selectedConversationsMap]
  );

  const clearSelection = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTION' });
  }, []);

  const setActiveConversation = useCallback((conversationId: string | null) => {
    dispatch({ type: 'SET_ACTIVE_CONVERSATION', conversationId });
  }, []);

  // --- Delete conversation ---
  const deleteConversation = useCallback(
    async (conversationId: string) => {
      const conversation = state.conversations.find(c => c.getConversationId() === conversationId);
      if (!conversation) return;

      const conversationWith = conversation.getConversationWith();
      const conversationType = conversation.getConversationType();

      // Read the id through `peerIdOf`: a row rebuilt from the device store can
      // carry a plain `{ uid }` / `{ guid }` object, and calling `getUid()` on
      // one threw here, so the delete failed with "something went wrong" and
      // left the row on the list (F3).
      const conversationWithId = peerIdOf(conversationWith);
      if (!conversationWithId) {
        // No id to delete at all: report it the way a refused delete is
        // reported, rather than throwing out of the callback.
        handleError(new Error('The chat to delete has no uid or guid.'));
        return;
      }

      try {
        await CometChatConversationsManager.deleteConversation(
          conversationWithId,
          conversationType
        );
        dispatch({ type: 'REMOVE_CONVERSATION', conversationId });
        publish({ type: 'ui:conversation/deleted', conversation });
      } catch (error: unknown) {
        handleError(error);
      }
    },
    [state.conversations, publish, handleError]
  );

  // --- Handle item click with selection logic ---
  const handleItemClick = useCallback(
    (conversation: CometChat.Conversation, event?: { shiftKey?: boolean }) => {
      const convId = conversation.getConversationId();
      const clickedIndex = state.conversations.findIndex(c => c.getConversationId() === convId);
      const isShiftClick = event?.shiftKey === true;

      if (selectionMode === 'multiple') {
        if (isShiftClick && anchorIndexRef.current !== null) {
          // Shift-click range selection
          const anchorIndex = anchorIndexRef.current;
          const startIndex = Math.min(anchorIndex, clickedIndex);
          const endIndex = Math.max(anchorIndex, clickedIndex);
          const conversationsInRange = state.conversations.slice(startIndex, endIndex + 1);
          selectRange(conversationsInRange);
        } else {
          // Regular click: toggle individual, set as anchor
          anchorIndexRef.current = clickedIndex;

          if (state.selectedConversationIds.includes(convId)) {
            deselectConversation(convId);
          } else {
            selectConversation(conversation);
          }
        }
      } else if (selectionMode === 'single') {
        // Single selection: clear previous, select new
        if (!state.selectedConversationIds.includes(convId)) {
          dispatch({ type: 'CLEAR_SELECTION' });
          selectConversation(conversation);
        }
      }

      onItemClick?.(conversation);
    },
    [
      state.conversations,
      state.selectedConversationIds,
      selectionMode,
      selectConversation,
      deselectConversation,
      selectRange,
      onItemClick,
    ]
  );

  return {
    // State
    conversations: state.conversations,
    fetchState: state.fetchState,
    hasMore: state.hasMore,
    error: state.error,
    selectedConversationIds: state.selectedConversationIds,
    selectedConversationsMap: state.selectedConversationsMap,
    activeConversationId: state.activeConversationId,
    searchText: state.searchText,
    ...(state.connectToSearch !== undefined && { connectToSearch: state.connectToSearch }),
    ...(state.connectToLoad !== undefined && { connectToLoad: state.connectToLoad }),
    typingIndicatorMap: state.typingIndicatorMap,
    loggedInUserId,
    // Actions
    fetchNext,
    setSearchText,
    selectConversation,
    deselectConversation,
    selectRange,
    deselectRange,
    clearSelection,
    setActiveConversation,
    handleItemClick,
    deleteConversation,
    setConversationToBeDeleted,
    conversationToBeDeleted,
    pinConversation: pinActions.requestPin,
    unpinConversation: pinActions.requestUnpin,
    pinConfirmState: pinActions.confirmState,
    confirmPinAction: pinActions.confirm,
    cancelPinAction: pinActions.cancel,
    pinIsBusy: pinActions.isBusy,
    pinToastText: pinToast.text,
    pinToastId: pinToast.id,
    pinToastVariant: pinToast.variant,
    clearPinToast,
  };
}
