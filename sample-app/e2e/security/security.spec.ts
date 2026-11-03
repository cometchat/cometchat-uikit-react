import { test, expect, Page } from '../helpers/test';
import { loginToApp } from '../helpers';
import { selectGroupByName, waitForChatOpen } from '../helpers/navigation';
import { sendMessageToGroup } from '../helpers/pinSave';
import { createThrowawayGroup, ThrowawayGroup } from '../helpers/fixtures';
import { SECONDARY_USER } from '../helpers/seed';
import { bubbleWithText } from '../helpers/threads';

/**
 * E2E — hostile content (catalog O1–O3).
 *
 * Another user sends the payload over REST — the realistic attack path — into a
 * throwaway group, so nothing here touches the shared seed data. Every test
 * installs a tripwire: a script that runs flips `window.__xss`, and any dialog
 * fails the test. Each assertion pairs "nothing ran" with "the content is still
 * shown", so a payload that is silently dropped doesn't pass as "safe".
 */

declare global {
  interface Window {
    __xss?: number;
  }
}

const tripped = (page: Page) => page.evaluate(() => window.__xss);

async function armTripwire(page: Page): Promise<string[]> {
  const dialogs: string[] = [];
  page.on('dialog', async dialog => {
    dialogs.push(dialog.message());
    await dialog.dismiss();
  });
  return dialogs;
}

let group: ThrowawayGroup;

test.beforeEach(async () => {
  group = await createThrowawayGroup({ name: `E2E Security ${Date.now()}` });
});

test.afterEach(async () => {
  await group.dispose();
});

async function openGroup(page: Page, name: string) {
  await loginToApp(page);
  await selectGroupByName(page, name);
  await waitForChatOpen(page, name);
}

test.describe('Security — risky links', () => {
  const schemes = [
    ['javascript', 'javascript:window.__xss=1'],
    ['mixed-case javascript', 'JaVaScRiPt:window.__xss=1'],
    ['data', 'data:text/html,<script>window.__xss=1</script>'],
    ['vbscript', 'vbscript:msgbox(1)'],
    ['entity-encoded javascript', '&#106;avascript:window.__xss=1'],
    ['tab-split javascript', 'java\tscript:window.__xss=1'],
  ] as const;

  for (const [label, href] of schemes) {
    // The plain scheme is part of @smoke: an XSS regression must fail fast.
    test(`a ${label}: link renders inert and clicking it runs nothing`, label === 'javascript' ? { tag: '@smoke' } : {}, async ({ page }) => {
      const dialogs = await armTripwire(page);
      const popups: string[] = [];
      page.context().on('page', p => popups.push(p.url()));
      const linkText = `click me ${Date.now()}`;
      await sendMessageToGroup({ guid: group.guid, as: SECONDARY_USER, text: `[${linkText}](${href})` });

      await openGroup(page, group.name);
      const bubble = bubbleWithText(page, linkText);
      await expect(bubble).toBeVisible({ timeout: 15_000 });

      // No anchor in the bubble may carry the dangerous scheme.
      const hrefs = await bubble.locator('a').evaluateAll(as => as.map(a => a.getAttribute('href') ?? ''));
      for (const h of hrefs) expect(h.replace(/\s/g, '').toLowerCase()).not.toMatch(/^(javascript|data|vbscript|&#106;avascript):/);

      // Clicking the text runs nothing and does not navigate.
      const url = page.url();
      await bubble.getByText(linkText).first().click();
      expect(await tripped(page)).toBeUndefined();
      expect(dialogs).toEqual([]);
      expect(page.url()).toBe(url);
      for (const u of popups) expect(u.trim().toLowerCase()).not.toMatch(/^(javascript|data|vbscript):/);
    });
  }
});

test.describe('Security — HTML in content', () => {
  test('HTML in a message is shown as text and never executed', async ({ page }) => {
    const dialogs = await armTripwire(page);
    const marker = `html-${Date.now()}`;
    const payload = `${marker} <img src=x onerror="window.__xss=1"><script>window.__xss=1</script>`;
    await sendMessageToGroup({ guid: group.guid, as: SECONDARY_USER, text: payload });

    await openGroup(page, group.name);
    const bubble = bubbleWithText(page, marker);
    await expect(bubble).toBeVisible({ timeout: 15_000 });

    await expect(bubble.locator('img[onerror], script')).toHaveCount(0);
    expect(await tripped(page)).toBeUndefined();
    expect(dialogs).toEqual([]);
  });

  test('HTML in a group name is shown as text and never executed', async ({ page }) => {
    await group.dispose();
    const marker = `Grp${Date.now()}`;
    group = await createThrowawayGroup({ name: `${marker} <img src=x onerror="window.__xss=1">` });
    const dialogs = await armTripwire(page);

    await loginToApp(page);
    await selectGroupByName(page, marker);
    await expect(page.locator('.cometchat-messages-wrapper .cometchat-message-header__title').first()).toContainText(
      marker,
      { timeout: 15_000 }
    );

    await expect(page.locator('.cometchat-groups img[onerror], .cometchat-message-header img[onerror]')).toHaveCount(0);
    expect(await tripped(page)).toBeUndefined();
    expect(dialogs).toEqual([]);
  });
});
