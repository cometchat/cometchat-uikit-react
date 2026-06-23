/**
 * CometChatProvider — the root provider for the CometChat UIKit.
 *
 * Wraps children with the necessary context providers for the UIKit to function.
 * SDK initialization and login must be handled by the consumer before mounting
 * this provider (via CometChatUIKit.init() / CometChatUIKit.login()).
 *
 * Provider composition (inside → outside):
 *   CometChatProvider
 *     └─ PluginRegistryContext     — plugin registry (built from plugins prop + defaults)
 *        └─ GlobalConfigProvider   — hideReceipts, hideUserStatus, etc.
 *           └─ ThemeProvider        — data-theme attribute + CSS variables
 *              └─ LocaleProvider   — localization
 *                 └─ CometChatEventsProvider — SDK listeners + UI events
 *                    └─ {children}
 *
 * Usage:
 * ```tsx
 * await CometChatUIKit.init(settings);
 * await CometChatUIKit.login(uid);
 *
 * <CometChatProvider plugins={[CometChatAIPlugin]}>
 *   <ChatUI />
 * </CometChatProvider>
 * ```
 */
'use client';

import React, { useMemo } from 'react';
import type { CometChatProviderProps } from './ChatState.types';
import { CometChatPluginRegistryContext } from './PluginRegistryContext';
import { GlobalConfigProvider } from './GlobalConfigContext';
import { CometChatThemeProvider } from './ThemeProvider';
import { LocaleProvider } from './locale/LocaleProvider';
import { CometChatEventsProvider } from './CometChatEventsProvider';
import { CometChatPluginRegistry } from '../plugins/CometChatPluginRegistry';
import { defaultPlugins } from '../plugins/core';
import { CometChatUIKit } from '../CometChatUIKit/CometChatUIKit';

export const CometChatProvider: React.FC<CometChatProviderProps> = ({
  plugins,
  removePlugins,
  config = {},
  theme = 'light',
  locale = 'en-us',
  children,
}) => {
  const pluginRegistry = useMemo(() => {
    const allPlugins = plugins ? [...plugins, ...defaultPlugins] : defaultPlugins;
    const filtered = removePlugins?.length
      ? allPlugins.filter(
          p =>
            !removePlugins.some(
              r => p.messageTypes.includes(r.text) && p.messageCategories.includes(r.category)
            )
        )
      : allPlugins;
    return new CometChatPluginRegistry(filtered);
  }, [plugins, removePlugins]);

  const isInitialized = CometChatUIKit.isInitialized();

  return (
    <CometChatPluginRegistryContext.Provider value={pluginRegistry}>
      <GlobalConfigProvider config={config}>
        <CometChatThemeProvider theme={theme}>
          <LocaleProvider locale={locale}>
            {isInitialized ? (
              <CometChatEventsProvider>{children}</CometChatEventsProvider>
            ) : (
              children
            )}
          </LocaleProvider>
        </CometChatThemeProvider>
      </GlobalConfigProvider>
    </CometChatPluginRegistryContext.Provider>
  );
};

CometChatProvider.displayName = 'CometChatProvider';
