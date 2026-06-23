import React from 'react';
import type { CometChatDeleteBubbleProps } from './CometChatDeleteBubble.types';
import { useLocale } from '../../../hooks/useLocale';
import './CometChatDeleteBubble.css';

/**
 * CometChatDeleteBubble — renders a "This message was deleted" placeholder.
 *
 * Displayed when a message has been soft-deleted (getDeletedAt() !== null).
 * The PluginRegistry routes deleted messages to the DeletePlugin regardless
 * of their original type.
 *
 * Features:
 * - Delete icon via CSS mask on message_delete.svg
 * - Localized text via useLocale()
 * - Sender/receiver styling variants
 * - Accessible: role="status", aria-label
 */
export const CometChatDeleteBubble: React.FC<CometChatDeleteBubbleProps> = ({
  isSentByMe = false,
  text,
  className,
}) => {
  const { getLocalizedString } = useLocale();
  const displayText = text ?? getLocalizedString('message_deleted');

  const rootClasses = [
    'cometchat-delete-bubble',
    isSentByMe ? 'cometchat-delete-bubble--sender' : 'cometchat-delete-bubble--receiver',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClasses} role="status" aria-label={displayText}>
      <div className={'cometchat-delete-bubble__body'}>
        <div className={'cometchat-delete-bubble__icon'} aria-hidden="true" />
        <span className={'cometchat-delete-bubble__text'}>{displayText}</span>
      </div>
    </div>
  );
};

CometChatDeleteBubble.displayName = 'CometChatDeleteBubble';
