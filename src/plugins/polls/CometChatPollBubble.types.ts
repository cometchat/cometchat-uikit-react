/**
 * Types for the CometChatPollBubble component.
 */

import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatMessageBubbleAlignment } from '../plugin.types';

/** Voter information for a poll option. */
export interface CometChatPollVoterInfo {
  /** Voter's display name. */
  name: string;
  /** Voter's avatar URL (optional). */
  avatar?: string;
}

/** Vote result for a single poll option. */
export interface CometChatPollOptionResult {
  /** Number of votes for this option. */
  count: number;
  /** Map of voter UIDs to voter information. */
  voters: Record<string, CometChatPollVoterInfo>;
}

/** Complete poll results. */
export interface CometChatPollResults {
  /** Total number of votes across all options. */
  total: number;
  /** Per-option vote results, keyed by option ID. */
  options: Record<string, CometChatPollOptionResult>;
}

/** Raw poll data extracted from message metadata. */
export interface CometChatPollData {
  /** Unique identifier for the poll. */
  id: string | number;
  /** The poll question text. */
  question: string;
  /** Map of option IDs to option text. */
  options: Record<string, string>;
  /** Poll results. */
  results: CometChatPollResults;
}

/** Processed poll option ready for display. */
export interface CometChatPollBubbleOption {
  /** Option identifier. */
  id: string;
  /** Option display text. */
  text: string;
  /** Number of votes for this option. */
  count: number;
  /** Percentage of total votes (e.g., "45%"). */
  percent: string;
  /** Whether the logged-in user selected this option. */
  selectedByLoggedInUser: boolean;
  /** Array of voter objects (up to 3) for avatar display. */
  voters: CometChatPollVoterInfo[];
}

/** Event emitted when a vote is successfully submitted. */
export interface CometChatPollVoteEvent {
  /** The poll ID. */
  pollId: string | number;
  /** The selected option ID. */
  optionId: string;
  /** The selected option text. */
  optionText: string;
  /** The message containing the poll. */
  message: CometChat.CustomMessage;
}

/** Event emitted when vote submission fails. */
export interface CometChatPollVoteErrorEvent {
  /** The poll ID. */
  pollId: string | number;
  /** The attempted option ID. */
  optionId: string;
  /** The error that occurred. */
  error: Error;
  /** The message containing the poll. */
  message: CometChat.CustomMessage;
}

/** Props for the CometChatPollBubble component. */
export interface CometChatPollBubbleProps {
  /** The CometChat CustomMessage containing poll data in metadata. */
  message: CometChat.CustomMessage;
  /** Bubble alignment — determines sender/receiver styling. */
  alignment?: CometChatMessageBubbleAlignment;
  /** Logged-in user — used to determine which option the user voted for. */
  loggedInUser?: CometChat.User;
  /** Disable all interaction (for thread header preview). */
  disableInteraction?: boolean;
  /** Callback when a vote is submitted successfully. */
  onVoteSubmit?: (event: CometChatPollVoteEvent) => void;
  /** Callback when a vote submission fails. */
  onVoteError?: (event: CometChatPollVoteErrorEvent) => void;
  /** Optional custom className. */
  className?: string;
}
