/**
 * Media on the offline (ON) path (README §3.8, UIK-MEDIA-01): an attachment's
 * source is the SDK's cached copy (`getCachedMediaObjectURL`) when it has one,
 * else its URL, as today. The kit keeps no media cache of its own; a bubble
 * keeps one object URL per cached item while it shows it and revokes it when it
 * lets go (unmount or a new message).
 *
 * With offline off, or with the SDK's media caching OFF, nothing here runs and
 * the attachments are returned as given.
 *
 * @internal
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CometChatLogger } from '../CometChatLogger';
import { useCometChatEvents } from '../../hooks/useCometChatEvents';
import { hasSdkFunction, isOfflineOn, isSdkConnected, makeSdkListener, offlineSdk } from './gate';
import { OfflineHub } from './hub';

export interface ResolvableAttachment {
  url: string;
  name?: string;
  size?: number;
  mimeType?: string;
}

function isRemote(url: string | undefined): url is string {
  return !!url && /^https?:/i.test(url);
}

/** Whether media should be looked up in the SDK's cache for this read. */
export function shouldResolveCachedMedia(): boolean {
  if (!isOfflineOn() || !hasSdkFunction('getCachedMediaObjectURL')) return false;
  try {
    return offlineSdk().getMediaCachingMode?.() !== 'OFF';
  } catch {
    return true;
  }
}

/**
 * The files (as URL-less attachments) an unsent (queued) own media message still holds: the SDK's `files`
 * (one per attachment, in order) or the composer's `metadata.file`. Offline ON
 * only, so offline off reads exactly what it did before.
 */
export function queuedMediaFiles(message: unknown): { url: string; file: Blob }[] {
  if (!isOfflineOn()) return [];
  // Callers read it inside their own try/catch.
  const m = message as { files?: unknown[]; getMetadata?: () => { file?: unknown } | null };
  const held = m.files?.length ? m.files : [m.getMetadata?.()?.file];
  return held.flatMap(file => (file instanceof Blob ? [{ url: '', file }] : []));
}

/** The attachment as the SDK's media calls take it. */
const mediaRef = ({ url, mimeType, name, size }: ResolvableAttachment) => ({
  url,
  mimeType,
  name,
  size,
});

function revokeAll(urls: Iterable<string>): void {
  for (const url of urls) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      /* already revoked */
    }
  }
}

/** What a media bubble draws on the offline path. */
export interface CachedMediaState<T> {
  /** The attachments to render: cached object URLs where the SDK has the bytes. */
  attachments: T[];
  /**
   * Offline, with some remote attachment not cached: the bubble shows "Available
   * when online" (UIK-MEDIA-01). Always `false` with offline off.
   */
  unavailable: boolean;
  /** Ask the SDK to fetch and cache the missing media (`downloadMedia`); it re-resolves when ready. */
  download: () => void;
}

/**
 * The offline media state for a bubble's attachments: each remote URL swapped
 * for the SDK's cached object URL when the cache has the bytes, an
 * "unavailable" flag while offline with bytes missing, and a download action.
 * Re-resolves when the SDK reports a download (`onMediaDownloaded`) or the
 * connection changes. With offline off it returns `attachments` itself and
 * `unavailable: false`, so the bubble renders exactly as before. Each cached
 * item keeps one object URL while it is shown (R17); it is revoked on unmount
 * or when `attachments` no longer has that item.
 */
