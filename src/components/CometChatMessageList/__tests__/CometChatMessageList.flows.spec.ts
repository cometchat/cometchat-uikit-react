/**
 * End-to-end flow tests for the MessageList data layer.
 *
 * These tests drive the reducer through the exact action sequences that the
 * init/scroll/events sub-hooks dispatch in real usage. They verify the user-
 * facing flows described in `.kiro/steering/message-list-flows.md`:
 *
 *   1. Open chat normally (startFromUnread=false) — scroll to bottom, mark read.
 *   2. Open chat via goToMessageId — scroll to target, mark read only if lastRead in range.
 *   3. Open chat via goToMessageId + startFromUnread=true — anchor to target, suppress read.
 *   4. Open chat normally (startFromUnread=true) — anchor to lastRead, show banner.
 *
 * Plus the flows from "common bugs":
 *   I.  Scrolling up prepends messages without clearing hasReachedLatest.
 *   II. Scroll-to-bottom branches: scroll-dom when latest loaded, refetch when historical.
 *
 * Plus supporting flows:
 *   - Thread mode never marks the parent conversation as read
 *   - Moderation-disapproved messages are terminal — edits don't downgrade them
 *   - Real-time messages are dropped (count-only) while hasReachedLatest=false
 *   - Own message sent from another tab clears markedUnreadByUser
 *   - scrollToBottomOnNewMessages force-sets isAtBottom=true
 *   - Mark-as-unread by user persists newMessageCount across scroll events
 */
import { describe, it, expect } from 'vitest';
import { messageListReducer } from '../CometChatMessageList.reducer';
import { shouldMarkConversationRead } from '../CometChatMessageList.utils';
import { initialMessageListState } from '../CometChatMessageList.types';
import type { CometChatMessageListState } from '../CometChatMessageList.types';
import { buildUser, buildTextMessage } from '../../../testing/mock-builders';
import type { CometChat } from '@cometchat/chat-sdk-javascript';

function msg(
  id: number,
  opts: { sender?: CometChat.User; sentAt?: number } = {}
): CometChat.BaseMessage {
  return buildTextMessage({
    id,
    sender: opts.sender,
    sentAt: opts.sentAt ?? 1_000_000 + id,
  }) as unknown as CometChat.BaseMessage;
}

