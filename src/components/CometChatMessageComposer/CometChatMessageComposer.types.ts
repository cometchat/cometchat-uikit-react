import type { ReactNode, RefObject } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatTextFormatter } from '../../formatters/CometChatTextFormatter';

// Re-export CometChat type so it's used (referenced in prop types below)
export type { CometChat } from '@cometchat/chat-sdk-javascript';

// --- Composer Attachment Option ---

/** An attachment action shown in the composer's "+" menu. */
export interface CometChatComposerAttachmentOption {
  /** Unique identifier (e.g., 'image', 'video', 'file'). */
  id: string;
  /** Display title (localized). */
  title: string;
  /** Icon URL. */
  iconURL: string;
  /** Callback when the option is selected. */
  onClick: () => void;
}

// --- Layout ---

/** Layout mode for the message composer. */
export type CometChatMessageComposerLayout = 'compact' | 'multiline';

/** Send state lifecycle. */
export type CometChatComposerSendState = 'idle' | 'sending' | 'sent' | 'error';

/** Which overlay content is currently displayed. */
export type CometChatComposerContentToDisplay =
  | 'attachments'
  | 'emojiKeyboard'
  | 'voiceRecording'
  | 'stickers'
  | 'ai'
  | 'none';

// --- Multi-Attachment Staging Tray ---

/** Media kind of a staged tray item, derived from the file type. */
export type TrayItemKind = 'image' | 'video' | 'audio' | 'file';

/** Upload lifecycle status of a staged tray item. */
export type TrayItemStatus = 'uploading' | 'success' | 'failed' | 'rejected';

/** A single staged file in the composer tray with its own upload status and preview. */
export interface TrayItem {
  /** Per-file identifier from the upload group. */
  fileId: string;
  /** The staged file. */
  file: File;
  /** Media kind derived from the file type. */
  kind: TrayItemKind;
  /** Upload lifecycle status. */
  status: TrayItemStatus;
  /** Upload progress percentage (0-100). */
  percent: number;
  /** SDK attachment, set once the upload succeeds. */
  attachment?: CometChat.Attachment;
  /** Object URL used for local preview; revoked on remove/clear. */
  previewUrl?: string;
  /** Error captured on failure/rejection. */
  error?: unknown;
}

/** Composer staging-tray slice: one upload group of staged items. */
export interface TrayState {
  /** UIKit-generated upload-group id, or null when the tray is empty. */
  batchId: string | null;
  /** Staged items in attach order. */
  items: TrayItem[];
}

// --- Attachment Config ---

/** Configuration for hiding specific attachment options. */
export interface CometChatAttachmentHideOptions {
  image?: boolean;
  video?: boolean;
  audio?: boolean;
  file?: boolean;
  polls?: boolean;
  collaborativeDocument?: boolean;
  collaborativeWhiteboard?: boolean;
}

// --- Root Props ---

/** Props for CometChatMessageComposer.Root. */
export interface CometChatMessageComposerRootProps {
  // ==================== Entity ====================

  /** User for 1:1 conversations. */
  user?: CometChat.User;
  /** Group for group conversations. */
  group?: CometChat.Group;
  /** Parent message ID for threaded replies. */
  parentMessageId?: number;

  // ==================== Layout ====================

  /** Layout mode. Default: 'compact'. */
  layout?: CometChatMessageComposerLayout;

  // ==================== Text Input ====================

  /** Initial text to pre-fill (uncontrolled). */
  initialText?: string;
  /**
   * Controlled text value. When provided the composer is in controlled mode —
   * the consumer owns the text state and must update it via `onTextChange`.
   */
  text?: string;
  /** Placeholder text. Default: 'Type a message...'. */
  placeholder?: string;
  /** Enter key behavior. Default: 'send'. */
  enterKeyBehavior?: 'send' | 'newline' | 'none';
  /** Max height for the input area in px. Default: 200. */
  maxInputHeight?: number;

  // ==================== Rich Text ====================

