import { useCallback, useContext, useEffect, useId, useReducer, useRef, useState } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatSearchConversationsManager } from './CometChatSearchConversationsManager';
import { hasValidSearchCriteria } from './CometChatSearchFilterUtils';
import type {
  CometChatSearchConversationsState,
  CometChatUseCometChatSearchConversationsOptions,
} from './CometChatSearch.types';
import type { CometChatFetchState } from '../../types';
import { isOfflineOn } from '../../utils/offline/gate';
import { CometChatSearchOfflineContext } from './searchOffline';
import { useOfflineListLifecycle } from '../../utils/offline/useOfflineListLifecycle';
import { isNotConnectedError } from '../../utils/offline/reconcile';
import { useReloadOnReconnect } from '../../utils/offline/useReloadOnReconnect';
import { rowFromMessageOffline } from '../CometChatConversations/conversationsOffline';
import { copyRequestBuilder } from '../../utils/copyRequestBuilder';
import {
  readEntityPage,
  reduceEntityPage,
  reduceEntityPageError,
  reportsReadError,
  type EntityPagePayload,
} from '../../utils/offline/entityList';
import type { TwoPhaseRequest } from '../../utils/offline/two-phase';

// ── Reducer ──

type Action =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; conversations: CometChat.Conversation[]; hasMore: boolean }
  | { type: 'FETCH_ERROR' }
  | { type: 'FETCH_EMPTY' }
  | { type: 'LOAD_MORE_SUCCESS'; conversations: CometChat.Conversation[]; hasMore: boolean }
  | { type: 'UPDATE_CONVERSATION'; conversation: CometChat.Conversation }
  | { type: 'MOVE_TO_TOP'; conversation: CometChat.Conversation }
  | { type: 'REMOVE_CONVERSATION'; conversationId: string }
  | { type: 'SET_TYPING'; indicator: CometChat.TypingIndicator; id: string }
  | { type: 'CLEAR_TYPING'; id: string }
  | { type: 'RESET' }
  // Offline support: one phase of a filter-only read.
  | { type: 'OFFLINE_PAGE'; page: EntityPagePayload<CometChat.Conversation> }
  | { type: 'OFFLINE_PAGE_ERROR'; notConnected: boolean; hasMore: boolean }
  // Offline support: a keyword search could not reach the server (D84: "Connect to search").
  | { type: 'OFFLINE_SEARCH_MISS' }
  // Offline support: a search failed with a real error and nothing is shown. The search screen
  // decides, once every scope has answered, whether that is an error or the plain empty state.
  | { type: 'OFFLINE_SEARCH_FAILED' };

const conversationIdOf = (conversation: CometChat.Conversation): string =>
  conversation.getConversationId();

const initialState: CometChatSearchConversationsState = {
  conversations: [],
  fetchState: 'idle',
  hasMore: false,
  typingIndicators: new Map(),
};

