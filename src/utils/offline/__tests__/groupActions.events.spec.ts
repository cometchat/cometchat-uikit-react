/**
 * Swept group actions, event by event: every group-member action maps to the
 * live GroupListener's event, every malformed action maps to nothing, and the
 * runner calls the one callback the live listener would have called.
 */
import { describe, expect, it, vi } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  groupEventOfSweptAction,
  runGroupListener,
  subjectOf,
  sweptGroupEventsForUser,
  type GroupListenerCallbacks,
  type GroupMemberEvent,
} from '../groupActions';

const user = (uid: string) =>
  ({ getUid: () => uid, getName: () => uid }) as unknown as CometChat.User;
const group = (guid: string) => ({ getGuid: () => guid }) as unknown as CometChat.Group;

type Getters = Record<string, () => unknown>;

function action(kind: string, getters: Getters = {}): CometChat.BaseMessage {
  return {
    getCategory: () => 'action',
    getType: () => 'groupMember',
    getAction: () => kind,
    getActionOn: () => user('on'),
    getActionBy: () => user('by'),
    getActionFor: () => group('g1'),
    getOldScope: () => 'participant',
    getNewScope: () => 'admin',
    ...getters,
  } as unknown as CometChat.BaseMessage;
}

const KINDS = ['joined', 'left', 'kicked', 'banned', 'unbanned', 'added', 'scopeChanged'] as const;

describe('groupEventOfSweptAction: one live event per action', () => {
  it('joined: the actor joined the group', () => {
    const message = action('joined');
    expect(groupEventOfSweptAction(message)).toEqual({
      type: 'group/member-joined',
      action: message,
      joinedUser: expect.objectContaining({ getUid: expect.any(Function) }),
      joinedGroup: expect.objectContaining({ getGuid: expect.any(Function) }),
    });
    const event = groupEventOfSweptAction(message);
    if (event?.type !== 'group/member-joined') throw new Error('expected a join');
    expect(event.joinedUser.getUid()).toBe('by');
    expect(event.joinedGroup.getGuid()).toBe('g1');
  });

  it('left: the actor left the group', () => {
    const event = groupEventOfSweptAction(action('left'));
    if (event?.type !== 'group/member-left') throw new Error('expected a leave');
    expect(event.leftUser.getUid()).toBe('by');
    expect(event.leftGroup.getGuid()).toBe('g1');
  });

  it('unbanned: the target, the actor and the group', () => {
    const event = groupEventOfSweptAction(action('unbanned'));
    if (event?.type !== 'group/member-unbanned') throw new Error('expected an unban');
    expect([event.unbannedUser.getUid(), event.unbannedBy.getUid()]).toEqual(['on', 'by']);
    expect(event.unbannedFrom.getGuid()).toBe('g1');
  });

  it('added: addedBy is the actor, addedUser the target', () => {
    const event = groupEventOfSweptAction(action('added'));
    if (event?.type !== 'group/member-added') throw new Error('expected an add');
    expect([event.addedBy.getUid(), event.addedUser.getUid()]).toEqual(['by', 'on']);
    expect(event.addedTo.getGuid()).toBe('g1');
  });

  it('scopeChanged without scope getters: both scopes are empty strings', () => {
    const event = groupEventOfSweptAction(
      action('scopeChanged', {
        getNewScope: undefined as unknown as () => unknown,
        getOldScope: undefined as unknown as () => unknown,
      })
    );
    expect(event).toMatchObject({
      type: 'group/member-scope-changed',
      newScope: '',
      oldScope: '',
    });
  });

  it.each(['joined', 'left'])('%s with no user actor gives nothing', kind => {
    expect(groupEventOfSweptAction(action(kind, { getActionBy: () => 'not-a-user' }))).toBeNull();
  });

  it.each(['kicked', 'banned', 'unbanned', 'added'])(
    '%s needs both a user target and a user actor',
    kind => {
      expect(groupEventOfSweptAction(action(kind, { getActionOn: () => null }))).toBeNull();
      expect(groupEventOfSweptAction(action(kind, { getActionBy: () => ({}) }))).toBeNull();
    }
  );

  it('scopeChanged needs a user target', () => {
    expect(
      groupEventOfSweptAction(action('scopeChanged', { getActionOn: () => undefined }))
    ).toBeNull();
  });

  it('a getter that throws reads as absent', () => {
    expect(
      groupEventOfSweptAction(
        action('kicked', {
          getCategory: () => {
            throw new Error('broken');
          },
        })
      )
    ).toBeNull();
    expect(
      groupEventOfSweptAction(
        action('kicked', {
          getActionFor: () => {
            throw new Error('broken');
          },
        })
      )
    ).toBeNull();
  });

  it('an action of another type (not groupMember) gives nothing', () => {
    expect(groupEventOfSweptAction(action('kicked', { getType: () => 'message' }))).toBeNull();
  });

  it('a plain {guid} group gets the Group class; a plain object with neither id stays as it is', () => {
    const fields: Record<string, unknown> = {
      actionOn: { uid: 'me', name: 'Me' },
      actionBy: { name: 'no id' },
      actionFor: { guid: 'g7', name: 'Seven' },
    };
    const swept = {
      ...fields,
      getCategory: () => 'action',
      getType: () => 'groupMember',
      getAction: () => 'scopeChanged',
      getActionOn(this: typeof fields) {
        return this.actionOn;
      },
      getActionBy(this: typeof fields) {
        return this.actionBy;
      },
      getActionFor(this: typeof fields) {
        return this.actionFor;
      },
    } as unknown as CometChat.BaseMessage;

    const event = groupEventOfSweptAction(swept);

    if (event?.type !== 'group/member-scope-changed') throw new Error('expected a scope change');
    expect(event.changedGroup).toBeInstanceOf(CometChat.Group);
    expect(event.changedGroup.getGuid()).toBe('g7');
    expect(event.changedGroup.getName()).toBe('Seven');
    expect(event.changedUser).toBeInstanceOf(CometChat.User);
    // No uid and no guid: nothing to hydrate, the object is kept as it came.
    const kept = (swept as unknown as Record<string, unknown>).actionBy;
    expect(kept).toEqual({ name: 'no id' });
    expect(kept).not.toBeInstanceOf(CometChat.User);
  });
});

