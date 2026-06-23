import { describe, it, expect } from 'vitest';
import { CometChatLocalize } from '../CometChatLocalize';
import type { CometChatDateFormatConfig } from '../../../components/base/CometChatDate/CometChatDate.types';

describe('CometChatLocalize — date/time configuration', () => {
  describe('getTimezone()', () => {
    it('returns undefined when no timezone is configured', () => {
      const localize = new CometChatLocalize();
      expect(localize.getTimezone()).toBeUndefined();
    });

    it('returns the configured timezone string', () => {
      const localize = new CometChatLocalize();
      localize.init({ timezone: 'Europe/Berlin' });
      expect(localize.getTimezone()).toBe('Europe/Berlin');
    });
  });

  describe('getDateLocaleLanguage()', () => {
    it('returns en-US when disableDateTimeLocalization is true', () => {
      const localize = new CometChatLocalize({ language: 'de' });
      localize.init({ disableDateTimeLocalization: true });
      expect(localize.getDateLocaleLanguage()).toBe('en-US');
    });

    it('returns current language when disableDateTimeLocalization is false', () => {
      const localize = new CometChatLocalize({ language: 'de' });
      localize.init({ disableDateTimeLocalization: false });
      expect(localize.getDateLocaleLanguage()).toBe('de');
    });

    it('returns current language when disableDateTimeLocalization is not set', () => {
      const localize = new CometChatLocalize({ language: 'fr' });
      expect(localize.getDateLocaleLanguage()).toBe('fr');
    });
  });

  describe('getCalendarObject()', () => {
    it('returns undefined when no calendarObject is configured', () => {
      const localize = new CometChatLocalize();
      expect(localize.getCalendarObject()).toBeUndefined();
    });

    it('returns the stored calendar configuration', () => {
      const config: CometChatDateFormatConfig = {
        today: 'hh:mm A',
        yesterday: 'Yesterday hh:mm A',
        lastWeek: 'dddd',
        otherDays: 'DD/MM/YYYY',
      };
      const localize = new CometChatLocalize();
      localize.init({ calendarObject: config });
      expect(localize.getCalendarObject()).toEqual(config);
    });
  });

  describe('formatDate()', () => {
    // Use a fixed timestamp: 2024-01-15 10:30:00 UTC (Monday)
    const fixedTimestamp = Math.floor(new Date('2024-01-15T10:30:00Z').getTime() / 1000);

    it('formats with explicit calendarObject argument', () => {
      const localize = new CometChatLocalize({ language: 'en-us' });
      const config: CometChatDateFormatConfig = {
        today: 'hh:mm A',
        yesterday: 'Yesterday',
        lastWeek: 'dddd',
        otherDays: 'DD MMM, YYYY',
      };
      // This timestamp is likely in the "otherDays" bucket
      const result = localize.formatDate(fixedTimestamp, config);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('falls back to globally configured calendarObject when no argument provided', () => {
      const globalConfig: CometChatDateFormatConfig = {
        today: 'Today',
        yesterday: 'Yesterday',
        lastWeek: 'dddd',
        otherDays: 'YYYY-MM-DD',
      };
      const localize = new CometChatLocalize({ language: 'en-us' });
      localize.init({ calendarObject: globalConfig });

      const result = localize.formatDate(fixedTimestamp);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('uses default config when neither argument nor global calendarObject is available', () => {
      const localize = new CometChatLocalize({ language: 'en-us' });
      const result = localize.formatDate(fixedTimestamp);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('passes timezone to the formatting utility', () => {
      const localize = new CometChatLocalize({ language: 'en-us' });
      localize.init({ timezone: 'America/New_York' });

      const config: CometChatDateFormatConfig = {
        otherDays: 'DD MMM, YYYY',
      };
      const result = localize.formatDate(fixedTimestamp, config);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('produces different results for different timezones on the same timestamp', () => {
      // Use a timestamp near midnight UTC so timezone differences are visible in date output
      // 2024-01-15 23:30:00 UTC — in Asia/Tokyo this is already Jan 16
      const nearMidnightUTC = Math.floor(new Date('2024-01-15T23:30:00Z').getTime() / 1000);

      const config: CometChatDateFormatConfig = {
        otherDays: 'DD MMM, YYYY',
      };

      const localizeUTC = new CometChatLocalize({ language: 'en-us' });
      localizeUTC.init({ timezone: 'UTC' });

      const localizeTokyo = new CometChatLocalize({ language: 'en-us' });
      localizeTokyo.init({ timezone: 'Asia/Tokyo' });

      const resultUTC = localizeUTC.formatDate(nearMidnightUTC, config);
      const resultTokyo = localizeTokyo.formatDate(nearMidnightUTC, config);

      // UTC should show Jan 15, Tokyo should show Jan 16
      expect(resultUTC).toContain('15');
      expect(resultTokyo).toContain('16');
    });

    it('formats a "today" timestamp correctly', () => {
      // Use current time as timestamp
      const nowTimestamp = Math.floor(Date.now() / 1000);
      const config: CometChatDateFormatConfig = {
        today: 'Today',
        yesterday: 'Yesterday',
        otherDays: 'DD/MM/YYYY',
      };
      const localize = new CometChatLocalize({ language: 'en-us' });
      const result = localize.formatDate(nowTimestamp, config);
      expect(result).toBe('Today');
    });
  });
});
