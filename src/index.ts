/**
 *
 * Public API — named exports only.
 */

// Global styles (theme variables, fonts, mention styles)
import './styles/index.css';

// CometChatUIKit (main entry point)
export { CometChatUIKit, UIKitSettingsBuilder, UIKitSettings } from './CometChatUIKit';
export type { CometChatPresenceSubscription } from './CometChatUIKit';
export const VERSION = '7.0.3';

// Root Provider
export { CometChatProvider } from './context/CometChatProvider';
export { useLoggedInUser } from './hooks/useLoggedInUser';
export type { CometChatProviderProps } from './context/ChatState.types';

// Frame Context (iframe embedding support)
export { CometChatFrameProvider, useCometChatFrameContext } from './context/CometChatFrameContext';
export type {
  CometChatFrameContextValue,
  CometChatFrameProviderProps,
} from './context/CometChatFrameContext';

// Logger
export { CometChatLogger, LogLevel } from './utils/CometChatLogger';

// Utility
export { CometChatUIKitUtility, clone, createActionMessage } from './utils/CometChatUIKitUtility';

// Base Components
export { CometChatActionSheet } from './components/base/CometChatActionSheet/CometChatActionSheet';
export { useCometChatActionSheetContext } from './components/base/CometChatActionSheet/CometChatActionSheet.context';
export type {
  CometChatActionSheetItemData,
  CometChatActionSheetLayoutMode,
  CometChatActionSheetRootProps,
  CometChatActionSheetItemProps,
  CometChatActionSheetHeaderProps,
  CometChatActionSheetLayoutProps,
  CometChatActionSheetContextValue,
} from './components/base/CometChatActionSheet/CometChatActionSheet.types';

export { CometChatButton } from './components/base/CometChatButton/CometChatButton';
export { useCometChatButtonContext } from './components/base/CometChatButton/CometChatButton.context';
export type {
  CometChatButtonVariant,
  CometChatButtonSize,
  CometChatButtonRootProps,
  CometChatButtonIconProps,
  CometChatButtonTextProps,
  CometChatButtonContextValue,
} from './components/base/CometChatButton/CometChatButton.types';

export { CometChatCheckbox } from './components/base/CometChatCheckbox/CometChatCheckbox';
export type {
  CometChatCheckboxProps,
  CometChatCheckboxChangeEvent,
} from './components/base/CometChatCheckbox/CometChatCheckbox.types';

// RadioButton
export { CometChatRadioButton } from './components/base/CometChatRadioButton';
export type {
  CometChatRadioButtonProps,
  CometChatRadioButtonChangeEvent,
} from './components/base/CometChatRadioButton/CometChatRadioButton.types';

// FullScreen Viewer
export { CometChatFullScreenViewer } from './components/base/CometChatFullScreenViewer/CometChatFullScreenViewer';
export { useCometChatFullScreenViewerContext } from './components/base/CometChatFullScreenViewer/CometChatFullScreenViewer.context';
export type {
  CometChatFullScreenViewerMediaType,
  CometChatMediaAttachment,
  CometChatFullScreenViewerRootProps,
  CometChatFullScreenViewerHeaderProps,
  CometChatFullScreenViewerBodyProps,
  CometChatFullScreenViewerNavigationProps,
  CometChatFullScreenViewerContextValue,
} from './components/base/CometChatFullScreenViewer/CometChatFullScreenViewer.types';

// Avatar
export { CometChatAvatar } from './components/base/CometChatAvatar/CometChatAvatar';

