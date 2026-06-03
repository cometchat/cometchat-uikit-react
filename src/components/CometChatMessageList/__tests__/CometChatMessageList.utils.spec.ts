import { describe, it, expect, vi } from 'vitest';
import {
  generateMuid,
  isMessageForConversation,
  isThreadReplyForConversation,
  isReactionForConversation,
  deduplicateById,
  createPendingTextMessage,
  createPendingMediaMessage,
  attachErrorToMessage,
  updateReceiptsOnMessages,
  updateQuotedMessageReferences,
  isLastReadInRange,
  shouldMarkConversationRead,
} from '../CometChatMessageList.utils';
import { buildUser, buildGroup, buildTextMessage } from '../../../testing/mock-builders';
import { CometChat } from '@cometchat/chat-sdk-javascript';

// ---------------------------------------------------------------------------
// generateMuid
// ---------------------------------------------------------------------------

describe('generateMuid', () => {
  it('returns a string starting with muid_', () => {
    expect(generateMuid()).toMatch(/^muid_/);
  });

  it('returns unique values', () => {
    const a = generateMuid();
    const b = generateMuid();
    expect(a).not.toBe(b);
  });
});

// ---------------------------------------------------------------------------
// isMessageForConversation
// ---------------------------------------------------------------------------

describe('isMessageForConversation', () => {
  const user = buildUser({ uid: 'user-1' });
  const group = buildGroup({ guid: 'group-1' });
  const loggedInUserId = 'me';

  function mockMsg(overrides: {
    senderUid?: string;
    receiverType?: string;
    receiverId?: string;
    parentMessageId?: number;
  }) {
    return {
      getSender: () => ({ getUid: () => overrides.senderUid ?? 'user-2' }),
      getReceiverType: () => overrides.receiverType ?? 'user',
      getReceiverId: () => overrides.receiverId ?? 'user-1',
      getParentMessageId: () => overrides.parentMessageId ?? 0,
    };
  }

  it('matches user conversation by receiverId', () => {
    expect(
      isMessageForConversation(
        mockMsg({ receiverType: 'user', receiverId: 'user-1' }) as any,
        user as any,
        undefined,
        undefined,
        loggedInUserId
      )
    ).toBe(true);
  });

  it('matches user conversation by senderId', () => {
    expect(
      isMessageForConversation(
        mockMsg({ senderUid: 'user-1', receiverType: 'user', receiverId: 'user-2' }) as any,
        user as any,
        undefined,
        undefined,
        loggedInUserId
      )
    ).toBe(true);
  });

  it('matches group conversation', () => {
    expect(
      isMessageForConversation(
        mockMsg({ receiverType: 'group', receiverId: 'group-1' }) as any,
        undefined,
        group as any,
        undefined,
        loggedInUserId
      )
    ).toBe(true);
  });

  it('rejects message for different user', () => {
    expect(
      isMessageForConversation(
        mockMsg({ receiverType: 'user', receiverId: 'user-99', senderUid: 'user-99' }) as any,
        user as any,
        undefined,
        undefined,
        loggedInUserId
      )
    ).toBe(false);
  });

  it('rejects thread replies in normal mode', () => {
    expect(
      isMessageForConversation(
        mockMsg({ receiverType: 'user', receiverId: 'user-1', parentMessageId: 42 }) as any,
        user as any,
        undefined,
        undefined,
        loggedInUserId
      )
    ).toBe(false);
  });

  it('accepts thread replies in thread mode', () => {
    expect(
      isMessageForConversation(
        mockMsg({ receiverType: 'user', receiverId: 'user-1', parentMessageId: 42 }) as any,
        user as any,
        undefined,
        42,
        loggedInUserId
      )
    ).toBe(true);
  });

  it('rejects wrong thread', () => {
    expect(
      isMessageForConversation(
        mockMsg({ parentMessageId: 99 }) as any,
        user as any,
        undefined,
        42,
        loggedInUserId
      )
    ).toBe(false);
  });

  it('excludes messages sent by the logged-in user', () => {
    expect(
      isMessageForConversation(
        mockMsg({ senderUid: 'me', receiverType: 'user', receiverId: 'user-1' }) as any,
        user as any,
        undefined,
        undefined,
        'me'
      )
    ).toBe(false);
  });

  it('returns false when neither user nor group is provided', () => {
    expect(
      isMessageForConversation(
        mockMsg({ receiverType: 'user', receiverId: 'user-1' }) as any,
        undefined,
        undefined,
        undefined,
        loggedInUserId
      )
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isThreadReplyForConversation
// ---------------------------------------------------------------------------

describe('isThreadReplyForConversation', () => {
  const user = buildUser({ uid: 'user-1' });
  const group = buildGroup({ guid: 'group-1' });

  function mockMsg(overrides: {
    senderUid?: string;
    receiverId?: string;
    parentMessageId?: number;
  }) {
    return {
      getSender: () => ({ getUid: () => overrides.senderUid ?? 'user-2' }),
      getReceiverType: () => 'user',
      getReceiverId: () => overrides.receiverId ?? 'user-1',
      getParentMessageId: () => overrides.parentMessageId ?? 0,
    };
  }

  it('returns true for thread reply matching user conversation', () => {
    expect(
      isThreadReplyForConversation(
        mockMsg({ parentMessageId: 42, receiverId: 'user-1' }) as any,
        user as any,
        undefined
      )
    ).toBe(true);
  });

  it('returns true for thread reply matching user by sender', () => {
    expect(
      isThreadReplyForConversation(
        mockMsg({ parentMessageId: 42, senderUid: 'user-1', receiverId: 'other' }) as any,
        user as any,
        undefined
      )
    ).toBe(true);
  });

  it('returns true for thread reply matching group conversation', () => {
    const groupMsg = {
      getSender: () => ({ getUid: () => 'user-2' }),
      getReceiverType: () => 'group',
      getReceiverId: () => 'group-1',
      getParentMessageId: () => 42,
    };
    expect(isThreadReplyForConversation(groupMsg as any, undefined, group as any)).toBe(true);
  });

  it('returns false for non-thread messages', () => {
    expect(
      isThreadReplyForConversation(mockMsg({ parentMessageId: 0 }) as any, user as any, undefined)
    ).toBe(false);
  });

  it('returns false when neither user nor group matches', () => {
    expect(
      isThreadReplyForConversation(
        mockMsg({ parentMessageId: 42, receiverId: 'other', senderUid: 'other' }) as any,
        user as any,
        undefined
      )
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isReactionForConversation
// ---------------------------------------------------------------------------

describe('isReactionForConversation', () => {
  const user = buildUser({ uid: 'user-1' });
  const group = buildGroup({ guid: 'group-1' });

  function mockReactionEvent(overrides: {
    receiverType?: string;
    receiverId?: string;
    reactedByUid?: string;
    parentMessageId?: number;
  }) {
    return {
      getReceiverId: () => overrides.receiverId ?? 'user-1',
      getReceiverType: () => overrides.receiverType ?? 'user',
      getParentMessageId: () => overrides.parentMessageId ?? 0,
      getReaction: () => ({
        getReactedBy: () => ({
          getUid: () => overrides.reactedByUid ?? 'user-2',
        }),
      }),
    };
  }

  it('matches user conversation by receiverId', () => {
    expect(
      isReactionForConversation(
        mockReactionEvent({ receiverType: 'user', receiverId: 'user-1' }) as any,
        user as any,
        undefined,
        undefined
      )
    ).toBe(true);
  });

  it('matches user conversation by reactedBy UID', () => {
    expect(
      isReactionForConversation(
        mockReactionEvent({
          receiverType: 'user',
          receiverId: 'other',
          reactedByUid: 'user-1',
        }) as any,
        user as any,
        undefined,
        undefined
      )
    ).toBe(true);
  });

  it('matches group conversation', () => {
    expect(
      isReactionForConversation(
        mockReactionEvent({ receiverType: 'group', receiverId: 'group-1' }) as any,
        undefined,
        group as any,
        undefined
      )
    ).toBe(true);
  });

  it('matches thread mode by parentMessageId', () => {
    expect(
      isReactionForConversation(
        mockReactionEvent({ parentMessageId: 42 }) as any,
        user as any,
        undefined,
        42
      )
    ).toBe(true);
  });

  it('rejects non-thread reaction in thread mode', () => {
    expect(
      isReactionForConversation(
        mockReactionEvent({ parentMessageId: 99 }) as any,
        user as any,
        undefined,
        42
      )
    ).toBe(false);
  });

  it('rejects thread reaction in non-thread mode', () => {
    expect(
      isReactionForConversation(
        mockReactionEvent({
          parentMessageId: 42,
          receiverType: 'user',
          receiverId: 'user-1',
        }) as any,
        user as any,
        undefined,
        undefined
      )
    ).toBe(false);
  });

  it('returns false when neither user nor group matches', () => {
    expect(
      isReactionForConversation(
        mockReactionEvent({
          receiverType: 'user',
          receiverId: 'other',
          reactedByUid: 'other',
        }) as any,
        user as any,
        undefined,
        undefined
      )
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// deduplicateById
// ---------------------------------------------------------------------------

describe('deduplicateById', () => {
  function mkMsg(id: number): CometChat.BaseMessage {
    return buildTextMessage({ id }) as unknown as CometChat.BaseMessage;
  }

  it('returns same items when no duplicates', () => {
    const msgs = [mkMsg(1), mkMsg(2), mkMsg(3)];
    const result = deduplicateById(msgs);
    expect(result).toHaveLength(3);
    expect(result.map(m => m.getId())).toEqual([1, 2, 3]);
  });

  it('removes adjacent duplicates keeping last occurrence', () => {
    const first = mkMsg(1);
    const second = mkMsg(1);
    const result = deduplicateById([first, second]);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(second);
  });

  it('removes non-adjacent duplicates keeping last occurrence', () => {
    const a1 = mkMsg(1);
    const b = mkMsg(2);
    const a2 = mkMsg(1);
    const result = deduplicateById([a1, b, a2]);
    expect(result).toHaveLength(2);
    expect(result[0]).toBe(b);
    expect(result[1]).toBe(a2);
  });

  it('handles empty array', () => {
    expect(deduplicateById([])).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// createPendingTextMessage / createPendingMediaMessage
// ---------------------------------------------------------------------------

describe('createPendingTextMessage', () => {
  it('returns a CometChat.TextMessage pre-populated with muid, sender, sentAt', () => {
    const sender = buildUser({ uid: 'me' });
    const result = createPendingTextMessage(
      'test-muid',
      'Hello',
      sender as unknown as CometChat.User,
      'user-2',
      'user'
    );
    expect(result).toBeInstanceOf(CometChat.TextMessage);
    expect(result.getMuid()).toBe('test-muid');
    expect(result.getText()).toBe('Hello');
    expect(result.getReceiverId()).toBe('user-2');
    expect(result.getReceiverType()).toBe('user');
    expect(result.getSender().getUid()).toBe('me');
    expect(result.getSentAt()).toBeGreaterThan(0);
    // parentMessageId is only set via setParentMessageId — undefined/0 when unset.
    expect(result.getParentMessageId() || 0).toBe(0);
  });

  it('sets parentMessageId when provided', () => {
    const sender = buildUser({ uid: 'me' });
    const result = createPendingTextMessage(
      'test-muid',
      'Thread reply',
      sender as unknown as CometChat.User,
      'group-1',
      'group',
      42
    );
    expect(result.getParentMessageId()).toBe(42);
  });
});

describe('createPendingMediaMessage', () => {
  it('returns a CometChat.MediaMessage pre-populated with muid, sender, sentAt, file metadata', () => {
    const sender = buildUser({ uid: 'me' });
    const file = new File(['abc'], 'x.png', { type: 'image/png' });
    const result = createPendingMediaMessage(
      'test-muid',
      file,
      'image',
      sender as unknown as CometChat.User,
      'user-2',
      'user'
    );
    expect(result).toBeInstanceOf(CometChat.MediaMessage);
    expect(result.getMuid()).toBe('test-muid');
    expect(result.getType()).toBe('image');
    expect(result.getSender().getUid()).toBe('me');
    const meta = result.getMetadata() as Record<string, unknown>;
    expect(meta.fileName).toBe('x.png');
    expect(meta.fileType).toBe('image/png');
  });
});

describe('attachErrorToMessage', () => {
  it('stamps the error onto metadata and the direct `.error` property', () => {
    const sender = buildUser({ uid: 'me' });
    const msg = createPendingTextMessage(
      'm',
      'hi',
      sender as unknown as CometChat.User,
      'u',
      'user'
    );
    attachErrorToMessage(msg, { code: 'ERR_PERMISSION_DENIED', message: 'nope' });
    const meta = msg.getMetadata() as { error?: { code?: string } };
    expect(meta.error?.code).toBe('ERR_PERMISSION_DENIED');
    const direct = (msg as unknown as { error?: { code?: string } }).error;
    expect(direct?.code).toBe('ERR_PERMISSION_DENIED');
  });

  it('normalizes a plain Error instance', () => {
    const sender = buildUser({ uid: 'me' });
    const msg = createPendingTextMessage(
      'm',
      'hi',
      sender as unknown as CometChat.User,
      'u',
      'user'
    );
    attachErrorToMessage(msg, new Error('oops'));
    const direct = (msg as unknown as { error?: { message?: string } }).error;
    expect(direct?.message).toBe('oops');
  });
});

// ---------------------------------------------------------------------------
// updateReceiptsOnMessages
// ---------------------------------------------------------------------------

describe('updateReceiptsOnMessages', () => {
  function mkOutgoingMsg(id: number, deliveredAt = 0, readAt = 0) {
    return {
      getId: () => id,
      getSender: () => ({ getUid: () => 'me' }),
      getDeliveredAt: () => deliveredAt,
      getReadAt: () => readAt,
      setDeliveredAt: vi.fn(),
      setReadAt: vi.fn(),
    } as any;
  }

  function mkIncomingMsg(id: number) {
    return {
      getId: () => id,
      getSender: () => ({ getUid: () => 'other' }),
      getDeliveredAt: () => 0,
      getReadAt: () => 0,
      setDeliveredAt: vi.fn(),
      setReadAt: vi.fn(),
    } as any;
  }

  it('updates deliveredAt on outgoing messages ≤ target ID', () => {
    const m1 = mkOutgoingMsg(1);
    const m2 = mkOutgoingMsg(2);
    const m3 = mkOutgoingMsg(3);
    const result = updateReceiptsOnMessages([m1, m2, m3], 'delivered', 2, 1000, 'me');
    expect(m1.setDeliveredAt).toHaveBeenCalledWith(1000);
    expect(m2.setDeliveredAt).toHaveBeenCalledWith(1000);
    expect(m3.setDeliveredAt).not.toHaveBeenCalled();
    expect(result).not.toBe([m1, m2, m3]); // new array reference
  });

  it('updates readAt on outgoing messages ≤ target ID', () => {
    const m1 = mkOutgoingMsg(1);
    const m2 = mkOutgoingMsg(2);
    updateReceiptsOnMessages([m1, m2], 'read', 2, 2000, 'me');
    expect(m1.setReadAt).toHaveBeenCalledWith(2000);
    expect(m2.setReadAt).toHaveBeenCalledWith(2000);
  });

  it('skips messages > target ID', () => {
    const m1 = mkOutgoingMsg(5);
    updateReceiptsOnMessages([m1], 'delivered', 3, 1000, 'me');
    expect(m1.setDeliveredAt).not.toHaveBeenCalled();
  });

  it('skips incoming messages', () => {
    const m1 = mkIncomingMsg(1);
    updateReceiptsOnMessages([m1], 'delivered', 5, 1000, 'me');
    expect(m1.setDeliveredAt).not.toHaveBeenCalled();
  });

  it('returns same reference if nothing changed', () => {
    const m1 = mkOutgoingMsg(1, 500); // already has deliveredAt
    const msgs = [m1];
    const result = updateReceiptsOnMessages(msgs, 'delivered', 1, 1000, 'me');
    expect(result).toBe(msgs);
  });
});

// ---------------------------------------------------------------------------
// updateQuotedMessageReferences
// ---------------------------------------------------------------------------

describe('updateQuotedMessageReferences', () => {
  it('updates quoted message when original is edited', () => {
    const setQuotedMessage = vi.fn();
    const quotingMsg = {
      getId: () => 2,
      getQuotedMessageId: () => 1,
      setQuotedMessage,
    } as any;
    const editedMsg = { getId: () => 1, getText: () => 'edited text' } as any;

    const result = updateQuotedMessageReferences([quotingMsg], editedMsg);
    expect(setQuotedMessage).toHaveBeenCalledWith(editedMsg);
    expect(result).not.toBe([quotingMsg]);
  });

  it('returns same reference if no quotes match', () => {
    const msg = {
      getId: () => 2,
      getQuotedMessageId: () => 99,
      setQuotedMessage: vi.fn(),
    } as any;
    const editedMsg = { getId: () => 1 } as any;

    const msgs = [msg];
    const result = updateQuotedMessageReferences(msgs, editedMsg);
    expect(result).toBe(msgs);
    expect(msg.setQuotedMessage).not.toHaveBeenCalled();
  });

  it('handles messages without getQuotedMessageId', () => {
    const msg = { getId: () => 2 } as any;
    const editedMsg = { getId: () => 1 } as any;
    const msgs = [msg];
    const result = updateQuotedMessageReferences(msgs, editedMsg);
    expect(result).toBe(msgs);
  });
});

// ---------------------------------------------------------------------------
// isLastReadInRange
// ---------------------------------------------------------------------------

describe('isLastReadInRange', () => {
  it('returns true when lastReadId is in messages', () => {
    const messages = [{ getId: () => 1 }, { getId: () => 2 }, { getId: () => 3 }];
    expect(isLastReadInRange(messages as any, 2)).toBe(true);
  });

  it('returns false when lastReadId is not in messages', () => {
    const messages = [{ getId: () => 1 }, { getId: () => 2 }];
    expect(isLastReadInRange(messages as any, 5)).toBe(false);
  });

  it('returns false when lastReadId is null', () => {
    expect(isLastReadInRange([{ getId: () => 1 }] as any, null)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// shouldMarkConversationRead
// ---------------------------------------------------------------------------

describe('shouldMarkConversationRead', () => {
  function msgs(...ids: number[]): CometChat.BaseMessage[] {
    return ids.map(id => buildTextMessage({ id }) as unknown as CometChat.BaseMessage);
  }

  it('returns true when unreadCount is 0', () => {
    expect(shouldMarkConversationRead(msgs(1, 2, 3), 2, 0, undefined)).toBe(true);
  });

  it('returns true when lastReadId is null', () => {
    expect(shouldMarkConversationRead(msgs(1, 2, 3), null, 5, undefined)).toBe(true);
  });

  it('returns true when lastReadId is in fetched range', () => {
    expect(shouldMarkConversationRead(msgs(1, 2, 3), 2, 5, undefined)).toBe(true);
  });

  it('returns true when lastReadId is above fetched range', () => {
    expect(shouldMarkConversationRead(msgs(5, 6, 7), 1, 5, undefined)).toBe(true);
  });

  it('returns false when lastReadId is below fetched range', () => {
    expect(shouldMarkConversationRead(msgs(1, 2, 3), 10, 5, undefined)).toBe(false);
  });

  it('returns false in thread mode', () => {
    expect(shouldMarkConversationRead(msgs(1, 2, 3), 2, 5, 99)).toBe(false);
  });
});
