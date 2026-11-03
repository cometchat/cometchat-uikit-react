/**
 * Unit tests for CometChatNotificationFeedManager: feed builder setup (default,
 * per-category, custom), paging, category and unread-count fetching with their
 * failure fallbacks, fire-and-forget engagement reporting, and listener wiring.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const sdk = vi.hoisted(() => {
  const feedRequest = { fetchNext: vi.fn() };
  const categoriesRequest = { fetchNext: vi.fn() };
  const feedBuilder = {
    setLimit: vi.fn(),
    setCategory: vi.fn(),
    build: vi.fn(() => feedRequest),
  };
  feedBuilder.setLimit.mockReturnValue(feedBuilder);
  feedBuilder.setCategory.mockReturnValue(feedBuilder);
  const categoriesBuilder = {
    setLimit: vi.fn(),
    build: vi.fn(() => categoriesRequest),
  };
  categoriesBuilder.setLimit.mockReturnValue(categoriesBuilder);
  return {
    feedRequest,
    categoriesRequest,
    feedBuilder,
    categoriesBuilder,
    feedBuilderCtor: vi.fn(function () {
      return feedBuilder;
    }),
    getNotificationFeedUnreadCount: vi.fn(),
    markFeedItemAsDelivered: vi.fn(),
    markFeedItemAsRead: vi.fn(),
    reportFeedEngagement: vi.fn(),
    addNotificationFeedListener: vi.fn(),
    removeNotificationFeedListener: vi.fn(),
  };
});

vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
    NotificationFeedRequestBuilder: sdk.feedBuilderCtor,
    NotificationCategoriesRequestBuilder: vi.fn(function () {
      return sdk.categoriesBuilder;
    }),
    NotificationFeedListener: class {
      constructor(public callbacks: unknown) {}
    },
    getNotificationFeedUnreadCount: sdk.getNotificationFeedUnreadCount,
    markFeedItemAsDelivered: sdk.markFeedItemAsDelivered,
    markFeedItemAsRead: sdk.markFeedItemAsRead,
    reportFeedEngagement: sdk.reportFeedEngagement,
    addNotificationFeedListener: sdk.addNotificationFeedListener,
    removeNotificationFeedListener: sdk.removeNotificationFeedListener,
  },
}));

import { CometChatNotificationFeedManager } from '../CometChatNotificationFeedManager';
import type { NotificationFeedItem } from '../CometChatNotificationFeed.types';

const item = { getId: () => 'n1' } as unknown as NotificationFeedItem;

describe('CometChatNotificationFeedManager', () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    sdk.feedBuilder.setLimit.mockReturnValue(sdk.feedBuilder);
    sdk.feedBuilder.setCategory.mockReturnValue(sdk.feedBuilder);
    sdk.feedBuilder.build.mockReturnValue(sdk.feedRequest);
    sdk.categoriesBuilder.setLimit.mockReturnValue(sdk.categoriesBuilder);
    sdk.categoriesBuilder.build.mockReturnValue(sdk.categoriesRequest);
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warn.mockRestore();
  });

  describe('feed paging', () => {
    it('returns no items before a builder is initialised', async () => {
      await expect(new CometChatNotificationFeedManager().fetchNext()).resolves.toEqual([]);
    });

    it('builds an unfiltered request with a page size of 10 by default', async () => {
      sdk.feedRequest.fetchNext.mockResolvedValue([item]);
      const manager = new CometChatNotificationFeedManager();
      manager.initFeedRequestBuilder(null);

      await expect(manager.fetchNext()).resolves.toEqual([item]);
      expect(sdk.feedBuilder.setLimit).toHaveBeenCalledWith(10);
      expect(sdk.feedBuilder.setCategory).not.toHaveBeenCalled();
    });

    it('filters the request by category when one is given', () => {
      new CometChatNotificationFeedManager().initFeedRequestBuilder('orders');
      expect(sdk.feedBuilder.setCategory).toHaveBeenCalledWith('orders');
      expect(sdk.feedBuilder.build).toHaveBeenCalled();
    });

    it('uses a caller-supplied request as-is, ignoring the category', async () => {
      const custom = { fetchNext: vi.fn().mockResolvedValue([item]) };
      const manager = new CometChatNotificationFeedManager();
      manager.initFeedRequestBuilder('orders', custom);

      await expect(manager.fetchNext()).resolves.toEqual([item]);
      expect(sdk.feedBuilderCtor).not.toHaveBeenCalled();
    });

    it('stays usable (empty) when the SDK builder throws', async () => {
      sdk.feedBuilder.build.mockImplementation(() => {
        throw new Error('not initialised');
      });
      const manager = new CometChatNotificationFeedManager();
      manager.initFeedRequestBuilder(null);

      await expect(manager.fetchNext()).resolves.toEqual([]);
      expect(warn).toHaveBeenCalled();
    });

    it('propagates fetch errors to the caller', async () => {
      sdk.feedRequest.fetchNext.mockRejectedValue(new Error('network'));
      const manager = new CometChatNotificationFeedManager();
      manager.initFeedRequestBuilder(null);
      await expect(manager.fetchNext()).rejects.toThrow('network');
    });
  });

  describe('fetchCategories', () => {
    it('maps SDK categories to { id, label }', async () => {
      sdk.categoriesRequest.fetchNext.mockResolvedValue([
        { getId: () => 'c1', getLabel: () => 'Orders' },
        { getId: () => 'c2', getLabel: () => 'Promos' },
      ]);
      await expect(CometChatNotificationFeedManager.fetchCategories()).resolves.toEqual([
        { id: 'c1', label: 'Orders' },
        { id: 'c2', label: 'Promos' },
      ]);
      expect(sdk.categoriesBuilder.setLimit).toHaveBeenCalledWith(50);
    });

    it('returns whatever a custom categories request yields', async () => {
      const categories = [{ id: 'x', label: 'X' }];
      const custom = { fetchNext: vi.fn().mockResolvedValue(categories) };
      await expect(CometChatNotificationFeedManager.fetchCategories(custom)).resolves.toBe(
        categories
      );
    });

    it('falls back to no categories on failure', async () => {
      sdk.categoriesRequest.fetchNext.mockRejectedValue(new Error('boom'));
      await expect(CometChatNotificationFeedManager.fetchCategories()).resolves.toEqual([]);
      expect(warn).toHaveBeenCalled();
    });
  });

  describe('fetchUnreadCount', () => {
    it('returns the server count', async () => {
      sdk.getNotificationFeedUnreadCount.mockResolvedValue({ count: 7 });
      await expect(CometChatNotificationFeedManager.fetchUnreadCount()).resolves.toBe(7);
    });

    it('returns 0 and warns on unexpected errors', async () => {
      sdk.getNotificationFeedUnreadCount.mockRejectedValue({ code: 'NETWORK' });
      await expect(CometChatNotificationFeedManager.fetchUnreadCount()).resolves.toBe(0);
      expect(warn).toHaveBeenCalled();
    });

    it('returns 0 silently when the feed is not enabled (ERR_BAD_REQUEST)', async () => {
      sdk.getNotificationFeedUnreadCount.mockRejectedValue({ code: 'ERR_BAD_REQUEST' });
      await expect(CometChatNotificationFeedManager.fetchUnreadCount()).resolves.toBe(0);
      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe('engagement reporting', () => {
    const cases = [
      ['reportDelivered', sdk.markFeedItemAsDelivered, [item]],
      ['reportRead', sdk.markFeedItemAsRead, [item]],
      ['reportViewed', sdk.reportFeedEngagement, [item, 'viewed']],
      ['reportClicked', sdk.reportFeedEngagement, [item, 'clicked']],
    ] as const;

    it.each(cases)('%s forwards the item to the SDK', (method, sdkFn, args) => {
      sdkFn.mockResolvedValue(undefined);
      CometChatNotificationFeedManager[method](item);
      expect(sdkFn).toHaveBeenCalledWith(...args);
    });

    it.each(cases)('%s swallows async rejections', async (method, sdkFn) => {
      const rejection = Promise.reject(new Error('offline'));
      const caught = vi.spyOn(rejection, 'catch');
      sdkFn.mockReturnValue(rejection);
      expect(() => {
        CometChatNotificationFeedManager[method](item);
      }).not.toThrow();
      expect(caught).toHaveBeenCalled();
      await expect(caught.mock.results[0]?.value).resolves.toBeUndefined();
    });

    it.each(cases)('%s swallows synchronous SDK throws', (method, sdkFn) => {
      sdkFn.mockImplementation(() => {
        throw new Error('not logged in');
      });
      expect(() => {
        CometChatNotificationFeedManager[method](item);
      }).not.toThrow();
    });
  });

  describe('attachFeedListener', () => {
    it('registers the callbacks and removes them via the returned cleanup', () => {
      const onFeedItemReceived = vi.fn();
      const cleanup = CometChatNotificationFeedManager.attachFeedListener('feed-1', {
        onFeedItemReceived,
      });

      const [id, listener] = sdk.addNotificationFeedListener.mock.calls[0] as [
        string,
        { callbacks: { onFeedItemReceived: (i: unknown) => void } },
      ];
      expect(id).toBe('feed-1');
      listener.callbacks.onFeedItemReceived(item);
      expect(onFeedItemReceived).toHaveBeenCalledWith(item);

      cleanup();
      expect(sdk.removeNotificationFeedListener).toHaveBeenCalledWith('feed-1');
    });

    it('still returns a safe cleanup when registration or removal throws', () => {
      sdk.addNotificationFeedListener.mockImplementation(() => {
        throw new Error('no ws');
      });
      sdk.removeNotificationFeedListener.mockImplementation(() => {
        throw new Error('no ws');
      });
      const cleanup = CometChatNotificationFeedManager.attachFeedListener('feed-2', {
        onFeedItemReceived: vi.fn(),
      });
      expect(warn).toHaveBeenCalled();
      expect(cleanup).not.toThrow();
    });
  });
});
