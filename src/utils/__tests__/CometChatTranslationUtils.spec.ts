/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  translateMessage,
  getCachedTranslation,
  clearTranslationCache,
} from '../CometChatTranslationUtils';

// Mock the CometChat SDK
vi.mock('@cometchat/chat-sdk-javascript', () => {
  return {
    CometChat: {
      callExtension: vi.fn(),
    },
  };
});

/** Helper to create a mock TextMessage with the given id and text. */
function createMockTextMessage(id: number, text: string): CometChat.TextMessage {
  return {
    getId: () => id,
    getText: () => text,
  } as unknown as CometChat.TextMessage;
}

describe('CometChatTranslationUtils', () => {
  beforeEach(() => {
    clearTranslationCache();
    vi.mocked(CometChat.callExtension).mockReset();
  });

  // --- getCachedTranslation ---

  describe('getCachedTranslation', () => {
    it('returns undefined for uncached entries', () => {
      expect(getCachedTranslation(999, 'en')).toBeUndefined();
    });

    it('returns undefined after cache is cleared', () => {
      expect(getCachedTranslation(1, 'fr')).toBeUndefined();
    });
  });

  // --- clearTranslationCache ---

  describe('clearTranslationCache', () => {
    it('clears all entries', () => {
      clearTranslationCache();
      expect(getCachedTranslation(1, 'en')).toBeUndefined();
    });
  });

  // --- translateMessage ---

  describe('translateMessage', () => {
    it('calls CometChat.callExtension with correct parameters', async () => {
      vi.mocked(CometChat.callExtension).mockResolvedValue({
        translations: [{ language_translated: 'fr', message_translated: 'Bonjour' }],
      });

      const msg = createMockTextMessage(1, 'Hello');
      await translateMessage(msg, 'fr');

      expect(CometChat.callExtension).toHaveBeenCalledWith(
        'message-translation',
        'POST',
        'v2/translate',
        {
          msgId: 1,
          text: 'Hello',
          languages: ['fr'],
        }
      );
    });

    it('returns the translated text on success', async () => {
      vi.mocked(CometChat.callExtension).mockResolvedValue({
        translations: [{ language_translated: 'es', message_translated: 'Hola' }],
      });

      const msg = createMockTextMessage(10, 'Hello');
      const result = await translateMessage(msg, 'es');
      expect(result).toBe('Hola');
    });

    it('caches the translation and returns it on subsequent calls', async () => {
      vi.mocked(CometChat.callExtension).mockResolvedValue({
        translations: [{ language_translated: 'de', message_translated: 'Hallo' }],
      });

      const msg = createMockTextMessage(20, 'Hello');

      // First call — hits the API
      const first = await translateMessage(msg, 'de');
      expect(first).toBe('Hallo');
      expect(CometChat.callExtension).toHaveBeenCalledTimes(1);

      // Second call — should use cache, not call API again
      const second = await translateMessage(msg, 'de');
      expect(second).toBe('Hallo');
      expect(CometChat.callExtension).toHaveBeenCalledTimes(1);
    });

    it('cached translation is accessible via getCachedTranslation', async () => {
      vi.mocked(CometChat.callExtension).mockResolvedValue({
        translations: [{ language_translated: 'ja', message_translated: 'こんにちは' }],
      });

      const msg = createMockTextMessage(30, 'Hello');
      await translateMessage(msg, 'ja');

      expect(getCachedTranslation(30, 'ja')).toBe('こんにちは');
    });

    it('returns empty string when no matching translation is found', async () => {
      vi.mocked(CometChat.callExtension).mockResolvedValue({
        translations: [{ language_translated: 'it', message_translated: 'Ciao' }],
      });

      const msg = createMockTextMessage(40, 'Hello');
      // Request French but API returns Italian
      const result = await translateMessage(msg, 'fr');
      expect(result).toBe('');
    });

    it('returns empty string when translations array is empty', async () => {
      vi.mocked(CometChat.callExtension).mockResolvedValue({
        translations: [],
      });

      const msg = createMockTextMessage(50, 'Hello');
      const result = await translateMessage(msg, 'fr');
      expect(result).toBe('');
    });

    it('returns empty string when translations field is undefined', async () => {
      vi.mocked(CometChat.callExtension).mockResolvedValue({});

      const msg = createMockTextMessage(60, 'Hello');
      const result = await translateMessage(msg, 'fr');
      expect(result).toBe('');
    });

    it('returns empty string when message_translated is empty', async () => {
      vi.mocked(CometChat.callExtension).mockResolvedValue({
        translations: [{ language_translated: 'fr', message_translated: '' }],
      });

      const msg = createMockTextMessage(70, 'Hello');
      const result = await translateMessage(msg, 'fr');
      expect(result).toBe('');
    });

    it('returns empty string when the SDK call throws', async () => {
      vi.mocked(CometChat.callExtension).mockRejectedValue(new Error('Network error'));

      const msg = createMockTextMessage(80, 'Hello');
      const result = await translateMessage(msg, 'fr');
      expect(result).toBe('');
    });

    it('does not cache failed translations', async () => {
      vi.mocked(CometChat.callExtension).mockRejectedValue(new Error('fail'));

      const msg = createMockTextMessage(90, 'Hello');
      await translateMessage(msg, 'fr');

      expect(getCachedTranslation(90, 'fr')).toBeUndefined();
    });

    it('does not cache when no matching translation found', async () => {
      vi.mocked(CometChat.callExtension).mockResolvedValue({
        translations: [{ language_translated: 'it', message_translated: 'Ciao' }],
      });

      const msg = createMockTextMessage(100, 'Hello');
      await translateMessage(msg, 'fr');

      expect(getCachedTranslation(100, 'fr')).toBeUndefined();
    });

    it('caches different languages separately for the same message', async () => {
      vi.mocked(CometChat.callExtension)
        .mockResolvedValueOnce({
          translations: [{ language_translated: 'fr', message_translated: 'Bonjour' }],
        })
        .mockResolvedValueOnce({
          translations: [{ language_translated: 'de', message_translated: 'Hallo' }],
        });

      const msg = createMockTextMessage(110, 'Hello');

      const fr = await translateMessage(msg, 'fr');
      const de = await translateMessage(msg, 'de');

      expect(fr).toBe('Bonjour');
      expect(de).toBe('Hallo');
      expect(getCachedTranslation(110, 'fr')).toBe('Bonjour');
      expect(getCachedTranslation(110, 'de')).toBe('Hallo');
    });

    it('clearTranslationCache removes previously cached translations', async () => {
      vi.mocked(CometChat.callExtension).mockResolvedValue({
        translations: [{ language_translated: 'fr', message_translated: 'Bonjour' }],
      });

      const msg = createMockTextMessage(120, 'Hello');
      await translateMessage(msg, 'fr');
      expect(getCachedTranslation(120, 'fr')).toBe('Bonjour');

      clearTranslationCache();
      expect(getCachedTranslation(120, 'fr')).toBeUndefined();
    });
  });
});
