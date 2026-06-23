import { describe, it, expect, vi, afterEach } from 'vitest';
import { CometChatLocalize } from '../CometChatLocalize';

describe('CometChatLocalize — utility methods', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('getBrowserLanguage()', () => {
    it('returns supported locale when browser language matches', () => {
      vi.stubGlobal('window', {
        navigator: {
          language: 'de',
          languages: ['de', 'en-US'],
        },
      });

      const localize = new CometChatLocalize({ language: 'en-us' });
      expect(localize.getBrowserLanguage()).toBe('de');
    });

    it('returns full locale code when browser language matches exactly', () => {
      vi.stubGlobal('window', {
        navigator: {
          language: 'en-us',
          languages: ['en-us'],
        },
      });

      const localize = new CometChatLocalize({ language: 'en-us' });
      expect(localize.getBrowserLanguage()).toBe('en-us');
    });

    it('returns fallback when browser language is unsupported', () => {
      vi.stubGlobal('window', {
        navigator: {
          language: 'xx-yy',
          languages: ['xx-yy'],
        },
      });

      const localize = new CometChatLocalize({ language: 'en-us', fallbackLanguage: 'fr' });
      expect(localize.getBrowserLanguage()).toBe('fr');
    });

    it('handles SSR (no window) gracefully by returning fallback', () => {
      // Temporarily remove window
      const originalWindow = globalThis.window;
      // @ts-expect-error - intentionally removing window for SSR test
      delete globalThis.window;

      const localize = new CometChatLocalize({ language: 'en-us', fallbackLanguage: 'de' });
      expect(localize.getBrowserLanguage()).toBe('de');

      // Restore window
      globalThis.window = originalWindow;
    });

    it('matches base language when full locale is not supported', () => {
      vi.stubGlobal('window', {
        navigator: {
          language: 'fr-CA',
          languages: ['fr-CA'],
        },
      });

      const localize = new CometChatLocalize({ language: 'en-us' });
      // 'fr-CA' is not in supported languages, but 'fr' is
      expect(localize.getBrowserLanguage()).toBe('fr');
    });
  });

  describe('getLocalizedString()', () => {
    it('is an alias for t()', () => {
      const localize = new CometChatLocalize({ language: 'en-us' });
      localize.addTranslation({ 'en-us': { TEST_KEY: 'test value' } });
      localize.setCurrentLanguage('en-us');

      expect(localize.getLocalizedString('TEST_KEY')).toBe(localize.t('TEST_KEY'));
      expect(localize.getLocalizedString('TEST_KEY')).toBe('test value');
    });

    it('returns raw key when not found (same as t())', () => {
      const localize = new CometChatLocalize({ language: 'en-us' });
      expect(localize.getLocalizedString('NONEXISTENT')).toBe('NONEXISTENT');
      expect(localize.getLocalizedString('NONEXISTENT')).toBe(localize.t('NONEXISTENT'));
    });
  });

  describe('getDefaultLanguage()', () => {
    it('returns fallback language when disableAutoDetection is true', () => {
      const localize = new CometChatLocalize({ language: 'en-us', fallbackLanguage: 'de' });
      localize.init({ disableAutoDetection: true });
      expect(localize.getDefaultLanguage()).toBe('de');
    });

    it('returns browser language when disableAutoDetection is false', () => {
      vi.stubGlobal('window', {
        navigator: {
          language: 'fr',
          languages: ['fr'],
        },
      });

      const localize = new CometChatLocalize({ language: 'en-us' });
      localize.init({ disableAutoDetection: false });
      expect(localize.getDefaultLanguage()).toBe('fr');
    });

    it('returns browser language by default (disableAutoDetection not set)', () => {
      vi.stubGlobal('window', {
        navigator: {
          language: 'es',
          languages: ['es'],
        },
      });

      const localize = new CometChatLocalize({ language: 'en-us' });
      expect(localize.getDefaultLanguage()).toBe('es');
    });
  });
});
