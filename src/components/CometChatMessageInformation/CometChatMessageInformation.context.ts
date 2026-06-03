import { createContext, useContext } from 'react';
import type { CometChatMessageInformationContextValue } from './CometChatMessageInformation.types';

export const CometChatMessageInformationContext =
  createContext<CometChatMessageInformationContextValue | null>(null);

/**
 * Hook to access the CometChatMessageInformation context.
 * Must be used within a CometChatMessageInformation.Root.
 */
export function useCometChatMessageInformationContext(): CometChatMessageInformationContextValue {
  const ctx = useContext(CometChatMessageInformationContext);
  if (!ctx) {
    throw new Error(
      'useCometChatMessageInformationContext must be used within <CometChatMessageInformation.Root>'
    );
  }
  return ctx;
}
