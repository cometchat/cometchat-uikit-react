import { test, expect, Page, Locator } from '../helpers/test';
import { loginToApp, PRIMARY_USER, SECONDARY_USER } from '../helpers';
import { createThrowawayGroup, ThrowawayGroup } from '../helpers/fixtures';
import { openAIAgentChat, selectGroupByName, waitForChatOpen } from '../helpers/navigation';
import { sendMessageToGroup } from '../helpers/pinSave';

/**
 * E2E — theme tokens take effect (style-token coverage).
 *
 * For each token: by default the element renders its usual value, and an app that sets the token
 * on `.cometchat` (the documented place) changes the computed style. jsdom doesn't resolve CSS
 * variables, so this is where a token's effect is checked.
 */

const RED_RING = '0 0 0 7px rgb(255, 0, 0)';
const RED_RING_COMPUTED = 'rgb(255, 0, 0) 0px 0px 0px 7px';

async function setToken(page: Page, token: string, value: string) {
  await page.addStyleTag({ content: `.cometchat { ${token}: ${value}; }` });
}

async function expectStyle(element: Locator, property: string, value: string) {
  await expect(element).toBeVisible({ timeout: 15_000 });
  await expect.poll(() => element.evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), property)).toBe(value);
}

test.describe('shadows', () => {
  let group: ThrowawayGroup;
  let text: string;

  test.beforeEach(async ({ page }) => {
    group = await createThrowawayGroup({ name: `E2E Tokens ${String(Date.now())}`, owner: PRIMARY_USER, members: [SECONDARY_USER] });
    text = `Token check [${String(Date.now())}]`;
    await sendMessageToGroup({ guid: group.guid, as: PRIMARY_USER, text });
    await loginToApp(page);
    await selectGroupByName(page, group.name);
    await waitForChatOpen(page, group.name, { expectMessages: true });
  });

  test.afterEach(async () => {
    await group.dispose();
  });

  const bubble = (page: Page) =>
    page.locator('.cometchat-messages-wrapper .cometchat-message-bubble__wrapper').filter({ hasText: text }).last();

  async function hoverBubble(page: Page) {
    const body = bubble(page).locator('.cometchat-message-bubble__body').first();
    await expect(body).toBeVisible({ timeout: 15_000 });
    await body.hover();
  }

  test('the toast follows --cometchat-elevation-1', async ({ page }) => {
    const toast = page.locator('.cometchat-toast').first();
    const copy = async () => {
      await hoverBubble(page);
      await bubble(page).getByRole('button', { name: /more/i }).first().click();
      await page.getByRole('menuitem', { name: /^Copy/ }).first().click();
    };

    await copy();
    await expectStyle(toast, 'box-shadow', 'rgba(0, 0, 0, 0.15) 0px 2px 8px 0px');
    await expect(toast).toBeHidden({ timeout: 10_000 });

    await setToken(page, '--cometchat-elevation-1', RED_RING);
    await copy();
    await expectStyle(toast, 'box-shadow', RED_RING_COMPUTED);
  });

  test('the mentions list follows --cometchat-elevation-2', async ({ page }) => {
    const input = page.locator('.cometchat-messages-wrapper [contenteditable="true"]').first();
    const list = page.locator('.cometchat-message-composer__mentions-list').first();
    await input.click();
    await page.keyboard.type('@');
    await expectStyle(list, 'box-shadow', 'rgba(0, 0, 0, 0.12) 0px 4px 16px 0px');

    await setToken(page, '--cometchat-elevation-2', RED_RING);
    await expectStyle(list, 'box-shadow', RED_RING_COMPUTED);
  });

  test("the reaction picker follows --cometchat-elevation-3", async ({ page }) => {
    const overlay = page.locator('.cometchat-message-list__emoji-picker-overlay').first();
    await hoverBubble(page);
    await bubble(page).getByRole('button', { name: 'React' }).first().click();
    await expectStyle(overlay, 'box-shadow', 'rgba(0, 0, 0, 0.1) 0px 8px 32px 0px');

    await setToken(page, '--cometchat-elevation-3', RED_RING);
    await expectStyle(overlay, 'box-shadow', RED_RING_COMPUTED);
  });

  test('the create-poll dialog follows --cometchat-elevation-4', async ({ page }) => {
    const dialog = page.locator('.cometchat-create-poll').first();
    await page.locator('.cometchat-messages-wrapper .cometchat-message-composer__attachment-button').first().click();
    await page
      .locator('.cometchat-message-composer__attachment-option')
      .filter({ has: page.locator('.cometchat-message-composer__attachment-option-title', { hasText: 'Poll' }) })
      .first()
      .click();
    await expectStyle(dialog, 'box-shadow', 'rgba(0, 0, 0, 0.16) 0px 8px 32px 0px');

    await setToken(page, '--cometchat-elevation-4', RED_RING);
    await expectStyle(dialog, 'box-shadow', RED_RING_COMPUTED);
  });
});

test('an AI agent reply follows --cometchat-font-size-body', async ({ page }) => {
  test.setTimeout(180_000);
  await loginToApp(page);
  test.skip(!(await openAIAgentChat(page)), 'This app has no AI agent conversation.');

  // Each visit starts a new chat: ask something and wait for the agent's reply.
  const chat = page.locator('.cometchat-ai-assistant-chat').first();
  await chat.locator('.cometchat-ai-assistant-chat__message-composer-view [contenteditable="true"]').first().click();
  await page.keyboard.type(`Say hello [${String(Date.now())}]`);
  await chat.locator('.cometchat-ai-assistant-chat__send-button-view').first().click();
  const reply = chat
    .locator('.cometchat-message-bubble-incoming')
    .locator('.cometchat-ai-assistant-bubble__content, .cometchat-stream-message-bubble__content')
    .last();
  await expect(reply).toBeVisible({ timeout: 120_000 });
  await expectStyle(reply, 'font-size', '14px');

  await setToken(page, '--cometchat-font-size-body', '19px');
  await expectStyle(reply, 'font-size', '19px');
});
