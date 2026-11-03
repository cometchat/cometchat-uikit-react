import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import AxeBuilder from '@axe-core/playwright';
import { Page, expect, test } from '@playwright/test';

/**
 * Accessibility scans with a baseline.
 *
 * Each screen is scanned against WCAG 2.0/2.1 A and AA. Rules already failing
 * on a screen are listed in `accessibility/axe-baseline.json`, so a scan fails
 * only on a NEW kind of violation; fixing one means removing it from the
 * baseline. Run with UPDATE_AXE_BASELINE=1 to rewrite the baseline from what the
 * app does today (review the diff before committing it).
 */

const BASELINE_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../accessibility/axe-baseline.json');
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

type Baseline = Record<string, string[]>;

function readBaseline(): Baseline {
  return existsSync(BASELINE_PATH) ? (JSON.parse(readFileSync(BASELINE_PATH, 'utf8')) as Baseline) : {};
}

export async function expectNoNewA11yViolations(page: Page, screen: string, include?: string): Promise<void> {
  let builder = new AxeBuilder({ page }).withTags(TAGS);
  if (include) builder = builder.include(include);
  const { violations } = await builder.analyze();
  const found = [...new Set(violations.map(v => v.id))].sort();

  test.info().annotations.push({
    type: `axe: ${screen}`,
    description: found.length ? found.join(', ') : 'no violations',
  });

  if (process.env.UPDATE_AXE_BASELINE) {
    const baseline = readBaseline();
    baseline[screen] = found;
    writeFileSync(BASELINE_PATH, `${JSON.stringify(baseline, Object.keys(baseline).sort(), 2)}\n`);
    return;
  }

  const allowed = new Set(readBaseline()[screen] ?? []);
  const fresh = violations.filter(v => !allowed.has(v.id));
  const detail = fresh.map(v => `${v.id} (${v.impact ?? 'n/a'}): ${v.help} — ${v.nodes.length} node(s), e.g. ${v.nodes[0]?.target.join(' ')}`);
  expect(detail, `new accessibility violations on "${screen}"`).toEqual([]);
}
