import { createContext, useContext } from 'react';
import type { CometChatAvatarContextValue } from './CometChatAvatar.types';

export const CometChatAvatarContext = createContext<CometChatAvatarContextValue | null>(null);

export function useCometChatAvatarContext(): CometChatAvatarContextValue {
  const ctx = useContext(CometChatAvatarContext);
  if (!ctx) {
    throw new Error('useCometChatAvatarContext must be used within <CometChatAvatar.Root>');
  }
  return ctx;
}
