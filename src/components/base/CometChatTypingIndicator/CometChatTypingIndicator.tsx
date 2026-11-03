import React, { forwardRef, useMemo } from 'react';
import { useLocale } from '../../../hooks/useLocale';
import type { CometChatTypingIndicatorProps } from './CometChatTypingIndicator.types';
import './CometChatTypingIndicator.css';
import { fillTemplate } from '../../../utils/fillTemplate';

/**
 * CometChatTypingIndicator — displays animated typing feedback when users
 * are composing messages. Supports 1-on-1 and group chat contexts.
 *
 * Display logic:
 * - 1-on-1 chat: "typing..."
 * - Group, 1 user: "{name} is typing..."
 * - Group, 2 users: "{name1} and {name2} are typing..."
 * - Group, 3+ users: "Multiple people are typing..."
 *
 * Usage:
 * ```tsx
 * <CometChatTypingIndicator typingNames={['Alice']} isGroupChat={false} />
 * ```
 */
export const CometChatTypingIndicator = forwardRef<HTMLDivElement, CometChatTypingIndicatorProps>(
  ({ typingNames, isGroupChat = false, className, ...rest }, ref) => {
    const { getLocalizedString } = useLocale();
    const ariaLabel = useMemo(() => {
      if (typingNames.length === 0) return '';

      if (!isGroupChat) {
        return getLocalizedString('typing_indicator_someone');
      }

      const firstName = typingNames[0] ?? '';

      if (typingNames.length === 1) {
        return fillTemplate(getLocalizedString('typing_indicator_one'), { name: firstName });
      }

      if (typingNames.length === 2) {
        const secondName = typingNames[1] ?? '';
        return fillTemplate(getLocalizedString('typing_indicator_two'), { first: firstName, second: secondName });
      }

      return getLocalizedString('typing_indicator_many');
    }, [typingNames, isGroupChat, getLocalizedString]);

    if (typingNames.length === 0) return null;

    const rootClass = ['cometchat-typing-indicator', className].filter(Boolean).join(' ');

    const renderText = () => {
      if (!isGroupChat) {
        return <span className={'cometchat-typing-indicator__text'}>typing</span>;
      }

      if (typingNames.length === 1) {
        return (
          <span className={'cometchat-typing-indicator__text'}>
            <span className={'cometchat-typing-indicator__name'}>{typingNames[0]}</span>
            {' is typing'}
          </span>
        );
      }

      if (typingNames.length === 2) {
        return (
          <span className={'cometchat-typing-indicator__text'}>
            <span className={'cometchat-typing-indicator__name'}>{typingNames[0]}</span>
            {' and '}
            <span className={'cometchat-typing-indicator__name'}>{typingNames[1]}</span>
            {' are typing'}
          </span>
        );
      }

      return <span className={'cometchat-typing-indicator__text'}>Multiple people are typing</span>;
    };

    return (
      <div
        ref={ref}
        className={rootClass}
        role="status"
        aria-live="polite"
        aria-label={ariaLabel}
        {...rest}
      >
        <div className={'cometchat-typing-indicator__content'}>
          {renderText()}
          <span className={'cometchat-typing-indicator__dots'} aria-hidden="true">
            <span className={'cometchat-typing-indicator__dot'} />
            <span className={'cometchat-typing-indicator__dot'} />
            <span className={'cometchat-typing-indicator__dot'} />
          </span>
        </div>
      </div>
    );
  }
);

CometChatTypingIndicator.displayName = 'CometChatTypingIndicator';
