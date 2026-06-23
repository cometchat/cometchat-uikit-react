import { describe, it, expect, vi } from 'vitest';

vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {},
}));

vi.mock('../utils', () => ({
  groupByTimestamp: (items: unknown[]) => (items.length > 0 ? [{ label: 'Today', items }] : []),
}));

import {
  notificationFeedReducer,
  initialNotificationFeedState,
} from '../CometChatNotificationFeed.reducer';
import type { NotificationFeedItem } from '../CometChatNotificationFeed.types';

function createMockItem(id: string, readAt: number | null = null): NotificationFeedItem {
  let _readAt = readAt;
  return {
    getId: () => id,
    getSentAt: () => Math.floor(Date.now() / 1000),
    getReadAt: () => _readAt,
    setReadAt: (ts: number) => {
      _readAt = ts;
    },
  } as unknown as NotificationFeedItem;
}

describe('notificationFeedReducer', () => {
  it('should return initial state for unknown action', () => {
    const result = notificationFeedReducer(initialNotificationFeedState, {
      type: 'UNKNOWN',
    } as any);
    expect(result).toEqual(initialNotificationFeedState);
  });

  describe('SET_SCREEN_STATE', () => {
    it('should set screenState', () => {
      const result = notificationFeedReducer(initialNotificationFeedState, {
        type: 'SET_SCREEN_STATE',
        screenState: 'error',
      });
      expect(result.screenState).toBe('error');
    });
  });

  describe('SET_ITEMS', () => {
    it('should set items and compute grouped items', () => {
      const items = [createMockItem('1')];
      const result = notificationFeedReducer(initialNotificationFeedState, {
        type: 'SET_ITEMS',
        items,
      });
      expect(result.items).toBe(items);
      expect(result.screenState).toBe('loaded');
    });

    it('should set empty screenState when no items', () => {
      const result = notificationFeedReducer(initialNotificationFeedState, {
        type: 'SET_ITEMS',
        items: [],
      });
      expect(result.screenState).toBe('empty');
    });
  });

  describe('APPEND_ITEMS', () => {
    it('should append new items', () => {
      const state = {
        ...initialNotificationFeedState,
        items: [createMockItem('1')],
      };
      const result = notificationFeedReducer(state, {
        type: 'APPEND_ITEMS',
        items: [createMockItem('2')],
      });
      expect(result.items.length).toBe(2);
    });

    it('should deduplicate items', () => {
      const existing = createMockItem('1');
      const state = {
        ...initialNotificationFeedState,
        items: [existing],
      };
      const result = notificationFeedReducer(state, {
        type: 'APPEND_ITEMS',
        items: [createMockItem('1')],
      });
      expect(result.items.length).toBe(1);
      expect(result.hasMorePages).toBe(false);
    });
  });

  describe('PREPEND_ITEM', () => {
    it('should prepend item to beginning', () => {
      const state = {
        ...initialNotificationFeedState,
        items: [createMockItem('2')],
      };
      const result = notificationFeedReducer(state, {
        type: 'PREPEND_ITEM',
        item: createMockItem('1'),
      });
      expect(result.items.length).toBe(2);
      expect(result.items[0]!.getId()).toBe('1');
      expect(result.screenState).toBe('loaded');
    });
  });

  describe('UPDATE_ITEM', () => {
    it('should update existing item', () => {
      const item1 = createMockItem('1');
      const state = {
        ...initialNotificationFeedState,
        items: [item1],
      };
      const updatedItem = createMockItem('1');
      const result = notificationFeedReducer(state, {
        type: 'UPDATE_ITEM',
        item: updatedItem,
      });
      expect(result.items[0]).toBe(updatedItem);
    });

    it('should not change state if item not found', () => {
      const state = {
        ...initialNotificationFeedState,
        items: [createMockItem('1')],
      };
      const result = notificationFeedReducer(state, {
        type: 'UPDATE_ITEM',
        item: createMockItem('99'),
      });
      expect(result).toBe(state);
    });
  });

  describe('SET_CATEGORIES', () => {
    it('should set categories', () => {
      const categories = [{ id: 'cat1', label: 'Cat 1' }] as any;
      const result = notificationFeedReducer(initialNotificationFeedState, {
        type: 'SET_CATEGORIES',
        categories,
      });
      expect(result.categories).toBe(categories);
    });
  });

  describe('SET_ACTIVE_CATEGORY', () => {
    it('should set active category', () => {
      const result = notificationFeedReducer(initialNotificationFeedState, {
        type: 'SET_ACTIVE_CATEGORY',
        category: 'messages',
      });
      expect(result.activeCategory).toBe('messages');
    });
  });

  describe('SET_UNREAD_COUNT', () => {
    it('should set total unread count', () => {
      const result = notificationFeedReducer(initialNotificationFeedState, {
        type: 'SET_UNREAD_COUNT',
        count: 5,
      });
      expect(result.totalUnreadCount).toBe(5);
    });
  });

  describe('DECREMENT_UNREAD', () => {
    it('should decrement total count', () => {
      const state = { ...initialNotificationFeedState, totalUnreadCount: 3 };
      const result = notificationFeedReducer(state, { type: 'DECREMENT_UNREAD' });
      expect(result.totalUnreadCount).toBe(2);
    });

    it('should not go below 0', () => {
      const state = { ...initialNotificationFeedState, totalUnreadCount: 0 };
      const result = notificationFeedReducer(state, { type: 'DECREMENT_UNREAD' });
      expect(result.totalUnreadCount).toBe(0);
    });

    it('should decrement category count when category provided', () => {
      const counts = new Map([['messages', 3]]);
      const state = {
        ...initialNotificationFeedState,
        totalUnreadCount: 5,
        categoryUnreadCounts: counts,
      };
      const result = notificationFeedReducer(state, {
        type: 'DECREMENT_UNREAD',
        category: 'messages',
      });
      expect(result.categoryUnreadCounts.get('messages')).toBe(2);
    });
  });

  describe('INCREMENT_UNREAD', () => {
    it('should increment total count', () => {
      const state = { ...initialNotificationFeedState, totalUnreadCount: 3 };
      const result = notificationFeedReducer(state, { type: 'INCREMENT_UNREAD' });
      expect(result.totalUnreadCount).toBe(4);
    });

    it('should increment category count when category provided', () => {
      const counts = new Map([['messages', 2]]);
      const state = {
        ...initialNotificationFeedState,
        totalUnreadCount: 3,
        categoryUnreadCounts: counts,
      };
      const result = notificationFeedReducer(state, {
        type: 'INCREMENT_UNREAD',
        category: 'messages',
      });
      expect(result.categoryUnreadCounts.get('messages')).toBe(3);
    });
  });

  describe('MARK_ALL_READ', () => {
    it('should mark all items as read and reset counts', () => {
      const item = createMockItem('1', null);
      const state = {
        ...initialNotificationFeedState,
        items: [item],
        totalUnreadCount: 1,
        categoryUnreadCounts: new Map([['messages', 1]]),
      };
      const result = notificationFeedReducer(state, { type: 'MARK_ALL_READ' });
      expect(result.totalUnreadCount).toBe(0);
      expect(result.categoryUnreadCounts.size).toBe(0);
    });
  });

  describe('SET_LOADING_MORE', () => {
    it('should set isLoadingMore', () => {
      const result = notificationFeedReducer(initialNotificationFeedState, {
        type: 'SET_LOADING_MORE',
        isLoadingMore: true,
      });
      expect(result.isLoadingMore).toBe(true);
    });
  });

  describe('SET_HAS_MORE_PAGES', () => {
    it('should set hasMorePages', () => {
      const result = notificationFeedReducer(initialNotificationFeedState, {
        type: 'SET_HAS_MORE_PAGES',
        hasMorePages: false,
      });
      expect(result.hasMorePages).toBe(false);
    });
  });

  describe('RESET', () => {
    it('should reset to initial state', () => {
      const state = {
        ...initialNotificationFeedState,
        items: [createMockItem('1')],
        totalUnreadCount: 5,
        screenState: 'loaded' as const,
      };
      const result = notificationFeedReducer(state, { type: 'RESET' });
      expect(result.items).toEqual([]);
      expect(result.totalUnreadCount).toBe(0);
      expect(result.screenState).toBe('loading');
    });
  });
});
