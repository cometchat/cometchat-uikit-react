import React from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatCallActionBubbleProps } from './CometChatCallActionBubble.types';
import { CometChatActionBubble } from '../base/CometChatActionBubble/CometChatActionBubble';
import {
  getCallStatusText,
  getCallIconClass,
  isMissedCall,
} from './CometChatCallActionBubble.utils';
import { useLocale } from '../../hooks/useLocale';
import { useLoggedInUser } from '../../hooks/useLoggedInUser';

/**
 * CometChatCallActionBubble — renders a call status system message
 * ("Missed Call", "Call Ended", "Outgoing Call", etc.).
 *
 * Takes the SDK call message and derives the status text/icon itself using the
 * logged-in user (from useLoggedInUser) and localization (from useLocale), so it
 * can be used directly without a plugin.
 */
export const CometChatCallActionBubble: React.FC<CometChatCallActionBubbleProps> = ({
  message,
  className,
}) => {
  const { getLocalizedString } = useLocale();
  const loggedInUser = useLoggedInUser();

  if (!loggedInUser) return null;

  const call = message as CometChat.Call;
  const messageText = getCallStatusText(call, loggedInUser, getLocalizedString);
  const iconClassName = getCallIconClass(call, loggedInUser);
  const missed = isMissedCall(call, loggedInUser);

  return (
    <CometChatActionBubble
      messageText={messageText}
      iconClassName={iconClassName}
      iconErrorColor={missed}
      className={className}
    />
  );
};

CometChatCallActionBubble.displayName = 'CometChatCallActionBubble';
