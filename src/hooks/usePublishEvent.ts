import { usePublishEvent } from '../context/CometChatEventsContext';

/**
 * Re-export usePublishEvent from context for convenience.
 *
 * Returns a stable function that publishes UI events to all subscribers.
 * Used by components that perform local actions (composer, message list, etc.)
 *
 * Usage:
 * ```typescript
 * const publish = usePublishEvent();
 * // After sending a message:
 * publish({ type: 'ui:message/sent', message: confirmedMsg, status: 'success' });
 * ```
 */
export { usePublishEvent };
