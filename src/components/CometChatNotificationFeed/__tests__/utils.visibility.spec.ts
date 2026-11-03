/**
 * Behavioural tests for VisibilityTracker (viewed once, read after one second
 * of visibility, cancellation, markAsRead, dispose) driven through a captured
 * IntersectionObserver callback, plus groupByTimestamp's weekday label.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VisibilityTracker, groupByTimestamp } from '../utils';
import type { NotificationFeedItem } from '../CometChatNotificationFeed.types';

function feedItem(id: string, readAt: number | null = null, sentAt = 0): NotificationFeedItem {
  return {
    getId: () => id,
    getSentAt: () => sentAt,
    getReadAt: () => readAt,
    setReadAt: vi.fn(),
    getContent: () => ({}),
    getCategory: () => 'Orders',
  };
}

describe('VisibilityTracker', () => {
  let callback: IntersectionObserverCallback;
  let observerOptions: IntersectionObserverInit | undefined;
  const observer = { observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn() };
  let onViewed: ReturnType<typeof vi.fn>;
  let onRead: ReturnType<typeof vi.fn>;
  let tracker: VisibilityTracker;

  function element(id: string | null) {
    const el = document.createElement('div');
    if (id) el.setAttribute('data-feed-item-id', id);
    return el;
  }

  function track(item: NotificationFeedItem) {
    const el = element(item.getId());
    tracker.observe(el, item);
    return el;
  }

  function fire(el: Element, isIntersecting: boolean) {
    callback(
      [{ target: el, isIntersecting } as unknown as IntersectionObserverEntry],
      observer as unknown as IntersectionObserver
    );
  }

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    vi.stubGlobal(
      'IntersectionObserver',
      vi.fn(function (cb: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        callback = cb;
        observerOptions = options;
        return observer;
      })
    );
    onViewed = vi.fn();
    onRead = vi.fn();
    tracker = new VisibilityTracker(onViewed, onRead);
  });

  afterEach(() => {
    tracker.dispose();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('observes relative to the given root at a 50% threshold', () => {
    const root = document.createElement('div');
    tracker.init(root);
    expect(observerOptions).toEqual({ root, threshold: 0.5 });

    const el = track(feedItem('a'));
    expect(observer.observe).toHaveBeenCalledWith(el);
    tracker.unobserve(el);
    expect(observer.unobserve).toHaveBeenCalledWith(el);
  });

  it('is a no-op before init', () => {
    expect(() => track(feedItem('a'))).not.toThrow();
    expect(observer.observe).not.toHaveBeenCalled();
  });

  it('reports viewed once, and read after one second of continuous visibility', () => {
    tracker.init(null);
    const item = feedItem('a');
    const el = track(item);

    fire(el, true);
    expect(onViewed).toHaveBeenCalledWith(item);
    vi.advanceTimersByTime(999);
    expect(onRead).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onRead).toHaveBeenCalledWith(item);

    fire(el, false);
    fire(el, true);
    vi.advanceTimersByTime(2000);
    expect(onViewed).toHaveBeenCalledTimes(1);
    expect(onRead).toHaveBeenCalledTimes(1);
  });

  it('does not mark read when the item scrolls away within a second, but does once it stays', () => {
    tracker.init(null);
    const el = track(feedItem('a'));

    fire(el, true);
    vi.advanceTimersByTime(500);
    fire(el, false);
    vi.advanceTimersByTime(2000);
    expect(onRead).not.toHaveBeenCalled();

    fire(el, true);
    vi.advanceTimersByTime(1000);
    expect(onRead).toHaveBeenCalledTimes(1);
  });

  it('reports viewed but never read for an already-read item', () => {
    tracker.init(null);
    const el = track(feedItem('a', 1700000000));
    fire(el, true);
    vi.advanceTimersByTime(2000);
    expect(onViewed).toHaveBeenCalledTimes(1);
    expect(onRead).not.toHaveBeenCalled();
  });

  it('markAsRead cancels a pending read and suppresses later ones', () => {
    tracker.init(null);
    const el = track(feedItem('a'));
    fire(el, true);
    tracker.markAsRead('a');
    vi.advanceTimersByTime(2000);

    fire(el, false);
    fire(el, true);
    vi.advanceTimersByTime(2000);
    expect(onRead).not.toHaveBeenCalled();
  });

  it('ignores entries for untracked elements or ones without an item id', () => {
    tracker.init(null);
    fire(element(null), true);
    fire(element('unknown'), true);
    fire(element('unknown'), false);
    vi.advanceTimersByTime(2000);
    expect(onViewed).not.toHaveBeenCalled();
    expect(onRead).not.toHaveBeenCalled();
  });

  it('dispose disconnects and cancels pending reads', () => {
    tracker.init(null);
    const el = track(feedItem('a'));
    fire(el, true);
    tracker.dispose();
    expect(observer.disconnect).toHaveBeenCalled();
    vi.advanceTimersByTime(2000);
    expect(onRead).not.toHaveBeenCalled();
  });

  // Known issue: a second "intersecting" entry (e.g. crossing the 50% threshold while still partly visible) starts another read timer without clearing the first.
  it.fails('reports read only once if the item is reported visible twice', () => {
    tracker.init(null);
    const el = track(feedItem('a'));
    fire(el, true);
    vi.advanceTimersByTime(300);
    fire(el, true);
    vi.advanceTimersByTime(2000);
    expect(onRead).toHaveBeenCalledTimes(1);
  });
});

describe('groupByTimestamp weekday labels', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('labels items from earlier this week by weekday, and older ones by date', () => {
    vi.useFakeTimers();
    // Saturday 17 Oct 2026, noon local time.
    vi.setSystemTime(new Date(2026, 9, 17, 12));
    const tuesday = new Date(2026, 9, 13, 9);
    const lastWeek = new Date(2026, 9, 8, 9);
    const at = (d: Date) => Math.floor(d.getTime() / 1000);

    const groups = groupByTimestamp([
      feedItem('t', null, at(tuesday)),
      feedItem('t2', null, at(tuesday) + 60),
      feedItem('old', null, at(lastWeek)),
    ]);

    expect(groups.map(g => g.items.length)).toEqual([2, 1]);
    expect(groups[0]?.label).toBe(tuesday.toLocaleDateString(undefined, { weekday: 'long' }));
    expect(groups[1]?.label).toBe(
      lastWeek.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    );
  });
});
