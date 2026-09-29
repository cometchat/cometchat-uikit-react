import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CometChatGroupMembersContext } from '../CometChatGroupMembers.context';
import { CometChatGroupMembersItem } from '../CometChatGroupMembersItem';
import type { CometChatGroupMembersContextValue } from '../CometChatGroupMembers.types';

/**
 * The member row's Kick / Ban / Change Scope options, and the props that hide them.
 *
 * Two independent gates decide whether an option is offered: the scope hierarchy (may this user do
 * it?) and the `hide*` props (does the host want it offered?). The props were accepted, put in
 * context and then never read, so turning them on changed nothing — the whole point of these tests.
 */

vi.mock('../../../context/locale/LocaleContext', () => ({
  useLocale: () => ({ getLocalizedString: (key: string) => key, language: 'en-us' }),
}));

// Stand-in for the context menu: renders every item as a button, so the test can assert on which
// options were built rather than on hover and popover mechanics.
vi.mock('../../base/CometChatContextMenu/CometChatContextMenu', () => {
  const Passthrough: React.FC<{ children?: React.ReactNode }> = ({ children }) => <>{children}</>;
  return {
    CometChatContextMenu: {
      Root: Passthrough,
      Trigger: Passthrough,
      Dropdown: Passthrough,
      Item: ({ item }: { item: { id: string; title: string } }) => (
        <button type="button" data-testid={`member-option-${item.id}`}>
          {item.title}
        </button>
      ),
    },
  };
});

const OWNER_UID = 'owner-1';
const MEMBER_UID = 'member-1';

function member(uid: string, scope = 'participant') {
  return {
    getUid: () => uid,
    getName: () => `Name ${uid}`,
    getAvatar: () => '',
    getScope: () => scope,
    getStatus: () => 'offline',
    getHasBlockedMe: () => false,
    getBlockedByMe: () => false,
  } as unknown as CometChat.GroupMember;
}

function createContext(
  overrides: Partial<CometChatGroupMembersContextValue> = {}
): CometChatGroupMembersContextValue {
  return {
    // The logged-in user owns the group, so the scope hierarchy allows all three options.
    group: { getGuid: () => 'g1', getOwner: () => OWNER_UID } as unknown as CometChat.Group,
    members: [],
    fetchState: 'loaded',
    hasMore: false,
    error: null,
    selectedMemberIds: [],
    selectedMembersMap: new Map(),
    activeMemberId: null,
    searchText: '',
    loggedInUser: { getUid: () => OWNER_UID } as unknown as CometChat.User,
    loggedInUserScope: 'owner',
    selectionMode: 'none',
    hideUserStatus: false,
    hideSearch: false,
    hideKickMemberOption: false,
    hideBanMemberOption: false,
    hideScopeChangeOption: false,
    options: undefined,
    fetchNext: vi.fn(),
    setSearchText: vi.fn(),
    selectMember: vi.fn(),
    deselectMember: vi.fn(),
    clearSelection: vi.fn(),
    setActiveMember: vi.fn(),
    handleItemClick: vi.fn(),
    kickMember: vi.fn(),
    banMember: vi.fn(),
    unbanMember: vi.fn(),
    changeScope: vi.fn(),
    setMemberToChangeScope: vi.fn(),
    memberToChangeScope: null,
    ...overrides,
  } as unknown as CometChatGroupMembersContextValue;
}

function renderRow(overrides: Partial<CometChatGroupMembersContextValue> = {}) {
  return render(
    <CometChatGroupMembersContext.Provider value={createContext(overrides)}>
      <CometChatGroupMembersItem member={member(MEMBER_UID)} />
    </CometChatGroupMembersContext.Provider>
  );
}

describe('CometChatGroupMembersItem — moderator options', () => {
  it('offers Kick, Ban and Change Scope to a group owner', () => {
    renderRow();
    expect(screen.getByTestId('member-option-kick')).toBeInTheDocument();
    expect(screen.getByTestId('member-option-ban')).toBeInTheDocument();
    expect(screen.getByTestId('member-option-change-scope')).toBeInTheDocument();
  });

  it('hides Kick when hideKickMemberOption is set', () => {
    renderRow({ hideKickMemberOption: true });
    expect(screen.queryByTestId('member-option-kick')).not.toBeInTheDocument();
    expect(screen.getByTestId('member-option-ban')).toBeInTheDocument();
    expect(screen.getByTestId('member-option-change-scope')).toBeInTheDocument();
  });

  it('hides Ban when hideBanMemberOption is set', () => {
    renderRow({ hideBanMemberOption: true });
    expect(screen.queryByTestId('member-option-ban')).not.toBeInTheDocument();
    expect(screen.getByTestId('member-option-kick')).toBeInTheDocument();
  });

  it('hides Change Scope when hideScopeChangeOption is set', () => {
    renderRow({ hideScopeChangeOption: true });
    expect(screen.queryByTestId('member-option-change-scope')).not.toBeInTheDocument();
    expect(screen.getByTestId('member-option-kick')).toBeInTheDocument();
  });

  it('renders no menu at all when every option is hidden', () => {
    renderRow({
      hideKickMemberOption: true,
      hideBanMemberOption: true,
      hideScopeChangeOption: true,
    });
    expect(screen.queryByTestId('member-option-kick')).not.toBeInTheDocument();
    expect(screen.queryByTestId('member-option-ban')).not.toBeInTheDocument();
    expect(screen.queryByTestId('member-option-change-scope')).not.toBeInTheDocument();
    expect(document.querySelector('.cometchat-group-members__item-menu')).toBeNull();
  });

  /** The props narrow what the hierarchy allows; they never grant an option it forbids. */
  it('does not offer options a participant was never allowed', () => {
    renderRow({
      loggedInUser: { getUid: () => 'someone-else' } as unknown as CometChat.User,
      loggedInUserScope: 'participant',
    });
    expect(screen.queryByTestId('member-option-kick')).not.toBeInTheDocument();
    expect(screen.queryByTestId('member-option-ban')).not.toBeInTheDocument();
    expect(screen.queryByTestId('member-option-change-scope')).not.toBeInTheDocument();
  });
});
