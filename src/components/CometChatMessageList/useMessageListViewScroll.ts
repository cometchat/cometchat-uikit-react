import { useEffect, useRef } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import './CometChatMessageList.css';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseMessageListViewScrollOptions {
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  allMessages: CometChat.BaseMessage[];
  isFetchingMore: boolean;
  hasMore: boolean;
  hasMoreNewer: boolean;
  state: {
    isAtBottom: boolean;
    scrollToMessageId: number | null;
    scrollToMessageHighlight?: boolean;
    newMessageCount: number;
    markedUnreadByUser: boolean;
  };
  fetchPrevious: () => Promise<void>;
  fetchNext: () => Promise<void>;
  setAtBottom: (isAtBottom: boolean) => void;
  markConversationAsReadIfUnread: () => void;
  scrollToMessage: (messageId: number) => void;
}

export interface UseMessageListViewScrollReturn {
  topSentinelRef: React.RefObject<HTMLDivElement | null>;
  bottomSentinelRef: React.RefObject<HTMLDivElement | null>;
  liveRegionRef: React.RefObject<HTMLDivElement | null>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useMessageListViewScroll — encapsulates all scroll-related DOM effects for
 * the message list view.
 *
 * Handles:
 * - Scroll position restore on prepend
 * - Top sentinel IntersectionObserver (fetchPrevious)
 * - Bottom sentinel IntersectionObserver (at-bottom detection, fetchNext, markAsRead)
 * - Auto-scroll to bottom on new messages / initial load
 * - Scroll-to-message-id (one-shot scroll + highlight)
 * - Live region announcement for screen readers
 */
export function useMessageListViewScroll(
  options: UseMessageListViewScrollOptions
): UseMessageListViewScrollReturn {
  const {
    scrollContainerRef,
    allMessages,
    isFetchingMore,
    hasMore,
    hasMoreNewer,
    state,
    fetchPrevious,
    fetchNext,
    setAtBottom,
    markConversationAsReadIfUnread,
    scrollToMessage,
  } = options;

  const topSentinelRef = useRef<HTMLDivElement>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);
  const liveRegionRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(0);

  // Stable refs for values accessed inside observers/effects
  const isFetchingMoreRef = useRef(isFetchingMore);
  const hasMoreRef = useRef(hasMore);
  const hasMoreNewerRef = useRef(hasMoreNewer);