// Context Menu
export { CometChatContextMenu } from './components/base/CometChatContextMenu/CometChatContextMenu';
export { useCometChatContextMenuContext } from './components/base/CometChatContextMenu/CometChatContextMenu.context';
export type {
  CometChatContextMenuItemData,
  CometChatContextMenuPlacement,
  CometChatContextMenuRootProps,
  CometChatContextMenuItemProps,
  CometChatContextMenuTriggerProps,
  CometChatContextMenuDropdownProps,
  CometChatContextMenuContextValue,
} from './components/base/CometChatContextMenu/CometChatContextMenu.types';
export { useCometChatAvatarContext } from './components/base/CometChatAvatar/CometChatAvatar.context';
export { getInitials } from './components/base/CometChatAvatar/CometChatAvatar.utils';
export type {
  CometChatAvatarSize,
  CometChatAvatarStatus,
  CometChatAvatarRootProps,
  CometChatAvatarImageProps,
  CometChatAvatarInitialsProps,
  CometChatAvatarStatusIndicatorProps,
  CometChatAvatarContextValue,
} from './components/base/CometChatAvatar/CometChatAvatar.types';

// Date
export { CometChatDate } from './components/base/CometChatDate/CometChatDate';

// SearchBar
export { CometChatSearchBar } from './components/base/CometChatSearchBar';
export { useCometChatSearchBarContext } from './components/base/CometChatSearchBar';
export type {
  CometChatSearchBarRootProps,
  CometChatSearchBarIconProps,
  CometChatSearchBarInputProps,
  CometChatSearchBarClearButtonProps,
  CometChatSearchBarContextValue,
} from './components/base/CometChatSearchBar/CometChatSearchBar.types';
export { useCometChatDateContext } from './components/base/CometChatDate/CometChatDate.context';
export { useCometChatDate } from './components/base/CometChatDate/useCometChatDate';
export type {
  CometChatDateFormatConfig,
  CometChatDateVariant,
  CometChatDateRootProps,
  CometChatDateTextProps,
  CometChatDateContextValue,
} from './components/base/CometChatDate/CometChatDate.types';
export type {
  UseCometChatDateOptions,
  UseCometChatDateResult,
} from './components/base/CometChatDate/useCometChatDate';

// Conversation Starter
export { CometChatConversationStarter } from './components/base/CometChatConversationStarter/CometChatConversationStarter';
export { useCometChatConversationStarterContext } from './components/base/CometChatConversationStarter/CometChatConversationStarter.context';
export type {
  CometChatConversationStarterState,
  CometChatConversationStarterRootProps,
  CometChatConversationStarterItemProps,
  CometChatConversationStarterLoadingProps,
  CometChatConversationStarterErrorProps,
  CometChatConversationStarterEmptyProps,
  CometChatConversationStarterContextValue,
} from './components/base/CometChatConversationStarter/CometChatConversationStarter.types';

// Error Boundary
export { CometChatErrorBoundary } from './components/base/CometChatErrorBoundary/CometChatErrorBoundary';
export { useCometChatErrorBoundaryContext } from './components/base/CometChatErrorBoundary/CometChatErrorBoundary.context';
export type {
  CometChatErrorContext,
  CometChatErrorBoundaryRootProps,
  CometChatErrorBoundaryFallbackProps,
  CometChatErrorBoundaryContextValue,
} from './components/base/CometChatErrorBoundary/CometChatErrorBoundary.types';

// Conversation Summary
export { CometChatConversationSummary } from './components/base/CometChatConversationSummary/CometChatConversationSummary';
export { useCometChatConversationSummaryContext } from './components/base/CometChatConversationSummary/CometChatConversationSummary.context';
export type {
  CometChatConversationSummaryState,
  CometChatConversationSummaryRootProps,
  CometChatConversationSummaryHeaderProps,
  CometChatConversationSummaryBodyProps,
  CometChatConversationSummaryLoadingProps,
  CometChatConversationSummaryErrorProps,
  CometChatConversationSummaryEmptyProps,
  CometChatConversationSummaryContextValue,
} from './components/base/CometChatConversationSummary/CometChatConversationSummary.types';

