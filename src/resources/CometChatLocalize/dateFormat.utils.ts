/**
 * Shared date formatting utility.
 *
 * Extracted from useCometChatDate so that both the CometChatLocalize.formatDate()
 * method and the useCometChatDate hook can share the same logic.
 */

import type { CometChatDateFormatConfig } from '../../components/base/CometChatDate/CometChatDate.types';

export interface FormatDateOptions {
  /** IANA timezone string (e.g., "America/New_York"). Applied via Intl.DateTimeFormat. */
  timezone?: string | undefined;
  /** BCP 47 locale string (e.g., "en-US", "de"). Applied via Intl.DateTimeFormat. */
  locale?: string | undefined;
}

const DEFAULT_FORMAT_CONFIG: CometChatDateFormatConfig = {
  today: 'Today',
  yesterday: 'Yesterday',
  lastWeek: 'dddd',
  otherDays: 'DD MMM, YYYY',
};

/**
 * Formats a Unix timestamp (seconds) using a CometChatDateFormatConfig.
 *
 * Determines the temporal bucket (today, yesterday, lastWeek, otherDays, relativeTime)
 * and applies the corresponding format pattern.
 */
export function formatDateWithConfig(
  timestamp: number,
  config: CometChatDateFormatConfig,
  options?: FormatDateOptions
): string {
  const mergedConfig = { ...DEFAULT_FORMAT_CONFIG, ...config };
  const date = new Date(timestamp * 1000);
  const now = new Date();

  const timezone = options?.timezone;
  const locale = options?.locale;

  // When timezone is provided, we need to compare dates in that timezone
  const dateInTz = timezone ? getDatePartsInTimezone(date, timezone) : getLocalDateParts(date);
  const nowInTz = timezone ? getDatePartsInTimezone(now, timezone) : getLocalDateParts(now);

  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);

  // Relative time handling
  if (mergedConfig.relativeTime && Object.keys(mergedConfig.relativeTime).length > 0) {
    if (diffInSeconds >= 0 && diffInSeconds < 60) {
      if (mergedConfig.relativeTime.minute) {
        return mergedConfig.relativeTime.minute.includes('%d')
          ? mergedConfig.relativeTime.minute.replace('%d', '1')
          : mergedConfig.relativeTime.minute;
      }
      if (mergedConfig.today) {
        return formatDateFromPattern(date, mergedConfig.today, { timezone, locale });
      }
    }
    if (diffInMinutes >= 1 && diffInMinutes < 60) {
      if (mergedConfig.relativeTime.minutes) {
        return mergedConfig.relativeTime.minutes.includes('%d')
          ? mergedConfig.relativeTime.minutes.replace('%d', String(diffInMinutes))
          : mergedConfig.relativeTime.minutes;
      }
      if (mergedConfig.today) {
        return formatDateFromPattern(date, mergedConfig.today, { timezone, locale });
      }
    }
    if (diffInHours >= 1 && diffInHours < 24) {
      if (diffInHours === 1 && mergedConfig.relativeTime.hour) {
        return mergedConfig.relativeTime.hour.replace('%d', '1');
      }
      if (mergedConfig.relativeTime.hours) {
        return mergedConfig.relativeTime.hours.replace('%d', String(diffInHours));
      }
    }
  }

  // Temporal bucket matching (using timezone-aware date parts)
  if (isSameDay(dateInTz, nowInTz) && mergedConfig.today) {
    return formatDateFromPattern(date, mergedConfig.today, { timezone, locale });
  }
  if (isYesterday(dateInTz, nowInTz) && mergedConfig.yesterday) {
    return formatDateFromPattern(date, mergedConfig.yesterday, { timezone, locale });
  }
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffInDays <= 7 && mergedConfig.lastWeek) {
    return formatDateFromPattern(date, mergedConfig.lastWeek, { timezone, locale });
  }
  return formatDateFromPattern(date, mergedConfig.otherDays ?? 'DD/MM/YYYY', { timezone, locale });
}

// --- Date part helpers for timezone-aware comparisons ---

interface DateParts {
  year: number;
  month: number;
  day: number;
}

/** Extract year/month/day from a Date in a specific IANA timezone. */
function getDatePartsInTimezone(date: Date, timezone: string): DateParts {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
    const parts = formatter.formatToParts(date);
    let year = 0,
      month = 0,
      day = 0;
    for (const part of parts) {
      if (part.type === 'year') year = parseInt(part.value, 10);
      if (part.type === 'month') month = parseInt(part.value, 10);
      if (part.type === 'day') day = parseInt(part.value, 10);
    }
    return { year, month, day };
  } catch {
    return getLocalDateParts(date);
  }
}

