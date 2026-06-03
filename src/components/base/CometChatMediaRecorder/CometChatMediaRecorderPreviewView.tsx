import React from 'react';
import type { CometChatMediaRecorderPreviewViewProps } from './CometChatMediaRecorder.types';
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
 * Renders the paused state UI.
 * Angular layout: [play] [waveform] [timer] [resume(mic)]
 * (delete is rendered by Controls, send is rendered by composer)
 *
 * Only visible when state is 'paused'.
 * Children (typically Timer) are rendered between waveform and resume button.
 */
export const CometChatMediaRecorderPreviewView: React.FC<
  CometChatMediaRecorderPreviewViewProps
> = ({ className, children }) => {
  const {
    state,
    waveformHeights,
    isPreviewPlaying,
    previewProgress,
    startRecording,
    togglePreviewPlayback,
  } = useCometChatMediaRecorderContext();
  const { getLocalizedString } = useLocale();

  if (state !== 'paused') return null;

  const baseClass = 'cometchat-media-recorder__preview-view';
  const viewClass = className ? `${baseClass} ${className}` : baseClass;

  const playIconClass = [
    'cometchat-media-recorder__inline-play-icon',
    isPreviewPlaying ? 'cometchat-media-recorder__inline-play-icon--playing' : '',
  ]
    .filter(Boolean)
    .join(' ');

  // Calculate which bars should be "active" (purple) based on playback progress
  const totalBars = waveformHeights.length;
  const activeBarsCount = Math.floor(previewProgress * totalBars);

  return (
    <>
      {/* Play/Pause Preview Button */}
      <div
        className={'cometchat-media-recorder__inline-play'}
        onClick={togglePreviewPlayback}
        onKeyDown={e => {
          onKey(e, togglePreviewPlayback);
        }}
        role="button"
        tabIndex={0}
        aria-label={
          isPreviewPlaying
            ? getLocalizedString('media_recorder_pause') || 'Pause preview'
            : getLocalizedString('media_recorder_play_preview') || 'Play preview'
        }
      >
        <div className={playIconClass} />
      </div>

      {/* Waveform with progressive coloring based on playback progress */}
      <div className={`cometchat-media-recorder__waveform ${viewClass}`} aria-hidden="true">
        {waveformHeights.map((height, i) => {
          const isActive = i < activeBarsCount;
          const barClass = [
            'cometchat-media-recorder__waveform-bar',
            isActive ? 'cometchat-media-recorder__waveform-bar--active' : '',
          ]
            .filter(Boolean)
            .join(' ');
          return <div key={i} className={barClass} style={{ height: `${String(height)}px` }} />;
        })}
      </div>

      {/* Timer (passed as children) */}
      {children}

      {/* Resume Recording Button — AFTER timer, matching Angular */}
      <div
        className={'cometchat-media-recorder__inline-resume'}
        onClick={startRecording}
        onKeyDown={e => {
          onKey(e, startRecording);
        }}
        role="button"
        tabIndex={0}
        aria-label={getLocalizedString('media_recorder_resume')}
      >
        <div className={'cometchat-media-recorder__inline-resume-icon'} />
      </div>
    </>
  );
};
