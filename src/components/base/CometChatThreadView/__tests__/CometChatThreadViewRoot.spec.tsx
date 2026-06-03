import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { CometChatThreadView } from '../CometChatThreadView';

describe('CometChatThreadViewRoot', () => {
  it('renders nothing when replyCount is 0', () => {
    const { container } = render(
      <CometChatThreadView.Root replyCount={0} onClick={() => {}}>
        <CometChatThreadView.ReplyCount />
      </CometChatThreadView.Root>
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders the thread view when replyCount > 0', () => {
    render(
      <CometChatThreadView.Root replyCount={3} onClick={() => {}}>
        <CometChatThreadView.ReplyCount />
        <CometChatThreadView.Icon />
      </CometChatThreadView.Root>
    );
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <CometChatThreadView.Root replyCount={2} onClick={onClick}>
        <CometChatThreadView.ReplyCount />
      </CometChatThreadView.Root>
    );
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('calls onClick when Enter key is pressed', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <CometChatThreadView.Root replyCount={2} onClick={onClick}>
        <CometChatThreadView.ReplyCount />
      </CometChatThreadView.Root>
    );
    screen.getByRole('button').focus();
    await user.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('calls onClick when Space key is pressed', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <CometChatThreadView.Root replyCount={2} onClick={onClick}>
        <CometChatThreadView.ReplyCount />
      </CometChatThreadView.Root>
    );
    screen.getByRole('button').focus();
    await user.keyboard(' ');
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('renders as a <button> element', () => {
    render(
      <CometChatThreadView.Root replyCount={1} onClick={() => {}}>
        <CometChatThreadView.ReplyCount />
      </CometChatThreadView.Root>
    );
    const btn = screen.getByRole('button');
    expect(btn.tagName).toBe('BUTTON');
  });

  it('sets aria-label with singular text for 1 reply', () => {
    render(
      <CometChatThreadView.Root replyCount={1} onClick={() => {}}>
        <CometChatThreadView.ReplyCount />
      </CometChatThreadView.Root>
    );
    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-label',
      '1 thread_view_reply, view thread'
    );
  });

  it('sets aria-label with plural text for multiple replies', () => {
    render(
      <CometChatThreadView.Root replyCount={5} onClick={() => {}}>
        <CometChatThreadView.ReplyCount />
      </CometChatThreadView.Root>
    );
    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-label',
      '5 thread_view_replies, view thread'
    );
  });

  it('sets aria-label with 999+ for counts over 999', () => {
    render(
      <CometChatThreadView.Root replyCount={1500} onClick={() => {}}>
        <CometChatThreadView.ReplyCount />
      </CometChatThreadView.Root>
    );
    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-label',
      '999+ thread_view_replies, view thread'
    );
  });

  it('includes unread count in aria-label when unreadReplyCount > 0', () => {
    render(
      <CometChatThreadView.Root replyCount={5} unreadReplyCount={2} onClick={() => {}}>
        <CometChatThreadView.ReplyCount />
      </CometChatThreadView.Root>
    );
    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-label',
      '5 thread_view_replies, view thread, 2 unread'
    );
  });

  it('applies alignment="right" modifier class by default', () => {
    render(
      <CometChatThreadView.Root replyCount={1} onClick={() => {}}>
        <CometChatThreadView.ReplyCount />
      </CometChatThreadView.Root>
    );
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('right');
  });

  it('applies alignment="left" modifier class when specified', () => {
    render(
      <CometChatThreadView.Root replyCount={1} alignment="left" onClick={() => {}}>
        <CometChatThreadView.ReplyCount />
      </CometChatThreadView.Root>
    );
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('left');
  });

  it('applies --unread modifier class when unreadReplyCount > 0', () => {
    render(
      <CometChatThreadView.Root replyCount={3} unreadReplyCount={1} onClick={() => {}}>
        <CometChatThreadView.ReplyCount />
      </CometChatThreadView.Root>
    );
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('unread');
  });

  it('does not apply --unread modifier when unreadReplyCount is 0', () => {
    render(
      <CometChatThreadView.Root replyCount={3} unreadReplyCount={0} onClick={() => {}}>
        <CometChatThreadView.ReplyCount />
      </CometChatThreadView.Root>
    );
    const btn = screen.getByRole('button');
    expect(btn.className).not.toContain('unread');
  });

  it('applies custom className to root container', () => {
    render(
      <CometChatThreadView.Root replyCount={1} className="my-custom" onClick={() => {}}>
        <CometChatThreadView.ReplyCount />
      </CometChatThreadView.Root>
    );
    expect(screen.getByRole('button').className).toContain('my-custom');
  });

  it('renders default sub-components (Icon + ReplyCount + UnreadIndicator) when no children', () => {
    render(<CometChatThreadView.Root replyCount={3} unreadReplyCount={1} onClick={() => {}} />);
    expect(screen.getByText('3 Replies')).toBeInTheDocument();
    // Unread indicator should be present
    const btn = screen.getByRole('button');
    expect(btn.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('renders default sub-components without unread indicator when unreadReplyCount is 0', () => {
    render(<CometChatThreadView.Root replyCount={3} onClick={() => {}} />);
    expect(screen.getByText('3 Replies')).toBeInTheDocument();
  });
});
