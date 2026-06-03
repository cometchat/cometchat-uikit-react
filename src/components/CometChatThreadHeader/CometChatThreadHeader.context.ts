import { createContext, useContext } from 'react';
import type { CometChatThreadHeaderContextValue } from './CometChatThreadHeader.types';

export const CometChatThreadHeaderContext = createContext<CometChatThreadHeaderContextValue | null>(
  null
);

CometChatThreadHeaderContext.displayName = 'CometChatThreadHeaderContext';

/**
 * Hook to access the CometChatThreadHeader context.
 * Must be used within a CometChatThreadHeader.Root.
 *
 * @throws Error if used outside of CometChatThreadHeader.Root
 */
export function useCometChatThreadHeaderContext(): CometChatThreadHeaderContextValue {
  const ctx = useContext(CometChatThreadHeaderContext);
  if (!ctx) {
    throw new Error(
      'useCometChatThreadHeaderContext: must be used within a CometChatThreadHeader.Root'
    );
  }
  return ctx;
}