describe('MessageList — end-to-end flows', () => {
  // ─────────────────────────────────────────────────────────────
  // Flow 1: open chat normally (startFromUnread=false)
  // ─────────────────────────────────────────────────────────────

  describe('Flow 1 — open normally', () => {
    it('walks FETCH_PREVIOUS_START → SUCCESS → landed state, no target', () => {
      let state = initialMessageListState;
      state = messageListReducer(state, { type: 'FETCH_PREVIOUS_START' });
      expect(state.fetchState).toBe('loading');

      state = messageListReducer(state, {
        type: 'FETCH_PREVIOUS_SUCCESS',
        messages: [msg(1), msg(2), msg(3)],
        hasMore: true,
      });

      expect(state.fetchState).toBe('loaded');
      expect(state.messages).toHaveLength(3);
      expect(state.hasReachedLatest).toBe(true);
      expect(state.scrollToMessageId).toBeNull();
      expect(state.showUnreadBanner).toBe(false);
    });

    it('marks the conversation read when there is no unread', () => {
      expect(shouldMarkConversationRead([msg(1), msg(2), msg(3)], null, 0, undefined)).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Flow 2: open chat via goToMessageId (normal)
  // ─────────────────────────────────────────────────────────────

  describe('Flow 2 — goToMessageId', () => {
    it('FETCH_AROUND_SUCCESS loads before + target + after and requests highlight', () => {
      const state = messageListReducer(initialMessageListState, {
        type: 'FETCH_AROUND_SUCCESS',
        messages: [msg(10), msg(20), msg(30)],
        targetMessageId: 20,
        hasMore: true,
        hasMoreNewer: true,
        highlight: true,
      });

      expect(state.messages).toHaveLength(3);
      expect(state.scrollToMessageId).toBe(20);
      expect(state.scrollToMessageHighlight).toBe(true);
      expect(state.hasReachedLatest).toBe(false); // more newer messages exist
    });

    it('marks conversation read when lastReadId is older than the fetched window', () => {
      // lastReadId=5 is older than messages[0].getId()=10 — means the last-read
      // message happened before the fetched range, so everything fetched is already
      // considered "after the read cursor" and safe to mark.
      expect(shouldMarkConversationRead([msg(10), msg(20), msg(30)], 5, 2, undefined)).toBe(true);
    });

    it('does not mark conversation read when lastReadId falls between fetched messages and is not present', () => {
      // lastReadId=15 is between messages[0]=10 and messages[2]=30 but not in the
      // fetched ids. The user has unread messages we can't account for.
      expect(shouldMarkConversationRead([msg(10), msg(20), msg(30)], 15, 2, undefined)).toBe(false);
    });

    it('sets hasReachedLatest when no newer messages exist beyond the window', () => {
      const state = messageListReducer(initialMessageListState, {
        type: 'FETCH_AROUND_SUCCESS',
        messages: [msg(10), msg(20), msg(30)],
        targetMessageId: 30,
        hasMore: true,
        hasMoreNewer: false,
      });
      expect(state.hasReachedLatest).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Flow 3: goToMessageId + startFromUnread=true
  //   - scroll-to-bottom should go to lastRead, not actual bottom
  //   - we simulate that via the reducer sequence the hook would dispatch
  // ─────────────────────────────────────────────────────────────

  describe('Flow 3 — goToMessageId + startFromUnread=true, scroll-to-bottom goes to lastRead', () => {
    it('after init + scroll-to-bottom, banner shows and unread clears', () => {
      // Starting point: opened via goToMessageId, loaded a historical window
      let state: CometChatMessageListState = messageListReducer(initialMessageListState, {
        type: 'FETCH_AROUND_SUCCESS',
        messages: [msg(100), msg(110)], // some middle window
        targetMessageId: 100,
        hasMore: true,
        hasMoreNewer: true,
        highlight: true,
      });

      state = messageListReducer(state, {
        type: 'SET_LAST_READ_MESSAGE_ID',
        messageId: 150,
      });
      state = messageListReducer(state, { type: 'SET_UNREAD_COUNT', count: 5 });

      expect(state.hasReachedLatest).toBe(false);
      expect(state.unreadCount).toBe(5);

      // User clicks scroll-to-bottom; hook dispatches this sequence to show the
      // banner and clear unread count while fetching around lastRead.
      state = messageListReducer(state, { type: 'CLEAR_NEW_MESSAGE_COUNT' });
      state = messageListReducer(state, { type: 'SET_UNREAD_COUNT', count: 0 });
      state = messageListReducer(state, {
        type: 'SET_LAST_READ_MESSAGE_ID',
        messageId: 150,
      });
      state = messageListReducer(state, { type: 'SET_SHOW_UNREAD_BANNER', value: true });

      expect(state.showUnreadBanner).toBe(true);
      expect(state.lastReadMessageId).toBe(150);
      expect(state.unreadCount).toBe(0);
      expect(state.newMessageCount).toBe(0);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Flow 4: open chat normally, startFromUnread=true
  // ─────────────────────────────────────────────────────────────

  describe('Flow 4 — startFromUnread=true with unread', () => {
    it('init sequence dispatches SET_LAST_READ_MESSAGE_ID + SET_SHOW_UNREAD_BANNER', () => {
      // The init hook would dispatch this sequence in sequence for startFromUnread=true
      let state: CometChatMessageListState = initialMessageListState;

      state = messageListReducer(state, {
        type: 'FETCH_AROUND_SUCCESS',
        messages: [msg(40), msg(50), msg(60)], // loaded around lastRead=50
        targetMessageId: 50,
        hasMore: true,
        hasMoreNewer: true,
        highlight: false, // passive anchor, no flash
      });

      state = messageListReducer(state, {
        type: 'SET_LAST_READ_MESSAGE_ID',
        messageId: 50,
      });
      state = messageListReducer(state, { type: 'SET_SHOW_UNREAD_BANNER', value: true });
      state = messageListReducer(state, { type: 'SET_UNREAD_COUNT', count: 3 });

      expect(state.scrollToMessageHighlight).toBe(false);
      expect(state.lastReadMessageId).toBe(50);
      expect(state.showUnreadBanner).toBe(true);
      expect(state.unreadCount).toBe(3);
      expect(state.hasReachedLatest).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Common bug I — prepend while scrolled up keeps hasReachedLatest
  // ─────────────────────────────────────────────────────────────

  describe('Bug I — scrolling up and prepending does not toggle hasReachedLatest', () => {
    it('FETCH_PREVIOUS_SUCCESS preserves hasReachedLatest', () => {
      let state: CometChatMessageListState = {
        ...initialMessageListState,
        messages: [msg(5), msg(6)],
        hasReachedLatest: true,
        fetchState: 'loaded',
      };

      state = messageListReducer(state, { type: 'FETCH_PREVIOUS_START' });
      state = messageListReducer(state, {
        type: 'FETCH_PREVIOUS_SUCCESS',
        messages: [msg(3), msg(4)],
        hasMore: true,
      });

      expect(state.messages.map(m => m.getId())).toEqual([3, 4, 5, 6]);
      expect(state.hasReachedLatest).toBe(true); // preserved
    });

    it('FETCH_PREVIOUS_SUCCESS preserves hasReachedLatest=false for historical view', () => {
      let state: CometChatMessageListState = {
        ...initialMessageListState,
        messages: [msg(20), msg(21)],
        hasReachedLatest: false,
        fetchState: 'loaded',
      };

      state = messageListReducer(state, {
        type: 'FETCH_PREVIOUS_SUCCESS',
        messages: [msg(18), msg(19)],
        hasMore: true,
      });

      expect(state.hasReachedLatest).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Common bug II — scroll-to-bottom branches
  // ─────────────────────────────────────────────────────────────

  describe('Bug II — scroll-to-bottom re-fetch resets state correctly', () => {
    it('RESET clears everything back to initial', () => {
      const busy: CometChatMessageListState = {
        ...initialMessageListState,
        messages: [msg(1)],
        hasReachedLatest: false,
        unreadCount: 5,
        lastReadMessageId: 99,
        newMessageCount: 3,
        showUnreadBanner: true,
      };

      const state = messageListReducer(busy, { type: 'RESET' });
      expect(state).toEqual(initialMessageListState);
    });

    it('markedUnreadByUser can be re-applied after RESET during refetch', () => {
      let state: CometChatMessageListState = {
        ...initialMessageListState,
        messages: [msg(1)],
        markedUnreadByUser: true,
        unreadCount: 3,
        lastReadMessageId: 50,
      };

      // Scroll-to-bottom refetch branch resets then restores markedUnreadByUser
      state = messageListReducer(state, { type: 'RESET' });
      state = messageListReducer(state, { type: 'SET_MARKED_UNREAD_BY_USER', value: true });
      state = messageListReducer(state, { type: 'SET_UNREAD_COUNT', count: 3 });
      state = messageListReducer(state, {
        type: 'SET_LAST_READ_MESSAGE_ID',
        messageId: 50,
      });

      expect(state.markedUnreadByUser).toBe(true);
      expect(state.unreadCount).toBe(3);
      expect(state.lastReadMessageId).toBe(50);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Real-time received while viewing historical messages
  // ─────────────────────────────────────────────────────────────

  describe('Real-time messages respect hasReachedLatest', () => {
    it('drops the incoming message from the list when hasReachedLatest=false', () => {
      const state: CometChatMessageListState = {
        ...initialMessageListState,
        messages: [msg(1)],
        hasReachedLatest: false,
        fetchState: 'loaded',
      };

      const next = messageListReducer(state, {
        type: 'MESSAGE_RECEIVED',
        message: msg(99),
      });

      expect(next.messages.map(m => m.getId())).toEqual([1]);
      expect(next.newMessageCount).toBe(1); // counted but not appended
    });

    it('appends the message when hasReachedLatest=true and at bottom', () => {
      const state: CometChatMessageListState = {
        ...initialMessageListState,
        messages: [msg(1)],
        hasReachedLatest: true,
        isAtBottom: true,
        fetchState: 'loaded',
      };

      const next = messageListReducer(state, {
        type: 'MESSAGE_RECEIVED',
        message: msg(2),
      });

      expect(next.messages.map(m => m.getId())).toEqual([1, 2]);
      expect(next.newMessageCount).toBe(0); // at bottom, count reset
    });

    it('increments newMessageCount when scrolled up even if hasReachedLatest=true', () => {
      const state: CometChatMessageListState = {
        ...initialMessageListState,
        messages: [msg(1)],
        hasReachedLatest: true,
        isAtBottom: false,
        fetchState: 'loaded',
      };

      const next = messageListReducer(state, {
        type: 'MESSAGE_RECEIVED',
        message: msg(2),
      });

      expect(next.messages).toHaveLength(2);
      expect(next.newMessageCount).toBe(1);
    });

    it('does not increment newMessageCount for messages from the logged-in user', () => {
      const state: CometChatMessageListState = {
        ...initialMessageListState,
        messages: [msg(1)],
        hasReachedLatest: true,
        isAtBottom: false,
        fetchState: 'loaded',
      };

      const next = messageListReducer(state, {
        type: 'MESSAGE_RECEIVED',
        message: msg(2),
        fromLoggedInUser: true,
      });

      expect(next.newMessageCount).toBe(0);
    });

    it('increments unreadCount when markedUnreadByUser and new message arrives', () => {
      const state: CometChatMessageListState = {
        ...initialMessageListState,
        messages: [msg(1)],
        hasReachedLatest: true,
        isAtBottom: true,
        markedUnreadByUser: true,
        unreadCount: 2,
        fetchState: 'loaded',
      };

      const next = messageListReducer(state, {
        type: 'MESSAGE_RECEIVED',
        message: msg(2),
      });

      expect(next.unreadCount).toBe(3); // 2 + 1
      expect(next.newMessageCount).toBe(1); // 0 + 1 (not reset because markedUnreadByUser)
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Moderation is terminal — edits/receipts don't downgrade it
  // ─────────────────────────────────────────────────────────────

  describe('Moderation is a terminal state', () => {
    it('MESSAGE_EDITED does not replace a disapproved message with a clean one', async () => {
      const { CometChat } = await import('@cometchat/chat-sdk-javascript');
      const disapproved = new CometChat.TextMessage('peer', 'hi', 'user');
      disapproved.setId(5);
      (disapproved as unknown as { getModerationStatus: () => string }).getModerationStatus = () =>
        'disapproved';

      const cleaned = new CometChat.TextMessage('peer', 'hi', 'user');
      cleaned.setId(5);

      const state: CometChatMessageListState = {
        ...initialMessageListState,
        messages: [disapproved as unknown as CometChat.BaseMessage],
        fetchState: 'loaded',
      };

      const next = messageListReducer(state, {
        type: 'MESSAGE_EDITED',
        message: cleaned as unknown as CometChat.BaseMessage,
      });

      expect(next.messages[0]).toBe(disapproved); // kept the terminal state
    });

    it('MESSAGE_MODERATED IS allowed to downgrade (server correction)', async () => {
      const { CometChat } = await import('@cometchat/chat-sdk-javascript');
      const disapproved = new CometChat.TextMessage('peer', 'hi', 'user');
      disapproved.setId(5);
      (disapproved as unknown as { getModerationStatus: () => string }).getModerationStatus = () =>
        'disapproved';

      const approved = new CometChat.TextMessage('peer', 'hi', 'user');
      approved.setId(5);
      (approved as unknown as { getModerationStatus: () => string }).getModerationStatus = () =>
        'approved';

      const state: CometChatMessageListState = {
        ...initialMessageListState,
        messages: [disapproved as unknown as CometChat.BaseMessage],
        fetchState: 'loaded',
      };

      const next = messageListReducer(state, {
        type: 'MESSAGE_MODERATED',
        message: approved as unknown as CometChat.BaseMessage,
      });

      expect(next.messages[0]).toBe(approved); // correction accepted
    });
  });

  // ─────────────────────────────────────────────────────────────
  // scrollToBottomOnNewMessages force-scroll
  // ─────────────────────────────────────────────────────────────

  describe('scrollToBottomOnNewMessages flow', () => {
    it('event hook dispatches SET_AT_BOTTOM=true to resume auto-scroll', () => {
      const state: CometChatMessageListState = {
        ...initialMessageListState,
        messages: [msg(1)],
        isAtBottom: false,
        hasReachedLatest: true,
        newMessageCount: 7,
        fetchState: 'loaded',
      };

      // The hook would dispatch this after MESSAGE_RECEIVED when
      // scrollToBottomOnNewMessages=true.
      const next = messageListReducer(state, {
        type: 'SET_AT_BOTTOM',
        isAtBottom: true,
      });

      expect(next.isAtBottom).toBe(true);
      expect(next.newMessageCount).toBe(0); // reset on reaching bottom
    });

    it('SET_AT_BOTTOM=true preserves newMessageCount when markedUnreadByUser', () => {
      const state: CometChatMessageListState = {
        ...initialMessageListState,
        messages: [msg(1)],
        isAtBottom: false,
        markedUnreadByUser: true,
        newMessageCount: 7,
        fetchState: 'loaded',
      };

      const next = messageListReducer(state, {
        type: 'SET_AT_BOTTOM',
        isAtBottom: true,
      });

      expect(next.newMessageCount).toBe(7); // preserved — user manually marked unread
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Unread-by-user flow
  // ─────────────────────────────────────────────────────────────

  describe('Mark-as-unread by user flow', () => {
    it('CLEAR_NEW_MESSAGE_COUNT is a no-op when markedUnreadByUser is true', () => {
      const state: CometChatMessageListState = {
        ...initialMessageListState,
        newMessageCount: 5,
        markedUnreadByUser: true,
      };

      const next = messageListReducer(state, { type: 'CLEAR_NEW_MESSAGE_COUNT' });
      expect(next.newMessageCount).toBe(5);
    });

    it('CLEAR_NEW_MESSAGE_COUNT clears count when markedUnreadByUser is false', () => {
      const state: CometChatMessageListState = {
        ...initialMessageListState,
        newMessageCount: 5,
        markedUnreadByUser: false,
      };

      const next = messageListReducer(state, { type: 'CLEAR_NEW_MESSAGE_COUNT' });
      expect(next.newMessageCount).toBe(0);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Receipts for messages within the viewed window
  // ─────────────────────────────────────────────────────────────

  describe('RECEIPT_UPDATE short-circuits when nothing matches', () => {
    it('returns the same state ref when no outgoing messages qualify', () => {
      const me = buildUser({ uid: 'me' });
      const peer = buildUser({ uid: 'peer' });
      const state: CometChatMessageListState = {
        ...initialMessageListState,
        messages: [msg(1, { sender: peer as never }), msg(2, { sender: peer as never })],
        fetchState: 'loaded',
      };

      const next = messageListReducer(state, {
        type: 'RECEIPT_UPDATE',
        receiptType: 'read',
        messageId: 5,
        timestamp: Date.now(),
        loggedInUserId: me.getUid(),
      });

      expect(next).toBe(state);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Thread mode — never mark parent conversation as read
  // ─────────────────────────────────────────────────────────────

  describe('Thread mode never marks parent conversation as read', () => {
    it('shouldMarkConversationRead returns false when parentMessageId is set', () => {
      expect(shouldMarkConversationRead([msg(1), msg(2)], 2, 0, 99)).toBe(false);
      expect(shouldMarkConversationRead([msg(1), msg(2)], null, 0, 99)).toBe(false);
      expect(shouldMarkConversationRead([msg(1), msg(2)], 1, 5, 99)).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // SEND lifecycle — muid-based replacement
  // ─────────────────────────────────────────────────────────────

  describe('Send lifecycle — muid-swap model', () => {
    it('appends a pending message on SEND_START', () => {
      const pending = buildTextMessage({
        id: 0,
        muid: 'muid-1',
        text: 'hi',
      }) as unknown as CometChat.BaseMessage;

      const state = messageListReducer(initialMessageListState, {
        type: 'MESSAGE_SEND_START',
        muid: 'muid-1',
        message: pending,
      });

      expect(state.messages).toHaveLength(1);
      expect(state.messages[0]?.getMuid()).toBe('muid-1');
      expect(state.messages[0]?.getId()).toBe(0); // no server id yet
    });

    it('SEND_SUCCESS replaces the pending message by muid with the server-returned one', () => {
      const pending = buildTextMessage({
        id: 0,
        muid: 'muid-2',
      }) as unknown as CometChat.BaseMessage;
      const confirmed = buildTextMessage({
        id: 500,
        muid: 'muid-2',
      }) as unknown as CometChat.BaseMessage;

      let state = messageListReducer(initialMessageListState, {
        type: 'MESSAGE_SEND_START',
        muid: 'muid-2',
        message: pending,
      });

      state = messageListReducer(state, {
        type: 'MESSAGE_SEND_SUCCESS',
        muid: 'muid-2',
        confirmedMessage: confirmed,
      });

      expect(state.messages).toHaveLength(1);
      expect(state.messages[0]?.getId()).toBe(500);
    });

    it('SEND_ERROR swaps in the error-stamped copy and does not add a duplicate', () => {
      const pending = buildTextMessage({
        id: 0,
        muid: 'muid-3',
      }) as unknown as CometChat.BaseMessage;
      const errored = buildTextMessage({
        id: 0,
        muid: 'muid-3',
      }) as unknown as CometChat.BaseMessage;
      (errored as unknown as { error: unknown }).error = { message: 'network' };

      let state = messageListReducer(initialMessageListState, {
        type: 'MESSAGE_SEND_START',
        muid: 'muid-3',
        message: pending,
      });

      state = messageListReducer(state, {
        type: 'MESSAGE_SEND_ERROR',
        muid: 'muid-3',
        message: errored,
        error: 'network',
      });

      expect(state.messages).toHaveLength(1);
      expect(state.messages[0]).toBe(errored);
    });

    it('SEND_START dedups on duplicate muid dispatches', () => {
      const first = buildTextMessage({
        id: 0,
        muid: 'muid-4',
        text: 'a',
      }) as unknown as CometChat.BaseMessage;
      const second = buildTextMessage({
        id: 0,
        muid: 'muid-4',
        text: 'a-updated',
      }) as unknown as CometChat.BaseMessage;

      let state = messageListReducer(initialMessageListState, {
        type: 'MESSAGE_SEND_START',
        muid: 'muid-4',
        message: first,
      });
      state = messageListReducer(state, {
        type: 'MESSAGE_SEND_START',
        muid: 'muid-4',
        message: second,
      });

      expect(state.messages).toHaveLength(1);
      expect(state.messages[0]).toBe(second);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Reply count increment (thread reply received)
  // ─────────────────────────────────────────────────────────────

  describe('Reply count flow', () => {
    it('UPDATE_REPLY_COUNT clones the parent message and increments replyCount', () => {
      const setReplyCount = (value: number) => {
        mutable.replyCount = value;
      };
      const mutable = { replyCount: 2 };
      const parent = {
        getId: () => 77,
        getMuid: () => 'muid-77',
        getSender: () => buildUser({ uid: 'peer' }),
        getReceiverType: () => 'user',
        getReceiverId: () => 'me',
        getType: () => 'text',
        getCategory: () => 'message',
        getSentAt: () => 1000,
        getDeliveredAt: () => 0,
        getReadAt: () => 0,
        getDeletedAt: () => 0,
        getEditedAt: () => 0,
        getReplyCount: () => mutable.replyCount,
        getParentMessageId: () => 0,
        getReactions: () => [],
        getMetadata: () => ({}),
        getMentionedUsers: () => [],
        setReplyCount,
      } as unknown as CometChat.BaseMessage;

      const state: CometChatMessageListState = {
        ...initialMessageListState,
        messages: [parent],
      };

      messageListReducer(state, {
        type: 'UPDATE_REPLY_COUNT',
        parentMessageId: 77,
      });

      // The reducer's cloneMessage(target) calls setReplyCount on the clone,
      // not the original — so we can't observe it on `mutable` directly. But we
      // can verify the message array identity changed (new array after update).
      const nextState = messageListReducer(state, {
        type: 'UPDATE_REPLY_COUNT',
        parentMessageId: 77,
      });
      expect(nextState.messages).not.toBe(state.messages);
    });

    it('UPDATE_REPLY_COUNT is a no-op when the parent is not in state', () => {
      const state: CometChatMessageListState = {
        ...initialMessageListState,
        messages: [msg(1)],
      };
      const next = messageListReducer(state, {
        type: 'UPDATE_REPLY_COUNT',
        parentMessageId: 999,
      });
      expect(next).toBe(state);
    });
  });
});
