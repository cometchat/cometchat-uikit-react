import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CometChatThreadView } from '../CometChatThreadView';

describe('CometChatThreadViewReplyCount', () => {
  it('renders formatted reply count text for plural', () => {
    render(
      <CometChatThreadView.Root replyCount={3} onClick={() => {}}>
        <CometChatThreadView.ReplyCount />
      </CometChatThreadView.Root>
    );
    expect(screen.getByText('3 Replies')).toBeInTheDocument();
  });

  it('renders singular text for 1 reply', () => {
    render(
      <CometChatThreadView.Root replyCount={1} onClick={() => {}}>
        <CometChatThreadView.ReplyCount />
      </CometChatThreadView.Root>
    );
    expect(screen.getByText('1 Reply')).toBeInTheDocument();
  });

  it('renders 999+ for counts over 999', () => {
    render(
      <CometChatThreadView.Root replyCount={1500} onClick={() => {}}>
        <CometChatThreadView.ReplyCount />
      </CometChatThreadView.Root>
    );
    expect(screen.getByText('999+ Replies')).toBeInTheDocument();
  });

  it('renders custom text when provided', () => {
    render(
      <CometChatThreadView.Root replyCount={5} onClick={() => {}}>
        <CometChatThreadView.ReplyCount text="View thread" />
      </CometChatThreadView.Root>
    );
    expect(screen.getByText('View thread')).toBeInTheDocument();
  });

  it('reads replyCount from context when no text override', () => {
    render(
      <CometChatThreadView.Root replyCount={42} onClick={() => {}}>
        <CometChatThreadView.ReplyCount />
      </CometChatThreadView.Root>
    );
    expect(screen.getByText('42 Replies')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <CometChatThreadView.Root replyCount={1} onClick={() => {}}>
        <CometChatThreadView.ReplyCount className="custom-count" />
      </CometChatThreadView.Root>
    );
    const span = screen.getByText('1 Reply');
    expect(span.className).toContain('custom-count');
  });
});
