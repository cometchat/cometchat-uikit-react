import { useCallback, useContext, useEffect, useReducer, useRef, useState } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatSearchMessagesManager } from './CometChatSearchMessagesManager';
import { hasValidMessageSearchCriteria } from './CometChatSearchFilterUtils';
import type {
  CometChatSearchMessagesState,
  CometChatUseCometChatSearchMessagesOptions,
} from './CometChatSearch.types';
import type { CometChatFetchState } from '../../types';
import { isOfflineOn } from '../../utils/offline/gate';
import { CometChatSearchOfflineContext } from './searchOffline';
import { useOfflineListLifecycle } from '../../utils/offline/useOfflineListLifecycle';
import { isNotConnectedError } from '../../utils/offline/reconcile';
import { useReloadOnReconnect } from '../../utils/offline/useReloadOnReconnect';
import type { TwoPhaseRequest } from '../../utils/offline/two-phase';
import { copyRequestBuilder } from '../../utils/copyRequestBuilder';
import {
  readEntityPage,
  reduceEntityPage,
  reduceEntityPageError,
  reportsReadError,
  type EntityPagePayload,
} from '../../utils/offline/entityList';

// ── Reducer ──

type Action =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; messages: CometChat.BaseMessage[]; hasMore: boolean }
  | { type: 'FETCH_ERROR' }
  | { type: 'FETCH_EMPTY' }
  | { type: 'LOAD_MORE_SUCCESS'; messages: CometChat.BaseMessage[]; hasMore: boolean }
  | { type: 'RESET' }
  // Offline support: one phase of a filter-only read.
  | { type: 'OFFLINE_PAGE'; page: EntityPagePayload<CometChat.BaseMessage> }
  | { type: 'OFFLINE_PAGE_ERROR'; notConnected: boolean; hasMore: boolean }
  // Offline support: a keyword search could not reach the server (D84: "Connect to search").
  | { type: 'OFFLINE_SEARCH_MISS' }
  // Offline support: a search failed with a real error and nothing is shown. The search screen
  // decides, once every scope has answered, whether that is an error or the plain empty state.
  | { type: 'OFFLINE_SEARCH_FAILED' };

const messageIdOf = (message: CometChat.BaseMessage): string => String(message.getId());

const initialState: CometChatSearchMessagesState = {
  messages: [],
  fetchState: 'idle',
  hasMore: false,
};

function reducer(
  state: CometChatSearchMessagesState,
  action: Action
): CometChatSearchMessagesState {
  switch (action.type) {
    case 'FETCH_START':
      return {
        ...state,
        fetchState: 'loading',
        messages: [],
        hasMore: false,
        // Offline states from the last search end with it; absent with offline off.
        ...(state.connectToSearch === true && { connectToSearch: false }),
        ...(state.searchFailed === true && { searchFailed: false }),
      };
    case 'FETCH_SUCCESS':
      return {
        ...state,
        fetchState: 'loaded',
        messages: action.messages,
        hasMore: action.hasMore,
      };
    case 'FETCH_ERROR':
      return { ...state, fetchState: 'error' };
    case 'FETCH_EMPTY':
      return {
        ...state,
        fetchState: 'empty',
        messages: [],
        hasMore: false,
        ...(state.searchFailed === true && { searchFailed: false }),
      };
    case 'LOAD_MORE_SUCCESS':
      return {
        ...state,
        messages: [...state.messages, ...action.messages],
        hasMore: action.hasMore,
      };
    case 'RESET':
      return initialState;
    case 'OFFLINE_PAGE':
    case 'OFFLINE_PAGE_ERROR': {
      const slice = { rows: state.messages, fetchState: state.fetchState, hasMore: state.hasMore };
      const next =
        action.type === 'OFFLINE_PAGE'
          ? reduceEntityPage(slice, action.page, messageIdOf)
          : reduceEntityPageError(slice, action.notConnected, action.hasMore, false, true);
      return {
        ...state,
        messages: next.rows,
        fetchState: next.fetchState,
        hasMore: next.hasMore,
        // Android: a read with only filters that cannot reach the server is an empty search, never
        // "Connect to search" (that needs a keyword) or "Connect to load" (a plain list's).
        ...(state.connectToSearch === true && { connectToSearch: false }),
        ...(state.searchFailed === true && { searchFailed: false }),
      };
    }
    case 'OFFLINE_SEARCH_MISS':
      return {
        ...state,
        fetchState: 'empty',
        messages: [],
        hasMore: false,
        connectToSearch: true,
      };
    case 'OFFLINE_SEARCH_FAILED':
      return {
        ...state,
        fetchState: 'empty',
        messages: [],
        hasMore: false,
        searchFailed: true,
      };
    default:
      return state;
  }
}

// ── Hook ──

export interface CometChatUseCometChatSearchMessagesReturn {
  messages: CometChat.BaseMessage[];
  fetchState: CometChatFetchState;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  /** Offline: a keyword search could not reach the server and nothing is saved. */
  connectToSearch?: boolean;
  /** Offline: the search failed with a real error and nothing is shown (the screen decides). */
  searchFailed?: boolean;
}

