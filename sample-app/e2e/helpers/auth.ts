import { Page, expect, test } from '@playwright/test';

type StoredEntry = { name: string; value: string };

/**
 * Each user's logged-in browser storage, saved after their first UI login in this worker.
 * A fresh UI login costs about 4 s against about 2 s for a page that starts with a stored
 * session, so later logins load the saved storage instead (opt out with `{ fresh: true }`).
 */
const savedSessions = new Map<string, StoredEntry[]>();

export const TEST_USERS = {
  primary: 'e2e-user-1',
  secondary: 'e2e-user-2',
  tertiary: 'e2e-user-3',
} as const;

/**
 * Log in to the sample app as the given user.
 *
 * Handles:
 * 1. Credentials page (if shown) → fills App ID, Auth Key, selects region, submits
 * 2. Login page → enters UID and clicks Login
 * 3. Waits for home screen (conversations visible)
 *
 * After a user's first UI login, later calls start a fresh page with that user's saved
 * session instead, like a returning visitor. `{ fresh: true }` always goes through the UI.
 */
export async function loginToApp(page: Page, uid?: string, options: { fresh?: boolean } = {}): Promise<void> {
  const userUid = uid ?? TEST_USERS.primary;
  const appId = process.env.COMETCHAT_APP_ID ?? '';
  const authKey = process.env.COMETCHAT_AUTH_KEY ?? '';
  const region = process.env.COMETCHAT_REGION ?? 'us';

  const fresh = options.fresh === true || process.env.E2E_FRESH_LOGIN === '1';
  if (!fresh && (await restoreSavedSession(page, userUid, appId))) {
    test.info().annotations.push({ type: 'login', description: `${userUid}: restored saved session` });
    return;
  }

  await page.goto('/');

  // Wait for either credentials page, login page, or home to appear
  await page.waitForSelector(
    '.cometchat-credentials__form, .cometchat-login__container, .cometchat-conversations',
    { timeout: 30_000 }
  );

  // If already on home (session restored), we're done
  const isHome = await page.locator('.cometchat-conversations').isVisible().catch(() => false);
  if (isHome) return;

  // Handle credentials page
  const isCredentials = await page.locator('.cometchat-credentials__form').isVisible().catch(() => false);
  if (isCredentials) {
    // Select region
    const regionEl = page.locator(`.cometchat-credentials__region-text:has-text("${region.toUpperCase()}")`).first();
    const hasRegion = await regionEl.isVisible().catch(() => false);
    if (hasRegion) await regionEl.click();

    // Fill App ID
    await page.locator('#appId-input').fill(appId);
    // Fill Auth Key
    await page.locator('#authKey-input').fill(authKey);
    // Submit
    await page.locator('.cometchat-credentials__button').click();

    // Wait for login page
    await page.waitForSelector('.cometchat-login__container', { timeout: 30_000 });
  }

  // Login page — fill UID and submit
  await page.locator('#uid-input').fill(userUid);
  await page.locator('.cometchat-login__submit-button').click();

  // Wait for home screen (conversations visible)
  await page.waitForSelector('.cometchat-conversations', { timeout: 60_000 });

  // Reload so the chat websocket is authenticated. DO NOT REMOVE — without it
  // realtime is silently dead for the whole session.
  //
  // The SDK opens the socket during init() because autoEstablishSocketConnection
  // defaults to true. In a fresh browser context that happens before anyone is
  // logged in, and the socket's auth step is a no-op when getLoggedinUser()
  // resolves to null — so no auth frame is ever sent. Logging in afterwards does
  // not fix it: the post-login re-auth is skipped when the transport is already
  // CONNECTED. The socket then stays open but unauthenticated, and every frame
  // comes back {"error":"Unauthorized"}.
  //
  // Reloading re-runs init() with the session now persisted, so getLoggedinUser()
  // resolves and the socket authenticates. Manual testing never hits this because
  // it reuses a stored session; a fresh Playwright context hits it every run.
  await page.reload();
  await page.waitForSelector('.cometchat-conversations', { timeout: 60_000 });
  test.info().annotations.push({ type: 'login', description: `${userUid}: UI login` });

  const origin = new URL(page.url()).origin;
  const state = await page.context().storageState();
  const entries = state.origins.find(o => o.origin === origin)?.localStorage ?? [];
  if (entries.length > 0) savedSessions.set(userUid, entries);
}

