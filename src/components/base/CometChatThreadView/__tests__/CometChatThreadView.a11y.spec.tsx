import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import { CometChatThreadView } from '../CometChatThreadView';

vi.mock('../../../../context/locale/LocaleContext', () => ({
  useLocale: () => ({
    getLocalizedString: (key: string) => key,
    language: 'en-us',
  }),
}));

expect.extend(toHaveNoViolations);

describe('CometChatThreadView accessibility', () => {
  it('passes axe-core audit with zero violations', async () => {
    const { container } = render(
      <CometChatThreadView.Root replyCount={3} onClick={() => {}}>
        <CometChatThreadView.Icon />
        <CometChatThreadView.ReplyCount />
      </CometChatThreadView.Root>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('passes axe-core audit for single reply', async () => {
    const { container } = render(
      <CometChatThreadView.Root replyCount={1} onClick={() => {}}>
        <CometChatThreadView.Icon />
        <CometChatThreadView.ReplyCount />
      </CometChatThreadView.Root>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('passes axe-core audit with unread indicator', async () => {
    const { container } = render(
      <CometChatThreadView.Root replyCount={5} unreadReplyCount={2} onClick={() => {}}>
        <CometChatThreadView.Icon />
        <CometChatThreadView.ReplyCount />
        <CometChatThreadView.UnreadIndicator />
      </CometChatThreadView.Root>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('button has accessible name via aria-label', () => {
    render(
      <CometChatThreadView.Root replyCount={3} onClick={() => {}}>
        <CometChatThreadView.ReplyCount />
        <CometChatThreadView.Icon />
      </CometChatThreadView.Root>
    );
    expect(screen.getByLabelText('3 thread_view_replies, view thread')).toBeInTheDocument();
  });

  it('aria-label includes unread count when present', () => {
    render(
      <CometChatThreadView.Root replyCount={5} unreadReplyCount={2} onClick={() => {}}>
        <CometChatThreadView.ReplyCount />
      </CometChatThreadView.Root>
    );
    expect(
      screen.getByLabelText('5 thread_view_replies, view thread, 2 unread')
    ).toBeInTheDocument();
  });

  it('focus is visible on the button when focused via keyboard', async () => {
    const user = userEvent.setup();
    render(
      <CometChatThreadView.Root replyCount={2} onClick={() => {}}>
        <CometChatThreadView.ReplyCount />
        <CometChatThreadView.Icon />
      </CometChatThreadView.Root>
    );
    await user.tab();
    expect(screen.getByRole('button')).toHaveFocus();
  });

  it('Enter key activates the button', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <CometChatThreadView.Root replyCount={2} onClick={onClick}>
        <CometChatThreadView.ReplyCount />
      </CometChatThreadView.Root>
    );
    await user.tab();
    await user.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('Space key activates the button', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <CometChatThreadView.Root replyCount={2} onClick={onClick}>
        <CometChatThreadView.ReplyCount />
      </CometChatThreadView.Root>
    );
    await user.tab();
    await user.keyboard(' ');
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('icon is decorative (aria-hidden)', () => {
    render(
      <CometChatThreadView.Root replyCount={1} onClick={() => {}}>
        <CometChatThreadView.Icon />
      </CometChatThreadView.Root>
    );
    const icon = screen.getByRole('button').querySelector('[aria-hidden="true"]');
    expect(icon).toBeInTheDocument();
  });

  it('renders nothing when replyCount is 0 (no empty button)', () => {
    const { container } = render(
      <CometChatThreadView.Root replyCount={0} onClick={() => {}}>
        <CometChatThreadView.ReplyCount />
      </CometChatThreadView.Root>
    );
    expect(container.innerHTML).toBe('');
  });
});
