import React from 'react';
import type { ReactNode } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { useCometChatMessageList } from './useCometChatMessageList';
import { CometChatMessageListProvider as ContextProvider } from './CometChatMessageList.context';
import type { CometChatDateFormatConfig } from '../base/CometChatDate/CometChatDate.types';
import type { CometChatMessageListAlignment } from './CometChatMessageList.types';

export interface CometChatMessageListProviderProps {
  // --- Data ---
  /** User for 1:1 chat. */
  user?: CometChat.User;
  /** Group for group chat. */
  group?: CometChat.Group;
  /** The logged-in user. Required. */
  loggedInUser: CometChat.User;
  /** Optional custom MessagesRequestBuilder. */
  messagesRequestBuilder?: CometChat.MessagesRequestBuilder;
  /**
   * Optional custom ReactionsRequestBuilder.
   */
  reactionsRequestBuilder?: CometChat.ReactionsRequestBuilder;
  /** Parent message ID for thread mode. */
  parentMessageId?: number;
  /** Scroll to last read message instead of bottom. */
  startFromUnreadMessages?: boolean;
  /** Jump to a specific message by ID. */
  goToMessageId?: number;
  /** Message types to fetch. Defaults to plugin registry types. */
  messageTypes?: string[];
  /** Message categories to fetch. Defaults to plugin registry categories. */
  messageCategories?: string[];

  // --- Sound ---
  /** Disable incoming message sound. */
  disableSoundForMessages?: boolean;
  /** Custom sound URL for incoming messages. */
  customSoundForMessages?: string;

  // --- Behavior ---
  /** Force-scroll to bottom on every new message. */
  scrollToBottomOnNewMessages?: boolean;
  /** Skip processing receipt events. */
  hideReceipts?: boolean;

  // --- Structural visibility toggles ---
  /** Hide the sticky date header floating above the list. */
  hideStickyDate?: boolean;
  /** Hide the avatar on incoming group messages. */
  hideAvatar?: boolean;
  /** Filter out group action messages (member joined / left / added / kicked). */
  hideGroupActionMessages?: boolean;
  /** Max inline quick-action options before overflow. Default: 3. */
  quickOptionsCount?: number;

  // --- Context-menu option toggles (per-instance) ---
  /** Hide the "Reply" option. */
  hideReplyOption?: boolean;
  /** Hide the "Reply in Thread" option. */
  hideReplyInThreadOption?: boolean;
  /** Hide the "Edit" option. */
  hideEditMessageOption?: boolean;
  /** Hide the "Delete" option. */
  hideDeleteMessageOption?: boolean;
  /** Hide the "Copy" option. */
  hideCopyMessageOption?: boolean;
  /** Hide the "React" option. */
  hideReactionOption?: boolean;
  /** Hide the "Message Info" option. */
  hideMessageInfoOption?: boolean;
  /** Hide the "Report / Flag" option. */
  hideFlagMessageOption?: boolean;
  /** Hide the "Message Privately" option. */
  hideMessagePrivatelyOption?: boolean;
  /** Hide the "Translate" option. */
  hideTranslateMessageOption?: boolean;
  /** Show the "Mark as Unread" option. Defaults to false. */
  showMarkAsUnreadOption?: boolean;

  // --- Date formats ---
  /** Format for in-list day separators. */
  separatorDateTimeFormat?: CometChatDateFormatConfig;
  /** Format for the sticky date header. */
  stickyDateTimeFormat?: CometChatDateFormatConfig;
  /** Format for the timestamp beside each bubble. */
  messageSentAtDateTimeFormat?: CometChatDateFormatConfig;
  /** Format for timestamps in the MessageInformation sheet. */
  messageInfoDateTimeFormat?: CometChatDateFormatConfig;

  // --- Reactions callbacks (declared; wired when reactions are integrated) ---
  /** Invoked when a reaction pill is clicked. */
  onReactionClick?: (reaction: unknown, message: CometChat.BaseMessage) => void;
  /** Invoked when an individual reactor in the reaction list is clicked. */
  onReactionListItemClick?: (reaction: unknown, message: CometChat.BaseMessage) => void;

