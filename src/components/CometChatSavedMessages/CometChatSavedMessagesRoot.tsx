import React, { useCallback, useMemo, useRef, useState } from 'react';
import { CometChatToast } from '../base/CometChatToast';
import { usePinSaveActions } from '../../hooks/usePinSaveActions';
import { CometChatPinSaveConfirmDialog } from '../base/CometChatPinSaveConfirmDialog';
import { usePanelA11y } from '../../hooks/usePanelA11y';
import { useLoggedInUser } from '../../hooks/useLoggedInUser';
import { useLocale } from '../../context/locale/LocaleContext';
import { localizeWithFallback } from '../../utils/localizeWithFallback';
import { useCometChatSavedMessages } from './useCometChatSavedMessages';
import { CometChatSavedMessagesContext } from './CometChatSavedMessages.context';
import { CometChatSavedMessagesHeader } from './CometChatSavedMessagesHeader';
import { CometChatSavedMessagesLoadingState } from './CometChatSavedMessagesLoadingState';
import { CometChatSavedMessagesErrorState } from './CometChatSavedMessagesErrorState';
import { CometChatSavedMessagesEmptyState } from './CometChatSavedMessagesEmptyState';
import { CometChatSavedMessagesList } from './CometChatSavedMessagesList';
import type {
  CometChatSavedMessagesRootProps,
  CometChatSavedMessagesContextValue,
} from './CometChatSavedMessages.types';
import './CometChatSavedMessages.css';

/**
 * CometChatSavedMessages.Root — Provider + default layout.
 *
 * Wires the data hook, pin/save actions, panel a11y, confirm dialog and toast,
 * exposes them via context, and renders either `children` (compound composition)
 * or the default layout (Header + state views + List).
 */
export const CometChatSavedMessagesRoot: React.FC<CometChatSavedMessagesRootProps> = ({
  onItemClick,
  onClose,
  hideCloseButton = false,
  itemView,
  headerView,
  emptyView,
  errorView,
  loadingView,
  className,
  hideUnsaveMessageOption = false,
  messagesRequestBuilder,
  textFormatters,
  children,
}) => {
  const { getLocalizedString } = useLocale();
  const loggedInUser = useLoggedInUser();
  const { messages, fetchState, hasMore, loadMore } =
    useCometChatSavedMessages(messagesRequestBuilder);

  // `id` increments on every raise so two identical toasts in a row still remount
  // and restart the dismiss timer rather than reusing the first one's.
  const [toast, setToast] = useState<{
    id: number;
    text: string;
    variant: 'default' | 'error';
  }>({ id: 0, text: '', variant: 'default' });
  const showToast = useCallback((text: string, variant: 'default' | 'error' = 'default') => {
    setToast(previous => ({ id: previous.id + 1, text, variant }));
  }, []);

  const pinSave = usePinSaveActions({
    loggedInUserUid: loggedInUser?.getUid() ?? '',
    showToast,
  });

  const loc = (key: string, fallback: string): string =>
    localizeWithFallback(getLocalizedString, key, fallback);

  const panelRef = useRef<HTMLDivElement>(null);
  usePanelA11y({ containerRef: panelRef, onDismiss: onClose });

  const contextValue: CometChatSavedMessagesContextValue = useMemo(
    () => ({
      messages,
      fetchState,
      hasMore,
      loadMore,
      onUnsave: pinSave.requestUnsave,
      hideUnsaveMessageOption,
      hideCloseButton,
      ...(onItemClick !== undefined && { onItemClick }),
      ...(itemView !== undefined && { itemView }),
      ...(textFormatters !== undefined && { textFormatters }),
      ...(onClose !== undefined && { onClose }),
    }),
    [
      messages,
      fetchState,
      hasMore,
      loadMore,
      pinSave.requestUnsave,
      hideUnsaveMessageOption,
      hideCloseButton,
      onItemClick,
      itemView,
      textFormatters,
      onClose,
    ]
  );

  const rootClasses = ['cometchat-saved-messages', className].filter(Boolean).join(' ');
  const hasChildren = React.Children.count(children) > 0;

  return (
    <CometChatSavedMessagesContext.Provider value={contextValue}>
      <div
        ref={panelRef}
        className={rootClasses}
        role="dialog"
        aria-label={loc('selector_option_saved_messages', 'Saved Messages')}
        tabIndex={-1}
      >
        {hasChildren ? (
          children
        ) : (
          <>
            <CometChatSavedMessagesHeader>{headerView}</CometChatSavedMessagesHeader>
            <CometChatSavedMessagesLoadingState>{loadingView}</CometChatSavedMessagesLoadingState>
            <CometChatSavedMessagesErrorState>{errorView}</CometChatSavedMessagesErrorState>
            <CometChatSavedMessagesEmptyState>{emptyView}</CometChatSavedMessagesEmptyState>
            <CometChatSavedMessagesList />
          </>
        )}

        {pinSave.confirmState && (
          <CometChatPinSaveConfirmDialog
            action={pinSave.confirmState.action}
            onConfirm={pinSave.confirm}
            onCancel={pinSave.cancel}
            isBusy={pinSave.isBusy}
          />
        )}

        {toast.text && (
          <CometChatToast
            key={toast.id}
            text={toast.text}
            variant={toast.variant}
            onClose={() => {
              setToast(previous => ({ ...previous, text: '' }));
            }}
            showCloseButton={false}
          />
        )}
      </div>
    </CometChatSavedMessagesContext.Provider>
  );
};

CometChatSavedMessagesRoot.displayName = 'CometChatSavedMessages.Root';
