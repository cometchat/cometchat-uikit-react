import React, { useCallback, useRef, useState } from 'react';
import type { CometChatThreadHeaderSubscriptionToggleProps } from './CometChatThreadHeader.types';
import { useCometChatThreadHeaderContext } from './CometChatThreadHeader.context';
import { useThreadSubscription } from '../../hooks/useThreadSubscription';
import { isThreadSubscriptionSupported } from '../../utils/CometChatThreadSubscription';
import { useLocale } from '../../hooks/useLocale';
import { CometChatToast } from '../base/CometChatToast';
import { CometChatTooltip } from '../base/CometChatTooltip';
import './CometChatThreadHeader.css';

/**
 * CometChatThreadHeaderSubscriptionToggle — follow / unfollow this thread.
 *
 * State-labelled, unlike the message option: the bell shows whether you are
 * following (bell) or not (crossed bell), because a header control is read as
 * an indicator. The hover tooltip is action-labelled, and the accessible name
 * is the same string as the tooltip, so the visible label and the accessible
 * name cannot diverge (WCAG 2.5.3).
 *
 * Available in both 1:1 and group threads; the bell hides only when the SDK
 * lacks thread-subscription support or `hideThreadSubscriptionToggle` is set.
 */
export const CometChatThreadHeaderSubscriptionToggle: React.FC<
  CometChatThreadHeaderSubscriptionToggleProps
> = ({ className }) => {
  const { parentMessage, hideThreadSubscriptionToggle, onThreadSubscriptionChange } =
    useCometChatThreadHeaderContext();
  const { getLocalizedString } = useLocale();

  const { isSubscribed, toggle, toastText, toastVariant, clearToast } = useThreadSubscription(
    parentMessage,
    onThreadSubscriptionChange
  );

  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggle();
      }
    },
    [toggle]
  );

  const showTooltip = useCallback(() => {
    setIsTooltipVisible(true);
  }, []);
  const hideTooltip = useCallback(() => {
    setIsTooltipVisible(false);
  }, []);

  if (hideThreadSubscriptionToggle || !isThreadSubscriptionSupported()) {
    return null;
  }

  // Action-labelled, and deliberately the same strings the message option
  // uses — one vocabulary for one action, so the two surfaces cannot drift.
  const label = isSubscribed
    ? getLocalizedString('thread_subscription_unsubscribe')
    : getLocalizedString('thread_subscription_subscribe');

  const wrapperClasses = ['cometchat-thread-header__subscription-wrapper', className]
    .filter(Boolean)
    .join(' ');

  const iconClasses = [
    'cometchat-thread-header__subscription-icon',
    isSubscribed
      ? 'cometchat-thread-header__subscription-icon--on'
      : 'cometchat-thread-header__subscription-icon--off',
  ].join(' ');

  return (
    <div className={wrapperClasses}>
      <button
        ref={buttonRef}
        type="button"
        className={'cometchat-thread-header__subscription-button'}
        aria-label={label}
        tabIndex={0}
        onClick={toggle}
        onKeyDown={handleKeyDown}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
      >
        <span className={iconClasses} aria-hidden="true" />
      </button>
      {isTooltipVisible && (
        // Below the anchor: the bell sits at the very top of the panel, where a
        // tooltip above it would be clipped.
        <CometChatTooltip anchorEl={buttonRef.current} placement="bottom">
          {label}
        </CometChatTooltip>
      )}
      {toastText && <CometChatToast text={toastText} variant={toastVariant} onClose={clearToast} />}
    </div>
  );
};

CometChatThreadHeaderSubscriptionToggle.displayName = 'CometChatThreadHeaderSubscriptionToggle';
