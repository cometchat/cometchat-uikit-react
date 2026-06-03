import { createContext, useContext } from 'react';
import type { CometChatActionSheetContextValue } from './CometChatActionSheet.types';

export const CometChatActionSheetContext = createContext<CometChatActionSheetContextValue | null>(
  null
);

export function useCometChatActionSheetContext(): CometChatActionSheetContextValue {
  const ctx = useContext(CometChatActionSheetContext);
  if (!ctx) {
    throw new Error(
      'useCometChatActionSheetContext must be used within <CometChatActionSheet.Root>'
    );
  }
  return ctx;
}
