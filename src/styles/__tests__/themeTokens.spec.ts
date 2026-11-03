/**
 * The theme contract, read from the stylesheets themselves.
 *
 * The theme (`src/styles/themes/light.css`, `dark.css`) defines the global tokens:
 * colours, fonts, spacing, radii. Component stylesheets use them through `var()`, and may also
 * offer their own hooks, named after the component's CSS block (`--cometchat-poll-bubble-gap`),
 * which an app can set but the kit doesn't define.
 *
 * - A token used without a fallback must be defined, or the declaration is invalid.
 * - A token outside every component's own namespace must be one the theme defines; otherwise it
 *   is a typo or an old name, its fallback always applies, and a theme change never reaches it.
 *   Old names that apps may already set are kept as an outer override, chained to the theme
 *   token: `var(--cometchat-border-radius-2, var(--cometchat-radius-2, 8px))`.
 * - Every colour the light theme defines has a dark value.
 * - Hard-coded colours (hex, rgb(), hsl() outside a var() fallback) can't be themed. Their count
 *   per stylesheet may only go down.
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import baseline from './hardcoded-colours.baseline.json';

const SRC = join(__dirname, '../..');
const THEMES = join(SRC, 'styles/themes');

// Old, global-looking names the theme doesn't define. Each is kept so an app that sets it still
// can. With token(s) given, every use must chain to one of them:
//   var(--cometchat-border-radius-2, var(--cometchat-radius-2, 8px))
// `null`: a fixed value off the theme scale (or uses with different values), kept as it is.
const LEGACY = new Map<string, string[] | null>([
  ['--cometchat-border-radius-1', ['--cometchat-radius-1']],
  ['--cometchat-border-radius-2', ['--cometchat-radius-2']],
  ['--cometchat-border-radius-3', ['--cometchat-radius-2']],
  ['--cometchat-border-radius-max', ['--cometchat-radius-max']],
  ['--cometchat-font-size-sm', ['--cometchat-font-size-body']],
  ['--cometchat-icon-color-disabled', ['--cometchat-icon-color-tertiary']],
  ['--cometchat-primary-button-background-color', ['--cometchat-primary-button-background']],
  ['--cometchat-primary-button-background-color-hover', ['--cometchat-extended-primary-color-900']],
  ['--cometchat-primary-button-text-color', ['--cometchat-primary-button-text']],
  ['--cometchat-shadow-2', ['--cometchat-elevation-1']],
  ['--cometchat-shadow-high', ['--cometchat-elevation-2', '--cometchat-elevation-3', '--cometchat-elevation-4']],
  ['--cometchat-spacing-half', ['--cometchat-spacing']],
  ['--cometchat-font-size-xs', ['--cometchat-font-size-caption1']],
  ['--cometchat-font-caption1-semibold', null],
  ['--cometchat-font-weight-semibold', null],
  ['--cometchat-primary-color-light', ['--cometchat-extended-primary-color-100']],
  ['--cometchat-radius-0', null],
]);

function files(dir: string, pattern: RegExp): string[] {
  return readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === '__tests__' ? [] : files(path, pattern);
    return pattern.test(name) && !/\.(spec|test|stories)\./.test(name) ? [path] : [];
  });
}

const withoutComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const stylesheets = files(SRC, /\.css$/).map(path => ({
  path,
  name: relative(SRC, path),
  css: withoutComments(readFileSync(path, 'utf8')),
}));
const code = files(SRC, /\.tsx?$/).map(path => readFileSync(path, 'utf8'));
const isTheme = (path: string) => path.startsWith(THEMES);

const defined = new Set<string>();
const used = new Set<string>();
const usedWithoutFallback = new Map<string, string[]>();
for (const { name, css } of stylesheets) {
  for (const [, token = ''] of css.matchAll(/(--cometchat-[\w-]+)\s*:/g)) defined.add(token);
  for (const [, token = '', fallback] of css.matchAll(/var\(\s*(--cometchat-[\w-]+)\s*(,)?/g)) {
    used.add(token);
    if (!fallback) usedWithoutFallback.set(token, [...(usedWithoutFallback.get(token) ?? []), name]);
  }
}
for (const source of code) {
  for (const [, quoted, inVar] of source.matchAll(/['"`](--cometchat-[\w-]+)['"`]|var\(\s*(--cometchat-[\w-]+)/g)) {
    used.add(quoted ?? inVar ?? '');
  }
}

// Component blocks, from the BEM classes the stylesheets style (.cometchat-poll-bubble__…).
const blocks = new Set<string>();
for (const { css } of stylesheets) {
  for (const [, block = ''] of css.matchAll(/\.cometchat-([a-z0-9]+(?:-[a-z0-9]+)*)/g)) blocks.add(block);
}
const isComponentHook = (token: string) => {
  const name = token.replace(/^--cometchat-/, '');
  return [...blocks].some(block => name.startsWith(`${block}-`));
};

function themeTokens(file: string): Set<string> {
  const css = withoutComments(readFileSync(join(THEMES, file), 'utf8'));
  return new Set([...css.matchAll(/(--cometchat-[\w-]+)\s*:/g)].map(([, token = '']) => token));
}
const light = themeTokens('light.css');
const dark = themeTokens('dark.css');

function hardcodedColours(css: string): number {
  // A colour inside a var() fallback is a default, not a hard-coded value.
  let rest = css;
  for (let previous = ''; previous !== rest; ) {
    previous = rest;
    rest = rest.replace(/var\([^()]*(?:\([^()]*\)[^()]*)*\)/g, '');
  }
  return (rest.match(/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/g) ?? []).length;
}

describe('theme tokens', () => {
  it('finds the stylesheets and the theme (sanity check)', () => {
    expect(stylesheets.length).toBeGreaterThan(50);
    expect(light.size).toBeGreaterThan(100);
  });

  it('every token used without a fallback is defined', () => {
    const missing = [...usedWithoutFallback]
      .filter(([token]) => !defined.has(token))
      .map(([token, where]) => `${token} (${where.join(', ')})`);
    expect(missing).toEqual([]);
  });

  it("every token outside a component's own namespace is one the theme defines", () => {
    const drift = [...used].filter(t => !defined.has(t) && !isComponentHook(t) && !LEGACY.has(t));
    expect(drift.sort()).toEqual([]);
  });

  it('every use of an old name chains to its theme token', () => {
    const unchained: string[] = [];
    for (const [legacy, targets] of LEGACY) {
      if (!targets) continue;
      const name = legacy.replace(/^--/, '');
      for (const { name: file, css } of stylesheets) {
        for (const [use] of css.matchAll(new RegExp(`var\\(\\s*--${name}(?![\\w-])[^)]*`, 'g'))) {
          const chained = targets.some(t => new RegExp(`,\\s*var\\(\\s*${t}(?![\\w-])`).test(use));
          if (!chained) unchained.push(`${file}: ${use})`);
        }
      }
    }
    expect(unchained).toEqual([]);
  });

  it('the legacy list only names old names still in use, chained to defined tokens', () => {
    const stale = [...LEGACY].filter(
      ([legacy, targets]) => defined.has(legacy) || !used.has(legacy) || (targets ?? []).some(t => !defined.has(t))
    );
    expect(stale.map(([legacy]) => legacy)).toEqual([]);
  });

  it('every colour in the light theme has a dark value', () => {
    const colours = [...light].filter(t => /color|background|border|shadow/.test(t));
    expect(colours.filter(t => !dark.has(t))).toEqual([]);
  });

  it("hard-coded colours per stylesheet don't grow, and the baseline follows when they shrink", () => {
    const counts = Object.fromEntries(
      stylesheets
        .filter(({ path }) => !isTheme(path))
        .map(({ name, css }) => [name, hardcodedColours(css)] as const)
        .filter(([, n]) => n > 0)
        .sort(([a], [b]) => a.localeCompare(b))
    );
    expect(counts).toEqual(baseline);
  });
});
