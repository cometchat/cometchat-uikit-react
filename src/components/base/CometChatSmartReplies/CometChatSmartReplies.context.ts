import { createContext, useContext } from 'react';
import type { CometChatSmartRepliesContextValue } from './CometChatSmartReplies.types';

export const CometChatSmartRepliesContext = createContext<CometChatSmartRepliesContextValue | null>(
  null
);

export function useCometChatSmartRepliesContext(): CometChatSmartRepliesContextValue {
  const ctx = useContext(CometChatSmartRepliesContext);
  if (!ctx) {
    throw new Error(
      'useCometChatSmartRepliesContext must be used within <CometChatSmartReplies.Root>'
    );
  }
  return ctx;
}
