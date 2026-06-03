import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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
    state: 'error',
    elapsedSeconds: 0,
    waveformHeights: new Array(30).fill(4),
    error: 'permission_denied',
    startRecording: vi.fn(),
    pauseRecording: vi.fn(),
    deleteRecording: vi.fn(),
    inlineSend: vi.fn(),
    ...overrides,
  };
}

function renderErrorView(ctx: CometChatMediaRecorderContextValue, className?: string) {
  return render(
    <CometChatMediaRecorderContext.Provider value={ctx}>
      <CometChatMediaRecorder.ErrorView className={className} />
    </CometChatMediaRecorderContext.Provider>
  );
}

// ── Tests ──────────────────────────────────────────────────────────

describe('CometChatMediaRecorderErrorView', () => {
  // --- Conditional rendering ---

  it('renders when state is error', () => {
    const ctx = createMockContext({ state: 'error' });
    renderErrorView(ctx);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders nothing when state is idle', () => {
    const ctx = createMockContext({ state: 'idle' });
    const { container } = renderErrorView(ctx);
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when state is recording', () => {
    const ctx = createMockContext({ state: 'recording' });
    const { container } = renderErrorView(ctx);
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when state is paused', () => {
    const ctx = createMockContext({ state: 'paused' });
    const { container } = renderErrorView(ctx);
    expect(container.innerHTML).toBe('');
  });

  // --- Content ---

  it('displays error text', () => {
    const ctx = createMockContext({ state: 'error' });
    renderErrorView(ctx);
    expect(screen.getByText('media_recorder_error_title')).toBeInTheDocument();
  });

  it('renders a close button', () => {
    const ctx = createMockContext({ state: 'error' });
    renderErrorView(ctx);
    expect(screen.getByRole('button', { name: 'media_recorder_delete' })).toBeInTheDocument();
  });

  // --- Accessibility ---

  it('has role="alert" for screen reader announcement', () => {
    const ctx = createMockContext({ state: 'error' });
    renderErrorView(ctx);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('close button has tabIndex=0', () => {
    const ctx = createMockContext({ state: 'error' });
    renderErrorView(ctx);
    const closeBtn = screen.getByRole('button', { name: 'media_recorder_delete' });
    expect(closeBtn).toHaveAttribute('tabindex', '0');
  });

  it('error icon has aria-hidden="true"', () => {
    const ctx = createMockContext({ state: 'error' });
    renderErrorView(ctx);
    const alert = screen.getByRole('alert');
    const icon = alert.querySelector('[aria-hidden="true"]');
    expect(icon).toBeInTheDocument();
  });

  // --- Click handler ---

  it('calls deleteRecording when close button is clicked', () => {
    const ctx = createMockContext({ state: 'error' });
    renderErrorView(ctx);
    fireEvent.click(screen.getByRole('button', { name: 'media_recorder_delete' }));
    expect(ctx.deleteRecording).toHaveBeenCalledOnce();
  });

  // --- Keyboard handler ---

  it('calls deleteRecording on Enter key on close button', () => {
    const ctx = createMockContext({ state: 'error' });
    renderErrorView(ctx);
    const closeBtn = screen.getByRole('button', { name: 'media_recorder_delete' });
    fireEvent.keyDown(closeBtn, { key: 'Enter' });
    expect(ctx.deleteRecording).toHaveBeenCalledOnce();
  });

  it('calls deleteRecording on Space key on close button', () => {
    const ctx = createMockContext({ state: 'error' });
    renderErrorView(ctx);
    const closeBtn = screen.getByRole('button', { name: 'media_recorder_delete' });
    fireEvent.keyDown(closeBtn, { key: ' ' });
    expect(ctx.deleteRecording).toHaveBeenCalledOnce();
  });

  it('does not call deleteRecording on non-activation keys', () => {
    const ctx = createMockContext({ state: 'error' });
    renderErrorView(ctx);
    const closeBtn = screen.getByRole('button', { name: 'media_recorder_delete' });
    fireEvent.keyDown(closeBtn, { key: 'Tab' });
    expect(ctx.deleteRecording).not.toHaveBeenCalled();
  });

  // --- Custom className ---

  it('applies custom className to the error container', () => {
    const ctx = createMockContext({ state: 'error' });
    renderErrorView(ctx, 'my-error-class');
    const alert = screen.getByRole('alert');
    expect(alert.className).toContain('my-error-class');
  });
});
