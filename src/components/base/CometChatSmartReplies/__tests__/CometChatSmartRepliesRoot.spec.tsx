import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { CometChatSmartReplies } from '../CometChatSmartReplies';

describe('CometChatSmartRepliesRoot', () => {
  it('renders loading state initially when getSmartReplies is provided', () => {
    const getReplies = vi.fn(() => new Promise<string[]>(() => {}));
    render(
      <CometChatSmartReplies.Root getSmartReplies={getReplies}>
        <CometChatSmartReplies.Loading />
      </CometChatSmartReplies.Root>
    );
    const shimmers = document.querySelectorAll('[class*="cometchat-smart-replies__shimmer-item"]');
    expect(shimmers.length).toBe(3);
  });

  it('transitions to loaded state after getSmartReplies resolves with data', async () => {
    const replies = ['Sure!', 'Thanks', 'Got it'];
    const getReplies = vi.fn(() => Promise.resolve(replies));
    render(
      <CometChatSmartReplies.Root getSmartReplies={getReplies}>
        <CometChatSmartReplies.Loading />
      </CometChatSmartReplies.Root>
    );
    await waitFor(() => {
      expect(screen.getByText('Sure!')).toBeInTheDocument();
    });
    expect(screen.getByText('Thanks')).toBeInTheDocument();
    expect(screen.getByText('Got it')).toBeInTheDocument();
  });

  it('transitions to empty state when getSmartReplies resolves with empty array', async () => {
    const getReplies = vi.fn(() => Promise.resolve([]));
    render(
      <CometChatSmartReplies.Root getSmartReplies={getReplies}>
        <CometChatSmartReplies.Loading />
        <CometChatSmartReplies.Empty message="No suggestions" />
      </CometChatSmartReplies.Root>
    );
    await waitFor(() => {
      expect(screen.getByText('No suggestions')).toBeInTheDocument();
    });
  });

  it('transitions to error state when getSmartReplies rejects', async () => {
    const getReplies = vi.fn(() => Promise.reject(new Error('fail')));
    render(
      <CometChatSmartReplies.Root getSmartReplies={getReplies}>
        <CometChatSmartReplies.Loading />
        <CometChatSmartReplies.Error message="Something went wrong" />
      </CometChatSmartReplies.Root>
    );
    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  it('renders suggestion buttons for each returned string', async () => {
    const replies = ['A', 'B', 'C'];
    const getReplies = vi.fn(() => Promise.resolve(replies));
    render(
      <CometChatSmartReplies.Root getSmartReplies={getReplies}>
        <CometChatSmartReplies.Loading />
      </CometChatSmartReplies.Root>
    );
    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(3);
    });
  });

  it('calls onSuggestionClick with the correct reply string when a button is clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const getReplies = vi.fn(() => Promise.resolve(['Click me']));
    render(
      <CometChatSmartReplies.Root getSmartReplies={getReplies} onSuggestionClick={onClick}>
        <CometChatSmartReplies.Loading />
      </CometChatSmartReplies.Root>
    );
    await waitFor(() => {
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Click me'));
    expect(onClick).toHaveBeenCalledWith('Click me');
  });

  it('applies custom className to root container', () => {
    const getReplies = vi.fn(() => new Promise<string[]>(() => {}));
    render(
      <CometChatSmartReplies.Root getSmartReplies={getReplies} className="custom-class">
        <CometChatSmartReplies.Loading />
      </CometChatSmartReplies.Root>
    );
    const root = screen.getByRole('region');
    expect(root.className).toContain('custom-class');
  });

  it('sets aria-busy="true" during loading state', () => {
    const getReplies = vi.fn(() => new Promise<string[]>(() => {}));
    render(
      <CometChatSmartReplies.Root getSmartReplies={getReplies}>
        <CometChatSmartReplies.Loading />
      </CometChatSmartReplies.Root>
    );
    const root = screen.getByRole('region');
    expect(root).toHaveAttribute('aria-busy', 'true');
  });

  it('sets aria-live="polite" on root container', () => {
    const getReplies = vi.fn(() => new Promise<string[]>(() => {}));
    render(
      <CometChatSmartReplies.Root getSmartReplies={getReplies}>
        <CometChatSmartReplies.Loading />
      </CometChatSmartReplies.Root>
    );
    const root = screen.getByRole('region');
    expect(root).toHaveAttribute('aria-live', 'polite');
  });

  it('calls onClose when Escape key is pressed', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const getReplies = vi.fn(() => Promise.resolve(['Reply']));
    render(
      <CometChatSmartReplies.Root getSmartReplies={getReplies} onClose={onClose}>
        <CometChatSmartReplies.Loading />
      </CometChatSmartReplies.Root>
    );
    await waitFor(() => {
      expect(screen.getByText('Reply')).toBeInTheDocument();
    });
    const root = screen.getByRole('region');
    root.focus();
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  it('supports retry via retry() context method', async () => {
    let callCount = 0;
    const getReplies = vi.fn(() => {
      callCount++;
      if (callCount === 1) return Promise.reject(new Error('fail'));
      return Promise.resolve(['Retried']);
    });

    render(
      <CometChatSmartReplies.Root getSmartReplies={getReplies}>
        <CometChatSmartReplies.Loading />
        <CometChatSmartReplies.Error message="Error" />
      </CometChatSmartReplies.Root>
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

  it('renders default sub-components when no children are provided', async () => {
    const getReplies = vi.fn(() => Promise.resolve(['Hello']));
    render(<CometChatSmartReplies.Root getSmartReplies={getReplies} />);
    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });
    // Default header should render
    expect(screen.getByText('Suggest a reply')).toBeInTheDocument();
  });
});
