import { createContext, useContext } from 'react';
import type {
  CometChatMessageInformationContextValue,
  CometChatMessageInformationConvenienceProps,
} from './CometChatMessageInformation.types';

export const CometChatMessageInformationContext =
  createContext<CometChatMessageInformationContextValue | null>(null);

/**
 * Hook to access the CometChatMessageInformation context.
 * Must be used within a CometChatMessageInformation.Root.
 */
/**
 * The flat component's view props, read where the default layout places them. Internal: the
 * compound API places its own views.
 */
export const CometChatMessageInformationViewsContext =
  createContext<CometChatMessageInformationConvenienceProps>({});

export function useCometChatMessageInformationContext(): CometChatMessageInformationContextValue {
  const ctx = useContext(CometChatMessageInformationContext);
  if (!ctx) {
    throw new Error(
      'useCometChatMessageInformationContext must be used within <CometChatMessageInformation.Root>'
    );
  }
  return ctx;
}
