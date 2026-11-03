/**
 * Unit tests for useCometChatNotificationFeed: initial load (items, categories,
 * unread count, delivered receipts), error/empty states, pagination and retry,
 * real-time items, unread polling, category switching, refresh, and read/click
 * engagement.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

interface Listener {
  onFeedItemReceived: (item: unknown) => void;
}

const mocks = vi.hoisted(() => ({
  init: vi.fn(),
  fetchNext: vi.fn(),
  fetchCategories: vi.fn(),
  fetchUnreadCount: vi.fn(),
  reportDelivered: vi.fn(),
  reportViewed: vi.fn(),
  reportRead: vi.fn(),
  reportClicked: vi.fn(),
  attach: vi.fn(),
  detach: vi.fn(),
  listener: null as Listener | null,
}));

vi.mock('../CometChatNotificationFeedManager', () => ({
  CometChatNotificationFeedManager: class {
    category: string | null = null;
    initFeedRequestBuilder(category: string | null, builder?: unknown) {
      this.category = category;
      mocks.init(category, builder);
    }
    fetchNext() {
      return mocks.fetchNext(this.category);
    }
    static fetchCategories = mocks.fetchCategories;
    static fetchUnreadCount = mocks.fetchUnreadCount;
    static reportDelivered = mocks.reportDelivered;
    static reportViewed = mocks.reportViewed;
    static reportRead = mocks.reportRead;
    static reportClicked = mocks.reportClicked;
    static attachFeedListener(id: string, listener: Listener) {
      mocks.attach(id);
      mocks.listener = listener;
      return mocks.detach;
    }
  },
}));

import { useCometChatNotificationFeed } from '../useCometChatNotificationFeed';
import CometChatFrameContext from '../../../context/CometChatFrameContext';
import type { NotificationFeedItem } from '../CometChatNotificationFeed.types';

function feedItem(id: string, category = 'orders', readAt: number | null = null) {
  let read = readAt;
  return {
    getId: () => id,
    getSentAt: () => Math.floor(Date.now() / 1000),
    getReadAt: () => read,
    setReadAt: (t: number) => {
      read = t;
    },
    getContent: () => ({}),
    getCategory: () => category,
  } satisfies NotificationFeedItem;
}

const CATEGORIES = [
  { id: 'orders', label: 'Orders' },
  { id: 'promos', label: 'Promos' },
];

const ids = (items: NotificationFeedItem[]) => items.map(i => i.getId());

function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>(r => {
    resolve = r;
  });
  return { promise, resolve };
}

async function loaded(
  first: NotificationFeedItem[] = [feedItem('a'), feedItem('b')],
  options: Parameters<typeof useCometChatNotificationFeed>[0] = {}
) {
  mocks.fetchNext.mockResolvedValueOnce(first);
  const hook = renderHook(() => useCometChatNotificationFeed(options));
  await waitFor(() => expect(hook.result.current.totalUnreadCount).toBe(3));
  return hook;
}

describe('useCometChatNotificationFeed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.listener = null;
    mocks.fetchCategories.mockResolvedValue(CATEGORIES);
    mocks.fetchUnreadCount.mockResolvedValue(3);
    mocks.fetchNext.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial load', () => {
    it('starts loading, then exposes items, categories and the unread count', async () => {
      const gate = deferred<NotificationFeedItem[]>();
      mocks.fetchNext.mockReturnValueOnce(gate.promise);
      const { result } = renderHook(() => useCometChatNotificationFeed());
      expect(result.current.screenState).toBe('loading');

      gate.resolve([feedItem('a'), feedItem('b')]);
      await waitFor(() => expect(result.current.totalUnreadCount).toBe(3));

      expect(result.current.screenState).toBe('loaded');
      expect(ids(result.current.items)).toEqual(['a', 'b']);
      expect(result.current.groupedItems[0]?.label).toBe('Today');
      expect(result.current.categories).toEqual(CATEGORIES);
      expect(result.current.hasMorePages).toBe(true);
      expect(result.current.activeCategory).toBeNull();
      expect(mocks.init).toHaveBeenCalledWith(null, undefined);
    });

    it('reports every fetched item as delivered once', async () => {
      await loaded();
      expect(mocks.reportDelivered.mock.calls.map(([i]) => (i as NotificationFeedItem).getId())).toEqual([
        'a',
        'b',
      ]);
    });

    it('passes custom request builders through to the manager', async () => {
      const feedBuilder = { fetchNext: vi.fn() };
      const categoriesBuilder = { fetchNext: vi.fn() };
      await loaded(undefined, {
        notificationFeedRequestBuilder: feedBuilder,
        notificationCategoriesRequestBuilder: categoriesBuilder,
      });
      expect(mocks.init).toHaveBeenCalledWith(null, feedBuilder);
      expect(mocks.fetchCategories).toHaveBeenCalledWith(categoriesBuilder);
    });

    it('shows the empty state when the first page has no items', async () => {
      const { result } = await loaded([]);
      expect(result.current.screenState).toBe('empty');
      expect(result.current.hasMorePages).toBe(false);
      expect(mocks.reportDelivered).not.toHaveBeenCalled();
    });

    it('shows the error state and notifies onError when the first page fails', async () => {
      const error = { code: 'ERR', message: 'down' };
      const onError = vi.fn();
      mocks.fetchNext.mockRejectedValueOnce(error);
      const { result } = renderHook(() => useCometChatNotificationFeed({ onError }));

      await waitFor(() => expect(result.current.screenState).toBe('error'));
      expect(result.current.error).toBe(error);
      expect(onError).toHaveBeenCalledWith(error);
      await waitFor(() => expect(result.current.totalUnreadCount).toBe(3));
    });
  });

  describe('pagination', () => {
    it('appends the next page and reports only the new items as delivered', async () => {
      const { result } = await loaded();
      mocks.reportDelivered.mockClear();
      mocks.fetchNext.mockResolvedValueOnce([feedItem('c')]);

      await act(() => result.current.fetchNextPage());

      expect(ids(result.current.items)).toEqual(['a', 'b', 'c']);
      expect(result.current.isLoadingMore).toBe(false);
      expect(mocks.reportDelivered).toHaveBeenCalledTimes(1);
    });

    it('stops paging once a page comes back empty', async () => {
      const { result } = await loaded();
      mocks.fetchNext.mockResolvedValueOnce([]);
      await act(() => result.current.fetchNextPage());
      expect(result.current.hasMorePages).toBe(false);

      mocks.fetchNext.mockClear();
      await act(() => result.current.fetchNextPage());
      expect(mocks.fetchNext).not.toHaveBeenCalled();
    });

    it('flags a pagination error without losing loaded items, and retry recovers', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const { result } = await loaded();
      mocks.fetchNext.mockRejectedValueOnce(new Error('timeout'));

      await act(() => result.current.fetchNextPage());
      expect(result.current.paginationError).toBe(true);
      expect(result.current.isLoadingMore).toBe(false);
      expect(ids(result.current.items)).toEqual(['a', 'b']);
      expect(result.current.screenState).toBe('loaded');

      mocks.fetchNext.mockResolvedValueOnce([feedItem('c')]);
      act(() => {
        result.current.retryPagination();
      });
      await waitFor(() => expect(ids(result.current.items)).toEqual(['a', 'b', 'c']));
      expect(result.current.paginationError).toBe(false);
      warn.mockRestore();
    });
  });

  describe('real-time items', () => {
    it('prepends a new item, bumps unread counts and reports it delivered', async () => {
      const { result } = await loaded();
      const incoming = feedItem('new', 'promos');

      act(() => mocks.listener?.onFeedItemReceived(incoming));

      expect(ids(result.current.items)).toEqual(['new', 'a', 'b']);
      expect(result.current.totalUnreadCount).toBe(4);
      expect(result.current.categoryUnreadCounts.get('promos')).toBe(1);
      expect(mocks.reportDelivered).toHaveBeenCalledWith(incoming);
    });

    it('turns the empty state into a list when the first item arrives', async () => {
      const { result } = await loaded([]);
      act(() => mocks.listener?.onFeedItemReceived(feedItem('x')));
      expect(result.current.screenState).toBe('loaded');
    });

    it('detaches its listener on unmount', async () => {
      const { unmount } = await loaded();
      const id = mocks.attach.mock.calls[0]?.[0] as string;
      expect(id).toMatch(/^CometChatNotificationFeed_/);
      unmount();
      expect(mocks.detach).toHaveBeenCalled();
    });

    // Known issue: onFeedItemReceived prepends every incoming item, ignoring the active category filter.
    it.fails('keeps items from other categories out of a filtered view', async () => {
      const { result } = await loaded();
      mocks.fetchNext.mockResolvedValueOnce([feedItem('o1', 'orders')]);
      act(() => {
        result.current.switchCategory('orders');
      });
      await waitFor(() => expect(ids(result.current.items)).toEqual(['o1']));

      act(() => mocks.listener?.onFeedItemReceived(feedItem('p1', 'promos')));

      expect(ids(result.current.items)).toEqual(['o1']);
    });
  });

  describe('unread count refresh', () => {
    it('re-polls the unread count every 30 seconds until unmounted', async () => {
      // Only intervals are faked so the async load can still settle on real timeouts.
      vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
      const settle = () => act(() => new Promise(r => setTimeout(r, 0)));
      mocks.fetchNext.mockResolvedValueOnce([feedItem('a')]);
      const { result, unmount } = renderHook(() => useCometChatNotificationFeed());
      await settle();
      expect(result.current.totalUnreadCount).toBe(3);

      mocks.fetchUnreadCount.mockResolvedValue(9);
      vi.advanceTimersByTime(29999);
      await settle();
      expect(result.current.totalUnreadCount).toBe(3);
      vi.advanceTimersByTime(1);
      await settle();
      expect(result.current.totalUnreadCount).toBe(9);

      unmount();
      mocks.fetchUnreadCount.mockClear();
      vi.advanceTimersByTime(60000);
      expect(mocks.fetchUnreadCount).not.toHaveBeenCalled();
    });

    it('re-fetches the count when the window regains focus', async () => {
      const { result } = await loaded();
      mocks.fetchUnreadCount.mockResolvedValue(5);
      act(() => {
        window.dispatchEvent(new Event('focus'));
      });
      await waitFor(() => expect(result.current.totalUnreadCount).toBe(5));
    });

    it('listens for focus on the iframe window when rendered inside a frame', async () => {
      const frameWindow = new EventTarget() as unknown as Window;
      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(
          CometChatFrameContext.Provider,
          { value: { iframeWindow: frameWindow, iframeDocument: null, iframe: null } },
          children
        );
      mocks.fetchNext.mockResolvedValueOnce([feedItem('a')]);
      const { result } = renderHook(() => useCometChatNotificationFeed(), { wrapper });
      await waitFor(() => expect(result.current.totalUnreadCount).toBe(3));

      mocks.fetchUnreadCount.mockResolvedValue(1);
      act(() => {
        window.dispatchEvent(new Event('focus'));
      });
      await Promise.resolve();
      expect(result.current.totalUnreadCount).toBe(3);

      act(() => {
        frameWindow.dispatchEvent(new Event('focus'));
      });
      await waitFor(() => expect(result.current.totalUnreadCount).toBe(1));
    });
  });

  describe('switchCategory', () => {
    it('reloads the feed for the chosen category', async () => {
      const { result } = await loaded();
      const gate = deferred<NotificationFeedItem[]>();
      mocks.fetchNext.mockReturnValueOnce(gate.promise);

      act(() => {
        result.current.switchCategory('promos');
      });
      expect(result.current.activeCategory).toBe('promos');
      expect(result.current.screenState).toBe('loading');
      expect(result.current.items).toEqual([]);
      expect(mocks.init).toHaveBeenLastCalledWith('promos', undefined);

      await act(async () => {
        gate.resolve([feedItem('p1', 'promos')]);
        await gate.promise;
      });
      expect(ids(result.current.items)).toEqual(['p1']);
      expect(result.current.screenState).toBe('loaded');
      expect(result.current.categories).toEqual(CATEGORIES);
    });

    it('shows the empty state for a category with no items', async () => {
      const { result } = await loaded();
      act(() => {
        result.current.switchCategory('promos');
      });
      await waitFor(() => expect(result.current.screenState).toBe('empty'));
      expect(result.current.hasMorePages).toBe(false);
    });

    it('shows the error state and notifies onError when the category fails to load', async () => {
      const onError = vi.fn();
      const { result } = await loaded(undefined, { onError });
      const error = { code: 'ERR' };
      mocks.fetchNext.mockRejectedValueOnce(error);

      act(() => {
        result.current.switchCategory('promos');
      });
      await waitFor(() => expect(result.current.screenState).toBe('error'));
      expect(onError).toHaveBeenCalledWith(error);
    });

    // Known issue: switchCategory never discards a superseded request, so a slow earlier response overwrites the newer one.
    it.fails('shows the latest selected category even if an earlier request resolves last', async () => {
      const { result } = await loaded();
      const slowPromos = deferred<NotificationFeedItem[]>();
      mocks.fetchNext.mockImplementation((category: string | null) =>
        category === 'promos' ? slowPromos.promise : Promise.resolve([feedItem('o1', 'orders')])
      );

      act(() => {
        result.current.switchCategory('promos');
      });
      act(() => {
        result.current.switchCategory('orders');
      });
      await waitFor(() => expect(ids(result.current.items)).toEqual(['o1']));

      await act(async () => {
        slowPromos.resolve([feedItem('p1', 'promos')]);
        await slowPromos.promise;
      });

      expect(result.current.activeCategory).toBe('orders');
      expect(ids(result.current.items)).toEqual(['o1']);
    });
  });

  describe('refresh', () => {
    it('reloads everything for the active category and toggles isRefreshing', async () => {
      const { result } = await loaded();
      mocks.fetchNext.mockResolvedValueOnce([feedItem('p1', 'promos')]);
      act(() => {
        result.current.switchCategory('promos');
      });
      await waitFor(() => expect(ids(result.current.items)).toEqual(['p1']));

      const gate = deferred<NotificationFeedItem[]>();
      mocks.fetchNext.mockReturnValueOnce(gate.promise);
      mocks.fetchCategories.mockClear();
      let done!: Promise<void>;
      act(() => {
        done = result.current.refresh();
      });
      expect(result.current.isRefreshing).toBe(true);

      await act(async () => {
        gate.resolve([feedItem('p2', 'promos')]);
        await done;
      });
      expect(mocks.init).toHaveBeenLastCalledWith('promos', undefined);
      expect(mocks.fetchCategories).toHaveBeenCalledTimes(1);
      expect(ids(result.current.items)).toEqual(['p2']);
      expect(result.current.activeCategory).toBe('promos');
      expect(result.current.isRefreshing).toBe(false);
    });

    it('ignores a second refresh while one is in progress', async () => {
      const { result } = await loaded();
      const gate = deferred<NotificationFeedItem[]>();
      mocks.fetchNext.mockReturnValueOnce(gate.promise);
      mocks.fetchCategories.mockClear();

      let first!: Promise<void>;
      act(() => {
        first = result.current.refresh();
      });
      await waitFor(() => expect(mocks.fetchCategories).toHaveBeenCalledTimes(1));
      await act(() => result.current.refresh());
      expect(mocks.fetchCategories).toHaveBeenCalledTimes(1);

      await act(async () => {
        gate.resolve([feedItem('a')]);
        await first;
      });
      expect(result.current.isRefreshing).toBe(false);
    });

    it('recovers from the error state', async () => {
      mocks.fetchNext.mockRejectedValueOnce({ code: 'ERR' });
      const { result } = renderHook(() => useCometChatNotificationFeed());
      await waitFor(() => expect(result.current.screenState).toBe('error'));

      mocks.fetchNext.mockResolvedValueOnce([feedItem('a')]);
      await act(() => result.current.refresh());
      expect(result.current.screenState).toBe('loaded');
      expect(ids(result.current.items)).toEqual(['a']);
    });
  });

  describe('read state and engagement', () => {
    it('reportRead marks the item read and decrements total and category counts', async () => {
      const { result } = await loaded();
      act(() => mocks.listener?.onFeedItemReceived(feedItem('n', 'orders')));
      expect(result.current.categoryUnreadCounts.get('orders')).toBe(1);
      const target = result.current.items[0]!;

      act(() => {
        result.current.reportRead(target);
      });

      expect(mocks.reportRead).toHaveBeenCalledWith(target);
      expect(result.current.items[0]?.getReadAt()).not.toBeNull();
      expect(result.current.totalUnreadCount).toBe(3);
      expect(result.current.categoryUnreadCounts.get('orders')).toBe(0);
    });

    it('markAllAsRead marks every item read and clears all unread counts', async () => {
      const { result } = await loaded([feedItem('a'), feedItem('b', 'orders', 100)]);
      act(() => mocks.listener?.onFeedItemReceived(feedItem('n', 'promos')));

      await act(() => result.current.markAllAsRead());

      expect(result.current.items.every(i => i.getReadAt() !== null)).toBe(true);
      expect(result.current.items.find(i => i.getId() === 'b')?.getReadAt()).toBe(100);
      expect(result.current.totalUnreadCount).toBe(0);
      expect(result.current.categoryUnreadCounts.size).toBe(0);
    });

    it('forwards clicked and viewed engagement to the manager', async () => {
      const { result } = await loaded();
      const target = result.current.items[0]!;
      result.current.reportClicked(target);
      result.current.reportViewed(target);
      expect(mocks.reportClicked).toHaveBeenCalledWith(target);
      expect(mocks.reportViewed).toHaveBeenCalledWith(target);
    });
  });
});
