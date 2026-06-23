/**
 * CometChatConversations Storybook Stories
 *
 * Interactive stories demonstrating the conversations list component:
 * - Default (loaded with conversations)
 * - Loading state (shimmer)
 * - Empty state
 * - Error state
 * - Single selection mode
 * - Multiple selection mode
 * - With active conversation
 * - Dark theme
 * - RTL
 *
 * @module components/CometChatConversations
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { CometChatConversations } from './CometChatConversations';
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

const mockConversations = [
  createMockConversation(
    'conv_user_alice',
    'user',
    createMockUser('alice-1', 'Alice Johnson', 'online'),
    createMockTextMessage(1, 'Hey! How are you doing?', now - 60),
    3
  ),
  createMockConversation(
    'conv_user_bob',
    'user',
    createMockUser('bob-1', 'Bob Smith', 'offline'),
    createMockTextMessage(2, 'See you tomorrow!', now - 3600),
    0
  ),
  createMockConversation(
    'conv_group_team',
    'group',
    createMockGroup('team-1', 'Engineering Team'),
    createMockTextMessage(3, 'The build is passing now', now - 7200, 'alice-1', 'Alice Johnson'),
    12
  ),
  createMockConversation(
    'conv_user_charlie',
    'user',
    createMockUser('charlie-1', 'Charlie Brown', 'online'),
    createMockTextMessage(4, 'Thanks for the help!', now - 86400),
    0
  ),
  createMockConversation(
    'conv_group_design',
    'group',
    createMockGroup('design-1', 'Design Team'),
    createMockTextMessage(5, 'New mockups are ready', now - 172800, 'bob-1', 'Bob Smith'),
    1
  ),
  createMockConversation(
    'conv_user_david',
    'user',
    createMockUser('david-1', 'David Lee', 'offline'),
    createMockTextMessage(6, 'Let me check and get back to you', now - 259200),
    0
  ),
  createMockConversation(
    'conv_user_emma',
    'user',
    createMockUser('emma-1', 'Emma Davis', 'online'),
    null,
    0
  ),
];

// ============================================
// Context mock helper
// ============================================

function createMockContext(
  overrides: Partial<CometChatConversationsContextValue> = {}
): CometChatConversationsContextValue {
  return {
    conversations: mockConversations,
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
    fetchNext: async () => {
      /* no-op */
    },
    setSearchText: () => {
      /* no-op */
    },
    selectConversation: () => {
      /* no-op */
    },
    deselectConversation: () => {
      /* no-op */
    },
    selectRange: () => {
      /* no-op */
    },
    deselectRange: () => {
      /* no-op */
    },
    clearSelection: () => {
      /* no-op */
    },
    setActiveConversation: () => {
      /* no-op */
    },
    handleItemClick: () => {
      /* no-op */
    },
    deleteConversation: async () => {
      /* no-op */
    },
    setConversationToBeDeleted: () => {
      /* no-op */
    },
    conversationToBeDeleted: null,
    hideGroupType: false,
    loggedInUserId: null,
    typingIndicatorMap: new Map(),
    hideDeleteConversation: false,
    showSearchBar: true,
    ...overrides,
  };
}

// ============================================
// Wrapper styles
// ============================================

const containerStyle: React.CSSProperties = {
  width: '360px',
  height: '600px',
  border: '1px solid var(--cometchat-border-color-light, #eee)',
  borderRadius: '8px',
  overflow: 'hidden',
  background: 'var(--cometchat-background-color-01, #fff)',
};

// ============================================
// Meta Configuration
// ============================================

