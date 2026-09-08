import { useCallback, useEffect, useRef, useState } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { useCometChatEventsContext } from '../context/CometChatEventsContext';
import { usePublishEvent } from './usePublishEvent';
import { useLocale } from './useLocale';
import {
  getSubscriptionTargetId,
  readThreadSubscribed,
  writeThreadSubscribed,
  toggleThreadSubscription,
  toThreadId,
} from '../utils/CometChatThreadSubscription';

/**
 * Reactive subscription state for one thread — read only.
 *
 * Seeds from the message's own flag (`isThreadSubscribed()`), then follows the
 * event bus: the optimistic `ui:thread/subscription-changed` published by
 * whichever surface acted (a manual toggle, or a Case 3/4 auto-subscribe mirror).
 * Anything that renders subscription state must read it through this, or it
 * renders once and then goes stale.
 *
 * Pass the thread's **parent message**, or `null` where the feature does not
 * apply (a 1:1 chat, a non-group bubble). With `null` the hook holds `false` and
 * attaches **no** bus subscriber, so rendering N such bubbles costs nothing.
 *
 * Re-seeds when handed a different message object: a re-fetch produces a new
 * object carrying the server's flag, which overrides any local mirror
 * ("fetched wins"). Our own bus write-backs mutate the same object in place, so
 * they never retrigger the re-seed and clobber the value just set.
 *
 * @param parentMessage - The thread's parent message, or `null` to disable.
 */
export function useThreadSubscriptionState(
  parentMessage: CometChat.BaseMessage | null | undefined
): boolean {
  // The bus matches ids with `===`; a reply resolves to its parent id.
  const threadId = parentMessage ? getSubscriptionTargetId(parentMessage) : 0;
  const { subscribe } = useCometChatEventsContext();

  const [isSubscribed, setIsSubscribed] = useState<boolean>(() =>
    readThreadSubscribed(parentMessage)
  );

  // Re-seed on a new message object (a re-fetch) or a different thread.
  useEffect(() => {
    setIsSubscribed(readThreadSubscribed(parentMessage));
  }, [parentMessage, threadId]);

  useEffect(() => {
    if (!threadId) return undefined;

    return subscribe(event => {
      if (
        event.type === 'ui:thread/subscription-changed' &&
        toThreadId(event.parentMessageId) === threadId
      ) {
        setIsSubscribed(event.subscribed);
        // Keep the held copy coherent for direct reads and remounts.
        writeThreadSubscribed(parentMessage, event.subscribed);
      }
    });
  }, [subscribe, threadId, parentMessage]);

  return isSubscribed;
}

/** Value returned by {@link useThreadSubscription}. */
export interface UseThreadSubscriptionResult {
  /** Whether the logged-in user follows this thread. */
  isSubscribed: boolean;
  /** Follow if unfollowed, unfollow if followed. Debounced and guarded. */
  toggle: () => void;
  /** Outcome message to surface, or `''`. Set on both success and failure. */
  toastText: string;
  /** Which toast style the current message wants. */
  toastVariant: 'default' | 'error';
  /** Dismiss the outcome message. */
  clearToast: () => void;
}

/**
 * Reactive subscription state plus the follow/unfollow action.
 *
 * Where only the state is needed, use {@link useThreadSubscriptionState} — it
 * skips the toggle machinery.
 *
 * @param parentMessage - The thread's parent message, or `null` to disable.
 * @param onChange - Called when the state changes, but not for the initial read.
 */
export function useThreadSubscription(
  parentMessage: CometChat.BaseMessage | null | undefined,
  onChange?: (subscribed: boolean) => void
): UseThreadSubscriptionResult {
  const publish = usePublishEvent();
  const { getLocalizedString } = useLocale();

  const isSubscribed = useThreadSubscriptionState(parentMessage);
  const [toast, setToast] = useState<{ text: string; variant: 'default' | 'error' }>({
    text: '',
    variant: 'default',
  });

  // Report changes, never the first read — a mount is not a state change.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });
  const lastReported = useRef<boolean | null>(null);
  useEffect(() => {
    if (lastReported.current !== null && lastReported.current !== isSubscribed) {
      onChangeRef.current?.(isSubscribed);
    }
    lastReported.current = isSubscribed;
  }, [isSubscribed]);

  const toggle = useCallback(() => {
    const parentMessageId = parentMessage ? getSubscriptionTargetId(parentMessage) : 0;
    void toggleThreadSubscription({
      parentMessageId,
      subscribe: !isSubscribed,
      publish,
      showToast: (text, variant) => {
        setToast({ text, variant: variant ?? 'default' });
      },
      getLocalizedString,
    });
  }, [parentMessage, isSubscribed, publish, getLocalizedString]);

  const clearToast = useCallback(() => {
    setToast({ text: '', variant: 'default' });
  }, []);

  return { isSubscribed, toggle, toastText: toast.text, toastVariant: toast.variant, clearToast };
}
