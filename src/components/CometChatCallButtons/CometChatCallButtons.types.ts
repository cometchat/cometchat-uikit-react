import type { ReactNode } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';

/**
 * Props for the standalone CometChatCallButtons component.
 */
export interface CometChatCallButtonsProps {
  /** The user to call (for 1-on-1 calls). Mutually exclusive with group. */
  user?: CometChat.User;
  /** The group to call (for group calls). Mutually exclusive with user. */
  group?: CometChat.Group;
  /** Whether to hide the voice call button. Default: false. */
  hideVoiceCallButton?: boolean;
  /** Whether to hide the video call button. Default: false. */
  hideVideoCallButton?: boolean;
  /** Callback when the voice call button is clicked. Overrides default call initiation. */
  onVoiceCallClick?: (entity: CometChat.User | CometChat.Group) => void;
  /** Callback when the video call button is clicked. Overrides default call initiation. */
  onVideoCallClick?: (entity: CometChat.User | CometChat.Group) => void;
  /**
   * Custom call settings builder for ongoing call sessions.
   * If not provided, falls back to GlobalConfig.callSettingsBuilder, then default.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  callSettingsBuilder?: any;
  /** Error callback for SDK errors. */
  onError?: ((error: CometChat.CometChatException) => void) | null;
  /** Callback when an ongoing call ends. */
  onCallEnded?: () => void;
  /** Optional custom className for the root container. */
  className?: string;
  /** Custom voice call button view. */
  voiceCallButtonView?: ReactNode;
  /** Custom video call button view. */
  videoCallButtonView?: ReactNode;
}
