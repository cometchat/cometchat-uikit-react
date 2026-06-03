import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CometChatConversationStarter } from '../CometChatConversationStarter';

describe('CometChatConversationStarterLoading', () => {
  it('renders 3 shimmer items by default', () => {
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

  it('renders custom count of shimmer items when specified', () => {
    const getStarters = vi.fn(() => new Promise<string[]>(() => {}));
    render(
      <CometChatConversationStarter.Root getConversationStarters={getStarters}>
        <CometChatConversationStarter.Loading count={5} />
      </CometChatConversationStarter.Root>
    );
    const shimmers = document.querySelectorAll(
      '[class*="cometchat-conversation-starter__shimmer-item"]'
    );
    expect(shimmers.length).toBe(5);
  });

  it('renders custom children when provided', () => {
    const getStarters = vi.fn(() => new Promise<string[]>(() => {}));
    render(
      <CometChatConversationStarter.Root getConversationStarters={getStarters}>
        <CometChatConversationStarter.Loading>
          <div data-testid="custom-loading">Custom loading...</div>
        </CometChatConversationStarter.Loading>
      </CometChatConversationStarter.Root>
    );
    expect(screen.getByTestId('custom-loading')).toBeInTheDocument();
  });

  it('only renders when context state is loading', async () => {
    const getStarters = vi.fn(() => Promise.resolve(['Hello']));
    const { container } = render(
      <CometChatConversationStarter.Root getConversationStarters={getStarters}>
        <CometChatConversationStarter.Loading />
      </CometChatConversationStarter.Root>
    );
    // Wait for loaded state
    await screen.findByText('Hello');
    const shimmers = container.querySelectorAll(
      '[class*="cometchat-conversation-starter__shimmer-item"]'
    );
    expect(shimmers.length).toBe(0);
  });
});
