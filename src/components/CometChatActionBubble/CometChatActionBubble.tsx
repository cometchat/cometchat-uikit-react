import React from 'react';
import type { CometChatActionBubbleProps } from './CometChatActionBubble.types';
import './CometChatActionBubble.css';

/**
 * CometChatActionBubble — renders a centered system message for actions.
 *
 * Used for group actions ("Alice joined the group") and call status messages
 * ("Missed Call", "Call Ended", etc.).
 *
 * Renders nothing if messageText is empty/whitespace.
 * Supports an optional icon via CSS class name.
 * Override the icon by targeting the class in your own CSS.
 *
 * Accessible: role="status", aria-label.
 */
export const CometChatActionBubble: React.FC<CometChatActionBubbleProps> = ({
  messageText,
  iconClassName,
  iconErrorColor = false,
  className,
}) => {
  const shouldRender = messageText.trim().length > 0;

  if (!shouldRender) return null;

  const rootClasses = ['cometchat-action-bubble', className].filter(Boolean).join(' ');

  return (
    <div className={rootClasses} role="status" aria-label={messageText}>
      {iconClassName && (
        <div
          className={[
            'cometchat-action-bubble__icon',
            iconClassName,
            iconErrorColor ? 'cometchat-action-bubble__icon--error' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-hidden="true"
        />
      )}
      <span
        className={[
          'cometchat-action-bubble__text',
          iconErrorColor ? 'cometchat-action-bubble__text--error' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {messageText}
      </span>
    </div>
  );
};

CometChatActionBubble.displayName = 'CometChatActionBubble';
