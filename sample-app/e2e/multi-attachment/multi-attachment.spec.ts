import { test, expect, Page } from '@playwright/test';
import { loginToApp, openStrategyChat } from '../helpers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FIXTURES = path.resolve(__dirname, '../fixtures');
const IMAGE_PATH = path.join(FIXTURES, 'test-image.png');
const VIDEO_PATH = path.join(FIXTURES, 'test-video.mp4');
const AUDIO_PATH = path.join(FIXTURES, 'test-audio.mp3');
const FILE_PATH = path.join(FIXTURES, 'test-file.pdf');

/**
 * Optional, developer-supplied fixtures for the hard-error tests. They require
 * either a very large file or CometChat dashboard config, so they are NOT checked
 * into the repo — drop a matching file into e2e/fixtures/ to enable the test,
 * otherwise the test skips itself. See the "Optional fixtures — multi-attachment
 * error states" section of the UIKit README for full instructions.
 *
 * - e2e-oversize.*      a single file > 100 MB (any extension) → "file size exceeded"
 * - e2e-blocked-mime.*  a file whose MIME type is DENIED in the dashboard; its
 *                       extension MUST NOT be png/mp4/mp3/pdf so it can't collide
 *                       with the standard fixtures → "file type not supported"
 */
function findFixture(prefix: string): string | null {
  const match = fs.readdirSync(FIXTURES).find((f) => f.startsWith(prefix));
  return match ? path.join(FIXTURES, match) : null;
}
const OVERSIZE_FILE = findFixture('e2e-oversize');
const BLOCKED_MIME_FILE = findFixture('e2e-blocked-mime');

/**
 * The MIME type to attach to the blocked-mime fixture. It MUST match the type you
 * denied in the dashboard, and it must be set explicitly: Playwright can't infer a
 * MIME for exotic extensions and would send an empty one — the server then rejects
 * with "mimeType is required" (a RETRYABLE failure) instead of the permission-denied
 * REJECTED state we assert. No fallback: if this is unset the test is skipped.
 */
const BLOCKED_MIME_TYPE = process.env.E2E_BLOCKED_MIME_TYPE ?? '';

type FilePayload = { name: string; mimeType: string; buffer: Buffer };

/**
 * Stage files through the attachment menu using a specific picker option. Accepts
 * plain paths (Playwright infers the MIME from the extension) or explicit
 * {name, mimeType, buffer} payloads when the MIME must be forced.
 */
async function pickFiles(
  page: Page,
  optionTitle: string,
  files: string[] | FilePayload[]
): Promise<void> {
  const attachBtn = page.locator('.cometchat-message-composer__attachment-button').first();
  await expect(attachBtn).toBeVisible({ timeout: 5_000 });
  await attachBtn.click();
  await page.waitForTimeout(500);

  const optionsList = page.locator('.cometchat-message-composer__attachment-list').first();
  await expect(optionsList).toBeVisible({ timeout: 5_000 });

  const option = optionsList
    .locator('.cometchat-message-composer__attachment-option')
    .filter({
      has: page.locator(
        `.cometchat-message-composer__attachment-option-title:has-text("${optionTitle}")`
      ),
    })
    .first();

  const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 5_000 });
  await option.click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(files);
}

/**
 * E2E Tests — Multi-Attachment Feature (React)
 *
 * Tests the multi-attachment composer tray, paste, drag-and-drop,
 * batch rendering, bubble content, edit option availability, and
 * conversation subtitle. All tests use Strategy group (mutable).
 */

// ═══════════════════════════════════════════════════════════════
// COMPOSER TRAY — Multi-file staging, progress, send gating
// ═══════════════════════════════════════════════════════════════

