import { createContext, useContext } from 'react';
import type { CometChatMediaRecorderContextValue } from './CometChatMediaRecorder.types';

export const CometChatMediaRecorderContext =
  createContext<CometChatMediaRecorderContextValue | null>(null);

export function useCometChatMediaRecorderContext(): CometChatMediaRecorderContextValue {
  const ctx = useContext(CometChatMediaRecorderContext);
  if (!ctx) {
    throw new Error(
      'useCometChatMediaRecorderContext must be used within <CometChatMediaRecorder.Root>'
    );
  }
  return ctx;
}
