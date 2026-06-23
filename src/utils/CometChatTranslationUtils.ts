/**
 * CometChatTranslationUtils
 * Translation API call with caching and same-language detection.
 */

import { CometChat } from '@cometchat/chat-sdk-javascript';

const translationCache = new Map<string, string>();

export interface TranslationResult {
  translatedText: string;
  isSameLanguage: boolean;
}

/**
 * Translate a text message to the specified language.
 * Returns the translated text and whether the source language matches the target.
 *
 * Same-language detection: if the API response's `language_original` matches the
 * requested language (or its base code, e.g., "en" from "en-US"), the message is
 * already in the target language and no translation is needed.
 */
export async function translateMessage(
  message: CometChat.TextMessage,
  language: string
): Promise<TranslationResult> {
  const messageId = message.getId();
  const cacheKey = `${String(messageId)}_${language}`;

  const cached = translationCache.get(cacheKey);
  if (cached) return { translatedText: cached, isSameLanguage: false };

  try {
    const originalText = message.getText();

    const response = (await CometChat.callExtension('message-translation', 'POST', 'v2/translate', {
      msgId: messageId,
      text: originalText,
      languages: [language],
    })) as {
      translations?: { language_translated: string; message_translated: string }[];
      language_original?: string;
    };

    // Check if the source language matches the target language
    const languageOriginal = response.language_original ?? '';
    const langParts = language.split('-');
    const fallbackLang = langParts[0] ?? language;
    if (
      languageOriginal &&
      (language.toLowerCase() === languageOriginal.toLowerCase() ||
        fallbackLang.toLowerCase() === languageOriginal.toLowerCase())
    ) {
      return { translatedText: '', isSameLanguage: true };
    }

    const translations = response.translations ?? [];
    const translation = translations.find(t => t.language_translated === language);

    if (!translation?.message_translated) {
      return { translatedText: '', isSameLanguage: false };
    }

    const translatedText = translation.message_translated;
    translationCache.set(cacheKey, translatedText);
    return { translatedText, isSameLanguage: false };
  } catch {
    return { translatedText: '', isSameLanguage: false };
  }
}

/**
 * Get a cached translation for a message.
 */
export function getCachedTranslation(messageId: number, language: string): string | undefined {
  return translationCache.get(`${String(messageId)}_${language}`);
}

/**
 * Clear the translation cache.
 */
export function clearTranslationCache(): void {
  translationCache.clear();
}
