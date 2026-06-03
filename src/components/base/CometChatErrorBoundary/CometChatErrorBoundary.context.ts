import { createContext, useContext } from 'react';
import type { CometChatErrorBoundaryContextValue } from './CometChatErrorBoundary.types';

export const CometChatErrorBoundaryContext =
  createContext<CometChatErrorBoundaryContextValue | null>(null);

export function useCometChatErrorBoundaryContext(): CometChatErrorBoundaryContextValue {
  const ctx = useContext(CometChatErrorBoundaryContext);
  if (!ctx) {
    throw new Error(
      'useCometChatErrorBoundaryContext must be used within <CometChatErrorBoundary.Root>'
    );
  }
  return ctx;
}
