import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CometChatErrorBoundaryFallback } from '../CometChatErrorBoundaryFallback';
import { CometChatErrorBoundaryContext } from '../CometChatErrorBoundary.context';
import type { CometChatErrorBoundaryContextValue } from '../CometChatErrorBoundary.types';

// Suppress console.error for the "outside context" test
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

function renderWithContext(
  ctx: CometChatErrorBoundaryContextValue,
  props: { className?: string } = {}
) {
  return render(
    <CometChatErrorBoundaryContext.Provider value={ctx}>
      <CometChatErrorBoundaryFallback {...props} />
    </CometChatErrorBoundaryContext.Provider>
  );
}

const errorCtx: CometChatErrorBoundaryContextValue = {
  hasError: true,
  errorContext: {
    error: new Error('Test error'),
    componentName: 'TestComp',
    timestamp: Date.now(),
  },
  retry: vi.fn(),
};

const noErrorCtx: CometChatErrorBoundaryContextValue = {
  hasError: false,
  errorContext: null,
  retry: vi.fn(),
};

describe('CometChatErrorBoundaryFallback', () => {
  it('renders the "Something went wrong" message when in error state', () => {
    renderWithContext(errorCtx);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders the "Retry" button when in error state', () => {
    renderWithContext(errorCtx);
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('does not render anything when not in error state', () => {
    const { container } = renderWithContext(noErrorCtx);
    expect(container.innerHTML).toBe('');
  });

  it('clicking retry button calls retry() from context', async () => {
    const user = userEvent.setup();
    const retry = vi.fn();
    renderWithContext({ ...errorCtx, retry });
    await user.click(screen.getByText('Retry'));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('retry button has correct aria-label', () => {
    renderWithContext(errorCtx);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-label', 'Retry');
  });

  it('throws error when used outside of CometChatErrorBoundary.Root', () => {
    expect(() => {
      render(<CometChatErrorBoundaryFallback />);
    }).toThrow(
      'useCometChatErrorBoundaryContext must be used within <CometChatErrorBoundary.Root>'
    );
  });

  it('applies custom className', () => {
    renderWithContext(errorCtx, { className: 'my-fallback' });
    const alert = screen.getByRole('alert');
    expect(alert.className).toContain('my-fallback');
  });
});