// Smart Replies
export { CometChatSmartReplies } from './components/base/CometChatSmartReplies/CometChatSmartReplies';
export { useCometChatSmartRepliesContext } from './components/base/CometChatSmartReplies/CometChatSmartReplies.context';
export type {
  CometChatSmartRepliesState,
  CometChatSmartRepliesRootProps,
  CometChatSmartRepliesHeaderProps,
  CometChatSmartRepliesItemProps,
  CometChatSmartRepliesLoadingProps,
  CometChatSmartRepliesErrorProps,
  CometChatSmartRepliesEmptyProps,
  CometChatSmartRepliesContextValue,
} from './components/base/CometChatSmartReplies/CometChatSmartReplies.types';
// ChangeScope
export { CometChatChangeScope } from './components/base/CometChatChangeScope/CometChatChangeScope';
export { useCometChatChangeScopeContext } from './components/base/CometChatChangeScope/CometChatChangeScope.context';
export type {
  CometChatChangeScopeOptionData,
  CometChatChangeScopeRootProps,
  CometChatChangeScopeHeaderProps,
  CometChatChangeScopeListProps,
  CometChatChangeScopeOptionProps,
  CometChatChangeScopeActionsProps,
  CometChatChangeScopeErrorMessageProps,
  CometChatChangeScopeContextValue,
} from './components/base/CometChatChangeScope/CometChatChangeScope.types';

// Confirm Dialog
export { CometChatConfirmDialog } from './components/base/CometChatConfirmDialog/CometChatConfirmDialog';
export { useCometChatConfirmDialogContext } from './components/base/CometChatConfirmDialog/CometChatConfirmDialog.context';
export type {
  CometChatConfirmDialogVariant,
  CometChatConfirmDialogRootProps,
  CometChatConfirmDialogIconProps,
  CometChatConfirmDialogContentProps,
  CometChatConfirmDialogActionsProps,
  CometChatConfirmDialogContextValue,
} from './components/base/CometChatConfirmDialog/CometChatConfirmDialog.types';

// Localization
export { useLocale } from './context/locale/LocaleContext';
export { CometChatLocalize } from './resources/CometChatLocalize/CometChatLocalize';
export type {
  TranslationContextValue,
  SupportedLanguage,
  LocalizationSettings,
  MissingKeyHandler,
} from './resources/CometChatLocalize/localize.types';

// Plugin Registry
export { CometChatPluginRegistry } from './plugins/CometChatPluginRegistry';
export { usePluginRegistry } from './hooks/usePluginRegistry';
export {
  useDefaultMessageTypes,
  useDefaultMessageCategories,
} from './hooks/useDefaultMessageTypes';
export { defaultPlugins } from './plugins/core';
export type {
  CometChatMessagePlugin,
  CometChatMessagePluginContext,
  CometChatMessageOption,
  CometChatMessageBubbleAlignment,
} from './plugins/plugin.types';

// Shared Types
export type { CometChatFetchState } from './types';

// Theme
export { useTheme } from './context/ThemeContext';
export type {
  CometChatTheme,
  CometChatThemeContextValue,
  CometChatThemeProviderProps,
} from './context/ThemeContext.types';

// Unified Events (SDK + UI)
export { useCometChatEvents } from './hooks/useCometChatEvents';
export { usePublishEvent } from './hooks/usePublishEvent';
export { CometChatMessageStatus } from './context/CometChatEvents.types';
export type { CometChatEvent, CometChatUIEvent } from './context/CometChatEvents.types';

// Message List
export { CometChatMessageList } from './components/CometChatMessageList';
export { useCometChatMessageListContext } from './components/CometChatMessageList/CometChatMessageList.context';
export { useCometChatMessageList } from './components/CometChatMessageList/useCometChatMessageList';
export {
  CometChatMessageListAlignment,
  initialMessageListState,
} from './components/CometChatMessageList/CometChatMessageList.types';
export type {
  CometChatMessageListManagerOptions,
  CometChatMessageListState,
  CometChatMessageListAction,
  CometChatUseMessageListOptions,
  CometChatUseMessageListReturn,
  CometChatMessageListOptions,
  CometChatMessageListRootProps,
  CometChatMessageListProps,
} from './components/CometChatMessageList/CometChatMessageList.types';

