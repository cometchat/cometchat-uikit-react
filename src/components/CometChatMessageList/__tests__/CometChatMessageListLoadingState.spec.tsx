import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CometChatMessageListLoadingState } from '../CometChatMessageListLoadingState';
import { MockMessageListProvider } from './helpers/mockMessageListContext';

describe('CometChatMessageListLoadingState', () => {
  it('renders the default shimmer skeleton with role="status" when isLoading', () => {
    render(
      <MockMessageListProvider overrides={{ isLoading: true }}>
        <CometChatMessageListLoadingState />
      </MockMessageListProvider>
    );
    expect(screen.getByRole('status', { name: 'Loading messages' })).toBeInTheDocument();
  });

  it('renders more than one shimmer row in the default skeleton', () => {
    const { container } = render(
      <MockMessageListProvider overrides={{ isLoading: true }}>
        <CometChatMessageListLoadingState />
      </MockMessageListProvider>
    );
    const shimmerBodies = container.querySelectorAll('[class*="shimmer-body"]');
    expect(shimmerBodies.length).toBeGreaterThan(1);
  });

  it('renders custom children when provided', () => {
    render(
      <MockMessageListProvider overrides={{ isLoading: true }}>
        <CometChatMessageListLoadingState>
          <span data-testid="custom-loading">Loading…</span>
        </CometChatMessageListLoadingState>
      </MockMessageListProvider>
    );
    expect(screen.getByTestId('custom-loading')).toBeInTheDocument();
  });

  it('renders nothing when isLoading is false', () => {
    const { container } = render(
      <MockMessageListProvider overrides={{ isLoading: false }}>
        <CometChatMessageListLoadingState />
      </MockMessageListProvider>
    );
    expect(container.innerHTML).toBe('');
  });

  it('has the correct display name', () => {
    expect(CometChatMessageListLoadingState.displayName).toBe('CometChatMessageListLoadingState');
  });
});
