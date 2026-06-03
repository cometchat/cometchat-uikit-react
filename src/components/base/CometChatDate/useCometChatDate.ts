import { useMemo } from 'react';
import type { CometChatDateFormatConfig } from './CometChatDate.types';
import {
  formatDateWithConfig,
  formatFullDateLabel,
} from '../../../resources/CometChatLocalize/dateFormat.utils';

const DEFAULT_FORMAT_CONFIG: CometChatDateFormatConfig = {
  today: 'Today',
  yesterday: 'Yesterday',
  lastWeek: 'dddd',
  otherDays: 'DD MMM, YYYY',
};

export interface UseCometChatDateOptions {
  timestamp: number;
  formatConfig?: CometChatDateFormatConfig;
  formatter?: (timestamp: number) => string;
  /** Optional IANA timezone string (e.g., "America/New_York"). */
  timezone?: string;
  /** Optional BCP 47 locale string (e.g., "hi", "de"). Used for Intl date formatting. */
  locale?: string;
}

export interface UseCometChatDateResult {
  formattedDate: string;
  isoDate: string;
  fullDateLabel: string;
}

/**
 * Formats a Unix timestamp based on a CometChatDateFormatConfig or custom formatter.
 *
 * - Determines temporal bucket (today, yesterday, lastWeek, otherDays)
 * - Applies the corresponding format pattern
 * - If a custom `formatter` function is provided, uses that instead
 * - Returns the formatted string, an ISO 8601 date string, and a full human-readable label
 * - SSR-safe: no browser-only APIs at module scope
 * - Memoized: recalculates only when timestamp or config changes
 */
export function useCometChatDate(options: UseCometChatDateOptions): UseCometChatDateResult {
  const { timestamp, formatConfig, formatter, timezone, locale } = options;

  return useMemo(() => {
    const date = new Date(timestamp * 1000);
    const isoDate = date.toISOString();
    const fullDateLabel = formatFullDateLabel(date, { timezone, locale });

    if (formatter) {
      return { formattedDate: formatter(timestamp), isoDate, fullDateLabel };
    }

    const config = { ...DEFAULT_FORMAT_CONFIG, ...formatConfig };
    const formattedDate = formatDateWithConfig(timestamp, config, { timezone, locale });

    return { formattedDate, isoDate, fullDateLabel };
  }, [timestamp, formatConfig, formatter, timezone, locale]);
}