// Message Bubble Renderer
export { CometChatMessageBubbleRenderer } from './components/CometChatMessageBubble/CometChatMessageBubbleRenderer';
export { CometChatMessageBubbleWrapper } from './components/CometChatMessageBubble/CometChatMessageBubbleWrapper';
export type {
  CometChatMessageBubbleRendererProps,
  CometChatMessageBubbleWrapperProps,
} from './components/CometChatMessageBubble/CometChatMessageBubble.types';

// Moderation
export { CometChatModerationView } from './components/base/CometChatModerationView';
export type { CometChatModerationViewProps } from './components/base/CometChatModerationView';

// Receipt utilities
export {
  getReceiptStatus,
  getMessageError,
  hasMessageError,
  isMessageModerated,
  isPermissionDeniedError,
  isMessagePendingModeration,
} from './utils/MessageReceiptUtils';
export type { CometChatReceipt } from './utils/MessageReceiptUtils';
// Reactions
export { CometChatReactions } from './components/CometChatReactions';

// Reaction List (standalone)
export { CometChatReactionList } from './components/CometChatReactionList';
export {
  useCometChatReactionListContext,
  useCometChatReactionList,
} from './components/CometChatReactionList';
export type {
  CometChatReactionListFetchState,
  CometChatReactionListRootProps,
  CometChatReactionListTabsProps,
  CometChatReactionListItemsProps,
  CometChatReactionListLoadingStateProps,
  CometChatReactionListErrorStateProps,
  CometChatReactionListEmptyStateProps,
  CometChatReactionListContextValue,
} from './components/CometChatReactionList';

// Message Bubble
export { CometChatMessageBubble } from './components/CometChatMessageBubble';
export type { CometChatMessageBubbleProps } from './components/CometChatMessageBubble/CometChatMessageBubble.types';
export { useCometChatReactionsContext } from './components/CometChatReactions/CometChatReactions.context';
export type {
  CometChatReactionsFetchState,
  CometChatReactionsRootProps,
  CometChatReactionsBarProps,
  CometChatReactionsChipProps,
  CometChatReactionsInfoProps,
  CometChatReactionsOverflowProps,
  CometChatReactionsContextValue,
} from './components/CometChatReactions/CometChatReactions.types';

// Core Plugin Bubbles (self-extracting — take the SDK message directly)
export { CometChatTextBubble } from './components/CometChatTextBubble/CometChatTextBubble';
export type { CometChatTextBubbleProps } from './components/CometChatTextBubble/CometChatTextBubble.types';
export { CometChatImageBubble } from './components/CometChatImageBubble/CometChatImageBubble';
export type {
  CometChatImageBubbleProps,
  CometChatImageBubbleAttachment,
} from './components/CometChatImageBubble/CometChatImageBubble.types';
export { CometChatVideoBubble } from './components/CometChatVideoBubble/CometChatVideoBubble';
export type { CometChatVideoBubbleProps } from './components/CometChatVideoBubble/CometChatVideoBubble.types';
export { CometChatAudioBubble } from './components/CometChatAudioBubble/CometChatAudioBubble';
export type { CometChatAudioBubbleProps } from './components/CometChatAudioBubble/CometChatAudioBubble.types';
export { CometChatFileBubble } from './components/CometChatFileBubble/CometChatFileBubble';
export type { CometChatFileBubbleProps } from './components/CometChatFileBubble/CometChatFileBubble.types';
export { CometChatCallBubble } from './components/CometChatCallBubble/CometChatCallBubble';
export type { CometChatCallBubbleProps } from './components/CometChatCallBubble/CometChatCallBubble.types';

