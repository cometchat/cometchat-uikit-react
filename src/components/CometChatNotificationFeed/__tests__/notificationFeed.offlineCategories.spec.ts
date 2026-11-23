/**
 * The notification feed on the offline (ON) path and its category chips, as on
 * Android: the feed read starts at once and never waits on the categories, and
 * a pull-to-refresh that cannot reach the server leaves the chips on screen.
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

describe('useCometChatNotificationFeed offline, category chips', () => {
  let fake: OfflineSdkFake;
  let read: ScriptedRead;
  let categories: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk({ enabled: true });
    categories = vi
      .spyOn(CometChatNotificationFeedManager, 'fetchCategories')
      .mockResolvedValue([{ id: 'general', label: 'General' }]);
    vi.spyOn(CometChatNotificationFeedManager, 'fetchUnreadCount').mockResolvedValue(0);
    vi.spyOn(CometChatNotificationFeedManager, 'attachFeedListener').mockReturnValue(
      () => undefined
    );
    vi.spyOn(CometChatNotificationFeedManager, 'reportDelivered').mockImplementation(
      () => undefined
    );
    read = scriptedRead('NotificationFeedItems');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fake.restore();
    OfflineHub.resetForTests();
  });

  it('the feed read starts while the categories are still loading', async () => {
    categories.mockReturnValue(new Promise(() => undefined));
    renderHook(() =>
      useCometChatNotificationFeed({ notificationFeedRequestBuilder: { fetchNext: read.fn } })
    );
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
  });

  it('the chips arrive when the categories do, after the feed has painted', async () => {
    let resolveCategories: (c: { id: string; label: string }[]) => void = () => undefined;
    categories.mockReturnValue(
      new Promise(resolve => {
        resolveCategories = resolve;
      })
    );
    const { result } = renderHook(() =>
      useCometChatNotificationFeed({ notificationFeedRequestBuilder: { fetchNext: read.fn } })
    );
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    act(() => {
      read.last().server([item('1')]);
    });
    await waitFor(() => {
      expect(result.current.screenState).toBe('loaded');
    });
    expect(result.current.categories).toEqual([]);
    await act(async () => {
      resolveCategories([{ id: 'general', label: 'General' }]);
      await Promise.resolve();
    });
    expect(result.current.categories).toEqual([{ id: 'general', label: 'General' }]);
  });

  it('a refresh that cannot reach the server keeps the chips', async () => {
    const { result } = renderHook(() =>
      useCometChatNotificationFeed({ notificationFeedRequestBuilder: { fetchNext: read.fn } })
    );
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    act(() => {
      read.last().server([item('1')]);
    });
    await waitFor(() => {
      expect(result.current.categories).toHaveLength(1);
    });
    // Offline, the categories read fails (the manager reports that as no categories).
    categories.mockResolvedValue([]);
    await act(async () => {
      void result.current.refresh();
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(read.calls).toHaveLength(2);
    });
    await act(async () => {
      read.last().server([item('1')]);
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(result.current.isRefreshing).toBe(false);
    });
    expect(result.current.categories).toEqual([{ id: 'general', label: 'General' }]);
  });
});
