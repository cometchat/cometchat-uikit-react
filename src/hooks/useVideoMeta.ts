import { useEffect, useState } from 'react';

/** Validity of a URL probed as a video. */
export type VideoMetaStatus = 'loading' | 'valid' | 'invalid';

export interface VideoMeta {
  /** Duration in seconds, available once a valid video's metadata has loaded. */
  duration: number | null;
  /** 'loading' while probing, 'valid' for a real video, 'invalid' otherwise. */
  status: VideoMetaStatus;
}

/**
 * useVideoMeta — probes a URL with an off-screen <video> element to determine
 * whether it is a genuinely playable video, and extracts its duration.
 *
 * `valid`   — metadata loaded and the media has a visual track (videoWidth/Height > 0).
 * `invalid` — the resource failed to load (broken URL / unsupported content, e.g. an
 *             image), or it loaded but has no visual track (an audio-only file).
 * `loading` — still probing, or no URL yet (pending/optimistic message).
 *
 * `reprobeToken` is an extra effect dependency: change it to force a fresh probe
 * of the same URL (e.g. once a still-sending message is confirmed, since a
 * just-uploaded CDN URL can fail the first probe).
 *
 * Non-blocking and safe for multiple concurrent calls.
 */
export function useVideoMeta(url: string | undefined, reprobeToken?: unknown): VideoMeta {
  const [meta, setMeta] = useState<VideoMeta>({ duration: null, status: 'loading' });

  useEffect(() => {
    setMeta({ duration: null, status: 'loading' });
    if (!url) return;

    let cancelled = false;
    const video = document.createElement('video');
    video.preload = 'metadata';

    const onLoaded = () => {
      if (!cancelled) {
        const hasVisualTrack = video.videoWidth > 0 && video.videoHeight > 0;
        if (hasVisualTrack) {
          const duration = video.duration && isFinite(video.duration) ? video.duration : null;
          setMeta({ duration, status: 'valid' });
        } else {
          // Loaded, but no visual track — an audio file in a video message.
          setMeta({ duration: null, status: 'invalid' });
        }
      }
      cleanup();
    };

    const onError = () => {
      if (!cancelled) setMeta({ duration: null, status: 'invalid' });
      cleanup();
    };

    const cleanup = () => {
      video.removeEventListener('loadedmetadata', onLoaded);
      video.removeEventListener('error', onError);
      video.removeAttribute('src');
      try {
        video.load();
      } catch {
        /* non-fatal */
      }
    };

    video.addEventListener('loadedmetadata', onLoaded);
    video.addEventListener('error', onError);
    video.src = url;

    return () => {
      cancelled = true;
      cleanup();
    };
    // reprobeToken is an intentional extra dependency: it forces a fresh probe of
    // the same URL (e.g. when a still-sending message is confirmed).
  }, [url, reprobeToken]);

  return meta;
}
