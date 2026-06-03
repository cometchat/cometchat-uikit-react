import React from 'react';
import type { CometChatConfirmDialogContentProps } from './CometChatConfirmDialog.types';
import { TITLE_ID, MESSAGE_ID } from './CometChatConfirmDialogRoot';
import { useLocale } from '../../../context/locale/LocaleContext';
import './CometChatConfirmDialog.css';

/**
 * Content area for the confirm dialog. Renders title + message text,
 * or custom children when provided.
 */
export const CometChatConfirmDialogContent: React.FC<CometChatConfirmDialogContentProps> = ({
  title,
  messageText,
  children,
  className,
}) => {
  const { getLocalizedString } = useLocale();

  const resolvedTitle = title ?? getLocalizedString('conversation_delete_title');
  const resolvedMessage = messageText ?? getLocalizedString('conversation_delete_subtitle');

  const contentClasses = ['cometchat-confirm-dialog__content', className].filter(Boolean).join(' ');

  if (children) {
    return <div className={contentClasses}>{children}</div>;
  }

  return (
    <div className={contentClasses}>
      <div id={TITLE_ID} className={'cometchat-confirm-dialog__content-title'}>
        {resolvedTitle}
      </div>
      <div id={MESSAGE_ID} className={'cometchat-confirm-dialog__content-message'}>
        {resolvedMessage}
      </div>
    </div>
  );
};

CometChatConfirmDialogContent.displayName = 'CometChatConfirmDialogContent';
