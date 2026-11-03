import { test, expect, Page } from '../helpers/test';
import { loginToApp } from '../helpers';
import { openStrategyChat } from '../helpers/navigation';
import { HEADER_TITLE } from './journey-helpers';

/**
 * Journey 9 — the system theme changes mid-session.
 *
 * The sample app follows `prefers-color-scheme` live. Switching it while a chat
 * and a details panel are open must re-theme every surface — none may stay in
 * the old theme — and a panel opened afterwards must use the new theme.
 *
 * (Replaces the planned "language switch" journey: the sample app has no way to
 * change language at runtime.)
 */

const SURFACES = {
  'groups list': '.cometchat-groups',
  'message header': '.cometchat-messages-wrapper .cometchat-message-header',
  'message list': '.cometchat-messages-wrapper .cometchat-message-list',
  composer: '.cometchat-messages-wrapper .cometchat-message-composer',
};

/** Relative luminance (0 black – 1 white) of the first non-transparent background up the tree. */
async function luminance(page: Page, selector: string): Promise<number> {
  const target = page.locator(selector).first();
  if ((await target.count()) === 0) throw new Error(`surface not on screen: ${selector}`);
  return target.evaluate(el => {
    let node: Element | null = el;
    while (node) {
      const bg = getComputedStyle(node).backgroundColor;
      const m = bg.match(/rgba?\(([\d.]+), ([\d.]+), ([\d.]+)(?:, ([\d.]+))?\)/);
      if (m && (m[4] === undefined || Number(m[4]) > 0.5)) {
        const [r, g, b] = [m[1], m[2], m[3]].map(v => {
          const c = Number(v) / 255;
          return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      }
      node = node.parentElement;
    }
    return 1;
  });
}

async function expectAllSurfaces(page: Page, theme: 'light' | 'dark') {
  for (const [name, selector] of Object.entries(SURFACES)) {
    await expect
      .poll(() => luminance(page, selector), { message: `${name} should be ${theme}`, timeout: 10_000 })
      [theme === 'dark' ? 'toBeLessThan' : 'toBeGreaterThan'](0.4);
  }
}

test('every surface follows a theme change made mid-session', async ({ page }) => {
  test.setTimeout(180_000);

  await test.step('light theme with a chat and its details open', async () => {
    await page.emulateMedia({ colorScheme: 'light' });
    await loginToApp(page);
    await openStrategyChat(page);
    await page.locator(HEADER_TITLE).first().click();
    await expect(page.locator('.side-component-wrapper').first()).toBeVisible({ timeout: 10_000 });
    await expectAllSurfaces(page, 'light');
  });

  await test.step('switching the system to dark re-themes everything already on screen', async () => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await expectAllSurfaces(page, 'dark');
    await expect
      .poll(() => luminance(page, '.side-component-wrapper'), { message: 'details panel should be dark' })
      .toBeLessThan(0.4);
  });

  await test.step('a panel opened after the switch is dark too', async () => {
    await page.keyboard.press('Escape');
    await page.locator('.cometchat-tab-component__tab:has-text("Users")').first().click();
    await expect
      .poll(() => luminance(page, '.cometchat-users'), { message: 'users list should be dark' })
      .toBeLessThan(0.4);
  });

  await test.step('and back to light', async () => {
    await page.emulateMedia({ colorScheme: 'light' });
    await expect
      .poll(() => luminance(page, '.cometchat-users'), { message: 'users list should be light again' })
      .toBeGreaterThan(0.4);
  });
});
