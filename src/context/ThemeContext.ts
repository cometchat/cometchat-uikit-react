import { createContext, useContext } from 'react';
import type { CometChatThemeContextValue } from './ThemeContext.types';

const defaultValue: CometChatThemeContextValue = {
  theme: 'light',
  setTheme: () => {
    /* no-op outside provider */
  },
};

export const CometChatThemeContext = createContext<CometChatThemeContextValue>(defaultValue);

CometChatThemeContext.displayName = 'CometChatThemeContext';

/**
 * Read the current theme from context.
 *
 * Returns `'light'` with a no-op `setTheme` if no ThemeProvider is present (safe default).
 * Does not throw — unlike usePluginRegistry which requires a provider.
 */
export function useTheme(): CometChatThemeContextValue {
  return useContext(CometChatThemeContext);
}
