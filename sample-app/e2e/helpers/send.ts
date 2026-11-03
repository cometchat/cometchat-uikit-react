import { Locator, Page, expect } from '@playwright/test';

/** The conversation's main message list, and the open thread's reply list. */
export const MAIN_LIST = '.cometchat-messages-wrapper .cometchat-message-list';
export const THREAD_LIST = '.cometchat-thread-panel__messages';

/** Receipt states that mean the server accepted the message (it has an id and sentAt). */
const ACCEPTED = '.cometchat-receipts-sent, .cometchat-receipts-delivered, .cometchat-receipts-read';
const FAILED = '.cometchat-receipts-error';

const PENDING = '.cometchat-receipts-wait';

type SendState = 'pending' | 'sent' | 'failed';

/** 'none' = the bubble renders no receipt (e.g. a non-final bubble of a grouped batch). */
async function stateOf(bubble: Locator): Promise<SendState | 'none'> {
  if ((await bubble.locator(FAILED).count()) > 0) return 'failed';
  if ((await bubble.locator(PENDING).count()) > 0) return 'pending';
  if ((await bubble.locator(ACCEPTED).count()) > 0) return 'sent';
  return 'none';
}

/**
 * Run `action` (a click on Send, an Enter keypress, a sticker click, …) and wait
 * until every outgoing bubble it adds to `list` shows that the server accepted it.
 *
 * Bubbles render optimistically with a pending receipt (`cometchat-receipts-wait`),
 * so a test that only waits for the bubble can finish — and close its page — while
 * the send is still in flight, silently aborting it. The receipt flips to
 * sent/delivered/read once the server assigns the message an id; an error receipt
 * fails the test immediately. Covers single sends and multi-attachment batches (one
 * bubble per file) without depending on how the SDK sends the message.
 */
export async function expectSendAccepted(
  page: Page,
  action: () => Promise<void>,
  { list = MAIN_LIST, timeout = 60_000, text }: { list?: string; timeout?: number; text?: string } = {}
): Promise<void> {
  const outgoing = page.locator(`${list} .cometchat-message-bubble__wrapper--outgoing`);
  if (text) {
    // When the text is known, judge that exact message. Counting "bubbles after
    // index N" is unreliable while the list is still loading history.
    const mine = outgoing.filter({ hasText: text }).last();
    await action();
    await expect(mine, 'no outgoing message with that text appeared').toBeVisible({ timeout: 15_000 });
    await expect
      .poll(() => stateOf(mine), { message: 'message never left the pending state', timeout })
      .not.toMatch(/^(pending|none)$/);
    expect(await stateOf(mine), 'message send failed (error receipt)').toBe('sent');
    return;
  }
  const before = await outgoing.count();

  await action();

  await expect
    .poll(() => outgoing.count(), { message: 'no new outgoing message appeared', timeout: 15_000 })
    .toBeGreaterThan(before);

  // Grouped batches show the receipt only on their last bubble, so bubbles without a
  // receipt are ignored — but at least one new bubble must show an accepted receipt.
  const newBubblesState = async (): Promise<SendState> => {
    const states: (SendState | 'none')[] = [];
    const total = await outgoing.count();
    for (let i = before; i < total; i++) states.push(await stateOf(outgoing.nth(i)));
    if (states.includes('failed')) return 'failed';
    if (states.includes('pending') || !states.includes('sent')) return 'pending';
    return 'sent';
  };

  // Settles on the first non-pending answer, so an error fails fast.
  await expect
    .poll(newBubblesState, { message: 'message never left the pending state', timeout })
    .not.toBe('pending');
  expect(await newBubblesState(), 'message send failed (error receipt)').toBe('sent');
}
