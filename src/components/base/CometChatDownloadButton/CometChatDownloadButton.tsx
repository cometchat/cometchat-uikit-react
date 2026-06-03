import React, { useCallback, useRef, useState } from 'react';
import { downloadWithProgress } from '../../../utils/downloadWithProgress';
import './CometChatDownloadButton.css';
import { useLocale } from '../../../hooks/useLocale';

export interface CometChatDownloadButtonProps {
  /** The file URL to download. */
  url: string;
  /** The filename for the downloaded file. */
  fileName: string;
  /** Optional additional className. */
  className?: string;
}

/**
 * CometChatDownloadButton — a reusable download button with circular progress indicator.
 *
 * When idle: shows a download icon button.
 * When downloading: shows a circular SVG progress ring with a cancel button in the center.
 */
export const CometChatDownloadButton: React.FC<CometChatDownloadButtonProps> = ({
  url,
  fileName,
  className,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { getLocalizedString } = useLocale();

  const handleDownload = useCallback(async () => {
    if (!url || isDownloading) return;
    setIsDownloading(true);
    setProgress(0);
    abortControllerRef.current = new AbortController();

    try {
      await downloadWithProgress(
        url,
        fileName,
        p => {
          setProgress(p);
        },
        abortControllerRef.current.signal
      );
    } finally {
      setIsDownloading(false);
      setProgress(0);
      abortControllerRef.current = null;
    }
  }, [url, fileName, isDownloading]);

  const handleCancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsDownloading(false);
    setProgress(0);
  }, []);

  const rootClasses = ['cometchat-download-button', className].filter(Boolean).join(' ');

  if (isDownloading) {
    return (
      <div className={rootClasses}>
        <div className={'cometchat-download-button__progress'}>
          <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
            <circle className={'cometchat-download-button__progress-bg'} cx="12" cy="12" r="10" />
            <circle
              className={'cometchat-download-button__progress-fg'}
              cx="12"
              cy="12"
              r="10"
              style={{ strokeDasharray: `${String(progress * 0.628)} 62.8` }}
            />
          </svg>
          <button
            type="button"
            className={'cometchat-download-button__cancel'}
            onClick={handleCancel}
            aria-label="Cancel download"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={rootClasses}>
      <button
        type="button"
        className={'cometchat-download-button__icon'}
        onClick={() => {
          void handleDownload();
        }}
        aria-label={getLocalizedString('accessibility_download_file').replace('{name}', fileName)}
      />
    </div>
  );
};

CometChatDownloadButton.displayName = 'CometChatDownloadButton';
