import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatBubbleAlignment } from '../../utils/getBubbleAlignment';

/** Props for the self-extracting call bubble (direct call / meeting custom messages). */
export interface CometChatCallBubbleProps {
  /**
   * The meeting/direct-call custom message. The bubble extracts the call type,
   * session ID, title, icon and timestamp from it.
   */
  message: CometChat.BaseMessage;
  /** Override incoming/outgoing alignment. Defaults to sender-vs-logged-in-user. */
  alignment?: CometChatBubbleAlignment;
  /** Callback when the Join button is clicked. Receives the session ID. */
  onJoinClick?: (sessionId: string) => void;
  /** Optional custom className. */
  className?: string;
}
