import { useCallback, useEffect, useId, useReducer, useRef, useState } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { attachThreadHeaderMessageListener } from './CometChatThreadHeaderManager';
import { threadHeaderReducer, createInitialState } from './CometChatThreadHeader.reducer';
import { useCometChatEvents } from '../../hooks/useCometChatEvents';
import type { CometChatEvent } from '../../context/CometChatEvents.types';
import { CometChatMessageStatus } from '../../context/CometChatEvents.types';

export interface UseCometChatThreadHeaderOptions {
  /** The parent message of the thread. */
  parentMessage: CometChat.BaseMessage;
  /** Error callback for SDK errors. */
  onError?: ((error: CometChat.CometChatException) => void) | null;
  /** The logged-in user (needed for filtering own messages from SDK listener). */
  loggedInUser: CometChat.User | null;
  /** Called when the parent message is deleted (thread should close). */
  onParentDeleted?: (() => void) | undefined;
}

export interface UseCometChatThreadHeaderResult {
  /** Current reply count (updates in real-time). */
  replyCount: number;
  /** Sender name of the parent message. */
  senderName: string;
  /**
   * The current parent message (may be updated if edited in real-time).
   * Use this for rendering the parent bubble instead of the original prop.
   */
  currentParentMessage: CometChat.BaseMessage;
}

/**
 * Data hook for CometChatThreadHeader.
 *
 * Manages reply count state with real-time updates from:
 * 1. SDK message listener (messages from other users)
 * 2. SDK bridge events (messages sent by the current user)
 *
 * Uses processedMessageIds to prevent double-counting.
 */
export function useCometChatThreadHeader(
  options: UseCometChatThreadHeaderOptions
): UseCometChatThreadHeaderResult {
  const { parentMessage, onError, loggedInUser, onParentDeleted } = options;
  const instanceId = useId();

  const initialCount = parentMessage.getReplyCount() || 0;
  const [state, dispatch] = useReducer(threadHeaderReducer, initialCount, createInitialState);

  // Track the current parent message (updates on edit)
  const [currentParentMessage, setCurrentParentMessage] =
    useState<CometChat.BaseMessage>(parentMessage);

  // Track parentMessage ID for reset detection
  const prevParentIdRef = useRef<number>(parentMessage.getId());

  const onParentDeletedRef = useRef(onParentDeleted);
  onParentDeletedRef.current = onParentDeleted;

  // Reset state when parentMessage changes
  useEffect(() => {
    const currentId = parentMessage.getId();
    if (currentId !== prevParentIdRef.current) {
      prevParentIdRef.current = currentId;
      const newInitialCount = parentMessage.getReplyCount() || 0;
      dispatch({ type: 'RESET', initialCount: newInitialCount });
      setCurrentParentMessage(parentMessage);
    }
  }, [parentMessage]);

  // Attach SDK message listener for incoming replies from other users
  useEffect(() => {
    if (!loggedInUser) return;

    const listenerId = `CometChatThreadHeader_msg_${instanceId}`;
    const parentMessageId = parentMessage.getId();
    const loggedInUserId = loggedInUser.getUid();

    let cleanup: (() => void) | undefined;
    try {
      cleanup = attachThreadHeaderMessageListener(
        listenerId,
        parentMessageId,
        loggedInUserId,
        (message: CometChat.BaseMessage) => {
          const messageId = message.getId();
          if (messageId) {
            dispatch({ type: 'INCREMENT_REPLY_COUNT', messageId });
          }
        }
      );
    } catch (error) {
      onError?.(error as CometChat.CometChatException);
    }

    return () => {
      cleanup?.();
    };
  }, [parentMessage, loggedInUser, instanceId, onError]);

  const handleEvent = useCallback(
    (event: CometChatEvent) => {
      const sdkMessageEventTypes: CometChatEvent['type'][] = [
        'message/text-received',
        'message/media-received',
        'message/custom-received',
        'message/interactive-received',
      ];

      if (sdkMessageEventTypes.includes(event.type)) {
        const message = 'message' in event ? event.message : undefined;
        const parentId = message?.getParentMessageId();
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        const senderUid = message?.getSender()?.getUid();
        if (
          parentId === parentMessage.getId() &&
          loggedInUser &&
          senderUid === loggedInUser.getUid()
        ) {
          const messageId = message?.getId();
          if (messageId) {
            dispatch({ type: 'INCREMENT_REPLY_COUNT', messageId });
          }
        }
      }

      if (event.type === 'ui:message/sent' && event.status === CometChatMessageStatus.success) {
        const message = event.message;
        const parentId = message.getParentMessageId();
        if (parentId === parentMessage.getId()) {
          const messageId = message.getId();
          if (messageId) {
            dispatch({ type: 'INCREMENT_REPLY_COUNT', messageId });
          }
        }
      }

      if (event.type === 'ui:compose/edit' && event.status === CometChatMessageStatus.success) {
        const msg = event.message;
        if (msg.getId() === parentMessage.getId()) {
          setCurrentParentMessage(msg);
        }
      }
      if (event.type === 'message/edited') {
        const msg = event.message;
        if (msg.getId() === parentMessage.getId()) {
          setCurrentParentMessage(msg);
        }
      }

      if (event.type === 'ui:message/deleted') {
        const msg = event.message;
        if (msg.getId() === parentMessage.getId()) {
          onParentDeletedRef.current?.();
        }
      }
      if (event.type === 'message/deleted') {
        const msg = event.message;
        if (msg.getId() === parentMessage.getId()) {
          onParentDeletedRef.current?.();
        }
      }
    },
    [parentMessage, loggedInUser]
  );

  useCometChatEvents(handleEvent, [parentMessage.getId(), loggedInUser?.getUid()]);

  // Derive sender name from the current parent message
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const senderName = currentParentMessage.getSender()?.getName() ?? '';

  return {
    replyCount: state.replyCount,
    senderName,
    currentParentMessage,
  };
}
