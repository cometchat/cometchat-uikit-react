import { createContext, useContext } from 'react';
import type { CometChatFullScreenViewerContextValue } from './CometChatFullScreenViewer.types';

export const CometChatFullScreenViewerContext =
  createContext<CometChatFullScreenViewerContextValue | null>(null);

export function useCometChatFullScreenViewerContext(): CometChatFullScreenViewerContextValue {
  const ctx = useContext(CometChatFullScreenViewerContext);
  if (!ctx) {
    throw new Error(
      'useCometChatFullScreenViewerContext must be used within <CometChatFullScreenViewer.Root>'
    );
  }
  return ctx;
}
