import type { ReactNode } from 'react';

/** Recording state machine states. */
export type CometChatMediaRecorderState = 'idle' | 'recording' | 'paused' | 'error';

/** Props for CometChatMediaRecorderRoot. */
export interface CometChatMediaRecorderRootProps {
  /** Start recording immediately on mount. */
  autoRecording?: boolean;
  /** Callback when recording is cancelled/closed. */
  onClose?: () => void;
  /** Callback when recorded audio is submitted. */
  onSubmit?: (file: Blob) => void;
  /** Callback when a recording error occurs. */
  onError?: (error: Error) => void;
  /** Optional custom className. */
  className?: string;
  children?: ReactNode;
}

/** Props for CometChatMediaRecorderRecordingView. */
export interface CometChatMediaRecorderRecordingViewProps {
  /** Optional custom className. */
  className?: string;
  children?: ReactNode;
}

/** Props for CometChatMediaRecorderPreviewView (paused state with waveform). */
export interface CometChatMediaRecorderPreviewViewProps {
  /** Optional custom className. */
  className?: string;
  children?: ReactNode;
}

/** Props for CometChatMediaRecorderTimer. */
export interface CometChatMediaRecorderTimerProps {
  /** Optional custom className. */
  className?: string;
}

/** Props for CometChatMediaRecorderControls. */
export interface CometChatMediaRecorderControlsProps {
  /** Optional custom className. */
  className?: string;
}

/** Props for CometChatMediaRecorderErrorView. */
export interface CometChatMediaRecorderErrorViewProps {
  /** Optional custom className. */
  className?: string;
}

/** Context value for CometChatMediaRecorder. */
export interface CometChatMediaRecorderContextValue {
  /** Current recording state. */
  state: CometChatMediaRecorderState;
  /** Elapsed recording time in seconds. */
  elapsedSeconds: number;
  /** Real-time waveform bar heights driven by AnalyserNode. */
  waveformHeights: number[];
  /** Error message (e.g., permission denied). */
  error: string | null;
  /** Whether the preview audio is currently playing (paused state only). */
  isPreviewPlaying: boolean;
  /** Object URL for the recorded audio preview (available when paused). */
  previewUrl: string | null;
  /** Preview playback progress as a fraction (0 to 1). */
  previewProgress: number;
  /** Start or resume recording. */
  startRecording: () => void;
  /** Pause recording. */
  pauseRecording: () => void;
  /** Delete recording and reset to idle / close. */
  deleteRecording: () => void;
  /** Stop recording and immediately submit the blob (inline send). */
  inlineSend: () => void;
  /** Toggle preview playback (play/pause) in paused state. */
  togglePreviewPlayback: () => void;
}
