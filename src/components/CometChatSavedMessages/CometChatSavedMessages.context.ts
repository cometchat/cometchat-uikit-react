import { createContext, useContext } from 'react';
import type { CometChatSavedMessagesContextValue } from './CometChatSavedMessages.types';

const CometChatSavedMessagesContext = createContext<CometChatSavedMessagesContextValue | null>(
  null
);

CometChatSavedMessagesContext.displayName = 'CometChatSavedMessagesContext';

export { CometChatSavedMessagesContext };

/**
 * Access the CometChatSavedMessages context.
 * Must be used within a <CometChatSavedMessages.Root> component.
 * @throws Error if used outside of CometChatSavedMessages.Root.
 */
export function useCometChatSavedMessagesContext(): CometChatSavedMessagesContextValue {
  const ctx = useContext(CometChatSavedMessagesContext);
  if (!ctx) {
    throw new Error(
      'useCometChatSavedMessagesContext must be used within a <CometChatSavedMessages.Root> component.'
    );
  }
  return ctx;
}
