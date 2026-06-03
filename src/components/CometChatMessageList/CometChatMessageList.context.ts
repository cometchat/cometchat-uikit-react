import { createContext, useContext } from 'react';
import type { CometChatUseMessageListReturn } from './CometChatMessageList.types';

const CometChatMessageListContext = createContext<CometChatUseMessageListReturn | null>(null);

CometChatMessageListContext.displayName = 'CometChatMessageListContext';

export const CometChatMessageListProvider = CometChatMessageListContext.Provider;

export function useCometChatMessageListContext(): CometChatUseMessageListReturn {
  const ctx = useContext(CometChatMessageListContext);
  if (!ctx) {
    throw new Error(
      'useCometChatMessageListContext must be used within a CometChatMessageList.Provider'
    );
  }
  return ctx;
}
