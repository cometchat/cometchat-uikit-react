/**
 * Shared driver for the offline E2E suite (offline TEST-PLAN §4): the sample
 * app in `vite --mode offline-e2e` (the kit built from ../src with the frame
 * probe on) against the harness's fake CometChat server on this kit's ports.
 *
 * The runner reads the screen through the kit's state contract (TEST-PLAN
 * §3.3, `data-cc` / `data-cc-*`), the server's request log, the kit's public
 * events (recorded by the sample app's E2EEventRecorder on `window.__ccEvents`)
 * and the frame log (`window.__ccFrames`, filled by the kit's frame probe).
 */
import { setTimeout as delay } from 'node:timers/promises';
import { expect, type APIRequestContext, type Locator, type Page } from '@playwright/test';

/** React's fake-server ports (51787 data, 51788 realtime, 51789 control). */
export const CONTROL = `http://127.0.0.1:${process.env['OFFLINE_CONTROL_PORT'] ?? '51789'}`;

/** alex (the user under test) has chats with sam and bea, and a group "team". */
export const FIXTURES = {
  users: ['alex', 'sam', 'bea'],
  groups: [{ guid: 'team', name: 'Team', members: ['alex', 'sam', 'bea'] }],
  conversations: [{ with: 'sam' }, { with: 'bea' }, { with: { guid: 'team' } }],
  messages: [
    { with: 'sam', count: 4, from: 'alternate' },
    { with: 'bea', count: 2, from: 'alternate' },
    { with: { guid: 'team' }, count: 2, from: 'sam' },
  ],
};

/** One request as the fake server's `GET /requests` reports it. */
export interface ServerRequest {
  seq?: number;
  method: string;
  path: string;
  query?: Record<string, string>;
  body?: unknown;
  outcome?: string;
  status?: number;
}

/** One kit event as the sample app's E2E recorder logs it. */
export interface RecordedEvent {
  type: string;
  status?: string;
  state?: string;
  reason?: string;
  muid?: string;
  localMessageId?: string;
  id?: number;
  pendingMessagesLost?: number | null;
}

/** One committed message-list frame from the kit's frame probe. */
export interface Frame {
  t: number;
  list: string;
  rows: { key: string; id: string; state: string; mine: boolean }[];
}

export const CONVERSATION_ROW = '[data-cc="conversation-row"]';
export const MESSAGE_ROW = '[data-cc="message-row"]';
export const COMPOSER_INPUT = '[data-cc="composer-input"]';
export const MESSAGE_LIST = '[data-cc="message-list"]';
export const NOTICE = '[data-cc="notice"]';
export const RETRY_BUTTON = '[data-testid="offline-retry"]';
export const MEDIA_UNAVAILABLE = '[data-testid="offline-media-unavailable"]';

/** Option ids (`data-cc-options`) the unsent-row menu shows (BEH-SEND-37, R162). */
export const OPTION = {
  retry: 'retry-message',
  discard: 'discard-message',
} as const;

// --- Server control plane ---

export async function control(
  request: APIRequestContext,
  path: string,
  body: unknown = {}
): Promise<unknown> {
  const response = await request.post(`${CONTROL}${path}`, { data: body });
  expect(response.ok(), `control ${path} answered ${String(response.status())}`).toBeTruthy();
  return response.json().catch(() => ({}));
}

export async function resetServer(
  request: APIRequestContext,
  fixtures: unknown = FIXTURES
): Promise<void> {
  await control(request, '/reset', { fixtures });
}

export async function network(
  request: APIRequestContext,
  state: 'online' | 'offline'
): Promise<void> {
  await control(request, '/network', { state });
}

export async function fault(
  request: APIRequestContext,
  spec: Record<string, unknown>
): Promise<void> {
  await control(request, '/fault', spec);
}

export async function clearFaults(request: APIRequestContext): Promise<void> {
  await request.delete(`${CONTROL}/fault`);
}

export async function release(request: APIRequestContext, match?: unknown): Promise<void> {
  await control(request, '/release', match ? { match } : {});
}

export async function push(request: APIRequestContext, frames: unknown): Promise<void> {
  await control(request, '/push', frames);
}

