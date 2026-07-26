/**
 * Tests for useMessageListEvents.
 *
 * Drives the hook by emitting fake SDK events via a mocked CometChatEvents context,
 * then asserts the reducer actions dispatched in response.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { CometChatEventsContext } from '../../../context/CometChatEventsContext';
import type { CometChatSDKEvent } from '../../../context/CometChatEvents.types';
import { CometChatMessageStatus } from '../../../context/CometChatEvents.types';

vi.mock('../CometChatMessageList.sound', () => ({
  playIncomingSound: vi.fn(),
}));

import { playIncomingSound } from '../CometChatMessageList.sound';
import { useMessageListEvents } from '../useMessageListEvents';
import type { MessageListRefs } from '../messageListRefs';
import type {
  CometChatMessageListAction,
  CometChatMessageListState,
  CometChatUseMessageListOptions,
} from '../CometChatMessageList.types';
import { initialMessageListState } from '../CometChatMessageList.types';
import { buildUser, buildGroup, buildTextMessage } from '../../../testing/mock-builders';

// --- Test harness ---

function makeRefs(
  initialState: CometChatMessageListState = initialMessageListState,
  options: Partial<CometChatUseMessageListOptions> = {}
) {
  const manager = {
    markAsRead: vi.fn().mockResolvedValue(undefined),
    markConversationAsRead: vi.fn().mockResolvedValue(undefined),
  };
  const loggedInUser = options.loggedInUser ?? (buildUser({ uid: 'me' }) as never);
  const refs: MessageListRefs = {
    generationRef: { current: 0 },
    managerRef: { current: manager as never },
    isFetchingPrevRef: { current: false },
    isFetchingNextRef: { current: false },
    lastUnreadMarkedIdRef: { current: '' },
    groupRef: { current: undefined },
    stateRef: { current: initialState },
    optionsRef: {
      current: {
        loggedInUser,
        ...options,
      } as CometChatUseMessageListOptions,
    },
    initializeRef: { current: null },
  };
  return { refs, manager };
}

type Emit = (event: CometChatSDKEvent) => void;

function setup(
  options: Parameters<typeof useMessageListEvents>[0],
  refs: MessageListRefs
): { emit: Emit; dispatched: CometChatMessageListAction[] } {
  const handlers = new Set<(event: CometChatSDKEvent) => void>();
  const bridge = {
    subscribe: (handler: (event: CometChatSDKEvent) => void) => {
      handlers.add(handler);
      return () => {
        handlers.delete(handler);
      };
    },
    publish: () => {
      /* noop in tests */
    },
  };

  const dispatched: CometChatMessageListAction[] = [];
  const emit: Emit = event => {
    handlers.forEach(h => h(event));
  };

  renderHook(
    () => {
      useMessageListEvents(options, refs, a => dispatched.push(a));
    },
    {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <CometChatEventsContext.Provider value={bridge}>{children}</CometChatEventsContext.Provider>
      ),
    }
  );

  return { emit, dispatched };
}

function baseOptions(
  overrides: Partial<Parameters<typeof useMessageListEvents>[0]>
): Parameters<typeof useMessageListEvents>[0] {
  return {
    user: undefined,
    group: undefined,
    loggedInUser: buildUser({ uid: 'me' }) as never,
    messagesRequestBuilder: undefined,
    parentMessageId: undefined,
    messageTypes: ['text'],
    messageCategories: ['message'],
    disableSoundForMessages: false,
    customSoundForMessages: undefined,
    scrollToBottomOnNewMessages: false,
    hideReceipts: false,
    ...overrides,
  } as Parameters<typeof useMessageListEvents>[0];
}

