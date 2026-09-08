import React from 'react';
import { useLocale } from '../../context/locale/LocaleContext';
import { localizeWithFallback } from '../../utils/localizeWithFallback';
import { useCometChatPinnedMessagesContext } from './CometChatPinnedMessages.context';
import type { CometChatPinnedMessagesSlotProps } from './CometChatPinnedMessages.types';
import listErrorIcon from '../../assets/list_error_state_icon.svg';

/**
 * CometChatPinnedMessages.ErrorState — shown when the initial fetch fails.
 * Self-gates on fetch state.
 */
export const CometChatPinnedMessagesErrorState: React.FC<CometChatPinnedMessagesSlotProps> = ({
  children,
}) => {
  const { getLocalizedString } = useLocale();
  const loc = (key: string, fallback: string): string =>
    localizeWithFallback(getLocalizedString, key, fallback);
  const { fetchState, messages } = useCometChatPinnedMessagesContext();

  if (fetchState !== 'error' || messages.length > 0) return null;
  if (children !== undefined) return <>{children}</>;

  return (
    <div className={'cometchat-pinned-messages__error'} role="status">
      <div className={'cometchat-pinned-messages__error-icon'} aria-hidden="true">
        <img src={listErrorIcon} alt="" loading="lazy" decoding="async" />
      </div>
      <div className={'cometchat-pinned-messages__error-title'}>
        {loc('component_error_title', 'OOPS!')}
      </div>
      <div className={'cometchat-pinned-messages__error-subtitle'}>
        {loc('component_error_subtitle', 'Looks like something went wrong')}
      </div>
    </div>
  );
};

CometChatPinnedMessagesErrorState.displayName = 'CometChatPinnedMessages.ErrorState';
