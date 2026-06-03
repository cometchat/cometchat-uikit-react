import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { ReactNode } from 'react';

export interface CometChatOutgoingCallProps {
  /** The CometChat call object. */
  call: CometChat.Call;
  /** Disable outgoing call sound. Default: false. */
  disableSoundForCalls?: boolean;
  /** Custom sound URL for outgoing call. */
  customSoundForCalls?: string;
  /** Callback when the cancel/end button is clicked. */
  onCallCanceled?: () => void;
  /** Error callback. */
  onError?: ((error: CometChat.CometChatException) => void) | null;
  /** Custom title view (overrides receiver name). */
  titleView?: ReactNode;
  /** Custom subtitle view (overrides "Calling..." text). */
  subtitleView?: ReactNode;
  /** Custom avatar view. */
  avatarView?: ReactNode;
  /** Custom cancel button view. */
  cancelButtonView?: ReactNode;
  /** Optional className. */
  className?: string;
}
