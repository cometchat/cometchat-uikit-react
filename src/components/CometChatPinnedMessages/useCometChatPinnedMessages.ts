import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { useCometChatEvents } from '../../hooks/useCometChatEvents';
import type { CometChatEvent } from '../../context/CometChatEvents.types';
import { cloneMessage } from '../CometChatMessageList/CometChatMessageList.utils';
import { CometChatPinnedMessagesManager } from './CometChatPinnedMessagesManager';
import {
  initialPinnedMessagesState,
  pinnedMessagesReducer,
} from './CometChatPinnedMessages.reducer';
import type { CometChatPinnedMessagesState } from './CometChatPinnedMessages.types';

/**
 * Does this message belong to the conversation the panel is scoped to?
 *
 * Deliberately NOT the message list's `isMessageForConversation`: that one drops
 * messages sent by the logged-in user (they arrive via the optimistic path) and
 * rejects thread replies outside thread mode. Both are wrong here — your own pins
 * count, and thread replies are pinnable.
 */
export function isMessageInConversation(
  message: CometChat.BaseMessage,
  uid: string | undefined,
  guid: string | undefined
): boolean {
  const receiverType = message.getReceiverType();
  const receiverId = message.getReceiverId();

  if (guid) return receiverType === 'group' && receiverId === guid;

  if (uid) {
    if (receiverType !== 'user') return false;
    // In a 1-1, a message belongs to the conversation whether the other party is
    // the receiver (we sent it) or the sender (they did).
    return receiverId === uid || message.getSender().getUid() === uid;
  }

  return false;
}

export interface UseCometChatPinnedMessagesReturn extends CometChatPinnedMessagesState {
  /** Total rows currently held. Exposed for custom header views. */
  count: number;
  loadMore: () => void;
  reload: () => void;
}

/**
 * useCometChatPinnedMessages — one conversation's pinned list, kept live.
 *
 * Pin is a broadcast: an event fires for every conversation this user is in, so
 * every incoming pin is filtered against this panel's scope before it lands.
 *
 * Read-only by contract — never marks read, never sends receipts.
 */
export function useCometChatPinnedMessages(
  user?: CometChat.User,
  group?: CometChat.Group,
  messagesRequestBuilder?: CometChat.MessagesRequestBuilder
): UseCometChatPinnedMessagesReturn {
  const uid = user?.getUid();
  const guid = group?.getGuid();

  const [state, dispatch] = useReducer(pinnedMessagesReducer, initialPinnedMessagesState);
  const managerRef = useRef<CometChatPinnedMessagesManager | null>(null);

  const fetchFirst = useCallback(() => {
    const manager = new CometChatPinnedMessagesManager(uid, guid, messagesRequestBuilder);
    managerRef.current = manager;
    dispatch({ type: 'RESET' });
    dispatch({ type: 'FETCH_START' });
    manager
      .fetchFirst()
      .then(({ messages, hasMore }) => {
        // A conversation switch mid-flight must not land the old result.
        if (managerRef.current !== manager) return;
        dispatch({ type: 'FETCH_SUCCESS', messages, hasMore });
      })
      .catch((error: unknown) => {
        if (managerRef.current !== manager) return;
        dispatch({
          type: 'FETCH_ERROR',
          error: error instanceof Error ? error.message : 'Failed to load pinned messages',
        });
      });
  }, [uid, guid, messagesRequestBuilder]);

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
          error: error instanceof Error ? error.message : 'Failed to load pinned messages',
        });
      });
  }, [state.hasMore, state.fetchState]);

  useEffect(() => {
    fetchFirst();
  }, [fetchFirst]);

  const messagesRef = useRef(state.messages);
  messagesRef.current = state.messages;

  useCometChatEvents(
    (event: CometChatEvent) => {
      switch (event.type) {
        case 'message/pinned':
        case 'ui:message/pin-changed': {
          if (!isMessageInConversation(event.message, uid, guid)) break;
          if (event.type === 'ui:message/pin-changed' && !event.pinned) {
            dispatch({ type: 'REMOVE_MESSAGE', messageId: String(event.message.getId()) });
            break;
          }
          dispatch({ type: 'MESSAGE_PINNED', message: event.message });
          break;
        }

        case 'message/unpinned': {
          if (!isMessageInConversation(event.message, uid, guid)) break;
          dispatch({ type: 'REMOVE_MESSAGE', messageId: String(event.message.getId()) });
          break;
        }

        // The panel renders full bubbles, so anything that changes a bubble's
        // content has to reach it: an edit rewrites the text, moderation can
        // replace it with a notice.
        case 'message/edited':
        case 'message/moderated': {
          dispatch({ type: 'MESSAGE_UPDATED', message: cloneMessage(event.message) });
          break;
        }

        // Save is per-viewer, so a saved/unsaved message here is always this
        // user's. Re-dispatching with a fresh reference is what flips both the
        // glyph and the Save/Unsave option — the optimistic path mutates the
        // message in place, and memoized options never recompute off the same
        // object.
        case 'message/saved':
        case 'message/unsaved':
        case 'ui:message/save-changed': {
          dispatch({
            type: 'MESSAGE_UPDATED',
            message: cloneMessage(event.message),
            pinSaveAuthoritative: true,
          });
          break;
        }

        // Reactions render on the bubble here (only the *option* to react is
        // hidden), so the chips must stay live.
        case 'reaction/added':
        case 'reaction/removed': {
          const reactionEvent = event.event;
          const rawId = reactionEvent.getReaction().getMessageId();
          const messageId = typeof rawId === 'string' ? parseInt(rawId, 10) : rawId;
          const existing = messagesRef.current.find(m => String(m.getId()) === String(messageId));
          // Not pinned here — the reaction belongs to some other message.
          if (!existing) break;

          const updated = CometChat.CometChatHelper.updateMessageWithReactionInfo(
            cloneMessage(existing),
            reactionEvent.getReaction(),
            event.type === 'reaction/added'
              ? CometChat.REACTION_ACTION.REACTION_ADDED
              : CometChat.REACTION_ACTION.REACTION_REMOVED
          ) as CometChat.BaseMessage;
          dispatch({ type: 'MESSAGE_UPDATED', message: updated });
          break;
        }

        // Our own reaction, which the socket never sends back.
        case 'ui:message/reaction-changed': {
          const existing = messagesRef.current.find(
            m => String(m.getId()) === String(event.messageId)
          );
          if (!existing) break;
          const updated = cloneMessage(existing);
          updated.setReactions(event.reactions);
          dispatch({ type: 'MESSAGE_UPDATED', message: updated });
          break;
        }

        case 'message/deleted':
        case 'ui:message/deleted': {
          const deletedId = event.message.getId();
          dispatch({ type: 'REMOVE_MESSAGE', messageId: String(deletedId) });

          // Deleting a parent does not delete its replies, so an orphaned pinned
          // reply would otherwise linger.
          messagesRef.current.forEach(m => {
            const parentId =
              typeof m.getParentMessageId === 'function' ? m.getParentMessageId() : 0;
            if (parentId && String(parentId) === String(deletedId)) {
              dispatch({ type: 'REMOVE_MESSAGE', messageId: String(m.getId()) });
            }
          });
          break;
        }

        default:
          break;
      }
    },
    [uid, guid]
  );

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
