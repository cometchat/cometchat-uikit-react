/**
 * Every send path on the offline (ON) path goes through the one send helper
 * (listener form, queued ≠ failed), and with offline off each keeps today's
 * Promise-form call exactly (OFF parity, UIK-GATE-02).
 */
/* eslint-disable @typescript-eslint/prefer-promise-reject-errors -- the SDK rejects with plain CometChatException-shaped objects */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { mockCometChat } from '../../../testing/mock-sdk';

vi.mock('@cometchat/chat-sdk-javascript', () => ({ CometChat: mockCometChat }));
vi.mock('../../../resources/CometChatSoundManager/CometChatSoundManager', () => ({
  CometChatSoundManager: { play: vi.fn() },
}));

import { useCometChatMessageComposer } from '../useCometChatMessageComposer';
import { sendBatch } from '../sendBatch';
import { CometChatUIKit } from '../../../CometChatUIKit/CometChatUIKit';
import { OfflineHub } from '../../../utils/offline/hub';
import { CometChatEventsContext } from '../../../context/CometChatEventsContext';
import { CometChatMessageStatus } from '../../../context/CometChatEvents.types';

type Listener = Record<string, ((...args: unknown[]) => void) | undefined>;
type Sdk = Record<string, unknown>;

const sdk = mockCometChat as unknown as Sdk;
const user = {
  getUid: () => 'peer',
  getName: () => 'Peer',
  getStatus: () => 'online',
} as unknown as import('@cometchat/chat-sdk-javascript').User;

/** The 4.3.0 SDK offline: pending, then the not-connected notice; the Promise rejects too. */
function queuedSend(localMessageId: string) {
  return vi.fn((message: Record<string, unknown>, listener?: Listener) => {
    if (listener) {
      message.getLocalMessageId = () => localMessageId;
      message.getStatus = () => 'PENDING';
      listener.onMessagePending?.(message);
      listener.onError?.({ code: 'FAILED_TO_FETCH' });
    }
    return Promise.reject({ code: 'FAILED_TO_FETCH' });
  });
}

let saved: Record<string, unknown>;

beforeEach(() => {
  vi.clearAllMocks();
  OfflineHub.resetForTests();
  saved = {
    sendMessage: sdk.sendMessage,
    sendMediaMessage: sdk.sendMediaMessage,
    sendCustomMessage: sdk.sendCustomMessage,
    isInitialized: sdk.isInitialized,
    getLoggedinUser: sdk.getLoggedinUser,
    getConnectionStatus: sdk.getConnectionStatus,
  };
  sdk.isInitialized = vi.fn().mockReturnValue(true);
  sdk.getLoggedinUser = vi.fn().mockResolvedValue(null);
});

afterEach(() => {
  Object.assign(sdk, saved);
  Reflect.deleteProperty(sdk, 'isOfflineEnabled');
  OfflineHub.resetForTests();
});

