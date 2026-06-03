import React, { useState } from 'react';
import { useCometChatFullScreenViewerContext } from './CometChatFullScreenViewer.context';
import { CometChatFullScreenViewerErrorState } from './CometChatFullScreenViewerErrorState';
import { useLocale } from '../../../context/locale/LocaleContext';
import './CometChatFullScreenViewer.css';

/**
 * Image display view. Shows the image with box-shadow, handles load errors.
 */
export const CometChatFullScreenViewerImageView: React.FC = () => {
  const { currentUrl, senderName } = useCometChatFullScreenViewerContext();
  const { getLocalizedString } = useLocale();
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <CometChatFullScreenViewerErrorState
        message={getLocalizedString('full_screen_viewer_failed_image')}
      />
    );
  }

  return (
    <img
      src={currentUrl}
      className={'cometchat-fullscreen-viewer__body-image'}
      alt={
        senderName
          ? `Image from ${senderName}`
          : getLocalizedString('accessibility_full_screen_image')
      }
      decoding="async"
      onError={() => {
        setHasError(true);
      }}
    />
  );
};

CometChatFullScreenViewerImageView.displayName = 'CometChatFullScreenViewerImageView';
