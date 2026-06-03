/**
 * CometChatGroups Storybook Stories
 *
 * Interactive stories demonstrating the groups list component:
 * - Default (loaded with groups)
 * - WithSearch (search bar active)
 * - Loading state (shimmer)
 * - Empty state
 * - Error state
 * - Single selection mode
 * - Multiple selection mode
 * - With active group highlighted
 * - Dark theme
 * - RTL layout
 *
 * @module components/CometChatGroups
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { CometChatGroups } from './CometChatGroups';
import { CometChatGroupsContext } from './CometChatGroups.context';
import type { CometChatGroupsContextValue } from './CometChatGroups.types';

// ============================================
// Mock Data
// ============================================

function createMockGroup(guid: string, name: string, type = 'public', membersCount = 5) {
  return {
    getGuid: () => guid,
    getName: () => name,
    getType: () => type,
    getIcon: () => `https://i.pravatar.cc/150?u=${guid}`,
    getMembersCount: () => membersCount,
    getScope: () => 'admin',
    getOwner: () => 'owner-1',
    getHasJoined: () => true,
  } as unknown as CometChat.Group;
}

const mockGroups = [
  createMockGroup('group-1', 'Engineering Team', 'public', 12),
  createMockGroup('group-2', 'Design Squad', 'private', 8),
  createMockGroup('group-3', 'Secret Project', 'password', 4),
  createMockGroup('group-4', 'Marketing', 'public', 15),
  createMockGroup('group-5', 'Product Roadmap', 'private', 6),
  createMockGroup('group-6', 'Customer Support', 'public', 20),
  createMockGroup('group-7', 'Leadership', 'password', 3),
  createMockGroup('group-8', 'Social Club', 'public', 45),
  createMockGroup('group-9', 'QA Testing', 'private', 9),
  createMockGroup('group-10', 'DevOps', 'public', 7),
];

// ============================================
// Context mock helper
// ============================================

function createMockContext(
  overrides: Partial<CometChatGroupsContextValue> = {}
): CometChatGroupsContextValue {
  return {
    groups: mockGroups,
    fetchState: 'loaded',
    hasMore: false,
    error: null,
    selectedGroupIds: [],
    selectedGroupsMap: new Map(),
    activeGroupId: null,
    searchText: '',
    selectionMode: 'none',
    hideGroupType: false,
    hideSearch: false,
    options: undefined,
    fetchNext: async () => {
      /* no-op */
    },
    setSearchText: () => {
      /* no-op */
    },
    selectGroup: () => {
      /* no-op */
    },
    deselectGroup: () => {
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
    setActiveGroup: () => {
      /* no-op */
    },
    handleItemClick: () => {
      /* no-op */
    },
    createGroup: (group: CometChat.Group) => Promise.resolve(group),
    joinGroup: () => Promise.resolve(mockGroups[0]!),
    leaveGroup: () => Promise.resolve(true),
    deleteGroup: () => Promise.resolve(true),
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
  title: 'Components/Groups/CometChat Groups',
  component: CometChatGroups.Root,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Displays a searchable, paginated list of CometChat groups with selection modes and customizable item views.',
      },
    },
    layout: 'centered',
  },
  args: {
    hideGroupType: false,
    hideSearch: false,
    showScrollbar: false,
    selectionMode: 'none',
  },
  argTypes: {
    hideGroupType: {
      control: 'boolean',
      description: 'Hide the group type badge (public/private/password)',
    },
    hideSearch: {
      control: 'boolean',
      description: 'Hide the search bar',
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
      description: 'Called when a group item is clicked',
    },
    onSelect: {
      action: 'onSelect',
      description: 'Called when a group is selected or deselected',
    },
    onError: {
      action: 'onError',
      description: 'Called when an error occurs',
    },
    onEmpty: {
      action: 'onEmpty',
      description: 'Called when the group list is empty after initial fetch',
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

/** Default loaded state with groups. */
function DefaultDemo(args: {
  hideGroupType?: boolean;
  hideSearch?: boolean;
  selectionMode?: string;
}) {
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const selectedMap = new Map(
    selectedIds
      .map(id => {
        const group = mockGroups.find(g => g.getGuid() === id);
        return group ? ([id, group] as const) : null;
      })
      .filter((entry): entry is [string, (typeof mockGroups)[0]] => entry !== null)
  );

  const ctx = createMockContext({
    hideGroupType: args.hideGroupType,
    hideSearch: args.hideSearch,
    selectionMode: args.selectionMode,
    selectedGroupIds: selectedIds,
    selectedGroupsMap: selectedMap,
    selectGroup: (id: string) => {
      if (args.selectionMode === 'single') {
        setSelectedIds([id]);
      } else {
        setSelectedIds(prev => (prev.includes(id) ? prev : [...prev, id]));
      }
    },
    deselectGroup: (id: string) => {
      setSelectedIds(prev => prev.filter(x => x !== id));
    },
    clearSelection: () => {
      setSelectedIds([]);
    },
    handleItemClick: (group: CometChat.Group) => {
      const gid = group.getGuid();
      if (args.selectionMode === 'single') {
        setSelectedIds(prev => (prev.includes(gid) ? [] : [gid]));
      } else if (args.selectionMode === 'multiple') {
        setSelectedIds(prev => (prev.includes(gid) ? prev.filter(x => x !== gid) : [...prev, gid]));
      }
    },
  });
  return (
    <CometChatGroupsContext.Provider value={ctx}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <CometChatGroups.Header />
        {args.hideSearch !== true && <CometChatGroups.SearchBar />}
        <CometChatGroups.List />
      </div>
    </CometChatGroupsContext.Provider>
  );
}

export const Default: Story = {
  render: args => <DefaultDemo {...args} />,
};

/** With search bar active and filtered results. */
export const WithSearch: Story = {
  render: args => {
    const filteredGroups = mockGroups.filter(g => g.getName().toLowerCase().includes('design'));
    const ctx = createMockContext({
      groups: filteredGroups,
      searchText: 'design',
      hideGroupType: args.hideGroupType,
      hideSearch: args.hideSearch,
      selectionMode: args.selectionMode,
    });
    return (
      <CometChatGroupsContext.Provider value={ctx}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <CometChatGroups.Header />
          <CometChatGroups.SearchBar />
          <CometChatGroups.List />
        </div>
      </CometChatGroupsContext.Provider>
    );
  },
};

/** Loading state with shimmer effect. */
export const LoadingState: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <CometChatGroups.Header />
      <CometChatGroups.LoadingState />
    </div>
  ),
};