// Action Bubbles (self-extracting) + the shared presentational primitive
export { CometChatCallActionBubble } from './components/CometChatCallActionBubble';
export type { CometChatCallActionBubbleProps } from './components/CometChatCallActionBubble/CometChatCallActionBubble.types';
export { CometChatGroupActionBubble } from './components/CometChatGroupActionBubble';
export type { CometChatGroupActionBubbleProps } from './components/CometChatGroupActionBubble/CometChatGroupActionBubble.types';
export { CometChatActionBubble } from './components/base/CometChatActionBubble';
export type { CometChatActionBubbleProps } from './components/base/CometChatActionBubble/CometChatActionBubble.types';

// Delete Bubble (base/presentational)
export { CometChatDeleteBubble } from './components/base/CometChatDeleteBubble/CometChatDeleteBubble';
export type { CometChatDeleteBubbleProps } from './components/base/CometChatDeleteBubble/CometChatDeleteBubble.types';

// Extension Plugin Bubbles (for direct usage in sample app / custom renderers)
export { CometChatPollsPlugin } from './plugins/polls/CometChatPollsPlugin';
export { CometChatStickersPlugin } from './plugins/stickers/CometChatStickersPlugin';
export { CometChatPollBubble } from './components/CometChatPollBubble/CometChatPollBubble';
export type { CometChatPollBubbleProps } from './components/CometChatPollBubble/CometChatPollBubble.types';
export { CometChatCreatePoll } from './components/CometChatCreatePoll/CometChatCreatePoll';
export type { CometChatCreatePollProps } from './components/CometChatCreatePoll/CometChatCreatePoll.types';
export { CometChatStickerBubble } from './components/CometChatStickerBubble/CometChatStickerBubble';
export type { CometChatStickerBubbleProps } from './components/CometChatStickerBubble/CometChatStickerBubble.types';
// Self-extracting collaborative bubbles + the shared presentational primitive
export { CometChatCollaborativeDocumentBubble } from './components/CometChatCollaborativeDocumentBubble';
export type { CometChatCollaborativeDocumentBubbleProps } from './components/CometChatCollaborativeDocumentBubble/CometChatCollaborativeDocumentBubble.types';
export { CometChatCollaborativeWhiteboardBubble } from './components/CometChatCollaborativeWhiteboardBubble';
export type { CometChatCollaborativeWhiteboardBubbleProps } from './components/CometChatCollaborativeWhiteboardBubble/CometChatCollaborativeWhiteboardBubble.types';

// Translation utilities (used by MessageTranslationPlugin but also useful standalone)
export {
  translateMessage,
  getCachedTranslation,
  clearTranslationCache,
} from './utils/CometChatTranslationUtils';

// Shared plugin utilities (used by collaborative plugins but also useful standalone)
export { extractExtensionUrl } from './plugins/shared/extractExtensionUrl';

// Thread Header
export { CometChatThreadHeader } from './components/CometChatThreadHeader';
export { useCometChatThreadHeaderContext } from './components/CometChatThreadHeader/CometChatThreadHeader.context';
export type {
  CometChatThreadHeaderRootProps,
  CometChatThreadHeaderTopBarProps,
  CometChatThreadHeaderTitleProps,
  CometChatThreadHeaderSenderNameProps,
  CometChatThreadHeaderCloseButtonProps,
  CometChatThreadHeaderParentBubbleProps,
  CometChatThreadHeaderReplyCountProps,
  CometChatThreadHeaderContextValue,
  CometChatThreadHeaderProps,
  CometChatThreadHeaderConvenienceProps,
} from './components/CometChatThreadHeader/CometChatThreadHeader.types';

