/**
 * Swept group actions (README §3.6, UIK-SYNC-03, UIT-SYNC-13).
 *
 * Action rows reach the kit only through the SDK's catch-up sweep
 * (`onMessageSyncCompleted`, BEH-SYNC-25): the live `GroupListener` never fires
 * for what happened while the user was offline. For a swept group action that
 * affects the user (kicked, banned, left, scope changed, joined/added back) the
 * kit runs the same handler it runs for the live event. This module turns a
 * swept action message into the event the live listener would have produced.
 *
 * @internal
 */
import { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatSDKEvent } from '../../context/CometChatEvents.types';

/** The group/member-* events, in the shape the live GroupListener produces. */
export type GroupMemberEvent = Extract<CometChatSDKEvent, { type: `group/member-${string}` }>;

interface ActionLike {
  getCategory?: () => string;
  getType?: () => string;
  getAction?: () => string;
  getActionBy?: () => unknown;
  getActionOn?: () => unknown;
  getActionFor?: () => unknown;
  getOldScope?: () => string;
  getNewScope?: () => string;
}

function isUser(value: unknown): value is CometChat.User {
  return !!value && typeof (value as { getUid?: unknown }).getUid === 'function';
}

function isGroup(value: unknown): value is CometChat.Group {
  return !!value && typeof (value as { getGuid?: unknown }).getGuid === 'function';
}

function call(target: ActionLike, name: keyof ActionLike): unknown {
  const fn = target[name];
  if (typeof fn !== 'function') return undefined;
  try {
    return (fn as () => unknown).call(target);
  } catch {
    return undefined;
  }
}

/**
 * The SDK's sweep rebuilds an action from its stored record, so `actionBy`,
 * `actionOn` and `actionFor` come back as plain objects, without `getUid` or
 * `getGuid`. Give them their classes, as the SDK's `actionFromJSON` does; a
 * live action is left as it is.
 */
function hydrateEntity(value: unknown): unknown {
  if (!value || typeof value !== 'object' || isUser(value) || isGroup(value)) return value;
  const raw = value as { uid?: unknown; guid?: unknown };
  if (typeof raw.uid === 'string') {
    return Object.assign(new CometChat.User(raw.uid), value);
  }
  if (typeof raw.guid === 'string') {
    return Object.assign(new CometChat.Group(raw.guid, '', ''), value);
  }
  return value;
}

/**
 * Give a swept action's entities their classes in place: the live handlers read
 * them from the action as well as from the event.
 */
function hydrateActionEntities(message: CometChat.BaseMessage): void {
  const m = message as unknown as Record<string, unknown>;
  for (const key of ['actionBy', 'actionOn', 'actionFor']) {
    if (m[key]) m[key] = hydrateEntity(m[key]);
  }
}

/**
 * The live event a swept group-member action message stands for, or `null`
 * for anything else (other categories, malformed actions).
 */
export function groupEventOfSweptAction(message: CometChat.BaseMessage): GroupMemberEvent | null {
  const m = message as unknown as ActionLike;
  if ((call(m, 'getCategory') as string | undefined) !== CometChat.CATEGORY_ACTION) return null;
  if ((call(m, 'getType') as string | undefined) !== 'groupMember') return null;
  hydrateActionEntities(message);
  const action = call(m, 'getAction') as string | undefined;
  const by = call(m, 'getActionBy');
  const on = call(m, 'getActionOn');
  const group = call(m, 'getActionFor');
  if (!isGroup(group)) return null;
  const msg = message as unknown as CometChat.Action;
  switch (action) {
    case 'joined':
      return isUser(by)
        ? { type: 'group/member-joined', action: msg, joinedUser: by, joinedGroup: group }
        : null;
    case 'left':
      return isUser(by)
        ? { type: 'group/member-left', action: msg, leftUser: by, leftGroup: group }
        : null;
    case 'kicked':
      return isUser(on) && isUser(by)
        ? {
            type: 'group/member-kicked',
            action: msg,
            kickedUser: on,
            kickedBy: by,
            kickedFrom: group,
          }
        : null;
    case 'banned':
      return isUser(on) && isUser(by)
        ? {
            type: 'group/member-banned',
            action: msg,
            bannedUser: on,
            bannedBy: by,
            bannedFrom: group,
          }
        : null;
    case 'unbanned':
      return isUser(on) && isUser(by)
        ? {
            type: 'group/member-unbanned',
            action: msg,
            unbannedUser: on,
            unbannedBy: by,
            unbannedFrom: group,
          }
        : null;
    case 'added':
      return isUser(on) && isUser(by)
        ? { type: 'group/member-added', action: msg, addedBy: by, addedUser: on, addedTo: group }
        : null;
    case 'scopeChanged':
      return isUser(on)
        ? {
            type: 'group/member-scope-changed',
            action: msg,
            changedUser: on,
            newScope: (call(m, 'getNewScope') as string | undefined) ?? '',
            oldScope: (call(m, 'getOldScope') as string | undefined) ?? '',
            changedGroup: group,
          }
        : null;
    default:
      return null;
  }
}