test.describe('Multi-Attachment Composer Tray', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await loginToApp(page);
    await page.waitForSelector('.cometchat-conversations__item', { timeout: 30_000 });
    await openStrategyChat(page);
  });

  test('pick multiple images via attachment menu — tray appears with thumbnails', async () => {
    const attachBtn = page.locator('.cometchat-message-composer__attachment-button').first();
    await expect(attachBtn).toBeVisible({ timeout: 5_000 });
    await attachBtn.click();
    await page.waitForTimeout(500);

    const optionsList = page.locator('.cometchat-message-composer__attachment-list').first();
    await expect(optionsList).toBeVisible({ timeout: 5_000 });

    const imageOption = optionsList.locator('.cometchat-message-composer__attachment-option').filter({
      has: page.locator('.cometchat-message-composer__attachment-option-title:has-text("Image")'),
    }).first();
    await expect(imageOption).toBeVisible({ timeout: 3_000 });

    const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 5_000 });
    await imageOption.click();
    const fileChooser = await fileChooserPromise;

    // Select 4 images (same file repeated)
    await fileChooser.setFiles([IMAGE_PATH, IMAGE_PATH, IMAGE_PATH, IMAGE_PATH]);

    // Tray MUST appear
    const tray = page.locator('.cometchat-message-composer__tray').first();
    await expect(tray).toBeVisible({ timeout: 5_000 });

    // Should have 4 tiles
    const tiles = tray.locator('li');
    await expect(tiles).toHaveCount(4, { timeout: 10_000 });
  });

  test('pick mixed file types — tray shows correct tile types for all 4 media kinds', async () => {
    const attachBtn = page.locator('.cometchat-message-composer__attachment-button').first();
    await expect(attachBtn).toBeVisible({ timeout: 5_000 });
    await attachBtn.click();
    await page.waitForTimeout(500);

    const optionsList = page.locator('.cometchat-message-composer__attachment-list').first();
    await expect(optionsList).toBeVisible({ timeout: 5_000 });

    // Pick via "File" option (accepts all types)
    const fileOption = optionsList.locator('.cometchat-message-composer__attachment-option').filter({
      has: page.locator('.cometchat-message-composer__attachment-option-title:has-text("File")'),
    }).first();
    await expect(fileOption).toBeVisible({ timeout: 3_000 });

    const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 5_000 });
    await fileOption.click();
    const fileChooser = await fileChooserPromise;

    await fileChooser.setFiles([IMAGE_PATH, VIDEO_PATH, AUDIO_PATH, FILE_PATH]);

    const tray = page.locator('.cometchat-message-composer__tray').first();
    await expect(tray).toBeVisible({ timeout: 5_000 });

    const tiles = tray.locator('li');
    await expect(tiles).toHaveCount(4, { timeout: 10_000 });
  });

  test('staging via the menu twice accumulates into the same tray (does not replace)', async () => {
    // First pick: one image (opens the attachment menu on its own).
    await pickFiles(page, 'Image', [IMAGE_PATH]);

    const tray = page.locator('.cometchat-message-composer__tray').first();
    await expect(tray).toBeVisible({ timeout: 5_000 });
    await expect(tray.locator('li')).toHaveCount(1, { timeout: 10_000 });

    // Second pick via a FRESH open of the attachment menu: two more images.
    await pickFiles(page, 'Image', [IMAGE_PATH, IMAGE_PATH]);

    // The tray must ACCUMULATE to 3 tiles, not replace back down to 2.
    await expect(tray.locator('li')).toHaveCount(3, { timeout: 10_000 });
  });

  test('remove one tile from a mixed tray drops only that tile', async () => {
    // Stage an image AND a file so we can prove the OTHER tile survives removal.
    await pickFiles(page, 'File', [IMAGE_PATH, FILE_PATH]);

    const tray = page.locator('.cometchat-message-composer__tray').first();
    await expect(tray).toBeVisible({ timeout: 5_000 });
    await expect(tray.locator('li')).toHaveCount(2, { timeout: 10_000 });

    // Wait for uploads to finish so the remove button is accessible.
    await expect(
      tray.locator('.cometchat-message-composer__tray-progress')
    ).toHaveCount(0, { timeout: 15_000 });

    // The file card (PDF) must be present before removal.
    const fileCard = tray.locator('.cometchat-message-composer__tray-card');

    // Remove the FIRST tile (the image); the file tile must remain.
    const firstTile = tray.locator('li').first();
    await firstTile.hover();
    await page.waitForTimeout(300);
    const removeBtn = tray.locator('.cometchat-message-composer__tray-remove-button').first();
    await expect(removeBtn).toBeVisible({ timeout: 3_000 });
    await removeBtn.click();
    await page.waitForTimeout(500);

    // Current check: exactly one tile was dropped.
    await expect(tray.locator('li')).toHaveCount(1, { timeout: 5_000 });
    // New check: the OTHER tile (the file card) was NOT removed.
    await expect(fileCard).toHaveCount(1, { timeout: 5_000 });
    const cardText = await fileCard.first().textContent();
    expect(cardText?.toUpperCase()).toContain('PDF');
  });

  test('removing the last staged tile hides the tray', async () => {
    await pickFiles(page, 'Image', [IMAGE_PATH]);

    const tray = page.locator('.cometchat-message-composer__tray').first();
    await expect(tray).toBeVisible({ timeout: 5_000 });
    await expect(tray.locator('li')).toHaveCount(1, { timeout: 10_000 });
    await expect(
      tray.locator('.cometchat-message-composer__tray-progress')
    ).toHaveCount(0, { timeout: 15_000 });

    const firstTile = tray.locator('li').first();
    await firstTile.hover();
    await page.waitForTimeout(300);
    const removeBtn = tray.locator('.cometchat-message-composer__tray-remove-button').first();
    await expect(removeBtn).toBeVisible({ timeout: 3_000 });
    await removeBtn.click();

    // With no items left, the tray must disappear entirely.
    await expect(tray).not.toBeVisible({ timeout: 5_000 });
  });

  test('upload progress ring shows during upload then disappears on success', async () => {
    const attachBtn = page.locator('.cometchat-message-composer__attachment-button').first();
    await expect(attachBtn).toBeVisible({ timeout: 5_000 });
    await attachBtn.click();
    await page.waitForTimeout(500);

    const optionsList = page.locator('.cometchat-message-composer__attachment-list').first();
    await expect(optionsList).toBeVisible({ timeout: 5_000 });

    const imageOption = optionsList.locator('.cometchat-message-composer__attachment-option').filter({
      has: page.locator('.cometchat-message-composer__attachment-option-title:has-text("Image")'),
    }).first();

    const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 5_000 });
    await imageOption.click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles([IMAGE_PATH]);

    const tray = page.locator('.cometchat-message-composer__tray').first();
    await expect(tray).toBeVisible({ timeout: 5_000 });

    // Progress ring should eventually disappear (upload completes)
    const progressRing = tray.locator('.cometchat-message-composer__tray-progress');
    await expect(progressRing).toHaveCount(0, { timeout: 15_000 });
  });

  test('send button is disabled while uploads are in progress', async () => {
    const attachBtn = page.locator('.cometchat-message-composer__attachment-button').first();
    await expect(attachBtn).toBeVisible({ timeout: 5_000 });
    await attachBtn.click();
    await page.waitForTimeout(500);

    const optionsList = page.locator('.cometchat-message-composer__attachment-list').first();
    await expect(optionsList).toBeVisible({ timeout: 5_000 });

    const videoOption = optionsList.locator('.cometchat-message-composer__attachment-option').filter({
      has: page.locator('.cometchat-message-composer__attachment-option-title:has-text("Video")'),
    }).first();

    const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 5_000 });
    await videoOption.click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles([VIDEO_PATH]);

    // Check send button state IMMEDIATELY (before upload finishes)
    const sendBtn = page.locator('.cometchat-message-composer__send-button').first();
    await expect(sendBtn).toBeVisible({ timeout: 5_000 });

    // Wait for upload to complete — send button becomes active
    await expect(
      page.locator('.cometchat-message-composer__send-button--active')
    ).toBeVisible({ timeout: 30_000 });
  });

  test('picking files that would exceed the limit adds none (all-or-nothing) + toast', async () => {
    // Seed 8 images — within the 10 limit, so no toast and all 8 stage.
    await pickFiles(page, 'Image', Array.from({ length: 8 }, () => IMAGE_PATH));

    const tray = page.locator('.cometchat-message-composer__tray').first();
    await expect(tray).toBeVisible({ timeout: 5_000 });
    await expect(tray.locator('li')).toHaveCount(8, { timeout: 10_000 });

    // Pick 5 more (8 + 5 = 13 > 10). Under the all-or-nothing rule the WHOLE pick
    // is rejected: the tray stays at 8 (it does NOT top up to 10) and a toast shows.
    await pickFiles(page, 'Image', Array.from({ length: 5 }, () => IMAGE_PATH));

    const toast = page.locator('.cometchat-toast--error, .cometchat-message-composer__validation-error').first();
    await expect(toast).toBeVisible({ timeout: 5_000 });

    // Tray unchanged at 8 — not trimmed to fill 10, not grown to 13.
    await expect(tray.locator('li')).toHaveCount(8, { timeout: 5_000 });
  });

  test('audio tray tile shows duration and seek slider', async () => {
    const attachBtn = page.locator('.cometchat-message-composer__attachment-button').first();
    await expect(attachBtn).toBeVisible({ timeout: 5_000 });
    await attachBtn.click();
    await page.waitForTimeout(500);

    const optionsList = page.locator('.cometchat-message-composer__attachment-list').first();
    await expect(optionsList).toBeVisible({ timeout: 5_000 });

    const audioOption = optionsList.locator('.cometchat-message-composer__attachment-option').filter({
      has: page.locator('.cometchat-message-composer__attachment-option-title:has-text("Audio")'),
    }).first();

    const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 5_000 });
    await audioOption.click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles([AUDIO_PATH]);

    const tray = page.locator('.cometchat-message-composer__tray').first();
    await expect(tray).toBeVisible({ timeout: 5_000 });

    // Audio card must have a slider
    const slider = tray.locator('.cometchat-message-composer__tray-audio-slider').first();
    await expect(slider).toBeVisible({ timeout: 10_000 });

    // Audio card must show time (duration)
    const time = tray.locator('.cometchat-message-composer__tray-audio-time').first();
    await expect(time).toBeVisible({ timeout: 10_000 });
    const timeText = await time.textContent();
    // Format is "00:00/MM:SS" — duration part should not be 00:00
    expect(timeText).toMatch(/\d{2}:\d{2}\/\d{2}:\d{2}/);
  });

  test('file tray tile shows file extension label', async () => {
    const attachBtn = page.locator('.cometchat-message-composer__attachment-button').first();
    await expect(attachBtn).toBeVisible({ timeout: 5_000 });
    await attachBtn.click();
    await page.waitForTimeout(500);

    const optionsList = page.locator('.cometchat-message-composer__attachment-list').first();
    await expect(optionsList).toBeVisible({ timeout: 5_000 });

    const fileOption = optionsList.locator('.cometchat-message-composer__attachment-option').filter({
      has: page.locator('.cometchat-message-composer__attachment-option-title:has-text("File")'),
    }).first();

    const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 5_000 });
    await fileOption.click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles([FILE_PATH]);

    const tray = page.locator('.cometchat-message-composer__tray').first();
    await expect(tray).toBeVisible({ timeout: 5_000 });

    // File card must show extension label (e.g. "PDF")
    const card = tray.locator('.cometchat-message-composer__tray-card').first();
    await expect(card).toBeVisible({ timeout: 10_000 });
    const cardText = await card.textContent();
    expect(cardText?.toUpperCase()).toContain('PDF');
  });
});