// Message Header
export { CometChatMessageHeader } from './components/CometChatMessageHeader';
export { useCometChatMessageHeaderContext } from './components/CometChatMessageHeader/CometChatMessageHeader.context';
export type {
  CometChatUserStatus,
  CometChatTypingDisplay,
  CometChatMessageHeaderContextValue,
  CometChatMessageHeaderRootProps,
  CometChatMessageHeaderBackButtonProps,
  CometChatMessageHeaderAvatarProps,
  CometChatMessageHeaderTitleProps,
  CometChatMessageHeaderSubtitleProps,
  CometChatMessageHeaderCallButtonsProps,
  CometChatMessageHeaderSearchButtonProps,
  CometChatMessageHeaderSummaryButtonProps,
  CometChatMessageHeaderOverflowMenuProps,
  CometChatMessageHeaderAuxiliaryButtonsProps,
  CometChatMessageHeaderProps,
  CometChatMessageHeaderConvenienceProps,
} from './components/CometChatMessageHeader/CometChatMessageHeader.types';

// Flag Message Dialog
export { CometChatFlagMessageDialog } from './components/CometChatFlagMessageDialog';
export { useCometChatFlagMessageDialogContext } from './components/CometChatFlagMessageDialog/CometChatFlagMessageDialog.context';
export type {
  CometChatFlagMessageDialogRootProps,
  CometChatFlagMessageDialogHeaderProps,
  CometChatFlagMessageDialogReasonsProps,
  CometChatFlagMessageDialogRemarkProps,
  CometChatFlagMessageDialogActionsProps,
  CometChatFlagMessageDialogContextValue,
} from './components/CometChatFlagMessageDialog/CometChatFlagMessageDialog.types';

// Users
export { CometChatUsers } from './components/CometChatUsers';
export { useCometChatUsersContext, useCometChatUsers } from './components/CometChatUsers';
export type {
  CometChatUsersRootProps,
  CometChatUsersListProps,
  CometChatUsersItemProps,
  CometChatUsersHeaderProps,
  CometChatUsersSearchBarProps,
  CometChatUsersSectionHeaderProps,
  CometChatUsersEmptyStateProps,
  CometChatUsersErrorStateProps,
  CometChatUsersLoadingStateProps,
  CometChatUsersSelectedPreviewProps,
  CometChatUsersContextValue,
  CometChatUsersSelectionMode,
  CometChatUserOption,
  CometChatUseCometChatUsersOptions,
  CometChatUseCometChatUsersReturn,
  CometChatUsersProps,
} from './components/CometChatUsers';

// Groups
export { CometChatGroups } from './components/CometChatGroups';
export { useCometChatGroupsContext, useCometChatGroups } from './components/CometChatGroups';
export type {
  CometChatGroupsRootProps,
  CometChatGroupsListProps,
  CometChatGroupsItemProps,
  CometChatGroupsHeaderProps,
  CometChatGroupsSearchBarProps,
  CometChatGroupsEmptyStateProps,
  CometChatGroupsErrorStateProps,
  CometChatGroupsLoadingStateProps,
  CometChatGroupsContextValue,
  CometChatGroupsSelectionMode,
  CometChatGroupOption,
  CometChatUseCometChatGroupsOptions,
  CometChatUseCometChatGroupsReturn,
  CometChatGroupsProps,
} from './components/CometChatGroups';

// Conversations
export { CometChatConversations } from './components/CometChatConversations';
export {
  useCometChatConversationsContext,
  useCometChatConversations,
} from './components/CometChatConversations';
export type {
  CometChatConversationsProps,
  CometChatConversationsConvenienceProps,
  CometChatConversationsRootProps,
  CometChatConversationsListProps,
  CometChatConversationsItemProps,
  CometChatConversationsHeaderProps,
  CometChatConversationsSearchBarProps,
  CometChatConversationsEmptyStateProps,
  CometChatConversationsErrorStateProps,
  CometChatConversationsLoadingStateProps,
  CometChatConversationsContextValue,
  CometChatConversationsSelectionMode,
  CometChatConversationOption,
  CometChatUseCometChatConversationsOptions,
  CometChatUseCometChatConversationsReturn,
} from './components/CometChatConversations';

