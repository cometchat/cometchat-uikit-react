import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatReactionListManager } from './CometChatReactionListManager';
import {
  reactionListReducer,
  initialReactionListState,
  reactionKeyOf,
} from './CometChatReactionList.reducer';
import { isOfflineOn } from '../../utils/offline/gate';
import { useOfflineListLifecycle } from '../../utils/offline/useOfflineListLifecycle';
import { useReloadOnReconnect } from '../../utils/offline/useReloadOnReconnect';
import { nextOfflineOpId, readEntityPage, reportsReadError } from '../../utils/offline/entityList';
import { copyRequestBuilder } from '../../utils/copyRequestBuilder';
import type { CometChatReactionListContextValue } from './CometChatReactionList.types';

const DEFAULT_LIMIT = 20;

export interface CometChatUseCometChatReactionListOptions {
  message: CometChat.BaseMessage;
  reactionsRequestBuilder?: CometChat.ReactionsRequestBuilder;
  onItemClick?: (reaction: CometChat.Reaction, message: CometChat.BaseMessage) => void;
  onEmpty?: () => void;
  onError?: ((error: CometChat.CometChatException) => void) | null;
}

/**
 * useCometChatReactionList — data hook for the standalone CometChatReactionList component.
 *
 * Manages fetching all reactions for a message, grouping them by emoji client-side,
 * and handling optimistic removal when the current user removes their reaction.
 *
 * Does NOT subscribe to SDK events — the parent (MessageList) owns reaction add/remove
 * and passes an updated `message` prop when reactions change.
 */
