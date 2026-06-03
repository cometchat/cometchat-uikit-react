import React from 'react';
import type { CometChatFlagMessageDialogHeaderProps } from './CometChatFlagMessageDialog.types';
import { TITLE_ID, SUBTITLE_ID } from './CometChatFlagMessageDialogRoot';
import { useLocale } from '../../../context/locale/LocaleContext';
import './CometChatFlagMessageDialog.css';

/**
 * Header area for the flag message dialog. Renders title + subtitle,
 * or custom children when provided.
 */
export const CometChatFlagMessageDialogHeader: React.FC<CometChatFlagMessageDialogHeaderProps> = ({
  title,
  subtitle,
  children,
  className,
}) => {
  const { getLocalizedString } = useLocale();

  const resolvedTitle = title ?? getLocalizedString('flag_message_title');
  const resolvedSubtitle = subtitle ?? getLocalizedString('flag_message_subtitle');

  const headerClasses = ['cometchat-flag-message-dialog__header', className]
    .filter(Boolean)
    .join(' ');

  if (children) {
    return <div className={headerClasses}>{children}</div>;
  }

  return (
    <div className={headerClasses}>
      <div id={TITLE_ID} className={'cometchat-flag-message-dialog__header-title'}>
        {resolvedTitle}
      </div>
      <div id={SUBTITLE_ID} className={'cometchat-flag-message-dialog__header-subtitle'}>
        {resolvedSubtitle}
      </div>
    </div>
  );
};

CometChatFlagMessageDialogHeader.displayName = 'CometChatFlagMessageDialogHeader';