export async function seed(
  request: APIRequestContext,
  fixtures: Record<string, unknown>
): Promise<void> {
  await control(request, '/fixtures', { ...fixtures, merge: true });
}

export async function serverRequests(request: APIRequestContext): Promise<ServerRequest[]> {
  const response = await request.get(`${CONTROL}/requests`);
  const body = (await response.json()) as ServerRequest[] | { requests?: ServerRequest[] };
  return Array.isArray(body) ? body : (body.requests ?? []);
}

/** The highest request seq so far: later requests are `> mark`. */
export async function requestMark(request: APIRequestContext): Promise<number> {
  return Math.max(0, ...(await serverRequests(request)).map(r => Number(r.seq) || 0));
}

export async function requestsAfter(
  request: APIRequestContext,
  mark: number
): Promise<ServerRequest[]> {
  return (await serverRequests(request)).filter(r => (Number(r.seq) || 0) > mark);
}

/**
 * The SDK sweep's conversation reads the server answered. The sweep reads the
 * conversations with its own page size (100); the conversation list reads 30.
 */
export function sweepReads(requests: ServerRequest[]): ServerRequest[] {
  return requests.filter(
    r =>
      r.method === 'GET' &&
      r.path === '/conversations' &&
      r.query?.['per_page'] === '100' &&
      r.outcome === 'answered'
  );
}

/**
 * The fake server's socket log (`method: 'WS'`): `connect` is a socket the server
 * accepted, `close` one that went (a network flip cuts every socket at once),
 * `auth` the SDK's login frame on a socket, after which pushes reach it.
 */
export function socketEvents(
  requests: ServerRequest[],
  kind: 'connect' | 'close' | 'auth'
): ServerRequest[] {
  return requests.filter(r => {
    if (r.method !== 'WS' || r.outcome !== 'answered') return false;
    if (kind === 'auth') {
      return r.path === 'frame' && (r.body as { type?: string } | null)?.type === 'auth';
    }
    return r.path === kind;
  });
}

/** Wait until the server log shows a socket event of `kind` after `mark`. */
export async function expectSocketEvent(
  request: APIRequestContext,
  mark: number,
  kind: 'connect' | 'close' | 'auth',
  timeout = 30_000
): Promise<void> {
  await expect
    .poll(async () => socketEvents(await requestsAfter(request, mark), kind).length, {
      message: `a socket ${kind} after request #${String(mark)}`,
      timeout,
    })
    .toBeGreaterThan(0);
}

/** Message sends (1:1, group or thread) carrying `text`. */
export function messageSends(requests: ServerRequest[], text: string): ServerRequest[] {
  return requests.filter(
    r =>
      r.method === 'POST' &&
      /^\/messages(\/\d+\/thread)?$/.test(r.path) &&
      JSON.stringify(r.body ?? '').includes(text)
  );
}

/** Sends the server actually took (not refused while offline, not answered with an error). */
export function acceptedSends(requests: ServerRequest[], text: string): ServerRequest[] {
  return messageSends(requests, text).filter(
    r => r.outcome !== 'refused' && (r.status === undefined || r.status < 400)
  );
}

/** The message-list reads of a 1:1 chat (the kit's own fetches; the SDK sweep reads the changelog). */
export function chatReads(requests: ServerRequest[], uid: string): ServerRequest[] {
  return requests.filter(r => r.method === 'GET' && r.path === `/users/${uid}/messages`);
}

// --- App ---

export interface AppOptions {
  /** Offline support on (default) or off (`?offline=0`). */
  offline?: boolean;
  /** Extra offline settings, e.g. `{maxPendingMessages: 2}`. */
  config?: Record<string, unknown>;
}

export function appUrl(options: AppOptions = {}): string {
  const params = new URLSearchParams();
  params.set('offline', options.offline === false ? '0' : '1');
  if (options.config) params.set('offlineConfig', JSON.stringify(options.config));
  return `/?${params.toString()}`;
}

/** Record every committed message-list frame and every kit event from the first paint on. */
export async function installProbes(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const w = window as unknown as {
      __ccFrames: unknown[];
      __ccFrameProbe: (frame: { list: string; rows: unknown[] }) => void;
    };
    w.__ccFrames = [];
    w.__ccFrameProbe = frame => {
      w.__ccFrames.push({ t: performance.now(), ...frame });
    };
  });
}

