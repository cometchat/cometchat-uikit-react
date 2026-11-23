/**
 * D84 rule 3 on the panels: reactions, the notification feed, and pinned and saved messages.
 * Offline with nothing saved the error state is an icon (where the panel has one) and one
 * "Connect to load ..." line, with no Retry; the app's own error view wins; a real error keeps
 * today's error view with its Retry.
 */
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CometChatReactionListContext } from '../../../components/CometChatReactionList/CometChatReactionList.context';
import { CometChatReactionListErrorState } from '../../../components/CometChatReactionList/CometChatReactionListErrorState';
import { CometChatNotificationFeedContext } from '../../../components/CometChatNotificationFeed/CometChatNotificationFeed.context';
import { CometChatNotificationFeedErrorState } from '../../../components/CometChatNotificationFeed/CometChatNotificationFeedErrorState';
import { CometChatPinnedMessagesContext } from '../../../components/CometChatPinnedMessages/CometChatPinnedMessages.context';
import { CometChatPinnedMessagesErrorState } from '../../../components/CometChatPinnedMessages/CometChatPinnedMessagesErrorState';
import { CometChatSavedMessagesContext } from '../../../components/CometChatSavedMessages/CometChatSavedMessages.context';
import { CometChatSavedMessagesErrorState } from '../../../components/CometChatSavedMessages/CometChatSavedMessagesErrorState';

const provide = <T,>(Context: React.Context<T | null> | React.Provider<T>, value: object) => {
  const Provider = 'Provider' in Context ? Context.Provider : Context;
  return ({ children }: { children: React.ReactNode }) => (
    <Provider value={value as T}>{children}</Provider>
  );
};

describe('reaction list', () => {
  const wrap = (value: object) => provide(CometChatReactionListContext, value);
  it('offline with nothing saved: "Connect to load reactions", no Retry', () => {
    render(<CometChatReactionListErrorState />, {
      wrapper: wrap({ fetchState: 'error', connectToLoad: true, retry: vi.fn() }),
    });
    expect(screen.getByText('Connect to load reactions')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });
  it('a real error keeps its text and Retry', () => {
    render(<CometChatReactionListErrorState />, {
      wrapper: wrap({ fetchState: 'error', retry: vi.fn() }),
    });
    expect(screen.queryByText('Connect to load reactions')).toBeNull();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});

describe('notification feed', () => {
  const wrap = (value: object) => provide(CometChatNotificationFeedContext, value);
  it('offline with nothing saved: icon and "Connect to load notifications", no Retry', () => {
    const { container } = render(<CometChatNotificationFeedErrorState />, {
      wrapper: wrap({ screenState: 'error', connectToLoad: true, refresh: vi.fn() }),
    });
    expect(screen.getByText('Connect to load notifications')).toBeInTheDocument();
    expect(container.querySelector('img')).not.toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });
  it('the app’s own error view wins', () => {
    render(
      <CometChatNotificationFeedErrorState>
        <span>my own error</span>
      </CometChatNotificationFeedErrorState>,
      { wrapper: wrap({ screenState: 'error', connectToLoad: true, refresh: vi.fn() }) }
    );
    expect(screen.getByText('my own error')).toBeInTheDocument();
    expect(screen.queryByText('Connect to load notifications')).toBeNull();
  });
  it('a real error keeps its Retry', () => {
    render(<CometChatNotificationFeedErrorState />, {
      wrapper: wrap({ screenState: 'error', refresh: vi.fn() }),
    });
    expect(screen.queryByText('Connect to load notifications')).toBeNull();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});

describe('pinned and saved messages', () => {
  it.each([
    ['pinned', CometChatPinnedMessagesContext, CometChatPinnedMessagesErrorState],
    ['saved', CometChatSavedMessagesContext, CometChatSavedMessagesErrorState],
  ] as const)('%s: offline with nothing saved reads "Connect to load messages"', (_name, Context, ErrorState) => {
    const { container } = render(<ErrorState />, {
      wrapper: provide(Context as React.Context<object | null>, {
        fetchState: 'error',
        messages: [],
        connectToLoad: true,
      }),
    });
    expect(screen.getByText('Connect to load messages')).toBeInTheDocument();
    expect(container.querySelector('img')).not.toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });
  it.each([
    ['pinned', CometChatPinnedMessagesContext, CometChatPinnedMessagesErrorState],
    ['saved', CometChatSavedMessagesContext, CometChatSavedMessagesErrorState],
  ] as const)('%s: a real error keeps today’s error text', (_name, Context, ErrorState) => {
    render(<ErrorState />, {
      wrapper: provide(Context as React.Context<object | null>, {
        fetchState: 'error',
        messages: [],
      }),
    });
    expect(screen.queryByText('Connect to load messages')).toBeNull();
    expect(screen.getByText('OOPS!')).toBeInTheDocument();
  });
});
