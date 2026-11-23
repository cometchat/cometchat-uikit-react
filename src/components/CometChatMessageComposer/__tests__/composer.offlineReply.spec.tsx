/**
 * The composer's offline (ON) send in a thread and as a reply: once the SDK
 * acknowledges the message the reply event is published and the thread flag
 * stamped, as on today's path; a queued message waits; a refused media send
 * removes the attachment and reports the error.
 */
/* eslint-disable @typescript-eslint/prefer-promise-reject-errors -- the SDK rejects with plain CometChatException-shaped objects */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { mockCometChat } from '../../../testing/mock-sdk';

vi.mock('@cometchat/chat-sdk-javascript', () => ({ CometChat: mockCometChat }));
vi.mock('../../../resources/CometChatSoundManager/CometChatSoundManager', () => ({
  CometChatSoundManager: { play: vi.fn() },
}));

import { useCometChatMessageComposer } from '../useCometChatMessageComposer';
import { OfflineHub } from '../../../utils/offline/hub';
import { CometChatEventsContext } from '../../../context/CometChatEventsContext';
import type { CometChatUIEvent } from '../../../context/CometChatEvents.types';

type Listener = Record<string, ((...args: unknown[]) => void) | undefined>;
type Sdk = Record<string, unknown>;
type Msg = Record<string, unknown> & {
  setId(id: number): void;
  getId(): number;
  isThreadSubscribed(): boolean;
};

const sdk = mockCometChat as unknown as Sdk;
const user = {
  getUid: () => 'peer',
  getName: () => 'Peer',
  getStatus: () => 'online',
} as unknown as import('@cometchat/chat-sdk-javascript').User;
const quoted = { getId: () => 55 } as unknown as import('@cometchat/chat-sdk-javascript').BaseMessage;

/** The 4.3.0 SDK online: pending, then sent with a server id. */
function ackedSend(localMessageId: string, id: number) {
  return vi.fn((message: Msg, listener?: Listener) => {
    message.getLocalMessageId = () => localMessageId;
    let status = 'PENDING';
    message.getStatus = () => status;
    listener?.onMessagePending?.(message);
    status = 'SENT';
    message.setId(id);
    listener?.onMessageSent?.(message);
    return Promise.resolve(message);
  });
}

/** Offline: pending, then the not-connected notice. */
function queuedSend(localMessageId: string) {
  return vi.fn((message: Msg, listener?: Listener) => {
    message.getLocalMessageId = () => localMessageId;
    message.getStatus = () => 'PENDING';
    listener?.onMessagePending?.(message);
    listener?.onError?.({ code: 'FAILED_TO_FETCH' });
    return Promise.reject({ code: 'FAILED_TO_FETCH' });
  });
}

let saved: Record<string, unknown>;
let published: CometChatUIEvent[];

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <CometChatEventsContext.Provider
      value={{
        subscribe: () => () => undefined,
        publish: event => {
          published.push(event);
        },
      }}
    >
      {children}
    </CometChatEventsContext.Provider>
  );
}

const replyEvents = () => published.filter(e => e.type === 'ui:compose/reply');

beforeEach(() => {
  vi.clearAllMocks();
  OfflineHub.resetForTests();
  published = [];
  saved = {
    sendMessage: sdk.sendMessage,
    sendMediaMessage: sdk.sendMediaMessage,
    isInitialized: sdk.isInitialized,
    getLoggedinUser: sdk.getLoggedinUser,
    TextMessage: sdk.TextMessage,
  };
  sdk.isInitialized = vi.fn().mockReturnValue(true);
  sdk.getLoggedinUser = vi.fn().mockResolvedValue(null);
  sdk.isOfflineEnabled = () => true;
  // The mock's text message has no quote setters; the SDK's has.
  const Original = saved.TextMessage as new (...args: unknown[]) => Msg;
  sdk.TextMessage = function TextMessage(...args: unknown[]) {
    const message = new Original(...args);
    message.setQuotedMessage = (m: unknown) => {
      message.quotedMessage = m;
    };
    message.setQuotedMessageId = (id: number) => {
      message.quotedMessageId = id;
    };
    return message;
  };
});

afterEach(() => {
  Object.assign(sdk, saved);
  Reflect.deleteProperty(sdk, 'isOfflineEnabled');
  OfflineHub.resetForTests();
});

