/**
 * Every literal key passed to getLocalizedString('…') in the source must exist in
 * the en-us translations (the fallback language). A missing key is returned as-is,
 * so the raw key reaches the UI, and `getLocalizedString('X') || 'Default'`
 * fallbacks never apply because the key itself is truthy.
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import enUs from '../resources/en-us/translation.json';

const SRC = join(__dirname, '../../..');
const KEY_CALL = /getLocalizedString\(\s*'([A-Za-z0-9_]+)'\s*\)/g;

// Keys used in the source but defined in no language (users and screen readers would get the
// raw key). Keep this empty: add a new key to en-us and the other locales instead.
const KNOWN_MISSING: string[] = [];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === '__tests__' ? [] : sourceFiles(path);
    return /\.tsx?$/.test(name) && !/\.(spec|test|stories)\.tsx?$/.test(name) ? [path] : [];
  });
}

function usedKeys(): Map<string, string> {
  const keys = new Map<string, string>();
  for (const file of sourceFiles(SRC)) {
    for (const [, key = ''] of readFileSync(file, 'utf8').matchAll(KEY_CALL)) {
      if (!keys.has(key)) keys.set(key, relative(SRC, file));
    }
  }
  return keys;
}

describe('translation keys', () => {
  const translations = enUs as Record<string, string>;
  const keys = usedKeys();

  it('finds the keys used in the source', () => {
    expect(keys.size).toBeGreaterThan(100);
  });

  it('every key used in the source exists in en-us', () => {
    const missing = [...keys]
      .filter(([key]) => !(key in translations) && !KNOWN_MISSING.includes(key))
      .map(([key, file]) => `${key} (${file})`);
    expect(missing).toEqual([]);
  });

  it('the known-missing list has no stale entries', () => {
    const stale = KNOWN_MISSING.filter(key => key in translations || !keys.has(key));
    expect(stale).toEqual([]);
  });
});
