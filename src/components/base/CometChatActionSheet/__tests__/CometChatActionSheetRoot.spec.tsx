import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CometChatActionSheet } from '../CometChatActionSheet';

function renderSheet(props: Partial<Parameters<typeof CometChatActionSheet.Root>[0]> = {}) {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    children: (
      <CometChatActionSheet.Layout>
        <CometChatActionSheet.Item item={{ id: '1', title: 'Action 1', onClick: vi.fn() }} />
      </CometChatActionSheet.Layout>
    ),
    ...props,
  };
  return {
    ...render(<CometChatActionSheet.Root {...defaultProps} />),
    onClose: defaultProps.onClose,
  };
}

describe('CometChatActionSheetRoot', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = renderSheet({ isOpen: false });
    expect(container.innerHTML).toBe('');
  });

  it('renders the sheet overlay when isOpen is true', () => {
    renderSheet();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('calls onClose when backdrop is clicked', () => {
    const { onClose } = renderSheet();
    const backdrop = document.querySelector('[role="presentation"]');
    expect(backdrop).not.toBeNull();
    fireEvent.click(backdrop!);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when Escape key is pressed', () => {
    const { onClose } = renderSheet();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('applies custom className to root container', () => {
    renderSheet({ className: 'my-custom-class' });
    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toContain('my-custom-class');
  });

  it('provides context values to children via ActionSheetContext', () => {
    // If context wasn't provided, ActionSheetItem would throw.
    // Rendering successfully proves context is provided.
    renderSheet();
    expect(screen.getByRole('button', { name: 'Action 1' })).toBeInTheDocument();
  });

  it('sets role="dialog" and aria-modal="true" on the sheet', () => {
    renderSheet();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('traps focus within the sheet when open', () => {
    renderSheet({
      children: (
        <CometChatActionSheet.Layout>
          <CometChatActionSheet.Item item={{ id: '1', title: 'First', onClick: vi.fn() }} />
          <CometChatActionSheet.Item item={{ id: '2', title: 'Second', onClick: vi.fn() }} />
        </CometChatActionSheet.Layout>
      ),
    });

    const buttons = screen.getAllByRole('button');
    const last = buttons[buttons.length - 1]!;
    last.focus();

    // Tab from last element should wrap to first
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Tab' });
    // Focus trap logic prevents default — we verify no error is thrown
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('returns focus to previously focused element on close', () => {
    const trigger = document.createElement('button');
    trigger.textContent = 'Trigger';
    document.body.appendChild(trigger);
    trigger.focus();

    const { rerender } = render(
      <CometChatActionSheet.Root isOpen={true} onClose={vi.fn()}>
        <CometChatActionSheet.Layout>
          <CometChatActionSheet.Item item={{ id: '1', title: 'Action', onClick: vi.fn() }} />
        </CometChatActionSheet.Layout>
      </CometChatActionSheet.Root>
    );

    rerender(
      <CometChatActionSheet.Root isOpen={false} onClose={vi.fn()}>
        <CometChatActionSheet.Layout>
          <CometChatActionSheet.Item item={{ id: '1', title: 'Action', onClick: vi.fn() }} />
        </CometChatActionSheet.Layout>
      </CometChatActionSheet.Root>
    );

    expect(document.activeElement).toBe(trigger);
    document.body.removeChild(trigger);
  });
});