/** Empty state when no groups are available. */
export const EmptyState: Story = {
  render: args => {
    const ctx = createMockContext({
      groups: [],
      fetchState: 'empty',
      hideGroupType: args.hideGroupType,
      hideSearch: args.hideSearch,
      selectionMode: args.selectionMode,
    });
    return (
      <CometChatGroupsContext.Provider value={ctx}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <CometChatGroups.Header />
          <CometChatGroups.SearchBar />
          <CometChatGroups.EmptyState />
        </div>
      </CometChatGroupsContext.Provider>
    );
  },
};

/** Error state when fetching fails. */
export const ErrorState: Story = {
  render: args => {
    const ctx = createMockContext({
      groups: [],
      fetchState: 'error',
      error: 'Network error',
      hideGroupType: args.hideGroupType,
      hideSearch: args.hideSearch,
      selectionMode: args.selectionMode,
    });
    return (
      <CometChatGroupsContext.Provider value={ctx}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <CometChatGroups.Header />
          <CometChatGroups.SearchBar />
          <CometChatGroups.ErrorState />
        </div>
      </CometChatGroupsContext.Provider>
    );
  },
};

/** Single selection mode with radio buttons. */
export const SingleSelection: Story = {
  args: { selectionMode: 'single' },
  render: args => <GroupsSingleSelectionDemo {...args} />,
};

