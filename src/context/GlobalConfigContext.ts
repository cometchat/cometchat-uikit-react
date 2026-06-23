import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

/**
 * Cross-cutting display settings used by multiple components.
 *
 * Set once at the provider level, read by any component via `useGlobalConfig()`.
 * Individual component props override these values when explicitly set.
 */
export interface CometChatGlobalConfig {
  /** Hide read receipt indicators across all components. Default: false. */
  hideReceipts?: boolean;
  /** Hide user online/offline status across all components. Default: false. */
  hideUserStatus?: boolean;
  /** Disable sound for incoming/outgoing calls. Default: false. */
  disableSoundForCalls?: boolean;
  /** Custom sound URL for calls. */
  customSoundForCalls?: string;
  /** Disable sound for incoming messages across all components. Default: false. */
  disableSoundForMessages?: boolean;
  /** Custom sound URL for incoming messages. */
  customSoundForMessages?: string;
  /**
   * Custom call settings builder for ongoing call sessions.
   * Passed to OngoingCall component when a call is started.
   * If not set, the component creates default settings internally.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  callSettingsBuilder?: any;
}

const GlobalConfigContext = createContext<CometChatGlobalConfig>({});

export interface CometChatGlobalConfigProviderProps {
  config: CometChatGlobalConfig;
  children: ReactNode;
}

/**
 * Provider for global display configuration.
 *
 * ```tsx
 * <GlobalConfigProvider config={{ hideReceipts: true }}>
 *   {children}
 * </GlobalConfigProvider>
 * ```
 */
export const GlobalConfigProvider: React.FC<CometChatGlobalConfigProviderProps> = ({
  config,
  children,
}) => React.createElement(GlobalConfigContext.Provider, { value: config }, children);

GlobalConfigProvider.displayName = 'GlobalConfigProvider';

/**
 * Read global config. Returns empty object if no provider is present.
 * Components use: `const effectiveHideReceipts = props.hideReceipts ?? globalConfig.hideReceipts ?? false;`
 */
export function useGlobalConfig(): CometChatGlobalConfig {
  return useContext(GlobalConfigContext);
}
