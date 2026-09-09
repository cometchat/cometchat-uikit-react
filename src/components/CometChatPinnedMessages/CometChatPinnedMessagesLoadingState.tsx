import React from 'react';
import { useLocale } from '../../context/locale/LocaleContext';
import { localizeWithFallback } from '../../utils/localizeWithFallback';
import { CometChatMessageListShimmer } from '../CometChatMessageList/CometChatMessageListShimmer';
import { useCometChatPinnedMessagesContext } from './CometChatPinnedMessages.context';
import type { CometChatPinnedMessagesSlotProps } from './CometChatPinnedMessages.types';

/**
 * CometChatPinnedMessages.LoadingState — the transcript skeleton shown on the
 * initial load (this panel shows bubbles). Self-gates on fetch state.
 */
export const CometChatPinnedMessagesLoadingState: React.FC<CometChatPinnedMessagesSlotProps> = ({
  children,
}) => {
  const { getLocalizedString } = useLocale();
  const loc = (key: string, fallback: string): string =>
    localizeWithFallback(getLocalizedString, key, fallback);
  const { fetchState, messages } = useCometChatPinnedMessagesContext();

  if (fetchState !== 'loading' || messages.length > 0) return null;
  if (children !== undefined) return <>{children}</>;

  return (
    <CometChatMessageListShimmer
      className={'cometchat-pinned-messages__shimmer'}
      ariaLabel={loc('accessibility_loading_messages', 'Loading messages')}
    />
  );
};

CometChatPinnedMessagesLoadingState.displayName = 'CometChatPinnedMessages.LoadingState';