/** Extract year/month/day from a Date in local timezone. */
function getLocalDateParts(date: Date): DateParts {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}

/** Checks if two date-parts represent the same calendar day. */
export function isSameDay(a: DateParts, b: DateParts): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

/** Checks if `date` is the calendar day before `reference`. */
export function isYesterday(date: DateParts, reference: DateParts): boolean {
  // Create a Date from reference parts, subtract one day, compare
  const refDate = new Date(reference.year, reference.month - 1, reference.day);
  refDate.setDate(refDate.getDate() - 1);
  const yesterday: DateParts = {
    year: refDate.getFullYear(),
    month: refDate.getMonth() + 1,
    day: refDate.getDate(),
  };
  return isSameDay(date, yesterday);
}

// --- Pattern formatting ---

const SHORT_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const LONG_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const LONG_WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
const SHORT_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MIN_WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

interface DateTokens {
  DD: string;
  D: string;
  MM: string;
  M: string;
  MMM: string;
  MMMM: string;
  YYYY: string;
  YY: string;
  hh: string;
  h: string;
  mm: string;
  m: string;
  A: string;
  a: string;
  dddd: string;
  ddd: string;
  dd: string;
}

/**
 * Formats a Date using a pattern string with optional timezone and locale support.
 *
 * Supported tokens: DD, D, MMMM, MMM, MM, M, YYYY, YY, hh, h, mm, m, A (AM/PM),
 * a (am/pm), dddd, ddd, dd. Literal text (no matching token) passes through unchanged.
 */
export function formatDateFromPattern(
  date: Date,
  format: string,
  options?: FormatDateOptions
): string {
  const hasUpperA = /\bA\b/.test(format);
  const hasLowerA = /\ba\b/.test(format);
  const intlOptions: Intl.DateTimeFormatOptions = {
    day: format.includes('D') ? '2-digit' : undefined,
    month:
      format.includes('MMMM') ||
      format.includes('MMM') ||
      format.includes('MM') ||
      format.includes('M')
        ? '2-digit'
        : undefined,
    year: format.includes('YYYY') ? 'numeric' : format.includes('YY') ? '2-digit' : undefined,
    hour: format.includes('hh') ? '2-digit' : format.includes('h') ? 'numeric' : undefined,
    minute: format.includes('mm') ? '2-digit' : format.includes('m') ? 'numeric' : undefined,
    hour12: hasUpperA || hasLowerA,
    weekday: format.includes('dddd')
      ? 'long'
      : format.includes('ddd') || format.includes('dd')
        ? 'short'
        : undefined,
  };

  // Apply timezone if provided
  if (options?.timezone) {
    intlOptions.timeZone = options.timezone;
  }

  // If no Intl tokens are needed (e.g., format is just "Yesterday"), return as-is
  const hasTokens = Object.values(intlOptions).some(v => v !== undefined && v !== false);
  if (!hasTokens) {
    return format;
  }

  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const locale = options?.locale || 'en-US';

  try {
    const formatter = new Intl.DateTimeFormat(locale, intlOptions);
    const parts = formatter.formatToParts(date);

    // Determine day index in the target timezone
    const dayIndex = options?.timezone
      ? getDayOfWeekInTimezone(date, options.timezone)
      : date.getDay();

    const r: DateTokens = {
      DD: '',
      D: '',
      MM: '',
      M: '',
      MMM: '',
      MMMM: '',
      YYYY: '',
      YY: '',
      hh: '',
      h: '',
      mm: '',
      m: '',
      A: '',
      a: '',
      dddd: '',
      ddd: '',
      dd: '',
    };

    for (const part of parts) {
      switch (part.type) {
        case 'day':
          r.DD = part.value;
          r.D = parseInt(part.value, 10).toString();
          break;
        case 'month': {
          const monthIndex = parseInt(part.value, 10) - 1;
          r.MM = part.value;
          r.M = parseInt(part.value, 10).toString();
          // Use Intl for localized month names instead of hardcoded English
          r.MMM =
            getLocalizedMonthName(date, 'short', locale, options?.timezone) ??
            SHORT_MONTHS[monthIndex] ??
            part.value;
          r.MMMM =
            getLocalizedMonthName(date, 'long', locale, options?.timezone) ??
            LONG_MONTHS[monthIndex] ??
            part.value;
          break;
        }
        case 'year':
          r.YYYY = part.value;
          r.YY = part.value.slice(-2);
          break;
        case 'hour':
          r.hh = part.value;
          r.h = parseInt(part.value, 10).toString();
          break;
        case 'minute':
          r.mm = part.value;
          r.m = parseInt(part.value, 10).toString();
          break;
        case 'dayPeriod':
          r.A = part.value;
          r.a = part.value.toLowerCase();
          break;
        case 'weekday':
          // Use Intl-provided value directly for locale-aware weekday names
          r.dddd =
            getLocalizedWeekdayName(date, 'long', locale, options?.timezone) ??
            LONG_WEEKDAYS[dayIndex] ??
            part.value;
          r.ddd =
            getLocalizedWeekdayName(date, 'short', locale, options?.timezone) ??
            SHORT_WEEKDAYS[dayIndex] ??
            part.value;
          r.dd =
            getLocalizedWeekdayName(date, 'narrow', locale, options?.timezone) ??
            MIN_WEEKDAYS[dayIndex] ??
            part.value;
          break;
      }
    }

    return format
      .replace(/\[(.*?)\]/g, '$1')
      .replace(/\bDD\b/g, r.DD)
      .replace(/\bD\b/g, r.D)
      .replace(/\bMMMM\b/g, r.MMMM)
      .replace(/\bMMM\b/g, r.MMM)
      .replace(/\bMM\b/g, r.MM)
      .replace(/\bM\b/g, r.M)
      .replace(/\bYYYY\b/g, r.YYYY)
      .replace(/\bYY\b/g, r.YY)
      .replace(/\bhh\b/g, r.hh)
      .replace(/\bh\b/g, r.h)
      .replace(/\bmm\b/g, r.mm)
      .replace(/\bm\b/g, r.m)
      .replace(/\bdddd\b/g, r.dddd)
      .replace(/\bddd\b/g, r.ddd)
      .replace(/\bdd\b/g, r.dd)
      .replace(/\sA\s/g, ` ${r.A || 'A'} `)
      .replace(/^A\s/g, `${r.A || 'A'} `)
      .replace(/\sA$/, ` ${r.A || 'A'}`)
      .replace(/^A$/, r.A || 'A')
      .replace(/\sa\s/g, ` ${r.a || 'a'} `)
      .replace(/^a\s/g, `${r.a || 'a'} `)
      .replace(/\sa$/, ` ${r.a || 'a'}`)
      .replace(/^a$/, r.a || 'a');
  } catch {
    return date.toLocaleDateString();
  }
}