const meta: Meta = {
  title: 'Components/Conversations/CometChat Conversations',
  component: CometChatConversations.Root,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Displays a real-time list of conversations with search, selection modes, typing indicators, and customizable item views.',
      },
    },
    layout: 'centered',
  },
  args: {
    hideUserStatus: false,
    hideUnreadCount: false,
    hideReceipts: false,
    hideGroupType: false,
    hideDeleteConversation: false,
    showSearchBar: true,
    showScrollbar: false,
    disableSoundForMessages: false,
    selectionMode: 'none',
  },
  argTypes: {
    hideUserStatus: {
      control: 'boolean',
      description: 'Hide user online/offline status indicator on conversation items',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    hideUnreadCount: {
      control: 'boolean',
      description: 'Hide the unread count badge',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    hideReceipts: {
      control: 'boolean',
      description: 'Hide message read receipts (sent/delivered/read)',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    hideGroupType: {
      control: 'boolean',
      description: 'Hide the group type indicator (public/private/password)',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    hideDeleteConversation: {
      control: 'boolean',
      description: 'Hide the delete conversation option on items',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    showSearchBar: {
      control: 'boolean',
      description: 'Whether to show the search bar',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
      },
    },
    showScrollbar: {
      control: 'boolean',
      description: 'Show the native scrollbar on the list',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    disableSoundForMessages: {
      control: 'boolean',
      description: 'Disable sound notifications for incoming messages',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    selectionMode: {
      control: 'select',
      options: ['none', 'single', 'multiple'],
      description: 'Selection mode for list items',
      table: {
        type: { summary: "'none' | 'single' | 'multiple'" },
        defaultValue: { summary: "'none'" },
      },
    },
    onItemClick: {
      action: 'onItemClick',
      description: 'Called when a conversation item is clicked',
    },
    onSelect: {
      action: 'onSelect',
      description: 'Called when a conversation is selected or deselected',
      table: {
        type: { summary: '(conversation: Conversation, selected: boolean) => void' },
      },
    },
    onError: {
      action: 'onError',
      description: 'Called when an error occurs',
    },
    onEmpty: {
      action: 'onEmpty',
      description: 'Called when the conversation list is empty after initial fetch',
    },
    onSearchBarClicked: {
      action: 'onSearchBarClicked',
      description: 'Called when the search bar is clicked (acts as trigger for global search)',
    },
  },
  decorators: [
    Story => (
      <div style={containerStyle}>
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj;

// ============================================
// Stories
// ============================================

/** Default loaded state with conversations. */
function DefaultDemo(args: {
  hideUserStatus?: boolean;
  hideUnreadCount?: boolean;
  hideReceipts?: boolean;
  hideGroupType?: boolean;
  hideDeleteConversation?: boolean;
  showSearchBar?: boolean;
  selectionMode?: string;
}) {
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const selectedMap = new Map(
    selectedIds
      .map(id => {
        const conv = mockConversations.find(c => c.getConversationId() === id);
        return conv ? ([id, conv] as const) : null;
      })
      .filter((entry): entry is [string, (typeof mockConversations)[0]] => entry !== null)
  );

  const ctx = createMockContext({
    hideUserStatus: args.hideUserStatus,
    hideUnreadCount: args.hideUnreadCount,
    hideReceipts: args.hideReceipts,
    hideGroupType: args.hideGroupType,
    hideDeleteConversation: args.hideDeleteConversation,
    showSearchBar: args.showSearchBar,
    selectionMode: args.selectionMode,
    selectedConversationIds: selectedIds,
    selectedConversationsMap: selectedMap,
    selectConversation: (id: string) => {
      if (args.selectionMode === 'single') {
        setSelectedIds([id]);
      } else {
        setSelectedIds(prev => (prev.includes(id) ? prev : [...prev, id]));
      }
    },
    deselectConversation: (id: string) => {
      setSelectedIds(prev => prev.filter(x => x !== id));
    },
    clearSelection: () => {
      setSelectedIds([]);
    },
    handleItemClick: (conversation: CometChat.Conversation) => {
      const cid = conversation.getConversationId();
      if (args.selectionMode === 'single') {
        setSelectedIds(prev => (prev.includes(cid) ? [] : [cid]));
      } else if (args.selectionMode === 'multiple') {
        setSelectedIds(prev => (prev.includes(cid) ? prev.filter(x => x !== cid) : [...prev, cid]));
      }
    },
  });
  return (
    <CometChatConversationsContext.Provider value={ctx}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <CometChatConversations.Header />
        {args.showSearchBar !== false && <CometChatConversations.SearchBar />}
        <CometChatConversations.List />
      </div>
    </CometChatConversationsContext.Provider>
  );
}

export const Default: Story = {
  args: {
    selectionMode: 'none',
    hideReceipts: true,
    hideGroupType: false,
  },

  render: args => <DefaultDemo {...args} />,
};

/** Loading state with shimmer effect. */
export const LoadingState: Story = {
  render: args => {
    const ctx = createMockContext({
      conversations: [],
      fetchState: 'loading',
      hideUserStatus: args.hideUserStatus,
      hideUnreadCount: args.hideUnreadCount,
      hideReceipts: args.hideReceipts,
      hideGroupType: args.hideGroupType,
      hideDeleteConversation: args.hideDeleteConversation,
      showSearchBar: args.showSearchBar,
      selectionMode: args.selectionMode,
    });
    return (
      <CometChatConversationsContext.Provider value={ctx}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <CometChatConversations.Header />
          <CometChatConversations.SearchBar />
          <CometChatConversations.LoadingState />
        </div>
      </CometChatConversationsContext.Provider>
    );
  },
};

/** Empty state when no conversations are available. */
export const EmptyState: Story = {
  render: args => {
    const ctx = createMockContext({
      conversations: [],
      fetchState: 'empty',
      hideUserStatus: args.hideUserStatus,
      hideUnreadCount: args.hideUnreadCount,
      hideReceipts: args.hideReceipts,
      hideGroupType: args.hideGroupType,
      hideDeleteConversation: args.hideDeleteConversation,
      showSearchBar: args.showSearchBar,
      selectionMode: args.selectionMode,
    });
    return (
      <CometChatConversationsContext.Provider value={ctx}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <CometChatConversations.Header />
          <CometChatConversations.SearchBar />
          <CometChatConversations.EmptyState />
        </div>
      </CometChatConversationsContext.Provider>
    );
  },
};

/** Error state when fetching fails. */
export const ErrorState: Story = {
  render: args => {
    const ctx = createMockContext({
      conversations: [],
      fetchState: 'error',
      error: 'Network error',
      hideUserStatus: args.hideUserStatus,
      hideUnreadCount: args.hideUnreadCount,
      hideReceipts: args.hideReceipts,
      hideGroupType: args.hideGroupType,
      hideDeleteConversation: args.hideDeleteConversation,
      showSearchBar: args.showSearchBar,
      selectionMode: args.selectionMode,
    });
    return (
      <CometChatConversationsContext.Provider value={ctx}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <CometChatConversations.Header />
          <CometChatConversations.SearchBar />
          <CometChatConversations.ErrorState />
        </div>
      </CometChatConversationsContext.Provider>
    );
  },
};

/** Single selection mode with radio buttons. */
export const SingleSelection: Story = {
  args: {
    selectionMode: 'single',
  },
  render: args => <SingleSelectionDemo {...args} />,
};

function SingleSelectionDemo(args: any) {
  const [selectedIds, setSelectedIds] = React.useState<string[]>(['conv_user_bob']);
  const selectedMap = new Map(
    selectedIds
      .map(id => {
        const conv = mockConversations.find(c => c.getConversationId() === id);
        return conv ? ([id, conv] as const) : null;
      })
      .filter((entry): entry is [string, (typeof mockConversations)[0]] => entry !== null)
  );
  const ctx = createMockContext({
    selectionMode: 'single',
    selectedConversationIds: selectedIds,
    selectedConversationsMap: selectedMap,
    selectConversation: (id: string) => {
      setSelectedIds([id]);
    },
    deselectConversation: (id: string) => {
      setSelectedIds(prev => prev.filter(x => x !== id));
    },
    clearSelection: () => {
      setSelectedIds([]);
    },
    handleItemClick: (conversation: CometChat.Conversation) => {
      const cid = conversation.getConversationId();
      setSelectedIds(prev => (prev.includes(cid) ? [] : [cid]));
    },
    hideUserStatus: args.hideUserStatus,
    hideUnreadCount: args.hideUnreadCount,
    hideReceipts: args.hideReceipts,
    hideGroupType: args.hideGroupType,
    hideDeleteConversation: args.hideDeleteConversation,
    showSearchBar: args.showSearchBar,
  });
  return (
    <CometChatConversationsContext.Provider value={ctx}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <CometChatConversations.Header />
        <CometChatConversations.List />
      </div>
    </CometChatConversationsContext.Provider>
  );
}

/** Multiple selection mode with checkboxes. */
export const MultipleSelection: Story = {
  args: {
    selectionMode: 'multiple',
  },
  render: args => <MultipleSelectionDemo {...args} />,
};

function MultipleSelectionDemo(args: any) {
  const [selectedIds, setSelectedIds] = React.useState<string[]>([
    'conv_user_alice',
    'conv_group_team',
  ]);
  const selectedMap = new Map(
    selectedIds
      .map(id => {
        const conv = mockConversations.find(c => c.getConversationId() === id);
        return conv ? ([id, conv] as const) : null;
      })
      .filter((entry): entry is [string, (typeof mockConversations)[0]] => entry !== null)
  );
  const ctx = createMockContext({
    selectionMode: 'multiple',
    selectedConversationIds: selectedIds,
    selectedConversationsMap: selectedMap,
    selectConversation: (id: string) => {
      setSelectedIds(prev => (prev.includes(id) ? prev : [...prev, id]));
    },
    deselectConversation: (id: string) => {
      setSelectedIds(prev => prev.filter(x => x !== id));
    },
    clearSelection: () => {
      setSelectedIds([]);
    },
    handleItemClick: (conversation: CometChat.Conversation) => {
      const cid = conversation.getConversationId();
      setSelectedIds(prev => (prev.includes(cid) ? prev.filter(x => x !== cid) : [...prev, cid]));
    },
    hideUserStatus: args.hideUserStatus,
    hideUnreadCount: args.hideUnreadCount,
    hideReceipts: args.hideReceipts,
    hideGroupType: args.hideGroupType,
    hideDeleteConversation: args.hideDeleteConversation,
    showSearchBar: args.showSearchBar,
  });
  return (
    <CometChatConversationsContext.Provider value={ctx}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <CometChatConversations.Header />
        <CometChatConversations.List />
      </div>
    </CometChatConversationsContext.Provider>
  );
}

/** With active conversation highlighted. */
export const WithActiveConversation: Story = {
  render: args => {
    const ctx = createMockContext({
      activeConversationId: 'conv_user_alice',
      hideUserStatus: args.hideUserStatus,
      hideUnreadCount: args.hideUnreadCount,
      hideReceipts: args.hideReceipts,
      hideGroupType: args.hideGroupType,
      hideDeleteConversation: args.hideDeleteConversation,
      showSearchBar: args.showSearchBar,
      selectionMode: args.selectionMode,
    });
    return (
      <CometChatConversationsContext.Provider value={ctx}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <CometChatConversations.Header />
          <CometChatConversations.List />
        </div>
      </CometChatConversationsContext.Provider>
    );
  },
};

/** With unread count hidden. */
export const HiddenUnreadCount: Story = {
  args: {
    hideUnreadCount: true,
  },
  render: args => {
    const ctx = createMockContext({
      hideUnreadCount: args.hideUnreadCount,
      hideUserStatus: args.hideUserStatus,
      hideReceipts: args.hideReceipts,
      hideGroupType: args.hideGroupType,
      hideDeleteConversation: args.hideDeleteConversation,
      showSearchBar: args.showSearchBar,
      selectionMode: args.selectionMode,
    });
    return (
      <CometChatConversationsContext.Provider value={ctx}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <CometChatConversations.Header />
          <CometChatConversations.List />
        </div>
      </CometChatConversationsContext.Provider>
    );
  },
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

    const ctx = createMockContext({
      options,
      hideUserStatus: args.hideUserStatus,
      hideUnreadCount: args.hideUnreadCount,
      hideReceipts: args.hideReceipts,
      hideGroupType: args.hideGroupType,
      hideDeleteConversation: args.hideDeleteConversation,
      showSearchBar: args.showSearchBar,
      selectionMode: args.selectionMode,
    });
    return (
      <CometChatConversationsContext.Provider value={ctx}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <CometChatConversations.Header />
          <CometChatConversations.List />
        </div>
      </CometChatConversationsContext.Provider>
    );
  },
};
