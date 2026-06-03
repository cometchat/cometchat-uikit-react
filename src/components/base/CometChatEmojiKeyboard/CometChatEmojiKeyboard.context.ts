import { createContext, useContext } from 'react';
import type { CometChatEmojiKeyboardContextValue } from './CometChatEmojiKeyboard.types';

export const CometChatEmojiKeyboardContext =
  createContext<CometChatEmojiKeyboardContextValue | null>(null);

export function useCometChatEmojiKeyboardContext(): CometChatEmojiKeyboardContextValue {
  const ctx = useContext(CometChatEmojiKeyboardContext);
  if (!ctx) {
    throw new Error(
      'useCometChatEmojiKeyboardContext must be used within <CometChatEmojiKeyboard.Root>'
    );
  }
  return ctx;
}
