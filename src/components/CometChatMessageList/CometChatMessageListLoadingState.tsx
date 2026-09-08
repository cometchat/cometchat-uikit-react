import React from 'react';
import type { ReactNode } from 'react';
import { useCometChatMessageListContext } from './CometChatMessageList.context';
import { CometChatMessageListShimmer } from './CometChatMessageListShimmer';
import './CometChatMessageList.css';
import { useLocale } from '../../context/locale/LocaleContext';

export interface CometChatMessageListLoadingStateProps {
  children?: ReactNode;
}

/**
 * CometChatMessageListLoadingState — shimmer skeleton matching real message layout.
 *
 * Context-aware: reads `isLoading` from the MessageList context and renders
 * nothing when the list is not in the loading state. The skeleton itself lives in
 * {@link CometChatMessageListShimmer}, so surfaces without this context can use it.
 */
export const CometChatMessageListLoadingState: React.FC<CometChatMessageListLoadingStateProps> = ({
  children,
}) => {
  const { getLocalizedString } = useLocale();
  const { isLoading } = useCometChatMessageListContext();

  if (!isLoading) return null;

  if (children) {
    return <div className={'cometchat-message-list__shimmer'}>{children}</div>;
  }

  return (
    <CometChatMessageListShimmer ariaLabel={getLocalizedString('accessibility_loading_messages')} />
  );
};

CometChatMessageListLoadingState.displayName = 'CometChatMessageListLoadingState';
