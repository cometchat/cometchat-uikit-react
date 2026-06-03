import React from 'react';
import type { CometChatMessageInformationHeaderProps } from './CometChatMessageInformation.types';
import { useCometChatMessageInformationContext } from './CometChatMessageInformation.context';
import { useLocale } from '../../context/locale/LocaleContext';
import './CometChatMessageInformation.css';

/**
 * CometChatMessageInformation.Header — title and close button.
 */
export const CometChatMessageInformationHeader: React.FC<
  CometChatMessageInformationHeaderProps
> = ({ className }) => {
  const { onClose } = useCometChatMessageInformationContext();
  const { getLocalizedString } = useLocale();

  const headerClass = ['cometchat-message-information__header', className ?? '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={headerClass}>
      <h2
        id="cometchat-message-info-title"
        className={'cometchat-message-information__header-title'}
      >
        {getLocalizedString('message_information_title')}
      </h2>
      <button
        type="button"
        className={'cometchat-message-information__header-close-button'}
        aria-label={getLocalizedString('message_information_close_hover')}
        data-cometchat-message-info-close
        onClick={onClose}
      >
        <span className={'cometchat-message-information__header-close-icon'} aria-hidden="true" />
      </button>
    </div>
  );
};
