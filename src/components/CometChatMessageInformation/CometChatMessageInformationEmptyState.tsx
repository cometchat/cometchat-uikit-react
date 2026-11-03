import React from 'react';
import type { CometChatMessageInformationEmptyStateProps } from './CometChatMessageInformation.types';
import { useCometChatMessageInformationContext } from './CometChatMessageInformation.context';
import { useLocale } from '../../context/locale/LocaleContext';
import './CometChatMessageInformation.css';

/**
 * CometChatMessageInformation.EmptyState — shown when no receipts are available.
 */
export const CometChatMessageInformationEmptyState: React.FC<
  CometChatMessageInformationEmptyStateProps
> = ({ className, children }) => {
  const { getLocalizedString } = useLocale();
  const { fetchState, isGroupMessage, userReceipts } = useCometChatMessageInformationContext();

  // Shown only when a group message has no receipts yet, wherever it is placed.
  if (!isGroupMessage || fetchState === 'loading' || fetchState === 'error') return null;
  if (userReceipts.length > 0) return null;
  const emptyClass = ['cometchat-message-information__empty', className ?? '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={emptyClass}>
      {children ?? (
        <span className={'cometchat-message-information__empty-text'}>
          {getLocalizedString('message_information_group_message_receipt_empty')}
        </span>
      )}
    </div>
  );
};
