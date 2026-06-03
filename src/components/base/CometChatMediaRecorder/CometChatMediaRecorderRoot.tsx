import React, { useCallback, useMemo } from 'react';
import type { CometChatMediaRecorderRootProps } from './CometChatMediaRecorder.types';
import { CometChatMediaRecorderContext } from './CometChatMediaRecorder.context';
import { useCometChatMediaRecorder } from './useCometChatMediaRecorder';
import { useLocale } from '../../../context/locale/LocaleContext';
import './CometChatMediaRecorder.css';

/**
 * Root inline container for the media recorder.
 * Provides recording state context to all sub-components.
 * Handles Escape key to close.
 */
export const CometChatMediaRecorderRoot: React.FC<CometChatMediaRecorderRootProps> = ({
  autoRecording,
  onClose,
  onSubmit,
  onError,
  className,
  children,
}) => {
  const recorder = useCometChatMediaRecorder({ autoRecording, onClose, onSubmit, onError });
  const { getLocalizedString } = useLocale();

  const ctxValue = useMemo(
    () => ({
      state: recorder.state,
      elapsedSeconds: recorder.elapsedSeconds,
      waveformHeights: recorder.waveformHeights,
      error: recorder.error,
      isPreviewPlaying: recorder.isPreviewPlaying,
      previewUrl: recorder.previewUrl,
      previewProgress: recorder.previewProgress,
      startRecording: recorder.startRecording,
      pauseRecording: recorder.pauseRecording,
      deleteRecording: recorder.deleteRecording,
      inlineSend: recorder.inlineSend,
      togglePreviewPlayback: recorder.togglePreviewPlayback,
    }),
    [
      recorder.state,
      recorder.elapsedSeconds,
      recorder.waveformHeights,
      recorder.error,
      recorder.isPreviewPlaying,
      recorder.previewUrl,
      recorder.previewProgress,
      recorder.startRecording,
      recorder.pauseRecording,
      recorder.deleteRecording,
      recorder.inlineSend,
      recorder.togglePreviewPlayback,
    ]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        recorder.deleteRecording();
      }
    },
    [recorder]
  );

  const baseClass = 'cometchat-media-recorder--inline';
  const rootClass = className ? `${baseClass} ${className}` : baseClass;

  // Screen reader state text
  let stateText = '';
  if (recorder.error) {
    stateText = getLocalizedString('media_recorder_error_title');
  } else if (recorder.state === 'recording') {
    stateText = getLocalizedString('media_recorder_recording');
  } else if (recorder.state === 'paused') {
    stateText = getLocalizedString('media_recorder_paused');
  }

  return (
    <CometChatMediaRecorderContext.Provider value={ctxValue}>
      <div
        className={rootClass}
        role="group"
        aria-label={getLocalizedString('media_recorder_aria_label')}
        onKeyDown={handleKeyDown}
      >
        {/* Screen reader announcements */}
        <div
          className={'cometchat-media-recorder__sr-only'}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {stateText}
        </div>
        {children}
      </div>
    </CometChatMediaRecorderContext.Provider>
  );
};
