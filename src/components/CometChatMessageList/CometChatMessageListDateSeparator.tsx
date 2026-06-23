import React from 'react';
import { CometChatDate } from '../base/CometChatDate';
import type { CometChatDateFormatConfig } from '../base/CometChatDate/CometChatDate.types';
import './CometChatMessageList.css';
import { useLocale } from '../../context/locale/LocaleContext';

export interface CometChatMessageListDateSeparatorProps {
  /** Unix timestamp (seconds) for the date to display. */
  timestamp: number;
  /**
   * Custom date format config. When omitted, uses a sensible default:
   * "Today", "Yesterday", weekday name for last 7 days, "DD MMM, YYYY" otherwise.
   */
  formatConfig?: CometChatDateFormatConfig;
  /** Optional custom className. */
  className?: string;
}

/**
 * CometChatMessageListDateSeparator — date divider between messages from different days.
 *
 */
export const CometChatMessageListDateSeparator: React.FC<
  CometChatMessageListDateSeparatorProps
> = ({ timestamp, formatConfig, className }) => {
  const { getLocalizedString } = useLocale();
  const classes = ['cometchat-message-list__date-separator', className].filter(Boolean).join(' ');

  const resolvedFormatConfig: CometChatDateFormatConfig = formatConfig ?? {
    today: getLocalizedString('date_today'),
    yesterday: getLocalizedString('date_yesterday'),
    lastWeek: 'dddd',
    otherDays: 'DD MMM, YYYY',
  };

  return (
    <div
      className={classes}
      role="separator"
      aria-label={getLocalizedString('accessibility_date_separator')}
    >
      <CometChatDate
        timestamp={timestamp}
        variant="separator"
        formatConfig={resolvedFormatConfig}
      />
    </div>
  );
};

CometChatMessageListDateSeparator.displayName = 'CometChatMessageListDateSeparator';
