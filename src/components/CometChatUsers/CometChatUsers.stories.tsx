/**
 * CometChatUsers Storybook Stories
 *
 * Interactive stories demonstrating the users list component:
 * - Default (loaded with users)
 * - Loading state (shimmer)
 * - Empty state
 * - Error state
 * - Single selection mode
 * - Multiple selection mode with preview
 * - With section headers
 * - Dark theme
 *
 * @module components/CometChatUsers
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { CometChatUsers } from './CometChatUsers';
import { CometChatUsersContext } from './CometChatUsers.context';
import type { CometChatUsersContextValue } from './CometChatUsers.types';

// ============================================
// Mock Data
// ============================================

function createMockUser(uid: string, name: string, status = 'online') {
  return {
    getUid: () => uid,
    getName: () => name,
    getStatus: () => status,
    getAvatar: () => `https://i.pravatar.cc/150?u=${uid}`,
  } as unknown as CometChat.User;
}

const mockUsers = [
  createMockUser('alice-1', 'Alice Johnson', 'online'),
  createMockUser('alice-2', 'Alice Williams', 'offline'),
  createMockUser('bob-1', 'Bob Smith', 'online'),
  createMockUser('charlie-1', 'Charlie Brown', 'offline'),
  createMockUser('david-1', 'David Lee', 'online'),
  createMockUser('emma-1', 'Emma Davis', 'online'),
  createMockUser('frank-1', 'Frank Miller', 'offline'),
  createMockUser('grace-1', 'Grace Wilson', 'online'),
  createMockUser('henry-1', 'Henry Taylor', 'offline'),
  createMockUser('iris-1', 'Iris Anderson', 'online'),
];

// ============================================
// Context mock helper
// ============================================

function createMockContext(
  overrides: Partial<CometChatUsersContextValue> = {}
): CometChatUsersContextValue {
  return {
    users: mockUsers,
    fetchState: 'loaded',
    hasMore: false,
    error: null,
    selectedUserIds: [],
    selectedUsersMap: new Map(),
    activeUserId: null,
    searchText: '',
    selectionMode: 'none',
    hideUserStatus: false,
    sectionHeaderKey: 'getName',
    hideSearch: false,
    showSectionHeader: true,
    showSelectedUsersPreview: false,
    showScrollbar: false,
    options: undefined,
    fetchNext: async () => {
      /* no-op */
    },
    setSearchText: () => {
      /* no-op */
    },
    selectUser: () => {
      /* no-op */
    },
    deselectUser: () => {
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
    setActiveUser: () => {
      /* no-op */
    },
    handleItemClick: () => {
      /* no-op */
    },
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
  title: 'Components/Users/CometChat Users',
  component: CometChatUsers.Root,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Displays a searchable, paginated list of CometChat users with selection modes and customizable item views.',
      },
    },
    layout: 'centered',
  },
  args: {
    hideUserStatus: false,
    hideSearch: false,
    showSectionHeader: true,
    showSelectedUsersPreview: false,
    showScrollbar: false,
    selectionMode: 'none',
  },
  argTypes: {
    hideUserStatus: {
      control: 'boolean',
      description: 'Hide user online/offline status indicator',
    },
    hideSearch: {
      control: 'boolean',
      description: 'Hide the search bar',
    },
    showSectionHeader: {
      control: 'boolean',
      description: 'Show alphabetical section headers',
    },
    showSelectedUsersPreview: {
      control: 'boolean',
      description: 'Show a preview bar of selected users (chips) in multiple selection mode',
    },
    showScrollbar: {
      control: 'boolean',
      description: 'Show the native scrollbar on the list',
    },
    selectionMode: {
      control: 'select',
      options: ['none', 'single', 'multiple'],
      description: 'Selection mode for list items',
    },
    onItemClick: {
      action: 'onItemClick',
      description: 'Called when a user item is clicked',
    },
    onSelect: {
      action: 'onSelect',
      description: 'Called when a user is selected or deselected',
    },
    onError: {
      action: 'onError',
      description: 'Called when an error occurs',
    },
    onEmpty: {
      action: 'onEmpty',
      description: 'Called when the user list is empty after initial fetch',
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

/** Default loaded state with users. */
function DefaultDemo(args: {
  hideUserStatus?: boolean;
  hideSearch?: boolean;
  showSectionHeader?: boolean;
  showSelectedUsersPreview?: boolean;
  selectionMode?: string;
}) {
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const selectedMap = new Map(
    selectedIds
      .map(id => {
        const user = mockUsers.find(u => u.getUid() === id);
        return user ? ([id, user] as const) : null;
      })
      .filter((entry): entry is [string, (typeof mockUsers)[0]] => entry !== null)
  );

  const ctx = createMockContext({
    hideUserStatus: args.hideUserStatus,
    hideSearch: args.hideSearch,
    showSectionHeader: args.showSectionHeader,
    showSelectedUsersPreview: args.showSelectedUsersPreview,
    selectionMode: args.selectionMode,
    selectedUserIds: selectedIds,
    selectedUsersMap: selectedMap,
    selectUser: (id: string) => {
      if (args.selectionMode === 'single') {
        setSelectedIds([id]);
      } else {
        setSelectedIds(prev => (prev.includes(id) ? prev : [...prev, id]));
      }
    },
    deselectUser: (id: string) => {
      setSelectedIds(prev => prev.filter(x => x !== id));
    },
    clearSelection: () => {
      setSelectedIds([]);
    },
    handleItemClick: (user: CometChat.User) => {
      const uid = user.getUid();
      if (args.selectionMode === 'single') {
        setSelectedIds(prev => (prev.includes(uid) ? [] : [uid]));
      } else if (args.selectionMode === 'multiple') {
        setSelectedIds(prev => (prev.includes(uid) ? prev.filter(x => x !== uid) : [...prev, uid]));
      }
    },
  });
  return (
    <CometChatUsersContext.Provider value={ctx}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <CometChatUsers.Header />
        {args.hideSearch !== true && <CometChatUsers.SearchBar />}
        <CometChatUsers.List />
      </div>
    </CometChatUsersContext.Provider>
  );
}

export const Default: Story = {
  render: args => <DefaultDemo {...args} />,
};

/** Loading state with shimmer effect. */
export const LoadingState: Story = {
  render: args => {
    const ctx = createMockContext({
      users: [],
      fetchState: 'loading',
      hideUserStatus: args.hideUserStatus,
      hideSearch: args.hideSearch,
      showSectionHeader: args.showSectionHeader,
      showSelectedUsersPreview: args.showSelectedUsersPreview,
      selectionMode: args.selectionMode,
    });
    return (
      <CometChatUsersContext.Provider value={ctx}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <CometChatUsers.Header />
          <CometChatUsers.SearchBar />
          <CometChatUsers.LoadingState />
        </div>
      </CometChatUsersContext.Provider>
    );
  },
};

/** Empty state when no users are available. */
export const EmptyState: Story = {
  render: args => {
    const ctx = createMockContext({
      users: [],
      fetchState: 'empty',
      hideUserStatus: args.hideUserStatus,
      hideSearch: args.hideSearch,
      showSectionHeader: args.showSectionHeader,
      selectionMode: args.selectionMode,
    });
    return (
      <CometChatUsersContext.Provider value={ctx}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <CometChatUsers.Header />
          <CometChatUsers.SearchBar />
          <CometChatUsers.EmptyState />
        </div>
      </CometChatUsersContext.Provider>
    );
  },
};

/** Error state when fetching fails. */
export const ErrorState: Story = {
  render: args => {
    const ctx = createMockContext({
      users: [],
      fetchState: 'error',
      error: 'Network error',
      hideUserStatus: args.hideUserStatus,
      hideSearch: args.hideSearch,
      showSectionHeader: args.showSectionHeader,
      selectionMode: args.selectionMode,
    });
    return (
      <CometChatUsersContext.Provider value={ctx}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <CometChatUsers.Header />
          <CometChatUsers.SearchBar />
          <CometChatUsers.ErrorState />
        </div>
      </CometChatUsersContext.Provider>
    );
  },
};

/** Single selection mode with radio buttons. */
export const SingleSelection: Story = {
  args: { selectionMode: 'single' },
  render: args => <UsersSingleSelectionDemo {...args} />,
};

function UsersSingleSelectionDemo(args: any) {
  const [selectedIds, setSelectedIds] = React.useState<string[]>(['bob-1']);
  const selectedMap = new Map(
    selectedIds
      .map(id => {
        const user = mockUsers.find(u => u.getUid() === id);
        return user ? ([id, user] as const) : null;
      })
      .filter((entry): entry is [string, (typeof mockUsers)[0]] => entry !== null)
  );
  const ctx = createMockContext({
    selectionMode: args.selectionMode,
    hideUserStatus: args.hideUserStatus,
    hideSearch: args.hideSearch,
    showSectionHeader: args.showSectionHeader,
    selectedUserIds: selectedIds,
    selectedUsersMap: selectedMap,
    selectUser: (id: string) => {
      setSelectedIds([id]);
    },
    deselectUser: (id: string) => {
      setSelectedIds(prev => prev.filter(x => x !== id));
    },
    clearSelection: () => {
      setSelectedIds([]);
    },
    handleItemClick: (user: CometChat.User) => {
      const uid = user.getUid();
      setSelectedIds(prev => (prev.includes(uid) ? [] : [uid]));
    },
  });
  return (
    <CometChatUsersContext.Provider value={ctx}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <CometChatUsers.Header />
        <CometChatUsers.List />
      </div>
    </CometChatUsersContext.Provider>
  );
}

/** Multiple selection mode with checkboxes. */
export const MultipleSelection: Story = {
  args: { selectionMode: 'multiple', showSelectedUsersPreview: true },
  render: args => <UsersMultipleSelectionDemo {...args} />,
};

function UsersMultipleSelectionDemo(args: any) {
  const [selectedIds, setSelectedIds] = React.useState<string[]>([
    'alice-1',
    'charlie-1',
    'emma-1',
  ]);
  const selectedMap = new Map(
    selectedIds
      .map(id => {
        const user = mockUsers.find(u => u.getUid() === id);
        return user ? ([id, user] as const) : null;
      })
      .filter((entry): entry is [string, (typeof mockUsers)[0]] => entry !== null)
  );
  const ctx = createMockContext({
    selectionMode: args.selectionMode,
    hideUserStatus: args.hideUserStatus,
    hideSearch: args.hideSearch,
    showSectionHeader: args.showSectionHeader,
    showSelectedUsersPreview: args.showSelectedUsersPreview,
    selectedUserIds: selectedIds,
    selectedUsersMap: selectedMap,
    selectUser: (id: string) => {
      setSelectedIds(prev => (prev.includes(id) ? prev : [...prev, id]));
    },
    deselectUser: (id: string) => {
      setSelectedIds(prev => prev.filter(x => x !== id));
    },
    clearSelection: () => {
      setSelectedIds([]);
    },
    handleItemClick: (user: CometChat.User) => {
      const uid = user.getUid();
      setSelectedIds(prev => (prev.includes(uid) ? prev.filter(x => x !== uid) : [...prev, uid]));
    },
  });
  return (
    <CometChatUsersContext.Provider value={ctx}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <CometChatUsers.Header />
        <CometChatUsers.List />
        <CometChatUsers.SelectedPreview />
      </div>
    </CometChatUsersContext.Provider>
  );
}

/** With active user highlighted. */
export const WithActiveUser: Story = {
  render: args => {
    const ctx = createMockContext({
      activeUserId: 'david-1',
      hideUserStatus: args.hideUserStatus,
      hideSearch: args.hideSearch,
      showSectionHeader: args.showSectionHeader,
      selectionMode: args.selectionMode,
    });
    return (
      <CometChatUsersContext.Provider value={ctx}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <CometChatUsers.Header />
          <CometChatUsers.List />
        </div>
      </CometChatUsersContext.Provider>
    );
  },
};

/** With user status hidden. */
export const HiddenUserStatus: Story = {
  args: { hideUserStatus: true },
  render: args => {
    const ctx = createMockContext({
      hideUserStatus: args.hideUserStatus,
      hideSearch: args.hideSearch,
      showSectionHeader: args.showSectionHeader,
      selectionMode: args.selectionMode,
    });
    return (
      <CometChatUsersContext.Provider value={ctx}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <CometChatUsers.Header />
          <CometChatUsers.List />
        </div>
      </CometChatUsersContext.Provider>
    );
  },
};

/** With scrollbar hidden (default). */
export const HideScrollbar: Story = {
  render: args => {
    const ctx = createMockContext({
      showScrollbar: false,
      hideUserStatus: args.hideUserStatus,
      hideSearch: args.hideSearch,
      showSectionHeader: args.showSectionHeader,
      selectionMode: args.selectionMode,
    });
    return (
      <CometChatUsersContext.Provider value={ctx}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <CometChatUsers.Header />
          <CometChatUsers.List />
        </div>
      </CometChatUsersContext.Provider>
    );
  },
};

/** With scrollbar visible. */
export const ShowScrollbar: Story = {
  render: args => {
    const ctx = createMockContext({
      showScrollbar: true,
      hideUserStatus: args.hideUserStatus,
      hideSearch: args.hideSearch,
      showSectionHeader: args.showSectionHeader,
      selectionMode: args.selectionMode,
    });
    return (
      <CometChatUsersContext.Provider value={ctx}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <CometChatUsers.Header />
          <CometChatUsers.List />
        </div>
      </CometChatUsersContext.Provider>
    );
  },
};

/** With section headers (A, B, C...). */
export const ShowSectionHeader: Story = {
  args: { showSectionHeader: true },
  render: args => {
    const ctx = createMockContext({
      showSectionHeader: args.showSectionHeader,
      hideUserStatus: args.hideUserStatus,
      hideSearch: args.hideSearch,
      selectionMode: args.selectionMode,
    });
    return (
      <CometChatUsersContext.Provider value={ctx}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <CometChatUsers.Header />
          <CometChatUsers.List />
        </div>
      </CometChatUsersContext.Provider>
    );
  },
};

/** Without section headers. */
export const HideSectionHeader: Story = {
  args: { showSectionHeader: false },
  render: args => {
    const ctx = createMockContext({
      showSectionHeader: args.showSectionHeader,
      hideUserStatus: args.hideUserStatus,
      hideSearch: args.hideSearch,
      selectionMode: args.selectionMode,
    });
    return (
      <CometChatUsersContext.Provider value={ctx}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <CometChatUsers.Header />
          <CometChatUsers.List />
        </div>
      </CometChatUsersContext.Provider>
    );
  },
};
