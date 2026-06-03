import { useCallback } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { usePublishEvent } from '../../context/CometChatEventsContext';
import type { MessageListRefs, MessageListDispatch } from './messageListRefs';

// ---------------------------------------------------------------------------
// Message actions sub-hook (delete, mark as unread, react)
// ---------------------------------------------------------------------------

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

      // Determine if we're adding or removing (toggle behavior)
      const existingReactions = targetMessage.getReactions();
      const existingReaction = existingReactions.find(
        (r: CometChat.ReactionCount) => r.getReaction() === emoji
      );
      const isRemoving = existingReaction?.getReactedByMe() === true;

      try {
        let updatedMessage: CometChat.BaseMessage;
        if (isRemoving) {
          updatedMessage = await CometChat.removeReaction(messageId, emoji);
        } else {
          updatedMessage = await CometChat.addReaction(messageId, emoji);
        }

        // Only extract the reactions from the SDK response — the reducer will
        // apply them to the existing message in state, preserving all other
        // fields (quotedMessage, metadata, etc.).
        dispatch({
          type: 'REACTION_UPDATE',
          messageId,
          reactions: updatedMessage.getReactions(),
        });
      } catch (error) {
        onError?.(error as CometChat.CometChatException);
      }
    },
    [onError, refs.stateRef, dispatch]
  );

  return {
    deleteMessage,
    markMessageAsUnread,
    reactToMessage,
  };
}
