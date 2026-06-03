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

  it('works without t function (falls back to key names)', () => {
    const msg = mockAction({ action: 'joined', byName: 'Alice' });
    expect(getActionMessageText(msg)).toBe('Alice message_list_action_joined');
  });
});
