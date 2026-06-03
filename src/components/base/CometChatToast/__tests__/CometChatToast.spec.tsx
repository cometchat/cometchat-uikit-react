import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRef } from 'react';
import { CometChatToast } from '../CometChatToast';

describe('CometChatToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the toast when text is provided', () => {
    render(<CometChatToast text="Hello" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders nothing when text is empty', () => {
    const { container } = render(<CometChatToast text="" />);
    expect(container.firstChild).toBeNull();
  });

  it('displays the text content in the toast', () => {
    render(<CometChatToast text="File uploaded" />);
    expect(screen.getByText('File uploaded')).toBeInTheDocument();
  });

  it('calls onClose after duration ms (auto-dismiss)', () => {
    const onClose = vi.fn();
    render(<CometChatToast text="Hello" duration={3000} onClose={onClose} />);

    expect(onClose).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does not call onClose before duration elapses', () => {
    const onClose = vi.fn();
    render(<CometChatToast text="Hello" duration={5000} onClose={onClose} />);

    act(() => {
      vi.advanceTimersByTime(4999);
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('does not auto-dismiss when duration is 0', () => {
    const onClose = vi.fn();
    render(<CometChatToast text="Hello" duration={0} onClose={onClose} />);

    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('clears auto-dismiss timeout on manual close (close button click)', () => {
    const onClose = vi.fn();
    render(<CometChatToast text="Hello" duration={3000} onClose={onClose} />);

    fireEvent.click(screen.getByLabelText('Close notification'));
    expect(onClose).toHaveBeenCalledOnce();

    // Advancing past original duration should not fire again
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('clears auto-dismiss timeout on unmount', () => {
    const onClose = vi.fn();
    const { unmount } = render(<CometChatToast text="Hello" duration={3000} onClose={onClose} />);

    unmount();
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('renders close button when showCloseButton is true (default)', () => {
    render(<CometChatToast text="Hello" />);
    expect(screen.getByLabelText('Close notification')).toBeInTheDocument();
  });

  it('does not render close button when showCloseButton is false', () => {
    render(<CometChatToast text="Hello" showCloseButton={false} />);
    expect(screen.queryByLabelText('Close notification')).toBeNull();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<CometChatToast text="Hello" duration={0} onClose={onClose} />);

    fireEvent.click(screen.getByLabelText('Close notification'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose on Escape key when dismissOnEscape is true (default)', () => {
    const onClose = vi.fn();
    render(<CometChatToast text="Hello" duration={0} onClose={onClose} />);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does not call onClose on Escape key when dismissOnEscape is false', () => {
    const onClose = vi.fn();
    render(<CometChatToast text="Hello" duration={0} onClose={onClose} dismissOnEscape={false} />);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('clears auto-dismiss timeout when dismissed via Escape', () => {
    const onClose = vi.fn();
    render(<CometChatToast text="Hello" duration={3000} onClose={onClose} />);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('applies custom className to root container', () => {
    render(<CometChatToast text="Hello" className="my-custom" />);
    const root = screen.getByRole('status');
    expect(root.className).toContain('my-custom');
    expect(root.className).toMatch(/cometchat-toast/);
  });

  it('forwards ref to the root div element', () => {
    const ref = createRef<HTMLDivElement>();
    render(<CometChatToast ref={ref} text="Hello" />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current?.getAttribute('role')).toBe('status');
  });

  it('spreads additional HTML attributes via ...rest', () => {
    render(<CometChatToast text="Hello" data-testid="my-toast" />);
    expect(screen.getByTestId('my-toast')).toBeInTheDocument();
  });

  it('has role="status" on the toast container', () => {
    render(<CometChatToast text="Hello" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has aria-live="polite" on the toast container', () => {
    render(<CometChatToast text="Hello" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });

  it('has aria-label set to the text content', () => {
    render(<CometChatToast text="File uploaded" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'File uploaded');
  });

  it('close button has aria-label', () => {
    render(<CometChatToast text="Hello" />);
    const btn = screen.getByLabelText('Close notification');
    expect(btn.tagName).toBe('BUTTON');
  });

  it('does not double-fire onClose after manual + auto dismiss', () => {
    const onClose = vi.fn();
    render(<CometChatToast text="Hello" duration={3000} onClose={onClose} />);

    // Manual close first
    fireEvent.click(screen.getByLabelText('Close notification'));
    expect(onClose).toHaveBeenCalledOnce();

    // Timer fires after — should not call again
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('handles very long text without throwing', () => {
    const longText = 'A'.repeat(5000);
    render(<CometChatToast text={longText} />);
    expect(screen.getByText(longText)).toBeInTheDocument();
  });
});
