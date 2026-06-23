import { createContext, useContext } from 'react';
import type { CometChatNotificationFeedContextValue } from './CometChatNotificationFeed.types';

const CometChatNotificationFeedContext =
  createContext<CometChatNotificationFeedContextValue | null>(null);

CometChatNotificationFeedContext.displayName = 'CometChatNotificationFeedContext';

export { CometChatNotificationFeedContext };

/**
 * Hook to access the CometChatNotificationFeed context.
 * Must be used within a CometChatNotificationFeed.Root component.
 * @throws Error if used outside of CometChatNotificationFeed.Root.
 */
export function useCometChatNotificationFeedContext(): CometChatNotificationFeedContextValue {
  const ctx = useContext(CometChatNotificationFeedContext);
  if (!ctx) {
    throw new Error(
      'useCometChatNotificationFeedContext must be used within a <CometChatNotificationFeed.Root> component.'
    );
  }
  return ctx;
}
