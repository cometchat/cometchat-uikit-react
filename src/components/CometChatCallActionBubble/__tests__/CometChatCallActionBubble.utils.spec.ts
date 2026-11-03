/**
 * Unit tests for the call action bubble helpers: who sent the call, whether it
 * counts as missed, the status text for each side of the call, and the icon.
 */
import { describe, it, expect } from 'vitest';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  isSentByMe,
  isMissedCall,
  getCallStatusText,
  getCallIconClass,
} from '../CometChatCallActionBubble.utils';
import { CometChatUIKitConstants } from '../../../constants/CometChatUIKitConstants';

const { calls, MessageTypes } = CometChatUIKitConstants;
const me = { getUid: () => 'me' } as unknown as CometChat.User;

function call(
  status: string,
  initiator: string,
  type: string = MessageTypes.audio
): CometChat.Call {
  return {
    getStatus: () => status,
    getType: () => type,
    getCallInitiator: () => ({ getUid: () => initiator }),
  } as unknown as CometChat.Call;
}

const translate = (key: string) => `t:${key}`;

describe('isSentByMe', () => {
  it('is true only when I started the call', () => {
    expect(isSentByMe(call(calls.initiated, 'me'), me)).toBe(true);
    expect(isSentByMe(call(calls.initiated, 'bob'), me)).toBe(false);
  });
});

describe('isMissedCall', () => {
  it.each([calls.busy, calls.unanswered, calls.cancelled])(
    'a %s call from someone else is missed',
    status => {
      expect(isMissedCall(call(status, 'bob'), me)).toBe(true);
    }
  );

  it.each([calls.initiated, calls.ongoing, calls.ended, calls.rejected])(
    'a %s call from someone else is not missed',
    status => {
      expect(isMissedCall(call(status, 'bob'), me)).toBe(false);
    }
  );

  it('a call I started is never missed, nor one with no initiator', () => {
    expect(isMissedCall(call(calls.unanswered, 'me'), me)).toBe(false);
    expect(isMissedCall(call(calls.unanswered, ''), me)).toBe(false);
  });
});

describe('getCallStatusText', () => {
  it.each([
    [calls.initiated, 'call_action_outgoing', 'Outgoing Call'],
    [calls.cancelled, 'call_action_cancelled', 'Cancelled Call'],
    [calls.rejected, 'call_action_rejected', 'Rejected Call'],
    [calls.busy, 'call_action_missed', 'Missed Call'],
    [calls.ended, 'call_action_ended', 'Call Ended'],
    [calls.ongoing, 'call_action_answered', 'Answered Call'],
    [calls.unanswered, 'call_action_unanswered', 'Unanswered Call'],
    ['something-new', 'call_action_outgoing', 'Outgoing Call'],
  ])('my %s call reads %s', (status, key, fallback) => {
    expect(getCallStatusText(call(status, 'me'), me, translate)).toBe(`t:${key}`);
    expect(getCallStatusText(call(status, 'me'), me)).toBe(fallback);
  });

  it.each([
    [calls.initiated, 'call_action_incoming', 'Incoming Call'],
    [calls.ongoing, 'call_action_answered', 'Answered Call'],
    [calls.ended, 'call_action_ended', 'Call Ended'],
    [calls.unanswered, 'call_action_missed', 'Missed Call'],
    [calls.cancelled, 'call_action_missed', 'Missed Call'],
    [calls.busy, 'call_action_busy', 'Busy Call'],
    [calls.rejected, 'call_action_rejected', 'Rejected Call'],
    ['something-new', 'call_action_outgoing', 'Outgoing Call'],
  ])("someone else's %s call reads %s", (status, key, fallback) => {
    expect(getCallStatusText(call(status, 'bob'), me, translate)).toBe(`t:${key}`);
    expect(getCallStatusText(call(status, 'bob'), me)).toBe(fallback);
  });
});

describe('getCallIconClass', () => {
  const icon = (status: string, initiator: string, type: string) =>
    getCallIconClass(call(status, initiator, type), me).replace(
      'cometchat-action-bubble__icon--',
      ''
    );

  it('shows a missed icon for missed calls, by media type', () => {
    expect(icon(calls.unanswered, 'bob', MessageTypes.audio)).toBe('missed-audio');
    expect(icon(calls.busy, 'bob', MessageTypes.video)).toBe('missed-video');
  });

  it('shows the ended icon once a call has ended, whoever started it', () => {
    expect(icon(calls.ended, 'me', MessageTypes.video)).toBe('call-ended');
    expect(icon(calls.ended, 'bob', MessageTypes.audio)).toBe('call-ended');
  });

  it('otherwise shows the direction and media type', () => {
    expect(icon(calls.initiated, 'me', MessageTypes.audio)).toBe('outgoing-audio');
    expect(icon(calls.ongoing, 'me', MessageTypes.video)).toBe('outgoing-video');
    expect(icon(calls.initiated, 'bob', MessageTypes.audio)).toBe('incoming-audio');
    expect(icon(calls.rejected, 'bob', MessageTypes.video)).toBe('incoming-video');
  });
});
