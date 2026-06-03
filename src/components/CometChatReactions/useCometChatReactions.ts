import { useCallback, useEffect, useReducer, useRef } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatReactionsManager } from './CometChatReactionsManager';
import { reactionsReducer, initialState } from './CometChatReactions.reducer';
import type { CometChatReactionsFetchState } from './CometChatReactions.types';

const DEFAULT_LIMIT = 20;

export interface CometChatUseCometChatReactionsOptions {
  message: CometChat.BaseMessage;
  reactionsRequestBuilder?: CometChat.ReactionsRequestBuilder;
  onError?: ((error: CometChat.CometChatException) => void) | null | undefined;
}

export interface CometChatUseCometChatReactionsReturn {
  reactions: CometChat.ReactionCount[];
  activeTab: string;
  reactors: CometChat.Reaction[];
  reactorsFetchState: CometChatReactionsFetchState;
  reactorsHasMore: boolean;
  setActiveTab: (tab: string) => void;
  fetchReactors: () => Promise<void>;
  fetchNextReactors: () => Promise<void>;
  removeReactor: (uid: string, emoji: string) => void;
}

/**
 * useCometChatReactions — data hook for the CometChatReactions component.
 *
 * Derives reaction counts from the message prop.
 * Manages reactor detail fetching via CometChatReactionsManager.
 * Does NOT subscribe to SDK events — parent owns reaction add/remove.
 */
export function useCometChatReactions(
  options: CometChatUseCometChatReactionsOptions
): CometChatUseCometChatReactionsReturn {
  const { message, reactionsRequestBuilder, onError } = options;
  const [state, dispatch] = useReducer(reactionsReducer, initialState);
  const managerRef = useRef<CometChatReactionsManager | null>(null);
  const fetchIdRef = useRef<string>('');
  const isFetchingRef = useRef(false);

  // --- Sync reactions from message prop ---
  useEffect(() => {
    const reactions = message.getReactions();
    dispatch({ type: 'SET_REACTIONS', reactions });
  }, [message]);

  // --- Error handler ---
  const handleError = useCallback(
    (error: unknown) => {
      onError?.(error as CometChat.CometChatException);
      dispatch({ type: 'SET_FETCH_STATE', fetchState: 'error' });
    },
    [onError]
  );

  // --- Create manager for active tab ---
  const createManager = useCallback(
    (tab: string) => {
      const messageId = message.getId();
      if (!messageId) return null;
      try {
        return new CometChatReactionsManager(
          messageId,
          tab === 'all' ? undefined : tab,
          reactionsRequestBuilder
        );
      } catch {
        return null;
      }
    },
    [message, reactionsRequestBuilder]
  );

  // Track fetched tabs via ref to avoid stale closure on state.reactors
  const fetchedTabsRef = useRef<Set<string>>(new Set());

  // --- Fetch reactors for active tab (initial fetch) ---
  const fetchReactors = useCallback(async () => {
    const tab = state.activeTab;

    // If already fetched for this tab, ensure state reflects loaded (not idle)
    if (fetchedTabsRef.current.has(tab)) {
      dispatch({ type: 'SET_FETCH_STATE', fetchState: 'loaded' });
      return;
    }

    // Prevent concurrent fetches — SDK throws REQUEST_IN_PROGRESS_ERROR on double-call
    if (isFetchingRef.current) return;

    const manager = createManager(tab);
    if (!manager) return;
    managerRef.current = manager;

    isFetchingRef.current = true;
    const currentFetchId = `fetch_${String(Date.now())}`;
    fetchIdRef.current = currentFetchId;
    dispatch({ type: 'SET_FETCH_STATE', fetchState: 'loading' });

    try {
      const reactors = await manager.fetchNext();
      if (fetchIdRef.current !== currentFetchId) return;
      fetchedTabsRef.current.add(tab);
      dispatch({
        type: 'SET_REACTORS',
        emoji: tab,
        reactors,
        hasMore: reactors.length >= DEFAULT_LIMIT,
      });
    } catch (error) {
      if (fetchIdRef.current !== currentFetchId) return;
      console.error('[CometChatReactions] fetchReactors error:', error);
      handleError(error);
    } finally {
      isFetchingRef.current = false;
    }
  }, [state.activeTab, createManager, handleError]);

  // --- Fetch next page of reactors ---
  const fetchNextReactors = useCallback(async () => {
    if (!managerRef.current || !state.reactorsHasMore || state.reactorsFetchState === 'loading') {
      return;
    }
    // Prevent concurrent fetches
    if (isFetchingRef.current) return;

    const tab = state.activeTab;
    isFetchingRef.current = true;
    const currentFetchId = `fetchNext_${String(Date.now())}`;
    fetchIdRef.current = currentFetchId;
    dispatch({ type: 'SET_FETCH_STATE', fetchState: 'loading' });

    try {
      const reactors = await managerRef.current.fetchNext();
      if (fetchIdRef.current !== currentFetchId) return;
      dispatch({
        type: 'APPEND_REACTORS',
        emoji: tab,
        reactors,
        hasMore: reactors.length >= DEFAULT_LIMIT,
      });
    } catch (error) {
      if (fetchIdRef.current !== currentFetchId) return;
      handleError(error);
    } finally {
      isFetchingRef.current = false;
    }
  }, [state.reactorsHasMore, state.reactorsFetchState, state.activeTab, handleError]);

  // --- Set active tab ---
  const setActiveTab = useCallback((tab: string) => {
    dispatch({ type: 'SET_ACTIVE_TAB', tab });
    // If we already fetched this tab, set state to loaded immediately
    // to avoid showing shimmer/idle state. Don't create a new manager —
    // let fetchReactors handle it if the tab hasn't been fetched yet.
    if (fetchedTabsRef.current.has(tab)) {
      dispatch({ type: 'SET_FETCH_STATE', fetchState: 'loaded' });
    }
  }, []);

  // --- Remove a reactor optimistically from the cached list ---
  const removeReactor = useCallback((uid: string, emoji: string) => {
    dispatch({ type: 'REMOVE_REACTOR', uid, emoji });
  }, []);

  return {
    reactions: state.reactions,
    activeTab: state.activeTab,
    reactors: state.reactors[state.activeTab] ?? [],
    reactorsFetchState: state.reactorsFetchState,
    reactorsHasMore: state.reactorsHasMore,
    setActiveTab,
    fetchReactors,
    fetchNextReactors,
    removeReactor,
  };
}
