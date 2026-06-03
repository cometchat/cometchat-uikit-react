import React from 'react';
import type { CometChatMessageInformationEmptyStateProps } from './CometChatMessageInformation.types';
import { useLocale } from '../../context/locale/LocaleContext';
import './CometChatMessageInformation.css';

/**
 * CometChatMessageInformation.EmptyState — shown when no receipts are available.
 */
export const CometChatMessageInformationEmptyState: React.FC<
  CometChatMessageInformationEmptyStateProps
> = ({ className }) => {
  const { getLocalizedString } = useLocale();
  const emptyClass = ['cometchat-message-information__empty', className ?? '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={emptyClass}>
      <span className={'cometchat-message-information__empty-text'}>
        {getLocalizedString('message_information_group_message_receipt_empty')}
      </span>
    </div>
  );
};
