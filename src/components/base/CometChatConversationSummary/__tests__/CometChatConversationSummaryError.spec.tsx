import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { CometChatConversationSummary } from '../CometChatConversationSummary';

describe('CometChatConversationSummaryError', () => {
  it('renders default error message', async () => {
    render(
      <CometChatConversationSummary.Root
        getConversationSummary={() => Promise.reject(new Error('fail'))}
      >
        <CometChatConversationSummary.Error />
      </CometChatConversationSummary.Root>
    );
    await waitFor(() => {
      expect(screen.getByText('Looks like something went wrong')).toBeInTheDocument();
    });
  });

  it('renders custom message when provided', async () => {
    render(
      <CometChatConversationSummary.Root
        getConversationSummary={() => Promise.reject(new Error('fail'))}
      >
        <CometChatConversationSummary.Error message="Custom error" />
      </CometChatConversationSummary.Root>
    );
    await waitFor(() => {
      expect(screen.getByText('Custom error')).toBeInTheDocument();
    });
  });

  it('renders custom children when provided', async () => {
    render(
      <CometChatConversationSummary.Root
        getConversationSummary={() => Promise.reject(new Error('fail'))}
      >
        <CometChatConversationSummary.Error>
          <span>Custom error view</span>
        </CometChatConversationSummary.Error>
      </CometChatConversationSummary.Root>
    );
    await waitFor(() => {
      expect(screen.getByText('Custom error view')).toBeInTheDocument();
    });
  });

  it('calls onRetry when retry button is clicked', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(
      <CometChatConversationSummary.Root
        getConversationSummary={() => Promise.reject(new Error('fail'))}
      >
        <CometChatConversationSummary.Error onRetry={onRetry} />
      </CometChatConversationSummary.Root>
    );
    await waitFor(() => {
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Retry'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('falls back to context retry when onRetry is not provided', async () => {
    let callCount = 0;
    const getSummary = vi.fn(() => {
      callCount++;
      if (callCount === 1) return Promise.reject(new Error('fail'));
      return Promise.resolve('Recovered');
    });

    render(
      <CometChatConversationSummary.Root getConversationSummary={getSummary}>
        <CometChatConversationSummary.Error />
        <CometChatConversationSummary.Body />
      </CometChatConversationSummary.Root>
    );

    await waitFor(() => {
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    await userEvent.setup().click(screen.getByText('Retry'));

    await waitFor(() => {
      expect(screen.getByText('Recovered')).toBeInTheDocument();
    });
  });

  it('has role="alert" on the error container', async () => {
    render(
      <CometChatConversationSummary.Root
        getConversationSummary={() => Promise.reject(new Error('fail'))}
      >
        <CometChatConversationSummary.Error />
      </CometChatConversationSummary.Root>
    );
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('only renders when context state is error', () => {
    render(
      <CometChatConversationSummary.Root
        getConversationSummary={() => new Promise<string>(() => {})}
      >
        <CometChatConversationSummary.Error message="Error" />
      </CometChatConversationSummary.Root>
    );
    expect(screen.queryByText('Error')).not.toBeInTheDocument();
  });
});
