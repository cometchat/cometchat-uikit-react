/**
 * CometChat Localization types.
 */

import type { CometChatDateFormatConfig } from '../../components/base/CometChatDate/CometChatDate.types';

/** Translation function — takes a key, returns the translated string (or the key itself as fallback). */
export type TranslateFunction = (key: string) => string;

export type TranslationKey = string;

export type TDateTimeParserInput = string | number | Date;
export type TDateTimeParser = (input?: TDateTimeParserInput) => Date;

/** Callback invoked when a translation key is not found in the current or fallback language. */
export type MissingKeyHandler = (key: string) => string | undefined;

export type SupportedLanguage =
  | 'en-us'
  | 'en-gb'
  | 'de'
  | 'es'
  | 'fr'
  | 'hi'
  | 'hu'
  | 'it'
  | 'ja'
  | 'ko'
  | 'lt'
  | 'ms'
  | 'nl'
  | 'pt'
  | 'ru'
  | 'sv'
  | 'tr'
  | 'zh'
  | 'zh-tw';

/** Configuration object accepted by the `init()` method containing all initialization options. */
export interface LocalizationSettings {
  /** The language code to set as the active language. */
  language?: string;
  /** IANA timezone string for date formatting (e.g., "America/New_York"). */
  timezone?: string;
  /** Global date format configuration for CometChatDate components. */
  calendarObject?: CometChatDateFormatConfig;
  /** Map of language codes to key-value translation pairs. */
  translationsForLanguage?: Record<string, Record<string, string>>;
  /** Language code to use as fallback when a key is missing in the current language. Defaults to "en-us". */
  fallbackLanguage?: string;
  /** When true, browser language detection is disabled. */
  disableAutoDetection?: boolean;
  /** When true, date locale language is forced to "en-US" regardless of current language. */
  disableDateTimeLocalization?: boolean;
  /** Callback invoked when a translation key is not found. */
  missingKeyHandler?: MissingKeyHandler;
}

export interface TranslationContextValue {
  getLocalizedString: TranslateFunction;
  tDateTimeParser: TDateTimeParser;
  language: string;
  /** IANA timezone string from the CometChatLocalize instance, or undefined if not set. */
  timezone?: string | undefined;
  /** Global date format configuration from the CometChatLocalize instance, or undefined if not set. */
  calendarObject?: CometChatDateFormatConfig | undefined;
  /** The locale language used for date formatting. Returns "en-US" when disableDateTimeLocalization is true. */
  dateLocaleLanguage: string;
}

export interface CometChatLocaleProviderProps {
  locale?: string;
  i18nInstance?: CometChatI18nInstance;
  children: React.ReactNode;
}

export interface CometChatI18nInstance {
  init: (settings?: LocalizationSettings) => void;
  getTranslators: () => { t: TranslateFunction; tDateTimeParser: TDateTimeParser };
  setCurrentLanguage: (language: string) => void;
  getCurrentLanguage: () => string;
  addTranslation: (resources: Record<string, Record<string, string>>) => void;
  registerSetLanguageCallback: (callback: (t: TranslateFunction) => void) => void;
  currentLanguage: string;
  formatDate: (timestamp: number, calendarObject?: CometChatDateFormatConfig) => string;
  getBrowserLanguage: () => string;
  getLocalizedString: (key: string) => string;
  getDateLocaleLanguage: () => string;
  getTimezone: () => string | undefined;
  getCalendarObject: () => CometChatDateFormatConfig | undefined;
  getDefaultLanguage: () => string;
}
