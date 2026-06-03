import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CometChatSmartReplies } from '../CometChatSmartReplies';

describe('CometChatSmartRepliesLoading', () => {
  it('renders 3 shimmer items by default', () => {
    const getReplies = vi.fn(() => new Promise<string[]>(() => {}));
    render(
      <CometChatSmartReplies.Root getSmartReplies={getReplies}>
        <CometChatSmartReplies.Loading />
      </CometChatSmartReplies.Root>
    );
    const shimmers = document.querySelectorAll('[class*="cometchat-smart-replies__shimmer-item"]');
    expect(shimmers.length).toBe(3);
  });

  it('renders custom count of shimmer items when specified', () => {
    const getReplies = vi.fn(() => new Promise<string[]>(() => {}));
    render(
      <CometChatSmartReplies.Root getSmartReplies={getReplies}>
        <CometChatSmartReplies.Loading count={5} />
      </CometChatSmartReplies.Root>
    );
    const shimmers = document.querySelectorAll('[class*="cometchat-smart-replies__shimmer-item"]');
    expect(shimmers.length).toBe(5);
  });

  it('renders custom children when provided', () => {
    const getReplies = vi.fn(() => new Promise<string[]>(() => {}));
    render(
      <CometChatSmartReplies.Root getSmartReplies={getReplies}>
        <CometChatSmartReplies.Loading>
          <div data-testid="custom-loading">Custom loading...</div>
        </CometChatSmartReplies.Loading>
      </CometChatSmartReplies.Root>
    );
    expect(screen.getByTestId('custom-loading')).toBeInTheDocument();
  });

  it('only renders when context state is loading', async () => {
    const getReplies = vi.fn(() => Promise.resolve(['Hello']));
    const { container } = render(
      <CometChatSmartReplies.Root getSmartReplies={getReplies}>
        <CometChatSmartReplies.Loading />
      </CometChatSmartReplies.Root>
    );
    // Wait for loaded state
    await screen.findByText('Hello');
    const shimmers = container.querySelectorAll('[class*="cometchat-smart-replies__shimmer-item"]');
    expect(shimmers.length).toBe(0);
  });

  it('shimmer items have aria-hidden="true"', () => {
    const getReplies = vi.fn(() => new Promise<string[]>(() => {}));
    render(
      <CometChatSmartReplies.Root getSmartReplies={getReplies}>
        <CometChatSmartReplies.Loading />
      </CometChatSmartReplies.Root>
    );
    const shimmers = document.querySelectorAll('[class*="cometchat-smart-replies__shimmer-item"]');
    shimmers.forEach(shimmer => {
      expect(shimmer).toHaveAttribute('aria-hidden', 'true');
    });
  });
});
