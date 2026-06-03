import React from 'react';
import type { CometChatMediaRecorderTimerProps } from './CometChatMediaRecorder.types';
import { useCometChatMediaRecorderContext } from './CometChatMediaRecorder.context';
import './CometChatMediaRecorder.css';

/**
 * Formats seconds into M:SS string (matching Angular implementation).
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins)}:${secs < 10 ? '0' : ''}${String(secs)}`;
}

/**
 * Displays the elapsed recording time in M:SS format.
 * Uses `role="timer"` for screen reader accessibility.
 */
export const CometChatMediaRecorderTimer: React.FC<CometChatMediaRecorderTimerProps> = ({
  className,
}) => {
  const { elapsedSeconds } = useCometChatMediaRecorderContext();
  const formatted = formatTime(elapsedSeconds);

  const mins = Math.floor(elapsedSeconds / 60);
  const secs = elapsedSeconds % 60;
  const durationLabel = `${String(mins)} minutes ${String(secs)} seconds`;

  const baseClass = 'cometchat-media-recorder__timer';
  const timerClass = className ? `${baseClass} ${className}` : baseClass;

  return (
    <span className={timerClass} role="timer" aria-live="off" aria-label={durationLabel}>
      {formatted}
    </span>
  );
};
