import React from 'react';
import { useCometChatFullScreenViewerContext } from './CometChatFullScreenViewer.context';
import { CometChatButton } from '../CometChatButton/CometChatButton';
import { useLocale } from '../../../context/locale/LocaleContext';
import unsupportedIcon from '../../../assets/unsupported.svg';
import './CometChatFullScreenViewer.css';

/**
 * Unsupported / no-preview state for the fullscreen viewer.
 *
 * Shown when the current media can't be previewed — a broken URL, or a file whose
 * real type doesn't match the bubble type (e.g. an audio file in a video message).
 * Offers a download action so the user can still retrieve the file.
 */
export const CometChatFullScreenViewerUnsupportedState: React.FC = () => {
  const { getLocalizedString } = useLocale();
  const { onDownload, isGalleryMode, attachments, currentIndex, currentUrl } =
    useCometChatFullScreenViewerContext();

  const handleDownload = () => {
    const attachment = attachments[currentIndex];
    if (isGalleryMode && attachment) {
      onDownload?.(attachment);
    } else {
      onDownload?.(currentUrl);
    }
  };

  return (
    <div className={'cometchat-fullscreen-viewer__unsupported-state'}>
      <div className={'cometchat-fullscreen-viewer__unsupported-icon-wrapper'}>
        <img
          src={unsupportedIcon}
          alt=""
          aria-hidden="true"
          className={'cometchat-fullscreen-viewer__unsupported-icon'}
        />
      </div>
      <div className={'cometchat-fullscreen-viewer__unsupported-title'}>
        {getLocalizedString('full_screen_viewer_no_preview')}
      </div>
      <div className={'cometchat-fullscreen-viewer__unsupported-subtitle'}>
        {getLocalizedString('full_screen_viewer_preview_unsupported')}
      </div>
      {onDownload && (currentUrl || attachments[currentIndex]?.url) && (
        <CometChatButton
          className={'cometchat-fullscreen-viewer__unsupported-download'}
          variant="primary"
          size="md"
          onClick={handleDownload}
          icon={
            <span className={'cometchat-fullscreen-viewer__download-icon'} aria-hidden="true" />
          }
          text={getLocalizedString('accessibility_download')}
        />
      )}
    </div>
  );
};

CometChatFullScreenViewerUnsupportedState.displayName = 'CometChatFullScreenViewerUnsupportedState';
