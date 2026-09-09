/**
 * The conversation matcher for pin broadcasts.
 *
 * Pin is broadcast across every conversation the user is in, so an unfiltered
 * panel would show pins from unrelated chats. This is deliberately NOT the
 * message list's `isMessageForConversation`, which drops the logged-in user's own
 * messages and rejects thread replies — both wrong here.
 */
import { describe, it, expect } from 'vitest';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { isMessageInConversation } from '../useCometChatPinnedMessages';

function message(opts: {
  receiverType: string;
  receiverId: string;
  senderUid: string;
  parentMessageId?: number;
}): CometChat.BaseMessage {
  return {
    getReceiverType: () => opts.receiverType,
    getReceiverId: () => opts.receiverId,
    getSender: () => ({ getUid: () => opts.senderUid }),
    getParentMessageId: () => opts.parentMessageId ?? 0,
  } as unknown as CometChat.BaseMessage;
}

describe('isMessageInConversation — group scope', () => {
  it('accepts a message addressed to this group', () => {
    const m = message({ receiverType: 'group', receiverId: 'g1', senderUid: 'someone' });
    expect(isMessageInConversation(m, undefined, 'g1')).toBe(true);
  });

  it('rejects a message from a different group', () => {
    const m = message({ receiverType: 'group', receiverId: 'g2', senderUid: 'someone' });
    expect(isMessageInConversation(m, undefined, 'g1')).toBe(false);
  });

  it('rejects a 1-1 message when scoped to a group', () => {
    const m = message({ receiverType: 'user', receiverId: 'g1', senderUid: 'someone' });
    expect(isMessageInConversation(m, undefined, 'g1')).toBe(false);
  });

  it('accepts a thread reply in this group — replies are pinnable', () => {
    const m = message({
      receiverType: 'group',
      receiverId: 'g1',
      senderUid: 'someone',
      parentMessageId: 99,
    });
    expect(isMessageInConversation(m, undefined, 'g1')).toBe(true);
  });
});

describe('isMessageInConversation — 1-1 scope', () => {
  it('accepts a message WE sent to them (they are the receiver)', () => {
    const m = message({ receiverType: 'user', receiverId: 'bob', senderUid: 'me' });
    expect(isMessageInConversation(m, 'bob', undefined)).toBe(true);
  });

  it('accepts a message THEY sent to us (they are the sender)', () => {
    // Matching only on receiverId would drop this half of the conversation.
    const m = message({ receiverType: 'user', receiverId: 'me', senderUid: 'bob' });
    expect(isMessageInConversation(m, 'bob', undefined)).toBe(true);
  });

  it('rejects a 1-1 message with an unrelated third party', () => {
    const m = message({ receiverType: 'user', receiverId: 'carol', senderUid: 'dave' });
    expect(isMessageInConversation(m, 'bob', undefined)).toBe(false);
  });

  it('rejects a group message when scoped to a 1-1', () => {
    const m = message({ receiverType: 'group', receiverId: 'bob', senderUid: 'bob' });
    expect(isMessageInConversation(m, 'bob', undefined)).toBe(false);
  });

  it('accepts our OWN pinned message — unlike the message-list matcher', () => {
    const m = message({ receiverType: 'user', receiverId: 'bob', senderUid: 'me' });
    expect(isMessageInConversation(m, 'bob', undefined)).toBe(true);
  });
});

describe('isMessageInConversation — no scope', () => {
  it('rejects everything when neither uid nor guid is given', () => {
    const m = message({ receiverType: 'user', receiverId: 'bob', senderUid: 'me' });
    expect(isMessageInConversation(m, undefined, undefined)).toBe(false);
  });

  it('prefers the group scope when both are somehow supplied', () => {
    const m = message({ receiverType: 'group', receiverId: 'g1', senderUid: 'me' });
    expect(isMessageInConversation(m, 'bob', 'g1')).toBe(true);
  });
});
