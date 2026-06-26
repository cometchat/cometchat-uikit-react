import React, { lazy, Suspense, useRef } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { useCometChatMessageListContext } from './CometChatMessageList.context';
import { CometChatMessageListDateSeparator } from './CometChatMessageListDateSeparator';
import { CometChatMessageListScrollToBottom } from './CometChatMessageListScrollToBottom';
import { CometChatMessageListFloatingDate } from './CometChatMessageListFloatingDate';
import MessageItem from './CometChatMessageListMessageItem';
import { CometChatConfirmDialog } from '../base/CometChatConfirmDialog/CometChatConfirmDialog';
import { CometChatFlagMessageDialog } from '../CometChatFlagMessageDialog/CometChatFlagMessageDialog';
import { CometChatToast } from '../base/CometChatToast/CometChatToast';
import { useLocale } from '../../context/locale/LocaleContext';
import { useMessageListViewScroll } from './useMessageListViewScroll';
import { useMessageListViewDialogs } from './useMessageListViewDialogs';
import { isDifferentDay } from './CometChatMessageList.utils';
import type { CometChatMessageListAlignment } from './CometChatMessageList.types';
import './CometChatMessageList.css';

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
  const {
    allMessages,
    loggedInUser,
    group,
    isLoading,
    isEmpty,
    isError,
    hasMore,
    hasMoreNewer,
    fetchPrevious,
    fetchNext,
    isFetchingMore,
    state,
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

  // --- Scroll behavior (observers, position restore, auto-scroll) ---
  const { topSentinelRef, bottomSentinelRef, liveRegionRef } = useMessageListViewScroll({
    scrollContainerRef,
    allMessages,
    isFetchingMore,
    hasMore,
    hasMoreNewer,
    state,
    fetchPrevious,
    fetchNext,
    setAtBottom,
    markConversationAsReadIfUnread,
    scrollToMessage,
  });

  // --- Dialog/overlay state (delete, flag, emoji picker, message info, toast) ---
  const {
    toastText,
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

  // --- Build message list with date separators ---
  const messageElements = () => {
    const elements: React.ReactNode[] = [];
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
        <div key={String(msg.getId() || msg.getMuid())} data-message-id={String(msg.getId())}>
          {listOptions.bubbleView ? (
            listOptions.bubbleView(msg, loggedInUser)
          ) : (
            <MessageItem
              message={msg}
              {...(group !== undefined && { group })}
              {...{ messageAlignment }}
              index={i}
              total={messages.length}
              {...(onThreadRepliesClick !== undefined && { onThreadRepliesClick })}
              {...(onAvatarClick !== undefined && { onAvatarClick })}
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
              showToast={showToast}
              disableTruncation={disableTruncation}
              hideModerationView={hideModerationView}
              isAgentChat={isAgentChat}
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
              showMarkAsUnreadOption={listOptions.showMarkAsUnreadOption}
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
        >
          {/* Top sentinel for reverse infinite scroll */}
          <div
            ref={topSentinelRef}
            className={'cometchat-message-list__top-sentinel'}
            aria-hidden="true"
          />

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

          {/* Bottom sentinel for at-bottom detection */}
          <div
            ref={bottomSentinelRef}
            className={'cometchat-message-list__bottom-sentinel'}
            aria-hidden="true"
          />
        </div>
      </div>

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
      {toastText && <CometChatToast text={toastText} onClose={hideToast} showCloseButton={false} />}

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

      {/* Message Information panel — centered overlay */}
      {messageInfoTarget && (
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
              />
            </Suspense>
          </div>
        </div>
      )}
    </>
  );
};

CometChatMessageListView.displayName = 'CometChatMessageListView';
