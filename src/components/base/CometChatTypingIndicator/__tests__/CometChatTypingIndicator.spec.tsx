import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { createRef } from 'react';
import { CometChatTypingIndicator } from '../CometChatTypingIndicator';

describe('CometChatTypingIndicator', () => {
  it('renders nothing when typingNames is empty', () => {
    const { container } = render(<CometChatTypingIndicator typingNames={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the typing indicator when typingNames has entries', () => {
    render(<CometChatTypingIndicator typingNames={['Alice']} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows "typing" for 1-on-1 chat (isGroupChat=false)', () => {
    render(<CometChatTypingIndicator typingNames={['Alice']} isGroupChat={false} />);
    expect(screen.getByText('typing')).toBeInTheDocument();
  });

  it('shows "{name} is typing..." for group chat with 1 user', () => {
    render(<CometChatTypingIndicator typingNames={['Bob']} isGroupChat />);
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText(/is typing/)).toBeInTheDocument();
  });

  it('shows "{name1} and {name2} are typing..." for group chat with 2 users', () => {
    render(<CometChatTypingIndicator typingNames={['Alice', 'Bob']} isGroupChat />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText(/are typing/)).toBeInTheDocument();
  });

  it('shows "Multiple people are typing" for group chat with 3+ users', () => {
    render(<CometChatTypingIndicator typingNames={['Alice', 'Bob', 'Charlie']} isGroupChat />);
    expect(screen.getByText('Multiple people are typing')).toBeInTheDocument();
  });

  it('renders the user name in a separate span with the name BEM class', () => {
    const { container } = render(<CometChatTypingIndicator typingNames={['Bob']} isGroupChat />);
    const nameSpan = container.querySelector('[class*="cometchat-typing-indicator__name"]');
    expect(nameSpan).not.toBeNull();
    expect(nameSpan?.textContent).toBe('Bob');
  });

  it('renders 3 animated dot elements', () => {
    const { container } = render(<CometChatTypingIndicator typingNames={['Alice']} />);
    const dotsContainer = container.querySelector('[class*="cometchat-typing-indicator__dots"]');
    const dots = dotsContainer?.children;
    expect(dots?.length).toBe(3);
  });

  it('dots have aria-hidden="true"', () => {
    const { container } = render(<CometChatTypingIndicator typingNames={['Alice']} />);
    const dotsContainer = container.querySelector('[class*="cometchat-typing-indicator__dots"]');
    expect(dotsContainer?.getAttribute('aria-hidden')).toBe('true');
  });

  it('has role="status" on the root container', () => {
    render(<CometChatTypingIndicator typingNames={['Alice']} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has aria-live="polite" on the root container', () => {
    render(<CometChatTypingIndicator typingNames={['Alice']} />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });

  it('has computed aria-label for 1-on-1 chat', () => {
    render(<CometChatTypingIndicator typingNames={['Alice']} isGroupChat={false} />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Someone is typing');
  });

  it('has computed aria-label for group chat with 1 user', () => {
    render(<CometChatTypingIndicator typingNames={['Bob']} isGroupChat />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Bob is typing');
  });

  it('has computed aria-label for group chat with 2 users', () => {
    render(<CometChatTypingIndicator typingNames={['Alice', 'Bob']} isGroupChat />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Alice and Bob are typing');
  });

  it('has computed aria-label for group chat with 3+ users', () => {
    render(<CometChatTypingIndicator typingNames={['Alice', 'Bob', 'Charlie']} isGroupChat />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Multiple people are typing');
  });

  it('applies custom className to root container', () => {
    render(<CometChatTypingIndicator typingNames={['Alice']} className="my-custom" />);
    const root = screen.getByRole('status');
    expect(root.className).toContain('my-custom');
    expect(root.className).toMatch(/cometchat-typing-indicator/);
  });

  it('forwards ref to the root div element', () => {
    const ref = createRef<HTMLDivElement>();
    render(<CometChatTypingIndicator ref={ref} typingNames={['Alice']} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current?.getAttribute('role')).toBe('status');
  });

  it('spreads additional HTML attributes via ...rest', () => {
    render(<CometChatTypingIndicator typingNames={['Alice']} data-testid="my-typing" />);
    expect(screen.getByTestId('my-typing')).toBeInTheDocument();
  });

  it('updates display text when typingNames changes', () => {
    const { rerender } = render(<CometChatTypingIndicator typingNames={['Alice']} isGroupChat />);
    expect(screen.getByText('Alice')).toBeInTheDocument();

    rerender(<CometChatTypingIndicator typingNames={['Bob']} isGroupChat />);
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('updates display text when isGroupChat changes', () => {
    const { rerender } = render(
      <CometChatTypingIndicator typingNames={['Alice']} isGroupChat={false} />
    );
    expect(screen.getByText('typing')).toBeInTheDocument();

    rerender(<CometChatTypingIndicator typingNames={['Alice']} isGroupChat />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText(/is typing/)).toBeInTheDocument();
  });

  it('handles typingNames with empty strings gracefully', () => {
    const { container } = render(<CometChatTypingIndicator typingNames={['']} isGroupChat />);
    expect(container.querySelector('[class*="cometchat-typing-indicator"]')).not.toBeNull();
  });
});
