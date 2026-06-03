import { createContext, useContext } from 'react';
import type { CometChatSearchBarContextValue } from './CometChatSearchBar.types';

export const CometChatSearchBarContext = createContext<CometChatSearchBarContextValue | null>(null);

export function useCometChatSearchBarContext(): CometChatSearchBarContextValue {
  const ctx = useContext(CometChatSearchBarContext);
  if (!ctx) {
    throw new Error('useCometChatSearchBarContext must be used within <CometChatSearchBar.Root>');
  }
  return ctx;
}
