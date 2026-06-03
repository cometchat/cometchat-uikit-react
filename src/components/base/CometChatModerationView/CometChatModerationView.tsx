import React from 'react';
import type { CometChatModerationViewProps } from './CometChatModerationView.types';
import { useLocale } from '../../../context/locale/LocaleContext';
import './CometChatModerationView.css';

/**
 * CometChatModerationView — footer shown under a message that was blocked
 * by moderation or rejected with a permission-denied error.
 *
 * Renders a warning icon + short message. The parent message bubble decides
 * when to mount this (via the `bottomView` slot) based on moderation status
 * or metadata error.
 */
export const CometChatModerationView: React.FC<CometChatModerationViewProps> = ({
  message,
  className,
}) => {
  const { getLocalizedString } = useLocale();
  const text = message ?? getLocalizedString('moderation_block_message');

  const classes = ['cometchat-moderation-view', className].filter(Boolean).join(' ');

  return (
    <div className={classes} role="status" aria-live="polite">
      <span className={'cometchat-moderation-view__icon'} aria-hidden="true" />
      <p className={'cometchat-moderation-view__message'}>{text}</p>
    </div>
  );
};

CometChatModerationView.displayName = 'CometChatModerationView';
