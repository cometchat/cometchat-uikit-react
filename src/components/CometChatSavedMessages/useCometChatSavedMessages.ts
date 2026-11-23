import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { useCometChatEvents } from '../../hooks/useCometChatEvents';
import type { CometChatEvent } from '../../context/CometChatEvents.types';
import { cloneMessage } from '../CometChatMessageList/CometChatMessageList.utils';
import {
  CometChatSavedMessagesManager,
  SAVED_MESSAGES_PAGE_SIZE,
} from './CometChatSavedMessagesManager';
import {
  initialSavedMessagesState,
  savedMessagesReducer,
  sentAtDesc,
} from './CometChatSavedMessages.reducer';
import type { CometChatSavedMessagesState } from './CometChatSavedMessages.types';
import { isOfflineOn } from '../../utils/offline/gate';
import { useReloadOnReconnect } from '../../utils/offline/useReloadOnReconnect';
import { useOfflineListLifecycle } from '../../utils/offline/useOfflineListLifecycle';
import { useDeferredLoadMore } from '../../utils/offline/useDeferredLoadMore';
import {
  buildSavedRequest,
  readPanelPage,
  withOfflinePages,
  type PanelRequest,
} from '../../utils/offline/messagePanel';

/**
 * Today's reducer, plus the offline path's page actions (inert with offline
 * off). Offline pages keep the panel's sent-time order, as every merge does.
 */
const savedReducer = withOfflinePages(savedMessagesReducer, sentAtDesc);
const SAVED_ERROR_TEXT = 'Failed to load saved messages';

export interface UseCometChatSavedMessagesReturn extends CometChatSavedMessagesState {
  /** Total rows currently held. Exposed for custom header views. */
  count: number;
  /** Fetch the next page. No-op once exhausted. */
  loadMore: () => void;
  /** Re-read from scratch. */
  reload: () => void;
}

/**
 * useCometChatSavedMessages — owns the saved list's data and live upkeep.
 *
 * Read-only by contract: this surface never marks anything read, sends receipts,
 * or touches unread counts. It only ever reads and reacts.
 */
