/**
 * CometChatConversationItem Storybook Stories
 *
 * Demonstrates a single conversation item in isolation:
 * - Default (user conversation with unread count)
 * - Group conversation
 * - No last message
 * - With typing indicator
 *
 * @module components/CometChatConversations/CometChatConversationItem
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { CometChatConversationsItem } from './CometChatConversationsItem';
import { CometChatConversationsContext } from './CometChatConversations.context';
import type { CometChatConversationsContextValue } from './CometChatConversations.types';

// ============================================
// Mock Data
// ============================================

function createMockUser(uid: string, name: string, status = 'online') {
  return {
    getUid: () => uid,
    getName: () => name,
    getStatus: () => status,
    getAvatar: () => `https://i.pravatar.cc/150?u=${uid}`,
    getBlockedByMe: () => false,
    getHasBlockedMe: () => false,
  } as unknown as CometChat.User;
}

function createMockGroup(guid: string, name: string) {
  return {
    getGuid: () => guid,
    getName: () => name,
    getAvatar: () => `https://i.pravatar.cc/150?u=${guid}`,
    getMembersCount: () => 5,
    getIcon: () => `https://i.pravatar.cc/150?u=${guid}`,
  } as unknown as CometChat.Group;
}

function createMockTextMessage(
  id: number,
  text: string,
  sentAt: number,
  senderUid = 'sender-1',
  senderName = 'Sender'
) {
  return {
    getId: () => id,
    getType: () => 'text',
    getText: () => text,
    getSentAt: () => sentAt,
    getCategory: () => 'message',
    getSender: () => createMockUser(senderUid, senderName),
    getDeletedAt: () => null,
    getParentMessageId: () => null,
    getReadAt: () => sentAt + 10,
    getDeliveredAt: () => sentAt + 5,
  } as unknown as CometChat.TextMessage;
}

function createMockConversation(
  id: string,
  type: 'user' | 'group',
  entity: CometChat.User | CometChat.Group,
  lastMessage: CometChat.BaseMessage | null,
  unreadCount = 0
) {
  return {
    getConversationId: () => id,
    getConversationType: () => type,
    getConversationWith: () => entity,
    getLastMessage: () => lastMessage,
    getUnreadMessageCount: () => unreadCount,
  } as unknown as CometChat.Conversation;
}

const now = Math.floor(Date.now() / 1000);

const userConversation = createMockConversation(
  'conv_user_alice',
  'user',
  createMockUser('alice-1', 'Alice Johnson', 'online'),
  createMockTextMessage(1, 'Hey! How are you doing?', now - 60),
  3
);

const groupConversation = createMockConversation(
  'conv_group_team',
  'group',
  createMockGroup('team-1', 'Engineering Team'),
  createMockTextMessage(3, 'The build is passing now', now - 7200, 'bob-1', 'Bob Smith'),
  12
);

const noMessageConversation = createMockConversation(
  'conv_user_emma',
  'user',
  createMockUser('emma-1', 'Emma Davis', 'online'),
  null,
  0
);

// ============================================
// Context mock helper
// ============================================

function createMockContext(
  overrides: Partial<CometChatConversationsContextValue> = {}
): CometChatConversationsContextValue {
  return {
    conversations: [],
    fetchState: 'loaded',
    hasMore: false,
    error: null,
    selectedConversationIds: [],
    selectedConversationsMap: new Map(),
    activeConversationId: null,
    searchText: '',
    selectionMode: 'none',
    hideUserStatus: false,
    hideUnreadCount: false,
    hideReceipts: false,
    options: undefined,
    fetchNext: async () => {},
    setSearchText: () => {},
    selectConversation: () => {},
    deselectConversation: () => {},
    selectRange: () => {},
    deselectRange: () => {},
    clearSelection: () => {},
    setActiveConversation: () => {},
    handleItemClick: () => {},
    deleteConversation: async () => {},
    setConversationToBeDeleted: () => {},
    conversationToBeDeleted: null,
    hideGroupType: false,
    loggedInUserId: 'me-1',
    typingIndicatorMap: new Map(),
    hideDeleteConversation: false,
    showSearchBar: false,
    ...overrides,
  };
}

// ============================================
// Meta Configuration
// ============================================

const meta: Meta<typeof CometChatConversationsItem> = {
  title: 'Components/Conversations/CometChat Conversation Item',
  component: CometChatConversationsItem,
  tags: ['autodocs'],
  args: {
    hideUserStatus: false,
    hideReceipts: false,
    hideDeleteButton: true,
  },
  argTypes: {
    hideUserStatus: {
      control: 'boolean',
      description: 'Hide the online/offline status indicator.',
    },
    hideReceipts: {
      control: 'boolean',
      description: 'Hide message read receipts.',
    },
    hideDeleteButton: {
      control: 'boolean',
      description: 'Hide the delete button on hover.',
    },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A single conversation list item showing avatar, name, last message preview, timestamp, and unread badge.',
      },
    },
  },
  decorators: [
    Story => (
      <div
        style={{
          width: 400,
          border: '1px solid var(--cometchat-border-color-light, #eee)',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof CometChatConversationsItem>;

// ============================================
// Stories
// ============================================

/** Default — user conversation with unread messages. */
export const Default: Story = {
  render: args => (
    <CometChatConversationsContext.Provider value={createMockContext()}>
      <CometChatConversationsItem
        conversation={userConversation}
        hideUserStatus={args.hideUserStatus}
        hideReceipts={args.hideReceipts}
        hideDeleteButton={args.hideDeleteButton}
      />
    </CometChatConversationsContext.Provider>
  ),
};

/** Group conversation with sender name in subtitle. */
export const GroupConversation: Story = {
  render: args => (
    <CometChatConversationsContext.Provider value={createMockContext()}>
      <CometChatConversationsItem
        conversation={groupConversation}
        hideUserStatus={args.hideUserStatus}
        hideReceipts={args.hideReceipts}
        hideDeleteButton={args.hideDeleteButton}
      />
    </CometChatConversationsContext.Provider>
  ),
};

/** Conversation with no last message. */
export const NoLastMessage: Story = {
  render: args => (
    <CometChatConversationsContext.Provider value={createMockContext()}>
      <CometChatConversationsItem
        conversation={noMessageConversation}
        hideUserStatus={args.hideUserStatus}
        hideReceipts={args.hideReceipts}
        hideDeleteButton={args.hideDeleteButton}
      />
    </CometChatConversationsContext.Provider>
  ),
};

/** With options prop — context menu appears on hover. */
export const WithOptions: Story = {
  render: args => {
    const options = (conversation: CometChat.Conversation) => [
      {
        id: 'pin',
        title: `Pin ${conversation.getConversationType() === 'group' ? 'Group' : 'Chat'}`,
        onClick: (conv: CometChat.Conversation) => {
          console.log('Pin clicked for:', conv.getConversationId());
        },
      },
      {
        id: 'mute',
        title: 'Mute Notifications',
        onClick: (conv: CometChat.Conversation) => {
          console.log('Mute clicked for:', conv.getConversationId());
        },
      },
      {
        id: 'archive',
        title: 'Archive',
        onClick: (conv: CometChat.Conversation) => {
          console.log('Archive clicked for:', conv.getConversationId());
        },
      },
    ];

    return (
      <CometChatConversationsContext.Provider value={createMockContext()}>
        <CometChatConversationsItem
          conversation={userConversation}
          hideUserStatus={args.hideUserStatus}
          hideReceipts={args.hideReceipts}
          hideDeleteButton={args.hideDeleteButton}
          options={options}
        />
      </CometChatConversationsContext.Provider>
    );
  },
};
