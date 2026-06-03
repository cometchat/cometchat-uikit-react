import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import { CometChatLinkPopover } from '../CometChatLinkPopover';

expect.extend(toHaveNoViolations);

const defaultProps = {
  text: 'Example Link',
  url: 'https://example.com',
  position: { top: 100, left: 200 },
  onEdit: vi.fn(),
  onRemove: vi.fn(),
  onClose: vi.fn(),
};

describe('CometChatLinkPopover a11y', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('passes axe-core audit with zero violations', async () => {
    vi.useRealTimers(); // axe needs real timers
    const { container } = render(<CometChatLinkPopover {...defaultProps} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Edit button is focusable and has aria-label', () => {
    render(<CometChatLinkPopover {...defaultProps} />);
    const editBtn = screen.getByLabelText('Edit link');
    expect(editBtn).toBeTruthy();
    editBtn.focus();
    expect(document.activeElement).toBe(editBtn);
  });

  it('Remove button is focusable and has aria-label', () => {
    render(<CometChatLinkPopover {...defaultProps} />);
    const removeBtn = screen.getByLabelText('Remove link');
    expect(removeBtn).toBeTruthy();
    removeBtn.focus();
    expect(document.activeElement).toBe(removeBtn);
  });

  it('Escape key closes the popover', () => {
    const onClose = vi.fn();
    render(<CometChatLinkPopover {...defaultProps} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });
});
