import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { CometChatSmartReplies } from '../CometChatSmartReplies';

describe('CometChatSmartRepliesError', () => {
  it('renders default error message', async () => {
    const getReplies = vi.fn(() => Promise.reject(new Error('fail')));
    render(
      <CometChatSmartReplies.Root getSmartReplies={getReplies}>
        <CometChatSmartReplies.Error />
      </CometChatSmartReplies.Root>
    );
    await waitFor(() => {
      expect(screen.getByText('Looks like something went wrong')).toBeInTheDocument();
    });
  });

  it('renders custom message when provided', async () => {
    const getReplies = vi.fn(() => Promise.reject(new Error('fail')));
    render(
      <CometChatSmartReplies.Root getSmartReplies={getReplies}>
        <CometChatSmartReplies.Error message="Custom error" />
      </CometChatSmartReplies.Root>
    );
    await waitFor(() => {
      expect(screen.getByText('Custom error')).toBeInTheDocument();
    });
  });

  it('renders custom children when provided', async () => {
    const getReplies = vi.fn(() => Promise.reject(new Error('fail')));
    render(
      <CometChatSmartReplies.Root getSmartReplies={getReplies}>
        <CometChatSmartReplies.Error>
          <div data-testid="custom-error">Custom error view</div>
        </CometChatSmartReplies.Error>
      </CometChatSmartReplies.Root>
    );
    await waitFor(() => {
      expect(screen.getByTestId('custom-error')).toBeInTheDocument();
    });
  });

  it('calls onRetry when retry button is clicked', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const getReplies = vi.fn(() => Promise.reject(new Error('fail')));
    render(
      <CometChatSmartReplies.Root getSmartReplies={getReplies}>
        <CometChatSmartReplies.Error onRetry={onRetry} />
      </CometChatSmartReplies.Root>
    );
    await waitFor(() => {
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Retry'));
    expect(onRetry).toHaveBeenCalled();
  });

  it('has role="alert" on the error container', async () => {
    const getReplies = vi.fn(() => Promise.reject(new Error('fail')));
    render(
      <CometChatSmartReplies.Root getSmartReplies={getReplies}>
        <CometChatSmartReplies.Error />
      </CometChatSmartReplies.Root>
    );
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('only renders when context state is error', () => {
    const getReplies = vi.fn(() => new Promise<string[]>(() => {}));
    render(
      <CometChatSmartReplies.Root getSmartReplies={getReplies}>
        <CometChatSmartReplies.Error message="Error" />
      </CometChatSmartReplies.Root>
    );
    // During loading, error should not be visible
    expect(screen.queryByText('Error')).not.toBeInTheDocument();
  });

  it('falls back to context retry when onRetry is not provided', async () => {
    let callCount = 0;
    const getReplies = vi.fn(() => {
      callCount++;
      if (callCount === 1) return Promise.reject(new Error('fail'));
      return Promise.resolve(['Recovered']);
    });
    render(
      <CometChatSmartReplies.Root getSmartReplies={getReplies}>
        <CometChatSmartReplies.Error />
      </CometChatSmartReplies.Root>
    );
    await waitFor(() => {
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
    await userEvent.setup().click(screen.getByText('Retry'));
    await waitFor(() => {
      expect(screen.getByText('Recovered')).toBeInTheDocument();
    });
  });
});
