import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';
import { deduplicateById, isMessageForConversation } from '../CometChatMessageList.utils';
import { messageListReducer, initialMessageListState } from '../CometChatMessageList.reducer';
import type { CometChatMessageListState } from '../CometChatMessageList.types';
import type { CometChat } from '@cometchat/chat-sdk-javascript';

// ---------------------------------------------------------------------------
// Helpers — mock message builders for property tests
// ---------------------------------------------------------------------------

function mkMsg(id: number, sentAt = 0): CometChat.BaseMessage {
  return {
    getId: () => id,
    getSender: () => ({ getUid: () => `sender-${String(id)}` }),
    getReceiverType: () => 'user',
    getReceiverId: () => 'recv',
    getParentMessageId: () => 0,
    getReplyCount: () => 0,
    getSentAt: () => sentAt,
    getDeliveredAt: () => 0,
    getReadAt: () => 0,
    getDeletedAt: () => 0,
    getEditedAt: () => 0,
    getMuid: () => `muid-${String(id)}`,
    getType: () => 'text',
    getCategory: () => 'message',
    getReactions: () => [],
    getMetadata: () => ({}),
    getMentionedUsers: () => [],
  } as unknown as CometChat.BaseMessage;
}

function mkOutgoingMsg(
  id: number,
  senderUid: string,
  deliveredAt = 0,
  readAt = 0
): CometChat.BaseMessage {
  return {
    getId: () => id,
    getSender: () => ({ getUid: () => senderUid }),
    getReceiverType: () => 'user',
    getReceiverId: () => 'recv',
    getParentMessageId: () => 0,
    getReplyCount: () => 0,
    getSentAt: () => id * 1000,
    getDeliveredAt: () => deliveredAt,
    getReadAt: () => readAt,
    getDeletedAt: () => 0,
    getEditedAt: () => 0,
    getMuid: () => `muid-${String(id)}`,
    getType: () => 'text',
    getCategory: () => 'message',
    getReactions: () => [],
    getMetadata: () => ({}),
    getMentionedUsers: () => [],
    setDeliveredAt: vi.fn(),
    setReadAt: vi.fn(),
  } as unknown as CometChat.BaseMessage;
}

// ---------------------------------------------------------------------------
// Property 1: Message merge deduplication
// **Validates: Requirements 1.2, 1.5**
// ---------------------------------------------------------------------------

