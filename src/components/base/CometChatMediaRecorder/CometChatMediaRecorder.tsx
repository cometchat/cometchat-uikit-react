import React from 'react';
import { CometChatMediaRecorderRoot } from './CometChatMediaRecorderRoot';
import { CometChatMediaRecorderRecordingView } from './CometChatMediaRecorderRecordingView';
import { CometChatMediaRecorderPreviewView } from './CometChatMediaRecorderPreviewView';
import { CometChatMediaRecorderTimer } from './CometChatMediaRecorderTimer';
import { CometChatMediaRecorderControls } from './CometChatMediaRecorderControls';
import { CometChatMediaRecorderErrorView } from './CometChatMediaRecorderErrorView';
import type { CometChatMediaRecorderRootProps } from './CometChatMediaRecorder.types';

export type CometChatMediaRecorderProps = Omit<CometChatMediaRecorderRootProps, 'children'>;

const CometChatMediaRecorderComponent: React.FC<CometChatMediaRecorderProps> = props => {
  return (
    <CometChatMediaRecorderRoot {...props}>
      <CometChatMediaRecorderErrorView />
      <CometChatMediaRecorderControls />
      <CometChatMediaRecorderRecordingView>
        <CometChatMediaRecorderTimer />
      </CometChatMediaRecorderRecordingView>
      <CometChatMediaRecorderPreviewView>
        <CometChatMediaRecorderTimer />
      </CometChatMediaRecorderPreviewView>
    </CometChatMediaRecorderRoot>
  );
};

CometChatMediaRecorderComponent.displayName = 'CometChatMediaRecorder';

export const CometChatMediaRecorder = Object.assign(CometChatMediaRecorderComponent, {
  Root: CometChatMediaRecorderRoot,
  RecordingView: CometChatMediaRecorderRecordingView,
  PreviewView: CometChatMediaRecorderPreviewView,
  Timer: CometChatMediaRecorderTimer,
  Controls: CometChatMediaRecorderControls,
  ErrorView: CometChatMediaRecorderErrorView,
});