describe('composer text send', () => {
  it('offline off: today’s CometChat.sendMessage(message), one argument, no listener', async () => {
    sdk.sendMessage = vi.fn((m: unknown) => Promise.resolve(m));
    const { result } = renderHook(() => useCometChatMessageComposer({ user }));
    act(() => {
      result.current.setText('Hello');
    });
    await act(async () => {
      await result.current.sendMessage();
    });
    const send = sdk.sendMessage as ReturnType<typeof vi.fn>;
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0]).toHaveLength(1);
  });

  it('offline on: listener form; a queued send is not an error (no onError, no error state)', async () => {
    sdk.isOfflineEnabled = () => true;
    sdk.sendMessage = queuedSend('L1');
    const onError = vi.fn();
    const onSendButtonClick = vi.fn();
    const { result } = renderHook(() =>
      useCometChatMessageComposer({ user, onError, onSendButtonClick })
    );
    act(() => {
      result.current.setText('Queued');
    });
    await act(async () => {
      await result.current.sendMessage();
    });
    const send = sdk.sendMessage as ReturnType<typeof vi.fn>;
    expect(send.mock.calls[0]?.[1]).toBeDefined();
    expect(onError).not.toHaveBeenCalled();
    expect(result.current.state.sendState).not.toBe('error');
    expect(onSendButtonClick).toHaveBeenCalledTimes(1);
    // ON path never stamps metadata.error on the message (README §3.4).
    const sentMessage = send.mock.calls[0]?.[0] as { metadata: Record<string, unknown> };
    expect(sentMessage.metadata.error).toBeUndefined();
  });

  it('offline on: three sends in a row while offline all go out; a send queued behind another never locks the composer (R77)', async () => {
    sdk.isOfflineEnabled = () => true;
    sdk.getConnectionStatus = vi.fn().mockReturnValue('disconnected');
    let n = 0;
    sdk.sendMessage = vi.fn((message: Record<string, unknown>, listener?: Listener) => {
      n += 1;
      if (listener) {
        const localMessageId = `L${String(n)}`;
        message.getLocalMessageId = () => localMessageId;
        message.getStatus = () => 'PENDING';
        listener.onMessagePending?.(message);
        // Only the first send of the chat gets the not-connected notice; the
        // ones queued behind it get pending and then silence (SDK R77).
        if (n === 1) listener.onError?.({ code: 'FAILED_TO_FETCH' });
      }
      return Promise.reject({ code: 'FAILED_TO_FETCH' });
    });
    const onError = vi.fn();
    const onSendButtonClick = vi.fn();
    const { result } = renderHook(() =>
      useCometChatMessageComposer({ user, onError, onSendButtonClick })
    );
    for (const text of ['one', 'two', 'three']) {
      act(() => {
        result.current.setText(text);
      });
      await act(async () => {
        await result.current.sendMessage();
      });
    }
    expect(sdk.sendMessage).toHaveBeenCalledTimes(3);
    expect(onSendButtonClick).toHaveBeenCalledTimes(3);
    expect(onError).not.toHaveBeenCalled();
    expect(result.current.state.sendState).not.toBe('error');
  });

  it('offline on: an error without pending is failed (direct) and reported', async () => {
    sdk.isOfflineEnabled = () => true;
    sdk.sendMessage = vi.fn((_m: unknown, listener?: Listener) => {
      listener?.onError?.({ code: 'ERR_BLOCKED' });
      return Promise.reject({ code: 'ERR_BLOCKED' });
    });
    const onError = vi.fn();
    const { result } = renderHook(() => useCometChatMessageComposer({ user, onError }));
    act(() => {
      result.current.setText('Nope');
    });
    await act(async () => {
      await result.current.sendMessage();
    });
    expect(onError).toHaveBeenCalledWith({ code: 'ERR_BLOCKED' });
    expect(result.current.state.sendState).toBe('error');
  });
});

describe('composer media send (attachments, voice notes)', () => {
  it('offline off: CometChat.sendMediaMessage(message) with one argument', async () => {
    sdk.sendMediaMessage = vi.fn((m: unknown) => Promise.resolve(m));
    const { result } = renderHook(() => useCometChatMessageComposer({ user }));
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    await act(async () => {
      await result.current.sendMediaMessage(file, 'image');
    });
    const send = sdk.sendMediaMessage as ReturnType<typeof vi.fn>;
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0]).toHaveLength(1);
  });

  it('offline on: a voice note goes through the listener form and stays queued', async () => {
    sdk.isOfflineEnabled = () => true;
    sdk.sendMediaMessage = queuedSend('LV');
    const onError = vi.fn();
    const { result } = renderHook(() => useCometChatMessageComposer({ user, onError }));
    const file = new File(['x'], 'v.webm', { type: 'audio/webm' });
    await act(async () => {
      await result.current.sendMediaMessage(file, 'audio', { isVoiceNote: true });
    });
    const send = sdk.sendMediaMessage as ReturnType<typeof vi.fn>;
    expect(send.mock.calls[0]?.[1]).toBeDefined();
    expect(onError).not.toHaveBeenCalled();
  });
});

describe('attachment batch', () => {
  const items = [
    {
      id: 't1',
      kind: 'image',
      status: 'success',
      file: new File(['x'], 'a.png', { type: 'image/png' }),
      attachment: { getUrl: () => 'https://x/a.png' },
    },
  ] as unknown as Parameters<typeof sendBatch>[0]['items'];

  it('offline on: each message of the batch goes through the helper', async () => {
    sdk.isOfflineEnabled = () => true;
    sdk.sendMediaMessage = queuedSend('LB');
    const publish = vi.fn();
    await sendBatch({
      items,
      batchId: 'b1',
      caption: '',
      receiverId: 'peer',
      receiverType: 'user',
      publish,
    } as Parameters<typeof sendBatch>[0]);
    const send = sdk.sendMediaMessage as ReturnType<typeof vi.fn>;
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0]?.[1]).toBeDefined();
    // Only the optimistic inprogress is published by the batch itself; no error.
    expect(publish.mock.calls.map(c => (c[0] as { status: string }).status)).toEqual([
      'inprogress',
    ]);
  });

  it('offline off: today’s Promise form', async () => {
    sdk.sendMediaMessage = vi.fn((m: unknown) => Promise.resolve(m));
    await sendBatch({
      items,
      batchId: 'b2',
      caption: '',
      receiverId: 'peer',
      receiverType: 'user',
      publish: vi.fn(),
    } as Parameters<typeof sendBatch>[0]);
    const send = sdk.sendMediaMessage as ReturnType<typeof vi.fn>;
    expect(send.mock.calls[0]).toHaveLength(1);
  });
});

