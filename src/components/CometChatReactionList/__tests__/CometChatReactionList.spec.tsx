import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatReactionList } from '../CometChatReactionList';

function reaction(emoji: string, uid: string, name: string): CometChat.Reaction {
  return {
    getReaction: () => emoji,
    getReactedBy: () => ({ getUid: () => uid, getName: () => name, getAvatar: () => '' }),
    getMessageId: () => 1,
  } as unknown as CometChat.Reaction;
}
const reactions = [reaction('👍', 'me', 'Me'), reaction('👍', 'bob', 'Bob Smith'), reaction('🎉', 'bob', 'Bob Smith')];

// The hook fetches reactions through the SDK; this spec covers what the component renders.
vi.mock('../useCometChatReactionList', () => ({
  useCometChatReactionList: () => ({
    allReactions: reactions,
    groupedReactions: new Map([
      ['👍', reactions.slice(0, 2)],
      ['🎉', reactions.slice(2)],
    ]),
    selectedEmoji: null,
    fetchState: 'loaded',
    hasMore: false,
    isFetching: false,
    emojiTabs: ['👍', '🎉'],
    totalCount: reactions.length,
    filteredReactions: reactions,
    selectEmoji: vi.fn(),
    fetchMore: vi.fn(() => Promise.resolve()),
    handleItemClick: vi.fn(),
    isCurrentUser: (r: CometChat.Reaction) => r.getReactedBy().getUid() === 'me',
    retry: vi.fn(),
    loggedInUserUid: 'me',
  }),
}));

const message = { getId: () => 1, getReactions: () => [] } as unknown as CometChat.BaseMessage;

describe('CometChatReactionList', () => {
  it('renders as a labelled dialog with a tab per emoji and a row per reaction', () => {
    render(<CometChatReactionList message={message} />);
    expect(screen.getByRole('dialog', { name: 'Reaction list' })).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(3);
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('names the current user "You" and offers to remove only their reaction', () => {
    render(<CometChatReactionList message={message} />);
    expect(screen.getByRole('listitem', { name: 'You reacted with 👍. Click to remove' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem', { name: /^Bob Smith reacted with/ })).toHaveLength(2);
  });
});
