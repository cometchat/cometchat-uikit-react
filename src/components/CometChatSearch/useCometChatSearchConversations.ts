import { useCallback, useEffect, useId, useReducer, useRef } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatSearchConversationsManager } from './CometChatSearchConversationsManager';
import { hasValidSearchCriteria } from './CometChatSearchFilterUtils';
import type {
  CometChatSearchConversationsState,
  CometChatUseCometChatSearchConversationsOptions,
} from './CometChatSearch.types';
import type { CometChatFetchState } from '../../types';

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
  | { type: 'RESET' };

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
      return { ...state, fetchState: 'loading', conversations: [], hasMore: false };
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
      return { ...state, fetchState: 'empty', conversations: [], hasMore: false };
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

  // Notify parent of state changes
  useEffect(() => {
    onStateChange?.(state.fetchState);
  }, [state.fetchState, onStateChange]);

  // ── Fetch on keyword/filter change ──
  useEffect(() => {
    const manager = managerRef.current;
    manager.reset();

    if (!hasValidSearchCriteria(searchKeyword, activeFilters)) {
      dispatch({ type: 'FETCH_EMPTY' });
      return;
    }

    dispatch({ type: 'FETCH_START' });

    manager
      .search(searchKeyword, activeFilters, conversationsRequestBuilder)
      .then(({ results, hasMore }) => {
        if (results.length === 0) {
          dispatch({ type: 'FETCH_EMPTY' });
        } else {
          dispatch({ type: 'FETCH_SUCCESS', conversations: results, hasMore });
        }
      })
      .catch((err: unknown) => {
        dispatch({ type: 'FETCH_ERROR' });
        onError?.(err as CometChat.CometChatException);
      });
  }, [searchKeyword, activeFilters, conversationsRequestBuilder, onError]);

  // ── Load more ──
  const loadMore = useCallback(async () => {
    if (!state.hasMore) return;
    try {
      const { results, hasMore } = await managerRef.current.loadMore();
      if (results.length > 0) {
        dispatch({ type: 'LOAD_MORE_SUCCESS', conversations: results, hasMore });
      } else {
        dispatch({ type: 'LOAD_MORE_SUCCESS', conversations: [], hasMore: false });
      }
    } catch (err: unknown) {
      onError?.(err as CometChat.CometChatException);
    }
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
        CometChat.CometChatHelper.getConversationFromMessage(msg)
          .then((freshConv: CometChat.Conversation) => {
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
  };
}