/** The member a group-member event is about (the target, or the actor for join/leave). */
export function subjectOf(event: GroupMemberEvent): CometChat.User {
  switch (event.type) {
    case 'group/member-joined':
      return event.joinedUser;
    case 'group/member-left':
      return event.leftUser;
    case 'group/member-kicked':
      return event.kickedUser;
    case 'group/member-banned':
      return event.bannedUser;
    case 'group/member-unbanned':
      return event.unbannedUser;
    case 'group/member-added':
      return event.addedUser;
    case 'group/member-scope-changed':
      return event.changedUser;
  }
}

/**
 * The swept group actions that affect the logged-in user, as live events, in
 * the order the sweep delivered them. Actions about other members are only
 * rows (the sweep's upsert already shows them).
 */
export function sweptGroupEventsForUser(
  messages: readonly CometChat.BaseMessage[],
  loggedInUid: string | null | undefined
): GroupMemberEvent[] {
  if (!loggedInUid) return [];
  const events: GroupMemberEvent[] = [];
  for (const message of messages) {
    const event = groupEventOfSweptAction(message);
    if (!event) continue;
    let uid = '';
    try {
      uid = subjectOf(event).getUid();
    } catch {
      uid = '';
    }
    if (uid === loggedInUid) events.push(event);
  }
  return events;
}

/** The GroupListener callbacks a screen registers for live group events. */
export interface GroupListenerCallbacks {
  onGroupMemberJoined?: (
    action: CometChat.Action,
    user: CometChat.User,
    group: CometChat.Group
  ) => void;
  onGroupMemberLeft?: (
    action: CometChat.Action,
    user: CometChat.User,
    group: CometChat.Group
  ) => void;
  onGroupMemberKicked?: (
    action: CometChat.Action,
    kickedUser: CometChat.User,
    kickedBy: CometChat.User,
    kickedFrom: CometChat.Group
  ) => void;
  onGroupMemberBanned?: (
    action: CometChat.Action,
    bannedUser: CometChat.User,
    bannedBy: CometChat.User,
    bannedFrom: CometChat.Group
  ) => void;
  onGroupMemberUnbanned?: (
    action: CometChat.Action,
    unbannedUser: CometChat.User,
    unbannedBy: CometChat.User,
    unbannedFrom: CometChat.Group
  ) => void;
  onMemberAddedToGroup?: (
    action: CometChat.Action,
    addedBy: CometChat.User,
    addedUser: CometChat.User,
    addedTo: CometChat.Group
  ) => void;
  onGroupMemberScopeChanged?: (
    action: CometChat.Action,
    changedUser: CometChat.User,
    newScope: string,
    oldScope: string,
    changedGroup: CometChat.Group
  ) => void;
}

/** Call the callback the live GroupListener would have called for `event`, with the same arguments. */
export function runGroupListener(event: GroupMemberEvent, callbacks: GroupListenerCallbacks): void {
  switch (event.type) {
    case 'group/member-joined':
      callbacks.onGroupMemberJoined?.(event.action, event.joinedUser, event.joinedGroup);
      return;
    case 'group/member-left':
      callbacks.onGroupMemberLeft?.(event.action, event.leftUser, event.leftGroup);
      return;
    case 'group/member-kicked':
      callbacks.onGroupMemberKicked?.(
        event.action,
        event.kickedUser,
        event.kickedBy,
        event.kickedFrom
      );
      return;
    case 'group/member-banned':
      callbacks.onGroupMemberBanned?.(
        event.action,
        event.bannedUser,
        event.bannedBy,
        event.bannedFrom
      );
      return;
    case 'group/member-unbanned':
      callbacks.onGroupMemberUnbanned?.(
        event.action,
        event.unbannedUser,
        event.unbannedBy,
        event.unbannedFrom
      );
      return;
    case 'group/member-added':
      callbacks.onMemberAddedToGroup?.(event.action, event.addedBy, event.addedUser, event.addedTo);
      return;
    case 'group/member-scope-changed':
      callbacks.onGroupMemberScopeChanged?.(
        event.action,
        event.changedUser,
        event.newScope,
        event.oldScope,
        event.changedGroup
      );
      return;
  }
}
