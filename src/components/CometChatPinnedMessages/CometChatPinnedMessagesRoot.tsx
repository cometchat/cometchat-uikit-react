import React, { useCallback, useMemo, useRef, useState, lazy, Suspense } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatToast } from '../base/CometChatToast';
import { usePinSaveActions } from '../../hooks/usePinSaveActions';
import { CometChatPinSaveConfirmDialog } from '../base/CometChatPinSaveConfirmDialog';
import { usePanelA11y } from '../../hooks/usePanelA11y';
import { useLoggedInUser } from '../../hooks/useLoggedInUser';
import { useLocale } from '../../context/locale/LocaleContext';
import { localizeWithFallback } from '../../utils/localizeWithFallback';
import { useCometChatPinnedMessages } from './useCometChatPinnedMessages';
import { CometChatPinnedMessagesContext } from './CometChatPinnedMessages.context';
import { CometChatPinnedMessagesHeader } from './CometChatPinnedMessagesHeader';
import { CometChatPinnedMessagesLoadingState } from './CometChatPinnedMessagesLoadingState';
import { CometChatPinnedMessagesErrorState } from './CometChatPinnedMessagesErrorState';
import { CometChatPinnedMessagesEmptyState } from './CometChatPinnedMessagesEmptyState';
import { CometChatPinnedMessagesList } from './CometChatPinnedMessagesList';
import type {
  CometChatPinnedMessagesRootProps,
  CometChatPinnedMessagesContextValue,
} from './CometChatPinnedMessages.types';
import './CometChatPinnedMessages.css';

const LazyCometChatMessageInformation = lazy(() =>
  import('../CometChatMessageInformation/CometChatMessageInformationRoot').then(m => ({
    default: m.CometChatMessageInformationRoot,
  }))
);

/**
 * How many options sit outside the overflow menu by default.
 *
 * Kept low deliberately: the panel is ~400px wide and every quick icon comes
 * straight out of the bubble's width. Exported so tests track it rather than
 * assuming a number.
 */
export const PINNED_DEFAULT_QUICK_OPTIONS_COUNT = 1;

/**
 * CometChatPinnedMessages.Root — Provider + default layout.
 *
 * Wires the data hook, pin/save actions, role gating, panel a11y, the Message
 * Information overlay, confirm dialog and toast; exposes them via context; and
 * renders either `children` (compound composition) or the default layout.
 */
export const CometChatPinnedMessagesRoot: React.FC<CometChatPinnedMessagesRootProps> = ({
  user,
  group,
  onItemClick,
  onClose,
  hideCloseButton = false,
  itemView,
  headerView,
  emptyView,
  errorView,
  loadingView,
  className,
  hideCopyMessageOption,
  hideMessageInfoOption,
  hideUnpinMessageOption,
  hideSaveMessageOption,
  hideUnsaveMessageOption,
  hideFlagMessageOption,
  hideMessagePrivatelyOption,
  hideTranslateMessageOption,
  messagesRequestBuilder,
  quickOptionsCount = PINNED_DEFAULT_QUICK_OPTIONS_COUNT,
  textFormatters,
  children,
}) => {
  const { getLocalizedString } = useLocale();
  const loggedInUser = useLoggedInUser();
  const { messages, fetchState, hasMore, loadMore } = useCometChatPinnedMessages(
    user,
    group,
    messagesRequestBuilder
  );

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

  const [messageInfoTarget, setMessageInfoTarget] = useState<CometChat.BaseMessage | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  // Escape closes the panel, unless the Message Information overlay is up — that
  // is on top, so Escape belongs to it first.
  usePanelA11y({
    containerRef: panelRef,
    onDismiss: messageInfoTarget
      ? () => {
          setMessageInfoTarget(null);
        }
      : onClose,
  });

  const pinSave = usePinSaveActions({
    loggedInUserUid: loggedInUser?.getUid() ?? '',
    showToast,
  });

  const loc = (key: string, fallback: string): string =>
    localizeWithFallback(getLocalizedString, key, fallback);

  const contextValue: CometChatPinnedMessagesContextValue = useMemo(
    () => ({
      messages,
      fetchState,
      hasMore,
      loadMore,
      hideCloseButton,
      quickOptionsCount,
      hideCopyMessageOption,
      hideMessageInfoOption,
      hideUnpinMessageOption,
      hideSaveMessageOption,
      hideUnsaveMessageOption,
      hideFlagMessageOption,
      hideMessagePrivatelyOption,
      hideTranslateMessageOption,
      onPinMessage: pinSave.requestPin,
      onUnpinMessage: pinSave.requestUnpin,
      onSaveMessage: pinSave.requestSave,
      onUnsaveMessage: pinSave.requestUnsave,
      onMessageInfo: setMessageInfoTarget,
      showToast,
      ...(onItemClick !== undefined && { onItemClick }),
      ...(group !== undefined && { group }),
      ...(itemView !== undefined && { itemView }),
      ...(textFormatters !== undefined && { textFormatters }),
      ...(onClose !== undefined && { onClose }),
    }),
    [
      messages,
      fetchState,
      hasMore,
      loadMore,
      hideCloseButton,
      quickOptionsCount,
      hideCopyMessageOption,
      hideMessageInfoOption,
      hideUnpinMessageOption,
      hideSaveMessageOption,
      hideUnsaveMessageOption,
      hideFlagMessageOption,
      hideMessagePrivatelyOption,
      hideTranslateMessageOption,
      pinSave.requestPin,
      pinSave.requestUnpin,
      pinSave.requestSave,
      pinSave.requestUnsave,
      showToast,
      onItemClick,
      group,
      itemView,
      textFormatters,
      onClose,
    ]
  );

  const rootClasses = ['cometchat-pinned-messages', className].filter(Boolean).join(' ');
  const hasChildren = React.Children.count(children) > 0;

  return (
    <CometChatPinnedMessagesContext.Provider value={contextValue}>
      <div
        ref={panelRef}
        className={rootClasses}
        role="dialog"
        aria-label={loc('message_header_option_pinned_messages', 'Pinned Messages')}
        tabIndex={-1}
      >
        {hasChildren ? (
          children
        ) : (
          <>
            <CometChatPinnedMessagesHeader>{headerView}</CometChatPinnedMessagesHeader>
            <CometChatPinnedMessagesLoadingState>{loadingView}</CometChatPinnedMessagesLoadingState>
            <CometChatPinnedMessagesErrorState>{errorView}</CometChatPinnedMessagesErrorState>
            <CometChatPinnedMessagesEmptyState>{emptyView}</CometChatPinnedMessagesEmptyState>
            <CometChatPinnedMessagesList />
          </>
        )}

        {/* Message Information — same centered overlay the message list uses. */}
        {messageInfoTarget && (
          <div
            className={'cometchat-pinned-messages__message-info-overlay'}
            onClick={e => {
              if (e.target === e.currentTarget) setMessageInfoTarget(null);
            }}
            role="presentation"
          >
            <div className={'cometchat-pinned-messages__message-info-panel'}>
              <Suspense fallback={null}>
                <LazyCometChatMessageInformation
                  message={messageInfoTarget}
                  onClose={() => {
                    setMessageInfoTarget(null);
                  }}
                  {...(textFormatters !== undefined && { textFormatters })}
                />
              </Suspense>
            </div>
          </div>
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
    </CometChatPinnedMessagesContext.Provider>
  );
};

CometChatPinnedMessagesRoot.displayName = 'CometChatPinnedMessages.Root';
