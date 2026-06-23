import { CometChat } from '@cometchat/chat-sdk-javascript';
import type { NotificationFeedItem, NotificationCategory } from './CometChatNotificationFeed.types';

/**
 * CometChatNotificationFeedManager — SDK wrapper for notification feed operations.
 *
 * No React imports. No state. Pure SDK orchestration.
 * Encapsulates feed fetching, categories, engagement reporting, and listener management.
 */
export class CometChatNotificationFeedManager {
  private feedRequestBuilder: { fetchNext: () => Promise<NotificationFeedItem[]> } | null = null;
  private static readonly DEFAULT_LIMIT = 10;

  /**
   * Initialize or re-initialize the feed request builder.
   */
  initFeedRequestBuilder(category?: string | null, customBuilder?: unknown): void {
    try {
      if (customBuilder) {
        this.feedRequestBuilder = customBuilder as {
          fetchNext: () => Promise<NotificationFeedItem[]>;
        };
        return;
      }

      const builder = new CometChat.NotificationFeedRequestBuilder().setLimit(
        CometChatNotificationFeedManager.DEFAULT_LIMIT
      );

      if (category) {
        this.feedRequestBuilder = builder.setCategory(category).build();
      } else {
        this.feedRequestBuilder = builder.build();
      }
    } catch (error) {
      console.warn('[NotificationFeed] Failed to init request builder:', error);
    }
  }

  /**
   * Fetch the next page of feed items.
   */
  async fetchNext(): Promise<NotificationFeedItem[]> {
    if (!this.feedRequestBuilder) return [];
    return this.feedRequestBuilder.fetchNext();
  }

  /**
   * Fetch available notification categories.
   */
  static async fetchCategories(customBuilder?: unknown): Promise<NotificationCategory[]> {
    try {
      if (customBuilder) {
        const categories: NotificationCategory[] = await (
          customBuilder as { fetchNext: () => Promise<NotificationCategory[]> }
        ).fetchNext();
        return categories;
      }

      const builder = new CometChat.NotificationCategoriesRequestBuilder().setLimit(50).build();
      const sdkCategories = await builder.fetchNext();
      const categories: NotificationCategory[] = sdkCategories.map(cat => ({
        id: cat.getId(),
        label: cat.getLabel(),
      }));
      return categories;
    } catch (error) {
      console.warn('[NotificationFeed] Failed to fetch categories:', error);
      return [];
    }
  }

  /**
   * Fetch current unread count.
   */
  static async fetchUnreadCount(): Promise<number> {
    try {
      const result = await CometChat.getNotificationFeedUnreadCount();
      return result.count;
    } catch (error: unknown) {
      const err = error as { code?: string };
      if (err.code !== 'ERR_BAD_REQUEST') {
        console.warn('[NotificationFeed] Failed to fetch unread count:', error);
      }
      return 0;
    }
  }

  /**
   * Report item as delivered (fire-and-forget).
   */
  static reportDelivered(item: NotificationFeedItem): void {
    try {
      CometChat.markFeedItemAsDelivered(item as unknown as CometChat.NotificationFeedItem).catch(
        () => {
          /* fire-and-forget */
        }
      );
    } catch {
      // Silently ignore
    }
  }

  /**
   * Report item as viewed (fire-and-forget).
   */
  static reportViewed(item: NotificationFeedItem): void {
    try {
      CometChat.reportFeedEngagement(
        item as unknown as CometChat.NotificationFeedItem,
        'viewed'
      ).catch(() => {
        /* fire-and-forget */
      });
    } catch {
      // Silently ignore
    }
  }

  /**
   * Report item as read (fire-and-forget).
   */
  static reportRead(item: NotificationFeedItem): void {
    try {
      CometChat.markFeedItemAsRead(item as unknown as CometChat.NotificationFeedItem).catch(() => {
        /* fire-and-forget */
      });
    } catch {
      // Silently ignore
    }
  }

  /**
   * Report item as clicked (fire-and-forget).
   */
  static reportClicked(item: NotificationFeedItem): void {
    try {
      CometChat.reportFeedEngagement(
        item as unknown as CometChat.NotificationFeedItem,
        'clicked'
      ).catch(() => {
        /* fire-and-forget */
      });
    } catch {
      // Silently ignore
    }
  }

  /**
   * Attach a NotificationFeedListener for real-time updates.
   * @returns Cleanup function to remove the listener.
   */
  static attachFeedListener(
    listenerId: string,
    callbacks: {
      onFeedItemReceived: (item: NotificationFeedItem) => void;
    }
  ): () => void {
    try {
      CometChat.addNotificationFeedListener(
        listenerId,
        new CometChat.NotificationFeedListener({
          onFeedItemReceived: callbacks.onFeedItemReceived as (
            feedItem: CometChat.NotificationFeedItem
          ) => void,
        })
      );
    } catch (error) {
      console.warn('[NotificationFeed] Failed to register listener:', error);
    }

    return () => {
      try {
        CometChat.removeNotificationFeedListener(listenerId);
      } catch {
        // Ignore cleanup errors
      }
    };
  }
}
