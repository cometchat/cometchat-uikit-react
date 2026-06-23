import React from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatCallBubbleProps } from './CometChatCallBubble.types';
import {
  getCallSessionId,
  getCallType,
  getCallIconClass,
  getCallTitle,
  formatCallDate,
} from './CometChatCallBubble.utils';
import { getBubbleAlignment } from '../../utils/getBubbleAlignment';
import { useLocale } from '../../hooks/useLocale';
import { useLoggedInUser } from '../../hooks/useLoggedInUser';
import './CometChatCallBubble.css';

/**
 * CometChatCallBubble — renders a call bubble with icon, title, subtitle, and a Join button.
 * Used for group/conference call messages (direct call / meeting custom messages).
 *
 * Takes the SDK message and derives the call type, session ID, title, icon and timestamp
 * itself using the logged-in user (from useLoggedInUser) and localization (from useLocale),
 * so it can be rendered directly without a plugin.
 */
export const CometChatCallBubble: React.FC<CometChatCallBubbleProps> = ({
  message,
  alignment,
  onJoinClick,
  className,
}) => {
  const { getLocalizedString, dateLocaleLanguage } = useLocale();
  const loggedInUser = useLoggedInUser();

  const customMsg = message as CometChat.CustomMessage;
  const isSentByMe = (alignment ?? getBubbleAlignment(message, loggedInUser)) === 'right';

  const callType = getCallType(customMsg);
  const sessionId = getCallSessionId(customMsg);
  const title = getCallTitle(callType, getLocalizedString);
  const iconClassName = getCallIconClass(callType, isSentByMe);
  const subtitle = formatCallDate(message.getSentAt(), dateLocaleLanguage);
  const buttonText = getLocalizedString('meeting_join') || 'Join';

  const rootClasses = [
    'cometchat-call-bubble',
    isSentByMe ? 'cometchat-call-bubble-outgoing' : 'cometchat-call-bubble-incoming',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const showButton = buttonText.trim().length > 0;

  return (
    <div className={rootClasses}>
      <div className={'cometchat-call-bubble__body'}>
        <div className={'cometchat-call-bubble__icon-wrapper'}>
          <div
            className={['cometchat-call-bubble__icon-wrapper-icon', iconClassName]
              .filter(Boolean)
              .join(' ')}
            aria-hidden="true"
          />
        </div>
        <div className={'cometchat-call-bubble__body-content'}>
          <div className={'cometchat-call-bubble__body-content-title'}>{title}</div>
          {subtitle && (
            <div className={'cometchat-call-bubble__body-content-subtitle'}>{subtitle}</div>
          )}
        </div>
      </div>
      {showButton && (
        <button
          type="button"
          className={'cometchat-call-bubble__button'}
          onClick={() => onJoinClick?.(sessionId)}
        >
          {buttonText}
        </button>
      )}
    </div>
  );
};

CometChatCallBubble.displayName = 'CometChatCallBubble';
