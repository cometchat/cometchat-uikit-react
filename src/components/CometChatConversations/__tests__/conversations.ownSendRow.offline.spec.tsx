/**
 * With offline on, the SDK's acked own message can be the composed object: a
 * receiver id, no receiver. The row rebuilt from it must keep its peer, its
 * place and the new preview, with or without the SDK fix, and must never be a
 * row with no peer (which crashes on render and blanks the app).
 */
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { useCometChatConversationsEvents } from '../useCometChatConversationsEvents';
import { rowFromMessageOffline } from '../conversationsOffline';
import type { CometChatConversationsAction } from '../CometChatConversations.reducer';
import { CometChatEventsContext } from '../../../context/CometChatEventsContext';
import {
  CometChatMessageStatus,
  type CometChatEvent,
} from '../../../context/CometChatEvents.types';
import { OfflineHub } from '../../../utils/offline/hub';
import {
  installOfflineSdk,
  offlineMessage,
  type OfflineSdkFake,
} from '../../../testing/offline-sdk-fake';

const me = new CometChat.User({ uid: 'me', name: 'Me' });
const sam = new CometChat.User({ uid: 'sam', name: 'Sam' });

function listedRow(): CometChat.Conversation {
  return new CometChat.Conversation(
    'me_user_sam',
    'user',
    undefined as never,
    sam,
    0,
    [],
    null,
    null
  );
}

/** What the SDK's `onMessageSent` hands back today: the composed message, acked. */
function composedAck(receiver = 'sam', receiverType = 'user'): CometChat.TextMessage {
  const message = new CometChat.TextMessage(receiver, 'hello', receiverType);
  message.setSender(me);
  return offlineMessage(message, { id: 7, sentAt: 100, localMessageId: 'L1', status: 'SENT' });
}

/** A server copy, as with offline off or once the SDK is fixed. */
function serverCopy(): CometChat.BaseMessage {
  return CometChat.CometChatHelper.processMessage({
    id: '7',
    muid: 'm',
    conversationId: 'me_user_sam',
    sender: { uid: 'me', name: 'Me' },
    receiver: { uid: 'sam', name: 'Sam' },
    receiverUid: 'sam',
    receiverType: 'user',
    type: 'text',
    category: 'message',
    data: { text: 'hello', entities: {} },
    sentAt: 100,
  }) as unknown as CometChat.BaseMessage;
}

function peerOf(conversation: CometChat.Conversation) {
  return (conversation.getConversationWith() as CometChat.User | undefined)?.getUid();
}

