/**
 * Types for the CometChatProvider — SDK initialization and login lifecycle.
 */
import type { ReactNode } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatMessagePlugin } from '../plugins/plugin.types';
import type { CometChatTheme } from './ThemeContext.types';
import type { CometChatGlobalConfig } from './GlobalConfigContext';
import type { UIKitSettings } from '../CometChatUIKit/UIKitSettings';

/** SDK initialization lifecycle state. */
export type CometChatInitState = 'idle' | 'initializing' | 'initialized' | 'error';

/** Login lifecycle state. */
export type CometChatLoginState = 'idle' | 'logging-in' | 'logged-in' | 'error';

/** Props for the root CometChatProvider. */
export interface CometChatProviderProps {
  /**
   * Pre-built UIKitSettings object for full control.
   * When provided, appId/region/callingEnabled/plugins props are ignored
   * (they're read from the settings object instead).
   * Build using UIKitSettingsBuilder.
   */
  settings?: UIKitSettings;

  /** CometChat App ID. Required if `settings` is not provided. */
  appId?: string;
  /** CometChat region (e.g., 'us', 'eu', 'in'). Required if `settings` is not provided. */
  region?: string;

  /**
   * Authentication token for login. One of authToken or uid+authKey must be provided.
   * Preferred for production — generated server-side.
   */
  authToken?: string;
  /**
   * User UID for login. Used with authKey for development/testing.
   * Do NOT use authKey in production — use authToken instead.
   */
  uid?: string;
  /**
   * Auth key for development login. Used with uid.
   * Do NOT use in production.
   */
  authKey?: string;
  /** Enable the Calling SDK integration. Default: false. */
  callingEnabled?: boolean;
  /** Additional plugins beyond the default set. */
  plugins?: CometChatMessagePlugin[];
  /** Global config overrides (hideReceipts, hideUserStatus, etc.). */
  config?: CometChatGlobalConfig;
  /** Theme: 'light' or 'dark'. Default: 'light'. */
  theme?: CometChatTheme;
  /** Locale override (e.g., 'en', 'fr', 'de'). Default: browser language. */
  locale?: string;
  /** Error callback for init/login failures. */
  onError?: (error: Error) => void;
  /** Called when login succeeds. */
  onLoginSuccess?: (user: CometChat.User) => void;
  children: ReactNode;
}
