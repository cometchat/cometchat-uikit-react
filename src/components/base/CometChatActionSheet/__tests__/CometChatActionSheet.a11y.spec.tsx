import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import { CometChatActionSheet } from '../CometChatActionSheet';

expect.extend(toHaveNoViolations);

function renderFullSheet(isOpen = true) {
  const onClose = vi.fn();
  const result = render(
    <CometChatActionSheet.Root isOpen={isOpen} onClose={onClose}>
      <CometChatActionSheet.Header title="Actions" onClose={onClose} />
      <CometChatActionSheet.Layout>
        <CometChatActionSheet.Item item={{ id: '1', title: 'Photo', onClick: vi.fn() }} />
        <CometChatActionSheet.Item item={{ id: '2', title: 'Video', onClick: vi.fn() }} />
      </CometChatActionSheet.Layout>
    </CometChatActionSheet.Root>
  );
  return { ...result, onClose };
}

describe('CometChatActionSheet a11y', () => {
  it('passes axe-core audit with zero violations when open', async () => {
    const { container } = renderFullSheet();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('focus moves into the sheet on open', async () => {
    vi.useFakeTimers();
    renderFullSheet();
    // requestAnimationFrame is used for focus — flush it
    await vi.advanceTimersByTimeAsync(16);
    const dialog = screen.getByRole('dialog');
    expect(dialog.contains(document.activeElement)).toBe(true);
    vi.useRealTimers();
  });

  it('focus returns to trigger element on close', () => {
    const trigger = document.createElement('button');
    trigger.textContent = 'Open';
    document.body.appendChild(trigger);
    trigger.focus();

    const onClose = vi.fn();
    const { rerender } = render(
      <CometChatActionSheet.Root isOpen={true} onClose={onClose}>
        <CometChatActionSheet.Header title="Actions" />
        <CometChatActionSheet.Layout>
          <CometChatActionSheet.Item item={{ id: '1', title: 'Photo', onClick: vi.fn() }} />
        </CometChatActionSheet.Layout>
      </CometChatActionSheet.Root>
    );

    rerender(
      <CometChatActionSheet.Root isOpen={false} onClose={onClose}>
        <CometChatActionSheet.Header title="Actions" />
        <CometChatActionSheet.Layout>
          <CometChatActionSheet.Item item={{ id: '1', title: 'Photo', onClick: vi.fn() }} />
        </CometChatActionSheet.Layout>
      </CometChatActionSheet.Root>
    );

    expect(document.activeElement).toBe(trigger);
    document.body.removeChild(trigger);
  });

  it('Tab key cycles through focusable items without escaping the sheet', () => {
    renderFullSheet();
    const dialog = screen.getByRole('dialog');
    const buttons = screen.getAllByRole('button');
    const lastButton = buttons[buttons.length - 1]!;

    lastButton.focus();
    fireEvent.keyDown(dialog, { key: 'Tab' });

    // Focus should still be within the dialog (trap prevents escape)
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it('Escape key closes the sheet', () => {
    const { onClose } = renderFullSheet();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('screen reader announces the dialog title', () => {
    renderFullSheet();
    const dialog = screen.getByRole('dialog');
    const labelledBy = dialog.getAttribute('aria-labelledby');
    expect(labelledBy).toBeTruthy();

    const titleEl = document.getElementById(labelledBy!);
    expect(titleEl).not.toBeNull();
    expect(titleEl!.textContent).toBe('Actions');
  });
});
