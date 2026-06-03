import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { CometChatConversationSummary } from '../CometChatConversationSummary';

describe('CometChatConversationSummaryRoot', () => {
  it('renders loading state initially when getConversationSummary is provided', () => {
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

  it('transitions to loaded state after getConversationSummary resolves with a non-empty string', async () => {
    const getSummary = vi.fn(() => Promise.resolve('This is the summary.'));
    render(
      <CometChatConversationSummary.Root getConversationSummary={getSummary}>
        <CometChatConversationSummary.Loading />
        <CometChatConversationSummary.Body />
      </CometChatConversationSummary.Root>
    );
    await waitFor(() => {
      expect(screen.getByText('This is the summary.')).toBeInTheDocument();
    });
  });

  it('transitions to empty state when getConversationSummary resolves with an empty string', async () => {
    const getSummary = vi.fn(() => Promise.resolve(''));
    render(
      <CometChatConversationSummary.Root getConversationSummary={getSummary}>
        <CometChatConversationSummary.Loading />
        <CometChatConversationSummary.Empty message="No summary" />
      </CometChatConversationSummary.Root>
    );
    await waitFor(() => {
      expect(screen.getByText('No summary')).toBeInTheDocument();
    });
  });

  it('transitions to error state when getConversationSummary rejects', async () => {
    const getSummary = vi.fn(() => Promise.reject(new Error('fail')));
    render(
      <CometChatConversationSummary.Root getConversationSummary={getSummary}>
        <CometChatConversationSummary.Loading />
        <CometChatConversationSummary.Error message="Something went wrong" />
      </CometChatConversationSummary.Root>
    );
    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  it('provides context values to children via CometChatConversationSummaryContext', async () => {
    const getSummary = vi.fn(() => Promise.resolve('Summary text'));
    render(
      <CometChatConversationSummary.Root getConversationSummary={getSummary}>
        <CometChatConversationSummary.Body />
      </CometChatConversationSummary.Root>
    );
    await waitFor(() => {
      expect(screen.getByText('Summary text')).toBeInTheDocument();
    });
  });

  it('applies custom className to root container', () => {
    const getSummary = vi.fn(() => new Promise<string>(() => {}));
    render(
      <CometChatConversationSummary.Root
        getConversationSummary={getSummary}
        className="custom-class"
      >
        <CometChatConversationSummary.Loading />
      </CometChatConversationSummary.Root>
    );
    const root = screen.getByRole('region');
    expect(root.className).toContain('custom-class');
  });

  it('sets aria-busy="true" during loading state', () => {
    const getSummary = vi.fn(() => new Promise<string>(() => {}));
    render(
      <CometChatConversationSummary.Root getConversationSummary={getSummary}>
        <CometChatConversationSummary.Loading />
      </CometChatConversationSummary.Root>
    );
    const root = screen.getByRole('region');
    expect(root).toHaveAttribute('aria-busy', 'true');
  });

  it('sets aria-live="polite" on root container', () => {
    const getSummary = vi.fn(() => new Promise<string>(() => {}));
    render(
      <CometChatConversationSummary.Root getConversationSummary={getSummary}>
        <CometChatConversationSummary.Loading />
      </CometChatConversationSummary.Root>
    );
    const root = screen.getByRole('region');
    expect(root).toHaveAttribute('aria-live', 'polite');
  });

  it('supports retry via retry() context method', async () => {
    let callCount = 0;
    const getSummary = vi.fn(() => {
      callCount++;
      if (callCount === 1) return Promise.reject(new Error('fail'));
      return Promise.resolve('Retried summary');
    });

    render(
      <CometChatConversationSummary.Root getConversationSummary={getSummary}>
        <CometChatConversationSummary.Loading />
        <CometChatConversationSummary.Error message="Error" />
        <CometChatConversationSummary.Body />
      </CometChatConversationSummary.Root>
    );

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    const retryBtn = screen.getByText('Retry');
    await userEvent.setup().click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText('Retried summary')).toBeInTheDocument();
    });
  });

  it('calls onClose when Escape key is pressed', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const getSummary = vi.fn(() => Promise.resolve('Summary'));
    render(
      <CometChatConversationSummary.Root getConversationSummary={getSummary} onClose={onClose}>
        <CometChatConversationSummary.Header />
        <CometChatConversationSummary.Body />
      </CometChatConversationSummary.Root>
    );
    await waitFor(() => {
      expect(screen.getByText('Summary')).toBeInTheDocument();
    });

    const root = screen.getByRole('region');
    root.focus();
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('ignores stale fetch responses when getConversationSummary changes', async () => {
    let resolveFirst: (v: string) => void;
    const firstPromise = new Promise<string>(r => {
      resolveFirst = r;
    });
    const first = vi.fn(() => firstPromise);
    const second = vi.fn(() => Promise.resolve('Second'));

    const { rerender } = render(
      <CometChatConversationSummary.Root getConversationSummary={first}>
        <CometChatConversationSummary.Body />
      </CometChatConversationSummary.Root>
    );

    rerender(
      <CometChatConversationSummary.Root getConversationSummary={second}>
        <CometChatConversationSummary.Body />
      </CometChatConversationSummary.Root>
    );

    await waitFor(() => {
      expect(screen.getByText('Second')).toBeInTheDocument();
    });

    // Resolve the stale first promise — should be ignored
    resolveFirst!('First');
    // The text should still be "Second"
    expect(screen.getByText('Second')).toBeInTheDocument();
  });
});
