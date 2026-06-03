import React from 'react';
import type { ReactNode } from 'react';
import { useCometChatMessageListContext } from './CometChatMessageList.context';
import './CometChatMessageList.css';
import { useLocale } from '../../context/locale/LocaleContext';

export interface CometChatMessageListLoadingStateProps {
  children?: ReactNode;
}

function ShimmerBubble({ align }: { align: 'start' | 'end' }) {
  return (
    <div className={'cometchat-message-list__shimmer-body'} style={{ alignSelf: `flex-${align}` }}>
      {align === 'start' && <div className={'cometchat-message-list__shimmer-item-header'} />}
      <div className={'cometchat-message-list__shimmer-item'} />
    </div>
  );
}

function ShimmerDate() {
  return (
    <div className={'cometchat-message-list__shimmer-header'}>
      <div className={'cometchat-message-list__shimmer-item'} />
    </div>
  );
}

/**
 * CometChatMessageListLoadingState — shimmer skeleton matching real message layout.
 *
 * Context-aware: reads `isLoading` from the MessageList context and renders
 * nothing when the list is not in the loading state.
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
    <div
      className={'cometchat-message-list__shimmer'}
      role="status"
      aria-label={getLocalizedString('accessibility_loading_messages')}
    >
      <ShimmerDate />
      <ShimmerBubble align="end" />
      <ShimmerBubble align="start" />
      <ShimmerBubble align="end" />
      <ShimmerBubble align="start" />
      <ShimmerDate />
      <ShimmerBubble align="end" />
      <ShimmerBubble align="start" />
      <ShimmerBubble align="end" />
      <ShimmerBubble align="start" />
      <ShimmerBubble align="end" />
    </div>
  );
};

CometChatMessageListLoadingState.displayName = 'CometChatMessageListLoadingState';
