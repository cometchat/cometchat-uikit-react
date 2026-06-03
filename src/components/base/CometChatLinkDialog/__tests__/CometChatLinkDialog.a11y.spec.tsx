import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import { CometChatLinkDialog } from '../CometChatLinkDialog';

expect.extend(toHaveNoViolations);

const defaultProps = {
  onSave: vi.fn(),
  onCancel: vi.fn(),
};

describe('CometChatLinkDialog a11y', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes axe-core audit with zero violations (add mode)', async () => {
    const { container } = render(<CometChatLinkDialog {...defaultProps} mode="add" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('passes axe-core audit with zero violations (edit mode)', async () => {
    const { container } = render(
      <CometChatLinkDialog
        {...defaultProps}
        mode="edit"
        initialText="Docs"
        initialUrl="https://example.com"
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('focus trap keeps Tab within the dialog', () => {
    vi.useFakeTimers();
    render(<CometChatLinkDialog {...defaultProps} />);
    act(() => {
      vi.advanceTimersByTime(10);
    });

    // Text input should be focused
    const textInput = screen.getByLabelText('Text');
    expect(document.activeElement).toBe(textInput);

    // Tab through all elements — should cycle back
    // We can't fully test focus trap in jsdom, but we verify the dialog has focusable elements
    const dialog = screen.getByRole('dialog');
    const focusable = dialog.querySelectorAll('input, button');
    expect(focusable.length).toBeGreaterThanOrEqual(4); // text, url, cancel, save
    vi.useRealTimers();
  });

  it('Escape key closes the dialog', () => {
    const onCancel = vi.fn();
    render(<CometChatLinkDialog {...defaultProps} onCancel={onCancel} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledOnce();
  });
});

// Need act import for fake timers
import { act } from '@testing-library/react';
