import React, { useCallback } from 'react';
import type { CometChatMessageComposerSendButtonProps } from './CometChatMessageComposer.types';
import { useCometChatMessageComposerContext } from './CometChatMessageComposer.context';
import { useLocale } from '../../context/locale/LocaleContext';
import sendFillIcon from '../../assets/send_fill.svg';
import './CometChatMessageComposer.css';

/**
 * CometChatMessageComposerSendButton — send/save button.
 *
 * - Enabled when canSend is true AND not currently sending.
 * - In edit mode: click calls editMessage().
 * - In normal mode: click calls sendMessage().
 *
 * Customization:
 * - Pass `children` to replace the default icon content (button shell + actions stay wired).
 * - In compound mode, omit this component entirely and render your own button.
 */
export const CometChatMessageComposerSendButton: React.FC<
  CometChatMessageComposerSendButtonProps
> = ({ children, className }) => {
  const { canSend, isInEditMode, sendState, sendMessage, editMessage } =
    useCometChatMessageComposerContext();
  const { getLocalizedString } = useLocale();

  const handleClick = useCallback(() => {
    if (isInEditMode) {
      void editMessage();
    } else {
      void sendMessage();
    }
  }, [isInEditMode, editMessage, sendMessage]);

  const isSending = sendState === 'sending';
  const disabled = !canSend || isSending;
  const label = isInEditMode
    ? getLocalizedString('SAVE') || 'Save'
    : getLocalizedString('SEND') || 'Send';

  const btnClass = [
    'cometchat-message-composer__send-button',
    canSend && !isSending ? 'cometchat-message-composer__send-button--active' : '',
    disabled ? 'cometchat-message-composer__send-button--disabled' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={btnClass}
      onClick={handleClick}
      disabled={disabled}
      aria-label={label}
      aria-busy={isSending}
    >
      {children ?? (
        <img
          src={sendFillIcon}
          alt=""
          aria-hidden="true"
          width={24}
          height={24}
          draggable={false}
          className={'cometchat-message-composer__send-button-icon'}
        />
      )}
    </button>
  );
};
