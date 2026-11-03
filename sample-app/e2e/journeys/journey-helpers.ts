import { Browser, Locator, Page, expect, test } from '@playwright/test';
import { loginToApp } from '../helpers';
import { selectGroupByName, waitForChatOpen } from '../helpers/navigation';
import { expectSendAccepted } from '../helpers/send';

/**
 * Shared steps for the long-session journeys. A journey is one continuous
 * session — later steps depend on what earlier steps left behind — so these
 * helpers never reload the page unless a step says so.
 */

export const HEADER_TITLE = '.cometchat-messages-wrapper .cometchat-message-header__title';

/** A second, independent browser session (another device or another user). */
export async function newSession(browser: Browser, uid: string): Promise<Page> {
  const context = await browser.newContext({ baseURL: test.info().project.use.baseURL });
  const page = await context.newPage();
  await loginToApp(page, uid);
  return page;
}

export async function openGroupChat(page: Page, name: string): Promise<void> {
  await selectGroupByName(page, name);
  await waitForChatOpen(page, name);
}

export function composerInput(page: Page): Locator {
  return page.locator('.cometchat-messages-wrapper .cometchat-message-composer [contenteditable="true"]').first();
}

/** Type and send a message from the open chat, waiting for the server to accept it. */
export async function sendFromComposer(page: Page, text: string): Promise<void> {
  await expectSendAccepted(page, async () => {
    await composerInput(page).click();
    await composerInput(page).pressSequentially(text);
    await composerInput(page).press('Enter');
  }, { text });
}

export function conversationRow(page: Page, name: string): Locator {
  return page.locator('.cometchat-conversations__item').filter({ hasText: name });
}

export function unreadBadge(row: Locator): Locator {
  return row.locator('.cometchat-conversations__item-unread-badge');
}

export async function openChatsTab(page: Page): Promise<void> {
  await page.locator('.cometchat-tab-component__tab:has-text("Chats")').first().click();
  await expect(page.locator('.cometchat-conversations__item').first()).toBeVisible({ timeout: 30_000 });
}

/** Every main-list bubble whose text contains `text` — used to assert "exactly once". */
export function bubblesContaining(page: Page, text: string): Locator {
  return page
    .locator('.cometchat-messages-wrapper .cometchat-message-list .cometchat-message-bubble__wrapper')
    .filter({ hasText: text });
}
