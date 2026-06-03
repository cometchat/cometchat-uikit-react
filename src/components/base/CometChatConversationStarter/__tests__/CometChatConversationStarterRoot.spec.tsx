import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { CometChatConversationStarter } from '../CometChatConversationStarter';

describe('CometChatConversationStarterRoot', () => {
  it('renders loading state initially when getConversationStarters is provided', () => {
    const getStarters = vi.fn(() => new Promise<string[]>(() => {}));
    render(
      <CometChatConversationStarter.Root getConversationStarters={getStarters}>
        <CometChatConversationStarter.Loading />
      </CometChatConversationStarter.Root>
    );
    const shimmers = document.querySelectorAll(
      '[class*="cometchat-conversation-starter__shimmer-item"]'
    );
    expect(shimmers.length).toBe(3);
  });

  it('transitions to loaded state after getConversationStarters resolves with data', async () => {
    const suggestions = ['Hello', 'How are you?', 'Nice day'];
    const getStarters = vi.fn(() => Promise.resolve(suggestions));
    render(
      <CometChatConversationStarter.Root getConversationStarters={getStarters}>
        <CometChatConversationStarter.Loading />
      </CometChatConversationStarter.Root>
    );
    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });
    expect(screen.getByText('How are you?')).toBeInTheDocument();
    expect(screen.getByText('Nice day')).toBeInTheDocument();
  });

  it('transitions to empty state when getConversationStarters resolves with empty array', async () => {
    const getStarters = vi.fn(() => Promise.resolve([]));
    render(
      <CometChatConversationStarter.Root getConversationStarters={getStarters}>
        <CometChatConversationStarter.Loading />
        <CometChatConversationStarter.Empty message="No suggestions" />
      </CometChatConversationStarter.Root>
    );
    await waitFor(() => {
      expect(screen.getByText('No suggestions')).toBeInTheDocument();
    });
  });

  it('transitions to error state when getConversationStarters rejects', async () => {
    const getStarters = vi.fn(() => Promise.reject(new Error('fail')));
    render(
      <CometChatConversationStarter.Root getConversationStarters={getStarters}>
        <CometChatConversationStarter.Loading />
        <CometChatConversationStarter.Error message="Something went wrong" />
      </CometChatConversationStarter.Root>
    );
    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  it('renders suggestion buttons for each returned string', async () => {
    const suggestions = ['A', 'B', 'C'];
    const getStarters = vi.fn(() => Promise.resolve(suggestions));
    render(
      <CometChatConversationStarter.Root getConversationStarters={getStarters}>
        <CometChatConversationStarter.Loading />
      </CometChatConversationStarter.Root>
    );
    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(3);
    });
  });

  it('calls onSuggestionClick with the correct suggestion string when a button is clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const getStarters = vi.fn(() => Promise.resolve(['Click me']));
    render(
      <CometChatConversationStarter.Root
        getConversationStarters={getStarters}
        onSuggestionClick={onClick}
      >
        <CometChatConversationStarter.Loading />
      </CometChatConversationStarter.Root>
    );
    await waitFor(() => {
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Click me'));
    expect(onClick).toHaveBeenCalledWith('Click me');
  });

  it('applies custom className to root container', () => {
    const getStarters = vi.fn(() => new Promise<string[]>(() => {}));
    render(
      <CometChatConversationStarter.Root
        getConversationStarters={getStarters}
        className="custom-class"
      >
        <CometChatConversationStarter.Loading />
      </CometChatConversationStarter.Root>
    );
    const root = document.querySelector('[role="group"]');
    expect(root?.className).toContain('custom-class');
  });

  it('sets aria-busy="true" during loading state', () => {
    const getStarters = vi.fn(() => new Promise<string[]>(() => {}));
    render(
      <CometChatConversationStarter.Root getConversationStarters={getStarters}>
        <CometChatConversationStarter.Loading />
      </CometChatConversationStarter.Root>
    );
    const root = screen.getByRole('group');
    expect(root).toHaveAttribute('aria-busy', 'true');
  });

  it('sets aria-live="polite" on root container', () => {
    const getStarters = vi.fn(() => new Promise<string[]>(() => {}));
    render(
      <CometChatConversationStarter.Root getConversationStarters={getStarters}>
        <CometChatConversationStarter.Loading />
      </CometChatConversationStarter.Root>
    );
    const root = screen.getByRole('group');
    expect(root).toHaveAttribute('aria-live', 'polite');
  });

  it('supports retry via retry() context method', async () => {
    let callCount = 0;
    const getStarters = vi.fn(() => {
      callCount++;
      if (callCount === 1) return Promise.reject(new Error('fail'));
      return Promise.resolve(['Retried']);
    });

    render(
      <CometChatConversationStarter.Root getConversationStarters={getStarters}>
        <CometChatConversationStarter.Loading />
        <CometChatConversationStarter.Error message="Error" />
      </CometChatConversationStarter.Root>
    );

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    const retryBtn = screen.getByText('Retry');
    await userEvent.setup().click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText('Retried')).toBeInTheDocument();
    });
  });
});
