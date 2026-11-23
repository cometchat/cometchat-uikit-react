/**
 * D84 rule 3 on the message list and threads: offline with nothing saved the error state is an
 * icon and "Connect to load messages", with no Retry; the app's own error view wins; a real error
 * keeps today's error view with its Retry.
 */
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CometChatMessageListProvider } from '../CometChatMessageList.context';
import { CometChatMessageListErrorState } from '../CometChatMessageListErrorState';

const wrap = (value: object) =>
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <CometChatMessageListProvider value={value as never}>{children}</CometChatMessageListProvider>
    );
  };

describe('message list error state, offline', () => {
  it('offline with nothing saved: "Connect to load messages", no Retry', () => {
    render(<CometChatMessageListErrorState />, {
      wrapper: wrap({ isError: true, state: { connectToLoad: true }, fetchPrevious: vi.fn() }),
    });
    expect(screen.getByText('Connect to load messages')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });
  it('the app’s own error view wins', () => {
    render(
      <CometChatMessageListErrorState>
        <span>my own error</span>
      </CometChatMessageListErrorState>,
      { wrapper: wrap({ isError: true, state: { connectToLoad: true }, fetchPrevious: vi.fn() }) }
    );
    expect(screen.getByText('my own error')).toBeInTheDocument();
    expect(screen.queryByText('Connect to load messages')).toBeNull();
  });
  it('a real error keeps its Retry', () => {
    render(<CometChatMessageListErrorState />, {
      wrapper: wrap({ isError: true, state: {}, fetchPrevious: vi.fn() }),
    });
    expect(screen.queryByText('Connect to load messages')).toBeNull();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
