import React from 'react';
import { useLocale } from '../../../context/locale/LocaleContext';
import './CometChatFullScreenViewer.css';

interface CometChatFullScreenViewerErrorStateProps {
  message?: string;
}

/**
 * Error state displayed when media fails to load.
 */
export const CometChatFullScreenViewerErrorState: React.FC<
  CometChatFullScreenViewerErrorStateProps
> = ({ message }) => {
  const { getLocalizedString } = useLocale();
  const displayMessage = message ?? getLocalizedString('full_screen_viewer_failed_media');
  return (
    <div className={'cometchat-fullscreen-viewer__error-state'}>
      <div className={'cometchat-fullscreen-viewer__error-icon'} aria-hidden="true" />
      <div className={'cometchat-fullscreen-viewer__error-text'}>{displayMessage}</div>
    </div>
  );
};

CometChatFullScreenViewerErrorState.displayName = 'CometChatFullScreenViewerErrorState';
