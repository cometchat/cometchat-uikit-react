import { createContext, useContext } from 'react';
import type { CometChatButtonContextValue } from './CometChatButton.types';

export const CometChatButtonContext = createContext<CometChatButtonContextValue | null>(null);

export function useCometChatButtonContext(): CometChatButtonContextValue {
  const ctx = useContext(CometChatButtonContext);
  if (!ctx) {
    throw new Error('useCometChatButtonContext must be used within <CometChatButton.Root>');
  }
  return ctx;
}
