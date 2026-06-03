import type { ReactNode } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';

// --- User Status ---

/** User online/offline status. */
export type CometChatUserStatus = 'online' | 'offline';

// --- Typing Display ---

/** Typing indicator display info for the subtitle. */
export interface CometChatTypingDisplay {
  /** Whether someone is currently typing. */
  isTyping: boolean;
  /** Display text for the typing indicator. */
  text: string;
}

// --- Context Value ---

/** Context value shared between all MessageHeader sub-components. */
export interface CometChatMessageHeaderContextValue {
  /** The user being displayed (1-on-1 conversation). */
  user: CometChat.User | null;
  /** The group being displayed (group conversation). */
  group: CometChat.Group | null;
  /** User online/offline status. */
  userStatus: CometChatUserStatus;
  /** Last active timestamp (epoch seconds) for offline users. */
  lastActiveAt: number | null;
  /** Whether someone is currently typing. */
  isTyping: boolean;
  /** Typing display text (e.g., "typing...", "John is typing..."). */
  typingText: string;
  /** Group member count. */
  groupMemberCount: number;
  /** Whether user status should be hidden. */
  hideUserStatus: boolean;
  /** Display name (user name or group name). */
  displayName: string;
  /** Avatar image URL. */
  avatarImage: string;
  /** Avatar name (for initials fallback). */
  avatarName: string;
  /** Whether this is a user conversation. */
  isUserConversation: boolean;
  /** Whether this is a group conversation. */
  isGroupConversation: boolean;
  // --- Call State ---
  /** Whether call buttons are disabled (during active call). */
  callButtonsDisabled: boolean;
  /** Whether to show the outgoing call screen overlay. */
  showOutgoingCallScreen: boolean;
  /** Whether to show the ongoing call screen. */
  showOngoingCall: boolean;
  /** Call session ID for ongoing call. */
  callSessionId: string;
  /** Whether current call uses direct calling (group) vs default (user). */
  isDirectCalling: boolean;
  /** Whether current group call is audio-only. */
  isGroupAudioCall: boolean;
  /** Active outgoing call object. */
  activeCall: CometChat.Call | null;
  // --- Actions ---
  /** Initiate an audio call. */
  initiateAudioCall: () => Promise<void>;
  /** Initiate a video call. */
  initiateVideoCall: () => Promise<void>;
  /** Cancel the current outgoing call. */
  cancelOutgoingCall: () => Promise<void>;
  /** Reset all call state. */
  resetCallState: () => void;
  // --- Callbacks ---
  /** Callback when the back button is clicked. */
  onBack?: () => void;
  /** Callback when the header item (avatar/name area) is clicked. */
  onItemClick?: (entity: CometChat.User | CometChat.Group) => void;
  /** Callback when the search button is clicked. */
  onSearchOptionClicked?: () => void;
  /** Callback when the conversation summary button is clicked. */
  onSummaryClick?: () => void;
  /** Number of messages to include in summary generation (default: 1000). */
  summaryGenerationMessageCount: number;
  /** Callback when the voice call button is clicked. */
  onVoiceCallClick?: (entity: CometChat.User | CometChat.Group) => void;
  /** Callback when the video call button is clicked. */
  onVideoCallClick?: (entity: CometChat.User | CometChat.Group) => void;
}

// --- Root Props ---