/** Get the day of week (0=Sunday) for a date in a specific timezone. */
function getDayOfWeekInTimezone(date: Date, timezone: string): number {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'short',
    });
    const weekday = formatter.format(date);
    const index = SHORT_WEEKDAYS.indexOf(weekday);
    return index >= 0 ? index : date.getDay();
  } catch {
    return date.getDay();
  }
}

/** Get localized weekday name using Intl.DateTimeFormat. */
function getLocalizedWeekdayName(
  date: Date,
  style: 'long' | 'short' | 'narrow',
  locale: string,
  timezone?: string
): string | undefined {
  try {
    const opts: Intl.DateTimeFormatOptions = { weekday: style };
    if (timezone) opts.timeZone = timezone;
    return new Intl.DateTimeFormat(locale, opts).format(date);
  } catch {
    return undefined;
  }
}

/** Get localized month name using Intl.DateTimeFormat. */
function getLocalizedMonthName(
  date: Date,
  style: 'long' | 'short',
  locale: string,
  timezone?: string
): string | undefined {
  try {
    const opts: Intl.DateTimeFormatOptions = { month: style };
    if (timezone) opts.timeZone = timezone;
    return new Intl.DateTimeFormat(locale, opts).format(date);
  } catch {
    return undefined;
  }
}

/**
 * Generates a human-readable full date/time string for screen readers.
 */
export function formatFullDateLabel(date: Date, options?: FormatDateOptions): string {
  try {
    const intlOptions: Intl.DateTimeFormatOptions = {
      dateStyle: 'long',
      timeStyle: 'short',
    };
    if (options?.timezone) {
      intlOptions.timeZone = options.timezone;
    }
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    return new Intl.DateTimeFormat(options?.locale || 'en-US', intlOptions).format(date);
  } catch {
    return date.toLocaleString();
  }
}
