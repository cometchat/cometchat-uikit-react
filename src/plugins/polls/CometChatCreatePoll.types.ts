/**
 * Types for the CometChatCreatePoll component.
 */

import type { CometChat } from '@cometchat/chat-sdk-javascript';

/** A single poll option with unique ID and value. */
export interface CometChatPollOption {
  /** Unique identifier for the option. */
  id: string;
  /** Option text value. */
  value: string;
}

/** Props for the CometChatCreatePoll component. */
export interface CometChatCreatePollProps {
  /** User to send poll to (for 1:1 conversations). */
  user?: CometChat.User;
  /** Group to send poll to (for group conversations). */
  group?: CometChat.Group;
  /** Message to reply to (for quoted replies). */
  replyToMessage?: CometChat.BaseMessage;
  /** Default number of answer options (min 2, max 12). @default 2 */
  defaultAnswers?: number;
  /** Callback when close is requested (close button, Escape). */
  onClose?: () => void;
  /** Callback when poll is created successfully. */
  onPollCreated?: () => void;
  /** Callback when an error occurs. */
  onError?: (error: unknown) => void;
  /** Title override. */
  title?: string;
  /** Placeholder text for question input. */
  questionPlaceholderText?: string;
  /** Placeholder text for answer inputs. */
  answerPlaceholderText?: string;
  /** Help text for answers section. */
  answerHelpText?: string;
  /** Add option button text. */
  addAnswerText?: string;
  /** Create button text. */
  createPollButtonText?: string;
}
