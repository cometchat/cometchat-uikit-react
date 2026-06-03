/**
 * CometChatReactionList Storybook Stories
 *
 * Demonstrates the standalone reaction list component:
 * - Default (with mock message that has reactions)
 * - Loading state
 * - Error state
 * - Empty state
 * - Custom request builder
 *
 * @module components/CometChatReactionList
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { CometChatReactionList } from './CometChatReactionList';
import { CometChatReactionListContext } from './CometChatReactionList.context';
import type { CometChatReactionListContextValue } from './CometChatReactionList.types';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import './CometChatReactionList.css';

// ============================================================
// Mock Data
// ============================================================

function createMockUser(uid: string, name: string, avatar?: string) {
  return {
    getUid: () => uid,
    getName: () => name,
    getAvatar: () => avatar ?? `https://i.pravatar.cc/150?u=${uid}`,
    getStatus: () => 'online',
  } as unknown as CometChat.User;
}

function createMockReaction(emoji: string, uid: string, name: string): CometChat.Reaction {
  return {
    getReaction: () => emoji,
    getReactedBy: () => createMockUser(uid, name),
    getMessageId: () => 1,
  } as unknown as CometChat.Reaction;
}

const LOGGED_IN_UID = 'alice-1';

const mockReactions: CometChat.Reaction[] = [
  createMockReaction('👍', LOGGED_IN_UID, 'Alice Johnson'),
  createMockReaction('👍', 'bob-1', 'Bob Smith'),
  createMockReaction('👍', 'charlie-1', 'Charlie Brown'),
  createMockReaction('❤️', 'david-1', 'David Lee'),
  createMockReaction('❤️', 'emma-1', 'Emma Davis'),
  createMockReaction('😂', 'frank-1', 'Frank Miller'),
];

function buildGroupedReactions(reactions: CometChat.Reaction[]): Map<string, CometChat.Reaction[]> {
  const map = new Map<string, CometChat.Reaction[]>();
  for (const r of reactions) {
    const emoji = r.getReaction();
    const existing = map.get(emoji) ?? [];
    map.set(emoji, [...existing, r]);
  }
  return map;
}

const mockGrouped = buildGroupedReactions(mockReactions);

const mockMessage = {
  getId: () => 1,
  getReactions: () => [],
} as unknown as CometChat.BaseMessage;

// ============================================================
// Context mock helper
// ============================================================

function createMockContext(
  overrides: Partial<CometChatReactionListContextValue> = {}
): CometChatReactionListContextValue {
  const allReactions = mockReactions;
  const groupedReactions = mockGrouped;
  const emojiTabs = Array.from(groupedReactions.keys());

  return {
    message: mockMessage,
    allReactions,
    groupedReactions,
    selectedEmoji: null,
    fetchState: 'loaded',
    hasMore: false,
    isFetching: false,
    emojiTabs,
    totalCount: allReactions.length,
    filteredReactions: allReactions,
    selectEmoji: () => {
      /* no-op */
    },
    fetchMore: async () => {
      /* no-op */
    },
    handleItemClick: () => {
      /* no-op */
    },
    isCurrentUser: reaction => reaction.getReactedBy().getUid() === LOGGED_IN_UID,
    retry: () => {
      /* no-op */
    },
    loggedInUserUid: LOGGED_IN_UID,
    ...overrides,
  };
}

// ============================================================
// Story wrapper components (hooks must be in named components)
// ============================================================

const DefaultStory: React.FC = () => {
  const [selectedEmoji, setSelectedEmoji] = React.useState<string | null>(null);
  const filteredReactions =
    selectedEmoji === null
      ? mockReactions
      : mockReactions.filter(r => r.getReaction() === selectedEmoji);
  const ctx = createMockContext({
    selectedEmoji,
    filteredReactions,
    selectEmoji: setSelectedEmoji,
  });
  return (
    <CometChatReactionListContext.Provider value={ctx}>
      <div className={'cometchat-reaction-list'}>
        <CometChatReactionList.Tabs />
        <CometChatReactionList.Items />
      </div>
    </CometChatReactionListContext.Provider>
  );
};

