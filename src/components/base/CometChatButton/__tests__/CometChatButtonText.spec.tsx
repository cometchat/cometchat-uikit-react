import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CometChatButton } from '../CometChatButton';

/** Helper: wraps Text inside Root so context is available. */
function renderText(text: string, className?: string) {
  return render(
    <CometChatButton.Root>
      <CometChatButton.Text className={className}>{text}</CometChatButton.Text>
    </CometChatButton.Root>
  );
}

describe('CometChatButtonText', () => {
  it('renders children inside a <span> with the text class', () => {
    renderText('Hello');
    const el = screen.getByText('Hello');
    expect(el.tagName).toBe('SPAN');
    expect(el.className).toMatch(/cometchat-button__text/);
  });

  it('applies custom className', () => {
    renderText('Hello', 'extra-text');
    const el = screen.getByText('Hello');
    expect(el.className).toContain('extra-text');
  });
});
