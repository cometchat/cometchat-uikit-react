/**
 * D84 on the widgets, offline ON:
 * - nothing on screen and not connected: the kit's offline state ("Connect to load ...", an icon
 *   and one line, no Retry), or the app's own error view if it passed one; `onError` once;
 * - an offline keyword search with nothing saved: "Connect to search" and its second line, or
 *   the app's own empty view; no `onError`;
 * - rows on screen stay: offline is silent, a real error reports once;
 * - an empty server answer is the empty view;
 * - offline OFF: today's error view, with no offline text.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatUsers } from '../../../components/CometChatUsers/CometChatUsers';
import { CometChatGroups } from '../../../components/CometChatGroups/CometChatGroups';
import { CometChatGroupMembers } from '../../../components/CometChatGroupMembers/CometChatGroupMembers';
import { CometChatConversations } from '../../../components/CometChatConversations/CometChatConversations';
import { OfflineHub } from '../hub';
import {
  installOfflineSdk,
  scriptedRead,
  type OfflineSdkFake,
  type ScriptedRead,
} from '../../../testing/offline-sdk-fake';

const NOT_CONNECTED = { code: 'ERROR_INTERNET_UNAVAILABLE' };

/** A caller's builder whose request is the scripted read. */
class StubBuilder {
  constructor(private readonly read: ScriptedRead) {}
  setSearchKeyword() {
    return this;
  }
  setLimit() {
    return this;
  }
  build() {
    return { fetchNext: this.read.fn };
  }
}

interface ListCase {
  name: string;
  suffix: string;
  /** The list's "Connect to load ..." text. */
  connectText: string;
  /** The props that give the list a search keyword. */
  keyword: Record<string, unknown>;
  /** A class the kit's own error view carries. */
  kitErrorClass: string;
  kitEmptyClass: string;
  row: () => unknown;
  render: (read: ScriptedRead, props: Record<string, unknown>) => React.ReactElement;
}

const LISTS: ListCase[] = [
  {
    name: 'users',
    connectText: 'Connect to load users',
    keyword: { searchKeyword: 'jo' },
    suffix: 'Users',
    kitErrorClass: '.cometchat-users__error-state',
    kitEmptyClass: '.cometchat-users__empty-state',
    row: () => new CometChat.User({ uid: 'u1', name: 'Una' }),
    render: (read, props) => (
      <CometChatUsers
        usersRequestBuilder={new StubBuilder(read) as unknown as CometChat.UsersRequestBuilder}
        {...props}
      />
    ),
  },
  {
    name: 'groups',
    connectText: 'Connect to load groups',
    keyword: { searchKeyword: 'jo' },
    suffix: 'Groups',
    kitErrorClass: '.cometchat-groups__error-state',
    kitEmptyClass: '.cometchat-groups__empty-state',
    row: () => new CometChat.Group('g1', 'Gus', 'public'),
    render: (read, props) => (
      <CometChatGroups
        groupsRequestBuilder={new StubBuilder(read) as unknown as CometChat.GroupsRequestBuilder}
        {...props}
      />
    ),
  },
  {
    name: 'group members',
    connectText: 'Connect to load members',
    keyword: { searchKeyword: 'jo' },
    suffix: 'GroupMembers',
    kitErrorClass: '.cometchat-group-members__error-state',
    kitEmptyClass: '.cometchat-group-members__empty-state',
    row: () => {
      const m = new CometChat.GroupMember(
        'm1',
        'participant' as unknown as CometChat.GroupMemberScope
      );
      m.setName('Mia');
      return m;
    },
    render: (read, props) => (
      <CometChatGroupMembers
        group={new CometChat.Group('g1', 'G', 'public')}
        groupMemberRequestBuilder={
          new StubBuilder(read) as unknown as CometChat.GroupMembersRequestBuilder
        }
        {...props}
      />
    ),
  },
  {
    name: 'conversations',
    connectText: 'Connect to load chats',
    keyword: { searchKeyword: 'jo' },
    suffix: 'Conversations',
    kitErrorClass: '.cometchat-conversations__error-state',
    kitEmptyClass: '.cometchat-conversations__empty-state',
    row: () =>
      ({
        getConversationId: () => 'c1',
        getConversationType: () => 'user',
        getConversationWith: () => new CometChat.User({ uid: 'u1', name: 'Una' }),
        getLastMessage: () => undefined,
        getUnreadMessageCount: () => 0,
        getUpdatedAt: () => 1,
        getPinnedAt: () => undefined,
        isPinned: () => false,
        isSystemPinned: () => false,
        getTags: () => [],
      }) as unknown as CometChat.Conversation,
    render: (_read, props) => <CometChatConversations {...props} />,
  },
];

