import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import '@testing-library/jest-dom/vitest';
import { CometChatTypingIndicator } from '../CometChatTypingIndicator';

expect.extend(toHaveNoViolations);

describe('CometChatTypingIndicator a11y', () => {
  it('passes axe-core audit with zero violations (1-on-1 typing)', async () => {
    const { container } = render(
      <CometChatTypingIndicator typingNames={['Alice']} isGroupChat={false} />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('passes axe-core audit with zero violations (group, 1 user)', async () => {
    const { container } = render(<CometChatTypingIndicator typingNames={['Bob']} isGroupChat />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('passes axe-core audit with zero violations (group, 3+ users)', async () => {
    const { container } = render(
      <CometChatTypingIndicator typingNames={['Alice', 'Bob', 'Charlie']} isGroupChat />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('screen reader can identify the status role and label', () => {
    render(<CometChatTypingIndicator typingNames={['Alice']} isGroupChat />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-label', 'Alice is typing');
    expect(status).toHaveAttribute('aria-live', 'polite');
  });
});
