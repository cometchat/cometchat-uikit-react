import React, { useState } from 'react';
import { useCometChatFullScreenViewerContext } from './CometChatFullScreenViewer.context';
import { CometChatFullScreenViewerErrorState } from './CometChatFullScreenViewerErrorState';
import { useLocale } from '../../../context/locale/LocaleContext';
import './CometChatFullScreenViewer.css';

/**
 * Video display view with native controls and error handling.
 */
export const CometChatFullScreenViewerVideoView: React.FC = () => {
  const { currentUrl, senderName } = useCometChatFullScreenViewerContext();
  const { getLocalizedString } = useLocale();
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <CometChatFullScreenViewerErrorState
        message={getLocalizedString('full_screen_viewer_failed_video')}
      />
    );
  }

  return (
    <div className={'cometchat-fullscreen-viewer__video-container'}>
      <video
        className={'cometchat-fullscreen-viewer__body-video'}
        src={currentUrl}
        controls
        autoPlay
        aria-label={
          senderName
            ? `Video from ${senderName}`
            : getLocalizedString('accessibility_full_screen_video')
        }
        onError={() => {
          setHasError(true);
        }}
      >
        Your browser does not support the video element.
      </video>
    </div>
  );
};

CometChatFullScreenViewerVideoView.displayName = 'CometChatFullScreenViewerVideoView';
