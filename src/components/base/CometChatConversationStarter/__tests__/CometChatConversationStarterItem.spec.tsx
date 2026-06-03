import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { CometChatConversationStarterItem } from '../CometChatConversationStarterItem';

describe('CometChatConversationStarterItem', () => {
  it('renders the suggestion text inside a <button>', () => {
    render(<CometChatConversationStarterItem suggestion="Hello" />);
    const button = screen.getByRole('button', { name: 'Hello' });
    expect(button).toBeInTheDocument();
    expect(button.tagName).toBe('BUTTON');
  });

  it('calls onClick with the suggestion string when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<CometChatConversationStarterItem suggestion="Click me" onClick={onClick} />);
    await user.click(screen.getByRole('button', { name: 'Click me' }));
    expect(onClick).toHaveBeenCalledWith('Click me');
  });

  it('does not call onClick when disabled is true', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<CometChatConversationStarterItem suggestion="Disabled" onClick={onClick} disabled />);
    await user.click(screen.getByRole('button', { name: 'Disabled' }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('applies aria-disabled="true" when disabled', () => {
    render(<CometChatConversationStarterItem suggestion="Disabled" disabled />);
    const button = screen.getByRole('button', { name: 'Disabled' });
    expect(button).toHaveAttribute('aria-disabled', 'true');
  });

  it('applies disabled attribute on the native button when disabled', () => {
    render(<CometChatConversationStarterItem suggestion="Disabled" disabled />);
    const button = screen.getByRole('button', { name: 'Disabled' });
    expect(button).toBeDisabled();
  });

  it('applies custom className', () => {
    render(<CometChatConversationStarterItem suggestion="Test" className="my-class" />);
    const item = document.querySelector('.my-class');
    expect(item).toBeInTheDocument();
  });

  it('renders as a native button element for keyboard support', () => {
    render(<CometChatConversationStarterItem suggestion="Test" />);
    const button = screen.getByRole('button', { name: 'Test' });
    expect(button).toHaveAttribute('type', 'button');
  });
});