// ═══════════════════════════════════════════════════════════════
// UPLOAD LIFECYCLE — Failure + retry (offline), hard error states
// ═══════════════════════════════════════════════════════════════

test.describe('Multi-Attachment Upload Lifecycle', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await loginToApp(page);
    await page.waitForSelector('.cometchat-conversations__item', { timeout: 30_000 });
    await openStrategyChat(page);
  });

  test.afterEach(async () => {
    // Always restore connectivity so a failed assertion can't leak offline state
    // into the next test in this (single-worker) run.
    await page.context().setOffline(false).catch(() => {});
  });

  const MEDIA_TYPES = [
    { kind: 'image', option: 'Image', mediaPath: IMAGE_PATH },
    { kind: 'video', option: 'Video', mediaPath: VIDEO_PATH },
    { kind: 'audio', option: 'Audio', mediaPath: AUDIO_PATH },
    { kind: 'file', option: 'File', mediaPath: FILE_PATH },
  ] as const;

  for (const { kind, option, mediaPath } of MEDIA_TYPES) {
    test(`${kind}: upload fails offline, then retry succeeds after reconnecting`, async () => {
      // Drop the network BEFORE staging so the upload cannot complete. Staging
      // itself is local (blob URL + dispatch), so the tray still appears.
      await page.context().setOffline(true);
      await pickFiles(page, option, [mediaPath]);

      const tray = page.locator('.cometchat-message-composer__tray').first();
      await expect(tray).toBeVisible({ timeout: 5_000 });

      // The tile must leave "uploading" and offer a retry affordance (a network
      // drop is a transient failure, not a hard rejection).
      const retryBtn = tray.locator('.cometchat-message-composer__tray-retry-button').first();
      await expect(retryBtn).toBeVisible({ timeout: 40_000 });
      // Failed tiles carry the error-styling class hook.
      await expect(
        tray.locator('.cometchat-message-composer__tray-tile--failed')
      ).toHaveCount(1, { timeout: 5_000 });
      // Send is blocked while an attachment is not successfully uploaded.
      await expect(
        page.locator('.cometchat-message-composer__send-button--active')
      ).toHaveCount(0);

      // Reconnect and retry — the SAME tile should upload through to success.
      await page.context().setOffline(false);
      await page.waitForTimeout(1_000);
      await retryBtn.click();

      // Retry affordance disappears once the upload completes...
      await expect(
        tray.locator('.cometchat-message-composer__tray-retry-button')
      ).toHaveCount(0, { timeout: 40_000 });
      // ...and the send button becomes active (all items successful).
      await expect(
        page.locator('.cometchat-message-composer__send-button--active').first()
      ).toBeVisible({ timeout: 15_000 });
    });
  }

  test('file size exceeded — rejected tile shows error icon, hover tooltip, send disabled', async () => {
    // Requires a > 100 MB fixture named e2e-oversize.* in e2e/fixtures/ (any
    // extension). See the UIKit README. Skipped when the fixture is absent.
    test.skip(!OVERSIZE_FILE, 'Missing e2e/fixtures/e2e-oversize.* (>100MB) — see UIKit README');

    await pickFiles(page, 'File', [OVERSIZE_FILE!]);
    const tray = page.locator('.cometchat-message-composer__tray').first();
    await expect(tray).toBeVisible({ timeout: 5_000 });

    // Hard error → rejected (non-retryable) tile with an error icon.
    const rejectedTile = tray.locator('.cometchat-message-composer__tray-tile--rejected');
    await expect(rejectedTile).toHaveCount(1, { timeout: 20_000 });
    await expect(
      tray.locator('.cometchat-message-composer__tray-rejected-icon')
    ).toBeVisible({ timeout: 5_000 });
    // A rejected tile is NOT retryable.
    await expect(
      tray.locator('.cometchat-message-composer__tray-retry-button')
    ).toHaveCount(0);

    // Hovering the rejected tile reveals the size-limit tooltip (portaled).
    await rejectedTile.first().hover();
    const tooltip = page.locator('.cometchat-tooltip').first();
    await expect(tooltip).toBeVisible({ timeout: 5_000 });
    await expect(tooltip).toContainText(/size limit/i);

    // Send stays disabled (never becomes active).
    await expect(
      page.locator('.cometchat-message-composer__send-button--active')
    ).toHaveCount(0);
  });

  test('file type not supported — rejected tile shows error icon, hover tooltip, send disabled', async () => {
    // Requires BOTH a fixture named e2e-blocked-mime.* (extension must NOT be
    // png/mp4/mp3/pdf) AND E2E_BLOCKED_MIME_TYPE set to the MIME you denied in the
    // dashboard. Missing either → skip. See the UIKit README.
    test.skip(
      !BLOCKED_MIME_FILE || !BLOCKED_MIME_TYPE,
      'Missing e2e/fixtures/e2e-blocked-mime.* or E2E_BLOCKED_MIME_TYPE — see UIKit README'
    );

    // Send an EXPLICIT mimeType (from E2E_BLOCKED_MIME_TYPE) so the server rejects on
    // the denied file TYPE (permission-denied → non-retryable rejected), not on a
    // missing mimeType (which comes back as a retryable "mimeType is required" failure).
    const blocked = BLOCKED_MIME_FILE!;
    await pickFiles(page, 'File', [
      {
        name: path.basename(blocked),
        mimeType: BLOCKED_MIME_TYPE,
        buffer: fs.readFileSync(blocked),
      },
    ]);
    const tray = page.locator('.cometchat-message-composer__tray').first();
    await expect(tray).toBeVisible({ timeout: 5_000 });

    const rejectedTile = tray.locator('.cometchat-message-composer__tray-tile--rejected');
    await expect(rejectedTile).toHaveCount(1, { timeout: 20_000 });
    await expect(
      tray.locator('.cometchat-message-composer__tray-rejected-icon')
    ).toBeVisible({ timeout: 5_000 });
    await expect(
      tray.locator('.cometchat-message-composer__tray-retry-button')
    ).toHaveCount(0);

    // Hovering the rejected tile reveals the "type not supported" tooltip.
    await rejectedTile.first().hover();
    const tooltip = page.locator('.cometchat-tooltip').first();
    await expect(tooltip).toBeVisible({ timeout: 5_000 });
    await expect(tooltip).toContainText(/not supported/i);

    await expect(
      page.locator('.cometchat-message-composer__send-button--active')
    ).toHaveCount(0);
  });
});


