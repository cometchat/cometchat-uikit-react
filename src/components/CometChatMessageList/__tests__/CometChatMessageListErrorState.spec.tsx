import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CometChatMessageListErrorState } from '../CometChatMessageListErrorState';
import { MockMessageListProvider } from './helpers/mockMessageListContext';

describe('CometChatMessageListErrorState', () => {
  it('renders the default icon + text + retry button when isError', () => {
    render(
      <MockMessageListProvider overrides={{ isError: true }}>
        <CometChatMessageListErrorState />
      </MockMessageListProvider>
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders a retry button that calls onRetry when clicked', () => {
    const onRetry = vi.fn();
    render(
      <MockMessageListProvider overrides={{ isError: true }}>
        <CometChatMessageListErrorState onRetry={onRetry} />
      </MockMessageListProvider>
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('calls fetchPrevious as default retry when onRetry is not provided', () => {
    const fetchPrevious = vi.fn().mockResolvedValue(undefined);
    render(
      <MockMessageListProvider overrides={{ isError: true, fetchPrevious }}>
        <CometChatMessageListErrorState />
      </MockMessageListProvider>
    );
    fireEvent.click(screen.getByRole('button'));
    expect(fetchPrevious).toHaveBeenCalledOnce();
  });

  it('renders children instead of the default content when provided', () => {
    render(
      <MockMessageListProvider overrides={{ isError: true }}>
        <CometChatMessageListErrorState>
          <span data-testid="custom-error">Custom error</span>
        </CometChatMessageListErrorState>
      </MockMessageListProvider>
    );
    expect(screen.getByTestId('custom-error')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders nothing when isError is false', () => {
    const { container } = render(
      <MockMessageListProvider overrides={{ isError: false }}>
        <CometChatMessageListErrorState />
      </MockMessageListProvider>
    );
    expect(container.innerHTML).toBe('');
  });

  it('has the correct display name', () => {
    expect(CometChatMessageListErrorState.displayName).toBe('CometChatMessageListErrorState');
  });
});
