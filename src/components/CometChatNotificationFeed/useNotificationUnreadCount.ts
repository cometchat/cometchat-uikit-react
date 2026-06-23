import { useCallback, useEffect, useState } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import type { NotificationFeedItem } from './CometChatNotificationFeed.types';
import { useCometChatFrameContext } from '../../context/CometChatFrameContext';

export interface UseNotificationUnreadCountOptions {
  /** Filter count by category */
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
  private count = 0;
  private isLoading = true;
  private listeners = new Set<() => void>();
  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  private listenerId = `unread_count_shared_${String(Date.now())}`;
  private subscriberCount = 0;
  private isFetching = false;
  private currentWindow: Window =
    typeof window !== 'undefined' ? window : (undefined as unknown as Window);

  subscribe(onStoreChange: () => void, win?: Window): () => void {
    this.listeners.add(onStoreChange);
    this.subscriberCount++;

    if (win) {
      this.currentWindow = win;
    }

    if (this.subscriberCount === 1) {
      this.start();
    }

    return () => {
      this.listeners.delete(onStoreChange);
      this.subscriberCount--;

      if (this.subscriberCount === 0) {
        this.stop();
      }
    };
  }

  getCount(): number {
    return this.count;
  }

  getIsLoading(): boolean {
    return this.isLoading;
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
    }, 30000);

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
    this.currentWindow.addEventListener('focus', this.handleFocus);
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

    this.currentWindow.removeEventListener('focus', this.handleFocus);
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _options?: UseNotificationUnreadCountOptions
): UseNotificationUnreadCountResult {
  const [, forceRender] = useState(0);
  const IframeContext = useCometChatFrameContext();
  const currentWindow = IframeContext.iframeWindow ?? window;

  useEffect(() => {
    const unsubscribe = sharedStore.subscribe(() => {
      forceRender(n => n + 1);
    }, currentWindow);
    return unsubscribe;
  }, [currentWindow]);

  const refresh = useCallback(async () => {
    await sharedStore.fetchCount();
  }, []);

  return {
    count: sharedStore.getCount(),
    refresh,
    isLoading: sharedStore.getIsLoading(),
  };
}
