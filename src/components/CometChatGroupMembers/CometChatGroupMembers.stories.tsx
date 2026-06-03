import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatGroupMembers } from './CometChatGroupMembers';

// ============================================
// Mock Data Helpers
// ============================================

function createMockGroup(
  overrides: Partial<{ guid: string; name: string; type: string; membersCount: number }> = {}
): CometChat.Group {
  const group = new CometChat.Group(
    overrides.guid ?? 'mock-group-1',
    overrides.name ?? 'Design Team',
    overrides.type ?? CometChat.GROUP_TYPE.PUBLIC
  );
  group.setMembersCount(overrides.membersCount ?? 12);
  group.setOwner('owner-uid');
  return group;
}

function createMockGroupMember(overrides: {
  uid: string;
  name: string;
  scope?: string;
  status?: string;
  avatar?: string;
}): CometChat.GroupMember {
  const member = new CometChat.GroupMember(
    overrides.uid,
    (overrides.scope ??
      CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT) as unknown as CometChat.GroupMemberScope
  );
  member.setName(overrides.name);
  member.setStatus(overrides.status ?? CometChat.USER_STATUS.ONLINE);
  if (overrides.avatar) {
    member.setAvatar(overrides.avatar);
  }
  return member;
}

function createMockMembers(): CometChat.GroupMember[] {
  return [
    createMockGroupMember({
      uid: 'owner-uid',
      name: 'Alice Johnson',
      scope: 'owner',
      status: 'online',
    }),
    createMockGroupMember({
      uid: 'admin-1',
      name: 'Bob Smith',
      scope: CometChat.GROUP_MEMBER_SCOPE.ADMIN,
      status: 'online',
    }),
    createMockGroupMember({
      uid: 'admin-2',
      name: 'Charlie Brown',
      scope: CometChat.GROUP_MEMBER_SCOPE.ADMIN,
      status: 'offline',
    }),
    createMockGroupMember({
      uid: 'mod-1',
      name: 'Diana Prince',
      scope: CometChat.GROUP_MEMBER_SCOPE.MODERATOR,
      status: 'online',
    }),
    createMockGroupMember({
      uid: 'mod-2',
      name: 'Edward Norton',
      scope: CometChat.GROUP_MEMBER_SCOPE.MODERATOR,
      status: 'offline',
    }),
    createMockGroupMember({
      uid: 'member-1',
      name: 'Fiona Apple',
      scope: CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT,
      status: 'online',
    }),
    createMockGroupMember({
      uid: 'member-2',
      name: 'George Lucas',
      scope: CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT,
      status: 'offline',
    }),
    createMockGroupMember({
      uid: 'member-3',
      name: 'Hannah Montana',
      scope: CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT,
      status: 'online',
    }),
    createMockGroupMember({
      uid: 'member-4',
      name: 'Ivan Petrov',
      scope: CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT,
      status: 'offline',
    }),
    createMockGroupMember({
      uid: 'member-5',
      name: 'Julia Roberts',
      scope: CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT,
      status: 'online',
    }),
    createMockGroupMember({
      uid: 'member-6',
      name: 'Kevin Hart',
      scope: CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT,
      status: 'offline',
    }),
    createMockGroupMember({
      uid: 'member-7',
      name: 'Laura Palmer',
      scope: CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT,
      status: 'online',
    }),
  ];
}

/**
 * Creates a mock request builder that returns the provided members.
 */
function createMockRequestBuilder(
  members: CometChat.GroupMember[]
): CometChat.GroupMembersRequestBuilder {
  let currentIndex = 0;
  let searchKeyword = '';

  const builder = {
    setLimit: () => builder,
    setSearchKeyword: (keyword: string) => {
      searchKeyword = keyword;
      currentIndex = 0;
      return builder;
    },
    build: () => ({
      fetchNext: () => {
        const filtered = searchKeyword
          ? members.filter(m => m.getName().toLowerCase().includes(searchKeyword.toLowerCase()))
          : members;
        const page = filtered.slice(currentIndex, currentIndex + 30);
        currentIndex += 30;
        return Promise.resolve(page);
      },
    }),
  } as unknown as CometChat.GroupMembersRequestBuilder;

  return builder;
}

function createEmptyRequestBuilder(): CometChat.GroupMembersRequestBuilder {
  const builder = {
    setLimit: () => builder,
    setSearchKeyword: () => builder,
    build: () => ({
      fetchNext: () => Promise.resolve([]),
    }),
  } as unknown as CometChat.GroupMembersRequestBuilder;
  return builder;
}

// ============================================
// Story Wrapper
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

