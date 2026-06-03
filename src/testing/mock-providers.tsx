/**
 * Mock providers for testing components.
 *
 * Usage:
 *   import { MockCometChatProvider } from '../testing/mock-providers';
 *   render(
 *     <MockCometChatProvider>
 *       <ComponentUnderTest />
 *     </MockCometChatProvider>
 *   );
 */
import React, { createContext, type ReactNode } from 'react';
import { CometChatPluginRegistryContext } from '../context/PluginRegistryContext';
import { CometChatPluginRegistry } from '../plugins/CometChatPluginRegistry';
import { defaultPlugins } from '../plugins/core';
import { CometChatThemeContext } from '../context/ThemeContext';
import type { CometChatTheme } from '../context/ThemeContext.types';
import { CometChatEventsContext } from '../context/CometChatEventsContext';
import type { CometChatEventsContextValue } from '../context/CometChatEvents.types';
import type { CometChatEvent, CometChatSDKEvent } from '../context/CometChatEvents.types';
import { LocaleContext } from '../context/locale/LocaleContext';
import type { TranslationContextValue } from '../resources/CometChatLocalize/localize.types';
import enUs from '../resources/CometChatLocalize/resources/en-us/translation.json';

/* ── GlobalConfigContext (stub) ──────────────────────────────────────── */

export interface GlobalConfig {
  hideReceipts?: boolean;
  hideUserStatus?: boolean;
  hideGroupType?: boolean;
  disableSoundForMessages?: boolean;
  disableSoundForCalls?: boolean;
}

const defaultGlobalConfig: GlobalConfig = {};

export const GlobalConfigContext = createContext<GlobalConfig>(defaultGlobalConfig);

/* ── Default instances for tests ─────────────────────────────────────── */

const defaultPluginRegistry = new CometChatPluginRegistry(defaultPlugins);

const defaultEventsContext: CometChatEventsContextValue = {
  subscribe: () => () => {
    /* noop */
  },
  publish: () => {
    /* noop */
  },
};

/** Default locale context that resolves en-us translations (like production). */
const defaultLocaleContext: TranslationContextValue = {
  getLocalizedString: (key: string) => (enUs as Record<string, string>)[key] ?? key,
  tDateTimeParser: input => (input ? new Date(input) : new Date()),
  language: 'en-us',
  dateLocaleLanguage: 'en-us',
};

/* ── Mock Events Context helper ──────────────────────────────────────── */

/**
 * Helper for tests that need to simulate SDK events.
 *
 * Usage:
 *   const bridge = createMockSDKBridge();
 *   render(<MockCometChatProvider eventsContext={bridge.value}>...</MockCometChatProvider>);
 *   act(() => { bridge.emit({ type: 'message/text-received', message: mockMsg }); });
 */
export function createMockSDKBridge() {
  const handlers = new Set<(event: CometChatEvent) => void>();
  return {
    value: {
      subscribe: (handler: (event: CometChatEvent) => void) => {
        handlers.add(handler);
        return () => {
          handlers.delete(handler);
          return;
        };
      },
      publish: () => {
        /* noop in tests */
      },
    } satisfies CometChatEventsContextValue,
    emit: (event: CometChatSDKEvent) => {
      handlers.forEach(h => {
        h(event);
      });
    },
  };
}

/* ── MockCometChatProvider ───────────────────────────────────────────── */

interface MockCometChatProviderProps {
  children: ReactNode;
  globalConfig?: GlobalConfig;
  pluginRegistry?: CometChatPluginRegistry;
  theme?: CometChatTheme;
  eventsContext?: CometChatEventsContextValue;
  locale?: TranslationContextValue;
  /** @deprecated Use eventsContext instead */
  sdkBridge?: CometChatEventsContextValue;
}

export function MockCometChatProvider({
  children,
  globalConfig,
  pluginRegistry,
  theme,
  eventsContext,
  locale,
  sdkBridge, // eslint-disable-line @typescript-eslint/no-deprecated
}: MockCometChatProviderProps) {
  const mergedConfig: GlobalConfig = { ...defaultGlobalConfig, ...globalConfig };
  const registry = pluginRegistry ?? defaultPluginRegistry;
  const themeValue = {
    theme: theme ?? ('light' as CometChatTheme),

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setTheme: (_theme: CometChatTheme) => {
      /* noop */
    },
  };
  const events = eventsContext ?? sdkBridge ?? defaultEventsContext;
  const localeValue = locale ?? defaultLocaleContext;

  return (
    <CometChatPluginRegistryContext.Provider value={registry}>
      <CometChatThemeContext.Provider value={themeValue}>
        <GlobalConfigContext.Provider value={mergedConfig}>
          <LocaleContext.Provider value={localeValue}>
            <CometChatEventsContext.Provider value={events}>
              {children}
            </CometChatEventsContext.Provider>
          </LocaleContext.Provider>
        </GlobalConfigContext.Provider>
      </CometChatThemeContext.Provider>
    </CometChatPluginRegistryContext.Provider>
  );
}
