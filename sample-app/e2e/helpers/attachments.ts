import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Page, expect } from '@playwright/test';
import { expectSendAccepted } from './send';

const FIXTURES = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../fixtures');

/** The media files in `e2e/fixtures`, by the composer's attachment option that sends them. */
export const MEDIA_FIXTURES = {
  Image: { file: 'test-image.png', mimeType: 'image/png' },
  Video: { file: 'test-video.mp4', mimeType: 'video/mp4' },
  Audio: { file: 'test-audio.mp3', mimeType: 'audio/mpeg' },
  File: { file: 'test-file.pdf', mimeType: 'application/pdf' },
} as const;

export type AttachmentOption = keyof typeof MEDIA_FIXTURES;

export function fixturePath(file: string): string {
  return path.join(FIXTURES, file);
}

/**
 * Stage a single attachment via the action sheet and send it.
 *
 * The composer runs with `enableMultipleAttachments` (default), so picking a file
 * routes it to the staging tray rather than sending immediately. We wait for the
 * tray + upload to finish, then click send. The message list then renders the
 * batch-aware plural bubbles (ImagesBubble/VideosBubble/AudiosBubble/FilesBubble).
 *
 * `name` uploads the option's fixture under another file name.
 */
export async function stageAndSendAttachment(
  page: Page,
  optionLabel: AttachmentOption,
  { filePath, name }: { filePath?: string; name?: string } = {}
) {
  const attachBtn = page.locator('.cometchat-message-composer__attachment-button').first();
  await expect(attachBtn).toBeVisible({ timeout: 5_000 });
  await attachBtn.click();

  const optionsList = page.locator('.cometchat-message-composer__attachment-list').first();
  await expect(optionsList).toBeVisible({ timeout: 5_000 });

  const option = optionsList
    .locator('.cometchat-message-composer__attachment-option')
    .filter({
      has: page.locator(`.cometchat-message-composer__attachment-option-title:has-text("${optionLabel}")`),
    })
    .first();
  await expect(option).toBeVisible({ timeout: 3_000 });

  const fixture = MEDIA_FIXTURES[optionLabel];
  const source = filePath ?? fixturePath(fixture.file);
  const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 5_000 });
  await option.click();
  const fileChooser = await fileChooserPromise;
  if (name) {
    const { readFile } = await import('node:fs/promises');
    await fileChooser.setFiles({ name, mimeType: fixture.mimeType, buffer: await readFile(source) });
  } else {
    await fileChooser.setFiles(source);
  }

  // The file stages to the tray; wait for it to appear and for uploads to finish.
  const tray = page.locator('.cometchat-message-composer__tray').first();
  await expect(tray).toBeVisible({ timeout: 10_000 });
  await expect(tray.locator('.cometchat-message-composer__tray-progress')).toHaveCount(0, {
    timeout: 60_000,
  });

  // Send the staged attachment. The bubble renders optimistically before the
  // server accepts the message, so also wait for the send request to succeed —
  // otherwise the test can end (and close the page) while the send is in flight.
  const sendBtn = page.locator('.cometchat-message-composer__send-button--active').first();
  await expect(sendBtn).toBeVisible({ timeout: 5_000 });
  await expectSendAccepted(page, () => sendBtn.click());

  // Tray clears once sent.
  await expect(tray).not.toBeVisible({ timeout: 15_000 });
}
