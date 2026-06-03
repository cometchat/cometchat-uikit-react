import { createContext, useContext } from 'react';
import type { CometChatDateContextValue } from './CometChatDate.types';

export const CometChatDateContext = createContext<CometChatDateContextValue | null>(null);

export function useCometChatDateContext(): CometChatDateContextValue {
  const ctx = useContext(CometChatDateContext);
  if (!ctx) {
    throw new Error('useCometChatDateContext must be used within <CometChatDate.Root>');
  }
  return ctx;
}
