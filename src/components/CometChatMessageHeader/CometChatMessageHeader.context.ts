import { createContext, useContext } from 'react';
import type {
  CometChatMessageHeaderContextValue,
  CometChatMessageHeaderConvenienceProps,
} from './CometChatMessageHeader.types';

export const CometChatMessageHeaderContext =
  createContext<CometChatMessageHeaderContextValue | null>(null);

CometChatMessageHeaderContext.displayName = 'CometChatMessageHeaderContext';

/**
 * Hook to access the CometChatMessageHeader context.
 * Must be used within a CometChatMessageHeader.Root.
 *
 * @throws Error if used outside of CometChatMessageHeader.Root
 */
export function useCometChatMessageHeaderContext(): CometChatMessageHeaderContextValue {
  const ctx = useContext(CometChatMessageHeaderContext);
  if (!ctx) {
    throw new Error(
      'useCometChatMessageHeaderContext: must be used within a CometChatMessageHeader.Root'
    );
  }
  return ctx;
}

/**
 * The flat API's view props, read by Root's default layout so they slot into that one layout (and
 * keep its click handling, call-button rules and menu) rather than a second copy of it. Internal.
 */
export const CometChatMessageHeaderViewsContext =
  createContext<CometChatMessageHeaderConvenienceProps>({});
