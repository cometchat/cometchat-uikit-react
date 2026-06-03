import { createContext, useContext } from 'react';
import type { CometChatFlagMessageDialogContextValue } from './CometChatFlagMessageDialog.types';

export const CometChatFlagMessageDialogContext =
  createContext<CometChatFlagMessageDialogContextValue | null>(null);

export function useCometChatFlagMessageDialogContext(): CometChatFlagMessageDialogContextValue {
  const ctx = useContext(CometChatFlagMessageDialogContext);
  if (!ctx) {
    throw new Error(
      'useCometChatFlagMessageDialogContext must be used within <CometChatFlagMessageDialog.Root>'
    );
  }
  return ctx;
}
