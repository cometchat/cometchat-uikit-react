import { createContext, useContext } from 'react';
import type { CometChatSearchContextValue } from './CometChatSearch.types';

export const CometChatSearchContext = createContext<CometChatSearchContextValue | null>(null);
CometChatSearchContext.displayName = 'CometChatSearchContext';

/**
 * Hook to access the CometChatSearch context.
 * Must be used within a CometChatSearch.Root component.
 */
export function useCometChatSearchContext(): CometChatSearchContextValue {
  const ctx = useContext(CometChatSearchContext);
  if (!ctx) {
    throw new Error(
      'useCometChatSearchContext must be used within a <CometChatSearch.Root> component.'
    );
  }
  return ctx;
}
