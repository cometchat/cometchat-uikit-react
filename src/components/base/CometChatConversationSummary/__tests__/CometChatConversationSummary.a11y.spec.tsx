import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import { CometChatConversationSummary } from '../CometChatConversationSummary';

expect.extend(toHaveNoViolations);

describe('CometChatConversationSummary accessibility', () => {
  it('passes axe-core audit in loading state', async () => {
    const getSummary = vi.fn(() => new Promise<string>(() => {}));
    const { container } = render(
      <CometChatConversationSummary.Root getConversationSummary={getSummary}>
        <CometChatConversationSummary.Header />
        <CometChatConversationSummary.Loading />
      </CometChatConversationSummary.Root>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('passes axe-core audit in loaded state', async () => {
    const getSummary = vi.fn(() => Promise.resolve('Summary text'));
    const { container } = render(
      <CometChatConversationSummary.Root getConversationSummary={getSummary} onClose={() => {}}>
        <CometChatConversationSummary.Header />
        <CometChatConversationSummary.Body />
      </CometChatConversationSummary.Root>
    );
    await waitFor(() => {
      expect(screen.getByText('Summary text')).toBeInTheDocument();
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('passes axe-core audit in error state', async () => {
    const getSummary = vi.fn(() => Promise.reject(new Error('fail')));
    const { container } = render(
      <CometChatConversationSummary.Root getConversationSummary={getSummary}>
        <CometChatConversationSummary.Header />
        <CometChatConversationSummary.Error message="Error occurred" />
      </CometChatConversationSummary.Root>
    );
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('passes axe-core audit in empty state', async () => {
    const getSummary = vi.fn(() => Promise.resolve(''));
    const { container } = render(
      <CometChatConversationSummary.Root getConversationSummary={getSummary}>
        <CometChatConversationSummary.Header />
        <CometChatConversationSummary.Empty message="No summary" />
      </CometChatConversationSummary.Root>
    );
    await waitFor(() => {
      expect(screen.getByText('No summary')).toBeInTheDocument();
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('close button is focusable via Tab key', async () => {
    const user = userEvent.setup();
    const getSummary = vi.fn(() => new Promise<string>(() => {}));
    render(
      <CometChatConversationSummary.Root getConversationSummary={getSummary} onClose={() => {}}>
        <CometChatConversationSummary.Header />
      </CometChatConversationSummary.Root>
    );
    await user.tab();
    expect(screen.getByLabelText('Close conversation summary')).toHaveFocus();
  });

  it('Enter key activates the close button', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const getSummary = vi.fn(() => new Promise<string>(() => {}));
    render(
      <CometChatConversationSummary.Root getConversationSummary={getSummary} onClose={onClose}>
        <CometChatConversationSummary.Header />
      </CometChatConversationSummary.Root>
    );
    await user.tab();
    await user.keyboard('{Enter}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Space key activates the close button', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const getSummary = vi.fn(() => new Promise<string>(() => {}));
    render(
      <CometChatConversationSummary.Root getConversationSummary={getSummary} onClose={onClose}>
        <CometChatConversationSummary.Header />
      </CometChatConversationSummary.Root>
    );
    await user.tab();
    await user.keyboard(' ');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Escape key closes the summary card', async () => {
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

  it('screen reader announces state transitions via aria-live', () => {
    const getSummary = vi.fn(() => new Promise<string>(() => {}));
    render(
      <CometChatConversationSummary.Root getConversationSummary={getSummary}>
        <CometChatConversationSummary.Loading />
      </CometChatConversationSummary.Root>
    );
    const root = screen.getByRole('region');
    expect(root).toHaveAttribute('aria-live', 'polite');
  });

  it('error state is announced via role="alert"', async () => {
    const getSummary = vi.fn(() => Promise.reject(new Error('fail')));
    render(
      <CometChatConversationSummary.Root getConversationSummary={getSummary}>
        <CometChatConversationSummary.Error />
      </CometChatConversationSummary.Root>
    );
    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });
  });

  it('close button has accessible name via aria-label', () => {
    const getSummary = vi.fn(() => new Promise<string>(() => {}));
    render(
      <CometChatConversationSummary.Root getConversationSummary={getSummary} onClose={() => {}}>
        <CometChatConversationSummary.Header />
      </CometChatConversationSummary.Root>
    );
    const btn = screen.getByLabelText('Close conversation summary');
    expect(btn.tagName).toBe('BUTTON');
  });
});