describe('D84: the offline states on the list widgets, offline ON', () => {
  let fake: OfflineSdkFake;
  let read: ScriptedRead;

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk({ enabled: true });
    vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(
      new CometChat.User({ uid: 'me', name: 'me' })
    );
    for (const method of [
      'addConnectionListener',
      'removeConnectionListener',
      'addUserListener',
      'removeUserListener',
      'addGroupListener',
      'removeGroupListener',
      'addMessageListener',
      'removeMessageListener',
    ] as const) {
      vi.spyOn(CometChat, method).mockImplementation((() => undefined) as never);
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fake.restore();
    OfflineHub.resetForTests();
  });

  for (const list of LISTS) {
    describe(list.name, () => {
      beforeEach(() => {
        read = scriptedRead(list.suffix);
        if (list.name === 'conversations') {
          vi.spyOn(CometChat.ConversationsRequestBuilder.prototype, 'build').mockReturnValue({
            fetchNext: read.fn,
          } as unknown as CometChat.ConversationsRequest);
        }
      });

      it('rule 3: nothing on screen and not connected is "Connect to load ...", no Retry, and onError once', async () => {
        const onError = vi.fn();
        const { container } = render(list.render(read, { onError }));
        await waitFor(() => {
          expect(read.calls).toHaveLength(1);
        });
        await act(async () => {
          read.last().cached([]);
          read.last().fail(NOT_CONNECTED);
          await Promise.resolve();
        });
        await waitFor(() => {
          expect(container.querySelector(list.kitErrorClass)).not.toBeNull();
        });
        expect(container.querySelector(`${list.kitErrorClass}-title`)?.textContent).toBe(
          list.connectText
        );
        // An icon and one line: no second line, no button.
        expect(container.querySelector(`${list.kitErrorClass}-icon img`)).not.toBeNull();
        expect(container.querySelector(`${list.kitErrorClass}-subtitle`)).toBeNull();
        expect(container.querySelector(`${list.kitErrorClass} button`)).toBeNull();
        expect(container.querySelector(list.kitEmptyClass)).toBeNull();
        expect(onError).toHaveBeenCalledTimes(1);
      });

      it('rule 4: a real error with nothing on screen is the kit’s error view, not "Connect to load", and onError once', async () => {
        const onError = vi.fn();
        const { container } = render(list.render(read, { onError }));
        await waitFor(() => {
          expect(read.calls).toHaveLength(1);
        });
        await act(async () => {
          read.last().cached([]);
          read.last().fail({ code: 'ERR_SERVER', message: 'boom' });
          await Promise.resolve();
        });
        await waitFor(() => {
          expect(container.querySelector(list.kitErrorClass)).not.toBeNull();
        });
        expect(container.textContent).not.toContain(list.connectText);
        expect(onError).toHaveBeenCalledTimes(1);
      });

      it('rule 3: the app’s own error view wins over the offline state, and onError fires once', async () => {
        const onError = vi.fn();
        const { container } = render(
          list.render(read, { onError, errorView: <span>my own error</span> })
        );
        await waitFor(() => {
          expect(read.calls).toHaveLength(1);
        });
        await act(async () => {
          read.last().fail(NOT_CONNECTED);
          await Promise.resolve();
        });
        await waitFor(() => {
          expect(screen.getByText('my own error')).toBeInTheDocument();
        });
        expect(container.querySelector(`${list.kitErrorClass}-title`)).toBeNull();
        expect(container.textContent).not.toContain(list.connectText);
        expect(onError).toHaveBeenCalledTimes(1);
      });

      it('rule 2: rows on screen stay offline, with no error view over them and no onError', async () => {
        const onError = vi.fn();
        const { container } = render(
          list.render(read, { onError, errorView: <span>my own error</span> })
        );
        await waitFor(() => {
          expect(read.calls).toHaveLength(1);
        });
        await act(async () => {
          read.last().cached([list.row()]);
          read.last().fail(NOT_CONNECTED);
          await Promise.resolve();
        });
        expect(screen.queryByText('my own error')).toBeNull();
        expect(container.querySelector(list.kitErrorClass)).toBeNull();
        expect(container.textContent).not.toContain(list.connectText);
        expect(onError).not.toHaveBeenCalled();
      });

      it('rule 7 + addition A: an offline keyword search with nothing saved is "Connect to search" with its second line, and no onError', async () => {
        const onError = vi.fn();
        const { container } = render(list.render(read, { onError, ...list.keyword }));
        await waitFor(() => {
          expect(read.calls).toHaveLength(1);
        });
        await act(async () => {
          read.last().cached([]);
          read.last().fail(NOT_CONNECTED);
          await Promise.resolve();
        });
        await waitFor(() => {
          expect(container.querySelector(list.kitEmptyClass)).not.toBeNull();
        });
        expect(container.querySelector(`${list.kitEmptyClass}-title`)?.textContent).toBe(
          'Connect to search'
        );
        expect(container.querySelector(`${list.kitEmptyClass}-subtitle`)?.textContent).toBe(
          'Search needs an internet connection.'
        );
        expect(container.querySelector(list.kitErrorClass)).toBeNull();
        expect(container.textContent).not.toContain(list.connectText);
        expect(onError).not.toHaveBeenCalled();
      });

      it('rule 7: the app’s own empty view wins over "Connect to search"', async () => {
        const onError = vi.fn();
        const { container } = render(
          list.render(read, { onError, emptyView: <span>my own empty</span>, ...list.keyword })
        );
        await waitFor(() => {
          expect(read.calls).toHaveLength(1);
        });
        await act(async () => {
          read.last().cached([]);
          read.last().fail(NOT_CONNECTED);
          await Promise.resolve();
        });
        await waitFor(() => {
          expect(screen.getByText('my own empty')).toBeInTheDocument();
        });
        expect(container.textContent).not.toContain('Connect to search');
        expect(onError).not.toHaveBeenCalled();
      });

      it('an empty server answer is the app’s empty view, never an error', async () => {
        const onError = vi.fn();
        render(list.render(read, { onError, emptyView: <span>my own empty</span> }));
        await waitFor(() => {
          expect(read.calls).toHaveLength(1);
        });
        act(() => {
          read.last().server([]);
        });
        await waitFor(() => {
          expect(screen.getByText('my own empty')).toBeInTheDocument();
        });
        expect(onError).not.toHaveBeenCalled();
      });
    });
  }
});

