/**
 * CometChatUserItem Storybook Stories
 *
 * Demonstrates a single user item in isolation:
 * - Default (online user)
 * - Offline user
 * - Without status indicator
 *
 * @module components/CometChatUsers/CometChatUserItem
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

const onlineUser = createMockUser('alice-1', 'Alice Johnson', 'online');
const offlineUser = createMockUser('bob-1', 'Bob Smith', 'offline');

// ============================================
// Context mock helper
// ============================================

function createMockContext(
  overrides: Partial<CometChatUsersContextValue> = {}
): CometChatUsersContextValue {
  return {
    users: [],
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
    options: undefined,
    fetchNext: async () => {},
    setSearchText: () => {},
    selectUser: () => {},
    deselectUser: () => {},
    selectRange: () => {},
    deselectRange: () => {},
    clearSelection: () => {},
    setActiveUser: () => {},
    handleItemClick: () => {},
    ...overrides,
  };
}

// ============================================
// Meta Configuration
// ============================================

const meta: Meta = {
  title: 'Components/Users/CometChat User Item',
  tags: ['autodocs'],
  args: {
    hideUserStatus: false,
  },
  argTypes: {
    hideUserStatus: {
      control: 'boolean',
      description: 'Hide the online/offline status indicator.',
    },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A single user list item showing avatar, name, and online/offline status indicator.',
      },
    },
  },
  decorators: [
    Story => (
      <div
        style={{
          width: 400,
          borderRadius: 8,
          overflow: 'hidden',
          background: 'var(--cometchat-background-color-01, #fff)',
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

/** Default — online user. */
export const Default: Story = {
  render: args => (
    <CometChatUsersContext.Provider
      value={createMockContext({ hideUserStatus: args.hideUserStatus })}
    >
      <CometChatUsers.Item user={onlineUser} />
    </CometChatUsersContext.Provider>
  ),
};

/** Offline user — no status indicator shown. */
export const OfflineUser: Story = {
  render: args => (
    <CometChatUsersContext.Provider
      value={createMockContext({ hideUserStatus: args.hideUserStatus })}
    >
      <CometChatUsers.Item user={offlineUser} />
    </CometChatUsersContext.Provider>
  ),
};

/** Without status indicator. */
export const WithoutStatus: Story = {
  render: () => (
    <CometChatUsersContext.Provider value={createMockContext({ hideUserStatus: true })}>
      <CometChatUsers.Item user={onlineUser} />
    </CometChatUsersContext.Provider>
  ),
};

/** Active state — currently selected/highlighted user. */
export const Active: Story = {
  render: args => (
    <CometChatUsersContext.Provider
      value={createMockContext({
        activeUserId: onlineUser.getUid(),
        hideUserStatus: args.hideUserStatus,
      })}
    >
      <CometChatUsers.Item user={onlineUser} />
    </CometChatUsersContext.Provider>
  ),
};

/** All variants showcase. */
export const AllVariantsShowcase: Story = {
  render: () => (
    <CometChatUsersContext.Provider
      value={createMockContext({ activeUserId: onlineUser.getUid() })}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        <CometChatUsers.Item user={onlineUser} />
        <CometChatUsers.Item user={offlineUser} />
      </div>
    </CometChatUsersContext.Provider>
  ),
};
