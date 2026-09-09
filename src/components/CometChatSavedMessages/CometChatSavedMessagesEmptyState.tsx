import React from 'react';
import { useLocale } from '../../context/locale/LocaleContext';
import { localizeWithFallback } from '../../utils/localizeWithFallback';
import { useCometChatSavedMessagesContext } from './CometChatSavedMessages.context';
import type { CometChatSavedMessagesSlotProps } from './CometChatSavedMessages.types';

/**
 * CometChatSavedMessages.EmptyState — shown when there are no saved messages.
 * Self-gates on fetch state.
 */
export const CometChatSavedMessagesEmptyState: React.FC<CometChatSavedMessagesSlotProps> = ({
  children,
}) => {
  const { getLocalizedString } = useLocale();
  const loc = (key: string, fallback: string): string =>
    localizeWithFallback(getLocalizedString, key, fallback);
  const { fetchState, messages } = useCometChatSavedMessagesContext();

  if (messages.length > 0 || fetchState === 'loading' || fetchState === 'error') return null;
  if (children !== undefined) return <>{children}</>;

  return (
    <div className={'cometchat-saved-messages__empty'} role="status">
      <div className={'cometchat-saved-messages__empty-icon'} aria-hidden="true" />
      <div className={'cometchat-saved-messages__empty-title'}>
        {loc('saved_messages_empty', 'No saved messages yet')}
      </div>
      <div className={'cometchat-saved-messages__empty-subtitle'}>
        {loc(
          'saved_messages_empty_subtitle',
          'Save messages to keep them handy whenever you need them.'
        )}
      </div>
    </div>
  );
};

CometChatSavedMessagesEmptyState.displayName = 'CometChatSavedMessages.EmptyState';
