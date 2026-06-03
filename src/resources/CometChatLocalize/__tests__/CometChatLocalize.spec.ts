import { describe, it, expect, vi } from 'vitest';
import { CometChatLocalize } from '../CometChatLocalize';

describe('CometChatLocalize', () => {
  describe('setCurrentLanguage', () => {
    it('updates the current language to lowercase', () => {
      const i18n = new CometChatLocalize({ language: 'en-us' });
      i18n.setCurrentLanguage('FR');
      expect(i18n.currentLanguage).toBe('fr');
    });

    it('triggers the registered language-change callback with new t()', () => {
      const i18n = new CometChatLocalize({ language: 'en-us' });
      const callback = vi.fn();
      i18n.registerSetLanguageCallback(callback);

      i18n.setCurrentLanguage('de');

      expect(callback).toHaveBeenCalledTimes(1);
      expect(typeof callback.mock.calls[0][0]).toBe('function');
    });

    it('recreates t() to resolve keys against the new language', () => {
      const i18n = new CometChatLocalize({ language: 'en-us' });
      i18n.addTranslation({
        fr: { HELLO: 'Bonjour' },
        'en-us': { HELLO: 'Hello' },
      });
      i18n.setCurrentLanguage('fr');
      expect(i18n.t('HELLO')).toBe('Bonjour');
    });
  });

  describe('getCurrentLanguage', () => {
    it('returns the active language code', () => {
      const i18n = new CometChatLocalize({ language: 'de' });
      expect(i18n.getCurrentLanguage()).toBe('de');
    });

    it('reflects changes after setCurrentLanguage', () => {
      const i18n = new CometChatLocalize({ language: 'en-us' });
      i18n.setCurrentLanguage('es');
      expect(i18n.getCurrentLanguage()).toBe('es');
    });
  });

  describe('addTranslation', () => {
    it('merges translations for multiple languages', () => {
      const i18n = new CometChatLocalize({ language: 'en-us' });
      i18n.addTranslation({
        'en-us': { GREETING: 'Hi' },
        fr: { GREETING: 'Salut' },
      });

      expect(i18n.t('GREETING')).toBe('Hi');
      i18n.setCurrentLanguage('fr');
      expect(i18n.t('GREETING')).toBe('Salut');
    });

    it('overwrites existing keys with new values', () => {
      const i18n = new CometChatLocalize({ language: 'en-us' });
      i18n.addTranslation({ 'en-us': { KEY: 'old' } });
      i18n.addTranslation({ 'en-us': { KEY: 'new' } });
      // Recreate t() to pick up changes
      i18n.setCurrentLanguage('en-us');
      expect(i18n.t('KEY')).toBe('new');
    });

    it('preserves existing translations when adding new keys', () => {
      const i18n = new CometChatLocalize({ language: 'en-us' });
      i18n.addTranslation({ 'en-us': { A: 'alpha' } });
      i18n.addTranslation({ 'en-us': { B: 'beta' } });
      i18n.setCurrentLanguage('en-us');
      expect(i18n.t('A')).toBe('alpha');
      expect(i18n.t('B')).toBe('beta');
    });
  });

  describe('init()', () => {
    it('sets the language when provided', () => {
      const i18n = new CometChatLocalize();
      i18n.init({ language: 'fr' });
      expect(i18n.getCurrentLanguage()).toBe('fr');
    });

    it('sets the fallback language when provided', () => {
      const i18n = new CometChatLocalize();
      i18n.addTranslation({ de: { FALLBACK_KEY: 'Deutsch' } });
      i18n.init({ fallbackLanguage: 'de', language: 'ja' });
      // Key not in 'ja', should fall back to 'de'
      expect(i18n.t('FALLBACK_KEY')).toBe('Deutsch');
    });

    it('merges translationsForLanguage into the store', () => {
      const i18n = new CometChatLocalize({ language: 'en-us' });
      i18n.init({
        translationsForLanguage: {
          'en-us': { CUSTOM: 'custom value' },
        },
      });
      expect(i18n.t('CUSTOM')).toBe('custom value');
    });

    it('stores timezone configuration', () => {
      const i18n = new CometChatLocalize();
      i18n.init({ timezone: 'America/New_York' });
      expect(i18n.getTimezone()).toBe('America/New_York');
    });

    it('stores calendarObject configuration', () => {
      const i18n = new CometChatLocalize();
      const config = { today: 'hh:mm A', yesterday: 'Yesterday' };
      i18n.init({ calendarObject: config });
      expect(i18n.getCalendarObject()).toEqual(config);
    });

    it('stores disableAutoDetection flag', () => {
      const i18n = new CometChatLocalize();
      i18n.init({ disableAutoDetection: true });
      expect(i18n.getDefaultLanguage()).toBe('en-us'); // returns fallback when disabled
    });

    it('stores disableDateTimeLocalization flag', () => {
      const i18n = new CometChatLocalize({ language: 'fr' });
      i18n.init({ disableDateTimeLocalization: true });
      expect(i18n.getDateLocaleLanguage()).toBe('en-US');
    });

    it('stores missingKeyHandler callback', () => {
      const handler = vi.fn().mockReturnValue('handled');
      const i18n = new CometChatLocalize({ language: 'en-us' });
      i18n.init({ missingKeyHandler: handler });
      const result = i18n.t('NONEXISTENT_KEY');
      expect(handler).toHaveBeenCalledWith('NONEXISTENT_KEY');
      expect(result).toBe('handled');
    });

    it('merges settings additively — later calls do not clear unspecified properties', () => {
      const i18n = new CometChatLocalize();
      i18n.init({ timezone: 'UTC', language: 'fr' });
      i18n.init({ disableDateTimeLocalization: true });

      // timezone should still be set from first call
      expect(i18n.getTimezone()).toBe('UTC');
      // language should still be 'fr' from first call
      expect(i18n.getCurrentLanguage()).toBe('fr');
      // new setting from second call
      expect(i18n.getDateLocaleLanguage()).toBe('en-US');
    });
  });

  describe('configurable fallback language', () => {
    it('defaults fallback to en-us when not configured', () => {
      const i18n = new CometChatLocalize({ language: 'xx' });
      // 'calls_missed_call' is a key in en-us translations
      const result = i18n.t('calls_missed_call');
      expect(result).toBe('Missed Call');
    });

    it('uses configured fallback language when key is missing in current', () => {
      const i18n = new CometChatLocalize({ language: 'xx', fallbackLanguage: 'de' });
      // Key should resolve from 'de' fallback
      const result = i18n.t('calls_missed_call');
      expect(result).not.toBe('calls_missed_call'); // should resolve from de fallback
    });

    it('returns raw key when not found in current or fallback', () => {
      const i18n = new CometChatLocalize({ language: 'en-us' });
      expect(i18n.t('TOTALLY_NONEXISTENT_KEY_XYZ')).toBe('TOTALLY_NONEXISTENT_KEY_XYZ');
    });
  });

  describe('missing key handler', () => {
    it('invokes handler when key is not found in current or fallback', () => {
      const handler = vi.fn();
      const i18n = new CometChatLocalize({ language: 'en-us' });
      i18n.init({ missingKeyHandler: handler });
      i18n.t('MISSING_KEY_ABC');
      expect(handler).toHaveBeenCalledWith('MISSING_KEY_ABC');
    });

    it('uses handler return value as translation when it returns a string', () => {
      const handler = vi.fn().mockReturnValue('dynamic fallback');
      const i18n = new CometChatLocalize({ language: 'en-us' });
      i18n.init({ missingKeyHandler: handler });
      expect(i18n.t('MISSING_KEY_ABC')).toBe('dynamic fallback');
    });

    it('returns raw key when handler returns void', () => {
      const handler = vi.fn().mockReturnValue(undefined);
      const i18n = new CometChatLocalize({ language: 'en-us' });
      i18n.init({ missingKeyHandler: handler });
      expect(i18n.t('MISSING_KEY_ABC')).toBe('MISSING_KEY_ABC');
    });

    it('returns raw key when no handler is configured', () => {
      const i18n = new CometChatLocalize({ language: 'en-us' });
      expect(i18n.t('MISSING_KEY_ABC')).toBe('MISSING_KEY_ABC');
    });
  });

  describe('t() lookup order', () => {
    it('looks up current language first', () => {
      const i18n = new CometChatLocalize({ language: 'en-us' });
      i18n.addTranslation({
        'en-us': { KEY: 'english' },
        fr: { KEY: 'french' },
      });
      i18n.setCurrentLanguage('en-us');
      expect(i18n.t('KEY')).toBe('english');
    });

    it('falls back to fallback language when not in current', () => {
      const i18n = new CometChatLocalize({ language: 'xx', fallbackLanguage: 'fr' });
      i18n.addTranslation({ fr: { KEY: 'french' } });
      // Recreate t() after adding translations
      i18n.setCurrentLanguage('xx');
      expect(i18n.t('KEY')).toBe('french');
    });

    it('invokes handler when not in current or fallback', () => {
      const handler = vi.fn().mockReturnValue('from handler');
      const i18n = new CometChatLocalize({ language: 'xx', fallbackLanguage: 'yy' });
      i18n.init({ missingKeyHandler: handler });
      expect(i18n.t('UNKNOWN')).toBe('from handler');
    });

    it('returns raw key as last resort', () => {
      const i18n = new CometChatLocalize({ language: 'xx', fallbackLanguage: 'yy' });
      expect(i18n.t('UNKNOWN')).toBe('UNKNOWN');
    });
  });
});
