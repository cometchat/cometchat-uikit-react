/**
 * Sample app i18n configuration.
 *
 * Creates a pre-configured CometChatLocalize instance with sample-app
 * translations merged on top of the UIKit's built-in translations.
 *
 * Usage:
 *   import { createI18nInstance } from '../utils/i18n';
 *   const i18n = createI18nInstance('en-us');
 *   <LocaleProvider i18nInstance={i18n} locale="en-us">
 */
import { CometChatLocalize } from '@cometchat/chat-uikit-react';
import { sampleAppTranslations } from '../locales';

/**
 * Creates a CometChatLocalize instance with all sample-app translations
 * registered for every supported language.
 *
 * @param language - The initial language code (e.g. 'en-us', 'fr', 'hi').
 *                   Defaults to 'en-us'.
 */
export function createI18nInstance(language = 'en-us'): CometChatLocalize {
  const instance = new CometChatLocalize({ language });

  // Register sample-app translations for all supported languages
  instance.addTranslation(sampleAppTranslations);

  return instance;
}