const meta: Meta<typeof CometChatGroupMembers.Root> = {
  title: 'Components/Groups/CometChat Group Members',
  component: CometChatGroupMembers.Root,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'CometChatGroupMembers displays a paginated, searchable list of group members with real-time status updates, role badges (owner/admin/moderator), role-based context menus (kick, ban, change scope), selection modes, keyboard navigation, and full ARIA accessibility support.',
      },
    },
  },
  args: {
    hideUserStatus: false,
    hideSearch: false,
    hideKickMemberOption: false,
    hideBanMemberOption: false,
    hideScopeChangeOption: false,
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
    hideKickMemberOption: {
      control: 'boolean',
      description: 'Hide the kick member option in the context menu',
    },
    hideBanMemberOption: {
      control: 'boolean',
      description: 'Hide the ban member option in the context menu',
    },
    hideScopeChangeOption: {
      control: 'boolean',
      description: 'Hide the scope change option in the context menu',
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
      description: 'Called when a member item is clicked',
    },
    onSelect: {
      action: 'onSelect',
      description: 'Called when a member is selected or deselected',
    },
    onBack: {
      action: 'onBack',
      description: 'Called when back button is clicked',
    },
    onError: {
      action: 'onError',
      description: 'Called when an error occurs',
    },
    onEmpty: {
      action: 'onEmpty',
      description: 'Called when the member list is empty after initial fetch',
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
type Story = StoryObj<typeof CometChatGroupMembers.Root>;

// ============================================
// Stories
// ============================================

/** Default group members list with varied scopes and status indicators. */
export const Default: Story = {
  render: args => (
    <CometChatGroupMembers.Root
      group={createMockGroup()}
      groupMemberRequestBuilder={createMockRequestBuilder(createMockMembers())}
      hideUserStatus={args.hideUserStatus}
      hideSearch={args.hideSearch}
      hideKickMemberOption={args.hideKickMemberOption}
      hideBanMemberOption={args.hideBanMemberOption}
      hideScopeChangeOption={args.hideScopeChangeOption}
      selectionMode={args.selectionMode}
    />
  ),
};

/** All member roles visible — owner, admins, moderators, and participants with varied statuses. */
export const AllRoles: Story = {
  render: args => (
    <CometChatGroupMembers.Root
      group={createMockGroup()}
      groupMemberRequestBuilder={createMockRequestBuilder(createMockMembers())}
      hideUserStatus={args.hideUserStatus}
      hideSearch={args.hideSearch}
      hideKickMemberOption={args.hideKickMemberOption}
      hideBanMemberOption={args.hideBanMemberOption}
      hideScopeChangeOption={args.hideScopeChangeOption}
      selectionMode={args.selectionMode}
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Displays all member roles in a single view: owner (Alice), admins (Bob, Charlie), moderators (Diana, Edward), and regular participants. Shows role badges and varied online/offline statuses.',
      },
    },
  },
};

/** Loading state with shimmer/skeleton placeholders. */
export const LoadingState: Story = {
  render: args => {
    const neverResolveBuilder = {
      setLimit: () => neverResolveBuilder,
      setSearchKeyword: () => neverResolveBuilder,
      build: () => ({
        fetchNext: () =>
          new Promise<CometChat.GroupMember[]>(() => {
            /* never resolves */
          }),
      }),
    } as unknown as CometChat.GroupMembersRequestBuilder;

    return (
      <CometChatGroupMembers.Root
        group={createMockGroup()}
        groupMemberRequestBuilder={neverResolveBuilder}
        hideUserStatus={args.hideUserStatus}
        hideSearch={args.hideSearch}
        hideKickMemberOption={args.hideKickMemberOption}
        hideBanMemberOption={args.hideBanMemberOption}
        hideScopeChangeOption={args.hideScopeChangeOption}
        selectionMode={args.selectionMode}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Loading state displayed while group members are being fetched. Shows shimmer/skeleton placeholder items.',
      },
    },
  },
};

/** Empty state when no members are found. */
export const EmptyState: Story = {
  render: args => (
    <CometChatGroupMembers.Root
      group={createMockGroup({ membersCount: 0 })}
      groupMemberRequestBuilder={createEmptyRequestBuilder()}
      hideUserStatus={args.hideUserStatus}
      hideSearch={args.hideSearch}
      hideKickMemberOption={args.hideKickMemberOption}
      hideBanMemberOption={args.hideBanMemberOption}
      hideScopeChangeOption={args.hideScopeChangeOption}
      selectionMode={args.selectionMode}
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Empty state shown when no group members are found (e.g., after search with no results).',
      },
    },
  },
};

/** Error state when fetching members fails. */
export const ErrorState: Story = {
  render: args => {
    const errorBuilder = {
      setLimit: () => errorBuilder,
      setSearchKeyword: () => errorBuilder,
      build: () => ({
        fetchNext: () => Promise.reject(new Error('Failed to fetch group members')),
      }),
    } as unknown as CometChat.GroupMembersRequestBuilder;

    return (
      <CometChatGroupMembers.Root
        group={createMockGroup()}
        groupMemberRequestBuilder={errorBuilder}
        hideUserStatus={args.hideUserStatus}
        hideSearch={args.hideSearch}
        hideKickMemberOption={args.hideKickMemberOption}
        hideBanMemberOption={args.hideBanMemberOption}
        hideScopeChangeOption={args.hideScopeChangeOption}
        selectionMode={args.selectionMode}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Error state displayed when fetching group members fails.',
      },
    },
  },
};

/** Single selection mode with radio buttons. */
export const SingleSelection: Story = {
  args: { selectionMode: 'single' },
  render: args => (
    <CometChatGroupMembers.Root
      group={createMockGroup()}
      groupMemberRequestBuilder={createMockRequestBuilder(createMockMembers())}
      hideUserStatus={args.hideUserStatus}
      hideSearch={args.hideSearch}
      hideKickMemberOption={args.hideKickMemberOption}
      hideBanMemberOption={args.hideBanMemberOption}
      hideScopeChangeOption={args.hideScopeChangeOption}
      selectionMode={args.selectionMode}
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Single selection mode — only one member can be selected at a time using radio buttons.',
      },
    },
  },
};

/** Multiple selection mode with checkboxes. */
export const MultipleSelection: Story = {
  args: { selectionMode: 'multiple' },
  render: args => (
    <CometChatGroupMembers.Root
      group={createMockGroup()}
      groupMemberRequestBuilder={createMockRequestBuilder(createMockMembers())}
      hideUserStatus={args.hideUserStatus}
      hideSearch={args.hideSearch}
      hideKickMemberOption={args.hideKickMemberOption}
      hideBanMemberOption={args.hideBanMemberOption}
      hideScopeChangeOption={args.hideScopeChangeOption}
      selectionMode={args.selectionMode}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Multiple selection mode — multiple members can be selected using checkboxes.',
      },
    },
  },
};
