import React from 'react';
import { useCometChatFullScreenViewerContext } from './CometChatFullScreenViewer.context';
import { useLocale } from '../../../context/locale/LocaleContext';
import './CometChatFullScreenViewer.css';

/**
 * Audio display view with icon, native controls, and filename.
 */
export const CometChatFullScreenViewerAudioView: React.FC = () => {
  const { currentUrl, fileName, senderName } = useCometChatFullScreenViewerContext();
  const { getLocalizedString } = useLocale();

  return (
    <div className={'cometchat-fullscreen-viewer__audio-container'}>
      <div className={'cometchat-fullscreen-viewer__audio-icon'} aria-hidden="true" />
      <audio
        className={'cometchat-fullscreen-viewer__body-audio'}
        src={currentUrl}
        controls
        autoPlay
        aria-label={
          senderName
            ? `Audio from ${senderName}`
            : getLocalizedString('accessibility_full_screen_audio')
        }
      >
        Your browser does not support the audio element.
      </audio>
      {fileName && <div className={'cometchat-fullscreen-viewer__audio-filename'}>{fileName}</div>}
    </div>
  );
};

CometChatFullScreenViewerAudioView.displayName = 'CometChatFullScreenViewerAudioView';
