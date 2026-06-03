/**
 * CometChatGroupMemberItem Storybook Stories
 *
 * Demonstrates a single group member item in isolation:
 * - Default (participant)
 * - Admin member
 * - Moderator member
 * - Owner
 * - All variants showcase
 *
 * @module components/CometChatGroupMembers/CometChatGroupMemberItem
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatGroupMembers } from './CometChatGroupMembers';

// ============================================
// Mock Data
// ============================================

function createMockMember(uid: string, name: string, scope: string, status = 'online') {
  const member = new CometChat.GroupMember(uid, scope as unknown as CometChat.GroupMemberScope);
  member.setName(name);
  member.setStatus(status as unknown as typeof CometChat.USER_STATUS.ONLINE);
  member.setAvatar(`https://i.pravatar.cc/150?u=${uid}`);
  return member;
}

const participantMember = createMockMember(
  'member-1',
  'Fiona Apple',
  CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT
);
const adminMember = createMockMember('admin-1', 'Bob Smith', CometChat.GROUP_MEMBER_SCOPE.ADMIN);
const moderatorMember = createMockMember(
  'mod-1',
  'Diana Prince',
  CometChat.GROUP_MEMBER_SCOPE.MODERATOR
);
const ownerMember = createMockMember('owner-1', 'Alice Johnson', 'owner');

// ============================================
// Mock Group
// ============================================

function createMockGroup() {
  return {
    getGuid: () => 'group-1',
    getName: () => 'Engineering Team',
    getType: () => 'public',
    getScope: () => 'admin',
    getOwner: () => 'owner-1',
    getMembersCount: () => 10,
  } as unknown as CometChat.Group;
}

// ============================================
// Meta Configuration
// ============================================

const meta: Meta = {
  title: 'Components/Groups/CometChat Group Member Item',
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
          'A single group member list item showing avatar, name, role badge, and status indicator.',
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

/** Default — participant member. */
export const Default: Story = {
  render: args => (
    <CometChatGroupMembers.Root
      group={createMockGroup()}
      groupMemberRequestBuilder={undefined}
      hideUserStatus={args.hideUserStatus}
    >
      <CometChatGroupMembers.Item member={participantMember} />
    </CometChatGroupMembers.Root>
  ),
};

/** Admin member with role badge. */
export const AdminMember: Story = {
  render: args => (
    <CometChatGroupMembers.Root
      group={createMockGroup()}
      groupMemberRequestBuilder={undefined}
      hideUserStatus={args.hideUserStatus}
    >
      <CometChatGroupMembers.Item member={adminMember} />
    </CometChatGroupMembers.Root>
  ),
};

/** Moderator member with role badge. */
export const ModeratorMember: Story = {
  render: args => (
    <CometChatGroupMembers.Root
      group={createMockGroup()}
      groupMemberRequestBuilder={undefined}
      hideUserStatus={args.hideUserStatus}
    >
      <CometChatGroupMembers.Item member={moderatorMember} />
    </CometChatGroupMembers.Root>
  ),
};

/** Owner member. */
export const OwnerMember: Story = {
  render: args => (
    <CometChatGroupMembers.Root
      group={createMockGroup()}
      groupMemberRequestBuilder={undefined}
      hideUserStatus={args.hideUserStatus}
    >
      <CometChatGroupMembers.Item member={ownerMember} />
    </CometChatGroupMembers.Root>
  ),
};

/** All variants showcase. */
export const AllVariantsShowcase: Story = {
  render: args => (
    <CometChatGroupMembers.Root
      group={createMockGroup()}
      groupMemberRequestBuilder={undefined}
      hideUserStatus={args.hideUserStatus}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        <CometChatGroupMembers.Item member={ownerMember} />
        <CometChatGroupMembers.Item member={adminMember} />
        <CometChatGroupMembers.Item member={moderatorMember} />
        <CometChatGroupMembers.Item member={participantMember} />
      </div>
    </CometChatGroupMembers.Root>
  ),
};
