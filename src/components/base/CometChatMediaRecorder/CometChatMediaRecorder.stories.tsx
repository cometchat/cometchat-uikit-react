import React from 'react';
import type { Meta } from '@storybook/react';
import { CometChatMediaRecorder } from './CometChatMediaRecorder';
import { CometChatMediaRecorderContext } from './CometChatMediaRecorder.context';
import type {
  CometChatMediaRecorderContextValue,
  CometChatMediaRecorderState,
} from './CometChatMediaRecorder.types';

const meta: Meta = {
  title: 'Base Elements/Media Recorder',
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'An audio recording component with waveform visualization, playback preview, and submit/delete actions.',
      },
    },
  },
};
export default meta;

const noop = () => {};

/** Helper to create a mock context value for a given state. */
function mockCtx(
  overrides: Partial<CometChatMediaRecorderContextValue> & {
    state: CometChatMediaRecorderState;
  }
): CometChatMediaRecorderContextValue {
  return {
    elapsedSeconds: 0,
    waveformHeights: new Array(30).fill(4) as number[],
    error: null,
    isPreviewPlaying: false,
    previewUrl: null,
    previewProgress: 0,
    startRecording: noop,
    pauseRecording: noop,
    deleteRecording: noop,
    inlineSend: noop,
    togglePreviewPlayback: noop,
    ...overrides,
  };
}

/** Default — idle state with record button visible. */
export const Default = () => (
  <CometChatMediaRecorder.Root
    autoRecording={false}
    onClose={() => console.log('Close')}
    onSubmit={blob => console.log('Submit', blob)}
    onError={err => console.error('Error', err)}
  >
    <CometChatMediaRecorder.ErrorView />
    <CometChatMediaRecorder.Controls />
    <CometChatMediaRecorder.RecordingView>
      <CometChatMediaRecorder.Timer />
    </CometChatMediaRecorder.RecordingView>
    <CometChatMediaRecorder.PreviewView>
      <CometChatMediaRecorder.Timer />
    </CometChatMediaRecorder.PreviewView>
  </CometChatMediaRecorder.Root>
);

/** Idle state — awaiting user action. */
export const Idle = () => (
  <CometChatMediaRecorder.Root
    autoRecording={false}
    onClose={() => console.log('Close')}
    onSubmit={blob => console.log('Submit', blob)}
    onError={err => console.error('Error', err)}
  >
    <CometChatMediaRecorder.ErrorView />
    <CometChatMediaRecorder.Controls />
    <CometChatMediaRecorder.RecordingView>
      <CometChatMediaRecorder.Timer />
    </CometChatMediaRecorder.RecordingView>
    <CometChatMediaRecorder.PreviewView>
      <CometChatMediaRecorder.Timer />
    </CometChatMediaRecorder.PreviewView>
  </CometChatMediaRecorder.Root>
);

/** Recording state — starts recording immediately on mount. */
export const Recording = () => (
  <CometChatMediaRecorder.Root
    autoRecording={true}
    onClose={() => console.log('Close')}
    onSubmit={blob => console.log('Submit', blob)}
    onError={err => console.error('Error', err)}
  >
    <CometChatMediaRecorder.ErrorView />
    <CometChatMediaRecorder.Controls />
    <CometChatMediaRecorder.RecordingView>
      <CometChatMediaRecorder.Timer />
    </CometChatMediaRecorder.RecordingView>
    <CometChatMediaRecorder.PreviewView>
      <CometChatMediaRecorder.Timer />
    </CometChatMediaRecorder.PreviewView>
  </CometChatMediaRecorder.Root>
);

/** Paused state (mocked). */
export const Paused = () => {
  const heights = Array.from({ length: 30 }, (_, i) =>
    Math.max(4, Math.round(Math.cos(i * 0.4) * 10 + 10))
  );

  return (
    <CometChatMediaRecorderContext.Provider
      value={mockCtx({ state: 'paused', elapsedSeconds: 15, waveformHeights: heights })}
    >
      <div
        className="cometchat-media-recorder--inline"
        style={{ display: 'flex', gap: 8, alignItems: 'center' }}
      >
        <CometChatMediaRecorder.Controls />
        <CometChatMediaRecorder.PreviewView>
          <CometChatMediaRecorder.Timer />
        </CometChatMediaRecorder.PreviewView>
      </div>
    </CometChatMediaRecorderContext.Provider>
  );
};

/** Error state — permission denied (mocked). */
export const ErrorState = () => (
  <CometChatMediaRecorderContext.Provider
    value={mockCtx({ state: 'error', error: 'permission_denied' })}
  >
    <div
      className="cometchat-media-recorder--inline"
      style={{ display: 'flex', gap: 8, alignItems: 'center' }}
    >
      <CometChatMediaRecorder.ErrorView />
    </div>
  </CometChatMediaRecorderContext.Provider>
);
/** Auto-recording — starts recording immediately on mount. */
export const AutoRecording = () => (
  <CometChatMediaRecorder.Root
    autoRecording
    onClose={() => {
      console.log('closed');
    }}
    onSubmit={blob => {
      console.log('submitted', blob);
    }}
  >
    <CometChatMediaRecorder.ErrorView />
    <CometChatMediaRecorder.Controls />
    <CometChatMediaRecorder.RecordingView>
      <CometChatMediaRecorder.Timer />
    </CometChatMediaRecorder.RecordingView>
    <CometChatMediaRecorder.PreviewView>
      <CometChatMediaRecorder.Timer />
    </CometChatMediaRecorder.PreviewView>
  </CometChatMediaRecorder.Root>
);

/** Loading fallback skeleton — matches real component dimensions for CLS prevention. */
export const LoadingFallback = () => (
  <div
    style={{
      width: 280,
      height: 36,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--cometchat-text-color-secondary, #727272)',
      font: 'var(--cometchat-font-caption1-regular, 400 12px Roboto)',
    }}
    role="status"
    aria-label="Loading media recorder"
  >
    Loading…
  </div>
);
