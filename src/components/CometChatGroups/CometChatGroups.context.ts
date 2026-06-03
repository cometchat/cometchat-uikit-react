import { createContext, useContext } from 'react';
import type { CometChatGroupsContextValue } from './CometChatGroups.types';

const CometChatGroupsContext = createContext<CometChatGroupsContextValue | null>(null);

CometChatGroupsContext.displayName = 'CometChatGroupsContext';

export { CometChatGroupsContext };

/**
 * Hook to access the CometChatGroups context.
 * Must be used within a CometChatGroups.Root component.
 * @throws Error if used outside of CometChatGroups.Root.
 */
export function useCometChatGroupsContext(): CometChatGroupsContextValue {
  const ctx = useContext(CometChatGroupsContext);
  if (!ctx) {
    throw new Error(
      'useCometChatGroupsContext must be used within a <CometChatGroups.Root> component.'
    );
  }
  return ctx;
}
