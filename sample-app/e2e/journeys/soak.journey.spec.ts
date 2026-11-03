import { test, expect } from '../helpers/test';
import { loginToApp, PRIMARY_USER, SECONDARY_USER } from '../helpers';
import { createThrowawayGroup, ThrowawayGroup } from '../helpers/fixtures';
import { sendMessageToGroup } from '../helpers/pinSave';
import { closeThread, openThreadFor, sendThreadReply } from '../helpers/threads';
import { bubblesContaining, conversationRow, HEADER_TITLE, openChatsTab, sendFromComposer } from './journey-helpers';

/**
 * Journey 4 — a long, busy session.
 *
 * Dozens of actions in one session: sends, thread replies, switching chats.
 * Afterwards an incoming message must render exactly once (a leaked listener
 * would render it twice), no console errors may have piled up, and the JS heap
 * must not have grown without bound.
 */

/** Generous on purpose — this catches leaks, not normal growth. Tune with data. */
const MAX_HEAP_GROWTH_MB = 60;

let main: ThrowawayGroup;
let side: ThrowawayGroup;

test.beforeEach(async () => {
  const tag = Date.now();
  main = await createThrowawayGroup({ name: `E2E Soak main ${tag}` });
  side = await createThrowawayGroup({ name: `E2E Soak side ${tag}` });
  await sendMessageToGroup({ guid: main.guid, as: PRIMARY_USER, text: `Soak start [${tag}]` });
  await sendMessageToGroup({ guid: side.guid, as: PRIMARY_USER, text: `Soak side [${tag}]` });
});

test.afterEach(async () => {
  await main.dispose();
  await side.dispose();
});

test('a long session stays correct: no duplicate renders, no error build-up, bounded memory', async ({ page }) => {
  test.setTimeout(600_000);
  const tag = Date.now();
  const consoleErrors: string[] = [];
  page.on('console', m => {
    // Network noise is not an app error.
    if (m.type() === 'error' && !/net::ERR_|Failed to load resource|WebSocket/.test(m.text())) consoleErrors.push(m.text());
  });
  page.on('pageerror', e => consoleErrors.push(`pageerror: ${e.message}`));

  const cdp = await page.context().newCDPSession(page);
  const heapMb = async () => {
    await cdp.send('HeapProfiler.collectGarbage');
    const { usedSize } = await cdp.send('Runtime.getHeapUsage');
    return usedSize / 1024 / 1024;
  };

  const openMain = async () => {
    await conversationRow(page, main.name).click();
    await expect(page.locator(HEADER_TITLE).first()).toContainText(main.name, { timeout: 15_000 });
  };

  await loginToApp(page);
  await openChatsTab(page);
  await openMain();
  const heapStart = await heapMb();

  await test.step('15 rounds of sending, threading and switching chats', async () => {
    for (let round = 0; round < 15; round++) {
      const text = `Soak ${String(round)} [${tag}]`;
      await sendFromComposer(page, text);

      if (round % 5 === 4) {
        await openThreadFor(page, bubblesContaining(page, text).last());
        await sendThreadReply(page, `Soak reply ${String(round)} [${tag}]`);
        await closeThread(page);
      }
      if (round % 3 === 2) {
        await conversationRow(page, side.name).click();
        await expect(page.locator(HEADER_TITLE).first()).toContainText(side.name, { timeout: 15_000 });
        await openMain();
      }
    }
  });

  await test.step('an incoming message renders exactly once', async () => {
    const incoming = `Incoming after soak [${tag}]`;
    await sendMessageToGroup({ guid: main.guid, as: SECONDARY_USER, text: incoming });
    await expect(bubblesContaining(page, incoming)).toHaveCount(1, { timeout: 15_000 });
    // Give a duplicate listener time to render a second copy, then check again.
    await expect.poll(() => bubblesContaining(page, incoming).count(), { intervals: [1_000], timeout: 4_000 }).toBe(1);
  });

  await test.step('no console errors piled up', async () => {
    expect(consoleErrors).toEqual([]);
  });

  await test.step('heap growth is bounded', async () => {
    const growth = (await heapMb()) - heapStart;
    test.info().annotations.push({ type: 'heap growth (MB)', description: growth.toFixed(1) });
    expect(growth).toBeLessThan(MAX_HEAP_GROWTH_MB);
  });
});
