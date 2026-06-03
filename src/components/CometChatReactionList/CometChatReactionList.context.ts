import { createContext, useContext } from 'react';
import type { CometChatReactionListContextValue } from './CometChatReactionList.types';

export const CometChatReactionListContext = createContext<CometChatReactionListContextValue | null>(
  null
);

/**
 * Hook to access the CometChatReactionList context.
 * Must be used within a CometChatReactionList.Root.
 */
export function useCometChatReactionListContext(): CometChatReactionListContextValue {
  const ctx = useContext(CometChatReactionListContext);
  if (!ctx) {
    throw new Error(
      'useCometChatReactionListContext must be used within <CometChatReactionList.Root>'
    );
  }
  return ctx;
}
