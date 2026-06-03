import type { CometChat } from '@cometchat/chat-sdk-javascript';

/**
 * SessionSettings — plain object passed to joinSession().
 */
export interface SessionSettings {
  /** Session type: "VIDEO" or "VOICE". Default: "VIDEO". */
  sessionType?: 'VIDEO' | 'VOICE';
  /** Layout mode: "TILE", "SIDEBAR", or "SPOTLIGHT". Default: "TILE". */
  layout?: 'TILE' | 'SIDEBAR' | 'SPOTLIGHT';
  /** Whether to start with microphone muted. Default: false. */
  startAudioMuted?: boolean;
  /** Whether to start with camera off. Default: false. */
  startVideoPaused?: boolean;
  /** Auto-start recording when session begins. Default: false. */
  autoStartRecording?: boolean;
  /** Hide the bottom control bar. Default: false. */
  hideControlPanel?: boolean;
  /** Hide the leave/end session button. Default: false. */
  hideLeaveSessionButton?: boolean;
  /** Hide the mute/unmute audio button. Default: false. */
  hideToggleAudioButton?: boolean;
  /** Hide the video on/off button. Default: false. */
  hideToggleVideoButton?: boolean;
  /** Hide the recording button. Default: true. */
  hideRecordingButton?: boolean;
  /** Hide the screen sharing button. Default: false. */
  hideScreenSharingButton?: boolean;
  /** Hide the layout change button. Default: false. */
  hideChangeLayoutButton?: boolean;
  /** Hide the virtual background button. Default: false. */
  hideVirtualBackgroundButton?: boolean;
  /** Hide the network quality indicator. Default: false. */
  hideNetworkIndicator?: boolean;
  /** Idle timeout before showing prompt (ms). Default: 60000. */
  idleTimeoutPeriodBeforePrompt?: number;
  /** Idle timeout after prompt before ending session (ms). Default: 120000. */
  idleTimeoutPeriodAfterPrompt?: number;
}

export interface CometChatOngoingCallProps {
  /** The call session ID. */
  sessionID: string;
  /** Whether this is an audio-only call. Default: false. */
  isAudioOnly?: boolean;
  /** Whether this uses direct calling (group) vs default calling (user). Default: false. */
  isDirectCalling?: boolean;
  /**
   * Custom session settings for the ongoing call session.
   * If not provided, the component creates default settings internally.
   * Pass SessionSettings plain object.
   *
   * @example
   * ```tsx
   * <CometChatOngoingCall
   *   sessionID="abc123"
   *   callSettings={{ sessionType: 'VIDEO', layout: 'TILE', startAudioMuted: false }}
   * />
   * ```
   */
  callSettings?: SessionSettings;
  /**
   * @deprecated Use `callSettings` instead. This prop is kept for backward compatibility.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  callSettingsBuilder?: any;
  /** Callback when the call ends. */
  onCallEnded?: () => void;
  /** Error callback. */
  onError?: ((error: CometChat.CometChatException) => void) | null;
  /** Optional className for the container. */
  className?: string;
}