const FilteredByEmojiStory: React.FC = () => {
  const [selectedEmoji, setSelectedEmoji] = React.useState<string | null>('👍');
  const filteredReactions =
    selectedEmoji === null
      ? mockReactions
      : mockReactions.filter(r => r.getReaction() === selectedEmoji);
  const ctx = createMockContext({
    selectedEmoji,
    filteredReactions,
    selectEmoji: setSelectedEmoji,
  });
  return (
    <CometChatReactionListContext.Provider value={ctx}>
      <div className={'cometchat-reaction-list'}>
        <CometChatReactionList.Tabs />
        <CometChatReactionList.Items />
      </div>
    </CometChatReactionListContext.Provider>
  );
};

// ============================================================
// Meta Configuration
// ============================================================

const meta: Meta = {
  title: 'Components/Misc/Reaction List',
  component: CometChatReactionList.Root,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Shows a detailed list of users who reacted to a message, grouped by emoji.',
      },
    },
    layout: 'centered',
  },
};
export default meta;
type Story = StoryObj;

// ============================================================
// Stories
// ============================================================

/** Default loaded state with reactions. */
export const Default: Story = {
  render: () => <DefaultStory />,
};

/** Loading state with shimmer effect. */
export const LoadingState: Story = {
  render: () => {
    const ctx = createMockContext({
      allReactions: [],
      filteredReactions: [],
      fetchState: 'loading',
      isFetching: true,
    });
    return (
      <CometChatReactionListContext.Provider value={ctx}>
        <div className={'cometchat-reaction-list'}>
          <CometChatReactionList.LoadingState />
        </div>
      </CometChatReactionListContext.Provider>
    );
  },
};

/** Error state with retry button. */
export const ErrorState: Story = {
  render: () => {
    const ctx = createMockContext({
      allReactions: [],
      filteredReactions: [],
      fetchState: 'error',
    });
    return (
      <CometChatReactionListContext.Provider value={ctx}>
        <div
          style={{
            width: 280,
            border: '1px solid #f5f5f5',
            borderRadius: 20,
            overflow: 'hidden',
          }}
        >
          <CometChatReactionList.ErrorState />
        </div>
      </CometChatReactionListContext.Provider>
    );
  },
};

/** Empty state when no reactions exist. */
export const EmptyState: Story = {
  render: () => {
    const ctx = createMockContext({
      allReactions: [],
      filteredReactions: [],
      fetchState: 'empty',
    });
    return (
      <CometChatReactionListContext.Provider value={ctx}>
        <div
          style={{
            width: 280,
            border: '1px solid #f5f5f5',
            borderRadius: 20,
            overflow: 'hidden',
          }}
        >
          <CometChatReactionList.EmptyState />
        </div>
      </CometChatReactionListContext.Provider>
    );
  },
};

/** Filtered by a specific emoji tab. */
export const FilteredByEmoji: Story = {
  render: () => <FilteredByEmojiStory />,
};

/** RTL layout. */
export const RTL: Story = {
  render: () => {
    const ctx = createMockContext();
    return (
      <div dir="rtl">
        <CometChatReactionListContext.Provider value={ctx}>
          <div className={'cometchat-reaction-list'}>
            <CometChatReactionList.Tabs />
            <CometChatReactionList.Items />
          </div>
        </CometChatReactionListContext.Provider>
      </div>
    );
  },
};

/** Custom compound layout. */
export const CustomLayout: Story = {
  render: () => {
    const ctx = createMockContext();
    return (
      <CometChatReactionListContext.Provider value={ctx}>
        <div
          style={{
            width: 280,
            border: '1px solid #f5f5f5',
            borderRadius: 20,
            overflow: 'hidden',
          }}
        >
          {/* Custom header */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid #e8e8e8',
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Reactions ({ctx.totalCount})
          </div>
          <CometChatReactionList.Tabs />
          <CometChatReactionList.Items />
        </div>
      </CometChatReactionListContext.Provider>
    );
  },
};
