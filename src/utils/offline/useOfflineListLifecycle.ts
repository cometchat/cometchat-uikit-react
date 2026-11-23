/**
 * Session and cache-reset wiring for a list on the offline (ON) path
 * (UIK-LIFE-01/02, README §3.7): a logout, user switch or cache reset drops the
 * list's rows and late reads before the next frame; a cache reset, and the next
 * login after a session ended, then reload it. Only a list that used the
 * offline path reacts, so nothing changes with offline off.
 *
 * @internal
 */
import { useEffect, useRef, type RefObject } from 'react';
import { OfflineHub } from './hub';

export interface OfflineListLifecycle {
  /** Clear the rows and supersede any read still running. */
  onSessionEnd(): void;
  /** Read the list again. The rows were just cleared by {@link onSessionEnd}. */
  onCacheReset(): void;
  /**
   * Someone is signed in again after a session ended (a user switch, or a login
   * after a logout): read the list for them. The rows were cleared by
   * {@link onSessionEnd}, and nothing else reloads the list — an initial-fetch
   * effect only re-runs for a new request builder or prop — so without this the
   * list stays on that blank frame until it is remounted. Required, so a list
   * added later cannot miss it. A list scoped to a message, chat or group reads
   * again with the props it still holds; a host app that switches users
   * normally replaces those screens anyway.
   */
  onLogin(): void;
}

/**
 * Returns the ref the list sets when it runs an offline-path read. The handlers
 * are read when an event fires, so they may close over the current render.
 */
export function useOfflineListLifecycle(lifecycle: OfflineListLifecycle): RefObject<boolean> {
  const usedRef = useRef(false);
  const lifecycleRef = useRef(lifecycle);
  lifecycleRef.current = lifecycle;
  useEffect(() => {
    const hub = OfflineHub.getInstance();
    const stops = [
      hub.session.subscribe(() => {
        if (usedRef.current) lifecycleRef.current.onSessionEnd();
      }),
      hub.cacheReset.subscribe(() => {
        if (usedRef.current) lifecycleRef.current.onCacheReset();
      }),
      hub.login.subscribe(() => {
        if (usedRef.current) lifecycleRef.current.onLogin();
      }),
    ];
    return () => {
      stops.forEach(stop => {
        stop();
      });
    };
  }, []);
  return usedRef;
}
