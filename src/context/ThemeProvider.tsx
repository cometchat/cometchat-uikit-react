import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { CometChatTheme, CometChatThemeProviderProps } from './ThemeContext.types';
import { CometChatThemeContext } from './ThemeContext';

/**
 * CometChatThemeProvider — sets `data-theme` attribute and provides theme context.
 *
 * Supports both controlled (theme prop changes externally) and uncontrolled
 * (consumer calls setTheme) modes.
 *
 * The `data-theme` attribute drives CSS custom property values defined in
 * `css-variables.css` via `[data-theme="light"]` / `[data-theme="dark"]` selectors.
 *
 * No `prefers-color-scheme` auto-detection — that's a consumer concern.
 *
 * Usage:
 * ```tsx
 * <CometChatThemeProvider theme="dark">
 *   <App />
 * </CometChatThemeProvider>
 * ```
 */
export const CometChatThemeProvider: React.FC<CometChatThemeProviderProps> = ({
  theme: themeProp = 'light',
  children,
}) => {
  const [internalTheme, setInternalTheme] = useState<CometChatTheme>(themeProp);

  // Sync internal state when prop changes (controlled mode)
  useEffect(() => {
    setInternalTheme(themeProp);
  }, [themeProp]);

  const setTheme = useCallback((newTheme: CometChatTheme) => {
    setInternalTheme(newTheme);
  }, []);

  const contextValue = useMemo(
    () => ({ theme: internalTheme, setTheme }),
    [internalTheme, setTheme]
  );

  return (
    <CometChatThemeContext.Provider value={contextValue}>
      <div data-theme={internalTheme} className="cometchat">
        {children}
      </div>
    </CometChatThemeContext.Provider>
  );
};

CometChatThemeProvider.displayName = 'CometChatThemeProvider';
