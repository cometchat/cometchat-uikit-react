import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CometChatMessageInformationLoadingState } from '../CometChatMessageInformationLoadingState';

vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
    RECEIVER_TYPE: { GROUP: 'group', USER: 'user' },
  },
}));

describe('CometChatMessageInformationLoadingState', () => {
  it('renders with role="status"', () => {
    render(<CometChatMessageInformationLoadingState />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has aria-live="polite" for accessibility', () => {
    render(<CometChatMessageInformationLoadingState />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
  });

  it('renders a spinner element', () => {
    const { container } = render(<CometChatMessageInformationLoadingState />);
    const spinner = container.querySelector('[class*="spinner"]');
    expect(spinner).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <CometChatMessageInformationLoadingState className="my-loading-class" />
    );
    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain('my-loading-class');
  });

  it('renders without className when not provided', () => {
    const { container } = render(<CometChatMessageInformationLoadingState />);
    const root = container.firstChild as HTMLElement;
    expect(root).toBeInTheDocument();
    expect(root.className).not.toContain('undefined');
  });
});
