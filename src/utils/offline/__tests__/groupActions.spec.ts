/**
 * Swept group actions run today's live handlers (UIK-SYNC-03, UIT-SYNC-13):
 * a kick, ban, leave or scope change that affected the user while offline
 * arrives only in the SDK's catch-up sweep.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  groupEventOfSweptAction,
  runGroupListener,
  sweptGroupEventsForUser,
} from '../groupActions';
import { OfflineHub } from '../hub';
import { installOfflineSdk, type OfflineSdkFake } from '../../../testing/offline-sdk-fake';
import { useCometChatConversations } from '../../../components/CometChatConversations/useCometChatConversations';

const user = (uid: string) =>
  ({ getUid: () => uid, getName: () => uid }) as unknown as CometChat.User;
const group = (guid: string, membersCount = 3) =>
  ({
    getGuid: () => guid,
    getName: () => guid,
    getMembersCount: () => membersCount,
  }) as unknown as CometChat.Group;

function action(
  kind: string,
  on: string,
  by: string,
  guid: string,
  extra: Record<string, unknown> = {}
): CometChat.BaseMessage {
  return {
    getCategory: () => 'action',
    getType: () => 'groupMember',
    getAction: () => kind,
    getActionOn: () => user(on),
    getActionBy: () => user(by),
    getActionFor: () => group(guid),
    getOldScope: () => 'participant',
    getNewScope: () => 'moderator',
    getId: () => 1,
    getConversationId: () => `group_${guid}`,
    getSource: () => 'SYNC',
    ...extra,
  } as unknown as CometChat.BaseMessage;
}

describe('groupEventOfSweptAction', () => {
  it('a swept action carrying plain entities still gives the live event, with their classes', () => {
    // SDK 4.3 rebuilds a swept action from its stored record: plain objects, no getters.
    const swept = {
      actionOn: { uid: 'me', name: 'Me' },
      actionBy: { uid: 'admin', name: 'Admin' },
      actionFor: { guid: 'g1', name: 'Team', type: 'public' },
      getCategory: () => 'action',
      getType: () => 'groupMember',
      getAction: () => 'kicked',
      getActionOn(this: { actionOn: unknown }) {
        return this.actionOn;
      },
      getActionBy(this: { actionBy: unknown }) {
        return this.actionBy;
      },
      getActionFor(this: { actionFor: unknown }) {
        return this.actionFor;
      },
    } as unknown as CometChat.BaseMessage;

    const [event] = sweptGroupEventsForUser([swept], 'me');

    expect(event?.type).toBe('group/member-kicked');
    if (event?.type !== 'group/member-kicked') return;
    expect(event.kickedUser.getUid()).toBe('me');
    expect(event.kickedUser.getName()).toBe('Me');
    expect(event.kickedBy.getUid()).toBe('admin');
    expect(event.kickedFrom.getGuid()).toBe('g1');
    expect(event.kickedFrom.getName()).toBe('Team');
    // The live handlers read the group from the action too.
    expect((event.action.getActionFor() as CometChat.Group).getGuid()).toBe('g1');
  });

  it('maps each group-member action to the event the live GroupListener produces', () => {
    expect(groupEventOfSweptAction(action('kicked', 'me', 'admin', 'g1'))).toMatchObject({
      type: 'group/member-kicked',
    });
    expect(groupEventOfSweptAction(action('banned', 'me', 'admin', 'g1'))).toMatchObject({
      type: 'group/member-banned',
    });
    expect(groupEventOfSweptAction(action('left', 'me', 'me', 'g1'))).toMatchObject({
      type: 'group/member-left',
    });
    expect(groupEventOfSweptAction(action('scopeChanged', 'me', 'admin', 'g1'))).toMatchObject({
      type: 'group/member-scope-changed',
      newScope: 'moderator',
      oldScope: 'participant',
    });
    expect(groupEventOfSweptAction(action('added', 'me', 'admin', 'g1'))).toMatchObject({
      type: 'group/member-added',
    });
  });

  it('ignores non-action rows and malformed actions', () => {
    const text = {
      getCategory: () => 'message',
      getType: () => 'text',
    } as unknown as CometChat.BaseMessage;
    expect(groupEventOfSweptAction(text)).toBeNull();
    expect(
      groupEventOfSweptAction(
        action('kicked', 'me', 'admin', 'g1', { getActionFor: () => undefined })
      )
    ).toBeNull();
    expect(groupEventOfSweptAction(action('somethingElse', 'me', 'admin', 'g1'))).toBeNull();
  });
});

describe('sweptGroupEventsForUser', () => {
  it('keeps only the actions about the logged-in user, in sweep order', () => {
    const events = sweptGroupEventsForUser(
      [
        action('kicked', 'other', 'admin', 'g1'),
        action('scopeChanged', 'me', 'admin', 'g2'),
        action('kicked', 'me', 'admin', 'g1'),
      ],
      'me'
    );
    expect(events.map(e => e.type)).toEqual(['group/member-scope-changed', 'group/member-kicked']);
    expect(sweptGroupEventsForUser([action('kicked', 'me', 'a', 'g')], null)).toEqual([]);
  });

  it('runGroupListener calls the live callback with the live arguments', () => {
    const onGroupMemberKicked = vi.fn();
    const [event] = sweptGroupEventsForUser([action('kicked', 'me', 'admin', 'g1')], 'me');
    runGroupListener(event!, { onGroupMemberKicked });
    const [, kicked, by, from] = onGroupMemberKicked.mock.calls[0] as [
      unknown,
      CometChat.User,
      CometChat.User,
      CometChat.Group,
    ];
    expect([kicked.getUid(), by.getUid(), from.getGuid()]).toEqual(['me', 'admin', 'g1']);
  });
});

describe('conversation list: a kick found by the sweep removes the chat, as a live kick does', () => {
  let fake: OfflineSdkFake;

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk({ enabled: true });
    vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(
      new CometChat.User({ uid: 'me', name: 'me' })
    );
    vi.spyOn(CometChat, 'addConnectionListener').mockImplementation(() => undefined);
    vi.spyOn(CometChat, 'removeConnectionListener').mockImplementation(() => undefined);
    vi.spyOn(CometChat, 'addGroupListener').mockImplementation(() => undefined);
    vi.spyOn(CometChat, 'removeGroupListener').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fake.restore();
    OfflineHub.resetForTests();
  });

  function conv(id: string, guid: string) {
    return {
      getConversationId: () => id,
      getConversationType: () => 'group',
      getConversationWith: () => group(guid),
      getLastMessage: () => undefined,
      getUnreadMessageCount: () => 0,
      getUpdatedAt: () => 1,
      getPinnedAt: () => 0,
      getPinnedBy: () => '',
      isPinned: () => false,
    } as unknown as CometChat.Conversation;
  }

  it("removes group_g1 on a swept self-kick; another member's kick removes nothing", async () => {
    const fetchNext = vi.fn((listener?: Record<string, (p: unknown) => void>) => {
      listener?.onServerConversations?.([conv('group_g1', 'g1'), conv('group_g2', 'g2')]);
      return Promise.resolve([]);
    });
    const builder = {
      build: () => ({ fetchNext }),
    } as unknown as CometChat.ConversationsRequestBuilder;
    const { result } = renderHook(() =>
      useCometChatConversations({ conversationsRequestBuilder: builder })
    );
    await waitFor(() => {
      expect(result.current.conversations.map(c => c.getConversationId())).toEqual([
        'group_g1',
        'group_g2',
      ]);
    });
    // Wait for the logged-in uid the group handlers compare against.
    await act(async () => {
      await Promise.resolve();
    });
    const hub = OfflineHub.getInstance();
    hub.start();
    act(() => {
      fake.fire(
        'sync',
        'onMessageSyncCompleted',
        [action('kicked', 'other', 'admin', 'g2')],
        'CAUGHT_UP'
      );
    });
    expect(result.current.conversations.map(c => c.getConversationId())).toEqual([
      'group_g1',
      'group_g2',
    ]);
    act(() => {
      fake.fire(
        'sync',
        'onMessageSyncCompleted',
        [action('kicked', 'me', 'admin', 'g1')],
        'CAUGHT_UP'
      );
    });
    await waitFor(() => {
      expect(result.current.conversations.map(c => c.getConversationId())).toEqual(['group_g2']);
    });
  });
});
