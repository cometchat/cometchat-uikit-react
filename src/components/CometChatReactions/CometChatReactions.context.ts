import { createContext, useContext } from 'react';
import type { CometChatReactionsContextValue } from './CometChatReactions.types';

export const CometChatReactionsContext = createContext<CometChatReactionsContextValue | null>(null);

/**
 * Hook to access the CometChatReactions context.
 * Must be used within a CometChatReactions.Root.
 */
export function useCometChatReactionsContext(): CometChatReactionsContextValue {
  const ctx = useContext(CometChatReactionsContext);
  if (!ctx) {
    throw new Error('useCometChatReactionsContext must be used within <CometChatReactions.Root>');
  }
  return ctx;
}
