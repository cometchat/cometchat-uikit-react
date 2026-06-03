import { createContext, useContext } from 'react';
import type { CometChatMessageComposerContextValue } from './CometChatMessageComposer.types';

export const CometChatMessageComposerContext =
  createContext<CometChatMessageComposerContextValue | null>(null);

/**
 * Hook to access the CometChatMessageComposer context.
 * Must be used within a CometChatMessageComposer.Root.
 */
export function useCometChatMessageComposerContext(): CometChatMessageComposerContextValue {
  const ctx = useContext(CometChatMessageComposerContext);
  if (!ctx) {
    throw new Error(
      'useCometChatMessageComposerContext must be used within <CometChatMessageComposer.Root>'
    );
  }
  return ctx;
}
