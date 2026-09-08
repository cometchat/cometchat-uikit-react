import React from 'react';
import { useLocale } from '../../context/locale/LocaleContext';
import { localizeWithFallback } from '../../utils/localizeWithFallback';
import { useCometChatSavedMessagesContext } from './CometChatSavedMessages.context';
import type { CometChatSavedMessagesSlotProps } from './CometChatSavedMessages.types';
import listErrorIcon from '../../assets/list_error_state_icon.svg';

/**
 * CometChatSavedMessages.ErrorState — shown when the initial fetch fails.
 * Self-gates on fetch state.
 */
export const CometChatSavedMessagesErrorState: React.FC<CometChatSavedMessagesSlotProps> = ({
  children,
}) => {
  const { getLocalizedString } = useLocale();
  const loc = (key: string, fallback: string): string =>
    localizeWithFallback(getLocalizedString, key, fallback);
  const { fetchState, messages } = useCometChatSavedMessagesContext();

  if (fetchState !== 'error' || messages.length > 0) return null;
  if (children !== undefined) return <>{children}</>;

  return (
    <div className={'cometchat-saved-messages__error'} role="status">
      <div className={'cometchat-saved-messages__error-icon'} aria-hidden="true">
        <img src={listErrorIcon} alt="" width={120} height={120} loading="lazy" decoding="async" />
      </div>
      <div className={'cometchat-saved-messages__error-title'}>
        {loc('component_error_title', 'OOPS!')}
      </div>
      <div className={'cometchat-saved-messages__error-subtitle'}>
        {loc('component_error_subtitle', 'Looks like something went wrong')}
      </div>
    </div>
  );
};

CometChatSavedMessagesErrorState.displayName = 'CometChatSavedMessages.ErrorState';