  /** Enable rich text formatting (toolbar, keyboard shortcuts, markdown auto-conversion). Default: false. */
  enableRichTextEditor?: boolean;
  /** Hide the rich text formatting toolbar (toolbar hidden but shortcuts still work). Default: false. */
  hideRichTextFormattingOptions?: boolean;
  /**
   * Show a floating bubble menu near selected text with formatting options (desktop only).
   * Default: false.
   */
  showBubbleMenuOnSelection?: boolean;

  // ==================== Edit / Reply ====================

  /** Message to edit (triggers edit mode). */
  messageToEdit?: CometChat.TextMessage | CometChat.MediaMessage | null;
  /** Message to reply to (triggers reply mode). */
  messageToReply?: CometChat.BaseMessage | null;

  // ==================== Attachments ====================

  /** Custom attachment options (overrides plugin-provided ones). */
  attachmentOptions?: CometChatComposerAttachmentOption[];
  /** Hide specific attachment options in the default layout. */
  hideAttachmentOptions?: CometChatAttachmentHideOptions;
  /** Whether to show attachment preview thumbnails before sending. Default: true. */
  showAttachmentPreview?: boolean;
  /**
   * Enable multi-attachment staging behavior. When `true` (default), selecting an
   * attachment option stages files in a tray for a single batched send. When
   * `false`, each attachment option reverts to legacy single-select,
   * send-immediately behavior.
   */
  enableMultipleAttachments?: boolean;
  /** Disable drag-and-drop file upload. Default: false. */
  disableDragAndDrop?: boolean;
  /** Allowed file MIME types for attachments. */
  allowedFileTypes?: string[];

  // ==================== Hide Buttons ====================

  /** Hide the attachment ("+") button entirely. Default: false. */
  hideAttachmentButton?: boolean;
  /** Hide the emoji keyboard button. Default: false. */
  hideEmojiKeyboardButton?: boolean;
  /** Hide the voice recording button. Default: false. */
  hideVoiceRecordingButton?: boolean;
  /** Hide the stickers button. Default: false. */
  hideStickersButton?: boolean;
  /** Hide the AI button. Default: true. */
  hideAIButton?: boolean;
  /** Hide the live reaction button. Default: false. */
  hideLiveReaction?: boolean;
  /** Hide the send button. Default: false. */
  hideSendButton?: boolean;
  /** Hide the error state UI. Default: false. */
  hideError?: boolean;

  // ==================== Mentions ====================

  /** Text formatters pipeline. */
  textFormatters?: CometChatTextFormatter[];
  /** Disable individual @mentions (member list). @all remains available unless disableMentionAll is also true. Default: false. */
  disableMentions?: boolean;
  /** Disable @all mention in groups. Default: false. */
  disableMentionAll?: boolean;
  /** Label for the @all mention option. Default: 'all'. */
  mentionAllLabel?: string;
  /** Custom request builder for mention user search. */
  mentionsUsersRequestBuilder?: CometChat.UsersRequestBuilder;
  /** Custom request builder for mention group member search. */
  mentionsGroupMembersRequestBuilder?: CometChat.GroupMembersRequestBuilder;

  // ==================== Sound ====================

  /** Disable typing indicator events. Default: false. */
  disableTypingEvents?: boolean;
  /** Disable sound on message send. Default: false. */
  disableSoundForMessage?: boolean;
  /** Custom sound URL for message send. */
  customSoundForMessage?: string;

  // ==================== Misc ====================

  /**
   * Disable auto-focus on mobile devices to prevent the keyboard from
   * automatically opening on load. Default: true.
   */
  disableAutoFocusOnMobile?: boolean;
  /** Custom icon URL for the live reaction button. */
  liveReactionIcon?: string;

  // ==================== Custom Views ====================

  /** Custom ReactNode to replace the content inside the attachment button (keeps action wired). */
  attachmentButtonIconView?: ReactNode;
  /** Custom ReactNode to replace the content inside the voice recording button (keeps action wired). */
  voiceRecordingButtonIconView?: ReactNode;
  /** Custom ReactNode to replace the content inside the emoji button (keeps action wired). */
  emojiButtonIconView?: ReactNode;
  /** Custom ReactNode to replace the content inside the send button (keeps send/edit action wired). */
  sendButtonView?: ReactNode;
  /** Custom ReactNode for additional buttons rendered in the actions area before the send button. */
  auxiliaryButtonView?: ReactNode;
  /** Custom ReactNode for the header area above the input (replaces edit/reply preview + validation). */
  headerView?: ReactNode;
  /** Whether to show the scrollbar on the input area. Default: false. */
  showScrollbar?: boolean;