export function useCometChatReactionList(
  options: CometChatUseCometChatReactionListOptions
): Omit<CometChatReactionListContextValue, 'message'> & { message: CometChat.BaseMessage } {
  const { message, reactionsRequestBuilder, onItemClick, onEmpty, onError } = options;

  const [state, dispatch] = useReducer(reactionListReducer, initialReactionListState);
  const managerRef = useRef<CometChatReactionListManager | null>(null);
  const fetchIdRef = useRef<string>('');
  const loggedInUserUidRef = useRef<string>('');
  const [loggedInUserUid, setLoggedInUserUid] = useState('');

  // --- Get logged-in user UID on mount ---
  useEffect(() => {
    CometChat.getLoggedinUser()
      .then(user => {
        if (user) {
          loggedInUserUidRef.current = user.getUid();
          setLoggedInUserUid(user.getUid());
        }
      })
      .catch(() => {
        // Silently ignore — component still works, just can't identify current user
      });
  }, []);

  // --- Error handler ---
  const handleError = useCallback(
    (error: unknown) => {
      onError?.(error as CometChat.CometChatException);
      dispatch({ type: 'FETCH_ERROR' });
    },
    [onError]
  );

  // --- Offline support (ON path only; inert with offline off) ---
  const reactionsRef = useRef(state.allReactions);
  reactionsRef.current = state.allReactions;
  /** The offline state on screen: the next reconnect reads the list again (D84). */
  const reloadOnConnectRef = useRef(false);
  const errorViewRef = useRef(false);
  errorViewRef.current = state.fetchState === 'error' && state.allReactions.length === 0;

  /**
   * Offline path: one two-phase page read. The cached page paints first; the
   * server page replaces the same slice in place, deduped by reactor+emoji.
   * Offline past the cache keeps the rows shown, no error screen.
   */
  const lifecycleReloadRef = useRef<() => void>(() => undefined);
  const offlineUsedRef = useOfflineListLifecycle({
    onSessionEnd: () => {
      fetchIdRef.current = nextOfflineOpId('session');
      managerRef.current = null;
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

  const readOffline = useCallback(
    (manager: CometChatReactionListManager, opId: string, first = false) => {
      if (first) reloadOnConnectRef.current = false;
      const request = manager.getRequest();
      if (!request) {
        // No request (SDK not ready): today's answer, an empty list.
        dispatch({ type: 'FETCH_SUCCESS', reactions: [], hasMore: false });
        return Promise.resolve();
      }
      return readEntityPage<CometChat.Reaction>(
        {
          request,
          kind: 'reactions',
          refresh: false,
          idOf: reactionKeyOf,
          isStale: () => fetchIdRef.current !== opId,
          shown: () => reactionsRef.current,
          hasMoreOf: page => page.length >= DEFAULT_LIMIT,
        },
        {
          onPage: page => {
            dispatch({ type: 'OFFLINE_PAGE', page });
          },
          onError: (error, notConnected, hasMore) => {
            const shown = reactionsRef.current.length > 0;
            // D84: nothing on screen reports every error, "not connected" included; over rows
            // only a real error does (offline is silent).
            if (reportsReadError(notConnected, shown, false, false)) {
              onError?.(error as CometChat.CometChatException);
            }
            if (first) reloadOnConnectRef.current = notConnected && !shown;
            dispatch({ type: 'OFFLINE_PAGE_ERROR', notConnected, hasMore });
          },
        }
      );
    },
    [onError]
  );

  /** Offline path: a fresh read of the message's reactions (mount, message change, retry). */
  const startOffline = useCallback(
    (messageId: number) => {
      offlineUsedRef.current = true;
      // The integrator's builder gets the message id on a copy, never on itself.
      managerRef.current = new CometChatReactionListManager(
        messageId,
        reactionsRequestBuilder ? copyRequestBuilder(reactionsRequestBuilder) : undefined
      );
      dispatch({ type: 'RESET' });
      const opId = nextOfflineOpId('fetch');
      fetchIdRef.current = opId;
      dispatch({ type: 'FETCH_START' });
      void readOffline(managerRef.current, opId, true);
    },
    [reactionsRequestBuilder, readOffline, offlineUsedRef]
  );

  // --- Fetch more reactions (pagination) ---
  const fetchMore = useCallback(async () => {
    if (!managerRef.current || !state.hasMore || state.isFetching) return;

    if (isOfflineOn()) {
      const opId = nextOfflineOpId('fetch');
      fetchIdRef.current = opId;
      dispatch({ type: 'FETCH_START' });
      await readOffline(managerRef.current, opId);
      return;
    }

    const currentFetchId = `fetch_${String(Date.now())}`;
    fetchIdRef.current = currentFetchId;
    dispatch({ type: 'FETCH_START' });

    try {
      const reactions = await managerRef.current.fetchNext();
      if (fetchIdRef.current !== currentFetchId) return;
      dispatch({
        type: 'FETCH_SUCCESS',
        reactions,
        hasMore: reactions.length >= DEFAULT_LIMIT,
      });
    } catch (error) {
      if (fetchIdRef.current !== currentFetchId) return;
      handleError(error);
    }
  }, [state.hasMore, state.isFetching, handleError, readOffline]);

  lifecycleReloadRef.current = () => {
    const messageId = message.getId();
    if (messageId && isOfflineOn()) startOffline(messageId);
  };

  // D84: an offline state reads again once on reconnect.
  useReloadOnReconnect(
    () => errorViewRef.current && reloadOnConnectRef.current,
    () => {
      reloadOnConnectRef.current = false;
      lifecycleReloadRef.current();
    }
  );

  // --- Initialize manager and fetch on mount ---
  useEffect(() => {
    const messageId = message.getId();
    if (!messageId) return;

    if (isOfflineOn()) {
      startOffline(messageId);
      return;
    }

    managerRef.current = new CometChatReactionListManager(messageId, reactionsRequestBuilder);
    dispatch({ type: 'RESET' });

    // Kick off initial fetch
    const currentFetchId = `fetch_${String(Date.now())}`;
    fetchIdRef.current = currentFetchId;
    dispatch({ type: 'FETCH_START' });

    managerRef.current
      .fetchNext()
      .then(reactions => {
        if (fetchIdRef.current !== currentFetchId) return;
        dispatch({
          type: 'FETCH_SUCCESS',
          reactions,
          hasMore: reactions.length >= DEFAULT_LIMIT,
        });
      })
      .catch((error: unknown) => {
        if (fetchIdRef.current !== currentFetchId) return;
        handleError(error);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: reset on message/builder change
  }, [message.getId(), reactionsRequestBuilder]);

  // --- Select emoji tab ---
  const selectEmoji = useCallback((emoji: string | null) => {
    dispatch({ type: 'SELECT_EMOJI', emoji });
  }, []);

  // --- Check if reaction is from current user ---
  const isCurrentUser = useCallback(
    (reaction: CometChat.Reaction): boolean => {
      const uid = loggedInUserUidRef.current || loggedInUserUid;
      return reaction.getReactedBy().getUid() === uid;
    },
    [loggedInUserUid]
  );

  // --- Handle item click (current user only) ---
  const handleItemClick = useCallback(
    (reaction: CometChat.Reaction) => {
      if (!isCurrentUser(reaction)) return;

      // Build the unique key for optimistic removal
      const reactionId = `${reaction.getReactedBy().getUid()}-${reaction.getReaction()}`;
      dispatch({ type: 'REMOVE_REACTION', reactionId });

      // Fire the callback so parent can call SDK
      onItemClick?.(reaction, message);

      // Check if all reactions are now removed (after this removal)
      // We need to check the count after removal
      const remainingCount = state.allReactions.filter(r => {
        const key = `${r.getReactedBy().getUid()}-${r.getReaction()}`;
        return key !== reactionId;
      }).length;

      if (remainingCount === 0) {
        onEmpty?.();
      }
    },
    [isCurrentUser, onItemClick, message, onEmpty, state.allReactions]
  );

  // --- Retry after error ---
  const retry = useCallback(() => {
    const messageId = message.getId();
    if (!messageId) return;

    if (isOfflineOn()) {
      startOffline(messageId);
      return;
    }

    managerRef.current = new CometChatReactionListManager(messageId, reactionsRequestBuilder);
    dispatch({ type: 'RESET' });

    const currentFetchId = `fetch_${String(Date.now())}`;
    fetchIdRef.current = currentFetchId;
    dispatch({ type: 'FETCH_START' });

    managerRef.current
      .fetchNext()
      .then(reactions => {
        if (fetchIdRef.current !== currentFetchId) return;
        dispatch({
          type: 'FETCH_SUCCESS',
          reactions,
          hasMore: reactions.length >= DEFAULT_LIMIT,
        });
      })
      .catch((error: unknown) => {
        if (fetchIdRef.current !== currentFetchId) return;
        handleError(error);
      });
  }, [message, reactionsRequestBuilder, handleError, startOffline]);

  // --- Derived values ---
  const emojiTabs = useMemo(
    () => Array.from(state.groupedReactions.keys()),
    [state.groupedReactions]
  );

  const totalCount = state.allReactions.length;

  const filteredReactions = useMemo(() => {
    if (state.selectedEmoji === null) return state.allReactions;
    return state.groupedReactions.get(state.selectedEmoji) ?? [];
  }, [state.allReactions, state.groupedReactions, state.selectedEmoji]);

  return {
    message,
    allReactions: state.allReactions,
    groupedReactions: state.groupedReactions,
    selectedEmoji: state.selectedEmoji,
    fetchState: state.fetchState,
    hasMore: state.hasMore,
    isFetching: state.isFetching,
    ...(state.connectToLoad !== undefined && { connectToLoad: state.connectToLoad }),
    emojiTabs,
    totalCount,
    filteredReactions,
    selectEmoji,
    fetchMore,
    handleItemClick,
    isCurrentUser,
    retry,
    loggedInUserUid: loggedInUserUidRef.current || loggedInUserUid,
  };
}
