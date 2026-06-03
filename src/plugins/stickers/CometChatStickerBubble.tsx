/**
 * CometChatStickerBubble
 *
 * Dedicated bubble component for sticker messages.
 * Renders a sticker image with incoming/outgoing alignment variants.
 *
 * NOT reusing CometChatImageBubble — stickers have different semantics
 * (no caption, no multi-image grid, no fullscreen viewer, different URL extraction).
 */

import React from 'react';
import type { CometChatStickerBubbleProps } from './CometChatStickerBubble.types';
import './CometChatStickerBubble.css';

export const CometChatStickerBubble: React.FC<CometChatStickerBubbleProps> = ({
  stickerUrl,
  stickerName = 'Sticker',
  variant,
  className,
}) => {
  const rootClasses = [
    'cometchat-sticker-bubble',
    `cometchat-sticker-bubble--${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClasses} role="img" aria-label={stickerName}>
      {stickerUrl && (
        <img
          className={'cometchat-sticker-bubble__image'}
          src={stickerUrl}
          alt={stickerName}
          loading="lazy"
          decoding="async"
        />
      )}
    </div>
  );
};

CometChatStickerBubble.displayName = 'CometChatStickerBubble';

export default CometChatStickerBubble;
