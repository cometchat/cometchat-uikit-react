/**
 * CometChatGroupItem Storybook Stories
 *
 * Demonstrates a single group item in isolation:
 * - Default (public group)
 * - Private group
 * - Password-protected group
 * - All variants showcase
 *
 * @module components/CometChatGroups/CometChatGroupItem
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

const publicGroup = createMockGroup('group-1', 'Engineering Team', 'public', 12);
const privateGroup = createMockGroup('group-2', 'Design Squad', 'private', 8);
const passwordGroup = createMockGroup('group-3', 'Secret Project', 'password', 4);

// ============================================
// Context mock helper
// ============================================

function createMockContext(
  overrides: Partial<CometChatGroupsContextValue> = {}
): CometChatGroupsContextValue {
  return {
    groups: [],
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
    fetchNext: async () => {},
    setSearchText: () => {},
    selectGroup: () => {},
    deselectGroup: () => {},
    selectRange: () => {},
    deselectRange: () => {},
    clearSelection: () => {},
    setActiveGroup: () => {},
    handleItemClick: () => {},
    ...overrides,
  };
}

// ============================================
// Meta Configuration
// ============================================

const meta: Meta = {
  title: 'Components/Groups/CometChat Group Item',
  tags: ['autodocs'],
  args: {
    hideGroupType: false,
  },
  argTypes: {
    hideGroupType: {
      control: 'boolean',
      description: 'Hide the group type icon (public/private/password).',
    },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A single group list item showing avatar, name, member count, and group type indicator.',
      },
    },
  },
  decorators: [
    (Story: React.ComponentType) => (
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
type Story = StoryObj;

// ============================================
// Stories
// ============================================

/** Default — public group. */
export const Default: Story = {
  render: args => (
    <CometChatGroupsContext.Provider
      value={createMockContext({ hideGroupType: args.hideGroupType })}
    >
      <CometChatGroups.Item group={publicGroup} />
    </CometChatGroupsContext.Provider>
  ),
};

/** Private group. */
export const PrivateGroup: Story = {
  render: args => (
    <CometChatGroupsContext.Provider
      value={createMockContext({ hideGroupType: args.hideGroupType })}
    >
      <CometChatGroups.Item group={privateGroup} />
    </CometChatGroupsContext.Provider>
  ),
};

/** Password-protected group. */
export const PasswordGroup: Story = {
  render: args => (
    <CometChatGroupsContext.Provider
      value={createMockContext({ hideGroupType: args.hideGroupType })}
    >
      <CometChatGroups.Item group={passwordGroup} />
    </CometChatGroupsContext.Provider>
  ),
};

/** All variants showcase. */
export const AllVariantsShowcase: Story = {
  render: args => (
    <CometChatGroupsContext.Provider
      value={createMockContext({ hideGroupType: args.hideGroupType })}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        <CometChatGroups.Item group={publicGroup} />
        <CometChatGroups.Item group={privateGroup} />
        <CometChatGroups.Item group={passwordGroup} />
      </div>
    </CometChatGroupsContext.Provider>
  ),
};
