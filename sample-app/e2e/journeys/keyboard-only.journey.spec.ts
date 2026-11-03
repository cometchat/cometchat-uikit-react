import { test, expect, Page } from '../helpers/test';
import { knownIssue, loginToApp, PRIMARY_USER } from '../helpers';
import { createThrowawayGroup, ThrowawayGroup } from '../helpers/fixtures';
import { sendMessageToGroup } from '../helpers/pinSave';
import { bubblesContaining, HEADER_TITLE } from './journey-helpers';

/**
 * Journey 8 — the core flow with the keyboard only.
 *
 * After login no mouse is used: Tab into the conversation list, arrow to a
 * chat, open it, Tab to the composer and send, reach the message's actions and
 * reply in a thread, then close the thread. Each step asserts where focus is.
 * (Axe checks join this journey once @axe-core/playwright is added.)
 */

let group: ThrowawayGroup;

test.beforeEach(async () => {
  group = await createThrowawayGroup({ name: `E2E Keyboard ${Date.now()}` });
  await sendMessageToGroup({ guid: group.guid, as: PRIMARY_USER, text: `Keyboard start [${Date.now()}]` });
});

test.afterEach(async () => {
  await group.dispose();
});

/**
 * Press Tab (or Shift+Tab) until the focused element matches. Fails once focus is back where it
 * started: the whole page has been cycled without reaching it. The number of stops depends on
 * the data (each chat in the list is one), so there is no fixed limit.
 * `matches` runs in the page, so it can only use its arguments: the element and `arg`.
 */
async function tabUntil(
  page: Page,
  matches: (el: Element, arg: string) => boolean,
  what: string,
  { back = false, arg = '' } = {}
) {
  const start = await page.evaluateHandle(() => document.activeElement);
  // Only a guard against a focus trap that never lets focus come back.
  for (let i = 0; i < 1000; i++) {
    await page.keyboard.press(back ? 'Shift+Tab' : 'Tab');
    if (await page.evaluate(`(${matches.toString()})(document.activeElement, ${JSON.stringify(arg)})`)) return;
    if (await start.evaluate(el => el === document.activeElement)) break;
  }
  throw new Error(`${what} was not reachable with ${back ? 'Shift+Tab' : 'Tab'}: focus went round the page without it`);
}

test('the core flow works with the keyboard alone', async ({ page }) => {
  test.setTimeout(240_000);
  const tag = Date.now();
  await loginToApp(page);
  await expect(page.locator('.cometchat-conversations__item').first()).toBeVisible({ timeout: 30_000 });
  // Park the pointer in a corner: a pointer left over a bubble (e.g. by the sign-in click) would
  // reveal its hover-only actions and hide whether the keyboard alone can reach them.
  await page.mouse.move(0, 0);
  await page.locator('body').focus();

  await test.step('Tab reaches the conversation list, arrows reach the chat, Enter opens it', async () => {
    await tabUntil(page, el => !!el.closest('.cometchat-conversations__item'), 'the conversation list');
    // The throwaway group is the most recent unpinned conversation, so it comes right after any
    // pinned chats: Home, then ArrowDown until it has focus.
    await page.keyboard.press('Home');
    await expect(page.locator('.cometchat-conversations__item').first()).toBeFocused();
    const groupRow = page.locator('.cometchat-conversations__item').filter({ hasText: group.name });
    for (let i = 0; i < 10 && !(await groupRow.evaluate(el => el === document.activeElement)); i++) {
      await page.keyboard.press('ArrowDown');
    }
    await expect(groupRow).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator(HEADER_TITLE).first()).toContainText(group.name, { timeout: 15_000 });
  });

  const text = `Sent by keyboard [${tag}]`;
  await test.step('Tab reaches the composer; typing and Enter send the message', async () => {
    await tabUntil(
      page,
      el => !!el.closest('.cometchat-messages-wrapper .cometchat-message-composer [contenteditable="true"]'),
      'the composer'
    );
    await page.keyboard.type(text);
    await page.keyboard.press('Enter');
    await expect(bubblesContaining(page, text)).toHaveCount(1, { timeout: 15_000 });
  });

  await test.step("the message's actions are reachable and open a thread", async () => {
    // The actions of the message just sent: another bubble's toolbar left rendered by a hover
    // doesn't show the keyboard can reach them.
    await knownIssue("a message's actions can't be reached with the keyboard", async () => {
      await tabUntil(
        page,
        (el, sent) =>
          /more/i.test(el.getAttribute('aria-label') ?? '') &&
          (el.closest('.cometchat-message-bubble__wrapper')?.textContent ?? '').includes(sent),
        "the sent message's More-options button",
        { back: true, arg: text }
      );
    });
    await page.keyboard.press('Enter');
    const reply = page.getByRole('menuitem', { name: /reply in thread/i });
    await expect(reply).toBeVisible({ timeout: 5_000 });
    for (let i = 0; i < 15 && !(await reply.evaluate(el => el === document.activeElement)); i++) {
      await page.keyboard.press('ArrowDown');
    }
    await expect(reply).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('.cometchat-thread-panel').first()).toBeVisible({ timeout: 10_000 });
  });

  await test.step('the thread composer takes a reply from the keyboard', async () => {
    await tabUntil(page, el => !!el.closest('.cometchat-thread-panel [contenteditable="true"]'), 'the thread composer');
    const threadReply = `Thread reply by keyboard [${tag}]`;
    await page.keyboard.type(threadReply);
    await page.keyboard.press('Enter');
    await expect(page.locator('.cometchat-thread-panel').getByText(threadReply)).toBeVisible({ timeout: 15_000 });
  });

  await test.step('Escape closes the thread', async () => {
    await page.keyboard.press('Escape');
    await expect(page.locator('.cometchat-thread-panel')).toHaveCount(0, { timeout: 5_000 });
  });
});
