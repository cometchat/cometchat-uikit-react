import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatReactionList } from '../CometChatReactionList';
import { CometChatReactionListContext } from '../CometChatReactionList.context';
import type { CometChatReactionListContextValue } from '../CometChatReactionList.types';

const ME = 'alice-1';

function reaction(emoji: string, uid: string, name: string): CometChat.Reaction {
  return {
    getReaction: () => emoji,
    getReactedBy: () =>
      ({ getUid: () => uid, getName: () => name, getAvatar: () => '' }) as unknown as CometChat.User,
    getMessageId: () => 1,
  } as unknown as CometChat.Reaction;
}

const reactions = [reaction('👍', ME, 'Alice Johnson'), reaction('👍', 'bob-1', 'Bob Smith')];

function renderItems(overrides: Partial<CometChatReactionListContextValue> = {}) {
  const value: CometChatReactionListContextValue = {
    message: { getId: () => 1, getReactions: () => [] } as unknown as CometChat.BaseMessage,
    allReactions: reactions,
    groupedReactions: new Map([['👍', reactions]]),
    selectedEmoji: null,
    fetchState: 'loaded',
    hasMore: false,
    isFetching: false,
    emojiTabs: ['👍'],
    totalCount: reactions.length,
    filteredReactions: reactions,
    selectEmoji: vi.fn(),
    fetchMore: vi.fn(() => Promise.resolve()),
    handleItemClick: vi.fn(),
    isCurrentUser: r => r.getReactedBy().getUid() === ME,
    retry: vi.fn(),
    loggedInUserUid: ME,
    ...overrides,
  };
  render(
    <CometChatReactionListContext.Provider value={value}>
      <CometChatReactionList.Items />
    </CometChatReactionListContext.Provider>
  );
  return value;
}

describe('CometChatReactionList.Items — accessible names', () => {
  it('names the list for everyone who reacted when no emoji is selected', () => {
    renderItems();
    expect(screen.getByRole('list', { name: 'All users who reacted' })).toBeInTheDocument();
  });

  it('names the list for the selected emoji', () => {
    renderItems({ selectedEmoji: '👍' });
    expect(screen.getByRole('list', { name: 'Users who reacted with 👍' })).toBeInTheDocument();
  });

  it("names each row by who reacted, and tells the current user they can remove theirs", () => {
    const value = renderItems();
    const mine = screen.getByRole('listitem', { name: 'You reacted with 👍. Click to remove' });
    expect(screen.getByRole('listitem', { name: 'Bob Smith reacted with 👍' })).toBeInTheDocument();

    fireEvent.click(mine);
    expect(value.handleItemClick).toHaveBeenCalledWith(reactions[0]);
  });
});
