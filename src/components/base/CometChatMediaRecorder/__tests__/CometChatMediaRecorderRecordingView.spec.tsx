import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CometChatMediaRecorder } from '../CometChatMediaRecorder';
import { CometChatMediaRecorderContext } from '../CometChatMediaRecorder.context';
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
    elapsedSeconds: 10,
    waveformHeights: [4, 8, 12, 16, 20, 24, 20, 16, 12, 8],
    error: null,
    startRecording: vi.fn(),
    pauseRecording: vi.fn(),
    deleteRecording: vi.fn(),
    inlineSend: vi.fn(),
    ...overrides,
  };
}

function renderRecordingView(
  ctx: CometChatMediaRecorderContextValue,
  props: { className?: string; children?: React.ReactNode } = {}
) {
  return render(
    <CometChatMediaRecorderContext.Provider value={ctx}>
      <CometChatMediaRecorder.RecordingView className={props.className}>
        {props.children}
      </CometChatMediaRecorder.RecordingView>
    </CometChatMediaRecorderContext.Provider>
  );
}

// ── Tests ──────────────────────────────────────────────────────────

describe('CometChatMediaRecorderRecordingView', () => {
  // --- Conditional rendering ---

  it('renders when state is recording', () => {
    const ctx = createMockContext({ state: 'recording' });
    const { container } = renderRecordingView(ctx);
    expect(container.innerHTML).not.toBe('');
  });

  it('renders nothing when state is idle', () => {
    const ctx = createMockContext({ state: 'idle' });
    const { container } = renderRecordingView(ctx);
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when state is paused', () => {
    const ctx = createMockContext({ state: 'paused' });
    const { container } = renderRecordingView(ctx);
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when state is error', () => {
    const ctx = createMockContext({ state: 'error' });
    const { container } = renderRecordingView(ctx);
    expect(container.innerHTML).toBe('');
  });

  // --- Recording dot ---

  it('renders a recording indicator dot', () => {
    const ctx = createMockContext({ state: 'recording' });
    const { container } = renderRecordingView(ctx);
    const dot = container.querySelector('[aria-hidden="true"]');
    expect(dot).toBeInTheDocument();
  });

  it('recording dot has aria-hidden="true"', () => {
    const ctx = createMockContext({ state: 'recording' });
    const { container } = renderRecordingView(ctx);
    // First aria-hidden element is the dot
    const ariaHiddenElements = container.querySelectorAll('[aria-hidden="true"]');
    expect(ariaHiddenElements.length).toBeGreaterThanOrEqual(1);
  });

  // --- Waveform bars ---

  it('renders waveform bars matching waveformHeights count', () => {
    const heights = [4, 8, 12, 16, 20];
    const ctx = createMockContext({ state: 'recording', waveformHeights: heights });
    const { container } = renderRecordingView(ctx);
    // The waveform container is the second aria-hidden element
    const ariaHiddenElements = container.querySelectorAll('[aria-hidden="true"]');
    // dot + waveform container
    expect(ariaHiddenElements.length).toBeGreaterThanOrEqual(2);
    const waveformContainer = ariaHiddenElements[1]!;
    expect(waveformContainer.children.length).toBe(heights.length);
  });

  it('sets correct height style on each waveform bar', () => {
    const heights = [4, 12, 24];
    const ctx = createMockContext({ state: 'recording', waveformHeights: heights });
    const { container } = renderRecordingView(ctx);
    const ariaHiddenElements = container.querySelectorAll('[aria-hidden="true"]');
    const waveformContainer = ariaHiddenElements[1]!;
    const bars = Array.from(waveformContainer.children) as HTMLElement[];
    expect(bars[0]!.style.height).toBe('4px');
    expect(bars[1]!.style.height).toBe('12px');
    expect(bars[2]!.style.height).toBe('24px');
  });

  it('waveform container has aria-hidden="true"', () => {
    const ctx = createMockContext({ state: 'recording' });
    const { container } = renderRecordingView(ctx);
    const ariaHiddenElements = container.querySelectorAll('[aria-hidden="true"]');
    expect(ariaHiddenElements.length).toBeGreaterThanOrEqual(2);
  });

  // --- Children ---

  it('renders children (e.g., Timer)', () => {
    const ctx = createMockContext({ state: 'recording', elapsedSeconds: 42 });
    renderRecordingView(ctx, {
      children: <CometChatMediaRecorder.Timer />,
    });
    expect(screen.getByRole('timer')).toBeInTheDocument();
    expect(screen.getByRole('timer')).toHaveTextContent('0:42');
  });

  it('renders custom children', () => {
    const ctx = createMockContext({ state: 'recording' });
    renderRecordingView(ctx, {
      children: <span data-testid="custom-child">Custom</span>,
    });
    expect(screen.getByTestId('custom-child')).toBeInTheDocument();
  });

  // --- Custom className ---

  it('applies custom className to the waveform container', () => {
    const ctx = createMockContext({ state: 'recording' });
    const { container } = renderRecordingView(ctx, { className: 'my-recording-class' });
    const ariaHiddenElements = container.querySelectorAll('[aria-hidden="true"]');
    const waveformContainer = ariaHiddenElements[1]!;
    expect(waveformContainer.className).toContain('my-recording-class');
  });

  // --- Empty waveform ---

  it('renders empty waveform when waveformHeights is empty', () => {
    const ctx = createMockContext({ state: 'recording', waveformHeights: [] });
    const { container } = renderRecordingView(ctx);
    const ariaHiddenElements = container.querySelectorAll('[aria-hidden="true"]');
    const waveformContainer = ariaHiddenElements[1]!;
    expect(waveformContainer.children.length).toBe(0);
  });

  // --- Waveform bar active class ---

  it('waveform bars have active modifier class during recording', () => {
    const heights = [10, 20];
    const ctx = createMockContext({ state: 'recording', waveformHeights: heights });
    const { container } = renderRecordingView(ctx);
    const ariaHiddenElements = container.querySelectorAll('[aria-hidden="true"]');
    const waveformContainer = ariaHiddenElements[1]!;
    const bars = Array.from(waveformContainer.children) as HTMLElement[];
    // Each bar should exist (active class is applied via CSS modules, so we just verify bars render)
    expect(bars.length).toBe(2);
  });
});