function reducer(
  state: CometChatSearchConversationsState,
  action: Action
): CometChatSearchConversationsState {
  switch (action.type) {
    case 'FETCH_START':
      return {
        ...state,
        fetchState: 'loading',
        conversations: [],
        hasMore: false,
        // Offline states from the last search end with it; absent with offline off.
        ...(state.connectToSearch === true && { connectToSearch: false }),
        ...(state.searchFailed === true && { searchFailed: false }),
      };
    case 'FETCH_SUCCESS':
      return {
        ...state,
        fetchState: 'loaded',
        conversations: action.conversations,
        hasMore: action.hasMore,
      };
    case 'FETCH_ERROR':
      return { ...state, fetchState: 'error' };
    case 'FETCH_EMPTY':
      return {
        ...state,
        fetchState: 'empty',
        conversations: [],
        hasMore: false,
        ...(state.searchFailed === true && { searchFailed: false }),
      };
    case 'LOAD_MORE_SUCCESS': {
      const existingIds = new Set(state.conversations.map(c => c.getConversationId()));
      const newItems = action.conversations.filter(c => !existingIds.has(c.getConversationId()));
      return {
        ...state,
        conversations: [...state.conversations, ...newItems],
        hasMore: action.hasMore,
      };
    }
    case 'UPDATE_CONVERSATION': {
      const idx = state.conversations.findIndex(
        c => c.getConversationId() === action.conversation.getConversationId()
      );
      if (idx === -1) return state;
      const updated = [...state.conversations];
      updated[idx] = action.conversation;
      return { ...state, conversations: updated };
    }
    case 'MOVE_TO_TOP': {
      const convId = action.conversation.getConversationId();
      const idx = state.conversations.findIndex(c => c.getConversationId() === convId);
      if (idx === -1) return state;
      const rest = state.conversations.filter((_, i) => i !== idx);
      return { ...state, conversations: [action.conversation, ...rest] };
    }
    case 'REMOVE_CONVERSATION': {
      const filtered = state.conversations.filter(
        c => c.getConversationId() !== action.conversationId
      );
      return {
        ...state,
        conversations: filtered,
        fetchState: filtered.length === 0 ? 'empty' : state.fetchState,
      };
    }
    case 'SET_TYPING': {
      const next = new Map(state.typingIndicators);
      next.set(action.id, action.indicator);
      return { ...state, typingIndicators: next };
    }
    case 'CLEAR_TYPING': {
      if (!state.typingIndicators.has(action.id)) return state;
      const next = new Map(state.typingIndicators);
      next.delete(action.id);
      return { ...state, typingIndicators: next };
    }
    case 'RESET':
      return initialState;
    case 'OFFLINE_PAGE':
    case 'OFFLINE_PAGE_ERROR': {
      const slice = {
        rows: state.conversations,
        fetchState: state.fetchState,
        hasMore: state.hasMore,
      };
      const next =
        action.type === 'OFFLINE_PAGE'
          ? reduceEntityPage(slice, action.page, conversationIdOf)
          : reduceEntityPageError(slice, action.notConnected, action.hasMore, false, true);
      return {
        ...state,
        conversations: next.rows,
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
        conversations: [],
        hasMore: false,
        connectToSearch: true,
      };
    case 'OFFLINE_SEARCH_FAILED':
      return {
        ...state,
        fetchState: 'empty',
        conversations: [],
        hasMore: false,
        searchFailed: true,
      };
    default:
      return state;
  }
}

// ── Hook ──

export interface CometChatUseCometChatSearchConversationsReturn {
  conversations: CometChat.Conversation[];
  fetchState: CometChatFetchState;
  hasMore: boolean;
  typingIndicators: Map<string, CometChat.TypingIndicator>;
  loadMore: () => Promise<void>;
  /** Offline: a keyword search could not reach the server and nothing is saved. */
  connectToSearch?: boolean;
  /** Offline: the search failed with a real error and nothing is shown (the screen decides). */
  searchFailed?: boolean;
}

export function useCometChatSearchConversations(
  options: CometChatUseCometChatSearchConversationsOptions
): CometChatUseCometChatSearchConversationsReturn {
  const { searchKeyword, activeFilters, conversationsRequestBuilder, onError, onStateChange } =
    options;

  const [state, dispatch] = useReducer(reducer, initialState);
  const managerRef = useRef<CometChatSearchConversationsManager>(
    new CometChatSearchConversationsManager()
  );
  const instanceId = useId();
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
    holdRef.current('conversations', error);
    return true;
  };
  useEffect(
    () => () => {
      holdRef.current?.('conversations', null);
    },
    []
  );

  // Notify parent of state changes
  useEffect(() => {
    onStateChange?.(state.fetchState);
  }, [state.fetchState, onStateChange]);

  // Offline support: the filter-only read now paging, and the rows it may replace.
  const filterRequestRef = useRef<CometChat.ConversationsRequest | null>(null);
  const filterReadInFlightRef = useRef(false);
  const shownRef = useRef(state.conversations);
  shownRef.current = state.conversations;

  /**
   * One two-phase page of a filter-only read (README §3.9, AC-10.1): the
   * device's matches first, then the server's in place. Offline it keeps what
   * the device has; with nothing to show it is the plain empty state (Android).
   */
  const readFilterPage = (
    request: CometChat.ConversationsRequest,
    isStale: () => boolean
  ) => {
    filterReadInFlightRef.current = true;
    return readEntityPage<CometChat.Conversation>(
      {
        request: request as unknown as TwoPhaseRequest,
        kind: 'conversations',
        direction: 'next',
        refresh: false,
        idOf: conversationIdOf,
        isStale,
        shown: () => shownRef.current,
        hasMoreOf: page => page.length >= 30,
      },
      {
        onPage: page => {
          dispatch({ type: 'OFFLINE_PAGE', page });
        },
        onError: (error, notConnected, hasMore) => {
          const shown = shownRef.current.length > 0;
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

  // ── Fetch on keyword/filter change ──
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
    filterRequestRef.current = null;
    filterReadInFlightRef.current = false;
    reloadOnConnectRef.current = false;
    holdRef.current?.('conversations', null);

    if (!hasValidSearchCriteria(searchKeyword, activeFilters)) {
      dispatch({ type: 'FETCH_EMPTY' });
      return;
    }

    // A newer search drops this one's answer, with offline on or off.
    const gen = searchGenRef.current;
    const cancelled = () => gen !== searchGenRef.current;

    if (isOfflineOn()) {
      // Offline path: a keyword has no cache, so the read is the server's only
      // (BEH-SNAP-04). Not connected is a failed search like any other (D83).
      offlineUsedRef.current = true;
      dispatch({ type: 'FETCH_START' });
      if (searchKeyword.trim() === '') {
        // Filters only: the device can answer, so two rounds (README §3.9).
        shownRef.current = [];
        const request = manager.startFilterRead(
          activeFilters,
          conversationsRequestBuilder ? copyRequestBuilder(conversationsRequestBuilder) : undefined
        );
        filterRequestRef.current = request;
        void readFilterPage(request, cancelled);
        return;
      }
      manager
        .search(
          searchKeyword,
          activeFilters,
          // The integrator's builder is copied, never changed.
          conversationsRequestBuilder ? copyRequestBuilder(conversationsRequestBuilder) : undefined
        )
        .then(({ results, hasMore }) => {
          if (cancelled()) return;
          if (results.length === 0) {
            dispatch({ type: 'FETCH_EMPTY' });
          } else {
            dispatch({ type: 'FETCH_SUCCESS', conversations: results, hasMore });
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
      .search(searchKeyword, activeFilters, conversationsRequestBuilder)
      .then(({ results, hasMore }) => {
        if (cancelled()) return;
        if (results.length === 0) {
          dispatch({ type: 'FETCH_EMPTY' });
        } else {
          dispatch({ type: 'FETCH_SUCCESS', conversations: results, hasMore });
        }
      })
      .catch((err: unknown) => {
        if (cancelled()) return;
        dispatch({ type: 'FETCH_ERROR' });
        onError?.(err as CometChat.CometChatException);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- offlineUsedRef is a ref
  }, [searchKeyword, activeFilters, conversationsRequestBuilder, onError, reloadTick]);

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
      const filterRequest = filterRequestRef.current;
      if (filterRequest) {
        // One read at a time: the SDK answers a second one with an error.
        if (filterReadInFlightRef.current) return;
        await readFilterPage(filterRequest, stale);
        return;
      }
      // Offline path: a page that cannot reach the server leaves the results
      // shown, with no error toast.
      try {
        const { results, hasMore } = await managerRef.current.loadMore();
        if (stale()) return;
        dispatch({
          type: 'LOAD_MORE_SUCCESS',
          conversations: results,
          hasMore: results.length > 0 ? hasMore : false,
        });
      } catch (err: unknown) {
        if (stale() || isNotConnectedError(err)) return;
        onError?.(err as CometChat.CometChatException);
      }
      return;
    }
    try {
      const { results, hasMore } = await managerRef.current.loadMore();
      if (stale()) return;
      if (results.length > 0) {
        dispatch({ type: 'LOAD_MORE_SUCCESS', conversations: results, hasMore });
      } else {
        dispatch({ type: 'LOAD_MORE_SUCCESS', conversations: [], hasMore: false });
      }
    } catch (err: unknown) {
      if (stale()) return;
      onError?.(err as CometChat.CometChatException);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- readFilterPage reads only refs and setters
  }, [state.hasMore, onError]);

  // Keep a ref to current conversations for use in listeners (avoids stale closures)
  const conversationsRef = useRef<CometChat.Conversation[]>([]);
  useEffect(() => {
    conversationsRef.current = state.conversations;
  }, [state.conversations]);

  // ── Message listener (move to top on new message, update unread count) ──
  useEffect(() => {
    const listenerId = `CometChatSearch_Conv_Msg_${instanceId}`;

    // Get logged-in user UID for unread count logic
    let loggedInUserId: string | null = null;
    CometChat.getLoggedinUser()
      .then(user => {
        loggedInUserId = user?.getUid() ?? null;
      })
      .catch(() => {
        /* ignore */
      });

    const cleanup = CometChatSearchConversationsManager.attachMessageListener(listenerId, {
      onMessageReceived: (msg: CometChat.BaseMessage) => {
        const convId = msg.getConversationId();
        const existingConv = conversationsRef.current.find(c => c.getConversationId() === convId);
        if (!existingConv) return;

        // Get fresh conversation from SDK (has updated lastMessage)
        // Offline support: a swept own message may name its receiver by id only.
        const rebuilt: Promise<CometChat.Conversation | null> = isOfflineOn()
          ? rowFromMessageOffline(msg, [existingConv])
          : CometChat.CometChatHelper.getConversationFromMessage(msg);
        rebuilt
          .then(freshConv => {
            if (!freshConv) return;
            // Increment unread count using existing state as base
            const senderUid = msg.getSender().getUid();
            if (senderUid && loggedInUserId && senderUid !== loggedInUserId) {
              const baseCount = existingConv.getUnreadMessageCount() || 0;
              freshConv.setUnreadMessageCount(baseCount + 1);
            } else {
              // Own message — preserve existing unread count
              freshConv.setUnreadMessageCount(existingConv.getUnreadMessageCount() || 0);
            }
            dispatch({ type: 'MOVE_TO_TOP', conversation: freshConv });
          })
          .catch(() => {
            // Fallback: just move existing to top
            dispatch({ type: 'MOVE_TO_TOP', conversation: existingConv });
          });
      },
      onMessageEdited: (msg: CometChat.BaseMessage) => {
        const convId = msg.getConversationId();
        const conv = conversationsRef.current.find(c => c.getConversationId() === convId);
        if (conv) dispatch({ type: 'UPDATE_CONVERSATION', conversation: conv });
      },
      onMessageDeleted: (msg: CometChat.BaseMessage) => {
        const convId = msg.getConversationId();
        const conv = conversationsRef.current.find(c => c.getConversationId() === convId);
        if (conv) dispatch({ type: 'UPDATE_CONVERSATION', conversation: conv });
      },
    });
    return cleanup;
  }, [instanceId]);

  // ── User status listener ──
  useEffect(() => {
    const listenerId = `CometChatSearch_Conv_User_${instanceId}`;
    const cleanup = CometChatSearchConversationsManager.attachUserListener(listenerId, {
      onUserOnline: (user: CometChat.User) => {
        const uid = user.getUid();
        const conv = conversationsRef.current.find(c => {
          const convWith = c.getConversationWith();
          return (
            c.getConversationType() === 'user' && (convWith as CometChat.User).getUid() === uid
          );
        });
        if (conv) dispatch({ type: 'UPDATE_CONVERSATION', conversation: conv });
      },
      onUserOffline: (user: CometChat.User) => {
        const uid = user.getUid();
        const conv = conversationsRef.current.find(c => {
          const convWith = c.getConversationWith();
          return (
            c.getConversationType() === 'user' && (convWith as CometChat.User).getUid() === uid
          );
        });
        if (conv) dispatch({ type: 'UPDATE_CONVERSATION', conversation: conv });
      },
    });
    return cleanup;
  }, [instanceId]);

  // ── Typing listener ──
  useEffect(() => {
    const listenerId = `CometChatSearch_Conv_Typing_${instanceId}`;
    const cleanup = CometChatSearchConversationsManager.attachTypingListener(listenerId, {
      onTypingStarted: (indicator: CometChat.TypingIndicator) => {
        const isGroup = indicator.getReceiverType() === 'group';
        const id = isGroup ? indicator.getReceiverId() : indicator.getSender().getUid();
        if (id) dispatch({ type: 'SET_TYPING', indicator, id });
      },
      onTypingEnded: (indicator: CometChat.TypingIndicator) => {
        const isGroup = indicator.getReceiverType() === 'group';
        const id = isGroup ? indicator.getReceiverId() : indicator.getSender().getUid();
        if (id) dispatch({ type: 'CLEAR_TYPING', id });
      },
    });
    return cleanup;
  }, [instanceId]);

  return {
    conversations: state.conversations,
    fetchState: state.fetchState,
    hasMore: state.hasMore,
    typingIndicators: state.typingIndicators,
    loadMore,
    ...(state.connectToSearch !== undefined && { connectToSearch: state.connectToSearch }),
    ...(state.searchFailed !== undefined && { searchFailed: state.searchFailed }),
  };
}
