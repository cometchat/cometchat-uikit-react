import { createContext, useContext } from 'react';
import type { CometChatConversationsContextValue } from './CometChatConversations.types';

const CometChatConversationsContext = createContext<CometChatConversationsContextValue | null>(
  null
);

CometChatConversationsContext.displayName = 'CometChatConversationsContext';

export { CometChatConversationsContext };

/**
 * Hook to access the CometChatConversations context.
 * Must be used within a CometChatConversations.Root component.
 * @throws Error if used outside of CometChatConversations.Root.
 */
export function useCometChatConversationsContext(): CometChatConversationsContextValue {
  const ctx = useContext(CometChatConversationsContext);
  if (!ctx) {
    throw new Error(
      'useCometChatConversationsContext must be used within a <CometChatConversations.Root> component.'
    );
  }
  return ctx;
}

/**
 * Internal hook that returns the conversations context or null.
 * Used by CometChatConversationsItem to support rendering outside a provider
 * (e.g., in CometChatSearch results).
 */
export function useOptionalConversationsContext(): CometChatConversationsContextValue | null {
  return useContext(CometChatConversationsContext);
}
