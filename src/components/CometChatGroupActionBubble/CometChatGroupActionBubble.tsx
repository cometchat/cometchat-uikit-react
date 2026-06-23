import React from 'react';
import type { CometChatGroupActionBubbleProps } from './CometChatGroupActionBubble.types';
import { CometChatActionBubble } from '../base/CometChatActionBubble/CometChatActionBubble';
import { getActionMessageText } from '../../plugins/core/shared/CometChatActionMessageUtils';
import { useLocale } from '../../hooks/useLocale';

/**
 * CometChatGroupActionBubble — renders a group action system message
 * ("Alice joined", "Bob was added", scope changes, etc.).
 *
 * Takes the SDK action message and derives the localized text itself
 * (via getActionMessageText), so it can be used directly without a plugin.
 */
export const CometChatGroupActionBubble: React.FC<CometChatGroupActionBubbleProps> = ({
  message,
  className,
}) => {
  const { getLocalizedString } = useLocale();
  const messageText = getActionMessageText(message, getLocalizedString);

  return <CometChatActionBubble messageText={messageText} className={className} />;
};

CometChatGroupActionBubble.displayName = 'CometChatGroupActionBubble';
