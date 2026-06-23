/**
 * Types for the CometChatProvider — context composition for the UIKit.
 */
import type { ReactNode } from 'react';
import type { CometChatTheme } from './ThemeContext.types';
import type { CometChatGlobalConfig } from './GlobalConfigContext';
import type { CometChatMessagePlugin } from '../plugins/plugin.types';

/** SDK initialization lifecycle state. */
export type CometChatInitState = 'idle' | 'initializing' | 'initialized' | 'error';

/** Login lifecycle state. */
export type CometChatLoginState = 'idle' | 'logging-in' | 'logged-in' | 'error';

/** Props for the root CometChatProvider. */
export interface CometChatProviderProps {
  /** Additional plugins beyond the default set. Merged with defaultPlugins internally. */
  plugins?: CometChatMessagePlugin[];
  /**
   * Plugins to exclude — including defaults. Each entry is matched against every
   * plugin's `messageTypes`/`messageCategories`: a plugin is removed when its
   * `messageTypes` includes `text` AND its `messageCategories` includes `category`.
   *
   * ```tsx
   * <CometChatProvider removePlugins={[{ text: 'extension_poll', category: 'custom' }]}>
   * ```
   */
  removePlugins?: { text: string; category: string }[];
  /** Global config overrides (hideReceipts, hideUserStatus, etc.). */
  config?: CometChatGlobalConfig;
  /** Theme: 'light' or 'dark'. Default: 'light'. */
  theme?: CometChatTheme;
  /** Locale override (e.g., 'en', 'fr', 'de'). Default: browser language. */
  locale?: string;
  children: ReactNode;
}
