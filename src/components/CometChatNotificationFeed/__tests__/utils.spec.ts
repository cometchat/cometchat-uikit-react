import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { groupByTimestamp, getRelativeTime, VisibilityTracker } from '../utils';
import type { NotificationFeedItem } from '../CometChatNotificationFeed.types';

function createMockItem(
  id: string,
  sentAt: number,
  readAt: number | null = null
): NotificationFeedItem {
  return {
    getId: () => id,
    getSentAt: () => sentAt,
    getReadAt: () => readAt,
    setReadAt: vi.fn(),
  } as unknown as NotificationFeedItem;
}

describe('groupByTimestamp', () => {
  it('should return empty array for empty input', () => {
    expect(groupByTimestamp([])).toEqual([]);
  });

  it('should group items sent today under "Today"', () => {
    const now = Math.floor(Date.now() / 1000);
    const items = [createMockItem('1', now - 60), createMockItem('2', now - 120)];
    const groups = groupByTimestamp(items);
    expect(groups.length).toBe(1);
    expect(groups[0]!.label).toBe('Today');
    expect(groups[0]!.items.length).toBe(2);
  });

  it('should group items from yesterday under "Yesterday"', () => {
    const yesterday = Math.floor(Date.now() / 1000) - 86400;
    const items = [createMockItem('1', yesterday)];
    const groups = groupByTimestamp(items);
    expect(groups[0]!.label).toBe('Yesterday');
  });

  it('should label older items with the date', () => {
    // 30 days ago
    const oldTs = Math.floor(Date.now() / 1000) - 30 * 86400;
    const items = [createMockItem('1', oldTs)];
    const groups = groupByTimestamp(items);
    expect(groups[0]!.label).not.toBe('Today');
    expect(groups[0]!.label).not.toBe('Yesterday');
    // Should be a date string
    expect(groups[0]!.label.length).toBeGreaterThan(0);
  });

  it('should maintain order of groups based on item order', () => {
    const now = Math.floor(Date.now() / 1000);
    const yesterday = now - 86400;
    const items = [createMockItem('1', now), createMockItem('2', yesterday)];
    const groups = groupByTimestamp(items);
    expect(groups[0]!.label).toBe('Today');
    expect(groups[1]!.label).toBe('Yesterday');
  });
});

describe('getRelativeTime', () => {
  it('should return "Just now" for <60 seconds ago', () => {
    const now = Math.floor(Date.now() / 1000);
    expect(getRelativeTime(now - 30)).toBe('Just now');
  });

  it('should return minutes ago for <1 hour', () => {
    const now = Math.floor(Date.now() / 1000);
    expect(getRelativeTime(now - 300)).toBe('5m ago');
  });

  it('should return hours ago for <24 hours', () => {
    const now = Math.floor(Date.now() / 1000);
    expect(getRelativeTime(now - 7200)).toBe('2h ago');
  });

  it('should return "Yesterday" for 24-48 hours ago', () => {
    const now = Math.floor(Date.now() / 1000);
    expect(getRelativeTime(now - 100000)).toBe('Yesterday');
  });

  it('should return a date string for >48 hours ago', () => {
    const now = Math.floor(Date.now() / 1000);
    const result = getRelativeTime(now - 300000);
    // Should be a formatted date
    expect(result).not.toBe('Yesterday');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('VisibilityTracker', () => {
  let onViewed: ReturnType<typeof vi.fn>;
  let onRead: ReturnType<typeof vi.fn>;
  let tracker: VisibilityTracker;

  beforeEach(() => {
    vi.useFakeTimers();
    // Mock IntersectionObserver for jsdom
    global.IntersectionObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
      root: null,
      rootMargin: '',
      thresholds: [],
      takeRecords: () => [],
    }));
    onViewed = vi.fn();
    onRead = vi.fn();
    tracker = new VisibilityTracker(onViewed, onRead);
  });

  afterEach(() => {
    tracker.dispose();
    vi.useRealTimers();
  });

  it('should initialize without error', () => {
    expect(() => tracker.init(null)).not.toThrow();
  });

  it('should dispose without error', () => {
    tracker.init(null);
    expect(() => tracker.dispose()).not.toThrow();
  });

  it('should mark item as read via markAsRead', () => {
    tracker.init(null);
    expect(() => tracker.markAsRead('item-1')).not.toThrow();
  });

  it('should observe and unobserve elements', () => {
    const container = document.createElement('div');
    tracker.init(container);

    const element = document.createElement('div');
    element.setAttribute('data-feed-item-id', 'item-1');
    const item = createMockItem('item-1', Math.floor(Date.now() / 1000));

    expect(() => tracker.observe(element, item)).not.toThrow();
    expect(() => tracker.unobserve(element)).not.toThrow();
  });
});