// GroupMembers
export { CometChatGroupMembers } from './components/CometChatGroupMembers';
export {
  useCometChatGroupMembersContext,
  useCometChatGroupMembers,
} from './components/CometChatGroupMembers';
export type {
  CometChatGroupMembersRootProps,
  CometChatGroupMembersListProps,
  CometChatGroupMembersItemProps,
  CometChatGroupMembersHeaderProps,
  CometChatGroupMembersSearchBarProps,
  CometChatGroupMembersEmptyStateProps,
  CometChatGroupMembersErrorStateProps,
  CometChatGroupMembersLoadingStateProps,
  CometChatGroupMembersContextValue,
  CometChatGroupMembersSelectionMode,
  CometChatGroupMemberOption,
  CometChatUseCometChatGroupMembersOptions,
  CometChatUseCometChatGroupMembersReturn,
  CometChatGroupMembersProps,
} from './components/CometChatGroupMembers';

// Message Composer
export { CometChatMessageComposer } from './components/CometChatMessageComposer';
export { useCometChatMessageComposerContext } from './components/CometChatMessageComposer/CometChatMessageComposer.context';
export type {
  CometChatMessageComposerLayout,
  CometChatComposerSendState,
  CometChatComposerContentToDisplay,
  CometChatAttachmentHideOptions,
  CometChatComposerAttachmentOption,
  CometChatMessageComposerRootProps,
  CometChatMessageComposerInputProps,
  CometChatMessageComposerSendButtonProps,
  CometChatMessageComposerAttachmentButtonProps,
  CometChatMessageComposerEmojiButtonProps,
  CometChatMessageComposerVoiceButtonProps,
  CometChatMessageComposerEditPreviewProps,
  CometChatMessageComposerReplyPreviewProps,
  CometChatMessageComposerAuxiliaryButtonsProps,
  CometChatMessageComposerHeaderProps,
  CometChatMessageComposerFooterProps,
  CometChatMessageComposerContextValue,
} from './components/CometChatMessageComposer/CometChatMessageComposer.types';

// Formatters
export {
  CometChatTextFormatter,
  CometChatMentionsFormatter,
  CometChatUrlFormatter,
  CometChatMarkdownFormatter,
  CometChatRichTextFormatter,
} from './formatters';
export type { CometChatMentionData } from './formatters';

// Sound Manager
export { CometChatSoundManager } from './resources/CometChatSoundManager/CometChatSoundManager';
export type { CometChatSoundType } from './resources/CometChatSoundManager/CometChatSoundManager';

// Search
export { CometChatSearch } from './components/CometChatSearch';
export { useCometChatSearchContext } from './components/CometChatSearch';
export type {
  CometChatSearchScope,
  CometChatSearchFilter,
  CometChatSearchConversationClickEvent,
  CometChatSearchMessageClickEvent,
  CometChatSearchRootProps,
  CometChatSearchProps,
  CometChatSearchContextValue,
  CometChatSearchConversationsListProps,
  CometChatSearchMessagesListProps,
} from './components/CometChatSearch';
// Call Buttons (standalone)
export { CometChatCallButtons, useCometChatCallButtons } from './components/CometChatCallButtons';
export type {
  CometChatCallButtonsProps,
  CometChatCallButtonsState,
  UseCometChatCallButtonsOptions,
} from './components/CometChatCallButtons';

// Ongoing Call
export { CometChatOngoingCall } from './components/CometChatOngoingCall';
export type {
  CometChatOngoingCallProps,
  SessionSettings,
} from './components/CometChatOngoingCall/CometChatOngoingCall.types';
export { useOngoingCall } from './hooks/useOngoingCall';
export type { UseOngoingCallOptions, UseOngoingCallReturn } from './hooks/useOngoingCall';
export { CometChatUIKitCalls, initCallsSDK, loadCallsSDK } from './CometChatUIKit/CometChatCalls';

