import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CometChatConversationSummary } from '../CometChatConversationSummary';

describe('CometChatConversationSummaryEmpty', () => {
  it('renders default empty message', async () => {
    render(
      <CometChatConversationSummary.Root getConversationSummary={() => Promise.resolve('')}>
        <CometChatConversationSummary.Empty />
      </CometChatConversationSummary.Root>
    );
    await waitFor(() => {
      expect(screen.getByText('conversation_summary_empty')).toBeInTheDocument();
    });
  });

  it('renders custom message when provided', async () => {
    render(
      <CometChatConversationSummary.Root getConversationSummary={() => Promise.resolve('')}>
        <CometChatConversationSummary.Empty message="Nothing here" />
      </CometChatConversationSummary.Root>
    );
    await waitFor(() => {
      expect(screen.getByText('Nothing here')).toBeInTheDocument();
    });
  });

  it('renders custom children when provided', async () => {
    render(
      <CometChatConversationSummary.Root getConversationSummary={() => Promise.resolve('')}>
        <CometChatConversationSummary.Empty>
          <span>Custom empty</span>
        </CometChatConversationSummary.Empty>
      </CometChatConversationSummary.Root>
    );
    await waitFor(() => {
      expect(screen.getByText('Custom empty')).toBeInTheDocument();
    });
  });

  it('only renders when context state is empty', () => {
    render(
      <CometChatConversationSummary.Root
        getConversationSummary={() => new Promise<string>(() => {})}
      >
        <CometChatConversationSummary.Empty message="Empty" />
      </CometChatConversationSummary.Root>
    );
    expect(screen.queryByText('Empty')).not.toBeInTheDocument();
  });
});
