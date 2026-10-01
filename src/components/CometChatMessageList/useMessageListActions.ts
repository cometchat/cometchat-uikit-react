import { useCallback, useRef } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { usePublishEvent } from '../../context/CometChatEventsContext';
import type { MessageListRefs, MessageListDispatch } from './messageListRefs';

// ---------------------------------------------------------------------------
// Message actions sub-hook (delete, mark as unread, react)
// ---------------------------------------------------------------------------

/**
 * Reaction list after toggling `emoji`. Uses fresh `ReactionCount` instances so
 * the pre-toggle snapshot stays intact for rollback.
 */
function computeOptimisticReactions(
  reactions: CometChat.ReactionCount[],
  emoji: string,
  isRemoving: boolean
): CometChat.ReactionCount[] {
  const next: CometChat.ReactionCount[] = [];
  let found = false;

  for (const reaction of reactions) {
    if (reaction.getReaction() !== emoji) {
      next.push(reaction);
      continue;
    }
    found = true;
    const count = reaction.getCount();
    if (isRemoving) {
      // Drop it entirely if we were the only reactor.
      if (count <= 1) continue;
      next.push(new CometChat.ReactionCount(emoji, count - 1, false));
    } else {
      next.push(new CometChat.ReactionCount(emoji, count + 1, true));
    }
  }

  if (!found && !isRemoving) {
    next.push(new CometChat.ReactionCount(emoji, 1, true));
  }

  return next;
}

export interface UseMessageListActionsOptions {
  onError: ((error: CometChat.CometChatException) => void) | null | undefined;
  onMessageDeleted: ((message: CometChat.BaseMessage) => void) | undefined;
  onConversationUpdated: ((conversation: CometChat.Conversation) => void) | undefined;
}

export interface UseMessageListActionsReturn {
  deleteMessage: (messageId: number) => Promise<void>;
  markMessageAsUnread: (message: CometChat.BaseMessage) => Promise<void>;
  reactToMessage: (messageId: number, emoji: string) => Promise<void>;
}

/**
 * Message action callbacks: delete, mark as unread, react.
 */
export function useMessageListActions(
  options: UseMessageListActionsOptions,
  refs: MessageListRefs,
  dispatch: MessageListDispatch
): UseMessageListActionsReturn {
  const { onError, onMessageDeleted, onConversationUpdated } = options;

  const publish = usePublishEvent();

  // Toggles in flight, keyed by message + emoji. A second toggle for the same
  // pair would race the first: both reconcile dispatches land in response order,
  // so the UI could settle on the opposite of the server state.
  const inFlightReactionsRef = useRef<Set<string>>(new Set());

  const deleteMessage = useCallback(
    async (messageId: number) => {
      if (!refs.managerRef.current) return;
      try {
        const deleted = await refs.managerRef.current.deleteMessage(messageId);
        dispatch({ type: 'MESSAGE_DELETED', message: deleted });
        publish({ type: 'ui:message/deleted', message: deleted });
        onMessageDeleted?.(deleted);
      } catch (error) {
        onError?.(error as CometChat.CometChatException);
      }
    },
    [onError, onMessageDeleted, refs.managerRef, dispatch, publish]
  );

  const markMessageAsUnread = useCallback(
    async (message: CometChat.BaseMessage) => {
      if (!refs.managerRef.current) return;

      // Guard against duplicate calls for the same message
      if (refs.lastUnreadMarkedIdRef.current === String(message.getId())) return;
      refs.lastUnreadMarkedIdRef.current = String(message.getId());

      try {
        const conversation = await refs.managerRef.current.markMessageAsUnread(message);
        const rawLastRead = conversation.getLastReadMessageId();
        const lastReadId = rawLastRead ? Number(rawLastRead) : null;
        const unreadCount = conversation.getUnreadMessageCount() || 0;

        dispatch({ type: 'SET_LAST_READ_MESSAGE_ID', messageId: lastReadId });
        dispatch({ type: 'SET_UNREAD_COUNT', count: unreadCount });
        dispatch({ type: 'SET_MARKED_UNREAD_BY_USER', value: true });
        dispatch({ type: 'SET_SHOW_UNREAD_BANNER', value: true });

        // Notify sibling components (conversations list) about the updated conversation
        publish({ type: 'ui:conversation/updated', conversation });
        onConversationUpdated?.(conversation);
      } catch (error) {
        onError?.(error as CometChat.CometChatException);
      }
    },
    [onError, onConversationUpdated, refs.managerRef, refs.lastUnreadMarkedIdRef, dispatch, publish]
  );

  const reactToMessage = useCallback(
    async (messageId: number, emoji: string) => {
      const currentState = refs.stateRef.current;
      const targetMessage = currentState.messages.find(m => m.getId() === messageId);
      if (!targetMessage) return;

      const inFlightKey = `${String(messageId)}:${emoji}`;
      if (inFlightReactionsRef.current.has(inFlightKey)) return;
      inFlightReactionsRef.current.add(inFlightKey);

      const originalReactions = targetMessage.getReactions();

      // Toggle: removing only if we already reacted with this emoji.
      const existingReaction = originalReactions.find(
        (r: CometChat.ReactionCount) => r.getReaction() === emoji
      );
      const isRemoving = existingReaction?.getReactedByMe() === true;

      // Optimistic update — reflect the change immediately, like v6.
      const optimisticReactions = computeOptimisticReactions(originalReactions, emoji, isRemoving);
      dispatch({ type: 'REACTION_UPDATE', messageId, reactions: optimisticReactions });

      try {
        const updatedMessage = isRemoving
          ? await CometChat.removeReaction(messageId, emoji)
          : await CometChat.addReaction(messageId, emoji);

        const reactions = updatedMessage.getReactions();

        // Reconcile with the server's authoritative reactions.
        dispatch({
          type: 'REACTION_UPDATE',
          messageId,
          reactions: reactions,
        });

        // The socket does not echo our own reaction back, so tell the other
        // surfaces showing this message ourselves.
        publish({ type: 'ui:message/reaction-changed', messageId, reactions });
      } catch (error) {
        // Undo our own change against the CURRENT reactions rather than
        // replaying the pre-request snapshot: a reaction from someone else may
        // have arrived over the socket while the request was in flight, and the
        // snapshot would erase it.
        const latest = refs.stateRef.current.messages.find(
          m => String(m.getId()) === String(messageId)
        );
        let rollbackReactions = originalReactions;
        if (latest) {
          const latestReactions = latest.getReactions();
          const entry = latestReactions.find(
            (r: CometChat.ReactionCount) => r.getReaction() === emoji
          );
          // reactedByMe flips in both directions, so it tells us whether the
          // optimistic update is actually reflected in what we just read (state
          // may not have caught up with the dispatch yet). Removing our only
          // reaction drops the entry entirely, which counts as reflected.
          const optimisticApplied = entry ? entry.getReactedByMe() === !isRemoving : isRemoving;
          rollbackReactions = optimisticApplied
            ? computeOptimisticReactions(latestReactions, emoji, !isRemoving)
            : latestReactions;
        }
        dispatch({ type: 'REACTION_UPDATE', messageId, reactions: rollbackReactions });
        onError?.(error as CometChat.CometChatException);
      } finally {
        inFlightReactionsRef.current.delete(inFlightKey);
      }
    },
    [onError, refs.stateRef, dispatch, publish]
  );

  return {
    deleteMessage,
    markMessageAsUnread,
    reactToMessage,
  };
}
