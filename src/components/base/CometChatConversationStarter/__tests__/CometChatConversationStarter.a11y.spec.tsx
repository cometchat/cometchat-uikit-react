import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import { CometChatConversationStarter } from '../CometChatConversationStarter';

expect.extend(toHaveNoViolations);

describe('CometChatConversationStarter accessibility', () => {
  it('passes axe-core audit in loading state', async () => {
    const getStarters = vi.fn(() => new Promise<string[]>(() => {}));
    const { container } = render(
      <CometChatConversationStarter.Root getConversationStarters={getStarters}>
        <CometChatConversationStarter.Loading />
      </CometChatConversationStarter.Root>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('passes axe-core audit in loaded state', async () => {
    const getStarters = vi.fn(() => Promise.resolve(['Hello', 'World']));
    const { container } = render(
      <CometChatConversationStarter.Root getConversationStarters={getStarters}>
        <CometChatConversationStarter.Loading />
      </CometChatConversationStarter.Root>
    );
    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('passes axe-core audit in error state', async () => {
    const getStarters = vi.fn(() => Promise.reject(new Error('fail')));
    const { container } = render(
      <CometChatConversationStarter.Root getConversationStarters={getStarters}>
        <CometChatConversationStarter.Error message="Error occurred" />
      </CometChatConversationStarter.Root>
    );
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('all suggestion buttons are focusable via Tab key', async () => {
    const user = userEvent.setup();
    const getStarters = vi.fn(() => Promise.resolve(['A', 'B', 'C']));
    render(
      <CometChatConversationStarter.Root getConversationStarters={getStarters}>
        <CometChatConversationStarter.Loading />
      </CometChatConversationStarter.Root>
    );
    await waitFor(() => {
      expect(screen.getByText('A')).toBeInTheDocument();
    });

    await user.tab();
    expect(screen.getByText('A')).toHaveFocus();
    await user.tab();
    expect(screen.getByText('B')).toHaveFocus();
    await user.tab();
    expect(screen.getByText('C')).toHaveFocus();
  });

  it('Enter key activates the focused suggestion button', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const getStarters = vi.fn(() => Promise.resolve(['Test']));
    render(
      <CometChatConversationStarter.Root
        getConversationStarters={getStarters}
        onSuggestionClick={onClick}
      >
        <CometChatConversationStarter.Loading />
      </CometChatConversationStarter.Root>
    );
    await waitFor(() => {
      expect(screen.getByText('Test')).toBeInTheDocument();
    });
    await user.tab();
    await user.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledWith('Test');
  });

  it('Space key activates the focused suggestion button', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const getStarters = vi.fn(() => Promise.resolve(['Test']));
    render(
      <CometChatConversationStarter.Root
        getConversationStarters={getStarters}
        onSuggestionClick={onClick}
      >
        <CometChatConversationStarter.Loading />
      </CometChatConversationStarter.Root>
    );
    await waitFor(() => {
      expect(screen.getByText('Test')).toBeInTheDocument();
    });
    await user.tab();
    await user.keyboard(' ');
    expect(onClick).toHaveBeenCalledWith('Test');
  });

  it('error state is announced via role="alert"', async () => {
    const getStarters = vi.fn(() => Promise.reject(new Error('fail')));
    render(
      <CometChatConversationStarter.Root getConversationStarters={getStarters}>
        <CometChatConversationStarter.Error message="Error" />
      </CometChatConversationStarter.Root>
    );
    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });
  });

  it('root has aria-live="polite" for state transition announcements', () => {
    const getStarters = vi.fn(() => new Promise<string[]>(() => {}));
    render(
      <CometChatConversationStarter.Root getConversationStarters={getStarters}>
        <CometChatConversationStarter.Loading />
      </CometChatConversationStarter.Root>
    );
    const root = screen.getByRole('group');
    expect(root).toHaveAttribute('aria-live', 'polite');
  });
});
