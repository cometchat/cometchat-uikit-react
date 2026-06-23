import React from 'react';
import type { CometChatFullScreenViewerHeaderProps } from './CometChatFullScreenViewer.types';
import { useCometChatFullScreenViewerContext } from './CometChatFullScreenViewer.context';
import { CometChatAvatar } from '../CometChatAvatar/CometChatAvatar';
import './CometChatFullScreenViewer.css';
import { useLocale } from '../../../context/locale/LocaleContext';

/** Formats file size in bytes to a human-readable string. */
function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(unitIndex > 0 ? 1 : 0)} ${units[unitIndex] ?? ''}`;
}

/** Extracts file extension from a filename. */
function getFileExtension(name?: string): string {
  if (!name) return '';
  const parts = name.split('.');
  return parts.length > 1 ? (parts[parts.length - 1] ?? '').toUpperCase() : '';
}

/**
 * Header bar with 3 sections: sender info (left), file info (center), actions (right).
 */
export const CometChatFullScreenViewerHeader: React.FC<CometChatFullScreenViewerHeaderProps> = ({
  children,
  className,
}) => {
  const { getLocalizedString } = useLocale();
  const ctx = useCometChatFullScreenViewerContext();
  const {
    onClose,
    senderName,
    senderAvatar,
    senderStatus,
    sentAt,
    fileName,
    fileSize,
    isGalleryMode,
    currentIndex,
    attachments,
    onDownload,
    currentUrl,
  } = ctx;

  const formattedSize = formatFileSize(fileSize);
  const extension = getFileExtension(fileName);
  const showSenderInfo = !!(senderName ?? senderAvatar);

  const handleClose = (event: React.MouseEvent) => {
    event.stopPropagation();
    onClose();
  };

  const handleDownload = () => {
    const attachment = attachments[currentIndex];
    if (isGalleryMode && attachment) {
      onDownload?.(attachment);
    } else {
      onDownload?.(currentUrl);
    }
  };

  const headerClasses = ['cometchat-fullscreen-viewer__header', className]
    .filter(Boolean)
    .join(' ');

  if (children) {
    return <div className={headerClasses}>{children}</div>;
  }

  return (
    <div className={headerClasses}>
      {/* Left: sender info */}
      <div className={'cometchat-fullscreen-viewer__header-left'}>
        {showSenderInfo && (
          <div className={'cometchat-fullscreen-viewer__sender-info'}>
            <div className={'cometchat-fullscreen-viewer__avatar'}>
              <CometChatAvatar name={senderName ?? ''} image={senderAvatar} size="medium" />
            </div>
            <div className={'cometchat-fullscreen-viewer__sender-details'}>
              {senderName && (
                <div className={'cometchat-fullscreen-viewer__sender-name'}>{senderName}</div>
              )}
              {senderStatus && (
                <div className={'cometchat-fullscreen-viewer__sender-status'}>{senderStatus}</div>
              )}
              {sentAt && <div className={'cometchat-fullscreen-viewer__sender-date'}>{sentAt}</div>}
            </div>
          </div>
        )}
      </div>

      {/* Center: file info */}
      <div className={'cometchat-fullscreen-viewer__header-center'}>
        {fileName && (
          <div className={'cometchat-fullscreen-viewer__file-info-header'}>
            <span className={'cometchat-fullscreen-viewer__file-info-name'}>{fileName}</span>
            {formattedSize && (
              <>
                <span className={'cometchat-fullscreen-viewer__file-info-separator'}>•</span>
                <span className={'cometchat-fullscreen-viewer__file-info-size'}>
                  {formattedSize}
                </span>
              </>
            )}
            {extension && (
              <>
                <span className={'cometchat-fullscreen-viewer__file-info-separator'}>•</span>
                <span className={'cometchat-fullscreen-viewer__file-info-type'}>{extension}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Right: gallery index + download + close */}
      <div className={'cometchat-fullscreen-viewer__header-right'}>
        {isGalleryMode && (
          <div className={'cometchat-fullscreen-viewer__index-display'} aria-live="polite">
            {currentIndex + 1} of {attachments.length}
          </div>
        )}
        {onDownload && (
          <button
            type="button"
            className={'cometchat-fullscreen-viewer__action-button'}
            onClick={handleDownload}
            aria-label={getLocalizedString('accessibility_download')}
          >
            <div
              className={'cometchat-fullscreen-viewer__download-action-icon'}
              aria-hidden="true"
            />
          </button>
        )}
        <button
          type="button"
          className={[
            'cometchat-fullscreen-viewer__action-button',
            'cometchat-fullscreen-viewer__close-btn',
          ].join(' ')}
          onClick={handleClose}
          aria-label={getLocalizedString('accessibility_close')}
        >
          <div className={'cometchat-fullscreen-viewer__close-icon'} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

CometChatFullScreenViewerHeader.displayName = 'CometChatFullScreenViewerHeader';
