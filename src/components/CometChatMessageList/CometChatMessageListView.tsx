import React, { lazy, Suspense, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { useCometChatMessageListContext } from './CometChatMessageList.context';
import { CometChatMessageListDateSeparator } from './CometChatMessageListDateSeparator';
import { CometChatMessageListScrollToBottom } from './CometChatMessageListScrollToBottom';
import { CometChatMessageListFloatingDate } from './CometChatMessageListFloatingDate';
import MessageItem from './CometChatMessageListMessageItem';
import { CometChatConfirmDialog } from '../base/CometChatConfirmDialog/CometChatConfirmDialog';
import { usePinSaveActions } from '../../hooks/usePinSaveActions';
import { CometChatPinSaveConfirmDialog } from '../base/CometChatPinSaveConfirmDialog';
import { CometChatFlagMessageDialog } from '../CometChatFlagMessageDialog/CometChatFlagMessageDialog';
import { CometChatToast } from '../base/CometChatToast/CometChatToast';
import { useLocale } from '../../context/locale/LocaleContext';
import { canLoadOnScroll, useMessageListViewScroll } from './useMessageListViewScroll';
import { useMessageListViewDialogs } from './useMessageListViewDialogs';
import { isDifferentDay } from './CometChatMessageList.utils';
import { computeBatchPosition } from '../../utils/CometChatBatchUtils';
import type { CometChatMessageListAlignment } from './CometChatMessageList.types';
import { useOverlayContainer } from '../../context/OverlayContainerContext';
import { isOfflineOn } from '../../utils/offline/gate';
import { renderKey } from '../../utils/offline/identity';
import { CometChatMessageListOfflineNotices } from './CometChatMessageListOfflineNotices';
import './CometChatMessageList.css';
import {
  contractRowOf,
  messageRowAttributes,
  reportFrame,
  type ContractListFooter,
} from '../../utils/offline/contract';

// Lazy-load heavy components only needed on interaction
const LazyCometChatEmojiKeyboard = lazy(() =>
  import('../base/CometChatEmojiKeyboard/CometChatEmojiKeyboardRoot').then(m => ({
    default: m.CometChatEmojiKeyboardRoot,
  }))
);
const LazyCometChatMessageInformation = lazy(() =>
  import('../CometChatMessageInformation/CometChatMessageInformationRoot').then(m => ({
    default: m.CometChatMessageInformationRoot,
  }))
);

export interface CometChatMessageListViewProps {
  /** Message list alignment (local override). */
  messageAlignment?: CometChatMessageListAlignment;
  /** Hide the scrollbar (local override). */
  showScrollbar?: boolean;
  /** Hide date separators (local override). */
  hideDateSeparator?: boolean;

  /** Callbacks (local override) */
  onThreadRepliesClick?: (message: CometChat.BaseMessage) => void;
  onAvatarClick?: (user: CometChat.User) => void;
  /** Hide the remark text area in the flag message dialog (local override). */
  hideFlagRemarkField?: boolean;
  /** Disable text truncation in text bubbles (local override). */
  disableTruncation?: boolean;
  /** Hide the moderation footer (local override). */
  hideModerationView?: boolean;
  /** Whether this is an AI agent chat (local override). */
  isAgentChat?: boolean;
}

/**
 * CometChatMessageListView — the scroll container that renders all messages.
 *
 * Uses native rendering with CSS overflow-anchor for scroll anchoring.
 * IntersectionObserver on top sentinel triggers reverse infinite scroll.
 */
export const CometChatMessageListView: React.FC<CometChatMessageListViewProps> = ({
  messageAlignment: messageAlignmentProp,
  showScrollbar: showScrollbarProp,
  hideDateSeparator: hideDateSeparatorProp,
  onThreadRepliesClick: onThreadRepliesClickProp,
  onAvatarClick: onAvatarClickProp,
  hideFlagRemarkField: hideFlagRemarkFieldProp,
  disableTruncation: disableTruncationProp,
  hideModerationView: hideModerationViewProp,
  isAgentChat: isAgentChatProp,
}) => {
  const overlayContainer = useOverlayContainer();
  const {
    allMessages,
    loggedInUser,
    user,
    group,
    parentMessageId,
    isLoading,
    isEmpty,
    isError,
    hasMore,
    hasMoreNewer,
    fetchPrevious,
    fetchNext,
    isFetchingMore,
    state,
    offlineJumpToLatest,
    markOlderPrependRef,
    setAtBottom,
    scrollToMessage,
    markConversationAsReadIfUnread,
    deleteMessage,
    markMessageAsUnread,
    reactToMessage,
    goToMessage,
    options: listOptions,
  } = useCometChatMessageListContext();

  // Local prop overrides context value (local takes precedence when provided).
  const messageAlignment = messageAlignmentProp ?? listOptions.messageAlignment;
  const showScrollbar = showScrollbarProp ?? listOptions.showScrollbar;
  const hideDateSeparator = hideDateSeparatorProp ?? listOptions.hideDateSeparator;
  const onThreadRepliesClick = onThreadRepliesClickProp ?? listOptions.onThreadRepliesClick;
  const onAvatarClick = onAvatarClickProp ?? listOptions.onAvatarClick;
  const hideFlagRemarkField = hideFlagRemarkFieldProp ?? listOptions.hideFlagRemarkField;
  const disableTruncation = disableTruncationProp ?? listOptions.disableTruncation;
  const hideModerationView = hideModerationViewProp ?? listOptions.hideModerationView;
  const isAgentChat = isAgentChatProp ?? listOptions.isAgentChat;

  const { getLocalizedString } = useLocale();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // Once this list has shown offline keys it keeps them, so the kill switch
  // turning offline off mid-session never remounts the rows (the list is not
  // reloaded then). A list that never ran offline keeps today's keys.
  const offlineKeysRef = useRef(false);

  // --- Scroll behavior (observers, position restore, auto-scroll) ---
  const { topSentinelRef, bottomSentinelRef, liveRegionRef } = useMessageListViewScroll({
    scrollContainerRef,
    allMessages,
    isFetchingMore,
    // Offline: past the cache the footer offers the retry; scrolling does too
    // once the connection is back (UIK-READ-03). The same for the "load newer"
    // button of a jumped window.
    hasMore: canLoadOnScroll(hasMore, state.offlineFooter, state.offlineFooterRetryable),
    hasMoreNewer: canLoadOnScroll(
      hasMoreNewer,
      state.offlineNewerFooter,
      state.offlineFooterRetryable
    ),
    state,
    fetchPrevious,
    fetchNext,
    setAtBottom,
    markConversationAsReadIfUnread,
    scrollToMessage,
    // Offline: the reconnect edge load reads older messages without a sentinel or a
    // gesture; it records the prepend through this ref so the reader's position holds.
    markOlderPrependRef,
  });

  // State contract frame probe (E2E source builds only; dropped from the package).
  useEffect(() => {
    reportFrame('messages', () => {
      const uid = loggedInUser.getUid();
      return allMessages.map(m => contractRowOf(m, uid));
    });
  });

  // --- Dialog/overlay state (delete, flag, emoji picker, message info, toast) ---
  const {
    toast,
    showToast,
    hideToast,
    deleteTarget,
    handleDeleteMessage,
    handleDeleteConfirm,
    handleDeleteCancel,
    flagTarget,
    handleFlagMessage,
    handleFlagClose,
    handleFlagSubmit,
    handleMarkAsUnread,
    reactTarget,
    handleReactToMessage,
    handleReactClose,
    handleReactionChipClick,
    messageInfoTarget,
    handleMessageInfo,
    handleMessageInfoClose,
    handleReplyPreviewClick,
  } = useMessageListViewDialogs({
    loggedInUser,
    scrollContainerRef,
    deleteMessage,
    markMessageAsUnread,
    reactToMessage,
    goToMessage,
    getLocalizedString,
  });

  // --- Pin / Save actions (optimistic → SDK → toast → revert on error) ---
  const pinSave = usePinSaveActions({
    loggedInUserUid: loggedInUser.getUid(),
    showToast,
  });

  // --- Build message list with date separators ---
  const messageElements = () => {
    const elements: React.ReactNode[] = [];
    // Offline support: one gate read per render. On the offline path an own
    // message keeps one key from compose to ack, so its bubble never remounts;
    // with offline off the key is exactly today's.
    const offlineKeys = (offlineKeysRef.current ||= isOfflineOn());
    const loggedInUid = loggedInUser.getUid();
    const messages = listOptions.hideGroupActionMessages
      ? allMessages.filter(m => (m.getCategory() as string) !== CometChat.CATEGORY_ACTION)
      : allMessages;

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (!msg) continue;
      const prevMsg = i > 0 ? messages[i - 1] : undefined;

      // Date separator
      if (!hideDateSeparator) {
        if (!prevMsg || isDifferentDay(prevMsg.getSentAt(), msg.getSentAt())) {
          elements.push(
            <CometChatMessageListDateSeparator
              key={`date-${String(msg.getSentAt())}`}
              timestamp={msg.getSentAt()}
              {...(listOptions.separatorDateTimeFormat
                ? { formatConfig: listOptions.separatorDateTimeFormat }
                : {})}
            />
          );
        }
      }

      elements.push(
        <div
          key={offlineKeys ? renderKey(msg, loggedInUid) : String(msg.getId() || msg.getMuid())}
          data-message-id={String(msg.getId())}
          {...messageRowAttributes(contractRowOf(msg, loggedInUid))}
        >
          {listOptions.bubbleView ? (
            listOptions.bubbleView(msg, loggedInUser)
          ) : (
            <MessageItem
              message={msg}
              {...(group !== undefined && { group })}
              {...{ messageAlignment }}
              index={i}
              total={messages.length}
              batchPosition={computeBatchPosition(prevMsg, msg, messages[i + 1])}
              {...(onThreadRepliesClick !== undefined && { onThreadRepliesClick })}
              {...(onAvatarClick !== undefined && { onAvatarClick })}
              hideReceipts={listOptions.hideReceipts}
              onDeleteMessage={handleDeleteMessage}
              onFlagMessage={handleFlagMessage}
              onMarkAsUnread={handleMarkAsUnread}
              {...(listOptions.onEditMessage !== undefined && {
                onEditMessage: listOptions.onEditMessage,
              })}
              {...(listOptions.onReplyMessage !== undefined && {
                onReplyMessage: listOptions.onReplyMessage,
              })}
              onReactToMessage={handleReactToMessage}
              onReactionChipClick={handleReactionChipClick}
              {...(listOptions.onReactionListItemClick !== undefined && {
                onReactorClick: listOptions.onReactionListItemClick,
              })}
              onReplyPreviewClick={handleReplyPreviewClick}
              onMessageInfo={handleMessageInfo}
              onPinMessage={pinSave.requestPin}
              onUnpinMessage={pinSave.requestUnpin}
              onSaveMessage={pinSave.requestSave}
              onUnsaveMessage={pinSave.requestUnsave}
              showToast={showToast}
              disableTruncation={disableTruncation}
              hideModerationView={hideModerationView}
              isAgentChat={isAgentChat}
              {...(listOptions.textFormatters !== undefined && {
                textFormatters: listOptions.textFormatters,
              })}
              hideAvatar={listOptions.hideAvatar}
              quickOptionsCount={listOptions.quickOptionsCount}
              hideReplyOption={listOptions.hideReplyOption}
              hideReplyInThreadOption={listOptions.hideReplyInThreadOption}
              hideEditMessageOption={listOptions.hideEditMessageOption}
              hideDeleteMessageOption={listOptions.hideDeleteMessageOption}
              hideCopyMessageOption={listOptions.hideCopyMessageOption}
              hideReactionOption={listOptions.hideReactionOption}
              hideMessageInfoOption={listOptions.hideMessageInfoOption}
              hideFlagMessageOption={listOptions.hideFlagMessageOption}
              hideMessagePrivatelyOption={listOptions.hideMessagePrivatelyOption}
              hideTranslateMessageOption={listOptions.hideTranslateMessageOption}
              hideThreadSubscriptionOption={listOptions.hideThreadSubscriptionOption}
              showMarkAsUnreadOption={listOptions.showMarkAsUnreadOption}
              hidePinMessageOption={listOptions.hidePinMessageOption}
              hideUnpinMessageOption={listOptions.hideUnpinMessageOption}
              hideSaveMessageOption={listOptions.hideSaveMessageOption}
              hideUnsaveMessageOption={listOptions.hideUnsaveMessageOption}
              {...(listOptions.messageSentAtDateTimeFormat !== undefined && {
                messageSentAtDateTimeFormat: listOptions.messageSentAtDateTimeFormat,
              })}
            />
          )}
        </div>
      );

      // Unread messages separator
      if (
        state.showUnreadBanner &&
        state.lastReadMessageId !== null &&
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-conversion
        Number(msg.getId()) === Number(state.lastReadMessageId) &&
        i < messages.length - 1
      ) {
        elements.push(
          <div
            key="unread-separator"
            className={'cometchat-message-list__new-message-divider'}
            role="separator"
            aria-label={getLocalizedString('message_list_new_message')}
          >
            <div />
            <span>{getLocalizedString('message_list_new_message')}</span>
            <div />
          </div>
        );
      }
    }

    return elements;
  };

  // --- Render ---

  if (isLoading || isError || isEmpty) return null;

  // State contract (TEST-PLAN §3.3): what the older-messages end of the list shows.
  const listFooter: ContractListFooter = isFetchingMore
    ? 'loading'
    : state.offlineFooter === 'connect_to_load_more'
      ? 'connect-to-load-more'
      : hasMore
        ? 'none'
        : 'end';

  const scrollClasses = [
    'cometchat-message-list__scroll-container',
    !showScrollbar ? 'cometchat-message-list__scroll-container--hide-scrollbar' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <div className={'cometchat-message-list__scroll-wrapper'}>
        {/* Floating date header */}
        <CometChatMessageListFloatingDate
          scrollContainerRef={scrollContainerRef}
          allMessages={allMessages}
          hideStickyDate={listOptions.hideStickyDate}
          hideDateSeparator={hideDateSeparator}
          {...(listOptions.stickyDateTimeFormat !== undefined && {
            stickyDateTimeFormat: listOptions.stickyDateTimeFormat,
          })}
        />

        <div
          ref={scrollContainerRef}
          className={scrollClasses}
          role="log"
          aria-label={getLocalizedString('accessibility_message_list')}
          data-cc="message-list"
          data-cc-list-footer={listFooter}
        >
          {/* Top sentinel for reverse infinite scroll */}
          <div
            ref={topSentinelRef}
            className={'cometchat-message-list__top-sentinel'}
            aria-hidden="true"
          />

          {/* Offline support: older messages need a connection */}
          {state.offlineFooter === 'connect_to_load_more' && !isFetchingMore && (
            <div
              className={'cometchat-message-list__offline-footer'}
              data-testid="offline-load-more"
              role="status"
            >
              <button
                type="button"
                className={'cometchat-message-list__offline-footer-button'}
                onClick={() => {
                  void fetchPrevious();
                }}
              >
                {getLocalizedString('message_list_connect_to_load_more')}
              </button>
            </div>
          )}

          {/* Fetch-more loading indicator */}
          {isFetchingMore && (
            <div
              className={'cometchat-message-list__shimmer'}
              role="status"
              aria-label={getLocalizedString('accessibility_loading_older_messages')}
            >
              <div
                className={'cometchat-message-list__shimmer-body'}
                style={{ alignSelf: 'flex-start' }}
              >
                <div className={'cometchat-message-list__shimmer-item'} />
              </div>
            </div>
          )}

          {/* Messages */}
          <div className={'cometchat-message-list__messages'}>{messageElements()}</div>

          {/* Offline support: newer messages of a jumped window need a connection */}
          {state.offlineNewerFooter === 'connect_to_load_more' && !isFetchingMore && (
            <div
              className={'cometchat-message-list__offline-footer'}
              data-testid="offline-load-newer"
              role="status"
            >
              <button
                type="button"
                className={'cometchat-message-list__offline-footer-button'}
                onClick={() => {
                  void fetchNext();
                }}
              >
                {getLocalizedString('message_list_connect_to_load_newer')}
              </button>
            </div>
          )}

          {/* Bottom sentinel for at-bottom detection */}
          <div
            ref={bottomSentinelRef}
            className={'cometchat-message-list__bottom-sentinel'}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Offline support: notices about unsent messages */}
      {!listOptions.hideOfflineNotices && (
        <CometChatMessageListOfflineNotices
          user={user}
          group={group}
          parentMessageId={parentMessageId}
          loggedInUser={loggedInUser}
        />
      )}

      {/* Offline support: a sweep found more than a page while reading older messages */}
      {state.offlineJumpToLatest && offlineJumpToLatest && (
        <button
          type="button"
          className={'cometchat-message-list__offline-jump-to-latest'}
          data-testid="offline-jump-to-latest"
          onClick={() => {
            offlineJumpToLatest();
            requestAnimationFrame(() => {
              const el = scrollContainerRef.current;
              if (el) el.scrollTop = el.scrollHeight;
            });
          }}
        >
          {getLocalizedString('message_list_jump_to_latest')}
        </button>
      )}

      {/* Scroll-to-bottom button */}
      <CometChatMessageListScrollToBottom scrollContainerRef={scrollContainerRef} />

      {/* Screen reader live region */}
      <div
        ref={liveRegionRef}
        className={'cometchat-message-list__live-region'}
        aria-live="polite"
      />

      {/* Delete confirm dialog */}
      {deleteTarget && (
        <CometChatConfirmDialog.Root isOpen={true} onClose={handleDeleteCancel} variant="danger">
          <CometChatConfirmDialog.Icon />
          <CometChatConfirmDialog.Content
            title={getLocalizedString('message_list_option_delete')}
            messageText={getLocalizedString('message_list_delete_confirm')}
          />
          <CometChatConfirmDialog.Actions
            cancelButtonText={getLocalizedString('cancel')}
            confirmButtonText={getLocalizedString('message_list_option_delete')}
            onConfirm={handleDeleteConfirm}
            onCancel={handleDeleteCancel}
          />
        </CometChatConfirmDialog.Root>
      )}

      {pinSave.confirmState && (
        <CometChatPinSaveConfirmDialog
          action={pinSave.confirmState.action}
          onConfirm={pinSave.confirm}
          onCancel={pinSave.cancel}
          isBusy={pinSave.isBusy}
        />
      )}

      {/* Flag message dialog */}
      {flagTarget && (
        <CometChatFlagMessageDialog.Root
          message={flagTarget}
          isOpen={true}
          onClose={handleFlagClose}
          onSubmit={handleFlagSubmit}
        >
          <CometChatFlagMessageDialog.Header />
          <CometChatFlagMessageDialog.Reasons />
          {!hideFlagRemarkField && <CometChatFlagMessageDialog.Remark />}
          <CometChatFlagMessageDialog.Actions />
        </CometChatFlagMessageDialog.Root>
      )}

      {/* Toast notification */}
      {toast.text && (
        <CometChatToast
          text={toast.text}
          variant={toast.variant}
          onClose={hideToast}
          showCloseButton={false}
        />
      )}

      {/* Emoji picker popover for reactions */}
      {reactTarget && (
        <Suspense fallback={null}>
          <div
            className={'cometchat-message-list__emoji-picker-overlay'}
            style={{ top: reactTarget.top, left: reactTarget.left }}
          >
            <LazyCometChatEmojiKeyboard
              onEmojiClick={emoji => {
                void reactToMessage(reactTarget.message.getId(), emoji);
                handleReactClose();
              }}
              onClose={handleReactClose}
            />
          </div>
        </Suspense>
      )}

      {/* Message Information panel — centered overlay.
          Portalled: the message list sets `position: relative` for its own scroll-to-bottom and
          shimmer children, so an `absolute` overlay rendered here would cover only the list. */}
      {messageInfoTarget &&
        overlayContainer &&
        createPortal(
          <div
            className={'cometchat-message-list__message-info-overlay'}
            onClick={e => {
              if (e.target === e.currentTarget) {
                handleMessageInfoClose();
              }
            }}
            role="presentation"
          >
            <div className={'cometchat-message-list__message-info-panel'}>
              <Suspense fallback={null}>
                <LazyCometChatMessageInformation
                  message={messageInfoTarget}
                  onClose={handleMessageInfoClose}
                  hideReceipts={listOptions.hideReceipts}
                  {...(listOptions.textFormatters !== undefined && {
                    textFormatters: listOptions.textFormatters,
                  })}
                />
              </Suspense>
            </div>
          </div>,
          overlayContainer
        )}
    </>
  );
};

CometChatMessageListView.displayName = 'CometChatMessageListView';
