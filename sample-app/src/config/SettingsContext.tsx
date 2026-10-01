import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { defaultSettings, resolveSettings } from './defaultSettings';
import type { CometChatSettingsInterface, SettingsInput } from './settings.types';

/**
 * Builder settings for the running app.
 *
 * Defaults to every feature enabled, so an app with no `SettingsProvider` behaves exactly as
 * the plain sample app always has. The Chat Builder supplies a non-default value; nothing else
 * in the sample app needs to know it exists.
 */
const SettingsContext = createContext<CometChatSettingsInterface>(defaultSettings);

export interface SettingsProviderProps {
  /**
   * Partial settings, deep-merged over the defaults. Accepts the recursively-optional shape so
   * stored payloads missing newer keys still load.
   */
  settings?: SettingsInput | null;
  children: ReactNode;
}

/**
 * Supplies builder settings to the app.
 *
 * Only the Chat Builder and the exported/no-code apps render this. Omitting it is the
 * supported default.
 */
export const SettingsProvider = ({ settings, children }: SettingsProviderProps) => {
  const value = useMemo(() => resolveSettings(settings), [settings]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

/** Reads the resolved settings. Always returns a complete object. */
export const useSettings = (): CometChatSettingsInterface => useContext(SettingsContext);

export { SettingsContext };
