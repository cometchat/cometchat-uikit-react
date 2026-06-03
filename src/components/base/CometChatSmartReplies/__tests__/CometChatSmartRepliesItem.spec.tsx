import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { CometChatSmartReplies } from '../CometChatSmartReplies';

describe('CometChatSmartRepliesItem', () => {
  it('renders the reply text inside a <button>', async () => {
    const getReplies = vi.fn(() => Promise.resolve(['Hello']));
    render(
      <CometChatSmartReplies.Root getSmartReplies={getReplies}>
        <CometChatSmartReplies.Loading />
      </CometChatSmartReplies.Root>
    );
    await waitFor(() => {
      const button = screen.getByRole('button', { name: 'Hello' });
      expect(button).toBeInTheDocument();
      expect(button.tagName).toBe('BUTTON');
    });
  });

  it('calls onSuggestionClick with the reply string when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const getReplies = vi.fn(() => Promise.resolve(['Click me']));
    render(
      <CometChatSmartReplies.Root getSmartReplies={getReplies} onSuggestionClick={onClick}>
        <CometChatSmartReplies.Loading />
      </CometChatSmartReplies.Root>
    );
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: 'Click me' }));
    expect(onClick).toHaveBeenCalledWith('Click me');
  });

  it('renders as a native button element with type="button"', async () => {
    const getReplies = vi.fn(() => Promise.resolve(['Test']));
    render(
      <CometChatSmartReplies.Root getSmartReplies={getReplies}>
        <CometChatSmartReplies.Loading />
      </CometChatSmartReplies.Root>
    );
    await waitFor(() => {
      const button = screen.getByRole('button', { name: 'Test' });
      expect(button).toHaveAttribute('type', 'button');
    });
  });

  it('renders multiple items for multiple replies', async () => {
    const getReplies = vi.fn(() => Promise.resolve(['A', 'B', 'C']));
    render(
      <CometChatSmartReplies.Root getSmartReplies={getReplies}>
        <CometChatSmartReplies.Loading />
      </CometChatSmartReplies.Root>
    );
    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(3);
      expect(buttons[0]).toHaveTextContent('A');
      expect(buttons[1]).toHaveTextContent('B');
      expect(buttons[2]).toHaveTextContent('C');
    });
  });

  it('does not throw when onSuggestionClick is not provided', async () => {
    const user = userEvent.setup();
    const getReplies = vi.fn(() => Promise.resolve(['Safe']));
    render(
      <CometChatSmartReplies.Root getSmartReplies={getReplies}>
        <CometChatSmartReplies.Loading />
      </CometChatSmartReplies.Root>
    );
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Safe' })).toBeInTheDocument();
    });
    // Should not throw
    await user.click(screen.getByRole('button', { name: 'Safe' }));
  });
});
