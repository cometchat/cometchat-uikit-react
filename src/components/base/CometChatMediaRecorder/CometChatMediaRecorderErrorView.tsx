import React from 'react';
import type { CometChatMediaRecorderErrorViewProps } from './CometChatMediaRecorder.types';
import { useCometChatMediaRecorderContext } from './CometChatMediaRecorder.context';
import { useLocale } from '../../../context/locale/LocaleContext';
import './CometChatMediaRecorder.css';

/**
 * Renders the inline error state UI — mic-off icon + error text + close button.
 * Uses `role="alert"` for screen reader announcement.
 * Only visible when state is 'error'.
 */
export const CometChatMediaRecorderErrorView: React.FC<CometChatMediaRecorderErrorViewProps> = ({
  className,
}) => {
  const { state, deleteRecording } = useCometChatMediaRecorderContext();
  const { getLocalizedString } = useLocale();

  if (state !== 'error') return null;

  const baseClass = 'cometchat-media-recorder__inline-error';
  const errorClass = className ? `${baseClass} ${className}` : baseClass;

  const handleKeyActivate = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      deleteRecording();
    }
  };

  return (
    <div className={errorClass} role="alert">
      <div className={'cometchat-media-recorder__inline-error-icon'} aria-hidden="true" />
      <span className={'cometchat-media-recorder__inline-error-text'}>
        {getLocalizedString('media_recorder_error_title')}
      </span>
      <div
        className={'cometchat-media-recorder__inline-close'}
        onClick={deleteRecording}
        onKeyDown={handleKeyActivate}
        role="button"
        tabIndex={0}
        aria-label={getLocalizedString('media_recorder_delete')}
      >
        <div className={'cometchat-media-recorder__inline-close-icon'} />
      </div>
    </div>
  );
};
