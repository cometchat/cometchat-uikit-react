/**
 * Locale context — provides getLocalizedString() and language to all components.
 */
import { createContext, useContext } from 'react';
import { defaultDateTimeParser } from '../../resources/CometChatLocalize/localize.utils';
import type { TranslationContextValue } from '../../resources/CometChatLocalize/localize.types';
import enUs from '../../resources/CometChatLocalize/resources/en-us/translation.json';

/** Default translator resolves en-us keys so components work without a provider. */
const defaultTranslator = (key: string): string => (enUs as Record<string, string>)[key] ?? key;

export const LocaleContext = createContext<TranslationContextValue>({
  getLocalizedString: defaultTranslator,
  tDateTimeParser: defaultDateTimeParser,
  language: 'en-us',
  dateLocaleLanguage: 'en-us',
});

/**
 * Hook to access the translation context.
 * Must be used within a LocaleProvider (inside CometChatProvider).
 */
export function useLocale(): TranslationContextValue {
  const ctx = useContext(LocaleContext);
  return ctx;
}