describe('Property 1: Message merge deduplication', () => {
  it('deduplicateById produces unique IDs and preserves relative order', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 1, max: 50 }), { minLength: 0, maxLength: 30 }),
        ids => {
          const messages = ids.map((id, i) => mkMsg(id, i));
          const result = deduplicateById(messages);

          // All IDs in result are unique
          const resultIds = result.map(m => m.getId());
          const uniqueIds = new Set(resultIds);
          expect(uniqueIds.size).toBe(resultIds.length);

          // Every unique ID from input appears in result
          const inputUniqueIds = new Set(ids);
          for (const uid of inputUniqueIds) {
            expect(resultIds).toContain(uid);
          }

          // Relative order is preserved: for any two messages in result,
          // their order matches their order in the input (by last occurrence)
          for (let i = 0; i < result.length - 1; i++) {
            const idxA = ids.lastIndexOf(result[i]!.getId());
            const idxB = ids.lastIndexOf(result[i + 1]!.getId());
            expect(idxA).toBeLessThan(idxB);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 2: Conversation filter correctness
// **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6**
// ---------------------------------------------------------------------------

describe('Property 2: Conversation filter correctness', () => {
  it('isMessageForConversation returns true iff message matches conversation rules', () => {
    const conversationArb = fc.record({
      mode: fc.constantFrom('user', 'group') as fc.Arbitrary<'user' | 'group'>,
      targetId: fc.stringMatching(/^[a-z]{3,8}$/),
      threadParentId: fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined }),
      loggedInUserId: fc.stringMatching(/^[a-z]{3,8}$/),
    });

    const messageArb = fc.record({
      senderUid: fc.stringMatching(/^[a-z]{3,8}$/),
      receiverType: fc.constantFrom('user', 'group'),
      receiverId: fc.stringMatching(/^[a-z]{3,8}$/),
      parentMessageId: fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined }),
    });

    fc.assert(
      fc.property(conversationArb, messageArb, (conv, msg) => {
        const mockMessage = {
          getSender: () => ({ getUid: () => msg.senderUid }),
          getReceiverType: () => msg.receiverType,
          getReceiverId: () => msg.receiverId,
          getParentMessageId: () => msg.parentMessageId ?? 0,
        } as any;

        const user = conv.mode === 'user' ? ({ getUid: () => conv.targetId } as any) : undefined;
        const group = conv.mode === 'group' ? ({ getGuid: () => conv.targetId } as any) : undefined;

        const result = isMessageForConversation(
          mockMessage,
          user,
          group,
          conv.threadParentId,
          conv.loggedInUserId
        );

        // Compute expected result independently
        const senderId = msg.senderUid;
        const msgParentId = msg.parentMessageId ?? 0;

        // Rule (c): sender exclusion
        if (senderId === conv.loggedInUserId) {
          expect(result).toBe(false);
          return;
        }

        // Rule (a): thread mode
        if (conv.threadParentId) {
          expect(result).toBe(msgParentId === conv.threadParentId);
          return;
        }

        // Non-thread mode: reject thread replies
        if (msgParentId) {
          expect(result).toBe(false);
          return;
        }

        // Rule (b): match conversation target
        if (conv.mode === 'user') {
          const expected =
            msg.receiverType === 'user' &&
            (msg.receiverId === conv.targetId || senderId === conv.targetId);
          expect(result).toBe(expected);
        } else {
          const expected = msg.receiverType === 'group' && msg.receiverId === conv.targetId;
          expect(result).toBe(expected);
        }
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// **Validates: Requirements 3.1, 3.2, 3.5**
// ---------------------------------------------------------------------------

describe('Property 3: Send round-trip', () => {
  it('MESSAGE_SEND_START then MESSAGE_SEND_SUCCESS replaces by muid with the confirmed message', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^muid-[a-z0-9]{3,10}$/),
        fc.integer({ min: 1, max: 100000 }),
        (muid, confirmedId) => {
          // Build a pending message carrying the generated muid.
          const pendingBase = mkMsg(0);
          const pending: CometChat.BaseMessage = {
            ...(pendingBase as unknown as object),
            getMuid: () => muid,
          } as unknown as CometChat.BaseMessage;

          const confirmedBase = mkMsg(confirmedId);
          const confirmed: CometChat.BaseMessage = {
            ...(confirmedBase as unknown as object),
            getMuid: () => muid,
          } as unknown as CometChat.BaseMessage;

          // Dispatch MESSAGE_SEND_START — pending lives directly in state.messages
          let state = messageListReducer(initialMessageListState, {
            type: 'MESSAGE_SEND_START',
            muid,
            message: pending,
          });
          expect(state.messages.some(m => m.getMuid() === muid)).toBe(true);

          // Dispatch MESSAGE_SEND_SUCCESS — swap by muid with the confirmed message
          state = messageListReducer(state, {
            type: 'MESSAGE_SEND_SUCCESS',
            muid,
            confirmedMessage: confirmed,
          });

          // Confirmed message is in messages array
          const ids = state.messages.map(m => m.getId());
          expect(ids).toContain(confirmedId);

          // Confirmed message appears exactly once
          expect(ids.filter(id => id === confirmedId)).toHaveLength(1);

          // Only one entry for this muid
          const entriesForMuid = state.messages.filter(m => m.getMuid() === muid);
          expect(entriesForMuid).toHaveLength(1);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 4: New message count controlled by isAtBottom
// **Validates: Requirements 4.3, 4.4, 5.4, 11.3**
// ---------------------------------------------------------------------------

describe('Property 4: New message count controlled by isAtBottom', () => {
  it('MESSAGE_RECEIVED increments count when not at bottom, keeps 0 when at bottom', () => {
    fc.assert(
      fc.property(fc.boolean(), fc.integer({ min: 1, max: 20 }), (isAtBottom, messageCount) => {
        let state: CometChatMessageListState = {
          ...initialMessageListState,
          isAtBottom,
          hasReachedLatest: true,
          fetchState: 'loaded',
        };

        for (let i = 1; i <= messageCount; i++) {
          state = messageListReducer(state, {
            type: 'MESSAGE_RECEIVED',
            message: mkMsg(i),
          });
        }

        if (isAtBottom) {
          expect(state.newMessageCount).toBe(0);
        } else {
          expect(state.newMessageCount).toBe(messageCount);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('SET_AT_BOTTOM with true resets newMessageCount to 0', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100 }), count => {
        const state: CometChatMessageListState = {
          ...initialMessageListState,
          newMessageCount: count,
          isAtBottom: false,
        };

        const result = messageListReducer(state, {
          type: 'SET_AT_BOTTOM',
          isAtBottom: true,
        });

        expect(result.newMessageCount).toBe(0);
        expect(result.isAtBottom).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 5: Receipt batch update
// **Validates: Requirements 6.1, 6.2, 6.3, 6.4**
// ---------------------------------------------------------------------------

describe('Property 5: Receipt batch update', () => {
  it('RECEIPT_UPDATE sets timestamps on messages ≤ target, not on messages > target', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 1, max: 100 }), { minLength: 1, maxLength: 20 }),
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 1000, max: 99999 }),
        fc.constantFrom('delivered', 'read') as fc.Arbitrary<'delivered' | 'read'>,
        (msgIds, receiptMsgId, timestamp, receiptType) => {
          // Create unique sorted outgoing messages
          const uniqueIds = [...new Set(msgIds)].sort((a, b) => a - b);
          const loggedInUserId = 'me';
          const messages = uniqueIds.map(id => mkOutgoingMsg(id, loggedInUserId));

          const state: CometChatMessageListState = {
            ...initialMessageListState,
            messages,
            fetchState: 'loaded',
          };

          const result = messageListReducer(state, {
            type: 'RECEIPT_UPDATE',
            receiptType,
            messageId: receiptMsgId,
            timestamp,
            loggedInUserId,
          });

          // Check each message
          for (const m of result.messages) {
            const id = m.getId();
            const setter =
              receiptType === 'delivered' ? (m as any).setDeliveredAt : (m as any).setReadAt;

            if (id <= receiptMsgId) {
              expect(setter).toHaveBeenCalledWith(timestamp);
            } else {
              expect(setter).not.toHaveBeenCalled();
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 6: Edit and delete in-place replacement
// **Validates: Requirements 7.1, 7.2**
// ---------------------------------------------------------------------------

describe('Property 6: Edit and delete in-place replacement', () => {
  it('MESSAGE_EDITED replaces at same position, same length', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 1, max: 100 }), { minLength: 1, maxLength: 20 }),
        ids => {
          const uniqueIds = [...new Set(ids)];
          if (uniqueIds.length === 0) return;

          const messages = uniqueIds.map(id => mkMsg(id));
          const state: CometChatMessageListState = {
            ...initialMessageListState,
            messages,
          };

          // Pick a random message to edit
          const targetIdx = Math.floor(Math.random() * uniqueIds.length);
          const targetId = uniqueIds[targetIdx]!;
          const editedMsg = mkMsg(targetId, 99999);

          const result = messageListReducer(state, {
            type: 'MESSAGE_EDITED',
            message: editedMsg,
          });

          expect(result.messages).toHaveLength(uniqueIds.length);
          expect(result.messages[targetIdx]).toBe(editedMsg);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('MESSAGE_DELETED replaces at same position, same length', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 1, max: 100 }), { minLength: 1, maxLength: 20 }),
        ids => {
          const uniqueIds = [...new Set(ids)];
          if (uniqueIds.length === 0) return;

          const messages = uniqueIds.map(id => mkMsg(id));
          const state: CometChatMessageListState = {
            ...initialMessageListState,
            messages,
          };

          const targetIdx = Math.floor(Math.random() * uniqueIds.length);
          const targetId = uniqueIds[targetIdx]!;
          const deletedMsg = mkMsg(targetId, 99999);

          const result = messageListReducer(state, {
            type: 'MESSAGE_DELETED',
            message: deletedMsg,
          });

          expect(result.messages).toHaveLength(uniqueIds.length);
          expect(result.messages[targetIdx]).toBe(deletedMsg);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 7: Delete never removes from list
// **Validates: Requirements 7.4**
// ---------------------------------------------------------------------------

describe('Property 7: Delete never removes from list', () => {
  it('MESSAGE_DELETED preserves list length', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 1, max: 100 }), { minLength: 1, maxLength: 20 }),
        fc.integer({ min: 1, max: 100 }),
        (ids, deleteId) => {
          const uniqueIds = [...new Set(ids)];
          const messages = uniqueIds.map(id => mkMsg(id));
          const state: CometChatMessageListState = {
            ...initialMessageListState,
            messages,
          };

          const deletedMsg = mkMsg(deleteId);
          const result = messageListReducer(state, {
            type: 'MESSAGE_DELETED',
            message: deletedMsg,
          });

          // Length is always equal — delete replaces, never removes
          expect(result.messages.length).toBe(messages.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 8: Quoted message reference update on edit
// **Validates: Requirements 7.3**
// ---------------------------------------------------------------------------

describe('Property 8: Quoted message reference update on edit', () => {
  it('editing message A updates quoted reference in message B', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 1001, max: 2000 }),
        (idA, idB) => {
          const setQuotedMessage = vi.fn();
          const msgA = mkMsg(idA);
          const msgB = Object.assign(mkMsg(idB), {
            getQuotedMessageId: () => idA,
            setQuotedMessage,
          }) as CometChat.BaseMessage;

          const state: CometChatMessageListState = {
            ...initialMessageListState,
            messages: [msgA, msgB],
          };

          const editedA = mkMsg(idA, 99999);
          const result = messageListReducer(state, {
            type: 'MESSAGE_EDITED',
            message: editedA,
          });

          // Message A is replaced
          expect(result.messages[0]).toBe(editedA);
          // Message B's quoted reference is updated
          expect(setQuotedMessage).toHaveBeenCalledWith(editedA);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 10: Reply count increment
// **Validates: Requirements 10.1**
// ---------------------------------------------------------------------------

describe('Property 10: Reply count increment', () => {
  it('UPDATE_REPLY_COUNT increments replyCount by 1', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 0, max: 100 }),
        (parentId, initialReplyCount) => {
          const setReplyCount = vi.fn();
          const parentMsg = {
            getId: () => parentId,
            getSender: () => ({ getUid: () => 'user-1' }),
            getReceiverType: () => 'user',
            getReceiverId: () => 'user-2',
            getParentMessageId: () => 0,
            getReplyCount: () => initialReplyCount,
            getSentAt: () => 1000,
            getDeliveredAt: () => 0,
            getReadAt: () => 0,
            getDeletedAt: () => 0,
            getEditedAt: () => 0,
            getMuid: () => `muid-${String(parentId)}`,
            getType: () => 'text',
            getCategory: () => 'message',
            getReactions: () => [],
            getMetadata: () => ({}),
            getMentionedUsers: () => [],
            setReplyCount,
          } as unknown as CometChat.BaseMessage;

          const state: CometChatMessageListState = {
            ...initialMessageListState,
            messages: [parentMsg],
          };

          messageListReducer(state, {
            type: 'UPDATE_REPLY_COUNT',
            parentMessageId: parentId,
          });

          expect(setReplyCount).toHaveBeenCalledWith(initialReplyCount + 1);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 12: Historical view gap — real-time messages gated by hasReachedLatest
// **Validates: Requirements 20.3, 20.4**
// ---------------------------------------------------------------------------

describe('Property 12: Historical view gap — real-time messages gated by hasReachedLatest', () => {
  it('when hasReachedLatest is false, MESSAGE_RECEIVED only increments count', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 20 }), messageCount => {
        let state: CometChatMessageListState = {
          ...initialMessageListState,
          hasReachedLatest: false,
          fetchState: 'loaded',
        };

        const initialMsgCount = state.messages.length;

        for (let i = 1; i <= messageCount; i++) {
          state = messageListReducer(state, {
            type: 'MESSAGE_RECEIVED',
            message: mkMsg(i + 10000), // unique IDs
          });
        }

        // Messages array unchanged
        expect(state.messages.length).toBe(initialMsgCount);
        // Count incremented
        expect(state.newMessageCount).toBe(messageCount);
      }),
      { numRuns: 100 }
    );
  });

  it('when hasReachedLatest is true, MESSAGE_RECEIVED appends message', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 20 }), messageCount => {
        let state: CometChatMessageListState = {
          ...initialMessageListState,
          hasReachedLatest: true,
          isAtBottom: true,
          fetchState: 'loaded',
        };

        for (let i = 1; i <= messageCount; i++) {
          state = messageListReducer(state, {
            type: 'MESSAGE_RECEIVED',
            message: mkMsg(i + 20000),
          });
        }

        // Messages appended
        expect(state.messages.length).toBe(messageCount);
      }),
      { numRuns: 100 }
    );
  });
});
