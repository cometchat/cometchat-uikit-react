import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatReactionList } from '../CometChatReactionList';

// The tab bar while the reactors can't load offline: "All" and the emoji tabs come from
// the message's own counts (as on Android) instead of reading "All 0". The online error
// view and a loaded list keep their tabs as before.

function reaction(emoji: string, uid: string): CometChat.Reaction {
  return {
    getReaction: () => emoji,
    getReactedBy: () => ({
      getUid: () => uid,
      getName: () => uid,
      getAvatar: () => '',
    }),
    getMessageId: () => 1,
  } as unknown as CometChat.Reaction;
}

function count(emoji: string, n: number): CometChat.ReactionCount {
  return {
    getReaction: () => emoji,
    getCount: () => n,
  } as unknown as CometChat.ReactionCount;
}

// The message carries 5 x 👍 and 3 x 🎉.
const message = {
  getId: () => 1,
  getReactions: () => [count('👍', 5), count('🎉', 3)],
} as unknown as CometChat.BaseMessage;

interface HookState {
  allReactions: CometChat.Reaction[];
  fetchState: 'loading' | 'loaded' | 'error';
  connectToLoad?: boolean;
}
let hookState: HookState;

vi.mock('../useCometChatReactionList', () => ({
  useCometChatReactionList: () => {
    const grouped = new Map<string, CometChat.Reaction[]>();
    for (const r of hookState.allReactions) {
      grouped.set(r.getReaction(), [...(grouped.get(r.getReaction()) ?? []), r]);
    }
    return {
      ...hookState,
      groupedReactions: grouped,
      selectedEmoji: null,
      hasMore: false,
      isFetching: false,
      emojiTabs: Array.from(grouped.keys()),
      totalCount: hookState.allReactions.length,
      filteredReactions: hookState.allReactions,
      selectEmoji: vi.fn(),
      fetchMore: vi.fn(() => Promise.resolve()),
      handleItemClick: vi.fn(),
      isCurrentUser: () => false,
      retry: vi.fn(),
      loggedInUserUid: 'me',
    };
  },
}));

const tabTexts = () => screen.getAllByRole('tab').map(tab => tab.textContent);

describe('CometChatReactionList tabs', () => {
  beforeEach(() => {
    hookState = { allReactions: [], fetchState: 'loading' };
  });

  it('offline before any reactor loads, shows the message counts and "Connect to load reactions"', () => {
    hookState = { allReactions: [], fetchState: 'error', connectToLoad: true };
    render(<CometChatReactionList message={message} />);
    expect(tabTexts()).toEqual(['All8', '👍5', '🎉3']);
    expect(screen.getByRole('status')).toHaveTextContent('Connect to load reactions');
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
  });

  it('keeps the online error view as before (fetched counts, Retry)', () => {
    hookState = { allReactions: [], fetchState: 'error', connectToLoad: false };
    render(<CometChatReactionList message={message} />);
    expect(tabTexts()).toEqual(['All0']);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('keeps a loaded list counting its fetched reactors', () => {
    hookState = {
      allReactions: [reaction('👍', 'a'), reaction('👍', 'b'), reaction('🎉', 'c')],
      fetchState: 'loaded',
    };
    render(<CometChatReactionList message={message} />);
    expect(tabTexts()).toEqual(['All3', '👍2', '🎉1']);
  });
});
