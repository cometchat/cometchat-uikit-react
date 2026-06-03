import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { CometChatConversationSummary } from '../CometChatConversationSummary';

function renderWithRoot(headerProps: Record<string, unknown> = {}, onClose?: () => void) {
  const getSummary = vi.fn(() => new Promise<string>(() => {}));
  return render(
    <CometChatConversationSummary.Root getConversationSummary={getSummary} onClose={onClose}>
      <CometChatConversationSummary.Header {...headerProps} />
    </CometChatConversationSummary.Root>
  );
}

describe('CometChatConversationSummaryHeader', () => {
  it('renders the default title text', () => {
    renderWithRoot();
    expect(screen.getByText('Conversation summary')).toBeInTheDocument();
  });

  it('renders a custom title when provided', () => {
    renderWithRoot({ title: 'Chat Summary' });
    expect(screen.getByText('Chat Summary')).toBeInTheDocument();
  });

  it('renders a close button by default', () => {
    renderWithRoot();
    expect(screen.getByLabelText('Close conversation summary')).toBeInTheDocument();
  });

  it('hides the close button when showCloseButton is false', () => {
    renderWithRoot({ showCloseButton: false });
    expect(screen.queryByLabelText('Close conversation summary')).not.toBeInTheDocument();
  });

  it('calls onClose from context when close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithRoot({}, onClose);
    await user.click(screen.getByLabelText('Close conversation summary'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('close button has aria-label', () => {
    renderWithRoot();
    const btn = screen.getByLabelText('Close conversation summary');
    expect(btn).toHaveAttribute('aria-label', 'Close conversation summary');
  });

  it('applies custom className', () => {
    renderWithRoot({ className: 'my-header' });
    const header = screen.getByText('Conversation summary').closest('div');
    expect(header?.className).toContain('my-header');
  });

  it('renders custom children when provided', () => {
    const getSummary = vi.fn(() => new Promise<string>(() => {}));
    render(
      <CometChatConversationSummary.Root getConversationSummary={getSummary}>
        <CometChatConversationSummary.Header>
          <span>Custom Header</span>
        </CometChatConversationSummary.Header>
      </CometChatConversationSummary.Root>
    );
    expect(screen.getByText('Custom Header')).toBeInTheDocument();
  });
});