/** Props for CometChatMessageHeaderRoot. */
export interface CometChatMessageHeaderRootProps {
  /** The user to display (for 1-on-1 conversations). Mutually exclusive with group. */
  user?: CometChat.User;
  /** The group to display (for group conversations). Mutually exclusive with user. */
  group?: CometChat.Group;
  /** Whether to hide the user's online/offline status. Default: false. */
  hideUserStatus?: boolean;
  /** Whether to hide the back button. Default: false (back button visible). */
  hideBackButton?: boolean;
  /** Whether to show the search option. Default: true. */
  showSearchOption?: boolean;
  /** Whether to show the AI conversation summary button. Default: false. */
  showConversationSummaryButton?: boolean;
  /**
   * Auto-trigger conversation summary when unread message count >= 15.
   * Requires `showConversationSummaryButton` to be true and `onSummaryClick` to be provided.
   * Matches prop.
   * Default: false.
   */
  enableAutoSummaryGeneration?: boolean;
  /**
   * Number of last messages to include in the summary request.
   * Passed to the `onSummaryClick` callback via the `summaryGenerationMessageCount` context field.
   * Matches prop.
   * Default: 1000.
   */
  summaryGenerationMessageCount?: number;
  /** Whether to hide the voice call button. Default: false (shown by default). */
  hideVoiceCallButton?: boolean;
  /** Whether to hide the video call button. Default: false (shown by default). */
  hideVideoCallButton?: boolean;
  /**
   * Custom call settings builder for ongoing call sessions.
   * Passed to the OngoingCall component when a call is started.
   * If not provided, falls back to GlobalConfig.callSettingsBuilder, then default.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  callSettingsBuilder?: any;
  /** Custom date/time format for the "last active" timestamp in the subtitle. */
  lastActiveAtDateTimeFormat?: import('../base/CometChatDate/CometChatDate.types').CometChatDateFormatConfig;
  /** Callback when the back button is clicked. */
  onBack?: () => void;
  /** Callback when the header item (avatar/name area) is clicked. */
  onItemClick?: (entity: CometChat.User | CometChat.Group) => void;
  /** Callback when the search button is clicked. */
  onSearchOptionClicked?: () => void;
  /** Callback when the conversation summary button is clicked. */
  onSummaryClick?: () => void;
  /** Callback when the voice call button is clicked. Overrides default call initiation. */
  onVoiceCallClick?: (entity: CometChat.User | CometChat.Group) => void;
  /** Callback when the video call button is clicked. Overrides default call initiation. */
  onVideoCallClick?: (entity: CometChat.User | CometChat.Group) => void;
  /** Error callback for SDK errors. */
  onError?: ((error: CometChat.CometChatException) => void) | null;
  /** Optional custom className for the root container. */
  className?: string;
  /** Children for compound composition. If omitted, renders default layout. */
  children?: ReactNode;
}

// --- Sub-component Props ---

/** Props for CometChatMessageHeaderBackButton. */
export interface CometChatMessageHeaderBackButtonProps {
  /** Optional custom className. */
  className?: string;
}

/** Props for CometChatMessageHeaderAvatar. */
export interface CometChatMessageHeaderAvatarProps {
  /** Optional custom className. */
  className?: string;
}

/** Props for CometChatMessageHeaderTitle. */
export interface CometChatMessageHeaderTitleProps {
  /** Optional custom className. */
  className?: string;
}

/** Props for CometChatMessageHeaderSubtitle. */
export interface CometChatMessageHeaderSubtitleProps {
  /** Optional custom className. */
  className?: string;
}

/** Props for CometChatMessageHeaderCallButtons. */
export interface CometChatMessageHeaderCallButtonsProps {
  /** Optional custom className. */
  className?: string;
}

/** Props for CometChatMessageHeaderSearchButton. */
export interface CometChatMessageHeaderSearchButtonProps {
  /** Override the default search click handler. */
  onClick?: () => void;
  /** Optional custom className. */
  className?: string;
}

/** Props for CometChatMessageHeaderSummaryButton. */
export interface CometChatMessageHeaderSummaryButtonProps {
  /** Override the default summary click handler. */
  onClick?: () => void;
  /** Optional custom className. */
  className?: string;
}

/** Props for CometChatMessageHeaderOverflowMenu. */
export interface CometChatMessageHeaderOverflowMenuProps {
  /** Optional custom className. */
  className?: string;
}

/** Props for CometChatMessageHeaderAuxiliaryButtons. */
export interface CometChatMessageHeaderAuxiliaryButtonsProps {
  /** Optional custom className. */
  className?: string;
  /** Custom auxiliary button content. */
  children?: ReactNode;
}

// ==================== Convenience Props (Flat API) ====================

/** Convenience view props for the direct `<CometChatMessageHeader />` flat API. */
export interface CometChatMessageHeaderConvenienceProps {
  /** Custom leading view (replaces default avatar area). */
  leadingView?: ReactNode;
  /** Custom title view (replaces default title). */
  titleView?: ReactNode;
  /** Custom subtitle view (replaces default subtitle). */
  subtitleView?: ReactNode;
  /** Custom trailing view (replaces default trailing area with call buttons + menu). */
  trailingView?: ReactNode;
  /** Custom auxiliary button content. */
  auxiliaryButtonView?: ReactNode;
}

/**
 * Props for the direct `<CometChatMessageHeader />` flat API.
 * Combines all Root props with convenience view props.
 */
export type CometChatMessageHeaderProps = Omit<CometChatMessageHeaderRootProps, 'children'> &
  CometChatMessageHeaderConvenienceProps;
