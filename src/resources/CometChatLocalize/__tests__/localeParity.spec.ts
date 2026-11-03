/**
 * Every locale keeps up with en-us (the fallback language). Known untranslated keys are listed
 * in locale-gaps.baseline.json; the list may only shrink. A key missing from a locale shows the
 * English text, so this guards against silently losing translations, and against stray keys
 * that en-us doesn't have. A value left in English is the same gap in disguise, so a value may
 * only equal the en-us one where same-as-english.json says that's the right word (Online, Emoji…).
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import baseline from './locale-gaps.baseline.json';
import sameAsEnglish from './same-as-english.json';

const RESOURCES = join(__dirname, '../resources');
const read = (locale: string) =>
  JSON.parse(readFileSync(join(RESOURCES, locale, 'translation.json'), 'utf8')) as Record<string, string>;

const enUs = read('en-us');
const enKeys = Object.keys(enUs);
const locales = readdirSync(RESOURCES).filter(locale => locale !== 'en-us');
const knownGaps = baseline as Record<string, string[] | undefined>;
const allowedEnglish = sameAsEnglish as Record<string, string[] | undefined>;

describe('locale parity with en-us', () => {
  it('finds the locales', () => {
    expect(locales.length).toBeGreaterThan(10);
  });

  it('registers every locale folder with the translator', () => {
    const registry = readFileSync(join(__dirname, '../translations.ts'), 'utf8');
    const missing = [...locales, 'en-us'].filter(locale => !registry.includes(`./resources/${locale}/translation.json`));
    expect(missing).toEqual([]);
  });

  describe.each(locales)('%s', locale => {
    const translations = read(locale);
    const gaps = new Set(knownGaps[locale] ?? []);

    it('has no keys that en-us lacks', () => {
      expect(Object.keys(translations).filter(key => !(key in enUs))).toEqual([]);
    });

    it('loses no translations beyond the known gaps', () => {
      expect(enKeys.filter(key => !(key in translations) && !gaps.has(key))).toEqual([]);
    });

    it('has no stale known gaps (remove keys from the baseline once translated)', () => {
      expect([...gaps].filter(key => key in translations || !(key in enUs))).toEqual([]);
    });

    // en-gb is English by definition.
    it.skipIf(locale === 'en-gb')('has no values left in English, beyond same-as-english.json', () => {
      const allowed = new Set(allowedEnglish[locale] ?? []);
      const english = Object.keys(translations).filter(
        key => translations[key] === enUs[key] && /[a-z]{2,}/i.test(enUs[key] ?? '') && !allowed.has(key)
      );
      expect(english).toEqual([]);
    });

    it('has no stale same-as-english.json entries', () => {
      expect((allowedEnglish[locale] ?? []).filter(key => translations[key] !== enUs[key])).toEqual([]);
    });

    it('has no blank translations where en-us has text', () => {
      const blank = Object.entries(translations)
        .filter(([key, value]) => value.trim() === '' && (enUs[key] ?? '').trim() !== '')
        .map(([key]) => key);
      expect(blank).toEqual([]);
    });
  });
});