export async function login(page: Page, uid = 'alex', options: AppOptions = {}): Promise<void> {
  await installProbes(page);
  await page.goto(appUrl(options));
  await page.locator('#uid-input').fill(uid);
  await page.locator('.cometchat-login__submit-button').click();
  await expect(page.locator(CONVERSATION_ROW).first()).toBeVisible({ timeout: 45_000 });
}

/**
 * Wait until the SDK has finished its first sweep: the server answered the
 * sweep's conversation read (`sweepReads`), which is what the first sweep of a
 * session reads. Until then the SDK has no changelog watermark, and a sweep
 * without one skips the changelog by design (cold start), so what changed while
 * away would not come. A real session is seldom this short.
 */
export async function afterFirstSweep(request: APIRequestContext): Promise<void> {
  await expect
    .poll(async () => sweepReads(await serverRequests(request)).length, {
      message: "the SDK's first sweep (GET /conversations?per_page=100 answered)",
      timeout: 30_000,
    })
    .toBeGreaterThan(0);
}

/**
 * Assert that something does NOT happen during an observation window ("no
 * re-send", "the count stays 5", "no notice"), for the cases where no later
 * event proves the window is over. Prefer such an event where there is one:
 * a following send acking, the sweep's request in the server log, a kit event.
 * To wait for something that DOES happen, use a web-first assertion or
 * `expect.poll` on it instead.
 *
 * `check` asserts the invariant with `expect` (throwing when it is broken). It
 * runs at once, then every `every` ms (default 250), and a last time once `for`
 * ms have passed; the test fails the moment one run throws. So the invariant is
 * checked throughout the window, not once at its end as "sleep, then check"
 * did, and a break is reported when it happens. The window length is part of
 * the test's claim ("nothing within 12 s"), not a guess at how long something
 * takes to arrive.
 *
 * The pause between two checks is the helper's one waiting primitive; an
 * observation window in a spec goes through this helper, not a sleep.
 */
export async function expectHolds(
  check: () => Promise<unknown> | unknown,
  options: { for: number; every?: number }
): Promise<void> {
  const every = options.every ?? 250;
  const end = Date.now() + options.for;
  for (;;) {
    await check();
    const left = end - Date.now();
    if (left <= 0) return;
    await delay(Math.min(every, left));
  }
}

/** A relaunch: the same browser context (IndexedDB kept), the restored session, no login. */
export async function relaunch(page: Page, options: AppOptions = {}): Promise<void> {
  await page.goto(appUrl(options));
  await expect(page.locator(CONVERSATION_ROW).first()).toBeVisible({ timeout: 45_000 });
}

export async function logout(page: Page): Promise<void> {
  await page.locator('.cometchat-conversations__header-menu button').first().click();
  await page.locator('.cometchat-conversations__header-menu-item--logout').first().click();
  await expect(page.locator('#uid-input')).toBeVisible({ timeout: 30_000 });
}

export function conversationRow(page: Page, peer: string): Locator {
  return page.locator(`${CONVERSATION_ROW}[data-cc-with="${peer}"]`).first();
}

export async function openChat(page: Page, peer: string, title = peer): Promise<void> {
  // The list ignores clicks while it is still loading its first page.
  await expect(page.locator('.cometchat-conversations__list').first()).toHaveAttribute(
    'aria-busy',
    'false'
  );
  await conversationRow(page, peer).click();
  await expect(page.locator('.cometchat-message-header__title').first()).toContainText(title, {
    ignoreCase: true,
  });
  await expect(page.locator(COMPOSER_INPUT).first()).toBeVisible();
}

export async function typeAndSend(page: Page, text: string): Promise<void> {
  const input = page.locator(COMPOSER_INPUT).first();
  await input.click();
  await input.pressSequentially(text);
  await input.press('Enter');
}

/** The last row whose visible text contains `text`. */
export function row(page: Page, text: string): Locator {
  return page.locator(MESSAGE_ROW, { hasText: text }).last();
}

export function rows(page: Page, text: string): Locator {
  return page.locator(MESSAGE_ROW, { hasText: text });
}

