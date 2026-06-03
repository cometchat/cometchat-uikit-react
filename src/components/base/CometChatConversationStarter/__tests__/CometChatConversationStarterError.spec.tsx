import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { CometChatConversationStarter } from '../CometChatConversationStarter';

describe('CometChatConversationStarterError', () => {
  it('renders default error message', async () => {
    const getStarters = vi.fn(() => Promise.reject(new Error('fail')));
    render(
      <CometChatConversationStarter.Root getConversationStarters={getStarters}>
        <CometChatConversationStarter.Error />
      </CometChatConversationStarter.Root>
    );
    await waitFor(() => {
      expect(screen.getByText('Failed to load conversation starters.')).toBeInTheDocument();
    });
  });

  it('renders custom message when provided', async () => {
    const getStarters = vi.fn(() => Promise.reject(new Error('fail')));
    render(
      <CometChatConversationStarter.Root getConversationStarters={getStarters}>
        <CometChatConversationStarter.Error message="Custom error" />
      </CometChatConversationStarter.Root>
    );
    await waitFor(() => {
      expect(screen.getByText('Custom error')).toBeInTheDocument();
    });
  });

  it('renders custom children when provided', async () => {
    const getStarters = vi.fn(() => Promise.reject(new Error('fail')));
    render(
      <CometChatConversationStarter.Root getConversationStarters={getStarters}>
        <CometChatConversationStarter.Error>
          <div data-testid="custom-error">Custom error view</div>
        </CometChatConversationStarter.Error>
      </CometChatConversationStarter.Root>
    );
    await waitFor(() => {
      expect(screen.getByTestId('custom-error')).toBeInTheDocument();
    });
  });

  it('calls onRetry when retry button is clicked', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const getStarters = vi.fn(() => Promise.reject(new Error('fail')));
    render(
      <CometChatConversationStarter.Root getConversationStarters={getStarters}>
        <CometChatConversationStarter.Error onRetry={onRetry} />
      </CometChatConversationStarter.Root>
    );
    await waitFor(() => {
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Retry'));
    expect(onRetry).toHaveBeenCalled();
  });

  it('has role="alert" on the error container', async () => {
    const getStarters = vi.fn(() => Promise.reject(new Error('fail')));
    render(
      <CometChatConversationStarter.Root getConversationStarters={getStarters}>
        <CometChatConversationStarter.Error />
      </CometChatConversationStarter.Root>
    );
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('only renders when context state is error', () => {
    const getStarters = vi.fn(() => new Promise<string[]>(() => {}));
    render(
      <CometChatConversationStarter.Root getConversationStarters={getStarters}>
        <CometChatConversationStarter.Error message="Error" />
      </CometChatConversationStarter.Root>
    );
    // During loading, error should not be visible
    expect(screen.queryByText('Error')).not.toBeInTheDocument();
  });
});