describe('composer text send, offline ON, reply in a thread', () => {
  it('an acknowledged reply publishes the reply event and stamps the thread flag', async () => {
    sdk.sendMessage = ackedSend('L1', 900);
    const { result } = renderHook(() => useCometChatMessageComposer({ user, parentMessageId: 7 }), {
      wrapper,
    });
    act(() => {
      result.current.dispatch({ type: 'SET_REPLY_MESSAGE', message: quoted });
      result.current.setText('an answer');
    });
    await act(async () => {
      await result.current.sendMessage();
    });
    const sent = (sdk.sendMessage as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as Msg;
    expect(sent.quotedMessageId).toBe(55);
    expect(sent.isThreadSubscribed()).toBe(true);
    expect(replyEvents()).toHaveLength(1);
    expect(replyEvents()[0]).toMatchObject({ status: 'success', parentMessageId: 7 });
    expect((replyEvents()[0] as unknown as { message: Msg }).message.getId()).toBe(900);
  });

  it('an acknowledged message outside a thread and not a reply: no reply event', async () => {
    sdk.sendMessage = ackedSend('L2', 901);
    const { result } = renderHook(() => useCometChatMessageComposer({ user }), { wrapper });
    act(() => {
      result.current.setText('plain');
    });
    await act(async () => {
      await result.current.sendMessage();
    });
    expect(replyEvents()).toHaveLength(0);
    const sent = (sdk.sendMessage as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as Msg;
    expect(sent.isThreadSubscribed()).toBe(false);
  });

  it('a queued reply publishes no reply event until it is sent', async () => {
    sdk.sendMessage = queuedSend('L3');
    const { result } = renderHook(() => useCometChatMessageComposer({ user, parentMessageId: 7 }), {
      wrapper,
    });
    act(() => {
      result.current.dispatch({ type: 'SET_REPLY_MESSAGE', message: quoted });
      result.current.setText('later');
    });
    await act(async () => {
      await result.current.sendMessage();
    });
    expect(replyEvents()).toHaveLength(0);
    expect(result.current.state.sendState).not.toBe('error');
  });
});

describe('composer media send, offline ON', () => {
  const file = () => new File(['x'], 'a.png', { type: 'image/png' });

  it('an acknowledged threaded reply: quoted, stamped, reply event, click callback', async () => {
    sdk.sendMediaMessage = ackedSend('LM1', 950);
    const onSendButtonClick = vi.fn();
    const { result } = renderHook(
      () => useCometChatMessageComposer({ user, parentMessageId: 3, onSendButtonClick }),
      { wrapper }
    );
    act(() => {
      result.current.dispatch({ type: 'SET_REPLY_MESSAGE', message: quoted });
    });
    await act(async () => {
      await result.current.sendMediaMessage(file(), 'image');
    });
    const sent = (sdk.sendMediaMessage as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as Msg;
    expect(sent.isThreadSubscribed()).toBe(true);
    expect(replyEvents()).toHaveLength(1);
    expect(replyEvents()[0]).toMatchObject({ status: 'success', parentMessageId: 3 });
    expect(onSendButtonClick).toHaveBeenCalledWith(sent, 'send');
    // The reply is cleared before the send.
    expect(result.current.state.messageToReply).toBeNull();
  });

  it('an acknowledged plain attachment: no reply event', async () => {
    sdk.sendMediaMessage = ackedSend('LM2', 951);
    const { result } = renderHook(() => useCometChatMessageComposer({ user }), { wrapper });
    await act(async () => {
      await result.current.sendMediaMessage(file(), 'image');
    });
    expect(replyEvents()).toHaveLength(0);
    expect(published.some(e => e.type === 'ui:message/sent')).toBe(true);
  });

  it('a refused attachment is removed, the composer shows the error and onError is told', async () => {
    sdk.sendMediaMessage = vi.fn((_m: unknown, listener?: Listener) => {
      listener?.onError?.({ code: 'ERR_FILE_TOO_LARGE' });
      return Promise.reject({ code: 'ERR_FILE_TOO_LARGE' });
    });
    const onError = vi.fn();
    const onAttachmentRemoved = vi.fn();
    const onSendButtonClick = vi.fn();
    const { result } = renderHook(
      () =>
        useCometChatMessageComposer({ user, onError, onAttachmentRemoved, onSendButtonClick }),
      { wrapper }
    );
    const attached = file();
    await act(async () => {
      await result.current.sendMediaMessage(attached, 'image');
    });
    expect(onAttachmentRemoved).toHaveBeenCalledTimes(1);
    expect((onAttachmentRemoved.mock.calls[0]?.[0] as File).name).toBe('a.png');
    expect(onError).toHaveBeenCalledWith({ code: 'ERR_FILE_TOO_LARGE' });
    expect(result.current.state.sendState).toBe('error');
    expect(onSendButtonClick).not.toHaveBeenCalled();
  });
});
