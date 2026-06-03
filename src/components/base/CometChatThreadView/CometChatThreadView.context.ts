import { createContext, useContext } from 'react';
import type { CometChatThreadViewContextValue } from './CometChatThreadView.types';

export const CometChatThreadViewContext = createContext<CometChatThreadViewContextValue | null>(
  null
);

export function useCometChatThreadViewContext(): CometChatThreadViewContextValue {
  const ctx = useContext(CometChatThreadViewContext);
  if (!ctx) {
    throw new Error('useCometChatThreadViewContext must be used within <CometChatThreadView.Root>');
  }
  return ctx;
}
