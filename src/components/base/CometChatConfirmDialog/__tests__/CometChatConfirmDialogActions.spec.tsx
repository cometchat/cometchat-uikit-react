import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { CometChatConfirmDialog } from '../CometChatConfirmDialog';

/**
 * Helper: wraps Actions inside Root so context is available.
 */
function renderActions(
  actionsProps: Partial<React.ComponentProps<typeof CometChatConfirmDialog.Actions>> = {},
  rootProps: Partial<React.ComponentProps<typeof CometChatConfirmDialog.Root>> = {}
) {
  const onClose = rootProps.onClose ?? vi.fn();
  return {
    ...render(
      <CometChatConfirmDialog.Root
        isOpen={true}
        onClose={onClose}
        variant={rootProps.variant ?? 'danger'}
      >
        <CometChatConfirmDialog.Actions {...actionsProps} />
      </CometChatConfirmDialog.Root>
    ),
    onClose: onClose as ReturnType<typeof vi.fn>,
  };
}

describe('CometChatConfirmDialogActions', () => {
  // --- Rendering ---

  it('renders cancel and confirm buttons', () => {
    renderActions();
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it('renders default localized button text (keys as fallback)', () => {
    renderActions();
    // Default t() returns the key itself
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('renders custom cancel and confirm text', () => {
    renderActions({ cancelButtonText: 'Dismiss', confirmButtonText: 'Remove' });
    expect(screen.getByText('Dismiss')).toBeInTheDocument();
    expect(screen.getByText('Remove')).toBeInTheDocument();
  });

  it('renders custom children instead of default buttons', () => {
    renderActions({
      children: <button>Custom Action</button>,
    });
    expect(screen.getByText('Custom Action')).toBeInTheDocument();
    // Default buttons should not be present
    expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
  });

  it('applies custom className to actions container', () => {
    renderActions({ className: 'my-actions' });
    // The actions container should have the custom class
    const container = document.querySelector('.my-actions');
    expect(container).toBeTruthy();
  });

  // --- Cancel behavior ---

  it('calls onCancel when cancel button is clicked', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    renderActions({ onCancel });

    const buttons = screen.getAllByRole('button');
    // Cancel is the first button (secondary variant)
    await user.click(buttons[0]!);
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('calls context onClose when cancel is clicked and no onCancel provided', async () => {
    const user = userEvent.setup();
    const { onClose } = renderActions();

    const buttons = screen.getAllByRole('button');
    await user.click(buttons[0]!);
    expect(onClose).toHaveBeenCalledOnce();
  });

  // --- Confirm behavior (sync) ---

  it('calls onConfirm when confirm button is clicked', async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    renderActions({ onConfirm });

    const buttons = screen.getAllByRole('button');
    // Confirm is the second button (primary variant)
    await user.click(buttons[1]!);
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('does nothing when confirm is clicked without onConfirm', async () => {
    const user = userEvent.setup();
    renderActions();

    const buttons = screen.getAllByRole('button');
    // Should not throw
    await user.click(buttons[1]!);
    expect(buttons[1]).toBeInTheDocument();
  });

  // --- Confirm behavior (async) ---

  it('shows loading state during async onConfirm', async () => {
    let resolvePromise: () => void;
    const onConfirm = vi.fn(
      () =>
        new Promise<void>(resolve => {
          resolvePromise = resolve;
        })
    );
    const user = userEvent.setup();
    renderActions({ onConfirm });

    const buttons = screen.getAllByRole('button');
    await user.click(buttons[1]!);

    // The confirm button should be in loading state
    await waitFor(() => {
      const confirmBtn = screen.getAllByRole('button')[1]!;
      expect(confirmBtn).toHaveAttribute('aria-busy', 'true');
      expect(confirmBtn).toBeDisabled();
    });

    // Resolve the promise to clean up
    resolvePromise!();

    // After resolving, loading should stop
    await waitFor(() => {
      const confirmBtn = screen.getAllByRole('button')[1]!;
      expect(confirmBtn).toHaveAttribute('aria-busy', 'false');
    });
  });

  it('calls onClose after successful async onConfirm', async () => {
    const onConfirm = vi.fn(() => Promise.resolve());
    const user = userEvent.setup();
    const { onClose } = renderActions({ onConfirm });

    const buttons = screen.getAllByRole('button');
    await user.click(buttons[1]!);

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  it('shows error text when async onConfirm rejects', async () => {
    const onConfirm = vi.fn(() => Promise.reject(new Error('fail')));
    const user = userEvent.setup();
    renderActions({ onConfirm });

    const buttons = screen.getAllByRole('button');
    await user.click(buttons[1]!);

    await waitFor(() => {
      // The error message should appear with role="alert"
      const errorEl = screen.getByRole('alert');
      expect(errorEl).toBeInTheDocument();
      // Default error text is the locale key
      expect(errorEl.textContent).toBe('Something went wrong. Please try again.');
    });
  });

  it('does not call onClose when async onConfirm rejects', async () => {
    const onConfirm = vi.fn(() => Promise.reject(new Error('fail')));
    const user = userEvent.setup();
    const { onClose } = renderActions({ onConfirm });

    const buttons = screen.getAllByRole('button');
    await user.click(buttons[1]!);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    expect(onClose).not.toHaveBeenCalled();
  });

  // --- Controlled loading/error ---

  it('uses isLoading prop when provided (controlled)', () => {
    renderActions({ isLoading: true });
    const buttons = screen.getAllByRole('button');
    const confirmBtn = buttons[1]!;
    expect(confirmBtn).toHaveAttribute('aria-busy', 'true');
    expect(confirmBtn).toBeDisabled();
  });

  it('uses errorText prop when provided (controlled)', () => {
    renderActions({ errorText: 'Something went wrong' });
    const errorEl = screen.getByRole('alert');
    expect(errorEl).toBeInTheDocument();
    expect(errorEl.textContent).toBe('Something went wrong');
  });

  it('does not call onConfirm when isLoading is true', async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    renderActions({ onConfirm, isLoading: true });

    const buttons = screen.getAllByRole('button');
    await user.click(buttons[1]!);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  // --- displayName ---

  it('has correct displayName', () => {
    expect(CometChatConfirmDialog.Actions.displayName).toBe('CometChatConfirmDialogActions');
  });
});
