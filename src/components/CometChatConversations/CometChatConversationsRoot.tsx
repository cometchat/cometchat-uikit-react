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
import type {
  CometChatConversationsRootProps,
  CometChatConversationsContextValue,
} from './CometChatConversations.types';
import './CometChatConversations.css';
import { useLocale } from '../../context/locale/LocaleContext';

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
  hideUserStatus = false,
  hideUnreadCount = false,
  hideReceipts = false,
  hideGroupType = false,
  lastMessageDateTimeFormat,
  disableSoundForMessages = false,
  customSoundForMessages,
  selectionMode = 'none',
  activeConversation,
  options,
  onItemClick,
  onSelect,
  onError,
  onEmpty,
  onSearchBarClicked,
  hideDeleteConversation = false,
  showSearchBar = true,
  searchView,
  children,
}) => {
  const { getLocalizedString } = useLocale();
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
      showSearchBar,
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
      showSearchBar,
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

        {/* Delete confirmation dialog — covers entire conversations area */}
        {hookReturn.conversationToBeDeleted && (
          <div
            className={'cometchat-conversations__delete-dialog-backdrop'}
            onClick={handleDeleteCancel}
            onKeyDown={e => {
              if (e.key === 'Escape') handleDeleteCancel();
            }}
            role="presentation"
          >
            <div
              onClick={e => {
                e.stopPropagation();
              }}
              onKeyDown={e => {
                e.stopPropagation();
              }}
              role="presentation"
            >
              <CometChatConfirmDialog.Root
                isOpen={true}
                onClose={handleDeleteCancel}
                variant="danger"
                className={'cometchat-conversations__delete-dialog'}
              >
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
            </div>
          </div>
        )}
      </div>
    </CometChatConversationsContext.Provider>
  );
};

CometChatConversationsRoot.displayName = 'CometChatConversations.Root';
