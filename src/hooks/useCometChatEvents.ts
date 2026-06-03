import { useEffect, useRef } from 'react';
import { useCometChatEventsContext } from '../context/CometChatEventsContext';
import type { CometChatEvent } from '../context/CometChatEvents.types';

/**
 * Subscribe to CometChat events (SDK + UI).
 *
 * The handler is called for every event (both SDK events from the network
 * and UI events from local component actions). Filter by `event.type`
 * inside the handler to react to specific events.
 *
 * The handler reference is kept stable via a ref — no need to memoize it.
 * The `deps` array controls when the subscription is refreshed (same
 * semantics as useEffect deps).
 *
 * Replaces the deprecated useSDKEvents() — same API, but receives both SDK and UI events.
 *
 * Usage:
 * ```typescript
 * useCometChatEvents((event) => {
 *   if (event.type === 'message/text-received') {
 *     // handle incoming text message from network
 *   }
 *   if (event.type === 'ui:message/sent' && event.status === 'success') {
 *     // handle message sent by local composer
 *   }
 * }, [conversationId]);
 * ```
 */
export function useCometChatEvents(
  handler: (event: CometChatEvent) => void,
  deps: React.DependencyList
): void {
  const { subscribe } = useCometChatEventsContext();
  const handlerRef = useRef(handler);

  // Keep handler ref current without re-subscribing
  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    const unsubscribe = subscribe(event => {
      handlerRef.current(event);
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps controlled by caller
  }, [subscribe, ...deps]);
}