describe('CometChatUIKit.send* statics', () => {
  function message() {
    const Ctor = mockCometChat.TextMessage as unknown as new (
      r: string,
      t: string,
      rt: string
    ) => import('@cometchat/chat-sdk-javascript').TextMessage;
    return new Ctor('peer', 'hi', 'user');
  }

  it('offline off: CometChat.sendMessage(message) and today’s events', async () => {
    sdk.sendMessage = vi.fn((m: unknown) => Promise.resolve(m));
    const events: string[] = [];
    CometChatUIKit._setEmit(e => events.push((e as { status?: string }).status ?? e.type));
    await CometChatUIKit.sendTextMessage(message());
    CometChatUIKit._setEmit(null);
    expect((sdk.sendMessage as ReturnType<typeof vi.fn>).mock.calls[0]).toHaveLength(1);
    expect(events).toEqual(['inprogress', 'success']);
  });

  it('offline on: never rejects because the message was queued', async () => {
    sdk.isOfflineEnabled = () => true;
    sdk.sendMessage = queuedSend('LS');
    const events: string[] = [];
    CometChatUIKit._setEmit(e => events.push((e as { status?: string }).status ?? e.type));
    let settled = false;
    void CometChatUIKit.sendTextMessage(message()).then(
      () => (settled = true),
      () => (settled = true)
    );
    await new Promise(resolve => setTimeout(resolve, 0));
    CometChatUIKit._setEmit(null);
    expect(settled).toBe(false);
    expect(events[0]).toBe('inprogress');
    expect(events).not.toContain('error');
  });

  it('offline on: rejects on a direct failure', async () => {
    sdk.isOfflineEnabled = () => true;
    sdk.sendCustomMessage = vi.fn((_m: unknown, listener?: Listener) => {
      listener?.onError?.({ code: 'ERR_X' });
      return Promise.reject({ code: 'ERR_X' });
    });
    const Ctor = mockCometChat.TextMessage as unknown as new (
      r: string,
      t: string,
      rt: string
    ) => import('@cometchat/chat-sdk-javascript').CustomMessage;
    await expect(CometChatUIKit.sendCustomMessage(new Ctor('peer', 'c', 'user'))).rejects.toEqual({
      code: 'ERR_X',
    });
  });
});

describe('a failed edit', () => {
  function editable(text: string) {
    return {
      getId: () => 41,
      getType: () => 'text',
      getText: () => text,
      getCaption: () => '',
      setMentionedUsers: vi.fn(),
      getMentionedUsers: () => [],
      getParentMessageId: () => 0,
    } as unknown as import('@cometchat/chat-sdk-javascript').TextMessage;
  }

  // Same outcome as the Android UI Kit, offline on or off: the composer is
  // cleared and out of edit mode, the error goes to onError and the edit event.
  it.each([
    ['offline on', true],
    ['offline off', false],
  ])(
    '%s: leaves the composer cleared and out of edit mode, and reports the error',
    async (_label, offline) => {
      if (offline) sdk.isOfflineEnabled = vi.fn().mockReturnValue(true);
      const savedEdit = sdk.editMessage;
      const failure = { code: 'FAILED_TO_FETCH' };
      sdk.editMessage = vi.fn().mockRejectedValue(failure);
      const publish = vi.fn();
      const wrapper = ({ children }: { children: ReactNode }) =>
        createElement(
          CometChatEventsContext.Provider,
          { value: { publish, subscribe: () => () => undefined } },
          children
        );
      const onError = vi.fn();
      try {
        const target = editable('before');
        const { result } = renderHook(
          () => useCometChatMessageComposer({ user, messageToEdit: target, onError }),
          { wrapper }
        );
        act(() => {
          result.current.setText('after');
        });
        await act(async () => {
          await result.current.editMessage();
        });
        expect(sdk.editMessage).toHaveBeenCalledTimes(1);
        expect(result.current.state.text).toBe('');
        expect(result.current.state.textMessageToEdit).toBeNull();
        expect(result.current.isInEditMode).toBe(false);
        expect(onError).toHaveBeenCalledWith(failure);
        expect(publish).toHaveBeenCalledWith({
          type: 'ui:compose/edit',
          message: target,
          status: CometChatMessageStatus.error,
          parentMessageId: null,
        });
      } finally {
        sdk.editMessage = savedEdit;
      }
    }
  );
});