export async function expectRowState(
  locator: Locator,
  state: 'sending' | 'sent' | 'delivered' | 'read' | 'failed' | RegExp,
  timeout = 30_000
): Promise<void> {
  await expect(locator).toHaveAttribute('data-cc-state', state, { timeout });
}

/** Sent, delivered or read: anything past the server's ack. */
export const ACKED = /^(sent|delivered|read)$/;

/**
 * The option ids a row's menu offers (`data-cc-options`), or `[]` when the row
 * shows no options toolbar at all (e.g. SENDING).
 */
export async function optionIds(locator: Locator): Promise<string[]> {
  await locator.locator('.cometchat-message-bubble__body-wrapper').first().hover();
  const toolbar = locator.locator('[data-cc="message-options"]');
  if ((await toolbar.count()) === 0) return [];
  const value = (await toolbar.first().getAttribute('data-cc-options')) ?? '';
  return value ? value.split(',') : [];
}

/** Pick an option by its visible label from the quick items or the "More" menu. */
export async function chooseOption(page: Page, locator: Locator, label: RegExp): Promise<void> {
  await locator.locator('.cometchat-message-bubble__body-wrapper').first().hover();
  const menu = locator.locator('[data-cc="message-options"]').first();
  await expect(menu).toBeVisible();
  const quick = menu.locator('.cometchat-context-menu__top-menu-item');
  for (let i = 0; i < (await quick.count()); i++) {
    if (label.test((await quick.nth(i).getAttribute('aria-label')) ?? '')) {
      await quick.nth(i).click();
      return;
    }
  }
  const more = menu.locator('.cometchat-context-menu__trigger');
  if (await more.count()) {
    await more.first().click();
    const items = menu.locator('.cometchat-context-menu__dropdown [role="menuitem"]');
    await expect(items.first()).toBeVisible();
    for (let i = 0; i < (await items.count()); i++) {
      if (label.test(((await items.nth(i).textContent()) ?? '').trim())) {
        await items.nth(i).click();
        return;
      }
    }
  }
  throw new Error(`no option matching ${String(label)}`);
}

export async function notices(page: Page, key?: string): Promise<Locator> {
  return key ? page.locator(`${NOTICE}[data-cc-key="${key}"]`) : page.locator(NOTICE);
}

export async function listFooter(page: Page): Promise<string | null> {
  return page.locator(MESSAGE_LIST).first().getAttribute('data-cc-list-footer');
}

// --- Probes ---

export async function events(page: Page): Promise<RecordedEvent[]> {
  return page.evaluate(
    () => (window as unknown as { __ccEvents?: RecordedEvent[] }).__ccEvents ?? []
  );
}

export async function clearEvents(page: Page): Promise<void> {
  await page.evaluate(() => {
    (window as unknown as { __ccEvents?: unknown[] }).__ccEvents = [];
  });
}

export async function frames(page: Page): Promise<Frame[]> {
  return page.evaluate(() =>
    ((window as unknown as { __ccFrames?: Frame[] }).__ccFrames ?? []).filter(
      f => f.list === 'messages'
    )
  );
}

export async function clearFrames(page: Page): Promise<void> {
  await page.evaluate(() => {
    (window as unknown as { __ccFrames?: unknown[] }).__ccFrames = [];
  });
}

/** `noDuplicateKey`: no frame shows two rows with one key or one server id twice. */
export function expectNoDuplicateKey(log: Frame[]): void {
  for (const frame of log) {
    const keys = frame.rows.map(r => r.key);
    const ids = frame.rows.map(r => r.id).filter(Boolean);
    expect(new Set(keys).size, `duplicate key in a frame: ${keys.join(',')}`).toBe(keys.length);
    expect(new Set(ids).size, `duplicate server id in a frame: ${ids.join(',')}`).toBe(ids.length);
  }
}

/** `noFlash`: a row visible in two frames is visible in every frame between. */
export function expectNoFlash(log: Frame[]): void {
  const seen = new Map<string, number[]>();
  log.forEach((frame, index) => {
    for (const r of frame.rows) seen.set(r.key, [...(seen.get(r.key) ?? []), index]);
  });
  for (const [key, indexes] of seen) {
    const first = indexes[0] ?? 0;
    const last = indexes[indexes.length - 1] ?? 0;
    expect(indexes.length, `row ${key} flashed out between frames ${first} and ${last}`).toBe(
      last - first + 1
    );
  }
}

