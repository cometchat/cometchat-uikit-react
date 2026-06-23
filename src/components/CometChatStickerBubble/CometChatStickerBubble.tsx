/**
 * CometChatStickerBubble
 *
 * Self-extracting bubble component for sticker messages. Takes the SDK message and
 * extracts the sticker image URL and name from its metadata itself, so it can be used
 * directly (no plugin). Alignment falls back to sender-vs-logged-in-user.
 *
 * NOT reusing CometChatImageBubble — stickers have different semantics
 * (no caption, no multi-image grid, no fullscreen viewer, different URL extraction).
 */

import React from 'react';
import type { CometChatStickerBubbleProps } from './CometChatStickerBubble.types';
import { extractStickerUrl, extractStickerName } from './CometChatStickerBubble.utils';
import { getBubbleAlignment } from '../../utils/getBubbleAlignment';
import { useLoggedInUser } from '../../hooks/useLoggedInUser';
import './CometChatStickerBubble.css';

export const CometChatStickerBubble: React.FC<CometChatStickerBubbleProps> = ({
  message,
  alignment,
  className,
}) => {
  const loggedInUser = useLoggedInUser();

  const stickerUrl = extractStickerUrl(message);
  const stickerName = extractStickerName(message);
  const variant =
    (alignment ?? getBubbleAlignment(message, loggedInUser)) === 'right' ? 'outgoing' : 'incoming';

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
