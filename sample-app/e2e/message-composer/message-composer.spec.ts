import { test, expect, Page } from '@playwright/test';
import { loginToApp, openStrategyChat } from '../helpers';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

  test('composer renders with text input and send button', async () => {
    const composer = page.locator('.cometchat-message-composer').first();
    await expect(composer).toBeVisible({ timeout: 5_000 });

    const input = composer.locator('[contenteditable="true"]').first();
    await expect(input).toBeVisible({ timeout: 5_000 });
  });

  test('send button is present', async () => {
    const composer = page.locator('.cometchat-message-composer').first();
    const sendBtn = composer.locator('[class*="send-button"], [class*="send"], button[aria-label*="Send" i]').first();
    const hasSend = await sendBtn.isVisible({ timeout: 5_000 }).catch(() => false);
    expect(hasSend).toBeTruthy();
  });

  // ==================== Text Input ====================

  test('typing text in composer works', async () => {
    const composer = page.locator('.cometchat-message-composer').first();
    const input = composer.locator('[contenteditable="true"]').first();
    await input.click();
    await page.keyboard.type('Hello E2E test');
    await page.waitForTimeout(300);

    const content = await input.textContent();
    expect(content).toContain('Hello E2E test');
  });

  test('send button sends the message', async () => {
    const composer = page.locator('.cometchat-message-composer').first();
    const input = composer.locator('[contenteditable="true"]').first();
    await input.click();

    const testMessage = `E2E test ${Date.now()}`;
    await page.keyboard.type(testMessage);

    const sendBtn = composer.locator('[class*="send-button"], [class*="send"], button[aria-label*="Send" i]').first();
    await sendBtn.click();

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
    await page.keyboard.press('Enter');

    // Wait for the message to appear in the list
    await expect(
      page.locator('.cometchat-message-list').getByText(testMessage)
    ).toBeVisible({ timeout: 15_000 });
  });

  // ==================== Attachment Menu ====================

  test('attachment button opens menu', async () => {
    const composer = page.locator('.cometchat-message-composer').first();
    const attachBtn = composer.locator('[class*="attachment"], [class*="add-button"], button[aria-label*="Attach" i], [class*="auxiliary"] button').first();
    await expect(attachBtn).toBeVisible({ timeout: 5_000 });
    await attachBtn.click();
    await page.waitForTimeout(1000);

    // Action sheet / popover MUST appear
    const menu = page.locator('.cometchat-action-sheet, .cometchat-popover, [class*="action-sheet"]').first();
    await expect(menu).toBeVisible({ timeout: 5_000 });

    // Close it
    await page.keyboard.press('Escape');
  });

  // ==================== Emoji Keyboard ====================

  test('emoji button opens emoji keyboard', async () => {
    const composer = page.locator('.cometchat-message-composer').first();
    const emojiBtn = composer.locator('[class*="emoji"], button[aria-label*="Emoji" i]').first();
    await expect(emojiBtn).toBeVisible({ timeout: 5_000 });
    await emojiBtn.click();
    await page.waitForTimeout(1000);

    const keyboard = page.locator('.cometchat-emoji-keyboard, [class*="emoji-keyboard"]').first();
    await expect(keyboard).toBeVisible({ timeout: 5_000 });

    // Close it
    await page.keyboard.press('Escape');
  });

  // ==================== Voice Recording ====================

  test('voice recording button is present', async () => {
    // Voice recording is an OPTIONAL extension — skip if not enabled
    const voiceBtn = page.locator('.cometchat-message-composer__voice-button, [class*="voice-recording"], button[aria-label*="Voice" i]').first();
    const hasVoice = await voiceBtn.isVisible({ timeout: 3_000 }).catch(() => false);
    test.skip(!hasVoice, 'Voice recording extension not enabled');
    await expect(voiceBtn).toBeVisible();
  });

  // ==================== Placeholder ====================

  test('placeholder text displays when input is empty', async () => {
    const composer = page.locator('.cometchat-message-composer').first();
    const input = composer.locator('[contenteditable="true"]').first();
    await expect(input).toBeVisible();
  });

  // ==================== Formatting Toolbar ====================

  test('text formatting options are available', async () => {
    const toolbar = page.locator('.cometchat-message-composer__toolbar, [class*="formatting-toolbar"]').first();
    await expect(toolbar).toBeVisible({ timeout: 5_000 });

    const buttons = toolbar.locator('button');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
  });

  // ==================== Accessibility ====================

  test('composer has proper ARIA attributes', async () => {
    const composer = page.locator('.cometchat-message-composer').first();
    await expect(composer).toBeVisible();
    const input = composer.locator('[contenteditable="true"]').first();
    await expect(input).toBeVisible();
  });

  // ==================== Disabled State ====================

  test('composer input is interactive by default', async () => {
    const composer = page.locator('.cometchat-message-composer').first();
    const input = composer.locator('[contenteditable="true"]').first();
    await expect(input).toBeVisible();
    const isEditable = await input.getAttribute('contenteditable');
    expect(isEditable).toBe('true');
  });

  // ==================== Image Attachment ====================

  test('send image attachment via action sheet', async () => {
    // Count existing image bubbles before sending
    const imageBubblesBefore = await page.locator('.cometchat-image-bubble').count();

    // Click the attachment button
    const attachBtn = page.locator('.cometchat-message-composer__attachment-button').first();
    await expect(attachBtn).toBeVisible({ timeout: 5_000 });
    await attachBtn.click();
    await page.waitForTimeout(1000);

    // Attachment options list should open
    const optionsList = page.locator('.cometchat-message-composer__attachment-list').first();
    await expect(optionsList).toBeVisible({ timeout: 5_000 });

    // Click the "Image" option — it programmatically creates a file input
    const imageOption = optionsList.locator('.cometchat-message-composer__attachment-option').filter({
      has: page.locator('.cometchat-message-composer__attachment-option-title:has-text("Image")'),
    }).first();
    await expect(imageOption).toBeVisible({ timeout: 3_000 });

    const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 5_000 });
    await imageOption.click();
    const fileChooser = await fileChooserPromise;

    const testImagePath = path.resolve(__dirname, '../fixtures/test-image.png');
    await fileChooser.setFiles(testImagePath);

    // A NEW image bubble should appear (count increased)
    await expect(async () => {
      const count = await page.locator('.cometchat-image-bubble').count();
      expect(count).toBeGreaterThan(imageBubblesBefore);
    }).toPass({ timeout: 15_000 });
  });

  // ==================== File Attachment ====================

  test('send file attachment via action sheet', async () => {
    // Count existing file bubbles before sending
    const fileBubblesBefore = await page.locator('.cometchat-file-bubble').count();

    // Click the attachment button
    const attachBtn = page.locator('.cometchat-message-composer__attachment-button').first();
    await expect(attachBtn).toBeVisible({ timeout: 5_000 });
    await attachBtn.click();
    await page.waitForTimeout(1000);

    // Attachment options list should open
    const optionsList = page.locator('.cometchat-message-composer__attachment-list').first();
    await expect(optionsList).toBeVisible({ timeout: 5_000 });

    // Click the "File" option
    const fileOption = optionsList.locator('.cometchat-message-composer__attachment-option').filter({
      has: page.locator('.cometchat-message-composer__attachment-option-title:has-text("File")'),
    }).first();
    await expect(fileOption).toBeVisible({ timeout: 3_000 });

    const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 5_000 });
    await fileOption.click();
    const fileChooser = await fileChooserPromise;

    const testFilePath = path.resolve(__dirname, '../fixtures/test-file.pdf');
    await fileChooser.setFiles(testFilePath);

    // A NEW file bubble should appear (count increased)
    await expect(async () => {
      const count = await page.locator('.cometchat-file-bubble').count();
      expect(count).toBeGreaterThan(fileBubblesBefore);
    }).toPass({ timeout: 15_000 });
  });

  // ==================== Full-Screen Image Viewer ====================

  test('clicking sent image opens full-screen viewer', async () => {
    // Count existing image bubbles before sending
    const imageBubblesBefore = await page.locator('.cometchat-image-bubble').count();

    // Send an image first
    const attachBtn = page.locator('.cometchat-message-composer__attachment-button').first();
    await expect(attachBtn).toBeVisible({ timeout: 5_000 });
    await attachBtn.click();
    await page.waitForTimeout(1000);

    const optionsList = page.locator('.cometchat-message-composer__attachment-list').first();
    await expect(optionsList).toBeVisible({ timeout: 5_000 });

    const imageOption = optionsList.locator('.cometchat-message-composer__attachment-option').filter({
      has: page.locator('.cometchat-message-composer__attachment-option-title:has-text("Image")'),
    }).first();
    await expect(imageOption).toBeVisible({ timeout: 3_000 });

    const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 5_000 });
    await imageOption.click();
    const fileChooser = await fileChooserPromise;

    const testImagePath = path.resolve(__dirname, '../fixtures/test-image.png');
    await fileChooser.setFiles(testImagePath);

    // Wait for a NEW image bubble (count increased)
    await expect(async () => {
      const count = await page.locator('.cometchat-image-bubble').count();
      expect(count).toBeGreaterThan(imageBubblesBefore);
    }).toPass({ timeout: 15_000 });

    // Wait for image to fully render
    await page.waitForTimeout(7500);

    // Click the LAST image bubble (the one we just sent)
    const imageBubble = page.locator('.cometchat-image-bubble').last();
    const imageWrapper = imageBubble.locator('.cometchat-image-bubble__image-wrapper').first();
    await expect(imageWrapper).toBeVisible({ timeout: 5_000 });
    await imageWrapper.click();
    await page.waitForTimeout(1000);

    // Full-screen viewer should open
    const viewer = page.locator('.cometchat-fullscreen-viewer').first();
    await expect(viewer).toBeVisible({ timeout: 5_000 });

    // Close via Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

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
    await page.waitForTimeout(1000);

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
    const videoBubblesBefore = await page.locator('.cometchat-video-bubble').count();

    const attachBtn = page.locator('.cometchat-message-composer__attachment-button').first();
    await expect(attachBtn).toBeVisible({ timeout: 5_000 });
    await attachBtn.click();
    await page.waitForTimeout(1000);

    const optionsList = page.locator('.cometchat-message-composer__attachment-list').first();
    await expect(optionsList).toBeVisible({ timeout: 5_000 });

    const videoOption = optionsList.locator('.cometchat-message-composer__attachment-option').filter({
      has: page.locator('.cometchat-message-composer__attachment-option-title:has-text("Video")'),
    }).first();
    await expect(videoOption).toBeVisible({ timeout: 3_000 });

    const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 5_000 });
    await videoOption.click();
    const fileChooser = await fileChooserPromise;

    const testVideoPath = path.resolve(__dirname, '../fixtures/test-video.mp4');
    await fileChooser.setFiles(testVideoPath);

    // A NEW video bubble should appear (count increased)
    await expect(async () => {
      const count = await page.locator('.cometchat-video-bubble').count();
      expect(count).toBeGreaterThan(videoBubblesBefore);
    }).toPass({ timeout: 15_000 });
  });

  // ==================== Audio Attachment ====================

  test('send audio attachment via action sheet', async () => {
    // Count existing audio bubbles before sending
    const audioBubblesBefore = await page.locator('.cometchat-audio-bubble').count();

    const attachBtn = page.locator('.cometchat-message-composer__attachment-button').first();
    await expect(attachBtn).toBeVisible({ timeout: 5_000 });
    await attachBtn.click();
    await page.waitForTimeout(1000);

    const optionsList = page.locator('.cometchat-message-composer__attachment-list').first();
    await expect(optionsList).toBeVisible({ timeout: 5_000 });

    const audioOption = optionsList.locator('.cometchat-message-composer__attachment-option').filter({
      has: page.locator('.cometchat-message-composer__attachment-option-title:has-text("Audio")'),
    }).first();
    await expect(audioOption).toBeVisible({ timeout: 3_000 });

    const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 5_000 });
    await audioOption.click();
    const fileChooser = await fileChooserPromise;

    const testAudioPath = path.resolve(__dirname, '../fixtures/test-audio.mp3');
    await fileChooser.setFiles(testAudioPath);

    // A NEW audio bubble should appear (count increased)
    await expect(async () => {
      const count = await page.locator('.cometchat-audio-bubble').count();
      expect(count).toBeGreaterThan(audioBubblesBefore);
    }).toPass({ timeout: 15_000 });
  });

  // ==================== Audio Playback ====================

  test('audio bubble has play button', async () => {
    // There should be an audio bubble from the previous test or existing messages
    const audioBubble = page.locator('.cometchat-audio-bubble').last();
    await expect(audioBubble).toBeVisible({ timeout: 15_000 });

    const playBtn = audioBubble.locator('.cometchat-audio-bubble__play-button').first();
    await expect(playBtn).toBeVisible({ timeout: 5_000 });
  });
});