  // ==================== Callbacks ====================

  /** Called when text changes. */
  onTextChange?: (text: string) => void;
  /** Called when a message is sent. */
  onSendButtonClick?: (message: CometChat.BaseMessage, mode?: 'send' | 'edit') => void;
  /**
   * Override the internal SDK sendTextMessage call for optimistic updates.
   * When provided, called INSTEAD of CometChat.sendMessage(). Use with
   * MessageList.sendTextMessage to show messages immediately.
   */
  sendTextMessageOverride?: (text: string, richTextHtml?: string) => string;
  /** Called when an error occurs. */
  onError?: ((error: CometChat.CometChatException) => void) | null;
  /** Called when reply/edit preview is closed. */
  onClosePreview?: () => void;
  /** Called when a file attachment is added. */
  onAttachmentAdded?: (file: File) => void;
  /** Called when a file attachment is removed. */
  onAttachmentRemoved?: (file: File) => void;
  /** Called when a mention is selected from the suggestions list. */
  onMentionSelected?: (user: CometChat.User | CometChat.GroupMember) => void;

  // ==================== Composition ====================

  /** Children (sub-components for compound composition). */
  children?: ReactNode;
  /** Optional custom className. */
  className?: string;
}

// --- Sub-component Props ---

/** Props for CometChatMessageComposer.Input. */
export interface CometChatMessageComposerInputProps {
  /** Optional custom className. */
  className?: string;
}

/** Props for CometChatMessageComposer.SendButton. */
export interface CometChatMessageComposerSendButtonProps {
  /** Custom content to render inside the button (replaces default icon). */
  children?: ReactNode;
  /** Optional custom className. */
  className?: string;
}

/** Props for CometChatMessageComposer.AttachmentButton. */
export interface CometChatMessageComposerAttachmentButtonProps {
  /** Config for hiding specific attachment options. */
  hideOptions?: CometChatAttachmentHideOptions;
  /** Optional custom className. */
  className?: string;
}

/** Props for CometChatMessageComposer.EmojiButton. */
export interface CometChatMessageComposerEmojiButtonProps {
  /** Optional custom className. */
  className?: string;
}

/** Props for CometChatMessageComposer.VoiceButton. */
export interface CometChatMessageComposerVoiceButtonProps {
  /** Optional custom className. */
  className?: string;
}

/** Props for CometChatMessageComposer.EditPreview. */
export interface CometChatMessageComposerEditPreviewProps {
  /** Optional custom className. */
  className?: string;
}

/** Props for CometChatMessageComposer.ReplyPreview. */
export interface CometChatMessageComposerReplyPreviewProps {
  /** Optional custom className. */
  className?: string;
}

/** Props for CometChatMessageComposer.AuxiliaryButtons. */
export interface CometChatMessageComposerAuxiliaryButtonsProps {
  /** Children (plugin-injected buttons). */
  children?: ReactNode;
  /** Optional custom className. */
  className?: string;
}

/** Props for CometChatMessageComposer.Header. */
export interface CometChatMessageComposerHeaderProps {
  /** Header content. */
  children?: ReactNode;
  /** Optional custom className. */
  className?: string;
}

/** Props for CometChatMessageComposer.Footer. */
export interface CometChatMessageComposerFooterProps {
  /** Footer content. */
  children?: ReactNode;
  /** Optional custom className. */
  className?: string;
}

// --- Context Value ---

/** Context value shared across CometChatMessageComposer sub-components. */
export interface CometChatMessageComposerContextValue {
  // --- State ---
  text: string;
  textMessageToEdit: CometChat.TextMessage | CometChat.MediaMessage | null;
  messageToReply: CometChat.BaseMessage | null;
  contentToDisplay: CometChatComposerContentToDisplay;
  sendState: CometChatComposerSendState;
  isRecording: boolean;
  isDraggingOver: boolean;
  error: string | null;
  showValidationError: boolean;
  validationErrorText: string | null;

