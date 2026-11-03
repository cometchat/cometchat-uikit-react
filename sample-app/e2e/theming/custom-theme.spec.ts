import { test, expect } from '../helpers/test';
import { loginToApp, openStrategyChat } from '../helpers';

/**
 * E2E — an app's own theme variables (catalog R2).
 *
 * The documented way to theme the kit is to set its variables on the `.cometchat` wrapper in
 * the app's own stylesheet. The kit declares its theme in a CSS cascade layer, so the app's
 * rule wins without `!important`. Overriding the primary colour, the font and the base
 * background must reach the groups list, an outgoing message and the composer.
 *
 * (`:root` is not enough: the wrapper redeclares every variable for its `data-theme`.)
 */

const BRAND = 'rgb(12, 120, 60)';
const SURFACE = 'rgb(250, 245, 230)';
const FONT = '"Courier New", monospace';

test('the primary colour, font and background follow variables set on .cometchat', async ({ page }) => {
  await loginToApp(page);
  await openStrategyChat(page);

  const outgoingText = page
    .locator('.cometchat-messages-wrapper .cometchat-message-bubble-outgoing .cometchat-message-bubble__text-message')
    .last();
  const outgoingTextBody = outgoingText.locator('.cometchat-text-bubble').first();
  const groupsList = page.locator('.cometchat-groups').first();
  const composerInput = page.locator('.cometchat-messages-wrapper [contenteditable="true"]').first();
  await expect(outgoingText).toBeVisible({ timeout: 15_000 });

  // The defaults first, so the checks below can't pass by coincidence.
  await expect(outgoingText).not.toHaveCSS('background-color', BRAND);
  await expect(groupsList).not.toHaveCSS('background-color', SURFACE);

  await page.addStyleTag({
    content: `.cometchat {
      --cometchat-primary-color: ${BRAND};
      --cometchat-background-color-01: ${SURFACE};
      --cometchat-font-family: ${FONT};
    }`,
  });

  await expect(outgoingText).toHaveCSS('background-color', BRAND);
  await expect(groupsList).toHaveCSS('background-color', SURFACE);
  await expect(composerInput).toHaveCSS('font-family', FONT);
  await expect(outgoingTextBody).toHaveCSS('font-family', FONT);
});