/**
 * Open the app on a page that hasn't navigated yet with the user's saved session already in
 * localStorage, so the SDK initialises logged in (which is also why no reload is needed).
 * Returns false, leaving the page untouched, when there's nothing to restore or it didn't take.
 */
async function restoreSavedSession(page: Page, userUid: string, appId: string): Promise<boolean> {
  const entries = savedSessions.get(userUid);
  if (!entries || page.url() !== 'about:blank') return false;

  // Seed once per tab, before the app's scripts run; later reloads keep whatever the test did.
  await page.addInitScript(stored => {
    if (window.sessionStorage.getItem('e2e-session-restored')) return;
    for (const { name, value } of stored) window.localStorage.setItem(name, value);
    window.sessionStorage.setItem('e2e-session-restored', '1');
  }, entries);
  // Opening a chat while the SDK is still connecting can leave the message list blank (a known
  // issue), and a restored session makes the app usable sooner than a UI login does. So also
  // wait, up to 10 s, until the chat websocket has received its first frame. An "Unauthorized"
  // first frame means realtime would be dead for the whole test, so that counts as a failed restore.
  const socketFrame = new Promise<'ok' | 'unauthorized'>(resolve => {
    page.on('websocket', socket => {
      if (!/cometchat/i.test(socket.url())) return;
      socket.once('framereceived', ({ payload }) =>
        resolve(/unauthori[sz]ed/i.test(String(payload)) ? 'unauthorized' : 'ok')
      );
    });
  });
  // The stored token may have been revoked since (a test that logs out does that), and the app
  // still renders from the stored user. The conversations request proves the server accepts it.
  // 15 s from navigation: a restore normally gets it within about 2 s, and a miss only costs
  // the UI login, not a test timeout.
  const conversationsStatus = page
    .waitForResponse(response => new URL(response.url()).pathname.endsWith('/conversations'), { timeout: 15_000 })
    .then(response => (response.ok() ? 'ok' : `HTTP ${response.status()}`))
    .catch(() => 'no conversations request within 15 s');
  await page.goto('/');
  await expect(
    page.locator('.cometchat-credentials__form, .cometchat-login__container, .cometchat-conversations').first()
  ).toBeVisible({ timeout: 30_000 });

  const restoredUid = await page.evaluate(key => {
    try {
      // The SDK stores the user as JSON, then JSON-encodes that string again.
      let parsed: unknown = window.localStorage.getItem(key);
      while (typeof parsed === 'string') parsed = JSON.parse(parsed);
      return parsed && typeof parsed === 'object' && 'uid' in parsed ? String(parsed.uid) : null;
    } catch {
      return null;
    }
  }, `${appId}:common_store/user`);
  let problem: string | null = null;
  if (restoredUid !== userUid) problem = `stored user is ${restoredUid ?? 'missing'}`;
  else if (!(await page.locator('.cometchat-conversations').isVisible())) problem = 'the app did not open signed in';
  else {
    const conversations = await conversationsStatus;
    if (conversations !== 'ok') problem = `conversations: ${conversations}`;
    else {
      const timeout = new Promise<'timeout'>(resolve => setTimeout(() => resolve('timeout'), 10_000));
      if ((await Promise.race([socketFrame, timeout])) === 'unauthorized') {
        problem = 'the chat websocket answered Unauthorized';
      }
    }
  }
  if (problem === null) return true;

  // The saved session didn't take: fall back to the UI login, and say why, so a run that
  // silently stops restoring (an SDK storage change, say) is visible in the log and report.
  console.warn(`[e2e] saved session for ${userUid} not used (${problem}); signing in through the UI`);
  test.info().annotations.push({ type: 'login-fallback', description: `${userUid}: ${problem}` });
  savedSessions.delete(userUid);
  await page.evaluate(() => {
    window.localStorage.clear();
  });
  return false;
}
