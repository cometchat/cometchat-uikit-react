import React from 'react';
import type { CometChatMediaRecorderControlsProps } from './CometChatMediaRecorder.types';
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
 * CometChatMediaRecorderControls — renders the delete button (always)
 * and the start button in idle state.
 *
 * Layout:
 *   Idle:      [delete] [start]
 *   Recording: [delete] (pause is in RecordingView)
 *   Paused:    [delete] (resume is in PreviewView)
 */
export const CometChatMediaRecorderControls: React.FC<CometChatMediaRecorderControlsProps> = ({
  className,
}) => {
  const { state, startRecording, deleteRecording } = useCometChatMediaRecorderContext();
  const { getLocalizedString } = useLocale();

  if (state === 'error') return null;

  const baseClass = 'cometchat-media-recorder__controls';
  const cls = className ? `${baseClass} ${className}` : baseClass;

  return (
    <div className={cls}>
      {/* Delete button — always visible */}
      <div
        className={'cometchat-media-recorder__inline-delete'}
        onClick={deleteRecording}
        onKeyDown={e => {
          onKey(e, deleteRecording);
        }}
        role="button"
        tabIndex={0}
        aria-label={getLocalizedString('media_recorder_delete')}
      >
        <div className={'cometchat-media-recorder__inline-delete-icon'} />
      </div>

      {/* Start button — only in idle state */}
      {state === 'idle' && (
        <div
          className={'cometchat-media-recorder__inline-start'}
          onClick={startRecording}
          onKeyDown={e => {
            onKey(e, startRecording);
          }}
          role="button"
          tabIndex={0}
          aria-label={getLocalizedString('media_recorder_start')}
        >
          <div className={'cometchat-media-recorder__inline-start-icon'} />
        </div>
      )}
    </div>
  );
};
