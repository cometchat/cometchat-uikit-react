import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CometChatMediaRecorder } from '../CometChatMediaRecorder';
import { CometChatMediaRecorderContext } from '../CometChatMediaRecorder.context';
import type { CometChatMediaRecorderContextValue } from '../CometChatMediaRecorder.types';

// ── Locale mock ────────────────────────────────────────────────────

vi.mock('../../../../context/locale/LocaleContext', () => ({
  useLocale: () => ({
    getLocalizedString: (key: string) => key,
    tDateTimeParser: (d: Date) => d.toISOString(),
    language: 'en-us',
  }),
}));

// ── Helpers ────────────────────────────────────────────────────────

function createMockContext(
  overrides: Partial<CometChatMediaRecorderContextValue> = {}
): CometChatMediaRecorderContextValue {
  return {
    state: 'paused',
    elapsedSeconds: 30,
    waveformHeights: [4, 8, 12, 16, 20, 24, 20, 16, 12, 8],
    error: null,
    startRecording: vi.fn(),
    pauseRecording: vi.fn(),
    deleteRecording: vi.fn(),
    inlineSend: vi.fn(),
    ...overrides,
  };
}

function renderPreviewView(
  ctx: CometChatMediaRecorderContextValue,
  props: { className?: string; children?: React.ReactNode } = {}
) {
  return render(
    <CometChatMediaRecorderContext.Provider value={ctx}>
      <CometChatMediaRecorder.PreviewView className={props.className}>
        {props.children}
      </CometChatMediaRecorder.PreviewView>
    </CometChatMediaRecorderContext.Provider>
  );
}

// ── Tests ──────────────────────────────────────────────────────────

describe('CometChatMediaRecorderPreviewView', () => {
  // --- Conditional rendering ---

  it('renders when state is paused', () => {
    const ctx = createMockContext({ state: 'paused' });
    const { container } = renderPreviewView(ctx);
    expect(container.innerHTML).not.toBe('');
  });

  it('renders nothing when state is idle', () => {
    const ctx = createMockContext({ state: 'idle' });
    const { container } = renderPreviewView(ctx);
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when state is recording', () => {
    const ctx = createMockContext({ state: 'recording' });
    const { container } = renderPreviewView(ctx);
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when state is error', () => {
    const ctx = createMockContext({ state: 'error' });
    const { container } = renderPreviewView(ctx);
    expect(container.innerHTML).toBe('');
  });

  // --- Waveform bars ---

  it('renders waveform bars matching waveformHeights count', () => {
    const heights = [4, 8, 12, 16, 20];
    const ctx = createMockContext({ state: 'paused', waveformHeights: heights });
    const { container } = renderPreviewView(ctx);
    const waveformContainer = container.querySelector('[aria-hidden="true"]');
    expect(waveformContainer).toBeInTheDocument();
    const bars = waveformContainer!.children;
    expect(bars.length).toBe(heights.length);
  });

  it('sets correct height style on each waveform bar', () => {
    const heights = [4, 12, 24];
    const ctx = createMockContext({ state: 'paused', waveformHeights: heights });
    const { container } = renderPreviewView(ctx);
    const waveformContainer = container.querySelector('[aria-hidden="true"]');
    const bars = Array.from(waveformContainer!.children) as HTMLElement[];
    expect(bars[0]!.style.height).toBe('4px');
    expect(bars[1]!.style.height).toBe('12px');
    expect(bars[2]!.style.height).toBe('24px');
  });

  it('waveform container has aria-hidden="true"', () => {
    const ctx = createMockContext({ state: 'paused' });
    const { container } = renderPreviewView(ctx);
    const waveformContainer = container.querySelector('[aria-hidden="true"]');
    expect(waveformContainer).toBeInTheDocument();
  });

  // --- Children ---

  it('renders children (e.g., Timer)', () => {
    const ctx = createMockContext({ state: 'paused', elapsedSeconds: 42 });
    renderPreviewView(ctx, {
      children: <CometChatMediaRecorder.Timer />,
    });
    expect(screen.getByRole('timer')).toBeInTheDocument();
    expect(screen.getByRole('timer')).toHaveTextContent('0:42');
  });

  it('renders custom children', () => {
    const ctx = createMockContext({ state: 'paused' });
    renderPreviewView(ctx, {
      children: <span data-testid="custom-child">Custom</span>,
    });
    expect(screen.getByTestId('custom-child')).toBeInTheDocument();
  });

  // --- Custom className ---

  it('applies custom className to the waveform container', () => {
    const ctx = createMockContext({ state: 'paused' });
    const { container } = renderPreviewView(ctx, { className: 'my-preview-class' });
    const waveformContainer = container.querySelector('[aria-hidden="true"]');
    expect(waveformContainer?.className).toContain('my-preview-class');
  });

  // --- Empty waveform ---

  it('renders empty waveform when waveformHeights is empty', () => {
    const ctx = createMockContext({ state: 'paused', waveformHeights: [] });
    const { container } = renderPreviewView(ctx);
    const waveformContainer = container.querySelector('[aria-hidden="true"]');
    expect(waveformContainer).toBeInTheDocument();
    expect(waveformContainer!.children.length).toBe(0);
  });
});
