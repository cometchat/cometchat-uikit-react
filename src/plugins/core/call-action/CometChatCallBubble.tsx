import React from 'react';
import './CometChatCallBubble.css';

export interface CometChatCallBubbleProps {
  /** Title text (e.g., "Video Call" or "Audio Call"). */
  title: string;
  /** Subtitle (e.g., date/time). */
  subtitle?: string;
  /** Button text (e.g., "Join"). Empty/undefined hides the button. */
  buttonText?: string;
  /**
   * CSS class name for the icon. The icon is rendered via CSS mask.
   * Built-in classes:
   * - cometchat-call-bubble__icon--incoming-video
   * - cometchat-call-bubble__icon--outgoing-video
   * - cometchat-call-bubble__icon--incoming-audio
   * - cometchat-call-bubble__icon--outgoing-audio
   */
  iconClassName?: string;
  /** Session ID passed to onClicked. */
  sessionId?: string;
  /** Whether the message was sent by the logged-in user. */
  isSentByMe?: boolean;
  /** Callback when the Join button is clicked. */
  onClicked?: (sessionId: string) => void;
}

/**
 * CometChatCallBubble — renders a call bubble with icon, title, subtitle, and optional Join button.
 * Used for group/conference call messages (meeting type).
 */
export const CometChatCallBubble: React.FC<CometChatCallBubbleProps> = ({
  title,
  subtitle,
  buttonText,
  iconClassName,
  sessionId = '',
  isSentByMe = true,
  onClicked,
}) => {
  const rootClasses = [
    'cometchat-call-bubble',
    isSentByMe ? 'cometchat-call-bubble-outgoing' : 'cometchat-call-bubble-incoming',
  ]
    .filter(Boolean)
    .join(' ');

  const showButton = buttonText != null && buttonText.trim().length > 0;

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
          onClick={() => onClicked?.(sessionId)}
        >
          {buttonText}
        </button>
      )}
    </div>
  );
};

CometChatCallBubble.displayName = 'CometChatCallBubble';