  // --- View-level visual / slot / callback props (flow through context) ---
  /** Message list alignment. 0 = all left, 1 = standard. */
  messageAlignment?: CometChatMessageListAlignment;
  /** Hide the native scrollbar. */
  showScrollbar?: boolean;
  /** Hide date separators between calendar days. */
  hideDateSeparator?: boolean;
  /** Callback when thread-reply indicator is clicked. */
  onThreadRepliesClick?: (message: CometChat.BaseMessage) => void;
  /** Callback when an incoming message avatar is clicked. */
  onAvatarClick?: (user: CometChat.User) => void;
  /** Callback when the "Edit" context menu option is clicked. */
  onEditMessage?: (message: CometChat.BaseMessage) => void;
  /** Callback when the "Reply" context menu option is clicked. */
  onReplyMessage?: (message: CometChat.BaseMessage) => void;
  /** Hide the remark textarea in the flag message dialog. */
  hideFlagRemarkField?: boolean;
  /** Disable text truncation in text bubbles. */
  disableTruncation?: boolean;
  /** Hide the moderation footer beneath disapproved messages. */
  hideModerationView?: boolean;
  /** Whether this is an AI agent chat. */
  isAgentChat?: boolean;

  // --- Error callback ---
  /** Error callback. */
  onError?: (error: unknown) => void;

  /** Children. */
  children: ReactNode;
}

/**
 * CometChatMessageListProvider — wires the data hook to context.
 *
 * Automatically reads message types and categories from the plugin registry
 * when not explicitly provided, ensuring only messages with matching plugins
 * are fetched from the SDK.
 */
