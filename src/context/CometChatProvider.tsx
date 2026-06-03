/**
 * CometChatProvider — the single root provider for the CometChat UIKit.
 *
 * Internally delegates to CometChatUIKit.init() and CometChatUIKit.login() so that
 * all static state (plugin registry, logged-in user, conversation settings, calling)
 * stays in sync between the declarative React layer and the imperative static API.
 *
 * Handles:
 * 1. SDK initialization via CometChatUIKit.init()
 * 2. User login via CometChatUIKit.login() / loginWithAuthToken()
 * 3. Plugin registry (from CometChatUIKit)
 * 4. Theme, locale, global config
 * 5. SDK + UI event bus (CometChatEventsProvider)
 *
 * Provider composition (inside → outside):
 *   CometChatProvider
 *     └─ PluginRegistryContext     — plugin registry from CometChatUIKit
 *        └─ GlobalConfigProvider   — hideReceipts, hideUserStatus, etc.
 *           └─ ThemeProvider        — data-theme attribute + CSS variables
 *              └─ LocaleProvider   — i18n
 *                 └─ CometChatEventsProvider — SDK listeners + UI events (only when logged in)
 *                    └─ {children}
 *
 * Usage (simple — individual props):
 * ```tsx
 * <CometChatProvider appId="APP_ID" region="us" authToken={token}>
 *   <ChatUI />
 * </CometChatProvider>
 * ```
 *
 * Usage (advanced — pre-built settings):
 * ```tsx
 * const settings = new UIKitSettingsBuilder()
 *   .setAppId('APP_ID')
 *   .setRegion('us')
 *   .setAuthKey('AUTH_KEY')
 *   .subscribePresenceForAllUsers()
 *   .setCallingEnabled(true)
 *   .build();
 *
 * <CometChatProvider settings={settings} uid="superhero1">
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
import { useCometChatInit } from '../hooks/useCometChatInit';
import { useCometChatLogin } from '../hooks/useCometChatLogin';
import { CometChatUIKit } from '../CometChatUIKit/CometChatUIKit';
import { UIKitSettingsBuilder } from '../CometChatUIKit/UIKitSettings';
import type { UIKitSettings } from '../CometChatUIKit/UIKitSettings';

export const CometChatProvider: React.FC<CometChatProviderProps> = ({
  settings: settingsProp,
  appId,
  region,
  authToken,
  uid,
  authKey,
  callingEnabled = false,
  plugins,
  config = {},
  theme = 'light',
  locale = 'en-us',
  onError,
  onLoginSuccess,
  children,
}) => {
  // --- Build UIKitSettings ---
  // If a pre-built settings object is provided, use it directly.
  // Otherwise, build one from individual props.
  const settings = useMemo((): UIKitSettings => {
    if (settingsProp) return settingsProp;

    if (!appId || !region) {
      throw new Error(
        'CometChatProvider: Either `settings` or both `appId` and `region` must be provided.'
      );
    }

    const builder = new UIKitSettingsBuilder()
      .setAppId(appId)
      .setRegion(region)
      .subscribePresenceForAllUsers()
      .setCallingEnabled(callingEnabled);

    if (authKey) {
      builder.setAuthKey(authKey);
    }

    if (plugins) {
      builder.setPlugins(plugins);
    }

    return builder.build();
  }, [settingsProp, appId, region, authKey, callingEnabled, plugins]);

  // --- Step 1: Initialize SDK via CometChatUIKit.init() ---
  const { initState } = useCometChatInit({
    settings,
    onError,
  });

  // --- Step 2: Login via CometChatUIKit.login() / loginWithAuthToken() ---
  const { loggedInUser } = useCometChatLogin({
    initState,
    authToken,
    uid,
    onError,
    onLoginSuccess,
  });

  // --- Step 3: Get plugin registry from CometChatUIKit (populated during init) ---
  const pluginRegistry = useMemo(() => {
    // After init, CometChatUIKit holds the registry. Use it directly so
    // both the static API and React context share the same instance.
    return CometChatUIKit.getPluginRegistry();
  }, [initState]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Compose providers ---
  return (
    <CometChatPluginRegistryContext.Provider value={pluginRegistry}>
      <GlobalConfigProvider config={config}>
        <CometChatThemeProvider theme={theme}>
          <LocaleProvider locale={locale}>
            {loggedInUser ? (
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
