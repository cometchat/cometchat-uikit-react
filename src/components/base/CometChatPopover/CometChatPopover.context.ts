import { createContext, useContext } from 'react';
import type { CometChatPopoverContextValue } from './CometChatPopover.types';

export const CometChatPopoverContext = createContext<CometChatPopoverContextValue | null>(null);

export function useCometChatPopoverContext(): CometChatPopoverContextValue {
  const ctx = useContext(CometChatPopoverContext);
  if (!ctx) {
    throw new Error('useCometChatPopoverContext must be used within <CometChatPopover.Root>');
  }
  return ctx;
}
