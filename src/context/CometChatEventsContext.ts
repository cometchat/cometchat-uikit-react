import { createContext, useContext } from 'react';
import type { CometChatEventsContextValue, CometChatUIEvent } from './CometChatEvents.types';

const defaultValue: CometChatEventsContextValue = {
  subscribe: () => () => {
    /* noop */
  },
  publish: () => {
    /* noop */
  },
};

export const CometChatEventsContext = createContext<CometChatEventsContextValue>(defaultValue);

CometChatEventsContext.displayName = 'CometChatEventsContext';

/**
 * Internal: read the events context.
 * Prefer useCometChatEvents() / usePublishEvent() in components.
 */
export function useCometChatEventsContext(): CometChatEventsContextValue {
  return useContext(CometChatEventsContext);
}

/**
 * Hook to get the publish function for emitting UI events.
 * Used by components that perform local actions (composer, message list, etc.)
 *
 * Usage:
 * ```typescript
 * const publish = usePublishEvent();
 * publish({ type: 'ui:message/sent', message: msg, status: 'success' });
 * ```
 */
export function usePublishEvent(): (event: CometChatUIEvent) => void {
  const { publish } = useContext(CometChatEventsContext);
  return publish;
}
