import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatTextFormatter } from '../../formatters/CometChatTextFormatter';
import type { CometChatBubbleAlignment } from '../../utils/getBubbleAlignment';

/** Props for the voice note bubble. */
export interface CometChatVoiceNoteBubbleProps {
  /**
   * The audio message (voice note). The bubble delegates to the existing
   * CometChatAudioBubble waveform renderer.
   */
  message: CometChat.MediaMessage;
  /** Override incoming/outgoing alignment. Defaults to sender-vs-logged-in-user. */
  alignment?: CometChatBubbleAlignment;
  /** Text formatters applied to any caption. */
  textFormatters?: CometChatTextFormatter[];
  /** Optional custom className. */
  className?: string;
}
