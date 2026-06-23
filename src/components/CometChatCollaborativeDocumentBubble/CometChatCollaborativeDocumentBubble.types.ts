import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatBubbleAlignment } from '../../utils/getBubbleAlignment';

/** Props for the self-extracting collaborative document bubble. */
export interface CometChatCollaborativeDocumentBubbleProps {
  /** The collaborative-document message. The bubble extracts the URL from its metadata. */
  message: CometChat.BaseMessage;
  /** Override incoming/outgoing alignment. Defaults to sender-vs-logged-in-user. */
  alignment?: CometChatBubbleAlignment;
  /** Click handler for the action button. Receives the document URL. Defaults to window.open. */
  onButtonClick?: (url: string) => void;
  /** Disable the action button (e.g. thread header preview). */
  disabled?: boolean;
  /** Optional custom className. */
  className?: string;
}
