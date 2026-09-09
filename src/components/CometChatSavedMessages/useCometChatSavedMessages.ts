import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { useCometChatEvents } from '../../hooks/useCometChatEvents';
import type { CometChatEvent } from '../../context/CometChatEvents.types';
import { cloneMessage } from '../CometChatMessageList/CometChatMessageList.utils';
import { CometChatSavedMessagesManager } from './CometChatSavedMessagesManager';
import { initialSavedMessagesState, savedMessagesReducer } from './CometChatSavedMessages.reducer';
import type { CometChatSavedMessagesState } from './CometChatSavedMessages.types';

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
  const [state, dispatch] = useReducer(savedMessagesReducer, initialSavedMessagesState);
  const managerRef = useRef<CometChatSavedMessagesManager | null>(null);

  /**
   * Rebuilt when the caller's builder changes, so a new page size or filter
   * actually takes effect. Creating it once and reusing it would silently pin the
   * first builder for the lifetime of the panel.
   */
  const fetchFirst = useCallback(() => {
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
  }, [messagesRequestBuilder]);

  const loadMore = useCallback(() => {
    const manager = managerRef.current;
    if (!manager || !state.hasMore || state.fetchState === 'loading') return;
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
  }, [state.hasMore, state.fetchState]);

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
