import type { ReactNode } from 'react';

/**
 * Configuration for date formatting based on temporal proximity.
 * Plain interface replacing the CalendarObject class.
 */
export interface CometChatDateFormatConfig {
  /** Format pattern for same-day dates (e.g., "hh:mm A"). */
  today?: string;
  /** Format pattern for previous-day dates (e.g., "Yesterday"). */
  yesterday?: string;
  /** Format pattern for dates within the last 7 days (e.g., "dddd"). */
  lastWeek?: string;
  /** Format pattern for dates older than 7 days (e.g., "DD/MM/YYYY"). */
  otherDays?: string;
  /** Relative time formatting for recent timestamps. */
  relativeTime?: {
    /** Formatting for minutes (singular). Use %d as placeholder for the count. */
    minute?: string;
    /** Formatting for minutes (plural). Use %d as placeholder for the count. */
    minutes?: string;
    /** Formatting for hours (singular). Use %d as placeholder for the count. */
    hour?: string;
    /** Formatting for hours (plural). Use %d as placeholder for the count. */
    hours?: string;
  };
}

/** Style variant for the date text. */
export type CometChatDateVariant = 'caption' | 'caption2' | 'body' | 'label' | 'separator';

/** Props for CometChatDateRoot. */
export interface CometChatDateRootProps {
  /** Unix timestamp (seconds) of the date to display. */
  timestamp: number;
  /**
   * Format configuration based on temporal proximity.
   * Defaults to: today="hh:mm A", yesterday="Yesterday", lastWeek="dddd", otherDays="DD/MM/YYYY".
   */
  formatConfig?: CometChatDateFormatConfig;
  /**
   * Custom formatter function. When provided, overrides formatConfig.
   * Receives the timestamp and returns the display string.
   */
  formatter?: (timestamp: number) => string;
  /** Visual style variant. Defaults to 'caption'. */
  variant?: CometChatDateVariant;
  /** Optional custom className. */
  className?: string;
  children?: ReactNode;
}

/** Props for CometChatDateText. */
export interface CometChatDateTextProps {
  /** Optional custom className. */
  className?: string;
}

/** Context value exposed by CometChatDateRoot. */
export interface CometChatDateContextValue {
  /** The original Unix timestamp. */
  timestamp: number;
  /** The formatted date string for display. */
  formattedDate: string;
  /** ISO 8601 string for the <time> datetime attribute. */
  isoDate: string;
  /** Human-readable full date/time string for aria-label. */
  fullDateLabel: string;
  /** The visual style variant. */
  variant: CometChatDateVariant;
}