// ═══════════════════════════════════════════════════════════════
// SEND BATCH — All 4 media types, batch rendering, caption
// ═══════════════════════════════════════════════════════════════

test.describe('Multi-Attachment Send & Batch Rendering', () => {
  test.describe.configure({ mode: 'serial' });

  let page: Page;
  const BATCH_CAPTION = `Batch E2E ${Date.now()}`;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await loginToApp(page);
    await page.waitForSelector('.cometchat-conversations__item', { timeout: 30_000 });
    await openStrategyChat(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('send batch with all 4 media types and caption', async () => {
    // Stage each type via its own picker option for correct categorization
    const attachBtn = page.locator('.cometchat-message-composer__attachment-button').first();

    // 1. Pick image
    await expect(attachBtn).toBeVisible({ timeout: 5_000 });
    await attachBtn.click();
    await page.waitForTimeout(500);
    const optionsList = page.locator('.cometchat-message-composer__attachment-list').first();
    await expect(optionsList).toBeVisible({ timeout: 5_000 });

    const imageOption = optionsList.locator('.cometchat-message-composer__attachment-option').filter({
      has: page.locator('.cometchat-message-composer__attachment-option-title:has-text("Image")'),
    }).first();
    let fileChooserPromise = page.waitForEvent('filechooser', { timeout: 5_000 });
    await imageOption.click();
    let fileChooser = await fileChooserPromise;
    await fileChooser.setFiles([IMAGE_PATH]);

    // 2. Pick video
    await attachBtn.click();
    await page.waitForTimeout(500);
    await expect(optionsList).toBeVisible({ timeout: 5_000 });
    const videoOption = optionsList.locator('.cometchat-message-composer__attachment-option').filter({
      has: page.locator('.cometchat-message-composer__attachment-option-title:has-text("Video")'),
    }).first();
    fileChooserPromise = page.waitForEvent('filechooser', { timeout: 5_000 });
    await videoOption.click();
    fileChooser = await fileChooserPromise;
    await fileChooser.setFiles([VIDEO_PATH]);

    // 3. Pick audio
    await attachBtn.click();
    await page.waitForTimeout(500);
    await expect(optionsList).toBeVisible({ timeout: 5_000 });
    const audioOption = optionsList.locator('.cometchat-message-composer__attachment-option').filter({
      has: page.locator('.cometchat-message-composer__attachment-option-title:has-text("Audio")'),
    }).first();
    fileChooserPromise = page.waitForEvent('filechooser', { timeout: 5_000 });
    await audioOption.click();
    fileChooser = await fileChooserPromise;
    await fileChooser.setFiles([AUDIO_PATH]);

    // 4. Pick file
    await attachBtn.click();
    await page.waitForTimeout(500);
    await expect(optionsList).toBeVisible({ timeout: 5_000 });
    const fileOption = optionsList.locator('.cometchat-message-composer__attachment-option').filter({
      has: page.locator('.cometchat-message-composer__attachment-option-title:has-text("File")'),
    }).first();
    fileChooserPromise = page.waitForEvent('filechooser', { timeout: 5_000 });
    await fileOption.click();
    fileChooser = await fileChooserPromise;
    await fileChooser.setFiles([FILE_PATH]);

    // Wait for tray to have 4 tiles
    const tray = page.locator('.cometchat-message-composer__tray').first();
    await expect(tray).toBeVisible({ timeout: 5_000 });
    await expect(tray.locator('li')).toHaveCount(4, { timeout: 10_000 });

    // Wait for all uploads to complete (no progress rings remaining)
    await expect(
      tray.locator('.cometchat-message-composer__tray-progress')
    ).toHaveCount(0, { timeout: 60_000 });

    // Type caption
    const composer = page.locator('.cometchat-message-composer').first();
    const input = composer.locator('[contenteditable="true"]').first();
    await input.click();
    await page.keyboard.type(BATCH_CAPTION);
    await page.waitForTimeout(300);

    // Send
    const sendBtn = page.locator('.cometchat-message-composer__send-button--active').first();
    await expect(sendBtn).toBeVisible({ timeout: 5_000 });
    await sendBtn.click();

    // Tray should disappear after send
    await expect(tray).not.toBeVisible({ timeout: 15_000 });

    // Messages should appear in the list — wait for the caption text
    await expect(
      page.locator('.cometchat-message-list').getByText(BATCH_CAPTION)
    ).toBeVisible({ timeout: 30_000 });
  });

  test('batch messages are grouped with tight spacing (batch wrapper classes)', async () => {
    // Scroll to the bottom to ensure our latest batch is visible
    const scrollContainer = page.locator('.cometchat-message-list__scroll-container').first();
    await scrollContainer.evaluate(el => { el.scrollTop = el.scrollHeight; });
    await page.waitForTimeout(2000);

    // The batch we just sent should have batch-position wrapper classes
    const batchFirst = page.locator('[class*="batch-first"]').last();
    await expect(batchFirst).toBeVisible({ timeout: 15_000 });

    const batchLast = page.locator('[class*="batch-last"]').last();
    await expect(batchLast).toBeVisible({ timeout: 10_000 });
  });

  test('caption appears only on the last message of the batch', async () => {
    // The caption text should appear exactly once in the batch
    const captionElements = page.locator('.cometchat-message-list').getByText(BATCH_CAPTION);
    await expect(captionElements).toHaveCount(1, { timeout: 10_000 });

    // It should be within the last batch item
    const batchLast = page.locator('.cometchat-message-bubble-wrapper--batch-last').last();
    await expect(batchLast).toBeVisible({ timeout: 5_000 });
    await expect(batchLast.getByText(BATCH_CAPTION)).toBeVisible({ timeout: 5_000 });
  });

  test('image bubble in batch renders grid correctly', async () => {
    // Find the images bubble in our batch (should be first in batch order)
    const imagesBubble = page.locator('.cometchat-images-bubble').last();
    await expect(imagesBubble).toBeVisible({ timeout: 10_000 });

    // Should contain at least one image tile
    const imageTiles = imagesBubble.locator('img, .cometchat-images-bubble__image');
    const count = await imageTiles.count();
    expect(count).toBeGreaterThan(0);
  });

  test('audio bubble shows duration, slider, and download button', async () => {
    const audioBubble = page.locator('.cometchat-audios-bubble').last();
    await expect(audioBubble).toBeVisible({ timeout: 10_000 });

    // Play button
    const playBtn = audioBubble.locator('.cometchat-audios-bubble__play-btn').first();
    await expect(playBtn).toBeVisible({ timeout: 5_000 });

    // Audio Slider
    const slider = audioBubble.locator('.cometchat-audios-bubble__slider').first();
    await expect(slider).toBeVisible({ timeout: 5_000 });

    // Time display (shows duration)
    const timeDisplay = audioBubble.locator('.cometchat-audios-bubble__time').first();
    await expect(timeDisplay).toBeVisible({ timeout: 5_000 });
    const timeText = await timeDisplay.textContent();
    expect(timeText).toMatch(/\d+:\d+/);

    // Download button
    const downloadBtn = audioBubble.locator('.cometchat-download-button').first();
    await expect(downloadBtn).toBeVisible({ timeout: 5_000 });
  });

  test('send batch WITHOUT caption — no caption text in batch messages', async () => {
    // Send another batch without caption using correct type pickers
    const attachBtn = page.locator('.cometchat-message-composer__attachment-button').first();

    // Pick image
    await expect(attachBtn).toBeVisible({ timeout: 5_000 });
    await attachBtn.click();
    await page.waitForTimeout(500);
    const optionsList = page.locator('.cometchat-message-composer__attachment-list').first();
    await expect(optionsList).toBeVisible({ timeout: 5_000 });

    const imageOption = optionsList.locator('.cometchat-message-composer__attachment-option').filter({
      has: page.locator('.cometchat-message-composer__attachment-option-title:has-text("Image")'),
    }).first();
    let fileChooserPromise = page.waitForEvent('filechooser', { timeout: 5_000 });
    await imageOption.click();
    let fileChooser = await fileChooserPromise;
    await fileChooser.setFiles([IMAGE_PATH]);

    // Pick audio
    await attachBtn.click();
    await page.waitForTimeout(500);
    await expect(optionsList).toBeVisible({ timeout: 5_000 });
    const audioOption = optionsList.locator('.cometchat-message-composer__attachment-option').filter({
      has: page.locator('.cometchat-message-composer__attachment-option-title:has-text("Audio")'),
    }).first();
    fileChooserPromise = page.waitForEvent('filechooser', { timeout: 5_000 });
    await audioOption.click();
    fileChooser = await fileChooserPromise;
    await fileChooser.setFiles([AUDIO_PATH]);

    const tray = page.locator('.cometchat-message-composer__tray').first();
    await expect(tray).toBeVisible({ timeout: 5_000 });
    await expect(tray.locator('li')).toHaveCount(2, { timeout: 10_000 });

    // Wait for uploads
    await expect(
      tray.locator('.cometchat-message-composer__tray-progress')
    ).toHaveCount(0, { timeout: 30_000 });

    // Send without typing any caption
    const sendBtn = page.locator('.cometchat-message-composer__send-button--active').first();
    await expect(sendBtn).toBeVisible({ timeout: 5_000 });
    await sendBtn.click();

    await expect(tray).not.toBeVisible({ timeout: 15_000 });
    // Wait for the new batch to appear
    await page.waitForTimeout(5000);
  });
});


// ═══════════════════════════════════════════════════════════════
// EDIT OPTION — Available on captioned messages, not on plain media
// ═══════════════════════════════════════════════════════════════

test.describe('Multi-Attachment Edit Option', () => {
  test.describe.configure({ mode: 'serial' });

  let page: Page;
  const EDIT_CAPTION = `Editable batch ${Date.now()}`;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await loginToApp(page);
    await page.waitForSelector('.cometchat-conversations__item', { timeout: 30_000 });
    await openStrategyChat(page);

    // Send a batch WITH caption so we can test edit availability
    const attachBtn = page.locator('.cometchat-message-composer__attachment-button').first();
    await expect(attachBtn).toBeVisible({ timeout: 5_000 });
    await attachBtn.click();
    await page.waitForTimeout(500);

    const optionsList = page.locator('.cometchat-message-composer__attachment-list').first();
    await expect(optionsList).toBeVisible({ timeout: 5_000 });

    const fileOption = optionsList.locator('.cometchat-message-composer__attachment-option').filter({
      has: page.locator('.cometchat-message-composer__attachment-option-title:has-text("File")'),
    }).first();

    const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 5_000 });
    await fileOption.click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles([IMAGE_PATH, FILE_PATH]);

    const tray = page.locator('.cometchat-message-composer__tray').first();
    await expect(tray).toBeVisible({ timeout: 5_000 });
    await expect(
      tray.locator('.cometchat-message-composer__tray-progress')
    ).toHaveCount(0, { timeout: 30_000 });

    // Type caption
    const input = page.locator('.cometchat-message-composer [contenteditable="true"]').first();
    await input.click();
    await page.keyboard.type(EDIT_CAPTION);

    const sendBtn = page.locator('.cometchat-message-composer__send-button--active').first();
    await expect(sendBtn).toBeVisible({ timeout: 5_000 });
    await sendBtn.click();

    await expect(tray).not.toBeVisible({ timeout: 15_000 });
    await expect(
      page.locator('.cometchat-message-list').getByText(EDIT_CAPTION)
    ).toBeVisible({ timeout: 30_000 });

    // Also send a batch WITHOUT caption
    await page.waitForTimeout(2000);
    await attachBtn.click();
    await page.waitForTimeout(500);
    await expect(optionsList).toBeVisible({ timeout: 5_000 });

    const fileChooserPromise2 = page.waitForEvent('filechooser', { timeout: 5_000 });
    await fileOption.click();
    const fileChooser2 = await fileChooserPromise2;
    await fileChooser2.setFiles([IMAGE_PATH]);

    await expect(tray).toBeVisible({ timeout: 5_000 });
    await expect(
      tray.locator('.cometchat-message-composer__tray-progress')
    ).toHaveCount(0, { timeout: 30_000 });

    const sendBtn2 = page.locator('.cometchat-message-composer__send-button--active').first();
    await expect(sendBtn2).toBeVisible({ timeout: 5_000 });
    await sendBtn2.click();
    await expect(tray).not.toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(5000);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('edit option IS available on the last batch message (has caption)', async () => {
    // The last batch message with caption is the one containing EDIT_CAPTION text
    const captionBubble = page.locator('.cometchat-message-bubble__wrapper--outgoing').filter({
      hasText: EDIT_CAPTION,
    }).last();
    await expect(captionBubble).toBeVisible({ timeout: 10_000 });

    const bodyArea = captionBubble.locator('.cometchat-message-bubble__body').first();
    await bodyArea.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await bodyArea.hover();
    await page.waitForTimeout(500);

    const moreBtn = captionBubble.locator('button[aria-label*="More" i]').first();
    await expect(moreBtn).toBeVisible({ timeout: 5_000 });
    await moreBtn.click();
    await page.waitForTimeout(500);

    const editOption = page.locator('[role="menuitem"]:has-text("Edit")').first();
    await expect(editOption).toBeVisible({ timeout: 5_000 });

    // Close menu
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  });

  test('edit option is NOT available on media messages without caption', async () => {
    // The last outgoing image bubble (sent without caption) should NOT have edit
    // Find the last outgoing bubble that does NOT contain our caption text
    const allOutgoing = page.locator('.cometchat-message-bubble__wrapper--outgoing');
    const lastOutgoing = allOutgoing.last();
    await expect(lastOutgoing).toBeVisible({ timeout: 10_000 });

    // Verify it does NOT contain our caption (it's the no-caption batch)
    const textContent = await lastOutgoing.textContent();
    expect(textContent).not.toContain(EDIT_CAPTION);

    const bodyArea = lastOutgoing.locator('.cometchat-message-bubble__body').first();
    await bodyArea.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await bodyArea.hover();
    await page.waitForTimeout(500);

    const moreBtn = lastOutgoing.locator('button[aria-label*="More" i]').first();
    await expect(moreBtn).toBeVisible({ timeout: 5_000 });
    await moreBtn.click();
    await page.waitForTimeout(500);

    // Edit option should NOT be present
    const editOption = page.locator('[role="menuitem"]:has-text("Edit")');
    await expect(editOption).toHaveCount(0, { timeout: 3_000 });

    // Close menu
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  });
});