export function useCometChatSearchMessages(
  options: CometChatUseCometChatSearchMessagesOptions
): CometChatUseCometChatSearchMessagesReturn {
  const {
    searchKeyword,
    activeFilters,
    uid,
    guid,
    alwaysShowSeeMore = false,
    messagesRequestBuilder,
    onError,
    onStateChange,
  } = options;

  const [state, dispatch] = useReducer(reducer, initialState);
  const managerRef = useRef<CometChatSearchMessagesManager>(new CometChatSearchMessagesManager());
  // D84: the offline state on screen, so the next reconnect runs the search again.
  const reloadOnConnectRef = useRef(false);
  const errorViewRef = useRef(false);
  errorViewRef.current = state.fetchState === 'error' || state.connectToSearch === true;

  // Offline support, inside the search screen: a real failure with nothing shown is held for the
  // screen, which has the other scope's answer (Android's updateFinalStateIfCompleted).
  const offlineSearch = useContext(CometChatSearchOfflineContext);
  const holdRef = useRef(offlineSearch?.hold);
  holdRef.current = offlineSearch?.hold;
  // Only a screen showing both scopes has another answer to wait for (see searchOffline.ts).
  const waitsForOtherScopeRef = useRef(false);
  waitsForOtherScopeRef.current = offlineSearch?.bothScopesActive === true;
  const holdFailure = (error: unknown): boolean => {
    if (!holdRef.current || !waitsForOtherScopeRef.current) return false;
    holdRef.current('messages', error);
    return true;
  };
  useEffect(
    () => () => {
      holdRef.current?.('messages', null);
    },
    []
  );

  // Notify parent of state changes
  useEffect(() => {
    onStateChange?.(state.fetchState);
  }, [state.fetchState, onStateChange]);

  // Offline support: the filter-only read now paging, and the rows it may replace.
  const filterReadRef = useRef<{ request: CometChat.MessagesRequest; limit: number } | null>(null);
  const filterReadInFlightRef = useRef(false);
  const messagesRef = useRef(state.messages);
  messagesRef.current = state.messages;

  /**
   * One two-phase page of a filter-only read (README §3.9, AC-10.1): the
   * device's matches first, then the server's in place. Offline it keeps what
   * the device has; with nothing to show it is the plain empty state (Android).
   */
  const readFilterPage = (
    read: { request: CometChat.MessagesRequest; limit: number },
    isStale: () => boolean
  ) => {
    filterReadInFlightRef.current = true;
    return readEntityPage<CometChat.BaseMessage>(
      {
        request: read.request as unknown as TwoPhaseRequest,
        kind: 'messages',
        direction: 'previous',
        refresh: false,
        idOf: messageIdOf,
        isStale,
        shown: () => messagesRef.current,
        hasMoreOf: page => page.length >= read.limit,
      },
      {
        onPage: page => {
          // Newest first, as today's search shows them.
          dispatch({ type: 'OFFLINE_PAGE', page: { ...page, rows: [...page.rows].reverse() } });
        },
        onError: (error, notConnected, hasMore) => {
          const shown = messagesRef.current.length > 0;
          // A real failure with nothing shown waits for the other scope (see holdFailure).
          if (!notConnected && !shown && holdFailure(error)) {
            dispatch({ type: 'OFFLINE_SEARCH_FAILED' });
            return;
          }
          dispatch({ type: 'OFFLINE_PAGE_ERROR', notConnected, hasMore });
          // Android: only a real error is reported. A read that cannot reach the server is an empty
          // search (or silent over results), so nothing is reported, and the kit does not run it
          // again on reconnect (only a "Connect to search" keyword search does).
          if (!notConnected && reportsReadError(false, shown, false, false)) {
            onError?.(error as CometChat.CometChatException);
          }
        },
      }
    ).finally(() => {
      if (!isStale()) filterReadInFlightRef.current = false;
    });
  };

  // ── Fetch on keyword/filter/scope change ──
  // Offline support: each search run supersedes the previous one's late answer.
  const searchGenRef = useRef(0);
  // Logout, user switch or cache reset (UIK-LIFE-01/02): the results go, and a
  // reset runs the search again.
  const [reloadTick, setReloadTick] = useState(0);
  const offlineUsedRef = useOfflineListLifecycle({
    onSessionEnd: () => {
      searchGenRef.current += 1;
      managerRef.current.reset();
      dispatch({ type: 'RESET' });
    },
    onCacheReset: () => {
      setReloadTick(tick => tick + 1);
    },
    // A user switch, or a login after the logout that cleared this list:
    // read it for whoever is signed in now, instead of staying on the blank
    // frame `onSessionEnd` left until this list is remounted (F1).
    onLogin: () => {
      setReloadTick(tick => tick + 1);
    },
  });
  useEffect(() => {
    searchGenRef.current += 1;
    const manager = managerRef.current;
    manager.reset();
    filterReadRef.current = null;
    filterReadInFlightRef.current = false;
    reloadOnConnectRef.current = false;
    holdRef.current?.('messages', null);

    if (!hasValidMessageSearchCriteria(searchKeyword, activeFilters, uid, guid)) {
      dispatch({ type: 'FETCH_EMPTY' });
      return;
    }

    // A newer search drops this one's answer, with offline on or off.
    const gen = searchGenRef.current;
    const cancelled = () => gen !== searchGenRef.current;

    if (isOfflineOn()) {
      // Offline path: a keyword has no cache, so the read is the server's only
      // (BEH-SNAP-04). Not connected is "Connect to search" (D84).
      offlineUsedRef.current = true;
      dispatch({ type: 'FETCH_START' });
      if (searchKeyword.trim() === '') {
        // Filters only: the device can answer, so two rounds (README §3.9).
        messagesRef.current = [];
        const read = manager.startFilterRead(
          activeFilters,
          uid,
          guid,
          alwaysShowSeeMore,
          messagesRequestBuilder ? copyRequestBuilder(messagesRequestBuilder) : undefined
        );
        filterReadRef.current = read;
        void readFilterPage(read, cancelled);
        return;
      }
      manager
        .search(
          searchKeyword,
          activeFilters,
          uid,
          guid,
          alwaysShowSeeMore,
          // The integrator's builder is copied, never changed.
          messagesRequestBuilder ? copyRequestBuilder(messagesRequestBuilder) : undefined
        )
        .then(({ results, hasMore }) => {
          if (cancelled()) return;
          if (results.length === 0) {
            dispatch({ type: 'FETCH_EMPTY' });
          } else {
            dispatch({ type: 'FETCH_SUCCESS', messages: results, hasMore });
          }
        })
        .catch((err: unknown) => {
          if (cancelled()) return;
          // D84: a keyword that could not reach the server is "Connect to search", not an error.
          if (isNotConnectedError(err)) {
            reloadOnConnectRef.current = true;
            dispatch({ type: 'OFFLINE_SEARCH_MISS' });
            return;
          }
          // A real failure with nothing shown waits for the other scope (see holdFailure).
          if (holdFailure(err)) {
            dispatch({ type: 'OFFLINE_SEARCH_FAILED' });
            return;
          }
          dispatch({ type: 'FETCH_ERROR' });
          onError?.(err as CometChat.CometChatException);
        });
      return;
    }

    dispatch({ type: 'FETCH_START' });

    manager
      .search(searchKeyword, activeFilters, uid, guid, alwaysShowSeeMore, messagesRequestBuilder)
      .then(({ results, hasMore }) => {
        if (cancelled()) return;
        if (results.length === 0) {
          dispatch({ type: 'FETCH_EMPTY' });
        } else {
          dispatch({ type: 'FETCH_SUCCESS', messages: results, hasMore });
        }
      })
      .catch((err: unknown) => {
        if (cancelled()) return;
        dispatch({ type: 'FETCH_ERROR' });
        onError?.(err as CometChat.CometChatException);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- offlineUsedRef is a ref
  }, [
    searchKeyword,
    activeFilters,
    uid,
    guid,
    alwaysShowSeeMore,
    messagesRequestBuilder,
    onError,
    reloadTick,
  ]);

  // D84: an offline state runs the search once more on reconnect.
  useReloadOnReconnect(
    () => errorViewRef.current && reloadOnConnectRef.current,
    () => {
      reloadOnConnectRef.current = false;
      setReloadTick(tick => tick + 1);
    }
  );

  // ── Load more ──
  const loadMore = useCallback(async () => {
    if (!state.hasMore) return;
    // A page the old search asked for is dropped once the search has changed.
    const gen = searchGenRef.current;
    const stale = () => gen !== searchGenRef.current;
    if (isOfflineOn()) {
      const filterRead = filterReadRef.current;
      if (filterRead) {
        // One read at a time: the SDK answers a second one with an error.
        if (filterReadInFlightRef.current) return;
        await readFilterPage(filterRead, stale);
        return;
      }
      // Offline path: a page that cannot reach the server leaves the results
      // shown, with no error toast.
      try {
        const { results, hasMore } = await managerRef.current.loadMore();
        if (stale()) return;
        dispatch({ type: 'LOAD_MORE_SUCCESS', messages: results, hasMore });
      } catch (err: unknown) {
        if (stale() || isNotConnectedError(err)) return;
        onError?.(err as CometChat.CometChatException);
      }
      return;
    }
    try {
      const { results, hasMore } = await managerRef.current.loadMore();
      if (stale()) return;
      dispatch({ type: 'LOAD_MORE_SUCCESS', messages: results, hasMore });
    } catch (err: unknown) {
      if (stale()) return;
      onError?.(err as CometChat.CometChatException);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- readFilterPage reads only refs and setters
  }, [state.hasMore, onError]);

  return {
    messages: state.messages,
    fetchState: state.fetchState,
    hasMore: state.hasMore,
    loadMore,
    ...(state.connectToSearch !== undefined && { connectToSearch: state.connectToSearch }),
    ...(state.searchFailed !== undefined && { searchFailed: state.searchFailed }),
  };
}