export function useCometChatSavedMessages(
  messagesRequestBuilder?: CometChat.MessagesRequestBuilder
): UseCometChatSavedMessagesReturn {
  const [state, dispatch] = useReducer(savedReducer, initialSavedMessagesState);
  const managerRef = useRef<CometChatSavedMessagesManager | null>(null);

  // --- Offline support (ON path only; inert with offline off) ---
  const rowsRef = useRef(state.messages);
  rowsRef.current = state.messages;
  /** The offline path's request, tied to the manager (panel instance) it belongs to. */
  const offlineRef = useRef<{ manager: CometChatSavedMessagesManager; panel: PanelRequest } | null>(
    null
  );
  /** True while an offline read's server phase is pending: one read at a time. */
  const offlineInFlightRef = useRef(false);
  /** The error view on screen is from being offline: the next reconnect reads the panel again (D83). */
  const reloadOnConnectRef = useRef(false);
  const latestLoadMoreRef = useRef<() => void>(() => undefined);
  const deferLoadMore = useDeferredLoadMore(() => {
    latestLoadMoreRef.current();
  }, offlineInFlightRef);

  // Logout, user switch or cache reset (UIK-LIFE-01/02).
  const lifecycleReloadRef = useRef<() => void>(() => undefined);
  const offlineUsedRef = useOfflineListLifecycle({
    onSessionEnd: () => {
      // No manager: a read still running is stale, and "load more" asks nothing.
      managerRef.current = null;
      offlineInFlightRef.current = false;
      dispatch({ type: 'RESET' });
    },
    onCacheReset: () => {
      lifecycleReloadRef.current();
    },
    // A user switch, or a login after the logout that cleared this list:
    // read it for whoever is signed in now, instead of staying on the blank
    // frame `onSessionEnd` left until this list is remounted (F1).
    onLogin: () => {
      lifecycleReloadRef.current();
    },
  });

  /**
   * Offline path: one two-phase page; the server page replaces its cached
   * slice in place, deduped by id, so "load more" never repeats or skips
   * (BEH-SAVE-02, UIT-LIST-10). Offline past the cache keeps the rows.
   */
  const readOffline = useCallback(
    (manager: CometChatSavedMessagesManager, panel: PanelRequest) => {
      offlineUsedRef.current = true;
      offlineInFlightRef.current = true;
      const settle = () => {
        if (managerRef.current === manager) offlineInFlightRef.current = false;
      };
      return readPanelPage({
        panel,
        // A rebuild mid-flight must not land the old result.
        isStale: () => managerRef.current !== manager,
        shown: () => rowsRef.current,
        dispatch: action => {
          if (action.type === 'OFFLINE_PAGE_ERROR' || action.page.phase === 'server') settle();
          if (action.type === 'OFFLINE_PAGE_ERROR') {
            reloadOnConnectRef.current = action.notConnected && rowsRef.current.length === 0;
          }
          dispatch(action);
        },
        errorText: SAVED_ERROR_TEXT,
      }).finally(settle);
    },
    [offlineUsedRef]
  );

  /**
   * Rebuilt when the caller's builder changes, so a new page size or filter
   * actually takes effect. Creating it once and reusing it would silently pin the
   * first builder for the lifetime of the panel.
   */
  const fetchFirst = useCallback(() => {
    if (isOfflineOn()) {
      const manager = new CometChatSavedMessagesManager(messagesRequestBuilder);
      managerRef.current = manager;
      offlineInFlightRef.current = false;
      reloadOnConnectRef.current = false;
      dispatch({ type: 'RESET' });
      dispatch({ type: 'FETCH_START' });
      // setSaved(true) goes on a copy: the caller's builder is never changed.
      const panel = buildSavedRequest(
        messagesRequestBuilder,
        () => new CometChat.MessagesRequestBuilder().setLimit(SAVED_MESSAGES_PAGE_SIZE),
        SAVED_MESSAGES_PAGE_SIZE
      );
      offlineRef.current = { manager, panel };
      void readOffline(manager, panel);
      return;
    }

    const manager = new CometChatSavedMessagesManager(messagesRequestBuilder);
    managerRef.current = manager;
    dispatch({ type: 'RESET' });
    dispatch({ type: 'FETCH_START' });
    manager
      .fetchFirst()
      .then(({ messages, hasMore }) => {
        // A rebuild mid-flight must not land the old result.
        if (managerRef.current !== manager) return;
        dispatch({ type: 'FETCH_SUCCESS', messages, hasMore });
      })
      .catch((error: unknown) => {
        if (managerRef.current !== manager) return;
        dispatch({
          type: 'FETCH_ERROR',
          error: error instanceof Error ? error.message : 'Failed to load saved messages',
        });
      });
  }, [messagesRequestBuilder, readOffline]);

  const loadMore = useCallback(() => {
    const manager = managerRef.current;
    if (!manager || !state.hasMore || state.fetchState === 'loading') return;
    const offline = offlineRef.current;
    if (isOfflineOn() && offline?.manager === manager) {
      if (offlineInFlightRef.current) {
        deferLoadMore();
        return;
      }
      dispatch({ type: 'FETCH_START' });
      void readOffline(manager, offline.panel);
      return;
    }
    dispatch({ type: 'FETCH_START' });
    manager
      .fetchNext()
      .then(({ messages, hasMore }) => {
        if (managerRef.current !== manager) return;
        dispatch({ type: 'FETCH_SUCCESS', messages, hasMore });
      })
      .catch((error: unknown) => {
        if (managerRef.current !== manager) return;
        dispatch({
          type: 'FETCH_ERROR',
          error: error instanceof Error ? error.message : 'Failed to load saved messages',
        });
      });
  }, [state.hasMore, state.fetchState, readOffline, deferLoadMore]);
  latestLoadMoreRef.current = loadMore;

  lifecycleReloadRef.current = fetchFirst;

  // D83: an error view that came from being offline reads again once on reconnect.
  const errorViewRef = useRef(false);
  errorViewRef.current = state.fetchState === 'error' && state.messages.length === 0;
  useReloadOnReconnect(
    () => errorViewRef.current && reloadOnConnectRef.current,
    () => {
      reloadOnConnectRef.current = false;
      fetchFirst();
    }
  );

  useEffect(() => {
    fetchFirst();
  }, [fetchFirst]);

  // Keep a live view of the ids on screen so the parent-deleted check below
  // doesn't need the message list in its dependency array.
  const messagesRef = useRef(state.messages);
  messagesRef.current = state.messages;

  useCometChatEvents((event: CometChatEvent) => {
    switch (event.type) {
      // Save is private to this user's devices, so any save event here is theirs.
      case 'message/saved':
      case 'ui:message/save-changed': {
        if (event.type === 'ui:message/save-changed' && !event.saved) {
          dispatch({ type: 'REMOVE_MESSAGE', messageId: String(event.message.getId()) });
          break;
        }
        dispatch({ type: 'MESSAGE_SAVED', message: event.message });
        break;
      }

      case 'message/unsaved': {
        dispatch({ type: 'REMOVE_MESSAGE', messageId: String(event.message.getId()) });
        break;
      }

      // An edit rewrites the preview text; moderation can blank it. Both must
      // reach a row that is already on screen. Reactions are deliberately absent
      // — a conversation-style row renders none.
      case 'message/edited':
      case 'message/moderated': {
        dispatch({ type: 'MESSAGE_UPDATED', message: cloneMessage(event.message) });
        break;
      }

      case 'message/deleted':
      case 'ui:message/deleted': {
        const deletedId = event.message.getId();
        // The row itself was deleted.
        dispatch({ type: 'REMOVE_MESSAGE', messageId: String(deletedId) });

        // …or the row's thread parent was. Deleting a parent does not delete its
        // replies, so an orphaned reply would otherwise linger.
        messagesRef.current.forEach(m => {
          const parentId = typeof m.getParentMessageId === 'function' ? m.getParentMessageId() : 0;
          if (parentId && String(parentId) === String(deletedId)) {
            dispatch({ type: 'REMOVE_MESSAGE', messageId: String(m.getId()) });
          }
        });
        break;
      }

      default:
        break;
    }
  }, []);

  return useMemo(
    () => ({
      ...state,
      count: state.messages.length,
      loadMore,
      reload: fetchFirst,
    }),
    [state, loadMore, fetchFirst]
  );
}
