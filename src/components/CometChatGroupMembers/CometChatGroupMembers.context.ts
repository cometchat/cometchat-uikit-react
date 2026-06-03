import { createContext, useContext } from 'react';
import type { CometChatGroupMembersContextValue } from './CometChatGroupMembers.types';

const CometChatGroupMembersContext = createContext<CometChatGroupMembersContextValue | null>(null);

CometChatGroupMembersContext.displayName = 'CometChatGroupMembersContext';

export { CometChatGroupMembersContext };

/**
 * Hook to access the CometChatGroupMembers context.
 * Must be used within a CometChatGroupMembers.Root component.
 * @throws Error if used outside of CometChatGroupMembers.Root.
 */
export function useCometChatGroupMembersContext(): CometChatGroupMembersContextValue {
  const ctx = useContext(CometChatGroupMembersContext);
  if (!ctx) {
    throw new Error(
      'useCometChatGroupMembersContext must be used within a <CometChatGroupMembers.Root> component.'
    );
  }
  return ctx;
}
