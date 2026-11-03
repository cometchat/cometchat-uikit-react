import React from 'react';
import type { CometChatMessageInformationErrorStateProps } from './CometChatMessageInformation.types';
import { useCometChatMessageInformationContext } from './CometChatMessageInformation.context';
import { useLocale } from '../../context/locale/LocaleContext';
import './CometChatMessageInformation.css';

/**
 * CometChatMessageInformation.ErrorState — error display with retry button.
 */
export const CometChatMessageInformationErrorState: React.FC<
  CometChatMessageInformationErrorStateProps
> = ({ className, children }) => {
  const { retry, fetchState, userReceipts, oneOnOneReadAt, oneOnOneDeliveredAt } =
    useCometChatMessageInformationContext();
  const { getLocalizedString } = useLocale();

  // Shown only when the load failed with nothing to show, wherever it is placed.
  const nothingYet = userReceipts.length === 0 && !oneOnOneReadAt && !oneOnOneDeliveredAt;
  if (fetchState !== 'error' || !nothingYet) return null;

  const errorClass = ['cometchat-message-information__error', className ?? '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={errorClass} role="alert">
      {children ?? (
        <>
          <span className={'cometchat-message-information__error-text'}>
            {getLocalizedString('message_information_error')}
          </span>
          <button
            type="button"
            className={'cometchat-message-information__error-retry-button'}
            onClick={retry}
          >
            {getLocalizedString('retry')}
          </button>
        </>
      )}
    </div>
  );
};
