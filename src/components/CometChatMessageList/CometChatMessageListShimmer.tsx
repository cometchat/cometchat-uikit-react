import React from 'react';
import './CometChatMessageList.css';

export interface CometChatMessageListShimmerProps {
  /** Announced while loading. */
  ariaLabel?: string;
  className?: string;
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
 * The message-list skeleton, with no context attached.
 *
 * Split out from CometChatMessageListLoadingState so surfaces that show a
 * transcript without being a CometChatMessageList — the Pinned panel — get the
 * same loading appearance instead of a second, drifting copy.
 */
export const CometChatMessageListShimmer: React.FC<CometChatMessageListShimmerProps> = ({
  ariaLabel,
  className,
}) => (
  <div
    className={['cometchat-message-list__shimmer', className].filter(Boolean).join(' ')}
    role="status"
    aria-busy="true"
    {...(ariaLabel !== undefined && { 'aria-label': ariaLabel })}
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

CometChatMessageListShimmer.displayName = 'CometChatMessageListShimmer';
