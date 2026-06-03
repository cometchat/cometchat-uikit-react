import { createContext, useContext } from 'react';
import type { CometChatConversationSummaryContextValue } from './CometChatConversationSummary.types';

export const CometChatConversationSummaryContext =
  createContext<CometChatConversationSummaryContextValue | null>(null);

export function useCometChatConversationSummaryContext(): CometChatConversationSummaryContextValue {
  const ctx = useContext(CometChatConversationSummaryContext);
  if (!ctx) {
    throw new Error(
      'useCometChatConversationSummaryContext must be used within <CometChatConversationSummary.Root>'
    );
  }
  return ctx;
}