  // --- Derived ---
  canSend: boolean;
  isInEditMode: boolean;
  isInReplyMode: boolean;
  /** Whether the voice recording button should be visible (hidden when text has content). */
  showVoiceButton: boolean;
  layout: CometChatMessageComposerLayout;

  // --- Multi-attachment tray ---
  /** Multi-attachment staging-tray slice (one upload group of staged items). */
  tray: TrayState;
  /**
   * Stage and upload the given files, creating or extending the upload group.
   * Used by the attachment picker when `enableMultipleAttachments` is true.
   */
  stageAttachments: (files: File[], forcedKind?: TrayItemKind) => void;
  /** Cancel a staged file's upload and remove it from the tray. */
  removeAttachment: (fileId: string) => void;
  /** Retry a failed staged file's upload. */
  retryAttachment: (fileId: string) => void;
  /** Release the upload group and clear the tray. */
  clearAttachments: () => void;
  /** Latest send-eligibility computed from the most recent upload `onComplete`. */
  attachmentsSendable: boolean;
  /** Resolved per-batch maximum attachment count (from SDK settings, or fallback). */
  maxAttachmentCount: number;

  // --- Actions ---
  setText: (text: string) => void;
  sendMessage: (textOverride?: string) => Promise<void>;
  sendMediaMessage: (
    file: File,
    fileType: string,
    options?: { isVoiceNote?: boolean }
  ) => Promise<void>;
  editMessage: () => Promise<void>;
  insertEmoji: (emoji: string) => void;
  setContentToDisplay: (content: CometChatComposerContentToDisplay) => void;
  closePreview: () => void;
  setRecording: (recording: boolean) => void;
  setDragging: (dragging: boolean) => void;
  dismissValidationError: () => void;
  startTyping: () => void;
  endTyping: () => void;

  // --- Refs ---
  inputRef: RefObject<HTMLDivElement | null>;
  /** Ref from the RichTextEditor hook — when enableRichTextEditor is true, Input should use this ref. */
  richTextEditorRef: RefObject<HTMLDivElement | null>;

  // --- Config ---
  user?: CometChat.User;
  group?: CometChat.Group;
  parentMessageId?: number;
  placeholder: string;
  enterKeyBehavior: 'send' | 'newline' | 'none';
  maxInputHeight: number;
  enableRichTextEditor: boolean;
  hideRichTextFormattingOptions: boolean;
  showBubbleMenuOnSelection: boolean;
  disableMentions: boolean;
  disableMentionAll: boolean;
  mentionAllLabel: string;
  showAttachmentPreview: boolean;
  /** Whether multi-attachment staging is enabled (default true). */
  enableMultipleAttachments: boolean;
  allowedFileTypes?: string[];
  attachmentOptions?: CometChatComposerAttachmentOption[];
  textFormatters?: CometChatTextFormatter[];
  // Hide button flags
  hideAttachmentButton: boolean;
  hideEmojiKeyboardButton: boolean;
  hideVoiceRecordingButton: boolean;
  hideStickersButton: boolean;
  hideAIButton: boolean;
  hideLiveReaction: boolean;
  hideSendButton: boolean;
  hideError: boolean;
  disableAutoFocusOnMobile: boolean;
  liveReactionIcon?: string;
  // Custom icon views
  attachmentButtonIconView?: ReactNode;
  voiceRecordingButtonIconView?: ReactNode;
  emojiButtonIconView?: ReactNode;
  auxiliaryButtonView?: ReactNode;
  headerView?: ReactNode;
  showScrollbar?: boolean;
  onError?: ((error: CometChat.CometChatException) => void) | null;
  onAttachmentAdded?: (file: File) => void;
  onAttachmentRemoved?: (file: File) => void;
  onMentionSelected?: (user: CometChat.User | CometChat.GroupMember) => void;

  // --- Mention handlers (for plain text mode) ---
  /** Called when @ is detected in the input. */
  onMentionQueryChange?: (query: string) => void;
  /** Called when mention context is lost. */
  onMentionEnd?: () => void;
}
