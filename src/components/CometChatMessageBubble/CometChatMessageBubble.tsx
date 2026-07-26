import React, { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CometChatMessageBubbleProps } from './CometChatMessageBubble.types';
import { useGlobalConfig } from '../../context/GlobalConfigContext';
import { useLocale } from '../../context/locale/LocaleContext';
import { useCometChatFrameContext } from '../../context/CometChatFrameContext';
import { CometChatAvatar } from '../base/CometChatAvatar';
import { CometChatDate } from '../base/CometChatDate';
import { CometChatThreadView } from '../base/CometChatThreadView';
import { CometChatContextMenu } from '../base/CometChatContextMenu/CometChatContextMenu';
import type { CometChatContextMenuItemData } from '../base/CometChatContextMenu/CometChatContextMenu.types';
import './CometChatMessageBubble.css';

import statusSent from '../../assets/status_sent.svg';
import statusDelivered from '../../assets/status_delivered.svg';
import statusRead from '../../assets/status_read.svg';
import statusError from '../../assets/status_error.svg';
import statusWait from '../../assets/status_sending.svg';
import {
  getReceiptStatus,
  isMessageModerated,
  isPermissionDeniedError,
} from '../../utils/MessageReceiptUtils';
import { CometChat } from '@cometchat/chat-sdk-javascript';

/**
 * Message types whose content is user-editable (text body or media caption).
 * A non-zero `editedAt` on any of these means the message was edited, so the
 * bubble surfaces the "Edited" indicator. Media types are included so edited
 * image/video/audio/file messages — including multi-attachment/plural bubbles —
 * show it too, not just plain text.
 */
const EDITABLE_MESSAGE_TYPES = new Set<string>([
  CometChat.MESSAGE_TYPE.TEXT,
  CometChat.MESSAGE_TYPE.IMAGE,
  CometChat.MESSAGE_TYPE.VIDEO,
  CometChat.MESSAGE_TYPE.AUDIO,
  CometChat.MESSAGE_TYPE.FILE,
]);

const LazyCometChatReactionsRoot = lazy(() =>
  import('../CometChatReactions/CometChatReactionsRoot').then(m => ({
    default: m.CometChatReactionsRoot,
  }))
);

function getBubbleTypeClass(type: string, category: string): string {
  const key = `${type}_${category}`;
  const map: Record<string, string> = {
    text_message: 'cometchat-message-bubble__text-message',
    image_message: 'cometchat-message-bubble__image-message',
    video_message: 'cometchat-message-bubble__video-message',
    audio_message: 'cometchat-message-bubble__audio-message',
    file_message: 'cometchat-message-bubble__file-message',
    groupMember_action: 'cometchat-message-bubble__group-message',
    // AI agent reply (category 'agentic', type 'assistant') — gets its own
    // background class so it doesn't blend into the conversation background.
    assistant_agentic: 'cometchat-message-bubble__assistant-message',
    // Extension plugins — custom message types that need bubble backgrounds
    extension_sticker_custom: 'cometchat-message-bubble__image-message',
    extension_poll_custom: 'cometchat-message-bubble__text-message',
    extension_document_custom: 'cometchat-message-bubble__text-message',
    extension_whiteboard_custom: 'cometchat-message-bubble__text-message',
  };
  if (map[key]) return map[key];
  // Developer cards have an arbitrary type under category "card" — resolve on the
  // category alone so the card gets the standard per-direction bubble background.
  if (category === (CometChat.MessageCategory.CARD as string)) {
    return 'cometchat-message-bubble__card-message';
  }
  return '';
}

/**
 * CometChatMessageBubble — shared wrapper for all message types.
 *
 * Renders avatar, sender name, bubble background, content (from plugin),
 * timestamp, receipts, and thread view. The `contentView` prop is the
 * inner content produced by `plugin.renderBubble()`.
 */