describe('subjectOf', () => {
  it.each([
    ['joined', 'by'],
    ['left', 'by'],
    ['kicked', 'on'],
    ['banned', 'on'],
    ['unbanned', 'on'],
    ['added', 'on'],
    ['scopeChanged', 'on'],
  ])('%s is about %s', (kind, who) => {
    const event = groupEventOfSweptAction(action(kind));
    expect(event).not.toBeNull();
    expect(subjectOf(event!).getUid()).toBe(who);
  });
});

describe('sweptGroupEventsForUser', () => {
  it('skips an event whose subject has a throwing getUid', () => {
    const throwing = {
      getUid: () => {
        throw new Error('broken');
      },
    };
    const events = sweptGroupEventsForUser(
      [action('kicked', { getActionOn: () => throwing }), action('left', { getActionBy: () => user('me') })],
      'me'
    );
    expect(events.map(e => e.type)).toEqual(['group/member-left']);
  });

  it('an empty uid matches nothing', () => {
    expect(sweptGroupEventsForUser([action('joined')], '')).toEqual([]);
  });
});

describe('runGroupListener', () => {
  function callbacks(): Required<GroupListenerCallbacks> {
    return {
      onGroupMemberJoined: vi.fn(),
      onGroupMemberLeft: vi.fn(),
      onGroupMemberKicked: vi.fn(),
      onGroupMemberBanned: vi.fn(),
      onGroupMemberUnbanned: vi.fn(),
      onMemberAddedToGroup: vi.fn(),
      onGroupMemberScopeChanged: vi.fn(),
    };
  }

  const CALLBACK_OF: Record<(typeof KINDS)[number], keyof GroupListenerCallbacks> = {
    joined: 'onGroupMemberJoined',
    left: 'onGroupMemberLeft',
    kicked: 'onGroupMemberKicked',
    banned: 'onGroupMemberBanned',
    unbanned: 'onGroupMemberUnbanned',
    added: 'onMemberAddedToGroup',
    scopeChanged: 'onGroupMemberScopeChanged',
  };

  it.each(KINDS)('%s calls only its own live callback, with the live arguments', kind => {
    const message = action(kind);
    const event: GroupMemberEvent = groupEventOfSweptAction(message)!;
    const cbs = callbacks();
    runGroupListener(event, cbs);
    for (const [name, fn] of Object.entries(cbs)) {
      expect(fn, name).toHaveBeenCalledTimes(name === CALLBACK_OF[kind] ? 1 : 0);
    }
    const args = (cbs[CALLBACK_OF[kind]] as ReturnType<typeof vi.fn>).mock.calls[0] as unknown[];
    expect(args[0]).toBe(message);
    const uids = args
      .slice(1)
      .map(a =>
        typeof a === 'string'
          ? a
          : ((a as { getUid?: () => string; getGuid?: () => string }).getUid?.() ??
            (a as { getGuid: () => string }).getGuid())
      );
    const expected: Record<(typeof KINDS)[number], string[]> = {
      joined: ['by', 'g1'],
      left: ['by', 'g1'],
      kicked: ['on', 'by', 'g1'],
      banned: ['on', 'by', 'g1'],
      unbanned: ['on', 'by', 'g1'],
      added: ['by', 'on', 'g1'],
      scopeChanged: ['on', 'admin', 'participant', 'g1'],
    };
    expect(uids).toEqual(expected[kind]);
  });

  it.each(KINDS)('%s with no callback registered does nothing', kind => {
    const event: GroupMemberEvent = groupEventOfSweptAction(action(kind))!;
    expect(() => runGroupListener(event, {})).not.toThrow();
  });
});
