import React, { useCallback } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatMessageBubbleRenderer } from '../CometChatMessageBubble/CometChatMessageBubbleRenderer';
import { CometChatDate } from '../base/CometChatDate';
import { useLoggedInUser } from '../../hooks/useLoggedInUser';
import { useLocale } from '../../context/locale/LocaleContext';
import { localizeWithFallback } from '../../utils/localizeWithFallback';
import { getMessageSubtitle } from '../../utils/messageSubtitle';
import { useCometChatPinnedMessagesContext } from './CometChatPinnedMessages.context';
import type { CometChatPinnedMessagesItemProps } from './CometChatPinnedMessages.types';

/**
 * Selectors for things that are interactive in their own right. A click landing
 * inside one of these is that control's click — opening the options menu, playing
 * audio, tapping a link — and must NOT also navigate to the message.
 */
const INTERACTIVE_SELECTOR = [
  'button',
  'a',
  'input',
  'audio',
  'video',
  '[role="button"]',
  '[role="menu"]',
  '[role="menuitem"]',
  '[class*="message-bubble__options"]',
  '[class*="context-menu"]',
  '[class*="cometchat-audio-bubble"]',
  '[class*="cometchat-video-bubble"]',
  '[class*="reactions"]',
].join(',');

/**
 * CometChatPinnedMessages.Item — one pinned-message row: a left-aligned bubble
 * with a "{name} · {time}" header and pin/save options. Reads its configuration
 * (options toggles, actions, formatters) from the pinned-messages context.
 */
export const CometChatPinnedMessagesItem: React.FC<CometChatPinnedMessagesItemProps> = ({
  message,
  index = 0,
}) => {
  const { getLocalizedString } = useLocale();
  const loggedInUser = useLoggedInUser();
  const loc = (key: string, fallback: string): string =>
    localizeWithFallback(getLocalizedString, key, fallback);

  const {
    messages,
    onItemClick,
    group,
    textFormatters,
    quickOptionsCount,
    hideCopyMessageOption,
    hideMessageInfoOption,
    hideUnpinMessageOption,
    hideSaveMessageOption,
    hideUnsaveMessageOption,
    hideFlagMessageOption,
    hideMessagePrivatelyOption,
    hideTranslateMessageOption,
    onPinMessage,
    onUnpinMessage,
    onSaveMessage,
    onUnsaveMessage,
    onMessageInfo,
    showToast,
  } = useCometChatPinnedMessagesContext();

  const isOwn = message.getSender().getUid() === loggedInUser?.getUid();

  const handleRowClick = useCallback(
    (event: React.MouseEvent | React.KeyboardEvent) => {
      // Let controls inside the bubble keep their own clicks.
      const target = event.target as HTMLElement | null;
      if (target?.closest(INTERACTIVE_SELECTOR)) return;
      onItemClick?.(message);
    },
    [onItemClick, message]
  );

  /**
   * What a screen reader should call this row: who sent it and what it says.
   * Plain text, so the preview is stripped of the markup `getMessageSubtitle`
   * emits for the visual row — an `aria-label` renders tags literally.
   */
  const rowAccessibleName = (): string => {
    const sender = message.getSender();
    const name =
      sender.getUid() === loggedInUser?.getUid()
        ? loc('conversation_subtitle_you_message', 'You')
        : sender.getName();

    let preview = '';
    try {
      preview = getMessageSubtitle(message, {
        loggedInUserId: loggedInUser?.getUid(),
        iconClassPrefix: 'cometchat-pinned-messages__a11y-icon',
        t: getLocalizedString,
      })
        .replace(/<[^>]*>/g, '')
        .trim();
    } catch {
      preview = '';
    }

    return preview ? `${name}: ${preview}` : name;
  };

  /** "{You|Sender} · 12:45 pm" — the row header, replacing day dividers. */
  const renderRowHeader = (m: CometChat.BaseMessage) => {
    const sender = m.getSender();
    const own = sender.getUid() === loggedInUser?.getUid();
    const name = own ? loc('conversation_subtitle_you_message', 'You') : sender.getName();

    return (
      <div className={'cometchat-pinned-messages__row-header'}>
        <span className={'cometchat-pinned-messages__row-header-name'}>{name}</span>
        <span className={'cometchat-pinned-messages__row-header-dot'} aria-hidden="true">
          •
        </span>
        <CometChatDate
          timestamp={m.getSentAt()}
          variant="caption2"
          formatConfig={{
            today: 'hh:mm A',
            yesterday: loc('date_yesterday', 'Yesterday'),
            otherDays: 'DD/MM/YYYY',
          }}
        />
      </div>
    );
  };

  return (
    <div
      className={'cometchat-pinned-messages__item'}
      role="listitem"
      // Names the row, then says what activating it does — the sender and time
      // are what tell rows apart to a screen reader.
      aria-label={`${rowAccessibleName()}. ${loc('accessibility_go_to_message', 'Go to message')}`}
      onClick={handleRowClick}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleRowClick(e);
        }
      }}
      tabIndex={0}
    >
      <CometChatMessageBubbleRenderer
        message={message}
        {...(group !== undefined && { group })}
        // Every row reads left-to-right…
        messageAlignment={0}
        // …but an outgoing message keeps its own colour.
        bubbleVariant={isOwn ? 'outgoing' : 'incoming'}
        {...(textFormatters !== undefined && { textFormatters })}
        forceShowAvatar
        headerView={renderRowHeader}
        index={index}
        total={messages.length}
        hideReceipts
        hideThreadView
        // ~400px wide: a fly-out has nowhere to go, so pin/save sit flat.
        optionsLayout="flat"
        quickOptionsCount={quickOptionsCount}
        hideReplyOption
        hideReplyInThreadOption
        hideEditMessageOption
        // Deleting from here would destroy the message for everyone while the user
        // is only browsing pins — Unpin is the action that belongs on this surface.
        hideDeleteMessageOption
        hideReactionOption
        // Unpin is offered to everyone; the server enforces permission and a denied
        // unpin reverts with a toast. Visibility depends only on the consumer flag.
        hideUnpinMessageOption={hideUnpinMessageOption}
        hideCopyMessageOption={hideCopyMessageOption}
        hideMessageInfoOption={hideMessageInfoOption}
        hideSaveMessageOption={hideSaveMessageOption}
        hideUnsaveMessageOption={hideUnsaveMessageOption}
        hideFlagMessageOption={hideFlagMessageOption}
        hideMessagePrivatelyOption={hideMessagePrivatelyOption}
        hideTranslateMessageOption={hideTranslateMessageOption}
        onPinMessage={onPinMessage}
        onUnpinMessage={onUnpinMessage}
        onMessageInfo={onMessageInfo}
        onSaveMessage={onSaveMessage}
        onUnsaveMessage={onUnsaveMessage}
        showToast={showToast}
      />
    </div>
  );
};

CometChatPinnedMessagesItem.displayName = 'CometChatPinnedMessages.Item';
