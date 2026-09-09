import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatSavedMessages } from './CometChatSavedMessages';
import { CometChatSavedMessagesContext } from './CometChatSavedMessages.context';
import type { CometChatSavedMessagesContextValue } from './CometChatSavedMessages.types';

// ============================================
// Mock data
// ============================================

/** A minimal saved message. Saved rows render a light text preview (no plugin bubble). */
function mockSavedMessage(overrides: {
  id?: number;
  text?: string;
  senderName?: string;
  senderUid?: string;
  sentAt?: number;
  parentMessageId?: number;
}): CometChat.BaseMessage {
  const {
    id = Math.floor(Math.random() * 100000),
    text = 'A message worth keeping.',
    senderName = 'Jane Smith',
    senderUid = 'user-jane',
    sentAt = Math.floor(Date.now() / 1000),
    parentMessageId = 0,
  } = overrides;

  return {
    getId: () => id,
    getType: () => 'text',
    getCategory: () => 'message',
    getSender: () => ({
      getUid: () => senderUid,
      getName: () => senderName,
      getAvatar: () => '',
      getStatus: () => 'online',
    }),
    getReceiverType: () => 'user',
    getReceiverId: () => 'me',
    getSentAt: () => sentAt,
    getDeliveredAt: () => 0,
    getReadAt: () => 0,
    getEditedAt: () => 0,
    getDeletedAt: () => 0,
    getReplyCount: () => 0,
    getReactions: () => [],
    getMetadata: () => ({}),
    getMuid: () => `m-${String(id)}`,
    getParentMessageId: () => parentMessageId,
    getMentionedUsers: () => [],
    getText: () => text,
    getSavedAt: () => sentAt,
    isSaved: () => true,
  } as unknown as CometChat.BaseMessage;
}

const mockSaves: CometChat.BaseMessage[] = [
  mockSavedMessage({
    id: 1,
    text: 'Ship notes: cut the release on Friday.',
    senderName: 'Alex Kim',
    senderUid: 'user-alex',
  }),
  mockSavedMessage({
    id: 2,
    text: 'The API key is in the shared vault, folder "staging".',
    senderName: 'Alice Johnson',
    senderUid: 'alice-johnson',
  }),
  mockSavedMessage({
    id: 3,
    text: 'Great call today — action items are in the doc.',
    senderName: 'Jane Smith',
    senderUid: 'user-jane',
    parentMessageId: 42,
  }),
];

// ============================================
// Context mock helper
// ============================================

function createMockContext(
  overrides: Partial<CometChatSavedMessagesContextValue> = {}
): CometChatSavedMessagesContextValue {
  return {
    messages: mockSaves,
    fetchState: 'loaded',
    hasMore: false,
    loadMore: () => {
      /* no-op */
    },
    onUnsave: () => {
      /* no-op */
    },
    hideUnsaveMessageOption: false,
    hideCloseButton: false,
    ...overrides,
  };
}

const containerStyle: React.CSSProperties = {
  width: 380,
  height: 560,
  border: '1px solid var(--cometchat-border-color-light, #e0e0e0)',
  borderRadius: 8,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--cometchat-background-color-01, #fff)',
};

function Panel({ children }: { children: React.ReactNode }) {
  return <div style={containerStyle}>{children}</div>;
}

// ============================================
// Meta
// ============================================

const meta: Meta = {
  title: 'Components/Messages/Saved Messages',
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          "A standalone screen listing the current user's saved messages across all conversations. Stories render the compound sub-components against a mocked context (no backend).",
      },
    },
  },
};
export default meta;
type Story = StoryObj;

// ============================================
// Stories
// ============================================

/** Default — a list of saved messages. */
export const Default: Story = {
  render: () => (
    <CometChatSavedMessagesContext.Provider value={createMockContext()}>
      <Panel>
        <CometChatSavedMessages.Header />
        <CometChatSavedMessages.List />
      </Panel>
    </CometChatSavedMessagesContext.Provider>
  ),
};

/** Empty — nothing saved yet. */
export const Empty: Story = {
  render: () => (
    <CometChatSavedMessagesContext.Provider
      value={createMockContext({ messages: [], fetchState: 'empty' })}
    >
      <Panel>
        <CometChatSavedMessages.Header />
        <CometChatSavedMessages.EmptyState />
      </Panel>
    </CometChatSavedMessagesContext.Provider>
  ),
};

/** Loading — initial fetch in progress. */
export const Loading: Story = {
  render: () => (
    <CometChatSavedMessagesContext.Provider
      value={createMockContext({ messages: [], fetchState: 'loading' })}
    >
      <Panel>
        <CometChatSavedMessages.Header />
        <CometChatSavedMessages.LoadingState />
      </Panel>
    </CometChatSavedMessagesContext.Provider>
  ),
};

/** Error — the fetch failed. */
export const Error: Story = {
  render: () => (
    <CometChatSavedMessagesContext.Provider
      value={createMockContext({ messages: [], fetchState: 'error' })}
    >
      <Panel>
        <CometChatSavedMessages.Header />
        <CometChatSavedMessages.ErrorState />
      </Panel>
    </CometChatSavedMessagesContext.Provider>
  ),
};

/** Many saves — the list scrolls. */
export const ManySaves: Story = {
  render: () => {
    const many = Array.from({ length: 20 }, (_, i) =>
      mockSavedMessage({
        id: 100 + i,
        text: `Saved note #${String(i + 1)} — something worth coming back to.`,
        senderName: i % 2 === 0 ? 'Alex Kim' : 'Alice Johnson',
        senderUid: i % 2 === 0 ? 'user-alex' : 'alice-johnson',
      })
    );
    return (
      <CometChatSavedMessagesContext.Provider value={createMockContext({ messages: many })}>
        <Panel>
          <CometChatSavedMessages.Header />
          <CometChatSavedMessages.List />
        </Panel>
      </CometChatSavedMessagesContext.Provider>
    );
  },
};

/** Unsave option hidden — rows carry no per-row action. */
export const HideUnsaveOption: Story = {
  render: () => (
    <CometChatSavedMessagesContext.Provider
      value={createMockContext({ hideUnsaveMessageOption: true })}
    >
      <Panel>
        <CometChatSavedMessages.Header />
        <CometChatSavedMessages.List />
      </Panel>
    </CometChatSavedMessagesContext.Provider>
  ),
};
