import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CometChatThreadView } from '../CometChatThreadView';

describe('CometChatThreadViewUnreadIndicator', () => {
  it('renders the unread indicator dot when unreadReplyCount > 0', () => {
    render(
      <CometChatThreadView.Root replyCount={3} unreadReplyCount={2} onClick={() => {}}>
        <CometChatThreadView.UnreadIndicator />
      </CometChatThreadView.Root>
    );
    const dot = screen.getByRole('button').querySelector('[aria-hidden="true"]');
    expect(dot).toBeInTheDocument();
  });

  it('does not render when unreadReplyCount is 0', () => {
    const { container } = render(
      <CometChatThreadView.Root replyCount={3} unreadReplyCount={0} onClick={() => {}}>
        <CometChatThreadView.UnreadIndicator />
      </CometChatThreadView.Root>
    );
    const btn = container.querySelector('button');
    // The button should exist but the unread indicator should not
    expect(btn).toBeInTheDocument();
    expect(btn?.querySelector('[class*="unread-indicator"]')).toBeNull();
  });

  it('does not render when unreadReplyCount is not provided', () => {
    const { container } = render(
      <CometChatThreadView.Root replyCount={3} onClick={() => {}}>
        <CometChatThreadView.UnreadIndicator />
      </CometChatThreadView.Root>
    );
    const btn = container.querySelector('button');
    expect(btn?.querySelector('[class*="unread-indicator"]')).toBeNull();
  });

  it('has aria-hidden="true" (decorative)', () => {
    render(
      <CometChatThreadView.Root replyCount={3} unreadReplyCount={1} onClick={() => {}}>
        <CometChatThreadView.UnreadIndicator />
      </CometChatThreadView.Root>
    );
    const dot = screen.getByRole('button').querySelector('[aria-hidden="true"]');
    expect(dot).toHaveAttribute('aria-hidden', 'true');
  });

  it('applies custom className', () => {
    render(
      <CometChatThreadView.Root replyCount={3} unreadReplyCount={1} onClick={() => {}}>
        <CometChatThreadView.UnreadIndicator className="custom-dot" />
      </CometChatThreadView.Root>
    );
    const dot = screen.getByRole('button').querySelector('[aria-hidden="true"]');
    expect((dot as HTMLElement).className).toContain('custom-dot');
  });
});
