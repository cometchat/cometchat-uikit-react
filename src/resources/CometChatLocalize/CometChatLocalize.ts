/**
 * CometChatLocalize — core localization service class.
 *
 * Simple key-value lookup with fallback language support.
 * React integration is in LocaleProvider.
 */

import { translationResources } from './translations';
import type {
  CometChatLocalizeInstance,
  TranslateFunction,
  TDateTimeParser,
  TDateTimeParserInput,
  MissingKeyHandler,
  LocalizationSettings,
} from './localize.types';
import type { CometChatDateFormatConfig } from '../../components/base/CometChatDate/CometChatDate.types';
import { formatDateWithConfig } from './dateFormat.utils';

const DEFAULT_LNG = 'en-us';

export interface CometChatLocalizeOptions {
  language?: string;
  translationsForLanguage?: Record<string, string>;
  fallbackLanguage?: string;
}

export class CometChatLocalize implements CometChatLocalizeInstance {
  private static _sharedInstance: CometChatLocalize | null = null;

  /**
   * Returns the shared CometChatLocalize instance (set by LocaleProvider on mount).
   * Use this in non-React code (plugins, utilities) to access `getLocalizedString()` without a hook.
   */
  static getSharedInstance(): CometChatLocalize | null {
    return CometChatLocalize._sharedInstance;
  }

  /**
   * Called by LocaleProvider to register the active instance for static access.
   */
  static setSharedInstance(instance: CometChatLocalize) {
    CometChatLocalize._sharedInstance = instance;
  }

  currentLanguage: string;
  private fallbackLanguage: string;
  private translations: Record<string, Record<string, string>>;
  private setLanguageCallback: (t: TranslateFunction) => void = () => {
    /* noop */
  };

  private missingKeyHandler: MissingKeyHandler | undefined;
  private timezone: string | undefined;
  private disableDateTimeLocalization = false;
  private disableAutoDetection = false;
  private calendarObject: CometChatDateFormatConfig | undefined;

  t: TranslateFunction = (key: string) => key;
  tDateTimeParser: TDateTimeParser;

  constructor(options: CometChatLocalizeOptions = {}) {
    this.currentLanguage = (options.language ?? DEFAULT_LNG).toLowerCase();
    this.fallbackLanguage = (options.fallbackLanguage ?? DEFAULT_LNG).toLowerCase();

    // Flatten the nested { lang: { translation: { key: value } } } structure to { lang: { key: value } }
    this.translations = {};
    for (const [lang, namespaces] of Object.entries(translationResources)) {
      this.translations[lang] = namespaces.translation ?? {};
    }

    // Merge custom translations if provided
    if (options.translationsForLanguage) {
      const existing = this.translations[this.currentLanguage] ?? {};
      this.translations[this.currentLanguage] = { ...existing, ...options.translationsForLanguage };
    }

    // Create the getLocalizedString() function
    this.t = this.createTranslateFunction();

    this.tDateTimeParser = (input?: TDateTimeParserInput) => (input ? new Date(input) : new Date());
  }

  /**
   * Creates the translate function bound to the current language and fallback settings.
   */
  private createTranslateFunction(): TranslateFunction {
    return (key: string): string => {
      const result =
        this.translations[this.currentLanguage]?.[key] ??
        this.translations[this.fallbackLanguage]?.[key];

      if (result !== undefined) {
        return result;
      }

      // Key not found — invoke missing key handler if configured
      if (this.missingKeyHandler) {
        const handlerResult = this.missingKeyHandler(key);
        if (typeof handlerResult === 'string') {
          return handlerResult;
        }
      }

      return key;
    };
  }