export function useCachedMedia<T extends ResolvableAttachment>(
  attachments: T[]
): CachedMediaState<T> {
  const [resolved, setResolved] = useState<{
    key: string;
    value: T[];
    missing: string[];
  } | null>(null);
  // The resolution is for these URLs, not for one array: a clone of the message
  // (a receipt, a reaction, the ack) hands over a new array with the same URLs,
  // and its `src` must not fall back to the remote URL for a render.
  const key = attachments.map(a => a.url).join('\n');
  const [version, setVersion] = useState(0);
  /** Remote URLs of these attachments the SDK had no bytes for at the last lookup. */
  const missingRef = useRef<string[]>([]);
  /**
   * Remote URL → the object URL this bubble got for it, kept while the item is
   * shown, so a re-resolve (a connection change, a download) hands back the same
   * `src` and playback never restarts (R17).
   */
  const ownedRef = useRef(new Map<string, string>());

  // Revoke the object URLs of items this bubble no longer shows, and all of them
  // on unmount.
  useEffect(() => {
    const owned = ownedRef.current;
    const shown = new Set(attachments.map(a => a.url));
    for (const [remote, objectUrl] of owned) {
      if (shown.has(remote)) continue;
      revokeAll([objectUrl]);
      owned.delete(remote);
    }
  }, [attachments]);
  useEffect(() => {
    const owned = ownedRef.current;
    return () => {
      revokeAll(owned.values());
      owned.clear();
    };
  }, []);

  // Re-resolve when the SDK cached media (`onMediaDownloaded`) this bubble is
  // still missing, or the connection changed (online, a missing file is simply
  // loaded from its URL). The SDK's event key is a message id and a cache key
  // that need not equal the URL, so any download re-resolves a bubble that is
  // still missing bytes; a bubble with everything resolved ignores it.
  useEffect(() => {
    const hub = OfflineHub.getInstance();
    return hub.mediaReady.subscribe(event => {
      if (event.gen !== hub.gen) return;
      const named = attachments.some(a => a.url === event.urlKey);
      if (!named && missingRef.current.length === 0) return;
      setVersion(v => v + 1);
    });
  }, [attachments]);
  useCometChatEvents(event => {
    if (event.type !== 'connection/connected' && event.type !== 'connection/disconnected') return;
    // Offline off: nothing was resolved, so nothing re-renders (no OFF change).
    if (missingRef.current.length === 0 && !shouldResolveCachedMedia()) return;
    setVersion(v => v + 1);
  }, []);

  useEffect(() => {
    if (!shouldResolveCachedMedia() || !attachments.some(a => isRemote(a.url))) return;
    const owned = ownedRef.current;
    let cancelled = false;
    const getCached = offlineSdk().getCachedMediaObjectURL;
    const missing: string[] = [];
    void Promise.all(
      attachments.map(async attachment => {
        if (!isRemote(attachment.url) || typeof getCached !== 'function') return attachment;
        const kept = owned.get(attachment.url);
        if (kept) return { ...attachment, url: kept };
        try {
          const objectUrl = await getCached.call(offlineSdk(), mediaRef(attachment));
          if (!objectUrl) {
            missing.push(attachment.url);
            return attachment;
          }
          if (cancelled) {
            revokeAll([objectUrl]);
            return attachment;
          }
          owned.set(attachment.url, objectUrl);
          return { ...attachment, url: objectUrl };
        } catch (error) {
          CometChatLogger.warn('OfflineMedia', 'Cached media lookup failed:', error);
          return attachment;
        }
      })
    ).then(next => {
      if (cancelled) return;
      missingRef.current = missing;
      const swapped = next.some((a, i) => a !== attachments[i]);
      if (swapped || missing.length > 0) {
        // Nothing swapped: hand back the same array, so the bubble does not re-render for it.
        setResolved({ key, value: swapped ? next : attachments, missing });
      } else {
        setResolved(null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [attachments, key, version]);

  const current = resolved?.key === key ? resolved : null;
  const missing = current?.missing ?? [];
  const unavailable = missing.length > 0 && shouldResolveCachedMedia() && !isSdkConnected();

  const download = useCallback(() => {
    const sdk = offlineSdk();
    if (typeof sdk.downloadMedia !== 'function') return;
    for (const attachment of attachments) {
      if (!missing.includes(attachment.url)) continue;
      try {
        sdk.downloadMedia.call(
          sdk,
          mediaRef(attachment),
          // An explicit download answers here, not on the global media listener.
          makeSdkListener('MediaCallbackListener', {
            onSuccess: () => {
              setVersion(v => v + 1);
            },
          })
        );
      } catch (error) {
        CometChatLogger.warn('OfflineMedia', 'downloadMedia failed:', error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attachments, missing.join('\n')]);

  return { attachments: current?.value ?? attachments, unavailable, download };
}

/**
 * `attachments` with each remote URL swapped for the SDK's cached object URL
 * when the cache has the bytes (offline ON only); see {@link useCachedMedia}.
 */
export function useCachedMediaAttachments<T extends ResolvableAttachment>(attachments: T[]): T[] {
  return useCachedMedia(attachments).attachments;
}

/**
 * Attachments of an unsent own media message (no URL yet) shown from the file
 * the message still holds: each gets an object URL, revoked when the message
 * changes (it was sent) or the bubble unmounts. Offline ON only; an attachment
 * with a URL, or one with no file (after a reload), is returned as it was.
 */
export function useQueuedFilePreviews<T extends ResolvableAttachment>(attachments: T[]): T[] {
  // One object URL per held file: a clone of the message keeps the same one.
  const urls = useRef(new Map<Blob, string>()).current;
  const [version, setVersion] = useState(0);
  const fileOf = (a: T) => (a.url ? undefined : (a as { file?: Blob }).file);
  useEffect(() => {
    // Only unsent own media carries a file (see queuedMediaFiles), so offline off never gets here.
    const live = new Set(attachments.map(fileOf));
    const fresh = [...live].filter((file): file is Blob => !!file && !urls.has(file));
    fresh.forEach(file => urls.set(file, URL.createObjectURL(file)));
    urls.forEach((url, file) => {
      if (live.has(file)) return;
      revokeAll([url]);
      urls.delete(file);
    });
    if (fresh.length) setVersion(v => v + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attachments]);
  useEffect(
    () => () => {
      revokeAll(urls.values());
      urls.clear();
    },
    [urls]
  );
  return useMemo(
    () =>
      urls.size
        ? attachments.map(a => {
            const file = fileOf(a);
            const url = file && urls.get(file);
            return url ? { ...a, url } : a;
          })
        : attachments,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [attachments, version]
  );
}
