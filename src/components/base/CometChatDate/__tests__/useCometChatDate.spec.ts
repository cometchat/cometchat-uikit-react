import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useCometChatDate } from '../useCometChatDate';

describe('useCometChatDate', () => {
  beforeEach(() => {
    // Fix "now" to 2026-04-16T12:00:00Z for deterministic tests
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-16T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /** Helper: get a Unix timestamp (seconds) for a given ISO string. */
  function ts(iso: string): number {
    return Math.floor(new Date(iso).getTime() / 1000);
  }

  it('formats a timestamp from today using "today" pattern', () => {
    const timestamp = ts('2026-04-16T10:30:00Z');
    const { result } = renderHook(() =>
      useCometChatDate({ timestamp, formatConfig: { today: 'hh:mm A' } })
    );
    expect(result.current.formattedDate).toMatch(/\d{1,2}:\d{2}\s?(am|pm)/i);
  });

  it('formats a timestamp from yesterday using "yesterday" pattern', () => {
    const timestamp = ts('2026-04-15T10:30:00Z');
    const { result } = renderHook(() =>
      useCometChatDate({ timestamp, formatConfig: { yesterday: 'Yesterday' } })
    );
    expect(result.current.formattedDate).toBe('Yesterday');
  });

  it('formats a timestamp from last week using "lastWeek" pattern', () => {
    const timestamp = ts('2026-04-12T10:30:00Z');
    const { result } = renderHook(() =>
      useCometChatDate({ timestamp, formatConfig: { lastWeek: 'dddd' } })
    );
    // April 12, 2026 is a Sunday
    expect(result.current.formattedDate).toBe('Sunday');
  });

  it('formats an older timestamp using "otherDays" pattern', () => {
    const timestamp = ts('2026-03-01T10:30:00Z');
    const { result } = renderHook(() =>
      useCometChatDate({ timestamp, formatConfig: { otherDays: 'DD/MM/YYYY' } })
    );
    expect(result.current.formattedDate).toBe('01/03/2026');
  });

  it('uses relative time formatting for minutes', () => {
    // 5 minutes ago
    const timestamp = Math.floor(Date.now() / 1000) - 5 * 60;
    const { result } = renderHook(() =>
      useCometChatDate({
        timestamp,
        formatConfig: {
          today: 'hh:mm A',
          relativeTime: { minutes: '%d mins ago' },
        },
      })
    );
    expect(result.current.formattedDate).toBe('5 mins ago');
  });

  it('uses relative time formatting for hours', () => {
    // 3 hours ago
    const timestamp = Math.floor(Date.now() / 1000) - 3 * 60 * 60;
    const { result } = renderHook(() =>
      useCometChatDate({
        timestamp,
        formatConfig: {
          today: 'hh:mm A',
          relativeTime: { hours: '%d hrs ago' },
        },
      })
    );
    expect(result.current.formattedDate).toBe('3 hrs ago');
  });

  it('uses singular hour format for exactly 1 hour ago', () => {
    const timestamp = Math.floor(Date.now() / 1000) - 60 * 60;
    const { result } = renderHook(() =>
      useCometChatDate({
        timestamp,
        formatConfig: {
          today: 'hh:mm A',
          relativeTime: { hour: '1 hr ago', hours: '%d hrs ago' },
        },
      })
    );
    expect(result.current.formattedDate).toBe('1 hr ago');
  });

  it('falls back to default config when no formatConfig provided', () => {
    const timestamp = ts('2026-04-16T10:30:00Z');
    const { result } = renderHook(() => useCometChatDate({ timestamp }));
    // Default today pattern is "Today"
    expect(result.current.formattedDate).toBe('Today');
  });

  it('uses custom formatter function when provided', () => {
    const timestamp = ts('2026-04-16T10:30:00Z');
    const formatter = (t: number) => 'Custom: ' + String(t);
    const { result } = renderHook(() => useCometChatDate({ timestamp, formatter }));
    expect(result.current.formattedDate).toBe('Custom: ' + String(timestamp));
  });

  it('returns correct ISO 8601 string', () => {
    const timestamp = ts('2026-04-16T10:30:00Z');
    const { result } = renderHook(() => useCometChatDate({ timestamp }));
    expect(result.current.isoDate).toBe('2026-04-16T10:30:00.000Z');
  });

  it('returns a non-empty fullDateLabel', () => {
    const timestamp = ts('2026-04-16T10:30:00Z');
    const { result } = renderHook(() => useCometChatDate({ timestamp }));
    expect(result.current.fullDateLabel.length).toBeGreaterThan(0);
  });

  it('handles edge case: timestamp of 0', () => {
    const { result } = renderHook(() => useCometChatDate({ timestamp: 0 }));
    expect(result.current.formattedDate).toBeTruthy();
    expect(result.current.isoDate).toBe('1970-01-01T00:00:00.000Z');
  });

  it('handles edge case: future timestamp', () => {
    const futureTs = Math.floor(Date.now() / 1000) + 60 * 60 * 24;
    const { result } = renderHook(() => useCometChatDate({ timestamp: futureTs }));
    expect(result.current.formattedDate).toBeTruthy();
  });

  it('memoizes result when inputs do not change', () => {
    const timestamp = ts('2026-04-16T10:30:00Z');
    const { result, rerender } = renderHook(() => useCometChatDate({ timestamp }));
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});
