import React, { useEffect, useRef, useState } from 'react';
import { useCometChatFullScreenViewerContext } from './CometChatFullScreenViewer.context';
import { CometChatFullScreenViewerUnsupportedState } from './CometChatFullScreenViewerUnsupportedState';
import { useLocale } from '../../../context/locale/LocaleContext';
import './CometChatFullScreenViewer.css';

type VideoStatus = 'loading' | 'valid' | 'invalid';

/**
 * Video display view with native controls and error handling.
 *
 * Only genuine videos play. A file that fails to load, or an audio-only file with
 * no visual track (an audio file sent in a video message), is treated as
 * unsupported instead of silently playing its audio.
 *
 * The <video> is always mounted (hidden until confirmed a real video) so an
 * invalid file never flashes a player, and so navigating between gallery items
 * always re-probes the current media — even coming from the unsupported state.
 */
export const CometChatFullScreenViewerVideoView: React.FC = () => {
  const { currentUrl, senderName } = useCometChatFullScreenViewerContext();
  const { getLocalizedString } = useLocale();
  const [status, setStatus] = useState<VideoStatus>('loading');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    setStatus('loading');

    // Fires once metadata is known. A loaded resource with no visual track (an
    // audio file) isn't a real video, so don't reveal or play it.
    const handleMetadata = () => {
      if (video.videoWidth === 0 && video.videoHeight === 0) {
        video.pause();
        setStatus('invalid');
        return;
      }
      setStatus('valid');
      const playback = video.play() as Promise<void> | undefined;
      if (playback && typeof playback.catch === 'function') {
        playback.catch(() => undefined);
      }
    };
    const handleError = () => {
      setStatus('invalid');
    };

    video.addEventListener('loadedmetadata', handleMetadata);
    video.addEventListener('error', handleError);

    // The bubble tile probes the same URL, so the metadata is frequently already
    // cached and `loadedmetadata` can fire before this listener is attached —
    // which would otherwise leave the view stuck on the hidden/loading state.
    // Evaluate what's already known synchronously to cover that race.
    if (video.error) {
      handleError();
    } else if (video.readyState >= 1 /* HAVE_METADATA */) {
      handleMetadata();
    }

    return () => {
      video.removeEventListener('loadedmetadata', handleMetadata);
      video.removeEventListener('error', handleError);
    };
  }, [currentUrl]);

  const videoClasses = [
    'cometchat-fullscreen-viewer__body-video',
    status !== 'valid' ? 'cometchat-fullscreen-viewer__body-video--loading' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={'cometchat-fullscreen-viewer__video-container'}>
      <video
        ref={videoRef}
        className={videoClasses}
        src={currentUrl}
        controls
        // While hidden (loading / invalid) the player is off-screen — keep it out
        // of the tab order so keyboard users don't land on an invisible control.
        tabIndex={status === 'valid' ? undefined : -1}
        aria-label={
          senderName
            ? `Video from ${senderName}`
            : getLocalizedString('accessibility_full_screen_video')
        }
      >
        Your browser does not support the video element.
      </video>
      {status === 'invalid' && <CometChatFullScreenViewerUnsupportedState />}
    </div>
  );
};

CometChatFullScreenViewerVideoView.displayName = 'CometChatFullScreenViewerVideoView';