describe('offline OFF: the list widgets keep today’s error view', () => {
  let fake: OfflineSdkFake;
  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk({ enabled: false });
    vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(
      new CometChat.User({ uid: 'me', name: 'me' })
    );
    for (const method of [
      'addConnectionListener',
      'removeConnectionListener',
      'addUserListener',
      'removeUserListener',
      'addGroupListener',
      'removeGroupListener',
      'addMessageListener',
      'removeMessageListener',
    ] as const) {
      vi.spyOn(CometChat, method).mockImplementation((() => undefined) as never);
    }
  });
  afterEach(() => {
    vi.restoreAllMocks();
    fake.restore();
    OfflineHub.resetForTests();
  });

  for (const list of LISTS) {
    it(`${list.name}: a not-connected failure is the kit’s error view and one onError, with no offline text`, async () => {
      const read = scriptedRead(list.suffix);
      if (list.name === 'conversations') {
        vi.spyOn(CometChat.ConversationsRequestBuilder.prototype, 'build').mockReturnValue({
          fetchNext: read.fn,
        } as unknown as CometChat.ConversationsRequest);
      }
      const onError = vi.fn();
      const { container } = render(list.render(read, { onError, ...list.keyword }));
      await waitFor(() => {
        expect(read.calls).toHaveLength(1);
      });
      await act(async () => {
        read.last().fail(NOT_CONNECTED);
        await Promise.resolve();
      });
      await waitFor(() => {
        expect(container.querySelector(list.kitErrorClass)).not.toBeNull();
      });
      expect(container.textContent).not.toContain(list.connectText);
      expect(container.textContent).not.toContain('Connect to search');
      expect(container.querySelector(list.kitEmptyClass)).toBeNull();
      expect(onError).toHaveBeenCalledTimes(1);
    });
  }
});