describe('useMessageListEvents', () => {
  const me = buildUser({ uid: 'me' });
  const peer = buildUser({ uid: 'peer' });
  const user = buildUser({ uid: 'peer' });
  const group = buildGroup({ guid: 'room' });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Received messages
  // ---------------------------------------------------------------------------

  it('dispatches MESSAGE_RECEIVED + markAsRead when at bottom and hasReachedLatest', () => {
    const { refs, manager } = makeRefs({
      ...initialMessageListState,
      hasReachedLatest: true,
      isAtBottom: true,
    });
    const msg = Object.assign(buildTextMessage({ id: 10, sender: peer as never }), {
      setReadAt: vi.fn(),
    });

    const { emit, dispatched } = setup(
      baseOptions({ user: user as never, loggedInUser: me as never }),
      refs
    );

    act(() => {
      emit({ type: 'message/text-received', message: msg as never });
    });

    expect(dispatched.some(a => a.type === 'MESSAGE_RECEIVED')).toBe(true);
    expect(manager.markAsRead).toHaveBeenCalledWith(msg);
    expect(playIncomingSound).toHaveBeenCalled();
  });

  it('does not mark as read when scrolled up', () => {
    const { refs, manager } = makeRefs({
      ...initialMessageListState,
      hasReachedLatest: true,
      isAtBottom: false,
    });
    const msg = Object.assign(buildTextMessage({ id: 10, sender: peer as never }), {
      setReadAt: vi.fn(),
    });

    const { emit } = setup(baseOptions({ user: user as never, loggedInUser: me as never }), refs);

    act(() => {
      emit({ type: 'message/text-received', message: msg as never });
    });

    expect(manager.markAsRead).not.toHaveBeenCalled();
  });

  it('skips sound when disableSoundForMessages is true', () => {
    const { refs } = makeRefs({
      ...initialMessageListState,
      hasReachedLatest: true,
      isAtBottom: true,
    });
    const msg = Object.assign(buildTextMessage({ id: 10, sender: peer as never }), {
      setReadAt: vi.fn(),
    });

    const { emit } = setup(
      baseOptions({
        user: user as never,
        loggedInUser: me as never,
        disableSoundForMessages: true,
      }),
      refs
    );

    act(() => {
      emit({ type: 'message/text-received', message: msg as never });
    });

    expect(playIncomingSound).not.toHaveBeenCalled();
  });

  it('ignores messages for a different conversation', () => {
    const { refs } = makeRefs({ ...initialMessageListState });
    const msg = Object.assign(
      buildTextMessage({
        id: 1,
        sender: buildUser({ uid: 'someone-else' }) as never,
        receiverId: 'different-peer',
      }),
      { setReadAt: vi.fn() }
    );

    const { emit, dispatched } = setup(
      baseOptions({ user: user as never, loggedInUser: me as never }),
      refs
    );

    act(() => {
      emit({ type: 'message/text-received', message: msg as never });
    });

    expect(dispatched).toHaveLength(0);
  });

  it('treats messages from logged-in user on another tab as own-from-elsewhere', () => {
    const { refs, manager } = makeRefs({
      ...initialMessageListState,
      hasReachedLatest: true,
      isAtBottom: true,
      markedUnreadByUser: true,
    });
    // Message from the logged-in user, new id (not in messages), receiverId matches the peer
    const msg = Object.assign(
      buildTextMessage({ id: 10, sender: me as never, receiverId: 'peer' }),
      { setReadAt: vi.fn() }
    );

    const { emit, dispatched } = setup(
      baseOptions({ user: user as never, loggedInUser: me as never }),
      refs
    );

    act(() => {
      emit({ type: 'message/text-received', message: msg as never });
    });

    // Own message from elsewhere clears the markedUnreadByUser state
    expect(dispatched.some(a => a.type === 'SET_MARKED_UNREAD_BY_USER')).toBe(true);
    expect(dispatched.some(a => a.type === 'SET_CONVERSATION_READ')).toBe(true);
    expect(manager.markConversationAsRead).toHaveBeenCalled();
  });

  it('dispatches UPDATE_REPLY_COUNT for thread replies in non-thread mode', () => {
    const { refs } = makeRefs();
    const threadReply = Object.assign(
      buildTextMessage({
        id: 99,
        sender: peer as never,
        receiverId: 'peer',
        parentMessageId: 5,
      }),
      { setReadAt: vi.fn() }
    );

    const { emit, dispatched } = setup(
      baseOptions({ user: user as never, loggedInUser: me as never }),
      refs
    );

    act(() => {
      emit({ type: 'message/text-received', message: threadReply as never });
    });

    const updateReply = dispatched.find(a => a.type === 'UPDATE_REPLY_COUNT');
    expect(updateReply).toMatchObject({ parentMessageId: 5 });
  });

  // ---------------------------------------------------------------------------
  // Errored / rejected sends are scoped to their own list (main vs. thread)
  // ---------------------------------------------------------------------------

  it('does NOT dispatch MESSAGE_SEND_ERROR for a thread reply in the main list', () => {
    // A media message rejected inside a thread (parentMessageId set) must not
    // leak its error into the main list, which has no parentMessageId.
    const { refs } = makeRefs();
    const rejected = buildTextMessage({
      id: 42,
      sender: me as never,
      receiverId: 'peer',
      parentMessageId: 5,
      muid: 'muid-42',
    });

    const { emit, dispatched } = setup(
      baseOptions({ user: user as never, loggedInUser: me as never }),
      refs
    );

    act(() => {
      emit({
        type: 'ui:message/sent',
        message: rejected as never,
        status: CometChatMessageStatus.error,
      });
    });

    expect(dispatched.some(a => a.type === 'MESSAGE_SEND_ERROR')).toBe(false);
  });

  it('dispatches MESSAGE_SEND_ERROR for a thread reply in its own thread list', () => {
    const { refs } = makeRefs();
    const rejected = buildTextMessage({
      id: 42,
      sender: me as never,
      receiverId: 'peer',
      parentMessageId: 5,
      muid: 'muid-42',
    });

    const { emit, dispatched } = setup(
      baseOptions({ user: user as never, loggedInUser: me as never, parentMessageId: 5 }),
      refs
    );

    act(() => {
      emit({
        type: 'ui:message/sent',
        message: rejected as never,
        status: CometChatMessageStatus.error,
      });
    });

    const err = dispatched.find(a => a.type === 'MESSAGE_SEND_ERROR');
    expect(err).toMatchObject({ muid: 'muid-42' });
  });

  it('dispatches MESSAGE_SEND_ERROR for a non-thread message in the main list', () => {
    // A normal (non-thread) errored send still surfaces in the main list, even
    // if receiverId were cleared on failure — we only scope by parentMessageId.
    const { refs } = makeRefs();
    const rejected = buildTextMessage({
      id: 43,
      sender: me as never,
      receiverId: 'peer',
      muid: 'muid-43',
    });

    const { emit, dispatched } = setup(
      baseOptions({ user: user as never, loggedInUser: me as never }),
      refs
    );

    act(() => {
      emit({
        type: 'ui:message/sent',
        message: rejected as never,
        status: CometChatMessageStatus.error,
      });
    });

    const err = dispatched.find(a => a.type === 'MESSAGE_SEND_ERROR');
    expect(err).toMatchObject({ muid: 'muid-43' });
  });

  // ---------------------------------------------------------------------------
  // Message edited / deleted / moderated
  // ---------------------------------------------------------------------------

  it('dispatches MESSAGE_EDITED for messages in this conversation', () => {
    const { refs } = makeRefs();
    const msg = buildTextMessage({
      id: 10,
      sender: peer as never,
      receiverId: 'peer',
    });

    const { emit, dispatched } = setup(
      baseOptions({ user: user as never, loggedInUser: me as never }),
      refs
    );

    act(() => {
      emit({ type: 'message/edited', message: msg as never });
    });

    expect(dispatched.some(a => a.type === 'MESSAGE_EDITED')).toBe(true);
  });

  it('dispatches MESSAGE_DELETED and invokes onMessageDeleted callback', () => {
    const { refs } = makeRefs();
    const onMessageDeleted = vi.fn();
    const msg = buildTextMessage({
      id: 10,
      sender: peer as never,
      receiverId: 'peer',
    });

    const refsWithOpts = {
      ...refs,
      optionsRef: {
        current: {
          loggedInUser: me as never,
          onMessageDeleted,
        } as CometChatUseMessageListOptions,
      },
    };

    const { emit, dispatched } = setup(
      baseOptions({ user: user as never, loggedInUser: me as never }),
      refsWithOpts
    );

    act(() => {
      emit({ type: 'message/deleted', message: msg as never });
    });

    expect(dispatched.some(a => a.type === 'MESSAGE_DELETED')).toBe(true);
    expect(onMessageDeleted).toHaveBeenCalledWith(msg);
  });

  it('dispatches MESSAGE_MODERATED for the matching conversation', () => {
    const { refs } = makeRefs();
    const msg = buildTextMessage({
      id: 10,
      sender: peer as never,
      receiverId: 'peer',
    });

    const { emit, dispatched } = setup(
      baseOptions({ user: user as never, loggedInUser: me as never }),
      refs
    );

    act(() => {
      emit({ type: 'message/moderated', message: msg as never });
    });

    expect(dispatched.some(a => a.type === 'MESSAGE_MODERATED')).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // Receipts
  // ---------------------------------------------------------------------------

  it('skips receipts when hideReceipts is true', () => {
    const { refs } = makeRefs();
    const { emit, dispatched } = setup(
      baseOptions({ user: user as never, loggedInUser: me as never, hideReceipts: true }),
      refs
    );

    const receipt = {
      getMessageId: () => '10',
      getReceiver: () => 'me',
      getReceiverType: () => 'user',
      getSender: () => peer,
      getDeliveredAt: () => 1,
      getReadAt: () => 0,
    };

    act(() => {
      emit({ type: 'receipt/delivered', receipt } as never);
    });

    expect(dispatched).toHaveLength(0);
  });

  it('dispatches RECEIPT_UPDATE for 1:1 delivered receipts', () => {
    const { refs } = makeRefs();
    const receipt = {
      getMessageId: () => '10',
      getReceiver: () => 'me',
      getReceiverType: () => 'user',
      getSender: () => peer,
      getDeliveredAt: () => 1234,
      getReadAt: () => 0,
    };

    const { emit, dispatched } = setup(
      baseOptions({ user: user as never, loggedInUser: me as never }),
      refs
    );

    act(() => {
      emit({ type: 'receipt/delivered', receipt } as never);
    });

    const receiptAction = dispatched.find(a => a.type === 'RECEIPT_UPDATE');
    expect(receiptAction).toMatchObject({ receiptType: 'delivered', messageId: 10 });
  });

  it('dispatches RECEIPT_UPDATE for group read-by-all receipts', () => {
    const { refs } = makeRefs();
    const receipt = {
      getMessageId: () => '20',
      getReceiver: () => group,
      getReceiverType: () => 'group',
      getSender: () => peer,
      getDeliveredAt: () => 0,
      getReadAt: () => 5555,
    };

    const { emit, dispatched } = setup(
      baseOptions({ group: group as never, loggedInUser: me as never }),
      refs
    );

    act(() => {
      emit({ type: 'receipt/read-by-all', receipt } as never);
    });

    const receiptAction = dispatched.find(a => a.type === 'RECEIPT_UPDATE');
    expect(receiptAction).toMatchObject({ receiptType: 'read', messageId: 20 });
  });

  it('ignores per-user receipts in a group chat', () => {
    const { refs } = makeRefs();
    const receipt = {
      getMessageId: () => '20',
      getReceiver: () => 'me',
      getReceiverType: () => 'user',
      getSender: () => peer,
      getDeliveredAt: () => 1,
      getReadAt: () => 0,
    };

    const { emit, dispatched } = setup(
      baseOptions({ group: group as never, loggedInUser: me as never }),
      refs
    );

    act(() => {
      emit({ type: 'receipt/delivered', receipt } as never);
    });

    expect(dispatched).toHaveLength(0);
  });

  it('ignores broadcast receipts in a 1:1 chat', () => {
    const { refs } = makeRefs();
    const receipt = {
      getMessageId: () => '20',
      getReceiver: () => group,
      getReceiverType: () => 'group',
      getSender: () => peer,
      getDeliveredAt: () => 1,
      getReadAt: () => 0,
    };

    const { emit, dispatched } = setup(
      baseOptions({ user: user as never, loggedInUser: me as never }),
      refs
    );

    act(() => {
      emit({ type: 'receipt/read-by-all', receipt } as never);
    });

    expect(dispatched).toHaveLength(0);
  });

  // ---------------------------------------------------------------------------
  // Group member events
  // ---------------------------------------------------------------------------

  it('dispatches MESSAGE_RECEIVED + UPDATE_GROUP_REFERENCE on member-joined', () => {
    const { refs } = makeRefs();
    const actionMsg = buildTextMessage({ id: 100 });

    const { emit, dispatched } = setup(
      baseOptions({ group: group as never, loggedInUser: me as never }),
      refs
    );

    act(() => {
      emit({
        type: 'group/member-joined',
        action: actionMsg,
        joinedGroup: group,
      } as never);
    });

    const types = dispatched.map(a => a.type);
    expect(types).toContain('UPDATE_GROUP_REFERENCE');
    expect(types).toContain('MESSAGE_RECEIVED');
  });

  // ---------------------------------------------------------------------------
  // Reactions
  // ---------------------------------------------------------------------------

  it('ignores reactions for unknown messages', () => {
    const { refs } = makeRefs();
    const reactionEvent = {
      getReceiverId: () => 'peer',
      getReceiverType: () => 'user',
      getParentMessageId: () => 0,
      getReaction: () => ({
        getReactedBy: () => peer,
        getMessageId: () => 999,
      }),
    };

    const { emit, dispatched } = setup(
      baseOptions({ user: user as never, loggedInUser: me as never }),
      refs
    );

    act(() => {
      emit({ type: 'reaction/added', event: reactionEvent } as never);
    });

    // The reaction is for conversation but messageId doesn't exist in state, so no REACTION_UPDATE
    expect(dispatched.some(a => a.type === 'REACTION_UPDATE')).toBe(false);
  });

  it('dispatches REACTION_UPDATE when the reacted message is in state', async () => {
    // Use the SDK helper to produce an updated message — the hook calls
    // CometChatHelper.updateMessageWithReactionInfo. We assert the helper was
    // invoked and the dispatched update references a message object.
    const { CometChat } = await import('@cometchat/chat-sdk-javascript');
    const helperSpy = vi
      .spyOn(CometChat.CometChatHelper, 'updateMessageWithReactionInfo')
      .mockImplementation((msg: never) => msg);

    const existing = buildTextMessage({ id: 77 });
    const { refs } = makeRefs({
      ...initialMessageListState,
      messages: [existing as never],
    });
    const reactionEvent = {
      getReceiverId: () => 'peer',
      getReceiverType: () => 'user',
      getParentMessageId: () => 0,
      getReaction: () => ({
        getReactedBy: () => peer,
        getMessageId: () => 77,
      }),
    };

    const { emit, dispatched } = setup(
      baseOptions({ user: user as never, loggedInUser: me as never }),
      refs
    );

    act(() => {
      emit({ type: 'reaction/added', event: reactionEvent } as never);
    });

    expect(helperSpy).toHaveBeenCalled();
    const reactionUpdate = dispatched.find(a => a.type === 'REACTION_UPDATE');
    expect(reactionUpdate).toMatchObject({ messageId: 77 });

    helperSpy.mockRestore();
  });

  it('dispatches REACTION_UPDATE with REACTION_REMOVED for reaction/removed events', async () => {
    const { CometChat } = await import('@cometchat/chat-sdk-javascript');
    const helperSpy = vi
      .spyOn(CometChat.CometChatHelper, 'updateMessageWithReactionInfo')
      .mockImplementation((msg: never) => msg);

    const existing = buildTextMessage({ id: 77 });
    const { refs } = makeRefs({
      ...initialMessageListState,
      messages: [existing as never],
    });
    const reactionEvent = {
      getReceiverId: () => 'peer',
      getReceiverType: () => 'user',
      getParentMessageId: () => 0,
      getReaction: () => ({
        getReactedBy: () => peer,
        getMessageId: () => '77', // string path
      }),
    };

    const { emit, dispatched } = setup(
      baseOptions({ user: user as never, loggedInUser: me as never }),
      refs
    );

    act(() => {
      emit({ type: 'reaction/removed', event: reactionEvent } as never);
    });

    expect(helperSpy).toHaveBeenCalledWith(
      existing,
      expect.anything(),
      CometChat.REACTION_ACTION.REACTION_REMOVED
    );
    expect(dispatched.some(a => a.type === 'REACTION_UPDATE')).toBe(true);

    helperSpy.mockRestore();
  });

  // ---------------------------------------------------------------------------
  // Other received-message types (media / custom / interactive)
  // ---------------------------------------------------------------------------

  it('handles message/media-received events', () => {
    const { refs } = makeRefs({
      ...initialMessageListState,
      hasReachedLatest: true,
      isAtBottom: true,
    });
    const msg = Object.assign(buildTextMessage({ id: 10, sender: peer as never }), {
      setReadAt: vi.fn(),
    });

    const { emit, dispatched } = setup(
      baseOptions({ user: user as never, loggedInUser: me as never }),
      refs
    );

    act(() => {
      emit({ type: 'message/media-received', message: msg as never });
    });

    expect(dispatched.some(a => a.type === 'MESSAGE_RECEIVED')).toBe(true);
  });

  it('handles message/custom-received events', () => {
    const { refs } = makeRefs({
      ...initialMessageListState,
      hasReachedLatest: true,
      isAtBottom: true,
    });
    const msg = Object.assign(buildTextMessage({ id: 10, sender: peer as never }), {
      setReadAt: vi.fn(),
    });

    const { emit, dispatched } = setup(
      baseOptions({ user: user as never, loggedInUser: me as never }),
      refs
    );

    act(() => {
      emit({ type: 'message/custom-received', message: msg as never });
    });

    expect(dispatched.some(a => a.type === 'MESSAGE_RECEIVED')).toBe(true);
  });

  it('handles message/interactive-received events', () => {
    const { refs } = makeRefs({
      ...initialMessageListState,
      hasReachedLatest: true,
      isAtBottom: true,
    });
    const msg = Object.assign(buildTextMessage({ id: 10, sender: peer as never }), {
      setReadAt: vi.fn(),
    });

    const { emit, dispatched } = setup(
      baseOptions({ user: user as never, loggedInUser: me as never }),
      refs
    );

    act(() => {
      emit({ type: 'message/interactive-received', message: msg as never });
    });

    expect(dispatched.some(a => a.type === 'MESSAGE_RECEIVED')).toBe(true);
  });

  it('forces SET_AT_BOTTOM when scrollToBottomOnNewMessages is true', () => {
    const { refs } = makeRefs({
      ...initialMessageListState,
      hasReachedLatest: true,
      isAtBottom: false,
    });
    const msg = Object.assign(buildTextMessage({ id: 10, sender: peer as never }), {
      setReadAt: vi.fn(),
    });

    const { emit, dispatched } = setup(
      baseOptions({
        user: user as never,
        loggedInUser: me as never,
        scrollToBottomOnNewMessages: true,
      }),
      refs
    );

    act(() => {
      emit({ type: 'message/text-received', message: msg as never });
    });

    const setAtBottom = dispatched.find(a => a.type === 'SET_AT_BOTTOM');
    expect(setAtBottom).toMatchObject({ isAtBottom: true });
  });

  // ---------------------------------------------------------------------------
  // Group events — remaining variants
  // ---------------------------------------------------------------------------

  const groupEventVariants: {
    type:
      | 'group/member-left'
      | 'group/member-kicked'
      | 'group/member-banned'
      | 'group/member-unbanned'
      | 'group/member-added'
      | 'group/member-scope-changed';
    groupKey:
      | 'leftGroup'
      | 'kickedFrom'
      | 'bannedFrom'
      | 'unbannedFrom'
      | 'addedTo'
      | 'changedGroup';
  }[] = [
    { type: 'group/member-left', groupKey: 'leftGroup' },
    { type: 'group/member-kicked', groupKey: 'kickedFrom' },
    { type: 'group/member-banned', groupKey: 'bannedFrom' },
    { type: 'group/member-unbanned', groupKey: 'unbannedFrom' },
    { type: 'group/member-added', groupKey: 'addedTo' },
    { type: 'group/member-scope-changed', groupKey: 'changedGroup' },
  ];

  for (const variant of groupEventVariants) {
    it(`handles ${variant.type} events`, () => {
      const { refs } = makeRefs();
      const actionMsg = buildTextMessage({ id: 100 });

      const { emit, dispatched } = setup(
        baseOptions({ group: group as never, loggedInUser: me as never }),
        refs
      );

      act(() => {
        emit({
          type: variant.type,
          action: actionMsg,
          [variant.groupKey]: group,
        } as never);
      });

      const types = dispatched.map(a => a.type);
      expect(types).toContain('UPDATE_GROUP_REFERENCE');
      expect(types).toContain('MESSAGE_RECEIVED');
    });
  }

  it('ignores group events for a different group', () => {
    const { refs } = makeRefs();
    const otherGroup = buildGroup({ guid: 'other-room' });
    const actionMsg = buildTextMessage({ id: 100 });

    const { emit, dispatched } = setup(
      baseOptions({ group: group as never, loggedInUser: me as never }),
      refs
    );

    act(() => {
      emit({
        type: 'group/member-joined',
        action: actionMsg,
        joinedGroup: otherGroup,
      } as never);
    });

    expect(dispatched).toHaveLength(0);
  });

  // ---------------------------------------------------------------------------
  // Connection recovery
  // ---------------------------------------------------------------------------

  it('connection/connected with no messages triggers a full re-init', () => {
    const { refs, manager } = makeRefs();
    refs.initializeRef.current = vi.fn();
    // Attach a fetchNext + initNextRequest to the manager so the hook can
    // route through the recovery branch, though the "no messages" branch
    // skips it entirely.
    (manager as Record<string, unknown>).fetchNext = vi.fn().mockResolvedValue([]);
    (manager as Record<string, unknown>).initNextRequest = vi.fn();

    const { emit, dispatched } = setup(
      baseOptions({ user: user as never, loggedInUser: me as never }),
      refs
    );

    act(() => {
      emit({ type: 'connection/connected' } as never);
    });

    expect(dispatched.some(a => a.type === 'RESET')).toBe(true);
    expect(refs.initializeRef.current).toHaveBeenCalled();
  });

  it('connection/connected with existing messages fetches newer via fetchNext', async () => {
    const existing = buildTextMessage({ id: 5 });
    const { refs, manager } = makeRefs({
      ...initialMessageListState,
      messages: [existing as never],
    });

    (manager as Record<string, unknown>).initNextRequest = vi.fn();
    const newer = [buildTextMessage({ id: 6 })];
    (manager as Record<string, unknown>).fetchNext = vi.fn().mockResolvedValue(newer);

    const { emit, dispatched } = setup(
      baseOptions({ user: user as never, loggedInUser: me as never }),
      refs
    );

    act(() => {
      emit({ type: 'connection/connected' } as never);
    });

    await waitFor(() => {
      expect(dispatched.some(a => a.type === 'FETCH_NEXT_SUCCESS')).toBe(true);
    });
  });

  it('connection/connected falls back to re-init when fetchNext rejects', async () => {
    const existing = buildTextMessage({ id: 5 });
    const { refs, manager } = makeRefs({
      ...initialMessageListState,
      messages: [existing as never],
    });
    refs.initializeRef.current = vi.fn();

    (manager as Record<string, unknown>).initNextRequest = vi.fn();
    (manager as Record<string, unknown>).fetchNext = vi
      .fn()
      .mockRejectedValue(new Error('network error'));

    const { emit, dispatched } = setup(
      baseOptions({ user: user as never, loggedInUser: me as never }),
      refs
    );

    act(() => {
      emit({ type: 'connection/connected' } as never);
    });

    await waitFor(() => {
      expect(dispatched.some(a => a.type === 'RESET')).toBe(true);
      expect(refs.initializeRef.current).toHaveBeenCalled();
    });
  });

  it('ignores unknown event types', () => {
    const { refs } = makeRefs();
    const { emit, dispatched } = setup(
      baseOptions({ user: user as never, loggedInUser: me as never }),
      refs
    );

    act(() => {
      emit({ type: 'some/unknown-event' } as never);
    });

    expect(dispatched).toHaveLength(0);
  });
});
