/**
 * No presence while the SDK is not connected (offline support on only).
 *
 * With offline on, a user's online status, the "Online" subtitle and the typing
 * indicator are only as fresh as the last connection, so while the SDK is
 * disconnected or connecting the kit shows none of them. On reconnect the
 * kit's own re-fetch of the user or list brings presence back. With offline
 * off nothing here changes anything.
 *
 * @internal
 */
import { useSyncExternalStore } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { isOfflineOn, isSdkConnected } from './gate';

const subscribers = new Set<() => void>();
let attached = false;

function notify(): void {
  subscribers.forEach(subscriber => {
    subscriber();
  });
}

/** True when offline is on and the SDK is not connected. Read at the moment of use. */
export function isPresenceSuppressed(): boolean {
  return isOfflineOn() && !isSdkConnected();
}

function subscribe(onChange: () => void): () => void {
  subscribers.add(onChange);
  // Offline off: no listener at all, so the SDK sees exactly what it did before.
  if (!attached && isOfflineOn() && typeof CometChat.addConnectionListener === 'function') {
    attached = true;
    CometChat.addConnectionListener(
      'uikit_react_offline_presence',
      new CometChat.ConnectionListener({
        onConnected: notify,
        inConnecting: notify,
        onDisconnected: notify,
      })
    );
  }
  return () => {
    subscribers.delete(onChange);
  };
}

/** Re-renders the caller when the connection changes; true while presence must be hidden. */
export function usePresenceSuppressed(): boolean {
  return useSyncExternalStore(subscribe, isPresenceSuppressed, () => false);
}
