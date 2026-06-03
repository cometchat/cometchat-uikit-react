import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import { CometChatSmartReplies } from '../CometChatSmartReplies';

expect.extend(toHaveNoViolations);

describe('CometChatSmartReplies accessibility', () => {
  it('passes axe-core audit in loading state', async () => {
    const getReplies = vi.fn(() => new Promise<string[]>(() => {}));
    const { container } = render(
      <CometChatSmartReplies.Root getSmartReplies={getReplies}>
        <CometChatSmartReplies.Header />
        <CometChatSmartReplies.Loading />
      </CometChatSmartReplies.Root>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('passes axe-core audit in loaded state', async () => {
    const getReplies = vi.fn(() => Promise.resolve(['Hello', 'World']));
    const { container } = render(
      <CometChatSmartReplies.Root getSmartReplies={getReplies}>
        <CometChatSmartReplies.Header />
        <CometChatSmartReplies.Loading />
      </CometChatSmartReplies.Root>
    );
    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('passes axe-core audit in error state', async () => {
    const getReplies = vi.fn(() => Promise.reject(new Error('fail')));
    const { container } = render(
      <CometChatSmartReplies.Root getSmartReplies={getReplies}>
        <CometChatSmartReplies.Header />
        <CometChatSmartReplies.Error message="Error occurred" />
      </CometChatSmartReplies.Root>
    );
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('all suggestion buttons are focusable via Tab key', async () => {
    const user = userEvent.setup();
    const getReplies = vi.fn(() => Promise.resolve(['A', 'B', 'C']));
    render(
      <CometChatSmartReplies.Root getSmartReplies={getReplies}>
        <CometChatSmartReplies.Loading />
      </CometChatSmartReplies.Root>
    );
    await waitFor(() => {
      expect(screen.getByText('A')).toBeInTheDocument();
    });

    await user.tab();
    expect(screen.getByText('A')).toHaveFocus();
    await user.tab();
    expect(screen.getByText('B')).toHaveFocus();
    await user.tab();
    expect(screen.getByText('C')).toHaveFocus();
  });

  it('Enter key activates the focused suggestion button', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const getReplies = vi.fn(() => Promise.resolve(['Test']));
    render(
      <CometChatSmartReplies.Root getSmartReplies={getReplies} onSuggestionClick={onClick}>
        <CometChatSmartReplies.Loading />
      </CometChatSmartReplies.Root>
    );
    await waitFor(() => {
      expect(screen.getByText('Test')).toBeInTheDocument();
    });
    await user.tab();
    await user.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledWith('Test');
  });

  it('Space key activates the focused suggestion button', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const getReplies = vi.fn(() => Promise.resolve(['Test']));
    render(
      <CometChatSmartReplies.Root getSmartReplies={getReplies} onSuggestionClick={onClick}>
        <CometChatSmartReplies.Loading />
      </CometChatSmartReplies.Root>
    );
    await waitFor(() => {
      expect(screen.getByText('Test')).toBeInTheDocument();
    });
    await user.tab();
    await user.keyboard(' ');
    expect(onClick).toHaveBeenCalledWith('Test');
  });

  it('error state is announced via role="alert"', async () => {
    const getReplies = vi.fn(() => Promise.reject(new Error('fail')));
    render(
      <CometChatSmartReplies.Root getSmartReplies={getReplies}>
        <CometChatSmartReplies.Error message="Error" />
      </CometChatSmartReplies.Root>
    );
    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });
  });

  it('root has aria-live="polite" for state transition announcements', () => {
    const getReplies = vi.fn(() => new Promise<string[]>(() => {}));
    render(
      <CometChatSmartReplies.Root getSmartReplies={getReplies}>
        <CometChatSmartReplies.Loading />
      </CometChatSmartReplies.Root>
    );
    const root = screen.getByRole('region');
    expect(root).toHaveAttribute('aria-live', 'polite');
  });

  it('close button has aria-label', () => {
    const getReplies = vi.fn(() => new Promise<string[]>(() => {}));
    render(
      <CometChatSmartReplies.Root getSmartReplies={getReplies}>
        <CometChatSmartReplies.Header />
        <CometChatSmartReplies.Loading />
      </CometChatSmartReplies.Root>
    );
    const closeBtn = screen.getByLabelText('Close smart replies');
    expect(closeBtn).toBeInTheDocument();
  });

  it('retry button has aria-label', async () => {
    const getReplies = vi.fn(() => Promise.reject(new Error('fail')));
    render(
      <CometChatSmartReplies.Root getSmartReplies={getReplies}>
        <CometChatSmartReplies.Error />
      </CometChatSmartReplies.Root>
    );
    await waitFor(() => {
      const retryBtn = screen.getByLabelText('Retry loading smart replies');
      expect(retryBtn).toBeInTheDocument();
    });
  });
});
