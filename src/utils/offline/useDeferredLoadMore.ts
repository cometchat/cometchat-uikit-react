/**
 * Offline (ON) path: a "load more" asked for while a two-phase read is still
 * waiting for its server phase is not dropped (an IntersectionObserver fires
 * once per crossing, so a dropped request can leave a visible sentinel that
 * never asks again); it runs once that read has landed. Inert with offline
 * off: nothing ever defers.
 *
 * @internal
 */
import { useCallback, useEffect, useRef } from 'react';

/**
 * @param loadMore The list's load-more action (the latest one is called).
 * @param inFlight Truthy while an offline read's server phase is pending.
 * @returns `defer()`: call instead of reading while one is in flight.
 *
 * The kept ask is tried after every render of the list, not when its rows
 * change: a read that ends on its error terminal leaves the rows array as it
 * was (`OFFLINE_PAGE_ERROR` — an offline read past the cache, with `hasMore`
 * still true), and waiting for that array to change dropped the ask for good.
 * The sentinel had already fired for this crossing, so the list stopped paging
 * until it was remounted (Prajwal useDeferredLoadMore.ts:26).
 */
export function useDeferredLoadMore(
  loadMore: () => unknown,
  inFlight: { readonly current: unknown }
): () => void {
  const deferredRef = useRef(false);
  const loadMoreRef = useRef(loadMore);
  loadMoreRef.current = loadMore;
  useEffect(() => {
    if (!deferredRef.current || inFlight.current) return;
    deferredRef.current = false;
    void loadMoreRef.current();
  });
  return useCallback(() => {
    deferredRef.current = true;
  }, []);
}
