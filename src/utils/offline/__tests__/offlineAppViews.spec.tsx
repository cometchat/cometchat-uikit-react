/**
 * D84, as Android does it: when the app passed its own empty view, "Connect to search" does not
 * replace it; when it passed its own error view, "Connect to load ..." does not replace it. The
 * kit's offline text shows only in the kit's own views. Checked for each list: users, groups,
 * group members and conversations (Android: `emptyView?.invoke() ?: if (connectToSearch)` and
 * `errorView?.invoke(...) ?: if (connectToLoad)` in each compose list; `customEmptyView` and
 * `customErrorView` are tested before the offline text in each kotlin view).
 */
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const state = vi.hoisted(() => ({
  value: { fetchState: 'empty', connectToSearch: false, connectToLoad: false } as Record<
    string,
    unknown
  >,
}));

vi.mock('../../../components/CometChatUsers/CometChatUsers.context', () => ({
  useCometChatUsersContext: () => state.value,
}));
vi.mock('../../../components/CometChatGroups/CometChatGroups.context', () => ({
  useCometChatGroupsContext: () => state.value,
}));
vi.mock('../../../components/CometChatGroupMembers/CometChatGroupMembers.context', () => ({
  useCometChatGroupMembersContext: () => state.value,
}));
vi.mock('../../../components/CometChatConversations/CometChatConversations.context', () => ({
  useCometChatConversationsContext: () => state.value,
}));

import { CometChatUsersEmptyState } from '../../../components/CometChatUsers/CometChatUsersEmptyState';
import { CometChatUsersErrorState } from '../../../components/CometChatUsers/CometChatUsersErrorState';
import { CometChatGroupsEmptyState } from '../../../components/CometChatGroups/CometChatGroupsEmptyState';
import { CometChatGroupsErrorState } from '../../../components/CometChatGroups/CometChatGroupsErrorState';
import { CometChatGroupMembersEmptyState } from '../../../components/CometChatGroupMembers/CometChatGroupMembersEmptyState';
import { CometChatGroupMembersErrorState } from '../../../components/CometChatGroupMembers/CometChatGroupMembersErrorState';
import { CometChatConversationsEmptyState } from '../../../components/CometChatConversations/CometChatConversationsEmptyState';
import { CometChatConversationsErrorState } from '../../../components/CometChatConversations/CometChatConversationsErrorState';

const LISTS: {
  name: string;
  Empty: React.ComponentType<{ children?: React.ReactNode }>;
  ErrorState: React.ComponentType<{ children?: React.ReactNode }>;
  loadKey: RegExp;
}[] = [
  {
    name: 'users',
    Empty: CometChatUsersEmptyState,
    ErrorState: CometChatUsersErrorState,
    loadKey: /users_connect_to_load|Connect to load users/,
  },
  {
    name: 'groups',
    Empty: CometChatGroupsEmptyState,
    ErrorState: CometChatGroupsErrorState,
    loadKey: /groups_connect_to_load|Connect to load groups/,
  },
  {
    name: 'group members',
    Empty: CometChatGroupMembersEmptyState,
    ErrorState: CometChatGroupMembersErrorState,
    loadKey: /group_members_connect_to_load|Connect to load members/,
  },
  {
    name: 'conversations',
    Empty: CometChatConversationsEmptyState,
    ErrorState: CometChatConversationsErrorState,
    loadKey: /conversations_connect_to_load|Connect to load chats/,
  },
];

const CONNECT_TO_SEARCH = /search_connect_to_search|Connect to search/;

describe('D84: the app\'s own views win over the offline text (Android)', () => {
  beforeEach(() => {
    state.value = { fetchState: 'empty', connectToSearch: false, connectToLoad: false };
  });

  describe.each(LISTS)('$name', ({ Empty, ErrorState, loadKey }) => {
    it('"Connect to search" shows in the kit\'s own empty view, with its second line', () => {
      state.value = { fetchState: 'empty', connectToSearch: true, connectToLoad: false };
      render(<Empty />);
      expect(screen.getByText(CONNECT_TO_SEARCH)).toBeTruthy();
      expect(screen.getByText(/search_connect_to_search_subtitle|needs an internet connection/)).toBeTruthy();
    });

    it("the app's own empty view wins over \"Connect to search\"", () => {
      state.value = { fetchState: 'empty', connectToSearch: true, connectToLoad: false };
      render(
        <Empty>
          <span>my own empty</span>
        </Empty>
      );
      expect(screen.getByText('my own empty')).toBeTruthy();
      expect(screen.queryByText(CONNECT_TO_SEARCH)).toBeNull();
    });

    it('"Connect to load" shows in the kit\'s own error view', () => {
      state.value = { fetchState: 'error', connectToSearch: false, connectToLoad: true };
      render(<ErrorState />);
      expect(screen.getByText(loadKey)).toBeTruthy();
    });

    it("the app's own error view wins over \"Connect to load\"", () => {
      state.value = { fetchState: 'error', connectToSearch: false, connectToLoad: true };
      render(
        <ErrorState>
          <span>my own error</span>
        </ErrorState>
      );
      expect(screen.getByText('my own error')).toBeTruthy();
      expect(screen.queryByText(loadKey)).toBeNull();
    });
  });
});