// Outgoing Call
export { CometChatOutgoingCall } from './components/CometChatOutgoingCall';
export type { CometChatOutgoingCallProps } from './components/CometChatOutgoingCall/CometChatOutgoingCall.types';

// Incoming Call
export { CometChatIncomingCall } from './components/CometChatIncomingCall';
export type { CometChatIncomingCallProps } from './components/CometChatIncomingCall/CometChatIncomingCall.types';

// Call Logs
export { CometChatCallLogs } from './components/CometChatCallLogs';
export type { CometChatCallLogsProps } from './components/CometChatCallLogs/CometChatCallLogs.types';
export {
  verifyCallUser,
  isSentByMe,
  isMissedCall,
} from './components/CometChatCallLogs/CometChatCallLogs.utils';

// Message Information
export { CometChatMessageInformation } from './components/CometChatMessageInformation';
export { useCometChatMessageInformationContext } from './components/CometChatMessageInformation';
export type {
  CometChatMessageInformationFetchState,
  CometChatUserReceiptInfo,
  CometChatMessageInformationCalendarObject,
  CometChatMessageInformationRootProps,
  CometChatMessageInformationHeaderProps,
  CometChatMessageInformationMessagePreviewProps,
  CometChatMessageInformationReceiptListProps,
  CometChatMessageInformationLoadingStateProps,
  CometChatMessageInformationErrorStateProps,
  CometChatMessageInformationEmptyStateProps,
  CometChatMessageInformationContextValue,
} from './components/CometChatMessageInformation';

export * from './components/CometChatAIAssistantChat';
export * from './plugins/ai';

// all remaining plugins
export { CometChatCollaborativeDocumentPlugin } from './plugins/collaborative-document/CometChatCollaborativeDocumentPlugin';
export { CometChatCollaborativeWhiteboardPlugin } from './plugins/collaborative-whiteboard/CometChatCollaborativeWhiteboardPlugin';

// Core Plugins (individual plugins for custom plugin arrays)
export { CometChatTextPlugin } from './plugins/core/text/CometChatTextPlugin';
export { CometChatImagePlugin } from './plugins/core/image/CometChatImagePlugin';
export { CometChatVideoPlugin } from './plugins/core/video/CometChatVideoPlugin';
export { CometChatFilePlugin } from './plugins/core/file/CometChatFilePlugin';
export { CometChatAudioPlugin } from './plugins/core/audio/CometChatAudioPlugin';
export { CometChatGroupActionPlugin } from './plugins/core/group-action/CometChatGroupActionPlugin';
export { CometChatCallActionPlugin } from './plugins/core/call-action/CometChatCallActionPlugin';
export { CometChatMeetingPlugin } from './plugins/core/call-action/CometChatMeetingPlugin';
export { CometChatCardBubblePlugin } from './plugins/core/card/CometChatCardBubblePlugin';
export { CometChatCardBubble } from './plugins/core/card/CometChatCardBubble';
export type { CometChatCardBubbleProps } from './plugins/core/card/CometChatCardBubble';
export { CometChatDeletePlugin } from './plugins/core/delete/CometChatDeletePlugin';

// Notification Feed
export { CometChatNotificationFeed } from './components/CometChatNotificationFeed';
export { useCometChatNotificationFeedContext } from './components/CometChatNotificationFeed';
export { useCometChatNotificationFeed } from './components/CometChatNotificationFeed';
export { useNotificationUnreadCount } from './components/CometChatNotificationFeed';
export type {
  CometChatNotificationFeedProps,
  CometChatNotificationFeedRootProps,
  CometChatNotificationFeedContextValue,
  NotificationFeedItem,
  NotificationCategory,
  CardAction,
  TimestampGroup,
  ScreenState,
} from './components/CometChatNotificationFeed';
