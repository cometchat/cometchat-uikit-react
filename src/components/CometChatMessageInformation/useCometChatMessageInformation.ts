import { useCallback, useEffect, useId, useReducer, useRef } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  fetchReceipts,
  attachReceiptListener,
  attachConnectionListener,
} from './CometChatMessageInformationManager';
import { messageInformationReducer, initialState } from './CometChatMessageInformation.reducer';
import type {
  CometChatMessageInformationFetchState,
  CometChatUserReceiptInfo,
} from './CometChatMessageInformation.types';

export interface CometChatUseCometChatMessageInformationOptions {
  message: CometChat.BaseMessage;
  onError?: ((error: CometChat.CometChatException) => void) | null | undefined;
}

export interface CometChatUseCometChatMessageInformationReturn {
  fetchState: CometChatMessageInformationFetchState;
  userReceipts: CometChatUserReceiptInfo[];
  oneOnOneReadAt: number;
  oneOnOneDeliveredAt: number;
  error: string | null;
  isGroupMessage: boolean;
  retry: () => void;
}

/**
 * useCometChatMessageInformation — data hook for the CometChatMessageInformation component.
 *
 * Manages receipt fetching, real-time updates, and connection recovery.
 * For group messages: fetches receipts via SDK, combines per user, filters out logged-in user.
 * For 1-on-1 messages: reads timestamps directly from the message object.
 */
export function useCometChatMessageInformation(
  options: CometChatUseCometChatMessageInformationOptions
): CometChatUseCometChatMessageInformationReturn {
  const { message, onError } = options;
  const [state, dispatch] = useReducer(messageInformationReducer, initialState);
  const fetchIdRef = useRef<string>('');
  const loggedInUserRef = useRef<string>('');
  const instanceId = useId();

  const isGroupMessage = message.getReceiverType() === CometChat.RECEIVER_TYPE.GROUP;

  // --- Error handler ---
  const handleError = useCallback(
    (error: unknown) => {
      onError?.(error as CometChat.CometChatException);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      dispatch({ type: 'FETCH_ERROR', error: errorMessage });
    },
    [onError]
  );

  // --- Fetch receipts ---
  const doFetchReceipts = useCallback(async () => {
    const currentFetchId = `fetch_${String(Date.now())}`;
    fetchIdRef.current = currentFetchId;
    dispatch({ type: 'FETCH_START' });

    try {
      // Get logged-in user UID
      if (!loggedInUserRef.current) {
        const user = await CometChat.getLoggedinUser();
        if (user) {
          loggedInUserRef.current = user.getUid();
        }
      }

      if (isGroupMessage) {
        const receipts = await fetchReceipts(message.getId());

        // Guard against stale fetches
        if (fetchIdRef.current !== currentFetchId) return;

        if (receipts.length === 0) {
          dispatch({ type: 'FETCH_SUCCESS_GROUP', userReceipts: [] });
          return;
        }

        // Process and combine receipts per user
        const userReceiptMap = new Map<string, CometChatUserReceiptInfo>();

        for (const receipt of receipts) {
          const sender = receipt.getSender();
          if (sender.getUid() === loggedInUserRef.current) {
            continue;
          }

          const uid = sender.getUid();
          const readAt = receipt.getReadAt();
          const deliveredAt = receipt.getDeliveredAt();

          const existing = userReceiptMap.get(uid);
          if (existing) {
            if (readAt > existing.readAt) existing.readAt = readAt;
            if (deliveredAt > existing.deliveredAt) existing.deliveredAt = deliveredAt;
          } else {
            userReceiptMap.set(uid, { user: sender, readAt, deliveredAt });
          }
        }

        dispatch({
          type: 'FETCH_SUCCESS_GROUP',
          userReceipts: Array.from(userReceiptMap.values()),
        });
      } else {
        // 1-on-1: read timestamps from message object
        if (fetchIdRef.current !== currentFetchId) return;
        dispatch({
          type: 'FETCH_SUCCESS_ONE_ON_ONE',
          readAt: message.getReadAt(),
          deliveredAt: message.getDeliveredAt(),
        });
      }
    } catch (error) {
      if (fetchIdRef.current !== currentFetchId) return;
      handleError(error);
    }
  }, [message, isGroupMessage, handleError]);

  // --- Initialize: reset and fetch on message change ---
  useEffect(() => {
    dispatch({ type: 'RESET' });
    void doFetchReceipts();
  }, [doFetchReceipts]);

  // --- SDK receipt listeners for real-time updates ---
  useEffect(() => {
    const listenerId = `CometChatMessageInformation_receipt_${instanceId}`;
    let cleanup: (() => void) | undefined;
    try {
      cleanup = attachReceiptListener(listenerId, {
        onMessagesDelivered: (receipt: CometChat.MessageReceipt) => {
          const sender = receipt.getSender();
          if (isGroupMessage) {
            if (sender.getUid() !== loggedInUserRef.current) {
              dispatch({
                type: 'UPDATE_RECEIPT',
                uid: sender.getUid(),
                deliveredAt: receipt.getDeliveredAt(),
              });
            }
          } else {
            dispatch({
              type: 'UPDATE_ONE_ON_ONE_RECEIPT',
              deliveredAt: receipt.getDeliveredAt(),
            });
          }
        },
        onMessagesRead: (receipt: CometChat.MessageReceipt) => {
          const sender = receipt.getSender();
          if (isGroupMessage) {
            if (sender.getUid() !== loggedInUserRef.current) {
              dispatch({
                type: 'UPDATE_RECEIPT',
                uid: sender.getUid(),
                readAt: receipt.getReadAt(),
              });
            }
          } else {
            dispatch({
              type: 'UPDATE_ONE_ON_ONE_RECEIPT',
              readAt: receipt.getReadAt(),
            });
          }
        },
      });
    } catch {
      // SDK not initialized — skip listeners
    }
    return () => {
      cleanup?.();
    };
  }, [instanceId, isGroupMessage]);

  // --- Connection recovery ---
  useEffect(() => {
    const listenerId = `CometChatMessageInformation_conn_${instanceId}`;
    let cleanup: (() => void) | undefined;
    try {
      cleanup = attachConnectionListener(listenerId, () => {
        dispatch({ type: 'RESET' });
        void doFetchReceipts();
      });
    } catch {
      // SDK not initialized — skip listeners
    }
    return () => {
      cleanup?.();
    };
  }, [instanceId, doFetchReceipts]);

  // --- Retry ---
  const retry = useCallback(() => {
    dispatch({ type: 'RESET' });
    void doFetchReceipts();
  }, [doFetchReceipts]);

  return {
    ...state,
    isGroupMessage,
    retry,
  };
}
