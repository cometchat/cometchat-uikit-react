import { describe, it, expect, vi } from 'vitest';
import { getActionMessageText } from '../CometChatActionMessageUtils';
import type { CometChat } from '@cometchat/chat-sdk-javascript';

/** Helper to build a mock action message with the shape getActionMessageText expects. */
function mockAction(overrides: {
  action: string;
  byName?: string;
  onName?: string;
  newScope?: string;
}) {
  const msg: Record<string, unknown> = {
    actionBy: { name: overrides.byName ?? 'Alice' },
    actionOn: { name: overrides.onName ?? 'Bob' },
    action: overrides.action,
  };
  if (overrides.newScope) {
    msg.data = { extras: { scope: { new: overrides.newScope } } };
  }
  return msg as unknown as CometChat.BaseMessage;
}

const mockT = vi.fn((key: string) => {
  const translations: Record<string, string> = {
    message_list_action_added: 'added',
    message_list_action_joined: 'joined',
    message_list_action_left: 'left',
    message_list_action_kicked: 'kicked',
    message_list_action_banned: 'banned',
    message_list_action_unbanned: 'unbanned',
    message_list_action_made: 'made',
    group_action_added: '{actor} added {member}',
    group_action_joined: '{actor} joined',
    group_action_left: '{actor} left',
    group_action_kicked: '{actor} kicked {member}',
    group_action_banned: '{actor} banned {member}',
    group_action_unbanned: '{actor} unbanned {member}',
    group_action_scope_changed: '{actor} made {member} {scope}',
    member_scope_admin: 'Admin',
    member_scope_moderator: 'Moderator',
    member_scope_participant: 'Participant',
  };
  return translations[key] ?? key;
});

describe('getActionMessageText', () => {
  it('returns "Alice added Bob" for ADDED action', () => {
    const msg = mockAction({ action: 'added', byName: 'Alice', onName: 'Bob' });
    expect(getActionMessageText(msg, mockT as never)).toBe('Alice added Bob');
  });

  it('returns "Alice joined" for JOINED action', () => {
    const msg = mockAction({ action: 'joined', byName: 'Alice' });
    expect(getActionMessageText(msg, mockT as never)).toBe('Alice joined');
  });

  it('returns "Alice left" for LEFT action', () => {
    const msg = mockAction({ action: 'left', byName: 'Alice' });
    expect(getActionMessageText(msg, mockT as never)).toBe('Alice left');
  });

  it('returns "Admin kicked Bob" for KICKED action', () => {
    const msg = mockAction({ action: 'kicked', byName: 'Admin', onName: 'Bob' });
    expect(getActionMessageText(msg, mockT as never)).toBe('Admin kicked Bob');
  });

  it('returns "Admin banned Bob" for BANNED action', () => {
    const msg = mockAction({ action: 'banned', byName: 'Admin', onName: 'Bob' });
    expect(getActionMessageText(msg, mockT as never)).toBe('Admin banned Bob');
  });

  it('returns "Admin unbanned Bob" for UNBANNED action', () => {
    const msg = mockAction({ action: 'unbanned', byName: 'Admin', onName: 'Bob' });
    expect(getActionMessageText(msg, mockT as never)).toBe('Admin unbanned Bob');
  });

  it('returns scope change text for SCOPE_CHANGE action', () => {
    const msg = mockAction({
      action: 'scopeChanged',
      byName: 'Admin',
      onName: 'Bob',
      newScope: 'admin',
    });
    expect(getActionMessageText(msg, mockT as never)).toBe('Admin made Bob Admin');
  });

  it('returns empty string for unknown action', () => {
    const msg = mockAction({ action: 'unknown_action' });
    expect(getActionMessageText(msg, mockT as never)).toBe('');
  });

  it('returns empty string when actionBy is missing', () => {
    const msg = { actionOn: { name: 'Bob' }, action: 'joined' } as unknown as CometChat.BaseMessage;
    expect(getActionMessageText(msg)).toBe('');
  });

  it('returns empty string when actionOn is missing', () => {
    const msg = {
      actionBy: { name: 'Alice' },
      action: 'joined',
    } as unknown as CometChat.BaseMessage;
    expect(getActionMessageText(msg)).toBe('');
  });

  it('returns empty string for SCOPE_CHANGE without scope data', () => {
    const msg: Record<string, unknown> = {
      actionBy: { name: 'Admin' },
      actionOn: { name: 'Bob' },
      action: 'scopeChanged',
      data: { extras: {} },
    };
    expect(getActionMessageText(msg as unknown as CometChat.BaseMessage)).toBe('');
  });

  it('works without translations (falls back to the English sentence, never a raw key)', () => {
    const msg = mockAction({ action: 'joined', byName: 'Alice' });
    expect(getActionMessageText(msg)).toBe('Alice joined');
  });

  it('lets a translation put the names in its own word order', () => {
    const msg = mockAction({ action: 'scopeChanged', byName: 'Alice', onName: 'Bob', newScope: 'admin' });
    const t = (key: string) =>
      ({ group_action_scope_changed: '{actor}が{member}を{scope}にしました', member_scope_admin: '管理者' })[key] ?? key;
    expect(getActionMessageText(msg, t as never)).toBe('AliceがBobを管理者にしました');
  });

  // Display names are user-controlled: replacement patterns and placeholder text in a name are
  // shown as typed, and one name never fills another's placeholder.
  it.each([
    ['a member named with $&', { byName: 'Bob', onName: 'Al$&ice' }, 'Bob kicked Al$&ice'],
    ['a member named with $` $\' and $$', { byName: 'Bob', onName: "$`x$'y$$z" }, "Bob kicked $`x$'y$$z"],
    ['an actor named {member}', { byName: '{member}', onName: 'Carl' }, '{member} kicked Carl'],
    ['an actor named with $$', { byName: 'Pay$$Bob', onName: 'Carl' }, 'Pay$$Bob kicked Carl'],
  ])('shows %s as typed', (_, names, expected) => {
    const msg = mockAction({ action: 'kicked', ...names });
    expect(getActionMessageText(msg, mockT as never)).toBe(expected);
  });
});
