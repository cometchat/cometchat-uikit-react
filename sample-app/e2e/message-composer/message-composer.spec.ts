import { test, expect, Page } from '../helpers/test';
import { loginToApp, openStrategyChat, expectSendAccepted } from '../helpers';
import { visibleWithin } from '../helpers/wait';
import { stageAndSendAttachment } from '../helpers/attachments';

/**
 * E2E Tests — CometChatMessageComposer (React)
 *
 * Tests the message composer component. Requires opening a conversation first.
 */

test.describe('CometChatMessageComposer', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await loginToApp(page);
    await page.waitForSelector('.cometchat-conversations__item', { timeout: 30_000 });
    await openStrategyChat(page);
  });

  // ==================== Rendering ====================

  // ==================== Text Input ====================

  test('send button sends the message', { tag: '@smoke' }, async () => {
    const composer = page.locator('.cometchat-message-composer').first();
    const input = composer.locator('[contenteditable="true"]').first();
    await input.click();

    const testMessage = `E2E test ${Date.now()}`;
    await page.keyboard.type(testMessage);

    const sendBtn = composer.locator('[class*="send-button"], [class*="send"], button[aria-label*="Send" i]').first();
    await expectSendAccepted(page, () => sendBtn.click());

    // Wait for the message to appear in the list (polls until visible or timeout)
    await expect(
      page.locator('.cometchat-message-list').getByText(testMessage)
    ).toBeVisible({ timeout: 15_000 });
  });

  test('Enter key sends the message', async () => {
    const composer = page.locator('.cometchat-message-composer').first();
    const input = composer.locator('[contenteditable="true"]').first();
    await input.click();

    const testMessage = `Enter test ${Date.now()}`;
    await page.keyboard.type(testMessage);
    await expectSendAccepted(page, () => page.keyboard.press('Enter'));

    // Wait for the message to appear in the list
    await expect(
      page.locator('.cometchat-message-list').getByText(testMessage)
    ).toBeVisible({ timeout: 15_000 });
  });

  // ==================== Attachment Menu ====================

  // ==================== Emoji Keyboard ====================

  test('emoji button opens emoji keyboard', async () => {
    const composer = page.locator('.cometchat-message-composer').first();
    const emojiBtn = composer.locator('[class*="emoji"], button[aria-label*="Emoji" i]').first();
    await expect(emojiBtn).toBeVisible({ timeout: 5_000 });
    await emojiBtn.click();

    const keyboard = page.locator('.cometchat-emoji-keyboard, [class*="emoji-keyboard"]').first();
    await expect(keyboard).toBeVisible({ timeout: 5_000 });

    // Close it
    await page.keyboard.press('Escape');
  });

  // ==================== Voice Recording ====================

  test('voice recording button is present', async () => {
    // Voice recording is an OPTIONAL extension — skip if not enabled
    const voiceBtn = page.locator('.cometchat-message-composer__voice-button, [class*="voice-recording"], button[aria-label*="Voice" i]').first();
    const hasVoice = await visibleWithin(voiceBtn, 3_000);
    test.skip(!hasVoice, 'Voice recording extension not enabled');
    await expect(voiceBtn).toBeVisible();
  });

  // ==================== Placeholder ====================

  test('placeholder shows while empty, hides when typing, returns when cleared', async () => {
    const composer = page.locator('.cometchat-message-composer').first();
    const input = composer.locator('[contenteditable="true"]').first();
    const placeholder = composer.locator('.cometchat-message-composer__input-placeholder');
    await expect(placeholder).toHaveText('Enter your message here', { timeout: 5_000 });

    await input.click();
    await page.keyboard.type('draft');
    await expect(placeholder).toHaveCount(0);

    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.press('Backspace');
    await expect(placeholder).toHaveText('Enter your message here');
  });

  // ==================== Formatting Toolbar ====================

  // ==================== Accessibility ====================

  test('composer input is an accessible multiline textbox with a label', async () => {
    const input = page.locator('.cometchat-message-composer [contenteditable="true"]').first();
    await expect(input).toHaveAttribute('role', 'textbox');
    await expect(input).toHaveAttribute('aria-multiline', 'true');
    await expect(input).toHaveAttribute('aria-label', /\S/);
    // Reachable by its accessible name, as assistive tech would find it.
    const label = (await input.getAttribute('aria-label')) ?? '';
    await expect(page.getByRole('textbox', { name: label, exact: true }).first()).toBeVisible();
  });

  // ==================== Disabled State ====================

  // ==================== Image Attachment ====================

  test('send image attachment via action sheet', { tag: '@smoke' }, async () => {
    // Count existing image bubbles before sending
    const imageBubblesBefore = await page.locator('.cometchat-images-bubble').count();

    await stageAndSendAttachment(page, 'Image');

    // A NEW image bubble should appear (count increased)
    await expect(async () => {
      const count = await page.locator('.cometchat-images-bubble').count();
      expect(count).toBeGreaterThan(imageBubblesBefore);
    }).toPass({ timeout: 15_000 });
  });

  // ==================== File Attachment ====================

  test('send file attachment via action sheet', async () => {
    // Count existing file bubbles before sending
    const fileBubblesBefore = await page.locator('.cometchat-files-bubble').count();

    await stageAndSendAttachment(page, 'File');

    // A NEW file bubble should appear (count increased)
    await expect(async () => {
      const count = await page.locator('.cometchat-files-bubble').count();
      expect(count).toBeGreaterThan(fileBubblesBefore);
    }).toPass({ timeout: 15_000 });
  });

  // ==================== Full-Screen Image Viewer ====================

  test('clicking sent image opens full-screen viewer', async () => {
    // Count existing image bubbles before sending
    const imageBubblesBefore = await page.locator('.cometchat-images-bubble').count();

    // Send an image first
    await stageAndSendAttachment(page, 'Image');

    // Wait for a NEW image bubble (count increased)
    await expect(async () => {
      const count = await page.locator('.cometchat-images-bubble').count();
      expect(count).toBeGreaterThan(imageBubblesBefore);
    }).toPass({ timeout: 15_000 });

    // Click the LAST image bubble (the one we just sent)
    const imageBubble = page.locator('.cometchat-images-bubble').last();
    const imageWrapper = imageBubble.locator('.cometchat-images-bubble__image-wrapper').first();
    await expect(imageWrapper).toBeVisible({ timeout: 5_000 });
    // The bubble first shows the local preview, then re-renders with the uploaded
    // URL; click only once the uploaded image has actually loaded.
    const image = imageWrapper.locator('img').first();
    await expect
      .poll(
        () =>
          image.evaluate(
            (el: HTMLImageElement) => !el.src.startsWith('blob:') && el.complete && el.naturalWidth > 0
          ),
        { timeout: 20_000 }
      )
      .toBe(true);
    await imageWrapper.click();

    // Full-screen viewer should open
    const viewer = page.locator('.cometchat-fullscreen-viewer').first();
    await expect(viewer).toBeVisible({ timeout: 5_000 });

    // Close via Escape
    await page.keyboard.press('Escape');

    // Viewer should close
    await expect(viewer).not.toBeVisible({ timeout: 5_000 });
  });

  // ==================== Attachment Menu No Overflow ====================

  test('attachment menu does not overflow into conversation list', async () => {
    // Get the conversations panel's right edge
    const convPanel = page.locator('.cometchat-tab-component, .cometchat-conversations, .cometchat-users, .cometchat-groups').first();
    const convBox = await convPanel.boundingBox();
    expect(convBox).toBeTruthy();

    // Open attachment menu
    const attachBtn = page.locator('.cometchat-message-composer__attachment-button').first();
    await expect(attachBtn).toBeVisible({ timeout: 5_000 });
    await attachBtn.click();

    const optionsList = page.locator('.cometchat-message-composer__attachment-list').first();
    await expect(optionsList).toBeVisible({ timeout: 5_000 });

    // Get the attachment list's bounding box
    const listBox = await optionsList.boundingBox();
    expect(listBox).toBeTruthy();

    // The attachment list's left edge must be to the right of the conversation panel
    if (convBox && listBox) {
      const convRightEdge = convBox.x + convBox.width;
      expect(listBox.x).toBeGreaterThanOrEqual(convRightEdge - 10); // 10px tolerance
    }

    // Close
    await page.keyboard.press('Escape');
  });

  // ==================== Video Attachment ====================

  test('send video attachment via action sheet', async () => {
    // Count existing video bubbles before sending
    const videoBubblesBefore = await page.locator('.cometchat-videos-bubble').count();

    await stageAndSendAttachment(page, 'Video');

    // A NEW video bubble should appear (count increased)
    await expect(async () => {
      const count = await page.locator('.cometchat-videos-bubble').count();
      expect(count).toBeGreaterThan(videoBubblesBefore);
    }).toPass({ timeout: 15_000 });
  });

  // ==================== Audio Attachment ====================

  test('send audio attachment via action sheet', async () => {
    // Count existing audio bubbles before sending
    const audioBubblesBefore = await page.locator('.cometchat-audios-bubble').count();

    await stageAndSendAttachment(page, 'Audio');

    // A NEW audio bubble should appear (count increased)
    await expect(async () => {
      const count = await page.locator('.cometchat-audios-bubble').count();
      expect(count).toBeGreaterThan(audioBubblesBefore);
    }).toPass({ timeout: 15_000 });
  });

  // ==================== Audio Playback ====================

});
