/**
 * Localization utility functions.
 */
import type { TranslateFunction, TDateTimeParser, TDateTimeParserInput } from './localize.types';
import { supportedLanguages } from './translations';
import enUs from './resources/en-us/translation.json';

/** Fallback translator — resolves from bundled en-us translations, returns empty string if not found. */
export const defaultTranslatorFunction: TranslateFunction = (key: string) =>
  (enUs as Record<string, string>)[key] ?? '';

/** Fallback date parser — wraps input in a Date object. */
export const defaultDateTimeParser: TDateTimeParser = (input?: TDateTimeParserInput) =>
  input ? new Date(input) : new Date();

/** Check if a language code is one we ship translations for. */
export function isLanguageSupported(language: string): boolean {
  return supportedLanguages.includes(language.toLowerCase());
}

/**
 * Detect the user's preferred language from the browser.
 * Returns the full locale (e.g. 'en-us') if supported, otherwise falls back.
 */
export function detectBrowserLanguage(fallback = 'en-us'): string {
  if (typeof window === 'undefined') return fallback;

  const browserLang = window.navigator.language.toLowerCase();

  if (isLanguageSupported(browserLang)) return browserLang;

  const baseLang = browserLang.split('-')[0];
  if (baseLang && isLanguageSupported(baseLang)) return baseLang;

  return fallback;
}
