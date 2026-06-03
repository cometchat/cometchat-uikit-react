import { createContext, useContext } from 'react';
import type { CometChatConfirmDialogContextValue } from './CometChatConfirmDialog.types';

export const CometChatConfirmDialogContext =
  createContext<CometChatConfirmDialogContextValue | null>(null);

export function useCometChatConfirmDialogContext(): CometChatConfirmDialogContextValue {
  const ctx = useContext(CometChatConfirmDialogContext);
  if (!ctx) {
    throw new Error(
      'useCometChatConfirmDialogContext must be used within <CometChatConfirmDialog.Root>'
    );
  }
  return ctx;
}
