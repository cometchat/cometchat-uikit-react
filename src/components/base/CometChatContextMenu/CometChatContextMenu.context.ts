import { createContext, useContext } from 'react';
import type { CometChatContextMenuContextValue } from './CometChatContextMenu.types';

export const CometChatContextMenuContext = createContext<CometChatContextMenuContextValue | null>(
  null
);

export function useCometChatContextMenuContext(): CometChatContextMenuContextValue {
  const ctx = useContext(CometChatContextMenuContext);
  if (!ctx) {
    throw new Error(
      'useCometChatContextMenuContext must be used within <CometChatContextMenu.Root>'
    );
  }
  return ctx;
}
