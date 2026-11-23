/**
 * One reload when the connection comes back, for a list on the offline (ON)
 * path that shows its error view because the device was offline (D83): the
 * lists that do not already have a connection listener of their own (reactions,
 * the notification feed, pinned and saved messages, search). A list whose error
 * view has any other cause is left as it is.
 *
 * The listener is registered for the component's whole life, and reads the
 * offline state when the connection returns: it used to be registered only
 * when offline was already on at mount, so a list mounted before
 * `CometChat.init()` (or before the app's `setOfflineConfig`) had taken effect
 * never got one and never reloaded for the rest of its life. With offline off
 * the handler does nothing at all.
 *
 * @internal
 */
import { useEffect, useId, useRef } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { isOfflineOn } from './gate';

/**
 * @param shouldReload Read when the connection returns: true while the list shows
 *   an error view that came from being offline. The latest closure is called.
 * @param reload Reads the list again. Called at most once per `true` answer;
 *   the list's own state change ends the error view, so a second reconnect
 *   finds nothing to do.
 */
export function useReloadOnReconnect(shouldReload: () => boolean, reload: () => void): void {
  const shouldReloadRef = useRef(shouldReload);
  shouldReloadRef.current = shouldReload;
  const reloadRef = useRef(reload);
  reloadRef.current = reload;
  const instanceId = useId();
  useEffect(() => {
    if (
      typeof CometChat.addConnectionListener !== 'function' ||
      typeof CometChat.ConnectionListener !== 'function'
    )
      return;
    const listenerId = `uikit_react_offline_reload_${instanceId}`;
    CometChat.addConnectionListener(
      listenerId,
      new CometChat.ConnectionListener({
        onConnected: () => {
          // Read now, not at mount: offline can be turned on after this list is
          // on screen, and is off for most apps.
          if (!isOfflineOn()) return;
          if (shouldReloadRef.current()) reloadRef.current();
        },
        onDisconnected: () => {
          /* nothing to do */
        },
      })
    );
    return () => {
      CometChat.removeConnectionListener(listenerId);
    };
  }, [instanceId]);
}
