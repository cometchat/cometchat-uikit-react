import React from 'react';
import './CometChatConversations.css';

export interface CometChatConversationsShimmerProps {
  /** Number of skeleton rows. */
  count?: number;
  /** Announced while loading. */
  ariaLabel?: string;
  className?: string;
}

const SHIMMER_COUNT = 12;

/**
 * The conversation-row skeleton, with no context attached.
 *
 * Split out from CometChatConversationsLoadingState so surfaces that render
 * conversation-style rows without being a CometChatConversations — the Saved
 * panel — get the same loading appearance instead of a second, drifting copy.
 */
export const CometChatConversationsShimmer: React.FC<CometChatConversationsShimmerProps> = ({
  count = SHIMMER_COUNT,
  ariaLabel,
  className,
}) => (
  <div
    className={['cometchat-conversations__loading-state', className].filter(Boolean).join(' ')}
    role="status"
    aria-busy="true"
    {...(ariaLabel !== undefined && { 'aria-label': ariaLabel })}
  >
    {Array.from({ length: count }, (_, index) => (
      <div key={index} className={'cometchat-conversations__shimmer-item'}>
        <div className={'cometchat-conversations__shimmer-item-avatar'} />
        <div className={'cometchat-conversations__shimmer-item-body'}>
          <div className={'cometchat-conversations__shimmer-item-title'} />
          <div className={'cometchat-conversations__shimmer-item-subtitle'} />
        </div>
      </div>
    ))}
  </div>
);

CometChatConversationsShimmer.displayName = 'CometChatConversationsShimmer';
