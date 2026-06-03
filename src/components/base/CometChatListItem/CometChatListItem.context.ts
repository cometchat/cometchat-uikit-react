import { createContext, useContext } from 'react';
import type { CometChatListItemContextValue } from './CometChatListItem.types';

export const CometChatListItemContext = createContext<CometChatListItemContextValue | null>(null);

export function useCometChatListItemContext(): CometChatListItemContextValue {
  const ctx = useContext(CometChatListItemContext);
  if (!ctx) {
    throw new Error('useCometChatListItemContext must be used within <CometChatListItem.Root>');
  }
  return ctx;
}
