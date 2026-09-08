import { createContext, useContext } from 'react';
import type { CometChatPinnedMessagesContextValue } from './CometChatPinnedMessages.types';

const CometChatPinnedMessagesContext = createContext<CometChatPinnedMessagesContextValue | null>(
  null
);

CometChatPinnedMessagesContext.displayName = 'CometChatPinnedMessagesContext';

export { CometChatPinnedMessagesContext };

/**
 * Access the CometChatPinnedMessages context.
 * Must be used within a <CometChatPinnedMessages.Root> component.
 * @throws Error if used outside of CometChatPinnedMessages.Root.
 */
export function useCometChatPinnedMessagesContext(): CometChatPinnedMessagesContextValue {
  const ctx = useContext(CometChatPinnedMessagesContext);
  if (!ctx) {
    throw new Error(
      'useCometChatPinnedMessagesContext must be used within a <CometChatPinnedMessages.Root> component.'
    );
  }
  return ctx;
}
