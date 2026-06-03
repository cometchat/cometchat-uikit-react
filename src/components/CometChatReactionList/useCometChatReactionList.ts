import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatReactionListManager } from './CometChatReactionListManager';
import { reactionListReducer, initialReactionListState } from './CometChatReactionList.reducer';
import type { CometChatReactionListContextValue } from './CometChatReactionList.types';

const DEFAULT_LIMIT = 20;

export interface CometChatUseCometChatReactionListOptions {
  message: CometChat.BaseMessage;
  reactionsRequestBuilder?: CometChat.ReactionsRequestBuilder;
  onItemClick?: (reaction: CometChat.Reaction, message: CometChat.BaseMessage) => void;
  onEmpty?: () => void;
  onError?: (error: unknown) => void;
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
  const [loggedInUserUid, setLoggedInUserUid] = useStateRef('');

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
    // setLoggedInUserUid is stable (from useReducer dispatch), safe to omit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Error handler ---
  const handleError = useCallback(
    (error: unknown) => {
      onError?.(error);
      dispatch({ type: 'FETCH_ERROR' });
    },
    [onError]
  );

  // --- Fetch more reactions (pagination) ---
  const fetchMore = useCallback(async () => {
    if (!managerRef.current || !state.hasMore || state.isFetching) return;

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
  }, [state.hasMore, state.isFetching, handleError]);

  // --- Initialize manager and fetch on mount ---
  useEffect(() => {
    const messageId = message.getId();
    if (!messageId) return;

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
  }, [message, reactionsRequestBuilder, handleError]);

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

/**
 * Simple useState-like hook that also updates a ref.
 * Used to keep loggedInUserUid in sync for both render and callbacks.
 */
function useStateRef(initial: string): [string, (v: string) => void] {
  const [value, setValue] = useReducer((_: string, next: string) => next, initial);
  return [value, setValue];
}
