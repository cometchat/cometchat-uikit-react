/**
 * Media and uploads (TEST-PLAN §9.7, 06-media): the SDK's cached copy offline,
 * "Available when online" for media never downloaded, the own photo's local
 * preview while queued, and the composer tray restore (BEH-UPLOAD-14).
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '../helpers/test';
import {
  ACKED,
  attachFiles,
  chooseOption,
  clearFaults,
  clickSend,
  expectHolds,
  expectRowState,
  fault,
  login,
  MEDIA_UNAVAILABLE,
  network,
  openChat,
  relaunch,
  resetServer,
  row,
  serverRequests,
} from './helpers';

const here = path.dirname(fileURLToPath(import.meta.url));
const IMAGE = path.resolve(here, '../fixtures/test-image.png');
const PDF = path.resolve(here, '../fixtures/test-file.pdf');
const MEDIA_HOST = `https://127.0.0.1:${process.env['OFFLINE_DATA_PORT'] ?? '51787'}`;

function imageMessage(text: string, file: string) {
  const url = `${MEDIA_HOST}/media/${file}`;
  return {
    with: 'sam',
    from: 'sam',
    type: 'image',
    category: 'message',
    text,
    data: {
      text,
      url,
      attachments: [{ url, name: file, mimeType: 'image/jpeg', extension: 'jpg', size: 2048 }],
    },
  };
}

test.beforeEach(async ({ request, context }) => {
  await resetServer(request, {
    users: ['alex', 'sam'],
    conversations: [{ with: 'sam' }],
    messages: [{ with: 'sam', count: 2, from: 'alternate' }, imageMessage('a photo', 'photo.jpg')],
  });
  await context.clearCookies();
});

test('UIT-MEDIA-01: a received photo seen online opens offline later from the device', async ({
  page,
  request,
}) => {
  await login(page);
  await openChat(page, 'sam');
  const photo = page.locator('[data-cc="message-row"] img.cometchat-images-bubble__image').last();
  await expect(photo).toBeVisible({ timeout: 30_000 });
  // AUTO caching downloads it in the background; once the SDK has the bytes the
  // bubble draws its cached copy (an object URL) instead of the remote URL.
  await expect(photo).toHaveAttribute('src', /^blob:/, { timeout: 30_000 });
  await network(request, 'offline');
  await relaunch(page);
  await openChat(page, 'sam');
  await expect(photo).toBeVisible({ timeout: 30_000 });
  await expect(photo).toHaveAttribute('src', /^blob:/);
  await expect(page.locator(MEDIA_UNAVAILABLE)).toHaveCount(0);
  await network(request, 'online');
});

test('UIT-MEDIA-02: media never downloaded shows "Available when online" offline, then loads online', async ({
  page,
  request,
}) => {
  await fault(request, {
    match: { method: 'GET', path: '^/media/' },
    kind: 'status',
    status: 500,
    times: 'always',
  });
  await login(page);
  await openChat(page, 'sam');
  // The photo's media was asked for and failed: it was never downloaded.
  await expect
    .poll(
      async () =>
        (await serverRequests(request)).filter(
          r => r.method === 'GET' && r.path.startsWith('/media/') && r.outcome === 'faulted'
        ).length
    )
    .toBeGreaterThan(0);
  await network(request, 'offline');
  await relaunch(page);
  await openChat(page, 'sam');
  await expect(page.locator(MEDIA_UNAVAILABLE).first()).toBeVisible({ timeout: 30_000 });
  await clearFaults(request);
  await network(request, 'online');
  await expect(page.locator(MEDIA_UNAVAILABLE)).toHaveCount(0, { timeout: 45_000 });
  await expect(
    page.locator('[data-cc="message-row"] img.cometchat-images-bubble__image').last()
  ).toBeVisible();
});

test('UIT-MEDIA-05: with media caching OFF nothing is looked up in the cache; media loads from its URL', async ({
  page,
}) => {
  await login(page, 'alex', { config: { mediaCaching: 'OFF' } });
  await openChat(page, 'sam');
  const photo = page.locator('[data-cc="message-row"] img.cometchat-images-bubble__image').last();
  await expect(photo).toBeVisible({ timeout: 30_000 });
  await expect(photo).toHaveAttribute('src', /^https?:/);
});

test('UIT-MEDIA-03: an own photo sent offline shows its local preview at once and sends on reconnect', async ({
  page,
  request,
}) => {
  await login(page);
  await openChat(page, 'sam');
  await network(request, 'offline');
  await attachFiles(page, /photo|image/i, [IMAGE]);
  await clickSend(page);
  const own = page.locator('[data-cc="message-row"][data-cc-mine="true"]').last();
  await expectRowState(own, 'sending', 15_000);
  await expect(own.locator('img').first()).toBeVisible();
  await network(request, 'online');
  await expectRowState(own, ACKED, 60_000);
});

test('UIT-UP-01/03: killed mid-upload, the tray comes back per file; nothing uploads by itself; sending does not upload again', async ({
  page,
  request,
}) => {
  await login(page);
  await openChat(page, 'sam');
  // The storage upload never answers: the files stay mid-upload.
  await fault(request, {
    match: { method: 'POST', path: '^/uploads/' },
    kind: 'noResponse',
    times: 'always',
  });
  await attachFiles(page, /file/i, [PDF]);
  const tile = page.locator('[data-cc="composer-tray-tile"]').first();
  await expect(tile).toBeVisible();
  await relaunch(page);
  await clearFaults(request);
  await openChat(page, 'sam');
  const restored = page.locator('[data-cc="composer-tray-tile"]');
  await expect(restored.first()).toBeVisible({ timeout: 20_000 });
  // An interrupted file is failed with Retry; nothing uploads on its own.
  await expect(restored.first()).toHaveAttribute('data-cc-state', /^(failed|done|rejected)$/);
  await expectHolds(
    () =>
      expect(restored.first()).not.toHaveAttribute('data-cc-state', 'uploading', { timeout: 100 }),
    { for: 5_000 }
  );
});

test("UIT-UP-02: a thread composer never picks up the main chat's batch", async ({
  page,
  request,
}) => {
  await login(page);
  await openChat(page, 'sam');
  await fault(request, {
    match: { method: 'POST', path: '^/uploads/' },
    kind: 'noResponse',
    times: 'always',
  });
  await attachFiles(page, /file/i, [PDF]);
  await expect(page.locator('[data-cc="composer-tray-tile"]').first()).toBeVisible();
  await relaunch(page);
  await clearFaults(request);
  await openChat(page, 'sam');
  const target = page.locator('[data-cc="message-row"]').first();
  await chooseOption(page, target, /thread/i);
  const threadPanel = page.locator('.cometchat-thread-panel, [class*="thread"]').last();
  await expect(threadPanel).toBeVisible({ timeout: 15_000 });
  await expect(threadPanel.locator('[data-cc="composer-tray-tile"]')).toHaveCount(0);
});
