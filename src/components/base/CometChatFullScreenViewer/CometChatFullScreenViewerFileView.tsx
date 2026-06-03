import React from 'react';
import { useCometChatFullScreenViewerContext } from './CometChatFullScreenViewer.context';
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
 * File preview view with icon, extension badge, name, size, and download link.
 */
export const CometChatFullScreenViewerFileView: React.FC = () => {
  const { getLocalizedString } = useLocale();
  const { currentUrl, fileName, fileSize } = useCometChatFullScreenViewerContext();

  const formattedSize = formatFileSize(fileSize);
  const extension = getFileExtension(fileName);
  const displayName = fileName ?? 'File';

  return (
    <div className={'cometchat-fullscreen-viewer__file-preview'}>
      <div className={'cometchat-fullscreen-viewer__file-icon'}>
        <div className={'cometchat-fullscreen-viewer__file-icon-inner'} aria-hidden="true" />
        {extension && (
          <div className={'cometchat-fullscreen-viewer__file-extension'}>{extension}</div>
        )}
      </div>
      <div className={'cometchat-fullscreen-viewer__file-info'}>
        <div className={'cometchat-fullscreen-viewer__file-preview-name'}>{displayName}</div>
        {formattedSize && (
          <div className={'cometchat-fullscreen-viewer__file-preview-size'}>{formattedSize}</div>
        )}
      </div>
      {currentUrl && (
        <a
          href={currentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={'cometchat-fullscreen-viewer__download-button'}
          aria-label={getLocalizedString('accessibility_download_file').replace(
            '{name}',
            displayName
          )}
        >
          <span className={'cometchat-fullscreen-viewer__download-icon'} aria-hidden="true" />
          <span>{getLocalizedString('accessibility_download')}</span>
        </a>
      )}
    </div>
  );
};

CometChatFullScreenViewerFileView.displayName = 'CometChatFullScreenViewerFileView';
