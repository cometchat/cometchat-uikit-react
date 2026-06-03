import React from 'react';
import type { CometChatMessageHeaderSubtitleProps } from './CometChatMessageHeader.types';
import { useCometChatMessageHeaderContext } from './CometChatMessageHeader.context';
import { useLocale } from '../../context/locale/LocaleContext';
import './CometChatMessageHeader.css';

/**
 * CometChatMessageHeaderSubtitle — displays status, typing indicator, or member count.
 *
 * User conversations:
 * - Typing: animated dots + "typing"
 * - Online: "Online"
 * - Offline: "Last seen" + timestamp (via CometChatDate)
 *
 * Group conversations:
 * - Typing: "{name} is typing", "{name1} and {name2} are typing", "{name} and N others are typing"
 * - Not typing: "{count} Members" / "{count} Member"
 */
export const CometChatMessageHeaderSubtitle: React.FC<CometChatMessageHeaderSubtitleProps> = ({
  className,
}) => {
  const {
    isUserConversation,
    isGroupConversation,
    isTyping,
    typingText,
    userStatus,
    hideUserStatus,
    lastActiveAt,
    groupMemberCount,
  } = useCometChatMessageHeaderContext();
  const { getLocalizedString } = useLocale();

  const rootClasses = ['cometchat-message-header__subtitle-wrapper', className]
    .filter(Boolean)
    .join(' ');

  // --- Typing indicator (both user and group) ---
  if (isTyping) {
    return (
      <div className={rootClasses} aria-live="polite" aria-atomic="true">
        <span
          className={[
            'cometchat-message-header__subtitle',
            'cometchat-message-header__subtitle--typing',
          ].join(' ')}
          role="status"
        >
          <span className={'cometchat-message-header__typing-dots'} aria-hidden="true">
            <span className={'cometchat-message-header__typing-dot'} />
            <span className={'cometchat-message-header__typing-dot'} />
            <span className={'cometchat-message-header__typing-dot'} />
          </span>
          <span className={'cometchat-message-header__typing-text'}>{typingText}</span>
        </span>
      </div>
    );
  }

  // --- User conversation subtitle ---
  if (isUserConversation && !hideUserStatus) {
    if (userStatus === 'online') {
      return (
        <div className={rootClasses}>
          <span
            className={[
              'cometchat-message-header__subtitle',
              'cometchat-message-header__subtitle--online',
            ].join(' ')}
          >
            {getLocalizedString('message_header_online')}
          </span>
        </div>
      );
    }

    // Offline with last active
    if (lastActiveAt) {
      const formattedDate = formatLastActive(lastActiveAt, getLocalizedString);
      return (
        <div className={rootClasses}>
          <span
            className={[
              'cometchat-message-header__subtitle',
              'cometchat-message-header__subtitle--last-active',
            ].join(' ')}
          >
            <span className={'cometchat-message-header__last-seen-label'}>
              {getLocalizedString('message_header_last_seen')}
            </span>{' '}
            <span>{formattedDate}</span>
          </span>
        </div>
      );
    }

    // Offline without last active — show nothing
    return <div className={rootClasses} />;
  }

  // --- Group conversation subtitle ---
  if (isGroupConversation) {
    const memberText =
      groupMemberCount === 1
        ? getLocalizedString('message_header_member')
        : getLocalizedString('message_header_members');
    return (
      <div className={rootClasses}>
        <span
          className={[
            'cometchat-message-header__subtitle',
            'cometchat-message-header__subtitle--members',
          ].join(' ')}
        >
          {groupMemberCount} {memberText}
        </span>
      </div>
    );
  }

  // --- No user or group ---
  return <div className={rootClasses} />;
};

CometChatMessageHeaderSubtitle.displayName = 'CometChatMessageHeaderSubtitle';

/**
 * Format a last active timestamp into a human-readable string.
 * Uses relative time for recent activity, absolute date for older.
 */
function formatLastActive(timestamp: number, getLocalizedString: (key: string) => string): string {
  // Handle both seconds and milliseconds timestamps
  const ms = timestamp < 1e12 ? timestamp * 1000 : timestamp;
  const now = Date.now();
  const diffMs = now - ms;
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes === 1) return `1 ${getLocalizedString('message_header_minute_ago')}`;
  if (diffMinutes < 60)
    return `${diffMinutes.toString()} ${getLocalizedString('message_header_minutes_ago')}`;
  if (diffHours === 1) return `1 ${getLocalizedString('message_header_hour_ago')}`;
  if (diffHours < 24)
    return `${diffHours.toString()} ${getLocalizedString('message_header_hours_ago')}`;

  // Older than 24 hours — show date
  const date = new Date(ms);
  const day = date.getDate();
  const monthKeys = [
    'month_january_short',
    'month_february_short',
    'month_march_short',
    'month_april_short',
    'month_may_short',
    'month_june_short',
    'month_july_short',
    'month_august_short',
    'month_september_short',
    'month_october_short',
    'month_november_short',
    'month_december_short',
  ];
  const month = getLocalizedString(monthKeys[date.getMonth()] ?? 'month_january_short');
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;

  return `${day.toString()} ${month} ${getLocalizedString('message_header_at')} ${displayHours.toString()}:${minutes} ${ampm}`;
}
