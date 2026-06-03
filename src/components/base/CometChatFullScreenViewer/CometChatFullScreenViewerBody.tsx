import React from 'react';
import type { CometChatFullScreenViewerBodyProps } from './CometChatFullScreenViewer.types';
import { useCometChatFullScreenViewerContext } from './CometChatFullScreenViewer.context';
import { CometChatFullScreenViewerImageView } from './CometChatFullScreenViewerImageView';
import { CometChatFullScreenViewerVideoView } from './CometChatFullScreenViewerVideoView';
import { CometChatFullScreenViewerAudioView } from './CometChatFullScreenViewerAudioView';
import { CometChatFullScreenViewerFileView } from './CometChatFullScreenViewerFileView';
import './CometChatFullScreenViewer.css';
import { useLocale } from '../../../context/locale/LocaleContext';

/**
 * Body area that delegates to the appropriate media-specific view based on mediaType.
 */
export const CometChatFullScreenViewerBody: React.FC<CometChatFullScreenViewerBodyProps> = ({
  children,
  className,
}) => {
  const { getLocalizedString } = useLocale();
  const { mediaType, currentUrl } = useCometChatFullScreenViewerContext();

  const bodyClasses = ['cometchat-fullscreen-viewer__body', className].filter(Boolean).join(' ');

  if (children) {
    return <div className={bodyClasses}>{children}</div>;
  }

  return (
    <div className={bodyClasses}>
      {mediaType === 'image' && <CometChatFullScreenViewerImageView />}
      {mediaType === 'video' && <CometChatFullScreenViewerVideoView />}
      {mediaType === 'audio' && <CometChatFullScreenViewerAudioView />}
      {mediaType === 'file' && <CometChatFullScreenViewerFileView />}
      {!currentUrl && !children && (
        <div className={'cometchat-fullscreen-viewer__error-text'}>
          {getLocalizedString('full_screen_viewer_empty')}
        </div>
      )}
    </div>
  );
};

CometChatFullScreenViewerBody.displayName = 'CometChatFullScreenViewerBody';
