import { test, expect, Page } from '../helpers/test';
import { knownIssue, loginToApp, PRIMARY_USER, SECONDARY_USER } from '../helpers';
import { createThrowawayGroup, ThrowawayGroup } from '../helpers/fixtures';
import { addReaction, sendMessageToGroup } from '../helpers/pinSave';
import { bubblesContaining, conversationRow, HEADER_TITLE, openChatsTab } from './journey-helpers';

/**
 * Journey 10 — a new version is deployed while the tab is open.
 *
 * After a deploy, the old hashed chunk files no longer exist. A long-lived tab
 * that hasn't loaded a feature's chunk yet will fail to fetch it. The app must
 * degrade gracefully — the feature may be unavailable, but the app must never
 * unmount to a blank page.
 */

let group: ThrowawayGroup;

test.beforeEach(async () => {
  group = await createThrowawayGroup({ name: `E2E Deploy ${Date.now()}` });
  await sendMessageToGroup({ guid: group.guid, as: PRIMARY_USER, text: `Deploy start [${Date.now()}]` });
});

test.afterEach(async () => {
  await group.dispose();
});

async function expectAppAlive(page: Page, after: string) {
  await expect(page.locator('#root > *'), `the app unmounted after: ${after}`).not.toHaveCount(0);
  await expect(page.locator('.cometchat-conversations').first(), `the app unmounted after: ${after}`).toBeVisible();
}

/** Wait for a message to render, reporting "app unmounted" instead of a bare count. */
async function expectRendered(page: Page, text: string) {
  await expect
    .poll(
      async () => {
        if ((await page.locator('#root > *').count()) === 0) return 'app unmounted (blank page)';
        return (await bubblesContaining(page, text).count()) === 1 ? 'rendered' : 'not yet rendered';
      },
      { timeout: 15_000 }
    )
    .toBe('rendered');
}

test('the app survives chunks disappearing mid-session', async ({ page }) => {
  test.setTimeout(240_000);
  const tag = Date.now();

  await loginToApp(page);
  await openChatsTab(page);
  await conversationRow(page, group.name).click();
  await expect(page.locator(HEADER_TITLE).first()).toContainText(group.name, { timeout: 15_000 });

  await test.step('the deploy: every chunk not yet loaded is now gone', async () => {
    await page.route(/\/assets\/.+\.(js|css)$/, route => route.fulfill({ status: 404, body: 'Not found' }));
  });

  // Any step can hit it: a chunk the app hasn't loaded yet fails to load and the whole app unmounts.
  await knownIssue(
    'when a lazily loaded chunk fails to load, the whole app unmounts to a blank page',
    async () => {
      await test.step('a message with a reaction arrives (reactions chunk)', async () => {
        const text = `Reacted after deploy [${tag}]`;
        const id = await sendMessageToGroup({ guid: group.guid, as: SECONDARY_USER, text });
        await addReaction(id, '👍', SECONDARY_USER);
        await expectRendered(page, text);
        await expectAppAlive(page, 'a reacted message rendered');
      });

      await test.step('opening the emoji keyboard (emoji chunk)', async () => {
        await expectAppAlive(page, 'the previous step');
        await page.locator('.cometchat-messages-wrapper .cometchat-message-composer__emoji-button').first().click();
        await expectAppAlive(page, 'opening the emoji keyboard');
        await page.keyboard.press('Escape');
      });

      await test.step('opening the stickers keyboard (stickers chunk)', async () => {
        await expectAppAlive(page, 'the previous step');
        await page.locator('.cometchat-message-composer__sticker-button').first().click();
        await expectAppAlive(page, 'opening the stickers keyboard');
        await page.keyboard.press('Escape');
      });

      await test.step('messages keep arriving and rendering', async () => {
        await expectAppAlive(page, 'the previous step');
        const text = `Plain after deploy [${tag}]`;
        await sendMessageToGroup({ guid: group.guid, as: SECONDARY_USER, text });
        await expectRendered(page, text);
        await expectAppAlive(page, 'more messages rendered');
      });
    },
    { intermittent: true }
  );
});
