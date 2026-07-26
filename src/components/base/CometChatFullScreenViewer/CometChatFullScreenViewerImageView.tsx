import React, { useEffect, useState } from 'react';
import { useCometChatFullScreenViewerContext } from './CometChatFullScreenViewer.context';
import { CometChatFullScreenViewerUnsupportedState } from './CometChatFullScreenViewerUnsupportedState';
import { useLocale } from '../../../context/locale/LocaleContext';
import './CometChatFullScreenViewer.css';

/**
 * Image display view. Shows the image with box-shadow. When the image fails to
 * load (broken URL or non-image content), shows the unsupported / no-preview state.
 */
export const CometChatFullScreenViewerImageView: React.FC = () => {
  const { currentUrl, senderName } = useCometChatFullScreenViewerContext();
  const { getLocalizedString } = useLocale();
  const [hasError, setHasError] = useState(false);

  // Reset the error state when the displayed media changes — otherwise navigating
  // from a broken item to a valid one in the gallery keeps showing the error.
  useEffect(() => {
    setHasError(false);
  }, [currentUrl]);

  if (hasError) {
    return <CometChatFullScreenViewerUnsupportedState />;
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