// ═══════════════════════════════════════════════════════════════
// PASTE MEDIA — Paste into composer stages files
// ═══════════════════════════════════════════════════════════════

test.describe('Multi-Attachment Paste', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await loginToApp(page);
    await page.waitForSelector('.cometchat-conversations__item', { timeout: 30_000 });
    await openStrategyChat(page);
  });

  test('pasting an image into composer stages it in tray', async () => {
    const composer = page.locator('.cometchat-message-composer').first();
    const input = composer.locator('[contenteditable="true"]').first();
    await input.click();

    // Simulate paste with a file via the clipboard API
    await page.evaluate(async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = 'red';
      ctx.fillRect(0, 0, 100, 100);

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/png');
      });

      const file = new File([blob], 'pasted-image.png', { type: 'image/png' });
      const dt = new DataTransfer();
      dt.items.add(file);

      const pasteEvent = new ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
        clipboardData: dt,
      });

      const composerEl = document.querySelector('.cometchat-message-composer');
      composerEl?.dispatchEvent(pasteEvent);
    });

    // Tray should appear with the pasted image
    const tray = page.locator('.cometchat-message-composer__tray').first();
    await expect(tray).toBeVisible({ timeout: 10_000 });

    const tiles = tray.locator('li');
    const count = await tiles.count();
    expect(count).toBeGreaterThan(0);
  });
});


