import React, { useCallback } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { useCometChatMessageComposerContext } from './CometChatMessageComposer.context';
import { CometChatPopover } from '../base/CometChatPopover';
import { CometChatStickersKeyboard } from '../CometChatStickersKeyboard/CometChatStickersKeyboard';
import type { CometChatStickerClickEvent } from '../CometChatStickersKeyboard/CometChatStickersKeyboard.types';
import { useLocale } from '../../context/locale/LocaleContext';
import { usePublishEvent } from '../../hooks/usePublishEvent';
import { CometChatMessageStatus } from '../../context/CometChatEvents.types';
import stickerIcon from '../../assets/sticker.svg';
import stickerFillIcon from '../../assets/sticker_fill.svg';
import './CometChatMessageComposer.css';

/**
 * CometChatMessageComposerStickerButton — sticker picker trigger.
 *
 * Opens a popover with the CometChatStickersKeyboard. When a sticker is
 * selected, sends a custom message of type 'extension_sticker' with the
 * sticker URL and name in the custom data.
 *
 * - Sends via CometChat.sendCustomMessage with type 'extension_sticker'
 * - Supports parentMessageId for thread mode
 * - Supports quotedMessage for reply mode
 * - Clears reply mode on successful send
 */
export const CometChatMessageComposerStickerButton: React.FC<{ className?: string }> = ({
  className,
}) => {
  const {
    contentToDisplay,
    setContentToDisplay,
    user,
    group,
    parentMessageId,
    messageToReply,
    closePreview,
    onError,
    isInEditMode,
  } = useCometChatMessageComposerContext();
  const { getLocalizedString } = useLocale();
  const publish = usePublishEvent();

  const isActive = contentToDisplay === 'stickers';

  const handleToggle = useCallback(() => {
    setContentToDisplay(isActive ? 'none' : 'stickers');
  }, [isActive, setContentToDisplay]);

  const handleStickerSelect = useCallback(
    (event: CometChatStickerClickEvent) => {
      setContentToDisplay('none');

      if (!CometChat.isInitialized()) return;
      const receiverId = user?.getUid() ?? group?.getGuid();
      const receiverType = user ? CometChat.RECEIVER_TYPE.USER : CometChat.RECEIVER_TYPE.GROUP;
      if (!receiverId) return;

      const customData = {
        sticker_url: event.stickerUrl,
        sticker_name: event.stickerName,
      };

      const customMessage = new CometChat.CustomMessage(
        receiverId,
        receiverType,
        'extension_sticker',
        customData
      );

      const muid = `_${Math.random().toString(36).slice(2, 11)}`;
      customMessage.setMuid(muid);
      customMessage.setSentAt(Math.floor(Date.now() / 1000));

      if (parentMessageId) {
        customMessage.setParentMessageId(parentMessageId);
      }

      if (messageToReply) {
        (
          customMessage as unknown as { setQuotedMessage: (msg: CometChat.BaseMessage) => void }
        ).setQuotedMessage(messageToReply);
      }

      // Set sender and publish optimistically, then send via SDK
      void CometChat.getLoggedinUser()
        .then(loggedInUser => {
          if (loggedInUser) customMessage.setSender(loggedInUser);

          // Publish inprogress so the message list can show it immediately (with quotedMessage)
          publish({
            type: 'ui:message/sent',
            message: customMessage,
            status: CometChatMessageStatus.inprogress,
          });

          return CometChat.sendCustomMessage(customMessage);
        })
        .then((sentMessage: CometChat.BaseMessage) => {
          publish({
            type: 'ui:message/sent',
            message: sentMessage,
            status: CometChatMessageStatus.success,
          });
          if (messageToReply) {
            closePreview();
          }
        })
        .catch((error: unknown) => {
          onError?.(error as CometChat.CometChatException);
        });
    },
    [
      user,
      group,
      parentMessageId,
      messageToReply,
      closePreview,
      setContentToDisplay,
      onError,
      publish,
    ]
  );

  const handleClose = useCallback(() => {
    setContentToDisplay('none');
  }, [setContentToDisplay]);

  const btnClass = [
    'cometchat-message-composer__sticker-button',
    isActive ? 'cometchat-message-composer__sticker-button--active' : '',
    isInEditMode ? 'cometchat-message-composer__sticker-button--disabled' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <CometChatPopover
      placement="top"
      closeOnOutsideClick
      isOpen={isActive}
      onClose={handleClose}
      trigger={
        <button
          type="button"
          className={btnClass}
          disabled={isInEditMode}
          onClick={e => {
            e.stopPropagation();
            if (isInEditMode) return;
            handleToggle();
          }}
          aria-label={getLocalizedString('message_composer_sticker_hover')}
          aria-expanded={isActive}
        >
          <img
            src={isActive ? stickerFillIcon : stickerIcon}
            alt=""
            aria-hidden="true"
            width={24}
            height={24}
            draggable={false}
            className={'cometchat-message-composer__button-icon'}
          />
        </button>
      }
      content={
        <CometChatStickersKeyboard onStickerClick={handleStickerSelect} onClose={handleClose} />
      }
    />
  );
};

CometChatMessageComposerStickerButton.displayName = 'CometChatMessageComposerStickerButton';
