import { test, expect } from '../helpers/test';
import { loginToApp, PRIMARY_USER, SECONDARY_USER } from '../helpers';
import { createThrowawayGroup, ThrowawayGroup } from '../helpers/fixtures';
import { sendMessageToGroup } from '../helpers/pinSave';
import { bubblesContaining, conversationRow, HEADER_TITLE, openChatsTab } from './journey-helpers';

/**
 * Journey 7 — a chat with a long history.
 *
 * Page all the way back to the first of 120 messages, then a new message
 * arrives while Alice is reading old history: her view must not jump, the
 * scroll-to-bottom control must offer the way back, and it must land on the
 * new message.
 */

const HISTORY = 120;
let group: ThrowawayGroup;
let tag: number;

test.beforeEach(async () => {
  tag = Date.now();
  group = await createThrowawayGroup({ name: `E2E Deep history ${tag}` });
  // Sequential, so the server order matches the numbering.
  for (let i = 1; i <= HISTORY; i++) {
    await sendMessageToGroup({ guid: group.guid, as: i % 2 ? PRIMARY_USER : SECONDARY_USER, text: `History ${String(i)} [${tag}]` });
  }
});

test.afterEach(async () => {
  await group.dispose();
});

test('paging back through a long history, then a new message arrives', async ({ page }) => {
  test.setTimeout(600_000);
  const scroller = page.locator('.cometchat-messages-wrapper .cometchat-message-list__scroll-container').first();
  const first = bubblesContaining(page, `History 1 [${tag}]`);

  await test.step('the chat opens on the latest messages', async () => {
    await loginToApp(page);
    await openChatsTab(page);
    await conversationRow(page, group.name).click();
    await expect(page.locator(HEADER_TITLE).first()).toContainText(group.name, { timeout: 15_000 });
    await expect(bubblesContaining(page, `History ${String(HISTORY)} [${tag}]`)).toHaveCount(1, { timeout: 15_000 });
    await expect(first).toHaveCount(0);
  });

  await test.step('scrolling up pages back to the very first message', async () => {
    await expect(async () => {
      await scroller.evaluate(el => {
        el.scrollTop = 0;
      });
      await expect(first).toHaveCount(1, { timeout: 3_000 });
    }).toPass({ timeout: 120_000 });

    // Every message is there exactly once, in order.
    const order = await page
      .locator('.cometchat-messages-wrapper .cometchat-message-list .cometchat-message-bubble__wrapper')
      .evaluateAll((els, t) => {
        const re = new RegExp(`History (\\d+) \\[${t}\\]`);
        return els.map(e => Number(re.exec(e.textContent ?? '')?.[1] ?? NaN)).filter(n => !Number.isNaN(n));
      }, String(tag));
    expect(order).toEqual(Array.from({ length: HISTORY }, (_, i) => i + 1));
  });

  await test.step("a new message doesn't move Alice's view while she reads old history", async () => {
    await first.scrollIntoViewIfNeeded();
    const before = (await first.boundingBox())?.y;
    const fresh = `Arrived while reading [${tag}]`;
    await sendMessageToGroup({ guid: group.guid, as: SECONDARY_USER, text: fresh });

    await expect(bubblesContaining(page, fresh)).toHaveCount(1, { timeout: 15_000 });
    const after = (await first.boundingBox())?.y;
    // A real jump moves the view by a screen; allow sub-line settling (date
    // separators, the scroll-to-bottom control appearing).
    expect(Math.abs((after ?? 0) - (before ?? 0))).toBeLessThan(24);

    const toBottom = page.locator('.cometchat-message-list__scroll-to-bottom').first();
    await expect(toBottom).toBeVisible({ timeout: 10_000 });
    await toBottom.click();
    await expect(bubblesContaining(page, fresh)).toBeInViewport({ timeout: 10_000 });
    await expect(toBottom).toBeHidden({ timeout: 10_000 });
  });
});