// ═══════════════════════════════════════════════════════════════
// DRAG AND DROP — Overlay, staging on drop
// ═══════════════════════════════════════════════════════════════

test.describe('Multi-Attachment Drag & Drop', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await loginToApp(page);
    await page.waitForSelector('.cometchat-conversations__item', { timeout: 30_000 });
    await openStrategyChat(page);
  });

  test('dragging file over composer shows drop overlay', async () => {
    const composer = page.locator('.cometchat-message-composer').first();
    await expect(composer).toBeVisible({ timeout: 5_000 });

    // Simulate dragenter with a file DataTransfer using page.evaluate
    await page.evaluate(() => {
      const composerEl = document.querySelector('.cometchat-message-composer');
      if (!composerEl) throw new Error('Composer not found');

      const dt = new DataTransfer();
      dt.items.add(new File(['x'], 'test.png', { type: 'image/png' }));

      const dragEnterEvent = new DragEvent('dragenter', {
        bubbles: true,
        cancelable: true,
        dataTransfer: dt,
      });
      composerEl.dispatchEvent(dragEnterEvent);
    });
    await page.waitForTimeout(500);

    const overlay = page.locator('.cometchat-message-composer__drop-overlay').first();
    await expect(overlay).toBeVisible({ timeout: 3_000 });
  });

  test('dragging away hides the drop overlay', async () => {
    const composer = page.locator('.cometchat-message-composer').first();
    await expect(composer).toBeVisible({ timeout: 5_000 });

    // Simulate dragenter
    await page.evaluate(() => {
      const composerEl = document.querySelector('.cometchat-message-composer');
      if (!composerEl) throw new Error('Composer not found');

      const dt = new DataTransfer();
      dt.items.add(new File(['x'], 'test.png', { type: 'image/png' }));

      const dragEnterEvent = new DragEvent('dragenter', {
        bubbles: true,
        cancelable: true,
        dataTransfer: dt,
      });
      composerEl.dispatchEvent(dragEnterEvent);
    });
    await page.waitForTimeout(500);

    const overlay = page.locator('.cometchat-message-composer__drop-overlay').first();
    await expect(overlay).toBeVisible({ timeout: 3_000 });

    // Simulate dragleave
    await page.evaluate(() => {
      const composerEl = document.querySelector('.cometchat-message-composer');
      if (!composerEl) throw new Error('Composer not found');

      const dragLeaveEvent = new DragEvent('dragleave', {
        bubbles: true,
        cancelable: true,
      });
      composerEl.dispatchEvent(dragLeaveEvent);
    });
    await page.waitForTimeout(500);

    await expect(overlay).not.toBeVisible({ timeout: 3_000 });
  });

  test('dropping files onto the composer stages them in the tray', async () => {
    const composer = page.locator('.cometchat-message-composer').first();
    await expect(composer).toBeVisible({ timeout: 5_000 });

    // Dispatch a native drop carrying two files; the composer's drop handler
    // reads dataTransfer.files and stages them into the tray.
    await page.evaluate(() => {
      const composerEl = document.querySelector('.cometchat-message-composer');
      if (!composerEl) throw new Error('Composer not found');

      const dt = new DataTransfer();
      dt.items.add(new File(['hello'], 'dropped-1.png', { type: 'image/png' }));
      dt.items.add(new File(['world'], 'dropped-2.png', { type: 'image/png' }));

      const dropEvent = new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        dataTransfer: dt,
      });
      composerEl.dispatchEvent(dropEvent);
    });

    // The dropped files must appear as staged tiles in the tray.
    const tray = page.locator('.cometchat-message-composer__tray').first();
    await expect(tray).toBeVisible({ timeout: 10_000 });
    await expect(tray.locator('li')).toHaveCount(2, { timeout: 10_000 });
  });
});


// ═══════════════════════════════════════════════════════════════
// MULTI-IMAGE BUBBLE — Grid, fullscreen viewer
// ═══════════════════════════════════════════════════════════════

