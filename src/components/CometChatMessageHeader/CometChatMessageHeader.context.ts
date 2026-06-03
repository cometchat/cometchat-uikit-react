import { createContext, useContext } from 'react';
import type { CometChatMessageHeaderContextValue } from './CometChatMessageHeader.types';

export const CometChatMessageHeaderContext =
  createContext<CometChatMessageHeaderContextValue | null>(null);

CometChatMessageHeaderContext.displayName = 'CometChatMessageHeaderContext';

/**
 * Hook to access the CometChatMessageHeader context.
 * Must be used within a CometChatMessageHeader.Root.
 *
 * @throws Error if used outside of CometChatMessageHeader.Root
 */
export function useCometChatMessageHeaderContext(): CometChatMessageHeaderContextValue {
  const ctx = useContext(CometChatMessageHeaderContext);
  if (!ctx) {
    throw new Error(
      'useCometChatMessageHeaderContext: must be used within a CometChatMessageHeader.Root'
    );
  }
  return ctx;
}
