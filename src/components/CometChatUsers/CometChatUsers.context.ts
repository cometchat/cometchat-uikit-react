import { createContext, useContext } from 'react';
import type { CometChatUsersContextValue } from './CometChatUsers.types';

const CometChatUsersContext = createContext<CometChatUsersContextValue | null>(null);

CometChatUsersContext.displayName = 'CometChatUsersContext';

export { CometChatUsersContext };

/**
 * Hook to access the CometChatUsers context.
 * Must be used within a CometChatUsers.Root component.
 * @throws Error if used outside of CometChatUsers.Root.
 */
export function useCometChatUsersContext(): CometChatUsersContextValue {
  const ctx = useContext(CometChatUsersContext);
  if (!ctx) {
    throw new Error(
      'useCometChatUsersContext must be used within a <CometChatUsers.Root> component.'
    );
  }
  return ctx;
}
