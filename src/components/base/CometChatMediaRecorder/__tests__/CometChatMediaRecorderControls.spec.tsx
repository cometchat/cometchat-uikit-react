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
    state: 'idle',
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

function renderControls(ctx: CometChatMediaRecorderContextValue) {
  return render(
    <CometChatMediaRecorderContext.Provider value={ctx}>
      <CometChatMediaRecorder.Controls />
    </CometChatMediaRecorderContext.Provider>
  );
}

// ── Tests ──────────────────────────────────────────────────────────

describe('CometChatMediaRecorderControls', () => {
  // --- Rendering per state ---

  it('renders delete and start buttons in idle state', () => {
    const ctx = createMockContext({ state: 'idle' });
    renderControls(ctx);
    expect(screen.getByRole('button', { name: 'media_recorder_delete' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'media_recorder_start' })).toBeInTheDocument();
  });

  it('renders delete button but not start in recording state', () => {
    const ctx = createMockContext({ state: 'recording' });
    renderControls(ctx);
    expect(screen.getByRole('button', { name: 'media_recorder_delete' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'media_recorder_start' })).not.toBeInTheDocument();
  });

  it('renders delete button but not start in paused state', () => {
    const ctx = createMockContext({ state: 'paused' });
    renderControls(ctx);
    expect(screen.getByRole('button', { name: 'media_recorder_delete' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'media_recorder_start' })).not.toBeInTheDocument();
  });

  it('renders nothing in error state', () => {
    const ctx = createMockContext({ state: 'error' });
    const { container } = renderControls(ctx);
    expect(container.innerHTML).toBe('');
  });

  // --- Click handlers ---

  it('calls startRecording when start button is clicked', () => {
    const ctx = createMockContext({ state: 'idle' });
    renderControls(ctx);
    fireEvent.click(screen.getByRole('button', { name: 'media_recorder_start' }));
    expect(ctx.startRecording).toHaveBeenCalledOnce();
  });

  it('calls deleteRecording when delete button is clicked', () => {
    const ctx = createMockContext({ state: 'idle' });
    renderControls(ctx);
    fireEvent.click(screen.getByRole('button', { name: 'media_recorder_delete' }));
    expect(ctx.deleteRecording).toHaveBeenCalledOnce();
  });

  // --- Keyboard handlers ---

  it('calls startRecording on Enter key on start button', () => {
    const ctx = createMockContext({ state: 'idle' });
    renderControls(ctx);
    const btn = screen.getByRole('button', { name: 'media_recorder_start' });
    fireEvent.keyDown(btn, { key: 'Enter' });
    expect(ctx.startRecording).toHaveBeenCalledOnce();
  });

  it('calls startRecording on Space key on start button', () => {
    const ctx = createMockContext({ state: 'idle' });
    renderControls(ctx);
    const btn = screen.getByRole('button', { name: 'media_recorder_start' });
    fireEvent.keyDown(btn, { key: ' ' });
    expect(ctx.startRecording).toHaveBeenCalledOnce();
  });

  it('calls deleteRecording on Enter key on delete button', () => {
    const ctx = createMockContext({ state: 'idle' });
    renderControls(ctx);
    const btn = screen.getByRole('button', { name: 'media_recorder_delete' });
    fireEvent.keyDown(btn, { key: 'Enter' });
    expect(ctx.deleteRecording).toHaveBeenCalledOnce();
  });

  it('calls deleteRecording on Space key on delete button', () => {
    const ctx = createMockContext({ state: 'idle' });
    renderControls(ctx);
    const btn = screen.getByRole('button', { name: 'media_recorder_delete' });
    fireEvent.keyDown(btn, { key: ' ' });
    expect(ctx.deleteRecording).toHaveBeenCalledOnce();
  });

  it('does not call handler on non-activation keys', () => {
    const ctx = createMockContext({ state: 'idle' });
    renderControls(ctx);
    const btn = screen.getByRole('button', { name: 'media_recorder_start' });
    fireEvent.keyDown(btn, { key: 'Tab' });
    expect(ctx.startRecording).not.toHaveBeenCalled();
  });

  // --- Custom className ---

  it('applies custom className', () => {
    const ctx = createMockContext({ state: 'idle' });
    render(
      <CometChatMediaRecorderContext.Provider value={ctx}>
        <CometChatMediaRecorder.Controls className="custom-controls" />
      </CometChatMediaRecorderContext.Provider>
    );
    const deleteBtn = screen.getByRole('button', { name: 'media_recorder_delete' });
    const wrapper = deleteBtn.parentElement;
    expect(wrapper?.className).toContain('custom-controls');
  });

  // --- Accessibility ---

  it('all buttons have tabIndex=0', () => {
    const ctx = createMockContext({ state: 'idle' });
    renderControls(ctx);
    const buttons = screen.getAllByRole('button');
    buttons.forEach(btn => {
      expect(btn).toHaveAttribute('tabindex', '0');
    });
  });

  it('all buttons have aria-label', () => {
    const ctx = createMockContext({ state: 'idle' });
    renderControls(ctx);
    const buttons = screen.getAllByRole('button');
    buttons.forEach(btn => {
      expect(btn).toHaveAttribute('aria-label');
    });
  });
});
