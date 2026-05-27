import { useCallback, useEffect, useState } from "react";
import { CometChat } from "@cometchat/chat-sdk-javascript";

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
  private count: number = 0;
  private isLoading: boolean = true;
  private listeners: Set<() => void> = new Set();
  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  private listenerId: string = `unread_count_shared_${Date.now()}`;
  private subscriberCount: number = 0;
  private isFetching: boolean = false;

  subscribe(onStoreChange: () => void): () => void {
    this.listeners.add(onStoreChange);
    this.subscriberCount++;

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
      const result = await (CometChat as any).getNotificationFeedUnreadCount();
      const newCount = typeof result === "number" ? result : result?.count ?? 0;
      this.count = newCount;
      this.isLoading = false;
      this.notify();
    } catch (error: any) {
      if (error?.code !== "ERR_BAD_REQUEST") {
        console.warn("[useNotificationUnreadCount] Failed to fetch count:", error);
      }
    } finally {
      this.isFetching = false;
    }
  }

  private start() {
    // Initial fetch
    this.fetchCount();

    // Single polling interval
    this.pollingInterval = setInterval(() => {
      this.fetchCount();
    }, 30000);

    // Single real-time listener
    try {
      (CometChat as any).addNotificationFeedListener(this.listenerId, {
        onFeedItemReceived: () => {
          this.count = this.count + 1;
          this.notify();
          // Re-fetch for accuracy after a short debounce
          setTimeout(() => this.fetchCount(), 1000);
        },
      });
    } catch (error) {
      console.warn("[useNotificationUnreadCount] Failed to register listener:", error);
    }

    // Single focus handler
    window.addEventListener("focus", this.handleFocus);
  }

  private stop() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }

    try {
      (CometChat as any).removeNotificationFeedListener(this.listenerId);
    } catch (error) {
      // Ignore cleanup errors
    }

    window.removeEventListener("focus", this.handleFocus);
  }

  private handleFocus = () => {
    this.fetchCount();
  };

  private notify() {
    this.listeners.forEach((listener) => listener());
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

  useEffect(() => {
    const unsubscribe = sharedStore.subscribe(() => {
      forceRender((n) => n + 1);
    });
    return unsubscribe;
  }, []);

  const refresh = useCallback(async () => {
    await sharedStore.fetchCount();
  }, []);

  return {
    count: sharedStore.getCount(),
    refresh,
    isLoading: sharedStore.getIsLoading(),
  };
}