/** `noBlank`: the list is never empty between two non-empty frames. */
export function expectNoBlank(log: Frame[]): void {
  const sizes = log.map(f => f.rows.length);
  const firstFull = sizes.findIndex(n => n > 0);
  const lastFull = sizes.length - 1 - [...sizes].reverse().findIndex(n => n > 0);
  if (firstFull < 0) return;
  for (let i = firstFull; i <= lastFull; i++) {
    expect(sizes[i], `blank frame ${String(i)} between non-empty frames`).toBeGreaterThan(0);
  }
}

// --- Browser storage (web device half) ---

/** Names of the IndexedDB databases the page has. */
export async function indexedDbNames(page: Page): Promise<string[]> {
  return page.evaluate(async () =>
    indexedDB.databases ? (await indexedDB.databases()).map(d => d.name ?? '') : []
  );
}

/**
 * How many sealed cache keys the user's offline databases hold (records in their
 * `crypto_keys` stores). With `encryption: true` it is above 0 once the SDK
 * has stored the key, which `deleteOfflineCacheKey` then deletes.
 */
export async function offlineCacheKeyCount(page: Page): Promise<number> {
  return page.evaluate(async () => {
    const names = indexedDB.databases ? (await indexedDB.databases()).map(d => d.name ?? '') : [];
    let keys = 0;
    for (const name of names) {
      const db = await new Promise<IDBDatabase | null>(resolve => {
        const open = indexedDB.open(name);
        open.onsuccess = () => {
          resolve(open.result);
        };
        open.onerror = () => {
          resolve(null);
        };
      });
      if (!db) continue;
      if (db.objectStoreNames.contains('crypto_keys')) {
        keys += await new Promise<number>(resolve => {
          const count = db.transaction('crypto_keys').objectStore('crypto_keys').count();
          count.onsuccess = () => {
            resolve(count.result);
          };
          count.onerror = () => {
            resolve(0);
          };
        });
      }
      db.close();
    }
    return keys;
  });
}

/**
 * `device: keyLost` on the web (CONTRACT §2.6): delete the sealed cache key
 * from the user's offline database, so the next launch cannot open the cache
 * (BEH-ENC-15). Only meaningful with `encryption: true`.
 */
export async function deleteOfflineCacheKey(page: Page): Promise<number> {
  return page.evaluate(async () => {
    const names = indexedDB.databases ? (await indexedDB.databases()).map(d => d.name ?? '') : [];
    let cleared = 0;
    for (const name of names) {
      const db = await new Promise<IDBDatabase | null>(resolve => {
        const open = indexedDB.open(name);
        open.onsuccess = () => {
          resolve(open.result);
        };
        open.onerror = () => {
          resolve(null);
        };
      });
      if (!db) continue;
      if (db.objectStoreNames.contains('crypto_keys')) {
        await new Promise<void>(resolve => {
          const tx = db.transaction('crypto_keys', 'readwrite');
          tx.objectStore('crypto_keys').clear();
          tx.oncomplete = () => {
            resolve();
          };
          tx.onerror = () => {
            resolve();
          };
        });
        cleared++;
      }
      db.close();
    }
    return cleared;
  });
}

/** Pick files through the composer's attachment menu (`Photos & Videos`, `File`, ...). */
export async function attachFiles(page: Page, optionTitle: RegExp, files: string[]): Promise<void> {
  await page.locator('.cometchat-message-composer__attachment-button').first().click();
  const option = page
    .locator('.cometchat-message-composer__attachment-option')
    .filter({
      has: page.locator('.cometchat-message-composer__attachment-option-title', {
        hasText: optionTitle,
      }),
    })
    .first();
  const chooser = page.waitForEvent('filechooser', { timeout: 5_000 });
  await option.click();
  await (await chooser).setFiles(files);
}

export async function clickSend(page: Page): Promise<void> {
  await page.locator('.cometchat-message-composer__send-button').first().click();
}
