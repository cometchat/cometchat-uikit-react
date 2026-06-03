import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CometChatMessageInformationEmptyState } from '../CometChatMessageInformationEmptyState';

vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
    RECEIVER_TYPE: { GROUP: 'group', USER: 'user' },
  },
}));

describe('CometChatMessageInformationEmptyState', () => {
  it('renders the empty state text', () => {
    render(<CometChatMessageInformationEmptyState />);
    expect(screen.getByText('message_information_group_message_receipt_empty')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <CometChatMessageInformationEmptyState className="my-empty-class" />
    );
    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain('my-empty-class');
  });

  it('renders without className when not provided', () => {
    const { container } = render(<CometChatMessageInformationEmptyState />);
    const root = container.firstChild as HTMLElement;
    expect(root).toBeInTheDocument();
    // Should not contain extra whitespace from undefined className
    expect(root.className).not.toContain('undefined');
  });

  it('renders a span element with the empty text', () => {
    render(<CometChatMessageInformationEmptyState />);
    const span = screen.getByText('message_information_group_message_receipt_empty');
    expect(span.tagName).toBe('SPAN');
  });
});
