import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CometChatMediaRecorder } from '../CometChatMediaRecorder';
import { CometChatMediaRecorderContext } from '../CometChatMediaRecorder.context';
import { formatTime } from '../CometChatMediaRecorderTimer';
import type { CometChatMediaRecorderContextValue } from '../CometChatMediaRecorder.types';

// ── Locale mock ────────────────────────────────────────────────────

vi.mock('../../../../context/locale/LocaleContext', () => ({
  useLocale: () => ({
    t: (key: string) => key,
    tDateTimeParser: (d: Date) => d.toISOString(),
    language: 'en-us',
  }),
}));

// ── Helpers ────────────────────────────────────────────────────────

function createMockContext(
  overrides: Partial<CometChatMediaRecorderContextValue> = {}
): CometChatMediaRecorderContextValue {
  return {
    state: 'recording',
    elapsedSeconds: 0,
    waveformHeights: new Array(30).fill(4),
    error: null,
    startRecording: vi.fn(),
    pauseRecording: vi.fn(),
    deleteRecording: vi.fn(),
    inlineSend: vi.fn(),
    ...overrides,
  };
}

function renderTimer(ctx: CometChatMediaRecorderContextValue, className?: string) {
  return render(
    <CometChatMediaRecorderContext.Provider value={ctx}>
      <CometChatMediaRecorder.Timer className={className} />
    </CometChatMediaRecorderContext.Provider>
  );
}

// ── formatTime unit tests ──────────────────────────────────────────

describe('formatTime', () => {
  it('formats 0 seconds as 0:00', () => {
    expect(formatTime(0)).toBe('0:00');
  });

  it('formats 5 seconds as 0:05', () => {
    expect(formatTime(5)).toBe('0:05');
  });

  it('formats 9 seconds as 0:09', () => {
    expect(formatTime(9)).toBe('0:09');
  });

  it('formats 10 seconds as 0:10', () => {
    expect(formatTime(10)).toBe('0:10');
  });

  it('formats 59 seconds as 0:59', () => {
    expect(formatTime(59)).toBe('0:59');
  });

  it('formats 60 seconds as 1:00', () => {
    expect(formatTime(60)).toBe('1:00');
  });

  it('formats 61 seconds as 1:01', () => {
    expect(formatTime(61)).toBe('1:01');
  });

  it('formats 125 seconds as 2:05', () => {
    expect(formatTime(125)).toBe('2:05');
  });

  it('formats 600 seconds as 10:00', () => {
    expect(formatTime(600)).toBe('10:00');
  });

  it('formats 3599 seconds as 59:59', () => {
    expect(formatTime(3599)).toBe('59:59');
  });

  it('formats 3600 seconds as 60:00', () => {
    expect(formatTime(3600)).toBe('60:00');
  });
});

// ── Timer component tests ──────────────────────────────────────────

describe('CometChatMediaRecorderTimer', () => {
  it('renders with role="timer"', () => {
    const ctx = createMockContext({ elapsedSeconds: 0 });
    renderTimer(ctx);
    expect(screen.getByRole('timer')).toBeInTheDocument();
  });

  it('displays 0:00 when elapsedSeconds is 0', () => {
    const ctx = createMockContext({ elapsedSeconds: 0 });
    renderTimer(ctx);
    expect(screen.getByRole('timer')).toHaveTextContent('0:00');
  });

  it('displays 1:05 when elapsedSeconds is 65', () => {
    const ctx = createMockContext({ elapsedSeconds: 65 });
    renderTimer(ctx);
    expect(screen.getByRole('timer')).toHaveTextContent('1:05');
  });

  it('displays 0:30 when elapsedSeconds is 30', () => {
    const ctx = createMockContext({ elapsedSeconds: 30 });
    renderTimer(ctx);
    expect(screen.getByRole('timer')).toHaveTextContent('0:30');
  });

  it('displays 10:00 when elapsedSeconds is 600', () => {
    const ctx = createMockContext({ elapsedSeconds: 600 });
    renderTimer(ctx);
    expect(screen.getByRole('timer')).toHaveTextContent('10:00');
  });

  it('has aria-live="off" to avoid constant announcements', () => {
    const ctx = createMockContext({ elapsedSeconds: 0 });
    renderTimer(ctx);
    expect(screen.getByRole('timer')).toHaveAttribute('aria-live', 'off');
  });

  it('has aria-label with human-readable duration', () => {
    const ctx = createMockContext({ elapsedSeconds: 65 });
    renderTimer(ctx);
    expect(screen.getByRole('timer')).toHaveAttribute('aria-label', '1 minutes 5 seconds');
  });

  it('has aria-label for 0 seconds', () => {
    const ctx = createMockContext({ elapsedSeconds: 0 });
    renderTimer(ctx);
    expect(screen.getByRole('timer')).toHaveAttribute('aria-label', '0 minutes 0 seconds');
  });

  it('applies custom className', () => {
    const ctx = createMockContext({ elapsedSeconds: 0 });
    renderTimer(ctx, 'my-timer-class');
    const timer = screen.getByRole('timer');
    expect(timer.className).toContain('my-timer-class');
  });

  it('renders as a span element', () => {
    const ctx = createMockContext({ elapsedSeconds: 0 });
    renderTimer(ctx);
    const timer = screen.getByRole('timer');
    expect(timer.tagName).toBe('SPAN');
  });
});