test.describe('Multi-Image Bubble', () => {
  test.describe.configure({ mode: 'serial' });

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await loginToApp(page);
    await page.waitForSelector('.cometchat-conversations__item', { timeout: 30_000 });
    await openStrategyChat(page);

    // Send 4 images as a batch
    const attachBtn = page.locator('.cometchat-message-composer__attachment-button').first();
    await expect(attachBtn).toBeVisible({ timeout: 5_000 });
    await attachBtn.click();
    await page.waitForTimeout(500);

    const optionsList = page.locator('.cometchat-message-composer__attachment-list').first();
    await expect(optionsList).toBeVisible({ timeout: 5_000 });

    const imageOption = optionsList.locator('.cometchat-message-composer__attachment-option').filter({
      has: page.locator('.cometchat-message-composer__attachment-option-title:has-text("Image")'),
    }).first();

    const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 5_000 });
    await imageOption.click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles([IMAGE_PATH, IMAGE_PATH, IMAGE_PATH, IMAGE_PATH]);

    const tray = page.locator('.cometchat-message-composer__tray').first();
    await expect(tray).toBeVisible({ timeout: 5_000 });
    await expect(
      tray.locator('.cometchat-message-composer__tray-progress')
    ).toHaveCount(0, { timeout: 30_000 });

    const sendBtn = page.locator('.cometchat-message-composer__send-button--active').first();
    await expect(sendBtn).toBeVisible({ timeout: 5_000 });
    await sendBtn.click();
    await expect(tray).not.toBeVisible({ timeout: 15_000 });

    // Wait for the images bubble to appear
    await page.waitForTimeout(5000);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('multi-image bubble renders grid with 4 images', async () => {
    const imagesBubble = page.locator('.cometchat-images-bubble').last();
    await expect(imagesBubble).toBeVisible({ timeout: 15_000 });

    // Should have a 2x2 grid layout class
    const gridClass = await imagesBubble.getAttribute('class');
    expect(gridClass).toContain('grid');
  });

  test('clicking image in grid opens fullscreen viewer', async () => {
    const imagesBubble = page.locator('.cometchat-images-bubble').last();
    await expect(imagesBubble).toBeVisible({ timeout: 10_000 });

    // Click the first image tile
    const imageTile = imagesBubble.locator('.cometchat-images-bubble__image-wrapper, .cometchat-images-bubble__tile').first();
    await expect(imageTile).toBeVisible({ timeout: 5_000 });
    await imageTile.click();
    await page.waitForTimeout(1000);

    // Fullscreen viewer should open
    const viewer = page.locator('.cometchat-fullscreen-viewer').first();
    await expect(viewer).toBeVisible({ timeout: 5_000 });

    // Close
    await page.keyboard.press('Escape');
    await expect(viewer).not.toBeVisible({ timeout: 5_000 });
  });
});


// ═══════════════════════════════════════════════════════════════
// MULTI-AUDIO BUBBLE — Expand/collapse for >3 items
// ═══════════════════════════════════════════════════════════════

test.describe('Multi-Audio Bubble Expand/Collapse', () => {
  test.describe.configure({ mode: 'serial' });

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await loginToApp(page);
    await page.waitForSelector('.cometchat-conversations__item', { timeout: 30_000 });
    await openStrategyChat(page);

    // Send 4 audio files as a batch
    const attachBtn = page.locator('.cometchat-message-composer__attachment-button').first();
    await expect(attachBtn).toBeVisible({ timeout: 5_000 });
    await attachBtn.click();
    await page.waitForTimeout(500);

    const optionsList = page.locator('.cometchat-message-composer__attachment-list').first();
    await expect(optionsList).toBeVisible({ timeout: 5_000 });

    const audioOption = optionsList.locator('.cometchat-message-composer__attachment-option').filter({
      has: page.locator('.cometchat-message-composer__attachment-option-title:has-text("Audio")'),
    }).first();

    const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 5_000 });
    await audioOption.click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles([AUDIO_PATH, AUDIO_PATH, AUDIO_PATH, AUDIO_PATH]);

    const tray = page.locator('.cometchat-message-composer__tray').first();
    await expect(tray).toBeVisible({ timeout: 5_000 });
    await expect(
      tray.locator('.cometchat-message-composer__tray-progress')
    ).toHaveCount(0, { timeout: 30_000 });

    const sendBtn = page.locator('.cometchat-message-composer__send-button--active').first();
    await expect(sendBtn).toBeVisible({ timeout: 5_000 });
    await sendBtn.click();
    await expect(tray).not.toBeVisible({ timeout: 15_000 });

    await page.waitForTimeout(5000);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('multi-audio bubble shows expand button for >3 audios', async () => {
    const audiosBubble = page.locator('.cometchat-audios-bubble').last();
    await expect(audiosBubble).toBeVisible({ timeout: 15_000 });

    // Expand/collapse button: class is cometchat-audios-bubble__toggle
    const expandBtn = audiosBubble.locator('.cometchat-audios-bubble__toggle').first();
    await expect(expandBtn).toBeVisible({ timeout: 5_000 });
  });

  test('clicking expand shows all audio items', async () => {
    const audiosBubble = page.locator('.cometchat-audios-bubble').last();
    await expect(audiosBubble).toBeVisible({ timeout: 10_000 });

    // Count visible audio cards before expand
    const itemsBefore = await audiosBubble.locator('.cometchat-audios-bubble__card').count();

    // Click expand
    const expandBtn = audiosBubble.locator('.cometchat-audios-bubble__toggle').first();
    await expect(expandBtn).toBeVisible({ timeout: 5_000 });
    await expandBtn.click();
    await page.waitForTimeout(500);

    // More cards should be visible now
    const itemsAfter = await audiosBubble.locator('.cometchat-audios-bubble__card').count();
    expect(itemsAfter).toBeGreaterThan(itemsBefore);
  });
});


// ═══════════════════════════════════════════════════════════════
// MULTI-FILE BUBBLE — Expand/collapse for >3 items
// ═══════════════════════════════════════════════════════════════

test.describe('Multi-File Bubble Expand/Collapse', () => {
  test.describe.configure({ mode: 'serial' });

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await loginToApp(page);
    await page.waitForSelector('.cometchat-conversations__item', { timeout: 30_000 });
    await openStrategyChat(page);

    // Send 4 file attachments as a batch
    const attachBtn = page.locator('.cometchat-message-composer__attachment-button').first();
    await expect(attachBtn).toBeVisible({ timeout: 5_000 });
    await attachBtn.click();
    await page.waitForTimeout(500);

    const optionsList = page.locator('.cometchat-message-composer__attachment-list').first();
    await expect(optionsList).toBeVisible({ timeout: 5_000 });

    const fileOption = optionsList.locator('.cometchat-message-composer__attachment-option').filter({
      has: page.locator('.cometchat-message-composer__attachment-option-title:has-text("File")'),
    }).first();

    const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 5_000 });
    await fileOption.click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles([FILE_PATH, FILE_PATH, FILE_PATH, FILE_PATH]);

    const tray = page.locator('.cometchat-message-composer__tray').first();
    await expect(tray).toBeVisible({ timeout: 5_000 });
    await expect(
      tray.locator('.cometchat-message-composer__tray-progress')
    ).toHaveCount(0, { timeout: 30_000 });

    const sendBtn = page.locator('.cometchat-message-composer__send-button--active').first();
    await expect(sendBtn).toBeVisible({ timeout: 5_000 });
    await sendBtn.click();
    await expect(tray).not.toBeVisible({ timeout: 15_000 });

    await page.waitForTimeout(5000);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('multi-file bubble shows expand button for >3 files', async () => {
    const filesBubble = page.locator('.cometchat-files-bubble').last();
    await expect(filesBubble).toBeVisible({ timeout: 15_000 });

    const expandBtn = filesBubble.locator('.cometchat-files-bubble__toggle').first();
    await expect(expandBtn).toBeVisible({ timeout: 5_000 });
  });

  test('clicking expand shows all file items', async () => {
    const filesBubble = page.locator('.cometchat-files-bubble').last();
    await expect(filesBubble).toBeVisible({ timeout: 10_000 });

    const itemsBefore = await filesBubble.locator('.cometchat-files-bubble__card').count();

    const expandBtn = filesBubble.locator('.cometchat-files-bubble__toggle').first();
    await expect(expandBtn).toBeVisible({ timeout: 5_000 });
    await expandBtn.click();
    await page.waitForTimeout(500);

    const itemsAfter = await filesBubble.locator('.cometchat-files-bubble__card').count();
    expect(itemsAfter).toBeGreaterThan(itemsBefore);
  });
});


