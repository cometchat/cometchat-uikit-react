/**
 * Unit tests for useCometChatConversationsEvents: each UI / SDK event maps to
 * the right reducer action, conversations are fetched where the event only
 * carries a message, and events that must not touch the list are ignored.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  handler: undefined as ((event: unknown) => void) | undefined,
  getConversationFromMessage: vi.fn(),
  getConversation: vi.fn(),
  shouldUpdate: vi.fn(() => true),
}));

vi.mock('../../../hooks/useCometChatEvents', () => ({
  useCometChatEvents: (handler: (event: unknown) => void) => {
    mocks.handler = handler;
  },
}));

vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
    getConversation: mocks.getConversation,
    CometChatHelper: { getConversationFromMessage: mocks.getConversationFromMessage },
  },
}));

vi.mock('../CometChatConversationsManager', () => ({
  CometChatConversationsManager: { shouldLastMessageAndUnreadCountBeUpdated: mocks.shouldUpdate },
}));

import { useCometChatConversationsEvents } from '../useCometChatConversationsEvents';
import { CometChatMessageStatus } from '../../../context/CometChatEvents.types';

function fakeConversation(id: string, unread = 4, withUid?: string) {
  const c = {
    unread,
    getConversationId: () => id,
    setUnreadMessageCount: (n: number) => {
      c.unread = n;
    },
    getConversationWith: () => (withUid ? { getUid: () => withUid } : { getGuid: () => 'g' }),
  };
  return c;
}

const group = (guid: string) => ({ getGuid: () => guid });
const user = (uid: string) => ({ getUid: () => uid });
const message = { id: 'm1' };

describe('useCometChatConversationsEvents', () => {
  let dispatch: ReturnType<typeof vi.fn>;
  let conversations: ReturnType<typeof fakeConversation>[];

  function mount() {
    renderHook(() =>
      useCometChatConversationsEvents({
        dispatch,
        conversationsRef: { current: conversations } as never,
        loggedInUserId: 'me',
      })
    );
  }

  const emit = (event: Record<string, unknown>) => mocks.handler!(event);

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.shouldUpdate.mockReturnValue(true);
    dispatch = vi.fn();
    conversations = [];
    mount();
  });

  describe('message events', () => {
    it('a successful send moves the conversation to the top with no unread count', async () => {
      const conv = fakeConversation('user_bob');
      mocks.getConversationFromMessage.mockResolvedValue(conv);
      emit({ type: 'ui:message/sent', status: CometChatMessageStatus.success, message });
      await waitFor(() => expect(dispatch).toHaveBeenCalledWith({ type: 'MOVE_TO_TOP', conversation: conv }));
      expect(conv.unread).toBe(0);
    });

    it('an in-progress send, or one that should not update the list, is ignored', () => {
      emit({ type: 'ui:message/sent', status: CometChatMessageStatus.inprogress, message });
      mocks.shouldUpdate.mockReturnValue(false);
      emit({ type: 'ui:message/sent', status: CometChatMessageStatus.success, message });
      expect(mocks.getConversationFromMessage).not.toHaveBeenCalled();
    });

    it('a successful edit and a delete refresh the conversation; a failed edit does not', async () => {
      const conv = fakeConversation('user_bob');
      mocks.getConversationFromMessage.mockResolvedValue(conv);
      emit({ type: 'ui:compose/edit', status: CometChatMessageStatus.error, message });
      expect(mocks.getConversationFromMessage).not.toHaveBeenCalled();

      emit({ type: 'ui:compose/edit', status: CometChatMessageStatus.success, message });
      emit({ type: 'ui:message/deleted', message });
      await waitFor(() => expect(dispatch).toHaveBeenCalledTimes(2));
      expect(dispatch).toHaveBeenCalledWith({ type: 'UPDATE_CONVERSATION', conversation: conv });
    });

    it('reading a message clears that conversation’s unread count', async () => {
      const conv = fakeConversation('user_bob', 7);
      mocks.getConversationFromMessage.mockResolvedValue(conv);
      emit({ type: 'ui:message/read', message });
      await waitFor(() => expect(dispatch).toHaveBeenCalledWith({ type: 'UPDATE_CONVERSATION', conversation: conv }));
      expect(conv.unread).toBe(0);
    });

    it('a failed conversation lookup is swallowed', async () => {
      mocks.getConversationFromMessage.mockRejectedValue(new Error('offline'));
      for (const type of ['ui:message/sent', 'ui:compose/edit', 'ui:message/deleted', 'ui:message/read', 'ui:call/accepted', 'call/incoming']) {
        emit({ type, status: CometChatMessageStatus.success, message, call: message });
      }
      emit({ type: 'ui:call/ended', call: message });
      await waitFor(() => expect(mocks.getConversationFromMessage).toHaveBeenCalledTimes(7));
      expect(dispatch).not.toHaveBeenCalled();
    });
  });

  describe('conversation events', () => {
    it.each(['conversation/pinned', 'conversation/unpinned', 'ui:conversation/pin-changed'])('%s updates the pin state', type => {
      const conv = fakeConversation('user_bob');
      emit({ type, conversation: conv });
      expect(dispatch).toHaveBeenCalledWith({ type: 'CONVERSATION_PIN_CHANGED', conversation: conv });
    });

    it('updated, read and deleted map to update, reset unread and remove', () => {
      const conv = fakeConversation('user_bob');
      emit({ type: 'ui:conversation/updated', conversation: conv });
      emit({ type: 'ui:conversation/read', conversationId: 'user_bob' });
      emit({ type: 'ui:conversation/deleted', conversation: conv });
      expect(dispatch.mock.calls.map(c => c[0])).toEqual([
        { type: 'UPDATE_CONVERSATION', conversation: conv },
        { type: 'RESET_UNREAD_COUNT', conversationId: 'user_bob' },
        { type: 'REMOVE_CONVERSATION', conversationId: 'user_bob' },
      ]);
    });

    it('switching the active chat changes nothing', () => {
      emit({ type: 'ui:active-chat/changed' });
      emit({ type: 'some/unknown-event' });
      expect(dispatch).not.toHaveBeenCalled();
    });
  });

  describe('group events', () => {
    it('a created group is fetched and added; a joined group is fetched and moved up', async () => {
      const conv = fakeConversation('group_g1');
      mocks.getConversation.mockResolvedValue(conv);
      emit({ type: 'ui:group/created', group: group('g1') });
      emit({ type: 'ui:group/member-joined', joinedGroup: group('g1') });
      await waitFor(() => expect(dispatch).toHaveBeenCalledTimes(2));
      expect(mocks.getConversation).toHaveBeenCalledWith('g1', 'group');
      expect(dispatch).toHaveBeenCalledWith({ type: 'ADD_CONVERSATION', conversation: conv });
      expect(dispatch).toHaveBeenCalledWith({ type: 'MOVE_TO_TOP', conversation: conv });
    });

    it('a failed group lookup is swallowed', async () => {
      mocks.getConversation.mockRejectedValue(new Error('gone'));
      emit({ type: 'ui:group/created', group: group('g1') });
      emit({ type: 'ui:group/member-joined', joinedGroup: group('g1') });
      await waitFor(() => expect(mocks.getConversation).toHaveBeenCalledTimes(2));
      expect(dispatch).not.toHaveBeenCalled();
    });

    it.each(['ui:group/deleted', 'ui:group/left'])('%s removes the group conversation', type => {
      emit({ type, group: group('g1') });
      expect(dispatch).toHaveBeenCalledWith({ type: 'REMOVE_CONVERSATION', conversationId: 'group_g1' });
    });

    it('member changes put the action message on top as the last message', () => {
      const g = group('g1');
      const action = (m: unknown) => ({ type: 'UPDATE_LAST_MESSAGE_AND_PLACE_AT_TOP', message: m, group: g });
      emit({ type: 'ui:group/member-added', group: g, messages: ['first', 'last'] });
      emit({ type: 'ui:group/member-added', group: g, messages: [] });
      emit({ type: 'ui:group/member-kicked', group: g, message: 'kicked' });
      emit({ type: 'ui:group/member-banned', group: g, message: 'banned' });
      emit({ type: 'ui:group/member-unbanned', group: g, message: 'unbanned' });
      emit({ type: 'ui:group/member-unbanned', group: g });
      emit({ type: 'ui:group/member-scope-changed', group: g, message: 'scope' });
      expect(dispatch.mock.calls.map(c => c[0])).toEqual([
        action('last'),
        action('kicked'),
        action('banned'),
        action('unbanned'),
        action('scope'),
      ]);
    });
  });

  describe('user events', () => {
    it('blocking a user removes their conversation', () => {
      emit({ type: 'ui:user/blocked', user: user('bob') });
      expect(dispatch).toHaveBeenCalledWith({ type: 'REMOVE_CONVERSATION', conversationId: 'user_bob' });
    });

    it('unblocking refreshes their conversation if it is listed', () => {
      const bob = fakeConversation('user_bob', 0, 'bob');
      conversations.push(fakeConversation('group_g'), bob);
      emit({ type: 'ui:user/unblocked', user: user('bob') });
      emit({ type: 'ui:user/unblocked', user: user('stranger') });
      expect(dispatch.mock.calls).toEqual([[{ type: 'UPDATE_CONVERSATION', conversation: bob }]]);
    });
  });

  describe('call events', () => {
    it.each(['ui:call/outgoing', 'ui:call/accepted', 'ui:call/rejected', 'ui:call/ended'])('%s moves the conversation to the top', async type => {
      const conv = fakeConversation('user_bob');
      mocks.getConversationFromMessage.mockResolvedValue(conv);
      emit({ type, call: message });
      await waitFor(() => expect(dispatch).toHaveBeenCalledWith({ type: 'MOVE_TO_TOP', conversation: conv }));
    });

    it('a local call end without a call object is ignored', () => {
      emit({ type: 'ui:call/ended' });
      expect(mocks.getConversationFromMessage).not.toHaveBeenCalled();
    });

    it.each(['call/incoming', 'call/accepted', 'call/rejected', 'call/cancelled', 'call/ended'])(
      'realtime %s moves the conversation up unless it should not update the list',
      async type => {
        const conv = fakeConversation('user_bob');
        mocks.getConversationFromMessage.mockResolvedValue(conv);
        mocks.shouldUpdate.mockReturnValueOnce(false);
        emit({ type, call: message });
        expect(mocks.getConversationFromMessage).not.toHaveBeenCalled();

        emit({ type, call: message });
        await waitFor(() => expect(dispatch).toHaveBeenCalledWith({ type: 'MOVE_TO_TOP', conversation: conv }));
      }
    );
  });

  describe('typing', () => {
    const indicator = (senderUid: string | undefined, receiverType: string, receiverId: string) => ({
      getSender: () => (senderUid === undefined ? undefined : user(senderUid)),
      getReceiverType: () => receiverType,
      getReceiverId: () => receiverId,
    });

    it('keys group typing by group id and 1:1 typing by the sender', () => {
      const inGroup = indicator('bob', 'group', 'g1');
      const direct = indicator('bob', 'user', 'me');
      emit({ type: 'typing/started', indicator: inGroup });
      emit({ type: 'typing/started', indicator: direct });
      emit({ type: 'typing/ended', indicator: inGroup });
      emit({ type: 'typing/ended', indicator: direct });
      expect(dispatch.mock.calls.map(c => c[0])).toEqual([
        { type: 'ADD_TYPING_INDICATOR', id: 'g1', indicator: inGroup },
        { type: 'ADD_TYPING_INDICATOR', id: 'bob', indicator: direct },
        { type: 'REMOVE_TYPING_INDICATOR', id: 'g1' },
        { type: 'REMOVE_TYPING_INDICATOR', id: 'bob' },
      ]);
    });

    it('ignores my own typing and indicators with no usable id', () => {
      for (const type of ['typing/started', 'typing/ended']) {
        emit({ type, indicator: indicator('me', 'group', 'g1') });
        emit({ type, indicator: indicator(undefined, 'user', 'me') });
      }
      expect(dispatch).not.toHaveBeenCalled();
    });
  });
});