  useEffect(() => {
    isFetchingMoreRef.current = isFetchingMore;
  }, [isFetchingMore]);
  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);
  useEffect(() => {
    hasMoreNewerRef.current = hasMoreNewer;
  }, [hasMoreNewer]);

  const scrollHeightTupleRef = useRef<[number, number]>([0, 0]);
  const didTopObserverRunRef = useRef(false);

  // --- Scroll pinning ---
  // After initial scroll-to-bottom, keep the scroll pinned to the bottom
  // until the user manually scrolls up. This handles content shifts from
  // lazy-loaded images/media/polls that increase scrollHeight after the initial scroll.
  // Uses ResizeObserver to catch DOM-only height changes (e.g., poll bubble expanding)
  // that don't trigger React re-renders.
  //
  // Two pinning modes:
  // 1. shouldPinToBottomRef — pin to absolute bottom (initial load, new message)
  // 2. pinToMessageIdRef — pin to a specific message (goToMessage, lastRead)
  //    When content above the target grows, re-scroll to keep it in view.
  const shouldPinToBottomRef = useRef(false);
  const pinToMessageIdRef = useRef<number | null>(null);

  // ResizeObserver-based scroll pinning — fires on ANY content size change,
  // including DOM-only changes like poll/image expansion that don't trigger re-renders.
  useEffect(() => {
    const root = scrollContainerRef.current;
    if (!root || allMessages.length === 0) return;
    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => {
      const container = scrollContainerRef.current;
      if (!container) return;
      // Don't pin if a prepend restore is pending
      if (didTopObserverRunRef.current) return;

      // Mode 1: Pin to bottom
      if (shouldPinToBottomRef.current) {
        const distanceFromBottom =
          container.scrollHeight - container.scrollTop - container.clientHeight;
        if (distanceFromBottom > 1) {
          container.scrollTop = container.scrollHeight;
        }
        return;
      }

      // Mode 2: Pin to a specific message (goToMessage / lastRead)
      if (pinToMessageIdRef.current !== null) {
        const el = container.querySelector(
          `[data-message-id="${String(pinToMessageIdRef.current)}"]`
        );
        if (el) {
          el.scrollIntoView({ block: 'center', behavior: 'auto' });
        }
      }
    });

    // Observe the messages wrapper div — when any child bubble resizes,
    // this element's size changes and the observer fires.
    const messagesWrapper = root.querySelector('[class*="message-list__messages"]');
    if (messagesWrapper) {
      observer.observe(messagesWrapper);
    }

    return () => {
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allMessages.length > 0]);

  // Runs after every render — records scroll height changes and adjusts position
  // for the prepend (fetchPrevious) scroll restore pattern.
  useEffect(() => {
    const root = scrollContainerRef.current;
    if (!root) return;

    if (root.scrollHeight > root.clientHeight) {
      if (Math.round(root.scrollHeight - scrollHeightTupleRef.current[1]) !== 0) {
        scrollHeightTupleRef.current[0] = scrollHeightTupleRef.current[1];
        scrollHeightTupleRef.current[1] = root.scrollHeight;

        if (
          didTopObserverRunRef.current &&
          scrollHeightTupleRef.current[0] !== 0 &&
          !isFetchingMoreRef.current
        ) {
          root.scrollTop = Math.max(
            scrollHeightTupleRef.current[1] - scrollHeightTupleRef.current[0],
            0
          );
          didTopObserverRunRef.current = false;
        }
      }
    } else {
      scrollHeightTupleRef.current[0] = 0;
      scrollHeightTupleRef.current[1] = 0;
    }
  });

  // --- Top sentinel IntersectionObserver (fetchPrevious) ---
  useEffect(() => {
    if (!topSentinelRef.current || allMessages.length === 0) return;

    let didInitialFire = false;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!didInitialFire) {
          didInitialFire = true;
          return;
        }
        if (entry?.isIntersecting && !isFetchingMoreRef.current && hasMoreRef.current) {
          didTopObserverRunRef.current = true;
          if (scrollContainerRef.current) {
            const h = scrollContainerRef.current.scrollHeight;
            scrollHeightTupleRef.current = [h, h];
          }
          void fetchPrevious();
        }
      },
      { root: scrollContainerRef.current, threshold: 0.1 }
    );
    observer.observe(topSentinelRef.current);
    return () => {
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchPrevious, allMessages.length > 0]);

  // --- Bottom sentinel IntersectionObserver ---
  const isAtBottomRef = useRef(false);
  const hasMessages = allMessages.length > 0;

  const setAtBottomRef = useRef(setAtBottom);
  setAtBottomRef.current = setAtBottom;
  const fetchNextRef = useRef(fetchNext);
  fetchNextRef.current = fetchNext;
  const markConversationAsReadIfUnreadRef = useRef(markConversationAsReadIfUnread);
  markConversationAsReadIfUnreadRef.current = markConversationAsReadIfUnread;
  const markedUnreadByUserRef = useRef(state.markedUnreadByUser);
  markedUnreadByUserRef.current = state.markedUnreadByUser;

  useEffect(() => {
    const rootElement = scrollContainerRef.current;
    const targetElement = bottomSentinelRef.current;
    if (!rootElement || !targetElement) return;

    let didInitialFire = false;

    function observerCallback(entries: IntersectionObserverEntry[]) {
      const relevantEntry = entries[0];
      if (!relevantEntry) return;

      const isIntersecting = relevantEntry.isIntersecting;

      if (isAtBottomRef.current !== isIntersecting) {
        isAtBottomRef.current = isIntersecting;
        setAtBottomRef.current(isIntersecting);
      }

      // Release scroll pinning when user scrolls away from bottom
      if (!isIntersecting) {
        shouldPinToBottomRef.current = false;
      }

      if (!didInitialFire) {
        didInitialFire = true;
        return;
      }

      if (isIntersecting && !markedUnreadByUserRef.current) {
        markConversationAsReadIfUnreadRef.current();
      }

      if (isIntersecting && hasMoreNewerRef.current && !isFetchingMoreRef.current) {
        void fetchNextRef.current();
      }
    }

    const observer = new IntersectionObserver(observerCallback, {
      root: rootElement,
      threshold: 0.1,
    });
    observer.observe(targetElement);
    return () => {
      observer.unobserve(targetElement);
    };
  }, [hasMessages, scrollContainerRef]);

  // --- Auto-scroll to bottom on new messages / initial load ---
  const userScrolledDuringInitRef = useRef(false);
  const initScrollListenerRef = useRef<{ container: HTMLDivElement; handler: () => void } | null>(
    null
  );

  useEffect(() => {
    const prevCount = prevMessageCountRef.current;
    const newCount = allMessages.length;

    if (newCount === 0) {
      prevMessageCountRef.current = 0;
      userScrolledDuringInitRef.current = false;
      shouldPinToBottomRef.current = false;
      pinToMessageIdRef.current = null;
      return;
    }

    const container = scrollContainerRef.current;
    if (!container) return;

    // Initial load: scroll to bottom when messages first appear (no scrollToMessageId)
    if (prevCount === 0 && newCount > 0 && !state.scrollToMessageId) {
      userScrolledDuringInitRef.current = false;
      const onUserScroll = () => {
        userScrolledDuringInitRef.current = true;
        initScrollListenerRef.current = null;
      };
      container.addEventListener('scroll', onUserScroll, { passive: true, once: true });
      initScrollListenerRef.current = { container, handler: onUserScroll };

      requestAnimationFrame(() => {
        setTimeout(() => {
          if (initScrollListenerRef.current) {
            initScrollListenerRef.current.container.removeEventListener(
              'scroll',
              initScrollListenerRef.current.handler
            );
            initScrollListenerRef.current = null;
          }

          if (userScrolledDuringInitRef.current) return;
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
            shouldPinToBottomRef.current = true;
          }
        }, 50);
      });
    }
    // Real-time new message: auto-scroll if at bottom or pinned to bottom.
    else if ((state.isAtBottom || shouldPinToBottomRef.current) && newCount === prevCount + 1) {
      container.scrollTop = container.scrollHeight;
      shouldPinToBottomRef.current = true;
    }

    prevMessageCountRef.current = newCount;

    return () => {
      if (initScrollListenerRef.current) {
        initScrollListenerRef.current.container.removeEventListener(
          'scroll',
          initScrollListenerRef.current.handler
        );
        initScrollListenerRef.current = null;
      }
    };
  }, [allMessages.length, state.isAtBottom, state.scrollToMessageId, scrollContainerRef]);

  // Refs for pin cleanup — stored outside the effect so they persist across re-runs
  const pinTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pinScrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Scroll to message ID (one-shot — clears after scrolling) ---
  useEffect(() => {
    if (!state.scrollToMessageId || !scrollContainerRef.current) return;
    const targetId = state.scrollToMessageId;
    const shouldHighlight = state.scrollToMessageHighlight;
    const container = scrollContainerRef.current;

    // Clear any previous pin timers (handles rapid goToMessage calls)
    if (pinTimeoutRef.current) clearTimeout(pinTimeoutRef.current);
    if (pinScrollTimerRef.current) clearTimeout(pinScrollTimerRef.current);

    // Activate message pinning so content shifts above the target
    // (e.g., poll bubbles expanding) re-scroll to keep it in view.
    pinToMessageIdRef.current = targetId;
    shouldPinToBottomRef.current = false;

    // Release the pin after 2s OR on next user scroll (whichever first).
    pinTimeoutRef.current = setTimeout(() => {
      pinToMessageIdRef.current = null;
      pinTimeoutRef.current = null;
    }, 2000);

    pinScrollTimerRef.current = setTimeout(() => {
      const onUserScroll = () => {
        pinToMessageIdRef.current = null;
        if (pinTimeoutRef.current) {
          clearTimeout(pinTimeoutRef.current);
          pinTimeoutRef.current = null;
        }
      };
      container.addEventListener('scroll', onUserScroll, { passive: true, once: true });
      pinScrollTimerRef.current = null;
    }, 300);

    requestAnimationFrame(() => {
      const el = container.querySelector(`[data-message-id="${String(targetId)}"]`);
      if (el) {
        el.scrollIntoView({ block: 'center', behavior: 'auto' });
        if (shouldHighlight) {
          el.classList.add('cometchat-message-list__bubble-highlight');
          const handleAnimationEnd = () => {
            el.classList.remove('cometchat-message-list__bubble-highlight');
            el.removeEventListener('animationend', handleAnimationEnd);
          };
          el.addEventListener('animationend', handleAnimationEnd);
        }
      }
      scrollToMessage(0);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.scrollToMessageId]);

  // --- Announce new messages to screen readers ---
  useEffect(() => {
    if (state.newMessageCount > 0 && liveRegionRef.current) {
      liveRegionRef.current.textContent = `${String(state.newMessageCount)} new message${state.newMessageCount > 1 ? 's' : ''}`;
    }
  }, [state.newMessageCount]);

  return { topSentinelRef, bottomSentinelRef, liveRegionRef };
}
