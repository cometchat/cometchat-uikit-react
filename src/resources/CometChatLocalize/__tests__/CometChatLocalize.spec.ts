import { describe, it, expect, vi } from 'vitest';
import { CometChatLocalize } from '../CometChatLocalize';

describe('CometChatLocalize', () => {
  describe('setCurrentLanguage', () => {
    it('updates the current language to lowercase', () => {
      const localize = new CometChatLocalize({ language: 'en-us' });
      localize.setCurrentLanguage('FR');
      expect(localize.currentLanguage).toBe('fr');
    });

    it('triggers the registered language-change callback with new t()', () => {
      const localize = new CometChatLocalize({ language: 'en-us' });
      const callback = vi.fn();
      localize.registerSetLanguageCallback(callback);

      localize.setCurrentLanguage('de');

      expect(callback).toHaveBeenCalledTimes(1);
      expect(typeof callback.mock.calls[0][0]).toBe('function');
    });

    it('recreates t() to resolve keys against the new language', () => {
      const localize = new CometChatLocalize({ language: 'en-us' });
      localize.addTranslation({
        fr: { HELLO: 'Bonjour' },
        'en-us': { HELLO: 'Hello' },
      });
      localize.setCurrentLanguage('fr');
      expect(localize.t('HELLO')).toBe('Bonjour');
    });
  });

  describe('getCurrentLanguage', () => {
    it('returns the active language code', () => {
      const localize = new CometChatLocalize({ language: 'de' });
      expect(localize.getCurrentLanguage()).toBe('de');
    });

    it('reflects changes after setCurrentLanguage', () => {
      const localize = new CometChatLocalize({ language: 'en-us' });
      localize.setCurrentLanguage('es');
      expect(localize.getCurrentLanguage()).toBe('es');
    });
  });

  describe('addTranslation', () => {
    it('merges translations for multiple languages', () => {
      const localize = new CometChatLocalize({ language: 'en-us' });
      localize.addTranslation({
        'en-us': { GREETING: 'Hi' },
        fr: { GREETING: 'Salut' },
      });

      expect(localize.t('GREETING')).toBe('Hi');
      localize.setCurrentLanguage('fr');
      expect(localize.t('GREETING')).toBe('Salut');
    });

    it('overwrites existing keys with new values', () => {
      const localize = new CometChatLocalize({ language: 'en-us' });
      localize.addTranslation({ 'en-us': { KEY: 'old' } });
      localize.addTranslation({ 'en-us': { KEY: 'new' } });
      // Recreate t() to pick up changes
      localize.setCurrentLanguage('en-us');
      expect(localize.t('KEY')).toBe('new');
    });

    it('preserves existing translations when adding new keys', () => {
      const localize = new CometChatLocalize({ language: 'en-us' });
      localize.addTranslation({ 'en-us': { A: 'alpha' } });
      localize.addTranslation({ 'en-us': { B: 'beta' } });
      localize.setCurrentLanguage('en-us');
      expect(localize.t('A')).toBe('alpha');
      expect(localize.t('B')).toBe('beta');
    });
  });

  describe('init()', () => {
    it('sets the language when provided', () => {
      const localize = new CometChatLocalize();
      localize.init({ language: 'fr' });
      expect(localize.getCurrentLanguage()).toBe('fr');
    });

    it('sets the fallback language when provided', () => {
      const localize = new CometChatLocalize();
      localize.addTranslation({ de: { FALLBACK_KEY: 'Deutsch' } });
      localize.init({ fallbackLanguage: 'de', language: 'ja' });
      // Key not in 'ja', should fall back to 'de'
      expect(localize.t('FALLBACK_KEY')).toBe('Deutsch');
    });

    it('merges translationsForLanguage into the store', () => {
      const localize = new CometChatLocalize({ language: 'en-us' });
      localize.init({
        translationsForLanguage: {
          'en-us': { CUSTOM: 'custom value' },
        },
      });
      expect(localize.t('CUSTOM')).toBe('custom value');
    });

    it('stores timezone configuration', () => {
      const localize = new CometChatLocalize();
      localize.init({ timezone: 'America/New_York' });
      expect(localize.getTimezone()).toBe('America/New_York');
    });

    it('stores calendarObject configuration', () => {
      const localize = new CometChatLocalize();
      const config = { today: 'hh:mm A', yesterday: 'Yesterday' };
      localize.init({ calendarObject: config });
      expect(localize.getCalendarObject()).toEqual(config);
    });

    it('stores disableAutoDetection flag', () => {
      const localize = new CometChatLocalize();
      localize.init({ disableAutoDetection: true });
      expect(localize.getDefaultLanguage()).toBe('en-us'); // returns fallback when disabled
    });

    it('stores disableDateTimeLocalization flag', () => {
      const localize = new CometChatLocalize({ language: 'fr' });
      localize.init({ disableDateTimeLocalization: true });
      expect(localize.getDateLocaleLanguage()).toBe('en-US');
    });

    it('stores missingKeyHandler callback', () => {
      const handler = vi.fn().mockReturnValue('handled');
      const localize = new CometChatLocalize({ language: 'en-us' });
      localize.init({ missingKeyHandler: handler });
      const result = localize.t('NONEXISTENT_KEY');
      expect(handler).toHaveBeenCalledWith('NONEXISTENT_KEY');
      expect(result).toBe('handled');
    });

    it('merges settings additively — later calls do not clear unspecified properties', () => {
      const localize = new CometChatLocalize();
      localize.init({ timezone: 'UTC', language: 'fr' });
      localize.init({ disableDateTimeLocalization: true });

      // timezone should still be set from first call
      expect(localize.getTimezone()).toBe('UTC');
      // language should still be 'fr' from first call
      expect(localize.getCurrentLanguage()).toBe('fr');
      // new setting from second call
      expect(localize.getDateLocaleLanguage()).toBe('en-US');
    });
  });

  describe('configurable fallback language', () => {
    it('defaults fallback to en-us when not configured', () => {
      const localize = new CometChatLocalize({ language: 'xx' });
      // 'calls_missed_call' is a key in en-us translations
      const result = localize.t('calls_missed_call');
      expect(result).toBe('Missed Call');
    });

    it('uses configured fallback language when key is missing in current', () => {
      const localize = new CometChatLocalize({ language: 'xx', fallbackLanguage: 'de' });
      // Key should resolve from 'de' fallback
      const result = localize.t('calls_missed_call');
      expect(result).not.toBe('calls_missed_call'); // should resolve from de fallback
    });

    it('returns raw key when not found in current or fallback', () => {
      const localize = new CometChatLocalize({ language: 'en-us' });
      expect(localize.t('TOTALLY_NONEXISTENT_KEY_XYZ')).toBe('TOTALLY_NONEXISTENT_KEY_XYZ');
    });
  });

  describe('missing key handler', () => {
    it('invokes handler when key is not found in current or fallback', () => {
      const handler = vi.fn();
      const localize = new CometChatLocalize({ language: 'en-us' });
      localize.init({ missingKeyHandler: handler });
      localize.t('MISSING_KEY_ABC');
      expect(handler).toHaveBeenCalledWith('MISSING_KEY_ABC');
    });

    it('uses handler return value as translation when it returns a string', () => {
      const handler = vi.fn().mockReturnValue('dynamic fallback');
      const localize = new CometChatLocalize({ language: 'en-us' });
      localize.init({ missingKeyHandler: handler });
      expect(localize.t('MISSING_KEY_ABC')).toBe('dynamic fallback');
    });

    it('returns raw key when handler returns void', () => {
      const handler = vi.fn().mockReturnValue(undefined);
      const localize = new CometChatLocalize({ language: 'en-us' });
      localize.init({ missingKeyHandler: handler });
      expect(localize.t('MISSING_KEY_ABC')).toBe('MISSING_KEY_ABC');
    });

    it('returns raw key when no handler is configured', () => {
      const localize = new CometChatLocalize({ language: 'en-us' });
      expect(localize.t('MISSING_KEY_ABC')).toBe('MISSING_KEY_ABC');
    });
  });

  describe('t() lookup order', () => {
    it('looks up current language first', () => {
      const localize = new CometChatLocalize({ language: 'en-us' });
      localize.addTranslation({
        'en-us': { KEY: 'english' },
        fr: { KEY: 'french' },
      });
      localize.setCurrentLanguage('en-us');
      expect(localize.t('KEY')).toBe('english');
    });

    it('falls back to fallback language when not in current', () => {
      const localize = new CometChatLocalize({ language: 'xx', fallbackLanguage: 'fr' });
      localize.addTranslation({ fr: { KEY: 'french' } });
      // Recreate t() after adding translations
      localize.setCurrentLanguage('xx');
      expect(localize.t('KEY')).toBe('french');
    });

    it('invokes handler when not in current or fallback', () => {
      const handler = vi.fn().mockReturnValue('from handler');
      const localize = new CometChatLocalize({ language: 'xx', fallbackLanguage: 'yy' });
      localize.init({ missingKeyHandler: handler });
      expect(localize.t('UNKNOWN')).toBe('from handler');
    });

    it('returns raw key as last resort', () => {
      const localize = new CometChatLocalize({ language: 'xx', fallbackLanguage: 'yy' });
      expect(localize.t('UNKNOWN')).toBe('UNKNOWN');
    });
  });
});
