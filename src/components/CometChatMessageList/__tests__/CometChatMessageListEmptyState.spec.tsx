import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CometChatMessageListEmptyState } from '../CometChatMessageListEmptyState';
import { MockMessageListProvider } from './helpers/mockMessageListContext';

describe('CometChatMessageListEmptyState', () => {
  it('renders with role="status" when isEmpty is true', () => {
    render(
      <MockMessageListProvider overrides={{ isEmpty: true }}>
        <CometChatMessageListEmptyState />
      </MockMessageListProvider>
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders children inside the status container', () => {
    render(
      <MockMessageListProvider overrides={{ isEmpty: true }}>
        <CometChatMessageListEmptyState>
          <span data-testid="empty-slot">No messages yet</span>
        </CometChatMessageListEmptyState>
      </MockMessageListProvider>
    );
    expect(screen.getByTestId('empty-slot')).toHaveTextContent('No messages yet');
  });

  it('is empty when no children are provided', () => {
    const { container } = render(
      <MockMessageListProvider overrides={{ isEmpty: true }}>
        <CometChatMessageListEmptyState />
      </MockMessageListProvider>
    );
    const root = container.querySelector('[role="status"]');
    expect(root?.childElementCount).toBe(0);
  });

  it('renders nothing when isEmpty is false', () => {
    const { container } = render(
      <MockMessageListProvider overrides={{ isEmpty: false }}>
        <CometChatMessageListEmptyState />
      </MockMessageListProvider>
    );
    expect(container.innerHTML).toBe('');
  });

  it('has the correct display name', () => {
    expect(CometChatMessageListEmptyState.displayName).toBe('CometChatMessageListEmptyState');
  });
});