  init(settings: LocalizationSettings = {}) {
    if (settings.fallbackLanguage !== undefined) {
      this.fallbackLanguage = settings.fallbackLanguage.toLowerCase();
    }
    if (settings.translationsForLanguage !== undefined) {
      this.addTranslation(settings.translationsForLanguage);
    }
    if (settings.timezone !== undefined) {
      this.timezone = settings.timezone;
    }
    if (settings.calendarObject !== undefined) {
      this.calendarObject = settings.calendarObject;
    }
    if (settings.disableAutoDetection !== undefined) {
      this.disableAutoDetection = settings.disableAutoDetection;
    }
    if (settings.disableDateTimeLocalization !== undefined) {
      this.disableDateTimeLocalization = settings.disableDateTimeLocalization;
    }
    if (settings.missingKeyHandler !== undefined) {
      this.missingKeyHandler = settings.missingKeyHandler;
    }

    // Recreate getLocalizedString() to pick up any new fallback/handler settings
    this.t = this.createTranslateFunction();

    // Set language last so the recreated getLocalizedString() already has the updated fallback/handler
    if (settings.language !== undefined) {
      this.setCurrentLanguage(settings.language);
    }
  }

  getTranslators() {
    return { t: this.t, tDateTimeParser: this.tDateTimeParser };
  }

  /**
   * Adds translations for one or more languages. Existing keys are overwritten.
   */
  addTranslation(resources: Record<string, Record<string, string>>) {
    for (const [language, translations] of Object.entries(resources)) {
      const lang = language.toLowerCase();
      if (!this.translations[lang]) {
        this.translations[lang] = translations;
      } else {
        this.translations[lang] = { ...this.translations[lang], ...translations };
      }
    }
  }

  /**
   * Sets the active language and recreates the getLocalizedString() function.
   */
  setCurrentLanguage(language: string) {
    this.currentLanguage = language.toLowerCase();
    this.t = this.createTranslateFunction();
    this.setLanguageCallback(this.t);
  }

  /**
   * Returns the currently active language code.
   */
  getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  registerSetLanguageCallback(callback: (t: TranslateFunction) => void) {
    this.setLanguageCallback = callback;
  }

  // --- Date/time configuration getters ---

  /**
   * Returns the configured IANA timezone string, or undefined if not set.
   */
  getTimezone(): string | undefined {
    return this.timezone;
  }

  /**
   * Returns the locale language for date formatting.
   * Returns "en-US" when disableDateTimeLocalization is true, otherwise the current language.
   */
  getDateLocaleLanguage(): string {
    if (this.disableDateTimeLocalization) {
      return 'en-US';
    }
    return this.currentLanguage;
  }

  /**
   * Returns the stored calendar object configuration, or undefined if not set.
   */
  getCalendarObject(): CometChatDateFormatConfig | undefined {
    return this.calendarObject;
  }

  /**
   * Formats a Unix timestamp (seconds) using a CometChatDateFormatConfig.
   *
   * When a calendarObject argument is provided, uses it directly.
   * When not provided, falls back to the globally configured calendarObject from init().
   * If neither is available, uses a sensible default config.
   */
  formatDate(timestamp: number, calendarObject?: CometChatDateFormatConfig): string {
    const config = calendarObject ??
      this.calendarObject ?? {
        today: 'Today',
        yesterday: 'Yesterday',
        lastWeek: 'dddd',
        otherDays: 'DD MMM, YYYY',
      };

    return formatDateWithConfig(timestamp, config, {
      timezone: this.timezone,
      locale: this.getDateLocaleLanguage(),
    });
  }

  getBrowserLanguage(): string {
    if (typeof window === 'undefined') return this.fallbackLanguage;

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const languages = window.navigator.languages?.length
      ? window.navigator.languages
      : [window.navigator.language];

    for (const lang of languages) {
      const normalized = lang.toLowerCase();
      // Check full locale (e.g., "en-us")
      if (this.translations[normalized]) {
        return normalized;
      }
      // Check base language (e.g., "en")
      const baseLang = normalized.split('-')[0];
      if (baseLang && this.translations[baseLang]) {
        return baseLang;
      }
    }

    return this.fallbackLanguage;
  }

  getLocalizedString(key: string): string {
    return this.t(key);
  }

  getDefaultLanguage(): string {
    if (this.disableAutoDetection) {
      return this.fallbackLanguage;
    }
    return this.getBrowserLanguage();
  }
}
