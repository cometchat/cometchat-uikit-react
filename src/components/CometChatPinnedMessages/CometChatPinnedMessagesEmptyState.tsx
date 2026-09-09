import React from 'react';
import { useLocale } from '../../context/locale/LocaleContext';
import { localizeWithFallback } from '../../utils/localizeWithFallback';
import { useCometChatPinnedMessagesContext } from './CometChatPinnedMessages.context';
import type { CometChatPinnedMessagesSlotProps } from './CometChatPinnedMessages.types';

/**
 * CometChatPinnedMessages.EmptyState — shown when there are no pinned messages.
 * Self-gates on fetch state.
 */
export const CometChatPinnedMessagesEmptyState: React.FC<CometChatPinnedMessagesSlotProps> = ({
  children,
}) => {
  const { getLocalizedString } = useLocale();
  const loc = (key: string, fallback: string): string =>
    localizeWithFallback(getLocalizedString, key, fallback);
  const { fetchState, messages } = useCometChatPinnedMessagesContext();

  if (messages.length > 0 || fetchState === 'loading' || fetchState === 'error') return null;
  if (children !== undefined) return <>{children}</>;

  return (
    <div className={'cometchat-pinned-messages__empty'} role="status">
      <div className={'cometchat-pinned-messages__empty-icon'} aria-hidden="true" />
      <div className={'cometchat-pinned-messages__empty-title'}>
        {loc('pinned_messages_empty', 'No pinned messages yet')}
      </div>
      <div className={'cometchat-pinned-messages__empty-subtitle'}>
        {loc('pinned_messages_empty_subtitle', 'Pin important messages to keep them easy to find.')}
      </div>
    </div>
  );
};

CometChatPinnedMessagesEmptyState.displayName = 'CometChatPinnedMessages.EmptyState';