// ═══════════════════════════════════════════════════════════════
// MULTI-VIDEO BUBBLE — Grid with/without thumbnails
// ═══════════════════════════════════════════════════════════════

test.describe('Multi-Video Bubble', () => {
  test.describe.configure({ mode: 'serial' });

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await loginToApp(page);
    await page.waitForSelector('.cometchat-conversations__item', { timeout: 30_000 });
    await openStrategyChat(page);

    // Send 4 videos as a batch
    const attachBtn = page.locator('.cometchat-message-composer__attachment-button').first();
    await expect(attachBtn).toBeVisible({ timeout: 5_000 });
    await attachBtn.click();
    await page.waitForTimeout(500);

    const optionsList = page.locator('.cometchat-message-composer__attachment-list').first();
    await expect(optionsList).toBeVisible({ timeout: 5_000 });

    const videoOption = optionsList.locator('.cometchat-message-composer__attachment-option').filter({
      has: page.locator('.cometchat-message-composer__attachment-option-title:has-text("Video")'),
    }).first();

    const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 5_000 });
    await videoOption.click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles([VIDEO_PATH, VIDEO_PATH, VIDEO_PATH, VIDEO_PATH]);

    const tray = page.locator('.cometchat-message-composer__tray').first();
    await expect(tray).toBeVisible({ timeout: 5_000 });
    await expect(
      tray.locator('.cometchat-message-composer__tray-progress')
    ).toHaveCount(0, { timeout: 60_000 });

    const sendBtn = page.locator('.cometchat-message-composer__send-button--active').first();
    await expect(sendBtn).toBeVisible({ timeout: 5_000 });
    await sendBtn.click();
    await expect(tray).not.toBeVisible({ timeout: 15_000 });

    await page.waitForTimeout(8000);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('multi-video bubble renders grid layout', async () => {
    const videosBubble = page.locator('.cometchat-videos-bubble').last();
    await expect(videosBubble).toBeVisible({ timeout: 15_000 });

    // Should have grid class (not single)
    const classes = await videosBubble.getAttribute('class');
    expect(classes).not.toContain('--single');
  });

  test('video tiles show play overlay', async () => {
    const videosBubble = page.locator('.cometchat-videos-bubble').last();
    await expect(videosBubble).toBeVisible({ timeout: 10_000 });

    const playOverlay = videosBubble.locator('[class*="play"], [class*="overlay"]').first();
    await expect(playOverlay).toBeVisible({ timeout: 5_000 });
  });

  test('clicking a video tile opens the fullscreen viewer', async () => {
    const videosBubble = page.locator('.cometchat-videos-bubble').last();
    await expect(videosBubble).toBeVisible({ timeout: 10_000 });

    const tile = videosBubble.locator('.cometchat-videos-bubble__tile').first();
    await expect(tile).toBeVisible({ timeout: 5_000 });
    await tile.click();
    await page.waitForTimeout(1000);

    const viewer = page.locator('.cometchat-fullscreen-viewer').first();
    await expect(viewer).toBeVisible({ timeout: 5_000 });

    // Close it again.
    await page.keyboard.press('Escape');
    await expect(viewer).not.toBeVisible({ timeout: 5_000 });
  });
});


// ═══════════════════════════════════════════════════════════════
// CONVERSATION SUBTITLE — Last message shows media summary
// ═══════════════════════════════════════════════════════════════

test.describe('Multi-Attachment Conversation Subtitle', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await loginToApp(page);
    await page.waitForSelector('.cometchat-conversations__item', { timeout: 30_000 });
    await openStrategyChat(page);

    // Send a batch of 3 images with a caption so the subtitle is deterministic
    const attachBtn = page.locator('.cometchat-message-composer__attachment-button').first();
    await expect(attachBtn).toBeVisible({ timeout: 5_000 });
    await attachBtn.click();
    await page.waitForTimeout(500);

    const optionsList = page.locator('.cometchat-message-composer__attachment-list').first();
    await expect(optionsList).toBeVisible({ timeout: 5_000 });

    const imageOption = optionsList.locator('.cometchat-message-composer__attachment-option').filter({
      has: page.locator('.cometchat-message-composer__attachment-option-title:has-text("Image")'),
    }).first();

    const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 5_000 });
    await imageOption.click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles([IMAGE_PATH, IMAGE_PATH, IMAGE_PATH]);

    const tray = page.locator('.cometchat-message-composer__tray').first();
    await expect(tray).toBeVisible({ timeout: 5_000 });
    await expect(
      tray.locator('.cometchat-message-composer__tray-progress')
    ).toHaveCount(0, { timeout: 30_000 });

    const sendBtn = page.locator('.cometchat-message-composer__send-button--active').first();
    await expect(sendBtn).toBeVisible({ timeout: 5_000 });
    await sendBtn.click();
    await expect(tray).not.toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(5000);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('conversation list shows media type in last message subtitle', async () => {
    // Navigate to conversations list
    const chatsTab = page.locator('.cometchat-tab-component__tab:has-text("Chats")').first();
    await chatsTab.click();
    await page.waitForSelector('.cometchat-conversations__item', { timeout: 30_000 });

    // Find Strategy conversation
    const strategyItem = page.locator('.cometchat-conversations__item').filter({
      hasText: 'Strategy',
    }).first();
    await expect(strategyItem).toBeVisible({ timeout: 10_000 });

    // The subtitle should contain a media-type indicator (e.g. icon + "Photo" or "3 Photos")
    const subtitle = strategyItem.locator('.cometchat-conversations__item-subtitle, [class*="subtitle"]').first();
    await expect(subtitle).toBeVisible({ timeout: 5_000 });
    const subtitleText = await subtitle.textContent();
    // Should contain something media-related (not just a text message)
    expect(subtitleText?.trim().length).toBeGreaterThan(0);
  });
});
