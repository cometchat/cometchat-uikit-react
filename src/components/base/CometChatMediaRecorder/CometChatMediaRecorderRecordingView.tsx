import React from 'react';
import type { CometChatMediaRecorderRecordingViewProps } from './CometChatMediaRecorder.types';
import { useCometChatMediaRecorderContext } from './CometChatMediaRecorder.context';
import { useLocale } from '../../../context/locale/LocaleContext';
import './CometChatMediaRecorder.css';

const onKey = (e: React.KeyboardEvent, fn: () => void) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fn();
  }
};

/**
 * Renders the recording state UI.
 * Angular layout: [dot] [waveform] [timer] [pause]
 *
 * Only visible when state is 'recording'.
 * Children (typically Timer) are rendered between waveform and pause button.
 */
export const CometChatMediaRecorderRecordingView: React.FC<
  CometChatMediaRecorderRecordingViewProps
> = ({ className, children }) => {
  const { state, waveformHeights, pauseRecording } = useCometChatMediaRecorderContext();
  const { getLocalizedString } = useLocale();

  // Only show during active recording
  if (state !== 'recording') return null;

  const baseClass = 'cometchat-media-recorder__recording-view';
  const viewClass = className ? `${baseClass} ${className}` : baseClass;

  return (
    <>
      {/* Recording indicator dot */}
      <div className={'cometchat-media-recorder__recording-dot'} aria-hidden="true" />

      {/* Real-time waveform */}
      <div className={`cometchat-media-recorder__waveform ${viewClass}`} aria-hidden="true">
        {waveformHeights.map((height, i) => (
          <div
            key={i}
            className={`cometchat-media-recorder__waveform-bar cometchat-media-recorder__waveform-bar--active`}
            style={{ height: `${String(height)}px` }}
          />
        ))}
      </div>

      {/* Timer (passed as children) */}
      {children}

      {/* Pause button — after timer, matching Angular */}
      <div
        className={'cometchat-media-recorder__inline-pause'}
        onClick={pauseRecording}
        onKeyDown={e => {
          onKey(e, pauseRecording);
        }}
        role="button"
        tabIndex={0}
        aria-label={getLocalizedString('media_recorder_pause')}
      >
        <div className={'cometchat-media-recorder__inline-pause-icon'} />
      </div>
    </>
  );
};