export const CometChatMessageListProviderComponent: React.FC<CometChatMessageListProviderProps> = ({
  user,
  group,
  loggedInUser,
  messagesRequestBuilder,
  reactionsRequestBuilder,
  parentMessageId,
  startFromUnreadMessages,
  goToMessageId,
  messageTypes,
  messageCategories,
  disableSoundForMessages,
  customSoundForMessages,
  scrollToBottomOnNewMessages,
  hideReceipts,
  hideStickyDate,
  hideAvatar,
  hideGroupActionMessages,
  quickOptionsCount,
  hideReplyOption,
  hideReplyInThreadOption,
  hideEditMessageOption,
  hideDeleteMessageOption,
  hideCopyMessageOption,
  hideReactionOption,
  hideMessageInfoOption,
  hideFlagMessageOption,
  hideMessagePrivatelyOption,
  hideTranslateMessageOption,
  showMarkAsUnreadOption,
  separatorDateTimeFormat,
  stickyDateTimeFormat,
  messageSentAtDateTimeFormat,
  messageInfoDateTimeFormat,
  onReactionClick,
  onReactionListItemClick,
  messageAlignment,
  showScrollbar,
  hideDateSeparator,
  onThreadRepliesClick,
  onAvatarClick,
  onEditMessage,
  onReplyMessage,
  hideFlagRemarkField,
  disableTruncation,
  hideModerationView,
  isAgentChat,
  onError,
  children,
}) => {
  // The hook calls usePluginRegistry() internally for default types/categories
  const hookOptions: import('./CometChatMessageList.types').CometChatUseMessageListOptions = {
    loggedInUser,
  };
  if (user) hookOptions.user = user;
  if (group) hookOptions.group = group;
  if (messagesRequestBuilder) hookOptions.messagesRequestBuilder = messagesRequestBuilder;
  if (reactionsRequestBuilder) hookOptions.reactionsRequestBuilder = reactionsRequestBuilder;
  if (parentMessageId) hookOptions.parentMessageId = parentMessageId;
  if (startFromUnreadMessages) hookOptions.startFromUnreadMessages = startFromUnreadMessages;
  if (goToMessageId) hookOptions.goToMessageId = goToMessageId;
  if (messageTypes) hookOptions.messageTypes = messageTypes;
  if (messageCategories) hookOptions.messageCategories = messageCategories;
  if (disableSoundForMessages) hookOptions.disableSoundForMessages = disableSoundForMessages;
  if (customSoundForMessages) hookOptions.customSoundForMessages = customSoundForMessages;
  if (scrollToBottomOnNewMessages)
    hookOptions.scrollToBottomOnNewMessages = scrollToBottomOnNewMessages;
  if (hideReceipts) hookOptions.hideReceipts = hideReceipts;

  // Structural toggles
  if (hideStickyDate !== undefined) hookOptions.hideStickyDate = hideStickyDate;
  if (hideAvatar !== undefined) hookOptions.hideAvatar = hideAvatar;
  if (hideGroupActionMessages !== undefined)
    hookOptions.hideGroupActionMessages = hideGroupActionMessages;
  if (quickOptionsCount !== undefined) hookOptions.quickOptionsCount = quickOptionsCount;

  // Option toggles
  if (hideReplyOption !== undefined) hookOptions.hideReplyOption = hideReplyOption;
  if (hideReplyInThreadOption !== undefined)
    hookOptions.hideReplyInThreadOption = hideReplyInThreadOption;
  if (hideEditMessageOption !== undefined)
    hookOptions.hideEditMessageOption = hideEditMessageOption;
  if (hideDeleteMessageOption !== undefined)
    hookOptions.hideDeleteMessageOption = hideDeleteMessageOption;
  if (hideCopyMessageOption !== undefined)
    hookOptions.hideCopyMessageOption = hideCopyMessageOption;
  if (hideReactionOption !== undefined) hookOptions.hideReactionOption = hideReactionOption;
  if (hideMessageInfoOption !== undefined)
    hookOptions.hideMessageInfoOption = hideMessageInfoOption;
  if (hideFlagMessageOption !== undefined)
    hookOptions.hideFlagMessageOption = hideFlagMessageOption;
  if (hideMessagePrivatelyOption !== undefined)
    hookOptions.hideMessagePrivatelyOption = hideMessagePrivatelyOption;
  if (hideTranslateMessageOption !== undefined)
    hookOptions.hideTranslateMessageOption = hideTranslateMessageOption;
  if (showMarkAsUnreadOption !== undefined)
    hookOptions.showMarkAsUnreadOption = showMarkAsUnreadOption;

  // Date formats
  if (separatorDateTimeFormat) hookOptions.separatorDateTimeFormat = separatorDateTimeFormat;
  if (stickyDateTimeFormat) hookOptions.stickyDateTimeFormat = stickyDateTimeFormat;
  if (messageSentAtDateTimeFormat)
    hookOptions.messageSentAtDateTimeFormat = messageSentAtDateTimeFormat;
  if (messageInfoDateTimeFormat) hookOptions.messageInfoDateTimeFormat = messageInfoDateTimeFormat;

  // Reaction callbacks
  if (onReactionClick) hookOptions.onReactionClick = onReactionClick;
  if (onReactionListItemClick) hookOptions.onReactionListItemClick = onReactionListItemClick;

  // View-level props
  if (messageAlignment !== undefined) hookOptions.messageAlignment = messageAlignment;
  if (showScrollbar !== undefined) hookOptions.showScrollbar = showScrollbar;
  if (hideDateSeparator !== undefined) hookOptions.hideDateSeparator = hideDateSeparator;
  if (onThreadRepliesClick !== undefined) hookOptions.onThreadRepliesClick = onThreadRepliesClick;
  if (onAvatarClick !== undefined) hookOptions.onAvatarClick = onAvatarClick;
  if (onEditMessage !== undefined) hookOptions.onEditMessage = onEditMessage;
  if (onReplyMessage !== undefined) hookOptions.onReplyMessage = onReplyMessage;
  if (hideFlagRemarkField !== undefined) hookOptions.hideFlagRemarkField = hideFlagRemarkField;
  if (disableTruncation !== undefined) hookOptions.disableTruncation = disableTruncation;
  if (hideModerationView !== undefined) hookOptions.hideModerationView = hideModerationView;
  if (isAgentChat !== undefined) hookOptions.isAgentChat = isAgentChat;

  if (onError) hookOptions.onError = onError;

  const hookReturn = useCometChatMessageList(hookOptions);

  return <ContextProvider value={hookReturn}>{children}</ContextProvider>;
};

CometChatMessageListProviderComponent.displayName = 'CometChatMessageListProvider';
