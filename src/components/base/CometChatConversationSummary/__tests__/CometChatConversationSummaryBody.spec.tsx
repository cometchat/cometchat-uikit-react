import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CometChatConversationSummary } from '../CometChatConversationSummary';

describe('CometChatConversationSummaryBody', () => {
  it('renders the summary text from context when state is loaded', async () => {
    render(
      <CometChatConversationSummary.Root
        getConversationSummary={() => Promise.resolve('Hello summary')}
      >
        <CometChatConversationSummary.Body />
      </CometChatConversationSummary.Root>
    );
    await waitFor(() => {
      expect(screen.getByText('Hello summary')).toBeInTheDocument();
    });
  });

  it('does not render when state is not loaded', () => {
    render(
      <CometChatConversationSummary.Root
        getConversationSummary={() => new Promise<string>(() => {})}
      >
        <CometChatConversationSummary.Body />
      </CometChatConversationSummary.Root>
    );
    const body = document.querySelector('[class*="cometchat-conversation-summary__body"]');
    expect(body).toBeNull();
  });

  it('renders custom children when provided', async () => {
    render(
      <CometChatConversationSummary.Root getConversationSummary={() => Promise.resolve('Text')}>
        <CometChatConversationSummary.Body>
          <span>Custom body</span>
        </CometChatConversationSummary.Body>
      </CometChatConversationSummary.Root>
    );
    await waitFor(() => {
      expect(screen.getByText('Custom body')).toBeInTheDocument();
    });
  });

  it('applies custom className', async () => {
    render(
      <CometChatConversationSummary.Root getConversationSummary={() => Promise.resolve('Text')}>
        <CometChatConversationSummary.Body className="my-body" />
      </CometChatConversationSummary.Root>
    );
    await waitFor(() => {
      expect(screen.getByText('Text')).toBeInTheDocument();
    });
    const body = screen.getByText('Text').closest('div');
    expect(body?.className).toContain('my-body');
  });
});
