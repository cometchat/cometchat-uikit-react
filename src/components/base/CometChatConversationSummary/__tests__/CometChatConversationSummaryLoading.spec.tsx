import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CometChatConversationSummary } from '../CometChatConversationSummary';

describe('CometChatConversationSummaryLoading', () => {
  it('renders 3 shimmer bars by default', () => {
    const getSummary = vi.fn(() => new Promise<string>(() => {}));
    render(
      <CometChatConversationSummary.Root getConversationSummary={getSummary}>
        <CometChatConversationSummary.Loading />
      </CometChatConversationSummary.Root>
    );
    const shimmers = document.querySelectorAll(
      '[class*="cometchat-conversation-summary__shimmer-item"]'
    );
    expect(shimmers.length).toBe(3);
  });

  it('renders custom count of shimmer bars when specified', () => {
    const getSummary = vi.fn(() => new Promise<string>(() => {}));
    render(
      <CometChatConversationSummary.Root getConversationSummary={getSummary}>
        <CometChatConversationSummary.Loading count={5} />
      </CometChatConversationSummary.Root>
    );
    const shimmers = document.querySelectorAll(
      '[class*="cometchat-conversation-summary__shimmer-item"]'
    );
    expect(shimmers.length).toBe(5);
  });

  it('renders custom children when provided', () => {
    const getSummary = vi.fn(() => new Promise<string>(() => {}));
    const { getByText } = render(
      <CometChatConversationSummary.Root getConversationSummary={getSummary}>
        <CometChatConversationSummary.Loading>
          <span>Custom loader</span>
        </CometChatConversationSummary.Loading>
      </CometChatConversationSummary.Root>
    );
    expect(getByText('Custom loader')).toBeInTheDocument();
  });

  it('only renders when context state is loading', async () => {
    const getSummary = vi.fn(() => Promise.resolve('Summary'));
    const { container } = render(
      <CometChatConversationSummary.Root getConversationSummary={getSummary}>
        <CometChatConversationSummary.Loading />
        <CometChatConversationSummary.Body />
      </CometChatConversationSummary.Root>
    );
    // Wait for loaded state
    await vi.waitFor(() => {
      expect(
        container.querySelector('[class*="cometchat-conversation-summary__body"]')
      ).not.toBeNull();
    });
    const shimmers = container.querySelectorAll(
      '[class*="cometchat-conversation-summary__shimmer-item"]'
    );
    expect(shimmers.length).toBe(0);
  });

  it('shimmer items have aria-hidden="true"', () => {
    const getSummary = vi.fn(() => new Promise<string>(() => {}));
    render(
      <CometChatConversationSummary.Root getConversationSummary={getSummary}>
        <CometChatConversationSummary.Loading />
      </CometChatConversationSummary.Root>
    );
    const shimmers = document.querySelectorAll(
      '[class*="cometchat-conversation-summary__shimmer-item"]'
    );
    shimmers.forEach(shimmer => {
      expect(shimmer).toHaveAttribute('aria-hidden', 'true');
    });
  });
});
