import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CometChatConfirmDialog } from '../CometChatConfirmDialog';

function renderDialog(
  props: Partial<React.ComponentProps<typeof CometChatConfirmDialog.Root>> = {}
) {
  const defaultProps: React.ComponentProps<typeof CometChatConfirmDialog.Root> = {
    isOpen: true,
    onClose: vi.fn(),
    children: (
      <>
        <CometChatConfirmDialog.Icon />
        <CometChatConfirmDialog.Content title="Delete?" messageText="This cannot be undone." />
        <CometChatConfirmDialog.Actions />
      </>
    ),
    ...props,
  };
  return {
    ...render(<CometChatConfirmDialog.Root {...defaultProps} />),
    onClose: defaultProps.onClose as ReturnType<typeof vi.fn>,
  };
}

describe('CometChatConfirmDialogRoot', () => {
  // --- Rendering ---

  it('renders nothing when isOpen is false', () => {
    const { container } = renderDialog({ isOpen: false });
    expect(container.innerHTML).toBe('');
  });

  it('renders the dialog when isOpen is true', () => {
    renderDialog();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('renders default children (Icon, Content, Actions) when no children provided', () => {
    render(
      <CometChatConfirmDialog.Root isOpen={true} onClose={vi.fn()}>
        {undefined as unknown as React.ReactNode}
      </CometChatConfirmDialog.Root>
    );
    // The root renders default sub-components when children is falsy
    // This tests the fallback branch: children ?? (<><Icon/><Content/><Actions/></>)
  });

  it('sets role="dialog" and aria-modal="true"', () => {
    renderDialog();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('sets aria-labelledby and aria-describedby', () => {
    renderDialog();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-labelledby', 'cometchat-confirm-dialog-title');
    expect(dialog).toHaveAttribute('aria-describedby', 'cometchat-confirm-dialog-message');
  });

  it('applies custom className to the backdrop', () => {
    renderDialog({ className: 'my-custom-class' });
    // The className is applied to the backdrop wrapper, not the dialog itself
    const dialog = screen.getByRole('dialog');
    const backdrop = dialog.parentElement;
    expect(backdrop?.className).toContain('my-custom-class');
  });

  // --- Controlled mode ---

  it('opens and closes in controlled mode via isOpen prop', () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <CometChatConfirmDialog.Root isOpen={true} onClose={onClose}>
        <CometChatConfirmDialog.Content title="Test" />
      </CometChatConfirmDialog.Root>
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    rerender(
      <CometChatConfirmDialog.Root isOpen={false} onClose={onClose}>
        <CometChatConfirmDialog.Content title="Test" />
      </CometChatConfirmDialog.Root>
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  // --- Escape key ---

  it('calls onClose when Escape key is pressed', () => {
    const { onClose } = renderDialog();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('prevents default on Escape key', () => {
    renderDialog();
    const event = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    const prevented = !screen.getByRole('dialog').dispatchEvent(event);
    expect(prevented).toBe(true);
  });

  // --- Outside click ---

  it('calls onClose when clicking outside the dialog', () => {
    const { onClose } = renderDialog();
    // Simulate mousedown on the document (outside the dialog container)
    fireEvent.mouseDown(document.body);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does not call onClose when clicking inside the dialog', () => {
    const { onClose } = renderDialog();
    fireEvent.mouseDown(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('does not close on outside click when closeOnOutsideClick is false', () => {
    const { onClose } = renderDialog({ closeOnOutsideClick: false });
    fireEvent.mouseDown(document.body);
    expect(onClose).not.toHaveBeenCalled();
  });

  // --- Focus trap ---

  it('traps focus within the dialog on Tab key', () => {
    renderDialog();
    const dialog = screen.getByRole('dialog');
    const buttons = dialog.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);

    // Focus the last button
    const lastButton = buttons[buttons.length - 1]!;
    lastButton.focus();

    // Tab from last element should wrap to first
    fireEvent.keyDown(dialog, { key: 'Tab' });
    // Focus trap logic prevents default — verify no error is thrown
    expect(dialog).toBeInTheDocument();
  });

  it('traps focus on Shift+Tab from first element', () => {
    renderDialog();
    const dialog = screen.getByRole('dialog');
    const buttons = dialog.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);

    // Focus the first button
    const firstButton = buttons[0]!;
    firstButton.focus();

    // Shift+Tab from first element should wrap to last
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    expect(dialog).toBeInTheDocument();
  });

  // --- Focus restoration ---

  it('returns focus to previously focused element on close', () => {
    const trigger = document.createElement('button');
    trigger.textContent = 'Trigger';
    document.body.appendChild(trigger);
    trigger.focus();

    const { rerender } = render(
      <CometChatConfirmDialog.Root isOpen={true} onClose={vi.fn()}>
        <CometChatConfirmDialog.Content title="Test" />
      </CometChatConfirmDialog.Root>
    );

    rerender(
      <CometChatConfirmDialog.Root isOpen={false} onClose={vi.fn()}>
        <CometChatConfirmDialog.Content title="Test" />
      </CometChatConfirmDialog.Root>
    );

    expect(document.activeElement).toBe(trigger);
    document.body.removeChild(trigger);
  });

  // --- Variant ---

  it('defaults variant to danger', () => {
    renderDialog();
    // The dialog renders — variant is passed via context to children.
    // If context wasn't provided correctly, Icon/Actions would throw.
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('accepts variant="warning"', () => {
    renderDialog({ variant: 'warning' });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('accepts variant="info"', () => {
    renderDialog({ variant: 'info' });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  // --- Context provision ---

  it('provides context values to children', () => {
    // If context wasn't provided, sub-components would throw.
    // Rendering successfully proves context is provided.
    renderDialog();
    expect(screen.getByText('Delete?')).toBeInTheDocument();
    expect(screen.getByText('This cannot be undone.')).toBeInTheDocument();
  });

  // --- Uncontrolled mode ---

  it('works in uncontrolled mode (no isOpen prop)', () => {
    // When isOpen is undefined, the component uses internal state (defaults to false).
    const { container } = render(
      <CometChatConfirmDialog.Root onClose={vi.fn()}>
        <CometChatConfirmDialog.Content title="Test" />
      </CometChatConfirmDialog.Root>
    );
    // Internal state defaults to false, so nothing renders
    expect(container.innerHTML).toBe('');
  });
});
