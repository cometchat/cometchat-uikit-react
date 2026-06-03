import { createContext, useContext } from 'react';
import type { CometChatChangeScopeContextValue } from './CometChatChangeScope.types';

export const CometChatChangeScopeContext = createContext<CometChatChangeScopeContextValue | null>(
  null
);

export function useCometChatChangeScopeContext(): CometChatChangeScopeContextValue {
  const ctx = useContext(CometChatChangeScopeContext);
  if (!ctx) {
    throw new Error(
      'useCometChatChangeScopeContext must be used within <CometChatChangeScope.Root>'
    );
  }
  return ctx;
}
