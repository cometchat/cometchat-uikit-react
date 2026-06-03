/**
 * CometChatTranslationUtils
 * Translation API call with caching.
 */

import { CometChat } from '@cometchat/chat-sdk-javascript';

const translationCache = new Map<string, string>();

/**
 * Translate a text message to the specified language.
 */
export async function translateMessage(
  message: CometChat.TextMessage,
  language: string
): Promise<string> {
  const messageId = message.getId();
  const cacheKey = `${String(messageId)}_${language}`;

  const cached = translationCache.get(cacheKey);
  if (cached) return cached;

  try {
    const originalText = message.getText();

    const response = (await CometChat.callExtension('message-translation', 'POST', 'v2/translate', {
      msgId: messageId,
      text: originalText,
      languages: [language],
    })) as { translations?: { language_translated: string; message_translated: string }[] };

    const translations = response.translations ?? [];
    const translation = translations.find(t => t.language_translated === language);

    if (!translation?.message_translated) {
      return '';
    }

    const translatedText = translation.message_translated;
    translationCache.set(cacheKey, translatedText);
    return translatedText;
  } catch {
    return '';
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
