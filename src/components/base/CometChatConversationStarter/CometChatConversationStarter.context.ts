import { createContext, useContext } from 'react';
import type { CometChatConversationStarterContextValue } from './CometChatConversationStarter.types';

export const CometChatConversationStarterContext =
  createContext<CometChatConversationStarterContextValue | null>(null);

export function useCometChatConversationStarterContext(): CometChatConversationStarterContextValue {
  const ctx = useContext(CometChatConversationStarterContext);
  if (!ctx) {
    throw new Error(
      'useCometChatConversationStarterContext must be used within <CometChatConversationStarter.Root>'
    );
  }
  return ctx;
}
