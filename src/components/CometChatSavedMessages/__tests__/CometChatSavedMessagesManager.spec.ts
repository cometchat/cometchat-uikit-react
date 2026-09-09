import { describe, it, expect, vi, afterEach } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  CometChatSavedMessagesManager,
  SAVED_MESSAGES_PAGE_SIZE,
} from '../CometChatSavedMessagesManager';

/** Tracks the manager's own page size — hard-coding it made these brittle. */
const LIMIT = SAVED_MESSAGES_PAGE_SIZE;

/** A page of n placeholder messages. */
function page(n: number): CometChat.BaseMessage[] {
  return Array.from(
    { length: n },
    (_, i) => ({ getId: () => i }) as unknown as CometChat.BaseMessage
  );
}

/** Mock the builder so `fetchPrevious` yields the given pages in order. */
function mockPages(pages: CometChat.BaseMessage[][]) {
  let call = 0;
  const fetchPrevious = vi.fn(() => Promise.resolve(pages[call++] ?? []));
  vi.spyOn(CometChat, 'MessagesRequestBuilder').mockImplementation(() => {
    const builder = {
      setLimit: () => builder,
      setSaved: () => builder,
      build: () => ({ fetchPrevious }),
    };
    return builder as unknown as CometChat.MessagesRequestBuilder;
  });
  return fetchPrevious;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('CometChatSavedMessagesManager — paging follows the server', () => {
  it('reports more when a page comes back full', async () => {
    // A full page means the server may have a cursor; we cannot tell from here.
    mockPages([page(LIMIT)]);
    const manager = new CometChatSavedMessagesManager();
    const result = await manager.fetchFirst();
    expect(result.messages).toHaveLength(LIMIT);
    expect(result.hasMore).toBe(true);
  });

  it('reports no more when the first page comes back short', async () => {
    mockPages([page(LIMIT - 1)]);
    const manager = new CometChatSavedMessagesManager();
    const result = await manager.fetchFirst();
    expect(result.hasMore).toBe(false);
  });

  it('pages through a cursor until the tail is short', async () => {
    const fetchPrevious = mockPages([page(LIMIT), page(LIMIT), page(LIMIT - 1)]);
    const manager = new CometChatSavedMessagesManager();

    const first = await manager.fetchFirst();
    expect(first.hasMore).toBe(true);
    const second = await manager.fetchNext();
    expect(second.hasMore).toBe(true);
    const third = await manager.fetchNext();
    expect(third.messages).toHaveLength(LIMIT - 1);
    expect(third.hasMore).toBe(false);

    expect(fetchPrevious).toHaveBeenCalledTimes(3);
  });

  it('settles when the server sent no cursor and the next page is empty', async () => {
    // The no-cursor shape: a full first page, then nothing. Costs one extra call,
    // which is the price of the server not telling us up front.
    mockPages([page(LIMIT), []]);
    const manager = new CometChatSavedMessagesManager();

    expect((await manager.fetchFirst()).hasMore).toBe(true);
    const second = await manager.fetchNext();
    expect(second.messages).toHaveLength(0);
    expect(second.hasMore).toBe(false);
  });

  it('stops asking once exhausted', async () => {
    const fetchPrevious = mockPages([page(1)]);
    const manager = new CometChatSavedMessagesManager();

    await manager.fetchFirst();
    await manager.fetchNext();
    await manager.fetchNext();

    // One real call — the rest short-circuit rather than hammering an empty tail.
    expect(fetchPrevious).toHaveBeenCalledTimes(1);
  });

  it('does nothing before a read has been started', async () => {
    mockPages([page(1)]);
    const manager = new CometChatSavedMessagesManager();
    expect(await manager.fetchNext()).toEqual({ messages: [], hasMore: false });
  });

  it('reset allows a fresh read after exhaustion', async () => {
    const fetchPrevious = mockPages([page(1), page(1)]);
    const manager = new CometChatSavedMessagesManager();

    await manager.fetchFirst();
    manager.reset();
    await manager.fetchFirst();

    expect(fetchPrevious).toHaveBeenCalledTimes(2);
  });
});