function GroupsSingleSelectionDemo(args: any) {
  const [selectedIds, setSelectedIds] = React.useState<string[]>(['group-2']);
  const selectedMap = new Map(
    selectedIds
      .map(id => {
        const group = mockGroups.find(g => g.getGuid() === id);
        return group ? ([id, group] as const) : null;
      })
      .filter((entry): entry is [string, (typeof mockGroups)[0]] => entry !== null)
  );
  const ctx = createMockContext({
    selectionMode: args.selectionMode,
    hideGroupType: args.hideGroupType,
    hideSearch: args.hideSearch,
    selectedGroupIds: selectedIds,
    selectedGroupsMap: selectedMap,
    selectGroup: (id: string) => {
      setSelectedIds([id]);
    },
    deselectGroup: (id: string) => {
      setSelectedIds(prev => prev.filter(x => x !== id));
    },
    clearSelection: () => {
      setSelectedIds([]);
    },
    handleItemClick: (group: CometChat.Group) => {
      const gid = group.getGuid();
      setSelectedIds(prev => (prev.includes(gid) ? [] : [gid]));
    },
  });
  return (
    <CometChatGroupsContext.Provider value={ctx}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <CometChatGroups.Header />
        <CometChatGroups.List />
      </div>
    </CometChatGroupsContext.Provider>
  );
}

/** Multiple selection mode with checkboxes. */
export const MultipleSelection: Story = {
  args: { selectionMode: 'multiple' },
  render: args => <GroupsMultipleSelectionDemo {...args} />,
};

function GroupsMultipleSelectionDemo(args: any) {
  const [selectedIds, setSelectedIds] = React.useState<string[]>(['group-1', 'group-3', 'group-6']);
  const selectedMap = new Map(
    selectedIds
      .map(id => {
        const group = mockGroups.find(g => g.getGuid() === id);
        return group ? ([id, group] as const) : null;
      })
      .filter((entry): entry is [string, (typeof mockGroups)[0]] => entry !== null)
  );
  const ctx = createMockContext({
    selectionMode: args.selectionMode,
    hideGroupType: args.hideGroupType,
    hideSearch: args.hideSearch,
    selectedGroupIds: selectedIds,
    selectedGroupsMap: selectedMap,
    selectGroup: (id: string) => {
      setSelectedIds(prev => (prev.includes(id) ? prev : [...prev, id]));
    },
    deselectGroup: (id: string) => {
      setSelectedIds(prev => prev.filter(x => x !== id));
    },
    clearSelection: () => {
      setSelectedIds([]);
    },
    handleItemClick: (group: CometChat.Group) => {
      const gid = group.getGuid();
      setSelectedIds(prev => (prev.includes(gid) ? prev.filter(x => x !== gid) : [...prev, gid]));
    },
  });
  return (
    <CometChatGroupsContext.Provider value={ctx}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <CometChatGroups.Header />
        <CometChatGroups.List />
      </div>
    </CometChatGroupsContext.Provider>
  );
}

/** With active group highlighted. */
export const WithActiveGroup: Story = {
  render: args => {
    const ctx = createMockContext({
      activeGroupId: 'group-4',
      hideGroupType: args.hideGroupType,
      hideSearch: args.hideSearch,
      selectionMode: args.selectionMode,
    });
    return (
      <CometChatGroupsContext.Provider value={ctx}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <CometChatGroups.Header />
          <CometChatGroups.List />
        </div>
      </CometChatGroupsContext.Provider>
    );
  },
};

/** With scrollbar hidden (default). */
export const HideScrollbar: Story = {
  render: args => {
    const ctx = createMockContext({
      hideGroupType: args.hideGroupType,
      hideSearch: args.hideSearch,
      selectionMode: args.selectionMode,
    });
    return (
      <CometChatGroupsContext.Provider value={ctx}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <CometChatGroups.Header />
          <CometChatGroups.List />
        </div>
      </CometChatGroupsContext.Provider>
    );
  },
};

/** With scrollbar visible. */
export const ShowScrollbar: Story = {
  render: args => {
    const ctx = createMockContext({
      hideGroupType: args.hideGroupType,
      hideSearch: args.hideSearch,
      selectionMode: args.selectionMode,
    });
    return (
      <CometChatGroupsContext.Provider value={ctx}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <CometChatGroups.Header />
          <CometChatGroups.List />
        </div>
      </CometChatGroupsContext.Provider>
    );
  },
};
