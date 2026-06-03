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

      const i18n = new CometChatLocalize({ language: 'en-us' });
      expect(i18n.getBrowserLanguage()).toBe('de');
    });

    it('returns full locale code when browser language matches exactly', () => {
      vi.stubGlobal('window', {
        navigator: {
          language: 'en-us',
          languages: ['en-us'],
        },
      });

      const i18n = new CometChatLocalize({ language: 'en-us' });
      expect(i18n.getBrowserLanguage()).toBe('en-us');
    });

    it('returns fallback when browser language is unsupported', () => {
      vi.stubGlobal('window', {
        navigator: {
          language: 'xx-yy',
          languages: ['xx-yy'],
        },
      });

      const i18n = new CometChatLocalize({ language: 'en-us', fallbackLanguage: 'fr' });
      expect(i18n.getBrowserLanguage()).toBe('fr');
    });

    it('handles SSR (no window) gracefully by returning fallback', () => {
      // Temporarily remove window
      const originalWindow = globalThis.window;
      // @ts-expect-error - intentionally removing window for SSR test
      delete globalThis.window;

      const i18n = new CometChatLocalize({ language: 'en-us', fallbackLanguage: 'de' });
      expect(i18n.getBrowserLanguage()).toBe('de');

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

      const i18n = new CometChatLocalize({ language: 'en-us' });
      // 'fr-CA' is not in supported languages, but 'fr' is
      expect(i18n.getBrowserLanguage()).toBe('fr');
    });
  });

  describe('getLocalizedString()', () => {
    it('is an alias for t()', () => {
      const i18n = new CometChatLocalize({ language: 'en-us' });
      i18n.addTranslation({ 'en-us': { TEST_KEY: 'test value' } });
      i18n.setCurrentLanguage('en-us');

      expect(i18n.getLocalizedString('TEST_KEY')).toBe(i18n.t('TEST_KEY'));
      expect(i18n.getLocalizedString('TEST_KEY')).toBe('test value');
    });

    it('returns raw key when not found (same as t())', () => {
      const i18n = new CometChatLocalize({ language: 'en-us' });
      expect(i18n.getLocalizedString('NONEXISTENT')).toBe('NONEXISTENT');
      expect(i18n.getLocalizedString('NONEXISTENT')).toBe(i18n.t('NONEXISTENT'));
    });
  });

  describe('getDefaultLanguage()', () => {
    it('returns fallback language when disableAutoDetection is true', () => {
      const i18n = new CometChatLocalize({ language: 'en-us', fallbackLanguage: 'de' });
      i18n.init({ disableAutoDetection: true });
      expect(i18n.getDefaultLanguage()).toBe('de');
    });

    it('returns browser language when disableAutoDetection is false', () => {
      vi.stubGlobal('window', {
        navigator: {
          language: 'fr',
          languages: ['fr'],
        },
      });

      const i18n = new CometChatLocalize({ language: 'en-us' });
      i18n.init({ disableAutoDetection: false });
      expect(i18n.getDefaultLanguage()).toBe('fr');
    });

    it('returns browser language by default (disableAutoDetection not set)', () => {
      vi.stubGlobal('window', {
        navigator: {
          language: 'es',
          languages: ['es'],
        },
      });

      const i18n = new CometChatLocalize({ language: 'en-us' });
      expect(i18n.getDefaultLanguage()).toBe('es');
    });
  });
});
