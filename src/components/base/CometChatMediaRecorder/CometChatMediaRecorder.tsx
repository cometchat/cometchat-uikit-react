import { CometChatMediaRecorderRoot } from './CometChatMediaRecorderRoot';
import { CometChatMediaRecorderRecordingView } from './CometChatMediaRecorderRecordingView';
import { CometChatMediaRecorderPreviewView } from './CometChatMediaRecorderPreviewView';
import { CometChatMediaRecorderTimer } from './CometChatMediaRecorderTimer';
import { CometChatMediaRecorderControls } from './CometChatMediaRecorderControls';
import { CometChatMediaRecorderErrorView } from './CometChatMediaRecorderErrorView';

/**
 * CometChatMediaRecorder — compound component for inline audio recording.
 *
 * Renders as an inline bar inside the message composer. The composer's
 * send button calls `inlineSend()` from context to stop + submit.
 *
 * Usage:
 * ```tsx
 * <CometChatMediaRecorder.Root onClose={handleClose} onSubmit={handleSubmit}>
 *   <CometChatMediaRecorder.ErrorView />
 *   <CometChatMediaRecorder.Controls />
 *   <CometChatMediaRecorder.RecordingView>
 *     <CometChatMediaRecorder.Timer />
 *   </CometChatMediaRecorder.RecordingView>
 *   <CometChatMediaRecorder.PreviewView>
 *     <CometChatMediaRecorder.Timer />
 *   </CometChatMediaRecorder.PreviewView>
 * </CometChatMediaRecorder.Root>
 * ```
 */
export const CometChatMediaRecorder = {
  Root: CometChatMediaRecorderRoot,
  RecordingView: CometChatMediaRecorderRecordingView,
  PreviewView: CometChatMediaRecorderPreviewView,
  Timer: CometChatMediaRecorderTimer,
  Controls: CometChatMediaRecorderControls,
  ErrorView: CometChatMediaRecorderErrorView,
} as const;