export const CometChatMessageBubble: React.FC<CometChatMessageBubbleProps> = ({
  message,
  alignment,
  contentView,
  group,
  options = [],
  hideAvatar = false,
  hideSenderName = false,
  hideTimestamp = false,
  hideThreadView = false,
  showError = false,
  disableInteraction = false,
  hideReceipts: hideReceiptsProp,
  forceShowAvatar = false,
  messageSentAtDateTimeFormat,
  quickOptionsCount,
  leadingView,
  headerView,
  statusInfoView,
  footerView,
  threadView,
  bottomView,
  replyView,
  onAvatarClick,
  onThreadRepliesClick,
  onOptionClick,
  onReactionChipClick,
  onReactorClick,
  isSelected = false,
  ariaPosinset,
  ariaSetsize,
  className,
  setRef,
  includeBottomViewHeight = false,
  toggleOptionsVisibility,
}) => {
  const globalConfig = useGlobalConfig();
  const { getLocalizedString } = useLocale();
  const effectiveHideReceipts = hideReceiptsProp ?? globalConfig.hideReceipts ?? false;
  const [isHovering, setIsHovering] = useState(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const bottomViewRef = useRef<HTMLDivElement>(null);
  const [isOptionsLocked, setIsOptionsLocked] = useState(false);
  const IframeContext = useCometChatFrameContext();

  const getCurrentDocument = useCallback(() => {
    return IframeContext.iframeDocument ?? document;
  }, [IframeContext.iframeDocument]);

  // Called when the context menu dropdown closes (option click, overlay, scroll)
  // Hides the quick options toolbar.
  const handleDropdownClose = useCallback(() => {
    setIsHovering(false);
  }, []);

  // Unlock + hide on outside click when locked
  useEffect(() => {
    if (!isOptionsLocked) return;

    const handleOutsideClick = (e: MouseEvent) => {
      const optionsEl = getCurrentDocument().querySelector(
        '[class*="message-bubble__options--visible"]'
      );
      if (optionsEl && !optionsEl.contains(e.target as Node)) {
        setIsOptionsLocked(false);
        setIsHovering(false);
      }
    };

    // Delay listener attachment to avoid catching the same click that locked
    const timeoutId = setTimeout(() => {
      getCurrentDocument().addEventListener('mousedown', handleOutsideClick);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      getCurrentDocument().removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOptionsLocked, getCurrentDocument]);

  const isOutgoing = alignment === 'right';
  const isIncoming = alignment === 'left';
  const isAction = alignment === 'center';

  const sender = message.getSender();
  const messageType = message.getType();
  const messageCategory = message.getCategory();
  // "Edited" applies to any editable-content message, not just text: media
  // messages (image/video/audio/file — including multi-attachment/plural bubbles)
  // carry an editable caption, so a non-zero editedAt on them is a real edit.
  // Restricting this to `text` hid the indicator for edited media messages.
  const isEdited =
    Boolean(message.getEditedAt()) &&
    messageCategory === CometChat.MessageCategory.MESSAGE &&
    EDITABLE_MESSAGE_TYPES.has(messageType);
  const replyCount = message.getReplyCount();
  const sentAt = message.getSentAt();

  const receiptState = showError ? ('error' as const) : getReceiptStatus(message);

  // forceShowAvatar used in agent chat to show AI avatar in 1:1 mode
  const shouldShowAvatar =
    (isIncoming && group != null && !hideAvatar) || (isIncoming && forceShowAvatar);

  const shouldShowSenderName = isIncoming && group != null && !hideSenderName;
  const shouldShowReceipts = isOutgoing && !effectiveHideReceipts && !isAction;

  // handleThreadClick needs to be defined before the effective view computations
  const handleThreadClick = useCallback(() => {
    if (onThreadRepliesClick) {
      onThreadRepliesClick(message);
    }
  }, [message, onThreadRepliesClick]);

  // --- Effective view computations (null/undefined/ReactNode semantics) ---

  const effectiveFooterContent = useMemo(() => {
    if (footerView === null) return null;
    if (footerView !== undefined) return footerView(message);

    const reactions = message.getReactions();
    const loggedInUid = message.getSender().getUid();
    const isBlocked =
      isMessageModerated(message, loggedInUid) || isPermissionDeniedError(message, loggedInUid);
    if (!isBlocked && reactions.length > 0) {
      const msgId = message.getId();
      const reactionClickHandler = onReactionChipClick
        ? (emoji: string) => {
            onReactionChipClick(msgId, emoji);
          }
        : undefined;
      return (
        <Suspense fallback={null}>
          <LazyCometChatReactionsRoot
            message={message}
            alignment={alignment}
            {...(reactionClickHandler && { onReactionClick: reactionClickHandler })}
            {...(onReactorClick && { onReactorClick })}
          />
        </Suspense>
      );
    }
    return null;
  }, [footerView, message, alignment, onReactionChipClick, onReactorClick]);

  const effectiveBottomContent = useMemo(() => {
    if (bottomView === null) return null;
    if (bottomView !== undefined) return bottomView(message);
    return null; // no built-in default here
  }, [bottomView, message]);

  // Sync moderation bottom-view max-width to the body's rendered width.
  // Only active when a bottom view (moderation) exists.
  useEffect(() => {
    const bodyEl = bodyRef.current;
    const bottomEl = bottomViewRef.current;
    if (!bodyEl || !bottomEl) return;

    const sync = () => {
      const w = String(Math.max(bodyEl.offsetWidth, 240));
      bottomEl.style.maxWidth = `${w}px`;
    };
    sync();

    const ro = new ResizeObserver(sync);
    ro.observe(bodyEl);
    return () => {
      ro.disconnect();
    };
  }, [effectiveBottomContent]);

  const effectiveReplyContent = useMemo(() => {
    if (replyView === null) return null;
    if (replyView !== undefined) return replyView;
    return null; // no built-in default here
  }, [replyView]);

  const effectiveThreadContent = useMemo(() => {
    if (threadView === null) return null;
    if (threadView !== undefined) return threadView(message);

    if (!hideThreadView && replyCount > 0 && !isAction) {
      return (
        <CometChatThreadView.Root replyCount={replyCount} onClick={handleThreadClick}>
          <CometChatThreadView.Icon />
          <CometChatThreadView.ReplyCount />
        </CometChatThreadView.Root>
      );
    }
    return null;
  }, [threadView, message, hideThreadView, replyCount, isAction, handleThreadClick]);

  // Hover handlers for context menu
  const handleMouseEnter = useCallback(() => {
    if (disableInteraction) return;
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsHovering(true);
  }, [disableInteraction]);

  const handleMouseLeave = useCallback(() => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovering(false);
    }, 150);
  }, []);

  const optionsVisible = toggleOptionsVisibility ?? isHovering;

  const contextMenuItems: CometChatContextMenuItemData[] = useMemo(() => {
    return options.map(opt => {
      const item: CometChatContextMenuItemData = {
        id: opt.id,
        title: opt.title,
        onClick: () => {
          opt.onClick(message);
          onOptionClick?.(opt, message);
        },
      };
      if (opt.iconURL) {
        item.iconURL = opt.iconURL;
      }
      return item;
    });
  }, [options, message, onOptionClick]);

  const handleAvatarClick = useCallback(() => {
    if (onAvatarClick) {
      onAvatarClick(sender);
    }
  }, [sender, onAvatarClick]);

  const handleAvatarKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleAvatarClick();
      }
    },
    [handleAvatarClick]
  );

  const ariaLabel = useMemo(() => {
    const parts: string[] = [];
    parts.push(sender.getName());
    parts.push(`${messageType} message`);
    return parts.join(', ');
  }, [sender, messageType]);

  const bubbleTypeClass = getBubbleTypeClass(messageType, messageCategory);

  const wrapperClasses = [
    'cometchat-message-bubble__wrapper',
    isOutgoing ? 'cometchat-message-bubble__wrapper--outgoing' : '',
    isSelected ? 'cometchat-message-bubble__wrapper--selected' : '',
    receiptState === 'error' && effectiveBottomContent
      ? 'cometchat-message-bubble__wrapper--moderation-disapproved'
      : '',
    // Plain global class names for external CSS targeting
    'cometchat-message-bubble__wrapper',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const bubbleClasses = [
    'cometchat-message-bubble',
    isIncoming ? 'cometchat-message-bubble-incoming' : '',
    isOutgoing ? 'cometchat-message-bubble-outgoing' : '',
    isAction ? 'cometchat-message-bubble-action' : '',
    // Plain global class names (non-hashed) so external CSS (e.g. AI chat overrides) can target them
    isIncoming ? 'cometchat-message-bubble-incoming' : '',
    isOutgoing ? 'cometchat-message-bubble-outgoing' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const bodyClasses = ['cometchat-message-bubble__body', bubbleTypeClass].filter(Boolean).join(' ');

  const receiptIcon = useMemo(() => {
    switch (receiptState) {
      case 'read':
        return statusRead;
      case 'delivered':
        return statusDelivered;
      case 'error':
        return statusError;
      case 'wait':
        return statusWait;
      default:
        return statusSent;
    }
  }, [receiptState]);

  const receiptLabel = useMemo(() => {
    switch (receiptState) {
      case 'read':
        return getLocalizedString('message_bubble_read');
      case 'delivered':
        return getLocalizedString('message_bubble_delivered');
      case 'error':
        return getLocalizedString('message_bubble_error');
      case 'wait':
        return getLocalizedString('message_bubble_sending');
      default:
        return getLocalizedString('message_bubble_sent');
    }
  }, [receiptState, getLocalizedString]);

  return (
    <div
      ref={setRef}
      className={wrapperClasses}
      role="article"
      aria-label={ariaLabel}
      aria-selected={isSelected || undefined}
      aria-posinset={ariaPosinset}
      aria-setsize={ariaSetsize}
    >
      {leadingView !== null && (shouldShowAvatar || leadingView) && (
        <div className={'cometchat-message-bubble__leading-view'}>
          {leadingView ? (
            leadingView(message)
          ) : (
            <div
              onClick={handleAvatarClick}
              onKeyDown={handleAvatarKeyDown}
              role="button"
              tabIndex={0}
              aria-label={getLocalizedString('accessibility_avatar_for').replace(
                '{name}',
                sender.getName()
              )}
            >
              <CometChatAvatar.Root image={sender.getAvatar()} name={sender.getName()} size="small">
                <CometChatAvatar.Image />
                <CometChatAvatar.Initials />
              </CometChatAvatar.Root>
            </div>
          )}
        </div>
      )}

      <div className={bubbleClasses}>
        {headerView !== null && (shouldShowSenderName || headerView) && (
          <div className={'cometchat-message-bubble__header-view'}>
            {headerView ? (
              headerView(message)
            ) : (
              <span className={'cometchat-message-bubble__sender-name'}>{sender.getName()}</span>
            )}
          </div>
        )}

        <div className={'cometchat-message-bubble__body-container'} onMouseLeave={handleMouseLeave}>
          {contextMenuItems.length > 0 && !disableInteraction && !isAction && (
            <div
              className={[
                'cometchat-message-bubble__options',
                optionsVisible ? 'cometchat-message-bubble__options--visible' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={
                includeBottomViewHeight
                  ? { height: 'stretch' }
                  : bodyRef.current
                    ? { height: `${String(bodyRef.current.clientHeight)}px` }
                    : undefined
              }
              role="toolbar"
            >
              <CometChatContextMenu
                key={isHovering ? 'hovered' : 'not-hovered'}
                items={contextMenuItems}
                topMenuSize={quickOptionsCount ?? 2}
                placement={isOutgoing ? 'left' : 'right'}
                disableBackgroundInteraction
                useParentContainer
                onDropdownClose={handleDropdownClose}
              />
            </div>
          )}

          <div
            className={[
              'cometchat-message-bubble__body-wrapper',
              'cometchat-message-bubble__body-wrapper',
            ].join(' ')}
          >
            <div
              ref={bodyRef}
              className={bodyClasses}
              onMouseEnter={handleMouseEnter}
              role={disableInteraction ? undefined : 'presentation'}
            >
              {effectiveReplyContent && (
                <div className={'cometchat-message-bubble__body-reply-view'}>
                  {effectiveReplyContent}
                </div>
              )}

              <div
                className={[
                  'cometchat-message-bubble__body-content-view',
                  'cometchat-message-bubble__body-content-view',
                ].join(' ')}
              >
                {contentView}
              </div>

              {statusInfoView !== null && !isAction && messageType !== 'meeting' && (
                <div
                  className={[
                    'cometchat-message-bubble__body-status-info-view',
                    'cometchat-message-bubble__body-status-info-view',
                  ].join(' ')}
                  role="status"
                  aria-live="polite"
                >
                  {statusInfoView ? (
                    statusInfoView(message)
                  ) : (
                    <div className={'cometchat-message-bubble__status-info-view'}>
                      {isEdited && (
                        <span className={'cometchat-message-bubble__status-info-view-helper-text'}>
                          {getLocalizedString('message_list_action_edited')}
                        </span>
                      )}
                      {!hideTimestamp && sentAt > 0 && (
                        <CometChatDate
                          timestamp={sentAt}
                          variant="caption2"
                          formatConfig={
                            messageSentAtDateTimeFormat ?? {
                              today: 'hh:mm a',
                              yesterday: 'hh:mm a',
                              lastWeek: 'hh:mm a',
                              otherDays: 'hh:mm a',
                            }
                          }
                        />
                      )}
                      {shouldShowReceipts && (
                        <div
                          className={['cometchat-receipts', `cometchat-receipts-${receiptState}`]
                            .filter(Boolean)
                            .join(' ')}
                          role="img"
                          aria-label={receiptLabel}
                        >
                          <img
                            className={'cometchat-message-list__receipt'}
                            src={receiptIcon}
                            alt=""
                            decoding="async"
                            width={16}
                            height={16}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {effectiveFooterContent && (
              <div className={'cometchat-message-bubble__body-footer-view'}>
                {effectiveFooterContent}
              </div>
            )}

            {effectiveBottomContent && (
              <div ref={bottomViewRef} className={'cometchat-message-bubble__body-bottom-view'}>
                {effectiveBottomContent}
              </div>
            )}

            {effectiveThreadContent && (
              <div className={'cometchat-message-bubble__body-thread-view'}>
                {effectiveThreadContent}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

CometChatMessageBubble.displayName = 'CometChatMessageBubble';
