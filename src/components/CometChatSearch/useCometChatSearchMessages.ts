import { useCallback, useEffect, useReducer, useRef } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatSearchMessagesManager } from './CometChatSearchMessagesManager';
import { hasValidMessageSearchCriteria } from './CometChatSearchFilterUtils';
import type {
  CometChatSearchMessagesState,
  CometChatUseCometChatSearchMessagesOptions,
} from './CometChatSearch.types';
import type { CometChatFetchState } from '../../types';

// ── Reducer ──

type Action =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; messages: CometChat.BaseMessage[]; hasMore: boolean }
  | { type: 'FETCH_ERROR' }
  | { type: 'FETCH_EMPTY' }
  | { type: 'LOAD_MORE_SUCCESS'; messages: CometChat.BaseMessage[]; hasMore: boolean }
  | { type: 'RESET' };

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
      return { ...state, fetchState: 'loading', messages: [], hasMore: false };
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
      return { ...state, fetchState: 'empty', messages: [], hasMore: false };
    case 'LOAD_MORE_SUCCESS':
      return {
        ...state,
        messages: [...state.messages, ...action.messages],
        hasMore: action.hasMore,
      };
    case 'RESET':
      return initialState;
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

  // Notify parent of state changes
  useEffect(() => {
    onStateChange?.(state.fetchState);
  }, [state.fetchState, onStateChange]);

  // ── Fetch on keyword/filter/scope change ──
  useEffect(() => {
    const manager = managerRef.current;
    manager.reset();

    if (!hasValidMessageSearchCriteria(searchKeyword, activeFilters, uid, guid)) {
      dispatch({ type: 'FETCH_EMPTY' });
      return;
    }

    dispatch({ type: 'FETCH_START' });

    manager
      .search(searchKeyword, activeFilters, uid, guid, alwaysShowSeeMore, messagesRequestBuilder)
      .then(({ results, hasMore }) => {
        if (results.length === 0) {
          dispatch({ type: 'FETCH_EMPTY' });
        } else {
          dispatch({ type: 'FETCH_SUCCESS', messages: results, hasMore });
        }
      })
      .catch((err: unknown) => {
        dispatch({ type: 'FETCH_ERROR' });
        onError?.(err as CometChat.CometChatException);
      });
  }, [searchKeyword, activeFilters, uid, guid, alwaysShowSeeMore, messagesRequestBuilder, onError]);

  // ── Load more ──
  const loadMore = useCallback(async () => {
    if (!state.hasMore) return;
    try {
      const { results, hasMore } = await managerRef.current.loadMore();
      dispatch({ type: 'LOAD_MORE_SUCCESS', messages: results, hasMore });
    } catch (err: unknown) {
      onError?.(err as CometChat.CometChatException);
    }
  }, [state.hasMore, onError]);

  return {
    messages: state.messages,
    fetchState: state.fetchState,
    hasMore: state.hasMore,
    loadMore,
  };
}
