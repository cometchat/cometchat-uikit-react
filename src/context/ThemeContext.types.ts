import type { ReactNode } from 'react';

/** Supported theme values. */
export type CometChatTheme = 'light' | 'dark';

/** Context value for theme. */
export interface CometChatThemeContextValue {
  /** Current theme. */
  theme: CometChatTheme;
  /** Toggle or set theme programmatically. */
  setTheme: (theme: CometChatTheme) => void;
}

/** Props for CometChatThemeProvider. */
export interface CometChatThemeProviderProps {
  /**
   * The active theme. Controls the `data-theme` attribute on the wrapper.
   * CSS custom properties in css-variables.css respond to this attribute.
   * Default: 'light'.
   */
  theme?: CometChatTheme;
  /** Children. */
  children: ReactNode;
}
