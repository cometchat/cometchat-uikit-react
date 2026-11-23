/**
 * The notification feed on the offline (ON) path, its errors: no request is an
 * empty feed, a first-page server error is today's error screen and onError, a
 * pagination server error keeps the items and shows the retry footer.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
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

describe('useCometChatNotificationFeed offline, errors', () => {
  let fake: OfflineSdkFake;
  let read: ScriptedRead;
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk({ enabled: true });
    vi.spyOn(CometChatNotificationFeedManager, 'fetchCategories').mockResolvedValue([]);
    vi.spyOn(CometChatNotificationFeedManager, 'fetchUnreadCount').mockResolvedValue(0);
    vi.spyOn(CometChatNotificationFeedManager, 'attachFeedListener').mockReturnValue(
      () => undefined
    );
    vi.spyOn(CometChatNotificationFeedManager, 'reportDelivered').mockImplementation(
      () => undefined
    );
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    read = scriptedRead('NotificationFeedItems');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fake.restore();
    OfflineHub.resetForTests();
  });

  it('no feed request (it could not be built): an empty feed, no read, no error', async () => {
    vi.spyOn(CometChatNotificationFeedManager.prototype, 'getRequest').mockReturnValue(null);
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useCometChatNotificationFeed({ notificationFeedRequestBuilder: { fetchNext: read.fn }, onError })
    );
    await waitFor(() => {
      expect(result.current.screenState).toBe('empty');
    });
    expect(result.current.items).toEqual([]);
    expect(result.current.hasMorePages).toBe(false);
    expect(onError).not.toHaveBeenCalled();
    expect(read.calls).toHaveLength(0);
  });

  it("a first-page server error is today's error screen and reaches onError", async () => {
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useCometChatNotificationFeed({
        notificationFeedRequestBuilder: { fetchNext: read.fn },
        onError,
      })
    );
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    const failure = { code: 'ERR_SERVER' };
    await act(async () => {
      read.last().fail(failure);
      await Promise.resolve();
    });
    expect(onError).toHaveBeenCalledWith(failure);
    expect(result.current.screenState).toBe('error');
  });

  it('a pagination server error keeps the items, is logged, and shows the retry footer', async () => {
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useCometChatNotificationFeed({
        notificationFeedRequestBuilder: { fetchNext: read.fn },
        onError,
      })
    );
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
    const failure = { code: 'ERR_SERVER' };
    await act(async () => {
      read.last().fail(failure);
      await Promise.resolve();
    });
    expect(ids(result.current.items)).toEqual(['1']);
    expect(result.current.screenState).toBe('loaded');
    expect(result.current.paginationError).toBe(true);
    expect(result.current.isLoadingMore).toBe(false);
    expect(onError).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith('[NotificationFeed] Pagination error:', failure);
  });
});
