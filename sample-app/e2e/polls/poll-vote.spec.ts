import { test, expect, Page, Locator } from '../helpers/test';
import { loginToApp, PRIMARY_USER, SECONDARY_USER } from '../helpers';
import { createThrowawayGroup, ThrowawayGroup } from '../helpers/fixtures';
import { selectGroupByName, waitForChatOpen } from '../helpers/navigation';
import { createPoll } from '../helpers/threads';

/**
 * E2E — voting in a poll (catalog D8).
 *
 * A throwaway group (Alice and Bob) so the counts start from zero. Alice creates a poll and
 * votes, the vote survives a reload, changing it moves it to the other option, and Bob's vote
 * reaches Alice live. The options are radio buttons, so their state is read from aria-checked
 * and their accessible name ("Option A, 1 votes, 50%").
 */

let group: ThrowawayGroup;

test.beforeEach(async () => {
  group = await createThrowawayGroup({ name: `E2E Poll ${Date.now()}`, owner: PRIMARY_USER, members: [SECONDARY_USER] });
});

test.afterEach(async () => {
  await group.dispose();
});

async function openGroup(page: Page) {
  await selectGroupByName(page, group.name);
  await waitForChatOpen(page, group.name);
}

function pollBubble(page: Page, question: string): Locator {
  return page.locator('.cometchat-messages-wrapper .cometchat-poll-bubble').filter({ hasText: question }).last();
}

function option(bubble: Locator, text: string): Locator {
  return bubble.getByRole('radio', { name: new RegExp(`^${text},`) });
}

test('a vote is recorded, kept after a reload, and moves when changed', async ({ page }) => {
  await loginToApp(page);
  await openGroup(page);
  const question = await createPoll(page, 'Vote poll');
  const bubble = pollBubble(page, question);
  await expect(bubble).toBeVisible({ timeout: 15_000 });

  await test.step('voting checks the option and counts the vote', async () => {
    // The option checks immediately (optimistic); wait for the vote itself to be saved.
    const voted = page.waitForResponse(r => r.url().includes('/v2/vote') && r.request().method() === 'POST');
    await option(bubble, 'Option A').click();
    expect((await voted).ok(), 'the vote request succeeds').toBe(true);
    await expect(option(bubble, 'Option A')).toHaveAttribute('aria-checked', 'true', { timeout: 10_000 });
    await expect(option(bubble, 'Option A')).toHaveAccessibleName(/^Option A, 1 /);
    await expect(option(bubble, 'Option B')).toHaveAttribute('aria-checked', 'false');
  });

  await test.step('the vote is saved on the server', async () => {
    await page.reload();
    await openGroup(page);
    await expect(option(pollBubble(page, question), 'Option A')).toHaveAttribute('aria-checked', 'true', {
      timeout: 15_000,
    });
  });

  await test.step('changing the vote moves it', async () => {
    const reloaded = pollBubble(page, question);
    await option(reloaded, 'Option B').click();
    await expect(option(reloaded, 'Option B')).toHaveAttribute('aria-checked', 'true', { timeout: 10_000 });
    await expect(option(reloaded, 'Option B')).toHaveAccessibleName(/^Option B, 1 /);
    await expect(option(reloaded, 'Option A')).toHaveAttribute('aria-checked', 'false');
    await expect(option(reloaded, 'Option A')).toHaveAccessibleName(/^Option A, 0 /);
  });
});

test("another member's vote reaches the poll live", async ({ page, browser }) => {
  await loginToApp(page);
  await openGroup(page);
  const question = await createPoll(page, 'Live poll');
  await expect(pollBubble(page, question)).toBeVisible({ timeout: 15_000 });

  const bobContext = await browser.newContext();
  try {
    const bob = await bobContext.newPage();
    await loginToApp(bob, SECONDARY_USER);
    await openGroup(bob);
    const bobsBubble = pollBubble(bob, question);
    await expect(bobsBubble).toBeVisible({ timeout: 15_000 });
    await option(bobsBubble, 'Option B').click();
    await expect(option(bobsBubble, 'Option B')).toHaveAttribute('aria-checked', 'true', { timeout: 10_000 });

    // Alice didn't vote, but sees Bob's.
    await expect(option(pollBubble(page, question), 'Option B')).toHaveAccessibleName(/^Option B, 1 /, {
      timeout: 15_000,
    });
    await expect(option(pollBubble(page, question), 'Option B')).toHaveAttribute('aria-checked', 'false');
  } finally {
    await bobContext.close();
  }
});
