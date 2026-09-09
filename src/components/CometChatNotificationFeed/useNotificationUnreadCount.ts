import { useCallback, useEffect, useState } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import type { NotificationFeedItem } from './CometChatNotificationFeed.types';
import { useCometChatFrameContext } from '../../context/CometChatFrameContext';

export interface UseNotificationUnreadCountOptions {
  /** Category-specific unread counts are not currently supported by the SDK. */
  category?: string;
  /** Polling interval in ms. Default: 30000 */
  pollingInterval?: number;
}

export interface UseNotificationUnreadCountResult {
  count: number;
  refresh: () => Promise<void>;
  isLoading: boolean;
}

/**
 * Shared singleton that manages a single polling interval and listener
 * regardless of how many components subscribe.
 */
class UnreadCountStore {
  private static readonly DEFAULT_POLLING_INTERVAL = 30000;
  private count = 0;
  private isLoading = true;
  private listeners = new Set<() => void>();
  private listenerOptions = new Map<() => void, UseNotificationUnreadCountOptions | undefined>();
  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  private listenerId = `unread_count_shared_${String(Date.now())}`;
  private subscriberCount = 0;
  private isFetching = false;
  private currentWindow: Window | null = typeof window !== 'undefined' ? window : null;
  private warnedUnsupportedCategory = false;

  subscribe(
    onStoreChange: () => void,
    options?: UseNotificationUnreadCountOptions,
    win?: Window | null
  ): () => void {
    this.listeners.add(onStoreChange);
    this.listenerOptions.set(onStoreChange, options);
    this.subscriberCount++;

    if (win && win !== this.currentWindow) {
      const prevWindow = this.currentWindow;
      this.currentWindow = win;

      // If we're already started (i.e., this isn't the first subscriber), move the focus listener.
      if (prevWindow && this.subscriberCount > 1) {
        prevWindow.removeEventListener('focus', this.handleFocus);
        win.addEventListener('focus', this.handleFocus);
      }
    }

    if (options?.category && !this.warnedUnsupportedCategory) {
      this.warnedUnsupportedCategory = true;
      console.warn(
        '[useNotificationUnreadCount] category filtering is not supported by the current SDK unread-count API.'
      );
    }

    if (this.subscriberCount === 1) {
      this.start();
    } else {
      this.restartPolling();
    }

    return () => {
      this.listeners.delete(onStoreChange);
      this.listenerOptions.delete(onStoreChange);
      this.subscriberCount--;

      if (this.subscriberCount === 0) {
        this.stop();
      } else {
        this.restartPolling();
      }
    };
  }

  getCount(): number {
    return this.count;
  }

  getIsLoading(): boolean {
    return this.isLoading;
  }

  private getPollingIntervalMs(): number {
    let interval = UnreadCountStore.DEFAULT_POLLING_INTERVAL;
    for (const options of this.listenerOptions.values()) {
      if (
        typeof options?.pollingInterval === 'number' &&
        Number.isFinite(options.pollingInterval) &&
        options.pollingInterval > 0
      ) {
        interval = Math.min(interval, options.pollingInterval);
      }
    }
    return interval;
  }

  async fetchCount(): Promise<void> {
    if (this.isFetching) return;
    this.isFetching = true;

    try {
      const result = await (
        CometChat as unknown as {
          getNotificationFeedUnreadCount: () => Promise<number | { count?: number }>;
        }
      ).getNotificationFeedUnreadCount();
      const newCount = typeof result === 'number' ? result : (result.count ?? 0);
      this.count = newCount;
      this.isLoading = false;
      this.notify();
    } catch (error: unknown) {
      const err = error as { code?: string };
      if (err.code !== 'ERR_BAD_REQUEST') {
        console.warn('[useNotificationUnreadCount] Failed to fetch count:', error);
      }
    } finally {
      this.isFetching = false;
    }
  }

  private start() {
    // Initial fetch
    void this.fetchCount();

    // Single polling interval
    this.pollingInterval = setInterval(() => {
      void this.fetchCount();
    }, this.getPollingIntervalMs());

    // Single real-time listener
    try {
      (
        CometChat as unknown as {
          addNotificationFeedListener: (
            id: string,
            listener: { onFeedItemReceived: (item: NotificationFeedItem) => void }
          ) => void;
        }
      ).addNotificationFeedListener(this.listenerId, {
        onFeedItemReceived: () => {
          this.count = this.count + 1;
          this.notify();
          // Re-fetch for accuracy after a short debounce
          setTimeout(() => void this.fetchCount(), 1000);
        },
      });
    } catch (error: unknown) {
      console.warn('[useNotificationUnreadCount] Failed to register listener:', error);
    }

    // Single focus handler
    this.currentWindow?.addEventListener('focus', this.handleFocus);
  }

  private stop() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }

    try {
      (
        CometChat as unknown as {
          removeNotificationFeedListener: (id: string) => void;
        }
      ).removeNotificationFeedListener(this.listenerId);
    } catch {
      // Ignore cleanup errors
    }

    this.currentWindow?.removeEventListener('focus', this.handleFocus);
  }

  private restartPolling() {
    if (!this.pollingInterval) return;
    clearInterval(this.pollingInterval);
    this.pollingInterval = setInterval(() => {
      void this.fetchCount();
    }, this.getPollingIntervalMs());
  }

  private handleFocus = () => {
    void this.fetchCount();
  };

  private notify() {
    this.listeners.forEach(listener => {
      listener();
    });
  }
}

// Single shared instance
const sharedStore = new UnreadCountStore();

/**
 * Hook to track unread notification feed count.
 * Uses a shared singleton — multiple components share one polling interval and listener.
 */
export function useNotificationUnreadCount(
  options?: UseNotificationUnreadCountOptions
): UseNotificationUnreadCountResult {
  const [, forceRender] = useState(0);
  const IframeContext = useCometChatFrameContext();
  const currentWindow =
    IframeContext.iframeWindow ?? (typeof window !== 'undefined' ? window : null);

  useEffect(() => {
    const unsubscribe = sharedStore.subscribe(() => {
      forceRender(n => n + 1);
    }, options, currentWindow);
    return unsubscribe;
  }, [currentWindow, options]);

  const refresh = useCallback(async () => {
    await sharedStore.fetchCount();
  }, []);

  return {
    count: sharedStore.getCount(),
    refresh,
    isLoading: sharedStore.getIsLoading(),
  };
}