describe('own-send rows with offline on', () => {
  let fake: OfflineSdkFake;

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk({ enabled: true });
    vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(me);
  });

  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
    vi.restoreAllMocks();
  });

  it('a composed ack keeps the listed row’s peer and id, with the new preview', async () => {
    const message = composedAck();
    const row = await rowFromMessageOffline(message, [listedRow()]);
    expect(row).not.toBeNull();
    expect(peerOf(row!)).toBe('sam');
    expect(row!.getConversationId()).toBe('me_user_sam');
    expect(row!.getLastMessage()).toBe(message);
  });

  it('a receiver with only an id (a retried outbox row) is not a peer: the listed row supplies it', async () => {
    const message = composedAck();
    message.setReceiver(new CometChat.User({ uid: 'sam' }));
    const helper = vi.spyOn(CometChat.CometChatHelper, 'getConversationFromMessage');
    helper.mockResolvedValue(
      new CometChat.Conversation(
        'me_user_sam',
        'user',
        message,
        new CometChat.User({ uid: 'sam' }),
        0,
        [],
        null,
        null
      )
    );
    const row = await rowFromMessageOffline(message, [listedRow()]);
    expect((row!.getConversationWith() as CometChat.User).getName()).toBe('Sam');
  });

  it('a composed ack for a chat not listed makes no row', async () => {
    expect(await rowFromMessageOffline(composedAck('bea'), [listedRow()])).toBeNull();
  });

  it('a server copy passes through whole (the SDK fix changes nothing here)', async () => {
    const row = await rowFromMessageOffline(serverCopy(), []);
    expect(peerOf(row!)).toBe('sam');
  });

  function renderEvents(list: CometChat.Conversation[]) {
    const dispatch = vi.fn<(action: CometChatConversationsAction) => void>();
    let emit: (event: CometChatEvent) => void = () => undefined;
    const value = {
      subscribe: (handler: (event: CometChatEvent) => void) => {
        emit = handler;
        return () => undefined;
      },
      publish: vi.fn(),
    };
    renderHook(
      () =>
        useCometChatConversationsEvents({
          dispatch,
          conversationsRef: { current: list },
          loggedInUserId: 'me',
        }),
      {
        wrapper: ({ children }) => (
          <CometChatEventsContext.Provider value={value as never}>
            {children}
          </CometChatEventsContext.Provider>
        ),
      }
    );
    return { dispatch, emit: (event: CometChatEvent) => emit(event) };
  }

  it('the sent event moves the listed row with its peer and never dispatches a row with no peer', async () => {
    const { dispatch, emit } = renderEvents([listedRow()]);
    emit({
      type: 'ui:message/sent',
      message: composedAck(),
      status: CometChatMessageStatus.success,
    });
    await waitFor(() => {
      expect(dispatch).toHaveBeenCalled();
    });
    const action = dispatch.mock.calls[0]?.[0] as Extract<
      CometChatConversationsAction,
      { type: 'MOVE_TO_TOP' }
    >;
    expect(action.type).toBe('MOVE_TO_TOP');
    expect(peerOf(action.conversation)).toBe('sam');
    expect(action.conversation.getUnreadMessageCount()).toBe(0);
  });

  it('the first message of a chat not listed asks the SDK for the whole conversation', async () => {
    const fetched = new CometChat.Conversation(
      'me_user_bea',
      'user',
      undefined as never,
      new CometChat.User({ uid: 'bea', name: 'Bea' }),
      0,
      [],
      null,
      null
    );
    const getConversation = vi.spyOn(CometChat, 'getConversation').mockResolvedValue(fetched);
    const { dispatch, emit } = renderEvents([listedRow()]);
    emit({
      type: 'ui:message/sent',
      message: composedAck('bea'),
      status: CometChatMessageStatus.success,
    });
    await waitFor(() => {
      expect(dispatch).toHaveBeenCalledWith({ type: 'MOVE_TO_TOP', conversation: fetched });
    });
    expect(getConversation).toHaveBeenCalledWith('bea', 'user');
  });

  it('a chat not listed that cannot be fetched adds nothing', async () => {
    vi.spyOn(CometChat, 'getConversation').mockRejectedValue({ code: 'FAILED_TO_FETCH' });
    const { dispatch, emit } = renderEvents([listedRow()]);
    emit({
      type: 'ui:message/sent',
      message: composedAck('bea'),
      status: CometChatMessageStatus.success,
    });
    await new Promise(resolve => {
      setTimeout(resolve, 10);
    });
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('a read of a composed message updates the listed row with its peer', async () => {
    const { dispatch, emit } = renderEvents([listedRow()]);
    emit({ type: 'ui:message/read', message: composedAck() });
    await waitFor(() => {
      expect(dispatch).toHaveBeenCalled();
    });
    const action = dispatch.mock.calls[0]?.[0] as Extract<
      CometChatConversationsAction,
      { type: 'UPDATE_CONVERSATION' }
    >;
    expect(peerOf(action.conversation)).toBe('sam');
  });

  it('offline off keeps today’s call: the rebuilt conversation goes through as it is', async () => {
    fake.setEnabled(false);
    const rebuilt = listedRow();
    const helper = vi
      .spyOn(CometChat.CometChatHelper, 'getConversationFromMessage')
      .mockResolvedValue(rebuilt);
    const { dispatch, emit } = renderEvents([]);
    const message = composedAck();
    emit({ type: 'ui:message/sent', message, status: CometChatMessageStatus.success });
    await waitFor(() => {
      expect(dispatch).toHaveBeenCalledWith({ type: 'MOVE_TO_TOP', conversation: rebuilt });
    });
    expect(helper).toHaveBeenCalledWith(message);
  });
});
