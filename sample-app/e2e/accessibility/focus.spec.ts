import { test, expect, Page, Locator } from '../helpers/test';
import { knownIssue, loginToApp, openStrategyChat } from '../helpers';

/**
 * E2E — focus management for dialogs and popovers (catalog Q3).
 *
 * Opened from the keyboard, a dialog or popover should take focus, keep Tab inside it while it
 * is open, close on Escape, and hand focus back to the control that opened it — otherwise a
 * keyboard or screen-reader user is left on the page body and loses their place.
 */

async function focusIsInside(container: Locator): Promise<boolean> {
  return container.evaluate(el => el.contains(document.activeElement));
}

/** Whether focus is (or moves) inside the container within `timeout`. */
async function focusMovesInto(container: Locator, timeout = 3_000): Promise<boolean> {
  return expect
    .poll(() => focusIsInside(container), { timeout })
    .toBe(true)
    .then(
      () => true,
      () => false
    );
}

/** Tab (and Shift+Tab) round the container a few times; focus must never leave it. */
async function focusStaysInside(page: Page, container: Locator, presses = 12): Promise<boolean> {
  for (const key of ['Tab', 'Shift+Tab']) {
    for (let i = 0; i < presses; i++) {
      await page.keyboard.press(key);
      if (!(await focusIsInside(container))) return false;
    }
  }
  return true;
}

test.beforeEach(async ({ page }) => {
  await loginToApp(page);
  // A pointer left over the page could open hover-only UI; this is a keyboard test.
  await page.mouse.move(0, 0);
});

test('the create-group dialog takes focus, traps Tab, closes on Escape and returns focus', async ({ page }) => {
  await page.locator('.cometchat-tab-component__tab:has-text("Groups")').first().click();
  const trigger = page.locator('.cometchat-groups__header-create-group-button').first();
  await expect(trigger).toBeVisible({ timeout: 15_000 });

  await trigger.focus();
  await page.keyboard.press('Enter');
  const dialog = page.locator('.cometchat-create-group').first();
  await expect(dialog).toBeVisible({ timeout: 5_000 });

  await knownIssue("the create-group dialog doesn't take focus, keep Tab inside or close on Escape", async () => {
    expect(await focusMovesInto(dialog), 'focus moves into the dialog').toBe(true);
    expect(await focusStaysInside(page, dialog), 'Tab stays inside the dialog').toBe(true);
    await page.keyboard.press('Escape');
    await expect(dialog, 'Escape closes the dialog').toBeHidden({ timeout: 5_000 });
  });
  await expect(trigger, 'focus returns to the button that opened the dialog').toBeFocused();
});

async function openEmojiKeyboardFromKeyboard(page: Page) {
  await openStrategyChat(page);
  const trigger = page.locator('.cometchat-messages-wrapper .cometchat-message-composer__emoji-button').first();
  await expect(trigger).toBeVisible({ timeout: 15_000 });
  await trigger.focus();
  await page.keyboard.press('Enter');
  const picker = page.locator('.cometchat-emoji-keyboard').first();
  await expect(picker).toBeVisible({ timeout: 5_000 });
  return { trigger, picker };
}

test('the emoji keyboard closes on Escape and returns focus to its button', async ({ page }) => {
  const { trigger, picker } = await openEmojiKeyboardFromKeyboard(page);
  await page.keyboard.press('Escape');
  await expect(picker, 'Escape closes the emoji keyboard').toBeHidden({ timeout: 5_000 });
  await expect(trigger, 'focus returns to the emoji button').toBeFocused();
});

test('the emoji keyboard takes focus when opened from the keyboard', async ({ page }) => {
  const { picker } = await openEmojiKeyboardFromKeyboard(page);
  await knownIssue("the composer's popovers don't move focus in when opened", async () => {
    expect(await focusMovesInto(picker), 'focus moves into the emoji keyboard').toBe(true);
  });
});
