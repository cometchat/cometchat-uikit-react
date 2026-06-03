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
> = ({ className }) => {
  const { retry } = useCometChatMessageInformationContext();
  const { getLocalizedString } = useLocale();

  const errorClass = ['cometchat-message-information__error', className ?? '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={errorClass} role="alert">
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
    </div>
  );
};
