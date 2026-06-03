import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import { CometChatToast } from '../CometChatToast';

expect.extend(toHaveNoViolations);

describe('CometChatToast a11y', () => {
  it('passes axe-core audit with zero violations (default state)', async () => {
    const { container } = render(<CometChatToast text="Notification" duration={0} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('passes axe-core audit with zero violations (without close button)', async () => {
    const { container } = render(
      <CometChatToast text="Notification" duration={0} showCloseButton={false} />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('passes axe-core audit with zero violations (persistent toast)', async () => {
    const { container } = render(
      <CometChatToast
        text="Persistent"
        duration={0}
        showCloseButton={false}
        dismissOnEscape={false}
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('close button is focusable via Tab', () => {
    render(<CometChatToast text="Hello" duration={0} />);
    const btn = screen.getByLabelText('Close notification');
    btn.focus();
    expect(document.activeElement).toBe(btn);
  });

  it('Escape key dismisses the toast', () => {
    const onClose = vi.fn();
    render(<CometChatToast text="Hello" duration={0} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });
});
