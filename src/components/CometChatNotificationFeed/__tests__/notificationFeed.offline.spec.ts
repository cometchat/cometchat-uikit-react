/**
 * The notification feed on the offline (ON) path (UIT-LIST-07, BEH-SNAP-09):
 * cached items first, the server page in place, deduped by id; offline past
 * the cache keeps the items, or shows the error view with none (D83); a category switch drops the old read; only server
 * items are reported delivered; OFF keeps today's single fetch.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { useCometChatNotificationFeed } from '../useCometChatNotificationFeed';
import { CometChatNotificationFeedManager } from '../CometChatNotificationFeedManager';
import type { NotificationFeedItem } from '../CometChatNotificationFeed.types';
import { OfflineHub } from '../../../utils/offline/hub';
import {
  installOfflineSdk,
  scriptedRead,
  type OfflineSdkFake,
  type ScriptedRead,
} from '../../../testing/offline-sdk-fake';

const item = (id: string) =>
  ({
    getId: () => id,
    getCategory: () => 'general',
    getSentAt: () => Math.floor(Date.now() / 1000),
    getReadAt: () => null,
  }) as unknown as NotificationFeedItem;
const ids = (list: NotificationFeedItem[]) => list.map(i => i.getId());

describe('useCometChatNotificationFeed offline', () => {
  let fake: OfflineSdkFake;
  let read: ScriptedRead;
  let delivered: ReturnType<typeof vi.spyOn>;
  let onConnected: (() => void) | undefined;

  beforeEach(() => {
    fake = installOfflineSdk({ enabled: true });
    onConnected = undefined;
    vi.spyOn(CometChat, 'addConnectionListener').mockImplementation(((
      _id: string,
      listener: { onConnected?: () => void }
    ) => {
      onConnected = listener.onConnected;
    }) as never);
    vi.spyOn(CometChat, 'removeConnectionListener').mockImplementation(() => undefined);
    vi.spyOn(CometChatNotificationFeedManager, 'fetchCategories').mockResolvedValue([]);
    vi.spyOn(CometChatNotificationFeedManager, 'fetchUnreadCount').mockResolvedValue(0);
    vi.spyOn(CometChatNotificationFeedManager, 'attachFeedListener').mockReturnValue(
      () => undefined
    );
    delivered = vi
      .spyOn(CometChatNotificationFeedManager, 'reportDelivered')
      .mockImplementation(() => undefined);
    read = scriptedRead('NotificationFeedItems');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fake.restore();
  });

  function mount(onError?: (error: unknown) => void) {
    return renderHook(() =>
      useCometChatNotificationFeed({
        notificationFeedRequestBuilder: { fetchNext: read.fn },
        ...(onError && { onError }),
      })
    );
  }

  it('cached items first, then the server page in place; omissions removed; only server items delivered', async () => {
    const { result } = mount();
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    expect(read.last().listener).toBeDefined();
    act(() => {
      read.last().cached([item('1'), item('2')]);
    });
    expect(ids(result.current.items)).toEqual(['1', '2']);
    expect(result.current.screenState).toBe('loaded');
    expect(delivered).not.toHaveBeenCalled();
    act(() => {
      read.last().server([item('1'), item('3')]);
    });
    expect(ids(result.current.items)).toEqual(['1', '3']);
    expect(delivered).toHaveBeenCalledTimes(2);
    expect(result.current.hasMorePages).toBe(true);
  });

  it('an empty cached page shows no empty state; offline past it is the error view and one onError (D83 rule 1)', async () => {
    const onError = vi.fn();
    const { result } = mount(onError);
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    act(() => {
      read.last().cached([]);
    });
    expect(result.current.screenState).toBe('loading');
    expect(result.current.hasMorePages).toBe(true);
    await act(async () => {
      read.last().fail();
      await Promise.resolve();
    });
    expect(result.current.screenState).toBe('error');
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('D84 rule 2: cached items on screen and a failing offline first read keep the items and stay silent', async () => {
    const onError = vi.fn();
    const { result } = mount(onError);
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    act(() => {
      read.last().cached([item('1')]);
    });
    await act(async () => {
      read.last().fail();
      await Promise.resolve();
    });
    expect(ids(result.current.items)).toEqual(['1']);
    expect(result.current.screenState).toBe('loaded');
    expect(result.current.connectToLoad).not.toBe(true);
    expect(onError).not.toHaveBeenCalled();
  });

  it('D84 rule 5: a real error over cached items the user started (open) keeps them and reports onError once', async () => {
    const onError = vi.fn();
    const { result } = mount(onError);
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    act(() => {
      read.last().cached([item('1')]);
    });
    await act(async () => {
      read.last().fail({ code: 'ERR_SERVER', message: 'boom' });
      await Promise.resolve();
    });
    expect(ids(result.current.items)).toEqual(['1']);
    expect(result.current.screenState).toBe('loaded');
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('D84 rule 3: offline with nothing saved is the error state worded "Connect to load" and reports onError once', async () => {
    const onError = vi.fn();
    const { result } = mount(onError);
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    await act(async () => {
      read.last().cached([]);
      read.last().fail();
      await Promise.resolve();
    });
    expect(result.current.screenState).toBe('error');
    expect(result.current.connectToLoad).toBe(true);
    expect(onError).toHaveBeenCalledTimes(1);
    act(() => {
      onConnected?.();
    });
    await waitFor(() => {
      expect(read.calls).toHaveLength(2);
    });
    act(() => {
      read.last().server([item('1')]);
    });
    expect(result.current.screenState).toBe('loaded');
    expect(result.current.connectToLoad).toBe(false);
  });

  it('D84 rule 2: a pull-to-refresh that fails offline keeps the items and stays silent', async () => {
    const onError = vi.fn();
    const { result } = mount(onError);
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    act(() => {
      read.last().server([item('1'), item('2')]);
    });
    let refreshing: Promise<void> | undefined;
    await act(async () => {
      refreshing = result.current.refresh();
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(read.calls).toHaveLength(2);
    });
    await act(async () => {
      read.last().fail();
      await refreshing;
    });
    expect(ids(result.current.items)).toEqual(['1', '2']);
    expect(result.current.screenState).toBe('loaded');
    expect(onError).not.toHaveBeenCalled();
  });

  it('D83 rule 4: an error view from being offline reloads once on reconnect; another error does not', async () => {
    const onError = vi.fn();
    const { result } = mount(onError);
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    await act(async () => {
      read.last().cached([]);
      read.last().fail();
      await Promise.resolve();
    });
    expect(result.current.screenState).toBe('error');
    act(() => {
      onConnected?.();
    });
    await waitFor(() => {
      expect(read.calls).toHaveLength(2);
    });
    act(() => {
      read.last().server([item('1')]);
    });
    await waitFor(() => {
      expect(result.current.screenState).toBe('loaded');
    });
    expect(onError).toHaveBeenCalledTimes(1);
    // Now a server error: its error view stays through a reconnect.
    await act(async () => {
      result.current.switchCategory('promo');
      await Promise.resolve();
    });
    expect(read.calls).toHaveLength(3);
    await act(async () => {
      read.last().fail({ code: 'ERR_SERVER', message: 'boom' });
      await Promise.resolve();
    });
    expect(result.current.screenState).toBe('error');
    act(() => {
      onConnected?.();
    });
    expect(read.calls).toHaveLength(3);
  });

  it('a load-more asked while the first read waits for its server page is kept, not started twice', async () => {
    // The first read paints its cached page with `isLoadingMore` false and the
    // screen state 'loaded', so a sentinel crossed then used to start a second
    // read on the same request: it took over the op id, the first read's server
    // page was dropped (its items never reported delivered) and the SDK answers
    // the second read empty (BEH-SNAP-14), ending the feed after one page.
    // Review: Prajwal `useCometChatNotificationFeed.ts:295` on #2460.
    const { result } = mount();
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    act(() => {
      read.last().cached([item('1'), item('2')]);
    });
    expect(result.current.isLoadingMore).toBe(false);

    await act(async () => {
      await result.current.fetchNextPage();
    });
    expect(read.calls).toHaveLength(1);

    // The first read's server page still lands, in place and delivered.
    await act(async () => {
      read.last().server([item('1'), item('3')]);
      await Promise.resolve();
    });
    expect(ids(result.current.items)).toEqual(['1', '3']);
    expect(delivered).toHaveBeenCalledTimes(2);

    // The kept ask runs once that read has landed: the feed keeps paging.
    await waitFor(() => {
      expect(read.calls).toHaveLength(2);
    });
  });

  it('pagination offline past the cache keeps the items and ends the loader, no retry footer, no onError', async () => {
    const onError = vi.fn();
    const { result } = mount(onError);
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    act(() => {
      read.last().server([item('1')]);
    });
    await act(async () => {
      void result.current.fetchNextPage();
      await Promise.resolve();
    });
    expect(read.calls).toHaveLength(2);
    act(() => {
      read.last().cached([item('2')]);
    });
    // One read at a time: the server phase is still pending.
    await act(async () => {
      await result.current.fetchNextPage();
    });
    expect(read.calls).toHaveLength(2);
    await act(async () => {
      read.last().fail();
      await Promise.resolve();
    });
    expect(ids(result.current.items)).toEqual(['1', '2']);
    expect(result.current.isLoadingMore).toBe(false);
    expect(result.current.paginationError).toBe(false);
    expect(result.current.screenState).toBe('loaded');
    expect(onError).not.toHaveBeenCalled();
  });

  it('a category switch drops the previous read', async () => {
    const { result } = mount();
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    const old = read.last();
    act(() => {
      result.current.switchCategory('promo');
    });
    expect(read.calls).toHaveLength(2);
    act(() => {
      old.server([item('stale')]);
    });
    expect(result.current.items).toEqual([]);
    act(() => {
      read.last().server([item('p1')]);
    });
    expect(ids(result.current.items)).toEqual(['p1']);
  });

  it('pull-to-refresh re-reads without blanking the items', async () => {
    const { result } = mount();
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    act(() => {
      read.last().server([item('1'), item('2')]);
    });
    let refreshing: Promise<void> | undefined;
    await act(async () => {
      refreshing = result.current.refresh();
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(read.calls).toHaveLength(2);
    });
    expect(result.current.screenState).toBe('loaded');
    expect(ids(result.current.items)).toEqual(['1', '2']);
    await act(async () => {
      read.last().server([item('0'), item('1'), item('2')]);
      await refreshing;
    });
    expect(ids(result.current.items)).toEqual(['0', '1', '2']);
  });

  it("offline off: one Promise-form fetch with no listener, today's reducer", async () => {
    fake.setEnabled(false);
    const { result } = mount();
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    expect(read.last().args).toHaveLength(0);
    await act(async () => {
      read.last().server([item('1')]);
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(ids(result.current.items)).toEqual(['1']);
    });
  });

  it('logout or user switch clears the list and drops a late read (UIK-LIFE-01)', async () => {
    const { result } = mount();
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    act(() => {
      read.last().cached([item('1')]);
    });
    expect(result.current.items).toHaveLength(1);
    act(() => {
      OfflineHub.getInstance().session.emit(1);
    });
    expect(result.current.items).toEqual([]);
    act(() => {
      read.last().server([item('1'), item('2')]);
    });
    expect(result.current.items).toEqual([]);
    expect(read.calls).toHaveLength(1);
  });

  it('a cache reset clears the list and reads it again, two-phase (UIK-LIFE-02)', async () => {
    const { result } = mount();
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    act(() => {
      read.last().server([item('1')]);
    });
    const hub = OfflineHub.getInstance();
    act(() => {
      hub.session.emit(1);
      hub.cacheReset.emit({ gen: 1, reason: 'KEY_LOST', pendingMessagesLost: 0 });
    });
    await waitFor(() => {
      expect(read.calls).toHaveLength(2);
    });
    expect(read.last().listener).toBeDefined();
    act(() => {
      read.last().server([item('2')]);
    });
    expect(ids(result.current.items)).toEqual(ids([item('2')]));
  });

  it('a list that never used the offline path ignores a logout', async () => {
    fake.setEnabled(false);
    const { result } = mount();
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    read.last().server([item('1')]);
    await waitFor(() => {
      expect(result.current.items).toHaveLength(1);
    });
    act(() => {
      OfflineHub.getInstance().session.emit(1);
    });
    expect(result.current.items).toHaveLength(1);
  });
});
