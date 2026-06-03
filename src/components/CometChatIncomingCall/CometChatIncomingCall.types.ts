import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { ReactNode } from 'react';

export interface CometChatIncomingCallProps {
  /** Custom accept handler (overrides default CometChat.acceptCall). */
  onAccept?: (call: CometChat.Call) => void;
  /** Custom decline handler (overrides default CometChat.rejectCall). */
  onDecline?: (call: CometChat.Call) => void;
  /** Callback when the call ends and ongoing call screen should close. */
  onCallEnded?: () => void;
  /** Disable incoming call sound. Default: false. */
  disableSoundForCalls?: boolean;
  /** Custom sound URL for incoming call. */
  customSoundForCalls?: string;
  /**
   * Custom call settings builder for the ongoing call session after accepting.
   * If not provided, the component uses default settings.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  callSettingsBuilder?: (call: CometChat.Call) => any;
  /** Error callback. */
  onError?: ((error: CometChat.CometChatException) => void) | null;
  /** Custom item view (overrides entire call card). */
  itemView?: (call: CometChat.Call) => ReactNode;
  /** Custom leading view (replaces the avatar section). */
  leadingView?: (call: CometChat.Call) => ReactNode;
  /** Custom title view (replaces the caller name). */
  titleView?: (call: CometChat.Call) => ReactNode;
  /** Custom subtitle view. */
  subtitleView?: (call: CometChat.Call) => ReactNode;
  /** Custom trailing view (replaces the trailing section). */
  trailingView?: (call: CometChat.Call) => ReactNode;
  /** Optional className. */
  className?: string;
}
