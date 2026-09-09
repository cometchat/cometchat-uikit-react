import React, { useCallback, useMemo } from 'react';
import { CometChatConversationsContext } from './CometChatConversations.context';
import { useCometChatConversations } from './useCometChatConversations';
import { CometChatConversationsList } from './CometChatConversationsList';
import { CometChatConversationsHeader } from './CometChatConversationsHeader';
import { CometChatConversationsSearchBar } from './CometChatConversationsSearchBar';
import { CometChatConversationsEmptyState } from './CometChatConversationsEmptyState';
import { CometChatConversationsErrorState } from './CometChatConversationsErrorState';
import { CometChatConversationsLoadingState } from './CometChatConversationsLoadingState';
import { CometChatConfirmDialog } from '../base/CometChatConfirmDialog/CometChatConfirmDialog';
import { CometChatToast } from '../base/CometChatToast';
import { CometChatPinSaveConfirmDialog } from '../base/CometChatPinSaveConfirmDialog';
import type {
  CometChatConversationsRootProps,
  CometChatConversationsContextValue,
} from './CometChatConversations.types';
import './CometChatConversations.css';
import { useLocale } from '../../context/locale/LocaleContext';
import { useGlobalConfig } from '../../context/GlobalConfigContext';

/**
 * CometChatConversationsRoot — Provider + default layout.
 *
 * Wraps children with the CometChatConversations context. If no children are provided,
 * renders the default layout (Header + SearchBar + List + state views).
 */
export const CometChatConversationsRoot: React.FC<CometChatConversationsRootProps> = ({
  conversationsRequestBuilder,
  searchRequestBuilder,
  searchKeyword,
  hideUserStatus: hideUserStatusProp,
  hideUnreadCount = false,
  hideReceipts: hideReceiptsProp,
  hideGroupType = false,
  lastMessageDateTimeFormat,
  disableSoundForMessages: disableSoundForMessagesProp,
  customSoundForMessages: customSoundForMessagesProp,
  selectionMode = 'none',
  activeConversation,
  options,
  onItemClick,
  onSelect,
  onError,
  onEmpty,
  onSearchBarClicked,
  hideDeleteConversation = false,
  hidePinConversation = false,
  showSearchBar = true,
  searchView,
  textFormatters,
  children,
}) => {
  const { getLocalizedString } = useLocale();
  const globalConfig = useGlobalConfig();
  const hideUserStatus = hideUserStatusProp ?? globalConfig.hideUserStatus ?? false;
  const hideReceipts = hideReceiptsProp ?? globalConfig.hideReceipts ?? false;
  const disableSoundForMessages =
    disableSoundForMessagesProp ?? globalConfig.disableSoundForMessages ?? false;
  const customSoundForMessages = customSoundForMessagesProp ?? globalConfig.customSoundForMessages;
  const hookReturn = useCometChatConversations({
    conversationsRequestBuilder,
    searchRequestBuilder,
    searchKeyword,
    hideUserStatus,
    disableSoundForMessages,
    customSoundForMessages,
    selectionMode,
    activeConversation,
    onError,
    onEmpty,
    onSelect,
    onItemClick,
  });

  const contextValue: CometChatConversationsContextValue = useMemo(
    () => ({
      ...hookReturn,
      selectionMode,
      hideUserStatus,
      hideUnreadCount,
      hideReceipts,
      hideGroupType,
      lastMessageDateTimeFormat,
      options,
      onSearchBarClicked,
      hideDeleteConversation,
      hidePinConversation,
      showSearchBar,
      textFormatters,
    }),
    [
      hookReturn,
      selectionMode,
      hideUserStatus,
      hideUnreadCount,
      hideReceipts,
      hideGroupType,
      lastMessageDateTimeFormat,
      options,
      onSearchBarClicked,
      hideDeleteConversation,
      hidePinConversation,
      showSearchBar,
      textFormatters,
    ]
  );

  const hasChildren = React.Children.count(children) > 0;

  const handleDeleteConfirm = useCallback(async () => {
    if (!hookReturn.conversationToBeDeleted) return;
    const convId = hookReturn.conversationToBeDeleted.getConversationId();
    await hookReturn.deleteConversation(convId);
    hookReturn.setConversationToBeDeleted(null);
  }, [hookReturn]);

  const handleDeleteCancel = useCallback(() => {
    hookReturn.setConversationToBeDeleted(null);
  }, [hookReturn]);

  return (
    <CometChatConversationsContext.Provider value={contextValue}>
      <div
        className={'cometchat-conversations'}
        role="region"
        aria-label={getLocalizedString('conversation_chat_title')}
      >
        {hasChildren ? (
          children
        ) : (
          <>
            <CometChatConversationsHeader />
            {showSearchBar &&
              (searchView !== undefined ? searchView : <CometChatConversationsSearchBar />)}
            <CometChatConversationsLoadingState />
            <CometChatConversationsErrorState />
            <CometChatConversationsEmptyState />
            {(hookReturn.fetchState === 'loaded' || hookReturn.conversations.length > 0) && (
              <CometChatConversationsList />
            )}
          </>
        )}

        {/* Delete confirmation dialog. Rendered directly so it uses the confirm
            dialog's own body-portalled, fixed full-screen backdrop and overlays
            the whole app (over the chat) — same as the pin/save dialog below.
            Do NOT wrap it in a locally-positioned backdrop: the dialog portals to
            <body>, so a `position: absolute/static` wrapper drops it behind the UI. */}
        {hookReturn.conversationToBeDeleted && (
          <CometChatConfirmDialog.Root isOpen={true} onClose={handleDeleteCancel} variant="danger">
            <CometChatConfirmDialog.Icon />
            <CometChatConfirmDialog.Content
              title={getLocalizedString('conversation_delete_title')}
              messageText={getLocalizedString('conversation_delete_subtitle')}
            />
            <CometChatConfirmDialog.Actions
              cancelButtonText={getLocalizedString('conversation_delete_confirm_no')}
              confirmButtonText={getLocalizedString('conversation_delete_confirm_yes')}
              onConfirm={handleDeleteConfirm}
              onCancel={handleDeleteCancel}
            />
          </CometChatConfirmDialog.Root>
        )}

        {contextValue.pinConfirmState && (
          <CometChatPinSaveConfirmDialog
            action={contextValue.pinConfirmState.action}
            onConfirm={contextValue.confirmPinAction}
            onCancel={contextValue.cancelPinAction}
            isBusy={contextValue.pinIsBusy}
          />
        )}

        {/* Pin/unpin acknowledgement. Lives here rather than in the row so it
            survives the row being re-ordered out from under it. Keyed on the
            toast id so a repeat of the same text remounts and restarts its
            dismiss timer rather than reusing the previous one's. */}
        {contextValue.pinToastText && (
          <CometChatToast
            key={contextValue.pinToastId}
            text={contextValue.pinToastText}
            variant={contextValue.pinToastVariant}
            onClose={contextValue.clearPinToast}
            showCloseButton={false}
          />
        )}
      </div>
    </CometChatConversationsContext.Provider>
  );
};

CometChatConversationsRoot.displayName = 'CometChatConversations.Root';
