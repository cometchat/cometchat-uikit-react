/**
 * useCometChatMessageComposer: text / media / batch send pipelines, edits, previews,
 * prop sync, typing, SDK listeners and the compose-command events it reacts to.
 */
import { createElement, type ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';

const sdk = vi.hoisted(() => {
  class FakeMessage {
    id = 0;
    receiverId: string;
    receiverType: string;
    type: string;
    muid = '';
    sentAt = 0;
    parentMessageId = 0;
    metadata: Record<string, unknown> = {};
    sender: unknown = null;
    quotedMessage: unknown = null;
    quotedMessageId = 0;
    mentionedUsers: unknown[] = [];
    threadSubscribed = false;
    caption = '';
    constructor(receiverId: string, type: string, receiverType: string) {
      this.receiverId = receiverId;
      this.type = type;
      this.receiverType = receiverType;
    }
    getId() {
      return this.id;
    }
    getType() {
      return this.type;
    }
    setMuid(muid: string) {
      this.muid = muid;
    }
    setSentAt(sentAt: number) {
      this.sentAt = sentAt;
    }
    setParentMessageId(id: number) {
      this.parentMessageId = id;
    }
    setThreadSubscribed(value: boolean) {
      this.threadSubscribed = value;
    }
    getMetadata() {
      return this.metadata;
    }
    setMetadata(metadata: Record<string, unknown>) {
      this.metadata = metadata;
    }
    setSender(sender: unknown) {
      this.sender = sender;
    }
    setQuotedMessage(message: unknown) {
      this.quotedMessage = message;
    }
    setQuotedMessageId(id: number) {
      this.quotedMessageId = id;
    }
    setMentionedUsers(users: unknown[]) {
      this.mentionedUsers = users;
    }
    getCaption() {
      return this.caption;
    }
  }
  class TextMessage extends FakeMessage {
    text: string;
    constructor(receiverId: string, text: string, receiverType: string) {
      super(receiverId, 'text', receiverType);
      this.text = text;
    }
    getText() {
      return this.text;
    }
  }
  class MediaMessage extends FakeMessage {
    file: unknown;
    constructor(receiverId: string, file: unknown, type: string, receiverType: string) {
      if (control.throwOnMediaMessage) throw new Error('bad media');
      super(receiverId, type, receiverType);
      this.file = file;
    }
  }
  class User {
    uid: string;
    name: string;
    constructor(init: { uid: string; name: string }) {
      this.uid = init.uid;
      this.name = init.name;
    }
    getUid() {
      return this.uid;
    }
  }
  const control = { throwOnMediaMessage: false };
  const CometChat = {
    TextMessage,
    MediaMessage,
    User,
    RECEIVER_TYPE: { USER: 'user', GROUP: 'group' },
    MESSAGE_TYPE: { TEXT: 'text', IMAGE: 'image', FILE: 'file' },
    isInitialized: vi.fn(),
    getLoggedinUser: vi.fn(),
    sendMessage: vi.fn(),
    sendMediaMessage: vi.fn(),
  };
  return { CometChat, TextMessage, MediaMessage, control };
});

const manager = vi.hoisted(() => ({
  editTextMessage: vi.fn(),
  editMediaCaption: vi.fn(),
  startTypingIndicator: vi.fn(),
  endTypingIndicator: vi.fn(),
  attachMessageListener: vi.fn(),
  attachConnectionListener: vi.fn(),
}));

const batch = vi.hoisted(() => ({ sendBatch: vi.fn() }));

const upload = vi.hoisted(() => {
  const request = { clearAll: vi.fn() };
  const manager = {
    startUpload: vi.fn(),
    removeItem: vi.fn(),
    retryItem: vi.fn(),
    clear: vi.fn(),
    sendable: false,
    maxAttachmentCount: 10,
    getActiveRequest: () => request,
  };
  return { request, manager };
});

const sound = vi.hoisted(() => ({ play: vi.fn() }));

vi.mock('@cometchat/chat-sdk-javascript', async () => {
  const { mockCometChat } = await import('../../../testing/mock-sdk');
  return { CometChat: { ...mockCometChat, ...sdk.CometChat } };
});
vi.mock('../CometChatMessageComposerManager', () => manager);
vi.mock('../sendBatch', () => batch);
vi.mock('../useMediaUploadManager', () => ({
  useMediaUploadManager: () => upload.manager,
}));
vi.mock('../../../resources/CometChatSoundManager/CometChatSoundManager', () => ({
  CometChatSoundManager: sound,
}));

import {
  useCometChatMessageComposer,
  type CometChatUseCometChatMessageComposerOptions,
} from '../useCometChatMessageComposer';
import { CometChatEventsContext } from '../../../context/CometChatEventsContext';
import {
  CometChatMessageStatus,
  type CometChatEvent,
  type CometChatEventsContextValue,
  type CometChatUIEvent,
} from '../../../context/CometChatEvents.types';
import type { TrayItem } from '../CometChatMessageComposer.types';

type Options = CometChatUseCometChatMessageComposerOptions;
type SentEvent = Extract<CometChatUIEvent, { type: 'ui:message/sent' }>;

const ME = { uid: 'me', getUid: () => 'me' };
const BOB = { uid: 'bob', name: 'Bob' };

function makeUser(uid = 'user-1') {
  return { getUid: () => uid } as unknown as CometChat.User;
}

function makeGroup(guid = 'group-1') {
  return { getGuid: () => guid } as unknown as CometChat.Group;
}

function textMessage(id: number, text: string) {
  const msg = new sdk.TextMessage('user-1', text, 'user');
  msg.id = id;
  return msg as unknown as CometChat.TextMessage;
}

function mediaMessage(id: number, caption: string) {
  const msg = new sdk.MediaMessage('user-1', null, 'image', 'user');
  msg.id = id;
  msg.caption = caption;
  return msg as unknown as CometChat.MediaMessage;
}

function trayItem(fileId: string): TrayItem {
  return {
    fileId,
    file: new File(['x'], `${fileId}.png`, { type: 'image/png' }),
    kind: 'image',
    status: 'success',
    percent: 100,
    attachment: {
      getUrl: () => `https://cdn.test/${fileId}.png`,
    } as unknown as CometChat.Attachment,
  };
}

function deferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>(r => {
    resolve = r;
  });
  return { promise, resolve };
}

function createBus() {
  const handlers = new Set<(event: CometChatEvent) => void>();
  const events: CometChatUIEvent[] = [];
  const publish = vi.fn((event: CometChatUIEvent) => {
    events.push(event);
    handlers.forEach(handler => handler(event));
  });
  const value: CometChatEventsContextValue = {
    publish,
    subscribe: handler => {
      handlers.add(handler);
      return () => {
        handlers.delete(handler);
      };
    },
  };
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(CometChatEventsContext.Provider, { value }, children);
  const emit = (event: CometChatEvent) => {
    act(() => {
      handlers.forEach(handler => handler(event));
    });
  };
  const sent = (status: CometChatMessageStatus) =>
    events
      .filter((e): e is SentEvent => e.type === 'ui:message/sent' && e.status === status)
      .map(e => e.message);
  return { publish, events, wrapper, emit, sent };
}

function setup(options: Options = {}, bus = createBus()) {
  const view = renderHook((props: Options) => useCometChatMessageComposer(props), {
    initialProps: options,
    wrapper: bus.wrapper,
  });
  return { ...view, bus };
}

function only<T>(items: T[], label: string): T {
  const [first] = items;
  if (items.length !== 1 || first === undefined) {
    throw new Error(`expected exactly one ${label}, got ${String(items.length)}`);
  }
  return first;
}

const listeners: {
  message: {
    onMessageEdited: () => void;
    onMessageDeleted: (m: CometChat.BaseMessage) => void;
  } | null;
  connection: (() => void) | null;
} = { message: null, connection: null };

beforeEach(() => {
  vi.clearAllMocks();
  sdk.control.throwOnMediaMessage = false;
  sdk.CometChat.isInitialized.mockReturnValue(true);
  sdk.CometChat.getLoggedinUser.mockResolvedValue(ME);
  sdk.CometChat.sendMessage.mockImplementation((m: unknown) => Promise.resolve(m));
  sdk.CometChat.sendMediaMessage.mockImplementation((m: unknown) => Promise.resolve(m));
  manager.editTextMessage.mockResolvedValue(textMessage(42, 'edited'));
  manager.editMediaCaption.mockResolvedValue(mediaMessage(43, 'edited caption'));
  manager.attachMessageListener.mockImplementation(
    (_id: string, callbacks: NonNullable<(typeof listeners)['message']>) => {
      listeners.message = callbacks;
      return () => undefined;
    }
  );
  manager.attachConnectionListener.mockImplementation((_id: string, cb: () => void) => {
    listeners.connection = cb;
    return () => undefined;
  });
  batch.sendBatch.mockResolvedValue(undefined);
  upload.request.clearAll.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
  listeners.message = null;
  listeners.connection = null;
});

describe('sendMessage', () => {
  it('sends a threaded reply with sender and mentions, then publishes success and reply events', async () => {
    const reply = textMessage(7, 'original');
    const confirmed = textMessage(900, 'hello');
    sdk.CometChat.sendMessage.mockResolvedValue(confirmed);
    const clearMentionedUsers = vi.fn();
    const onSendButtonClick = vi.fn();
    const { result, bus } = setup({
      user: makeUser(),
      parentMessageId: 50,
      messageToReply: reply,
      getMentionedUsers: () => [BOB],
      clearMentionedUsers,
      onSendButtonClick,
    });
    await waitFor(() => expect(result.current.isInReplyMode).toBe(true));

    act(() => result.current.setText('  hello <@uid:bob>  '));
    await act(() => result.current.sendMessage());

    const optimistic = only(bus.sent(CometChatMessageStatus.inprogress), 'inprogress event');
    expect(optimistic).toEqual(
      expect.objectContaining({
        receiverId: 'user-1',
        receiverType: 'user',
        text: 'hello <@uid:bob>',
        parentMessageId: 50,
        threadSubscribed: true,
        quotedMessage: reply,
        quotedMessageId: 7,
        sender: ME,
        mentionedUsers: [expect.objectContaining({ uid: 'bob', name: 'Bob' })],
      })
    );
    expect(sdk.CometChat.sendMessage).toHaveBeenCalledWith(optimistic);
    expect(bus.sent(CometChatMessageStatus.success)).toEqual([confirmed]);
    expect(bus.publish).toHaveBeenCalledWith({
      type: 'ui:compose/reply',
      message: confirmed,
      status: CometChatMessageStatus.success,
      parentMessageId: 50,
    });
    expect(confirmed).toEqual(expect.objectContaining({ threadSubscribed: true }));
    expect(onSendButtonClick).toHaveBeenCalledWith(confirmed, 'send');
    expect(clearMentionedUsers).toHaveBeenCalled();
    expect(result.current.state).toEqual(
      expect.objectContaining({
        text: '',
        messageToReply: null,
        sendState: 'idle',
      })
    );
  });

  it('still sends when the logged-in user lookup fails', async () => {
    sdk.CometChat.getLoggedinUser.mockRejectedValue(new Error('no session'));
    const { result, bus } = setup({ group: makeGroup() });
    act(() => result.current.setText('hi'));
    await act(() => result.current.sendMessage());

    const sent = only(bus.sent(CometChatMessageStatus.success), 'success event');
    expect(sent).toEqual(
      expect.objectContaining({
        receiverId: 'group-1',
        receiverType: 'group',
        sender: null,
      })
    );
  });

  it('converts rich-text HTML to markdown before sending', async () => {
    const getInputFormatters = vi.fn(() => []);
    const { result } = setup({ user: makeUser(), getInputFormatters });
    await act(() => result.current.sendMessage(undefined, '<strong>Bold</strong> move'));

    expect(getInputFormatters).toHaveBeenCalled();
    expect(sdk.CometChat.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ text: '**Bold** move' })
    );
  });

  it('publishes the same optimistic message with the error attached when the SDK rejects', async () => {
    const error = new Error('Network down');
    sdk.CometChat.sendMessage.mockRejectedValueOnce(error);
    const onError = vi.fn();
    const { result, bus } = setup({ user: makeUser(), onError });
    act(() => result.current.setText('hi'));
    await act(() => result.current.sendMessage());

    const optimistic = only(bus.sent(CometChatMessageStatus.inprogress), 'inprogress event');
    expect(bus.sent(CometChatMessageStatus.error)).toEqual([optimistic]);
    expect(optimistic).toEqual(expect.objectContaining({ metadata: { error } }));
    expect(onError).toHaveBeenCalledWith(error);
    expect(result.current.state).toEqual(
      expect.objectContaining({ sendState: 'error', error: 'Network down' })
    );
    expect(sound.play).not.toHaveBeenCalled();

    act(() => result.current.setText('again'));
    await act(() => result.current.sendMessage());
    expect(sdk.CometChat.sendMessage).toHaveBeenCalledTimes(2);
  });

  it('records a generic error message when the rejection is not an Error', async () => {
    sdk.CometChat.sendMessage.mockRejectedValueOnce({ code: 'ERR' });
    const { result } = setup({ user: makeUser() });
    act(() => result.current.setText('hi'));
    await act(() => result.current.sendMessage());
    expect(result.current.state.error).toBe('Unknown error');
  });

  it('ignores a second send while the first is still in flight', async () => {
    const pending = deferred<unknown>();
    sdk.CometChat.getLoggedinUser.mockReturnValue(pending.promise);
    const { result } = setup({ user: makeUser() });
    act(() => result.current.setText('once'));

    let first: Promise<void> = Promise.resolve();
    await act(async () => {
      first = result.current.sendMessage();
      await result.current.sendMessage();
    });
    pending.resolve(ME);
    await act(() => first);

    expect(sdk.CometChat.sendMessage).toHaveBeenCalledTimes(1);
  });

  it('falls back to standalone mode when the SDK initialisation check throws', async () => {
    sdk.CometChat.isInitialized.mockImplementation(() => {
      throw new Error('not set up');
    });
    const onSendButtonClick = vi.fn();
    const { result } = setup({ user: makeUser(), onSendButtonClick });
    act(() => result.current.setText('offline'));
    await act(() => result.current.sendMessage());

    expect(sdk.CometChat.sendMessage).not.toHaveBeenCalled();
    expect(onSendButtonClick).toHaveBeenCalledWith(null, 'send');
    expect(result.current.state).toEqual(expect.objectContaining({ text: '', sendState: 'idle' }));
  });

  // Known issue: the catch block calls Object.defineProperty on the still-null textMessage, so a throwing override escapes as a TypeError and leaves the composer stuck in 'sending'.
  it.fails('reports a throwing sendTextMessageOverride and stays usable', async () => {
    const error = new Error('override failed');
    const sendTextMessageOverride = vi.fn(() => {
      throw error;
    });
    const onError = vi.fn();
    const { result } = setup({
      user: makeUser(),
      sendTextMessageOverride,
      onError,
    });
    act(() => result.current.setText('hi'));
    await act(() => result.current.sendMessage());

    expect(onError).toHaveBeenCalledWith(error);
    expect(result.current.state.sendState).toBe('error');
  });
});

describe('sendMediaMessage', () => {
  const photo = new File(['png-bytes'], 'photo.png', { type: 'image/png' });

  it('is a no-op without a receiver or an initialised SDK', async () => {
    const onAttachmentAdded = vi.fn();
    const standalone = setup({ onAttachmentAdded });
    await act(() => standalone.result.current.sendMediaMessage(photo, 'image'));

    sdk.CometChat.isInitialized.mockReturnValue(false);
    const uninitialised = setup({ user: makeUser(), onAttachmentAdded });
    await act(() => uninitialised.result.current.sendMediaMessage(photo, 'image'));

    expect(sdk.CometChat.sendMediaMessage).not.toHaveBeenCalled();
    expect(onAttachmentAdded).not.toHaveBeenCalled();
  });

  it('rejects a file whose MIME type does not match the chosen media type', async () => {
    const pdf = new File(['%PDF'], 'doc.pdf', { type: 'application/pdf' });
    const { result } = setup({ user: makeUser() });
    await act(() => result.current.sendMediaMessage(pdf, 'image'));

    expect(sdk.CometChat.sendMediaMessage).not.toHaveBeenCalled();
    expect(result.current.state).toEqual(
      expect.objectContaining({
        showValidationError: true,
        validationErrorText: 'message_composer_wrong_file_type',
      })
    );

    act(() => result.current.dismissValidationError());
    expect(result.current.state).toEqual(
      expect.objectContaining({
        showValidationError: false,
        validationErrorText: null,
      })
    );
  });

  it('accepts HEIC images with no MIME type and any file for the generic file type', async () => {
    const heic = new File(['heic'], 'IMG_0001.HEIC', { type: '' });
    const zip = new File(['zip'], 'a.zip', { type: 'application/zip' });
    const { result } = setup({ user: makeUser() });
    await act(() => result.current.sendMediaMessage(heic, 'image'));
    await act(() => result.current.sendMediaMessage(zip, 'file'));

    expect(sdk.CometChat.sendMediaMessage).toHaveBeenCalledTimes(2);
    expect(result.current.state.showValidationError).toBe(false);
  });

  it('sends a threaded reply, publishes inprogress then success, and plays the sound', async () => {
    const reply = textMessage(7, 'original');
    const confirmed = mediaMessage(901, '');
    sdk.CometChat.sendMediaMessage.mockResolvedValue(confirmed);
    const onAttachmentAdded = vi.fn();
    const onSendButtonClick = vi.fn();
    const { result, bus } = setup({
      user: makeUser(),
      parentMessageId: 50,
      messageToReply: reply,
      onAttachmentAdded,
      onSendButtonClick,
    });
    await waitFor(() => expect(result.current.isInReplyMode).toBe(true));
    await act(() => result.current.sendMediaMessage(photo, 'image'));

    const optimistic = only(bus.sent(CometChatMessageStatus.inprogress), 'inprogress event');
    expect(optimistic).toEqual(
      expect.objectContaining({
        type: 'image',
        file: photo,
        parentMessageId: 50,
        threadSubscribed: true,
        quotedMessageId: 7,
        sender: ME,
        metadata: {
          file: photo,
          fileName: 'photo.png',
          fileType: 'image/png',
          fileSize: 9,
        },
      })
    );
    expect(sdk.CometChat.sendMediaMessage).toHaveBeenCalledWith(optimistic);
    expect(bus.sent(CometChatMessageStatus.success)).toEqual([confirmed]);
    expect(bus.publish).toHaveBeenCalledWith({
      type: 'ui:compose/reply',
      message: confirmed,
      status: CometChatMessageStatus.success,
      parentMessageId: 50,
    });
    expect(confirmed).toEqual(expect.objectContaining({ threadSubscribed: true }));
    expect(onAttachmentAdded).toHaveBeenCalledWith(photo);
    expect(onSendButtonClick).toHaveBeenCalledWith(confirmed, 'send');
    expect(sound.play).toHaveBeenCalledWith('outgoingMessage', undefined);
    expect(result.current.state).toEqual(
      expect.objectContaining({ sendState: 'idle', messageToReply: null })
    );
  });

  it('tags voice notes and tolerates a failed logged-in user lookup', async () => {
    sdk.CometChat.getLoggedinUser.mockRejectedValue(new Error('no session'));
    const clip = new File(['ogg'], 'clip.webm', { type: 'audio/webm' });
    const { result } = setup({ group: makeGroup() });
    await act(() => result.current.sendMediaMessage(clip, 'audio', { isVoiceNote: true }));

    expect(sdk.CometChat.sendMediaMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        receiverType: 'group',
        sender: null,
        metadata: expect.objectContaining({ audioType: 'voice_note' }),
      })
    );
  });

  it('re-wraps a file from another realm so the SDK sees a real Blob', async () => {
    const foreign = {
      name: 'foreign.png',
      type: 'image/png',
      lastModified: 1_700_000_000_000,
    } as unknown as File;
    const onAttachmentAdded = vi.fn();
    const { result } = setup({ user: makeUser(), onAttachmentAdded });
    await act(() => result.current.sendMediaMessage(foreign, 'image'));

    expect(onAttachmentAdded).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'foreign.png', type: 'image/png' })
    );
    expect(onAttachmentAdded).not.toHaveBeenCalledWith(foreign);
    expect(sdk.CometChat.sendMediaMessage).toHaveBeenCalledWith(
      expect.objectContaining({ file: expect.any(File) })
    );
  });

  it('publishes an error with the failure attached and removes the attachment', async () => {
    const error = new Error('upload failed');
    sdk.CometChat.sendMediaMessage.mockRejectedValueOnce(error);
    const onAttachmentRemoved = vi.fn();
    const onError = vi.fn();
    const { result, bus } = setup({
      user: makeUser(),
      onAttachmentRemoved,
      onError,
    });
    await act(() => result.current.sendMediaMessage(photo, 'image'));

    const optimistic = only(bus.sent(CometChatMessageStatus.inprogress), 'inprogress event');
    expect(bus.sent(CometChatMessageStatus.error)).toEqual([optimistic]);
    expect(optimistic).toEqual(
      expect.objectContaining({ metadata: expect.objectContaining({ error }) })
    );
    expect(onAttachmentRemoved).toHaveBeenCalledWith(photo);
    expect(onError).toHaveBeenCalledWith(error);
    expect(result.current.state).toEqual(
      expect.objectContaining({ sendState: 'error', error: 'upload failed' })
    );
    expect(sound.play).not.toHaveBeenCalled();
  });

  // Known issue: when the MediaMessage constructor throws, the catch block calls Object.defineProperty on the null mediaMessage, so the error escapes as a TypeError and sendState stays 'sending'.
  it.fails('reports a failure to build the media message', async () => {
    sdk.control.throwOnMediaMessage = true;
    const onError = vi.fn();
    const { result } = setup({ user: makeUser(), onError });
    await act(() => result.current.sendMediaMessage(photo, 'image'));

    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'bad media' }));
    expect(result.current.state.sendState).toBe('error');
  });
});

describe('sendBatch', () => {
  function stage(result: { current: ReturnType<typeof useCometChatMessageComposer> }) {
    act(() => {
      result.current.dispatch({
        type: 'TRAY_ADD',
        items: [trayItem('f1'), trayItem('f2')],
        batchId: 'batch-1',
      });
    });
  }

  it('does nothing when the SDK is not initialised or the tray is empty', async () => {
    const empty = setup({ user: makeUser() });
    await act(() => empty.result.current.sendBatch());

    sdk.CometChat.isInitialized.mockReturnValue(false);
    const uninitialised = setup({ user: makeUser() });
    stage(uninitialised.result);
    await act(() => uninitialised.result.current.sendBatch());

    expect(batch.sendBatch).not.toHaveBeenCalled();
    expect(uninitialised.result.current.state.tray.items).toHaveLength(2);
  });

  it('clears the composer before the batch resolves and sends a snapshot of it', async () => {
    const pending = deferred<undefined>();
    batch.sendBatch.mockReturnValue(pending.promise);
    const reply = textMessage(7, 'original');
    const onSendButtonClick = vi.fn();
    const { result } = setup({
      user: makeUser(),
      parentMessageId: 50,
      messageToReply: reply,
      onSendButtonClick,
    });
    await waitFor(() => expect(result.current.isInReplyMode).toBe(true));
    stage(result);
    act(() => result.current.setText('look'));

    let sending: Promise<void> = Promise.resolve();
    act(() => {
      sending = result.current.sendBatch();
    });

    expect(result.current.state).toEqual(
      expect.objectContaining({
        text: '',
        messageToReply: null,
        sendState: 'idle',
        tray: { batchId: null, items: [] },
      })
    );
    expect(batch.sendBatch).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [
          expect.objectContaining({ fileId: 'f1' }),
          expect.objectContaining({ fileId: 'f2' }),
        ],
        batchId: 'batch-1',
        caption: 'look',
        receiverId: 'user-1',
        receiverType: 'user',
        parentMessageId: 50,
        messageToReply: reply,
        onSendButtonClick,
      })
    );
    expect(upload.request.clearAll).not.toHaveBeenCalled();

    pending.resolve(undefined);
    await act(() => sending);
    expect(upload.request.clearAll).toHaveBeenCalledTimes(1);
  });

  it('uses a caption override, or converts rich-text HTML into the caption', async () => {
    const { result } = setup({ user: makeUser() });
    stage(result);
    act(() => result.current.setText('ignored'));
    await act(() => result.current.sendBatch('override'));
    expect(batch.sendBatch).toHaveBeenLastCalledWith(
      expect.objectContaining({ caption: 'override' })
    );

    stage(result);
    await act(() => result.current.sendBatch(undefined, '<em>nice</em> shot'));
    expect(batch.sendBatch).toHaveBeenLastCalledWith(
      expect.objectContaining({ caption: '_nice_ shot' })
    );
  });

  it('plays the outgoing sound once for the whole batch', async () => {
    batch.sendBatch.mockImplementation((opts: { onSent: (m: unknown) => void }) => {
      opts.onSent({});
      opts.onSent({});
      opts.onSent({});
      return Promise.resolve();
    });
    const { result } = setup({
      user: makeUser(),
      customSoundForMessage: '/ping.wav',
    });
    stage(result);
    await act(() => result.current.sendBatch());

    expect(sound.play).toHaveBeenCalledTimes(1);
    expect(sound.play).toHaveBeenCalledWith('outgoingMessage', '/ping.wav');
  });

  it('releases the upload request even when the batch send throws', async () => {
    batch.sendBatch.mockRejectedValue(new Error('boom'));
    const { result } = setup({ user: makeUser() });
    stage(result);
    await act(async () => {
      await expect(result.current.sendBatch()).rejects.toThrow('boom');
    });
    expect(upload.request.clearAll).toHaveBeenCalledTimes(1);
  });

  it('swallows a failure to release the upload request', async () => {
    upload.request.clearAll.mockImplementation(() => {
      throw new Error('already released');
    });
    const { result } = setup({ user: makeUser() });
    stage(result);
    await act(async () => {
      await expect(result.current.sendBatch()).resolves.toBeUndefined();
    });
  });

  // Known issue: sendBatch never calls clearMentionedUsers (sendMessage and editMessage do), so mentions picked for a caption ride along on the next text message.
  it.fails('does not carry caption mentions over to the next text message', async () => {
    const mentioned = new Map<string, { uid: string; name: string }>();
    const getMentionedUsers = () => Array.from(mentioned.values());
    const clearMentionedUsers = () => mentioned.clear();
    const { result } = setup({
      user: makeUser(),
      getMentionedUsers,
      clearMentionedUsers,
    });
    stage(result);
    mentioned.set(BOB.uid, BOB);
    await act(() => result.current.sendBatch('look <@uid:bob>'));

    act(() => result.current.setText('plain follow-up'));
    await act(() => result.current.sendMessage());

    expect(sdk.CometChat.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'plain follow-up',
        mentionedUsers: [],
      })
    );
  });
});

describe('editMessage', () => {
  it('edits a text message with mentions and publishes success', async () => {
    const original = textMessage(42, 'old');
    const edited = textMessage(42, 'new <@uid:bob>');
    manager.editTextMessage.mockResolvedValue(edited);
    const clearMentionedUsers = vi.fn();
    const onSendButtonClick = vi.fn();
    const { result, bus } = setup({
      user: makeUser(),
      parentMessageId: 50,
      messageToEdit: original,
      getMentionedUsers: () => [BOB],
      clearMentionedUsers,
      onSendButtonClick,
    });
    await waitFor(() => expect(result.current.isInEditMode).toBe(true));
    expect(bus.publish).toHaveBeenCalledWith({
      type: 'ui:compose/edit',
      message: original,
      status: CometChatMessageStatus.inprogress,
      parentMessageId: 50,
    });

    await act(() => result.current.editMessage(undefined, ' new <@uid:bob> '));

    expect(manager.editTextMessage).toHaveBeenCalledWith(42, 'new <@uid:bob>', [BOB]);
    expect(original).toEqual(
      expect.objectContaining({
        mentionedUsers: [expect.objectContaining({ uid: 'bob' })],
      })
    );
    expect(clearMentionedUsers).toHaveBeenCalled();
    expect(onSendButtonClick).toHaveBeenCalledWith(edited, 'edit');
    expect(bus.publish).toHaveBeenCalledWith({
      type: 'ui:compose/edit',
      message: edited,
      status: CometChatMessageStatus.success,
      parentMessageId: 50,
    });
    expect(result.current.isInEditMode).toBe(false);
  });

  it('edits a media caption from rich-text HTML', async () => {
    const original = mediaMessage(43, 'old caption');
    const getInputFormatters = vi.fn(() => []);
    const { result } = setup({
      user: makeUser(),
      messageToEdit: original,
      getInputFormatters,
    });
    await waitFor(() => expect(result.current.isInEditMode).toBe(true));

    await act(() => result.current.editMessage('<strong>new</strong> caption'));

    expect(getInputFormatters).toHaveBeenCalled();
    expect(manager.editMediaCaption).toHaveBeenCalledWith(43, '**new** caption', []);
    expect(manager.editTextMessage).not.toHaveBeenCalled();
  });

  it('does nothing for blank text or an uninitialised SDK', async () => {
    const original = textMessage(42, 'old');
    const { result } = setup({ user: makeUser(), messageToEdit: original });
    await waitFor(() => expect(result.current.isInEditMode).toBe(true));

    await act(() => result.current.editMessage(undefined, '   '));
    sdk.CometChat.isInitialized.mockReturnValue(false);
    await act(() => result.current.editMessage(undefined, 'new'));

    expect(manager.editTextMessage).not.toHaveBeenCalled();
    expect(result.current.isInEditMode).toBe(true);
  });

  it('publishes an error event for the original message when the edit fails', async () => {
    const original = textMessage(42, 'old');
    const error = new Error('edit rejected');
    manager.editTextMessage.mockRejectedValue(error);
    const onError = vi.fn();
    const { result, bus } = setup({
      user: makeUser(),
      messageToEdit: original,
      onError,
    });
    await waitFor(() => expect(result.current.isInEditMode).toBe(true));

    act(() => result.current.setText('new'));
    await act(() => result.current.editMessage());

    expect(bus.publish).toHaveBeenCalledWith({
      type: 'ui:compose/edit',
      message: original,
      status: CometChatMessageStatus.error,
      parentMessageId: null,
    });
    expect(onError).toHaveBeenCalledWith(error);
    expect(result.current.state.error).toBe('edit rejected');
  });
});

describe('canSend in edit mode', () => {
  it('requires the text to differ from the original unless formatting changed', async () => {
    const { result } = setup({ messageToEdit: textMessage(42, 'same') });
    await waitFor(() => expect(result.current.isInEditMode).toBe(true));

    act(() => result.current.setText('same'));
    expect(result.current.canSend).toBe(false);

    act(() => result.current.setEditDirty(true));
    expect(result.current.state.isEditDirty).toBe(true);
    expect(result.current.canSend).toBe(true);

    act(() => {
      result.current.setEditDirty(false);
      result.current.setText('different');
    });
    expect(result.current.canSend).toBe(true);
  });

  it('compares against the caption when editing a media message', async () => {
    const { result } = setup({ messageToEdit: mediaMessage(43, 'caption') });
    await waitFor(() => expect(result.current.isInEditMode).toBe(true));

    act(() => result.current.setText('caption'));
    expect(result.current.canSend).toBe(false);
    act(() => result.current.setText('caption!'));
    expect(result.current.canSend).toBe(true);
  });
});

describe('closePreview', () => {
  it('cancels an active reply', async () => {
    const reply = textMessage(7, 'reply target');
    const onClosePreview = vi.fn();
    const { result, bus } = setup({
      parentMessageId: 50,
      messageToReply: reply,
      onClosePreview,
    });
    await waitFor(() => expect(result.current.isInReplyMode).toBe(true));

    act(() => result.current.closePreview());

    expect(bus.publish).toHaveBeenCalledWith({
      type: 'ui:compose/reply',
      message: reply,
      status: CometChatMessageStatus.cancelled,
      parentMessageId: 50,
    });
    expect(onClosePreview).toHaveBeenCalledOnce();
    expect(result.current.isInReplyMode).toBe(false);
  });

  it('cancels an active edit', async () => {
    const edit = textMessage(42, 'edit target');
    const { result, bus } = setup({ messageToEdit: edit });
    await waitFor(() => expect(result.current.isInEditMode).toBe(true));

    act(() => result.current.closePreview());

    expect(bus.publish).toHaveBeenCalledWith({
      type: 'ui:compose/edit',
      message: edit,
      status: CometChatMessageStatus.cancelled,
      parentMessageId: null,
    });
    expect(bus.publish).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'ui:compose/reply' })
    );
    expect(result.current.isInEditMode).toBe(false);
  });
});

describe('prop sync and conversation switches', () => {
  it('follows the controlled text and reply props', async () => {
    const reply = textMessage(7, 'reply target');
    const { result, rerender } = setup({ text: 'a' });
    await waitFor(() => expect(result.current.state.text).toBe('a'));

    rerender({ text: 'b', messageToReply: reply });
    await waitFor(() => expect(result.current.state.text).toBe('b'));
    expect(result.current.state.messageToReply).toBe(reply);

    rerender({ text: 'b', messageToReply: null });
    await waitFor(() => expect(result.current.isInReplyMode).toBe(false));
  });

  it('resets the composer and clears mentions when the receiver changes', async () => {
    const clearMentionedUsers = vi.fn();
    const first = { user: makeUser('alice'), clearMentionedUsers };
    const { result, rerender } = setup(first);
    act(() => result.current.setText('draft for alice'));
    expect(clearMentionedUsers).not.toHaveBeenCalled();

    rerender({ user: makeUser('carol'), clearMentionedUsers });
    await waitFor(() => expect(result.current.state.text).toBe(''));
    expect(clearMentionedUsers).toHaveBeenCalledTimes(1);
  });

  it('opens edit mode from the prop only while the tray is empty', () => {
    const edit = textMessage(42, 'edit target');
    const { result, rerender } = setup({});
    act(() => {
      result.current.dispatch({
        type: 'TRAY_ADD',
        items: [trayItem('f1')],
        batchId: 'b',
      });
    });
    rerender({ messageToEdit: edit });
    expect(result.current.isInEditMode).toBe(false);
  });
});

describe('typing indicators', () => {
  it('ends typing 500ms after the last keystroke', async () => {
    vi.useFakeTimers();
    const { result } = setup({ user: makeUser() });
    await act(() => Promise.resolve());
    manager.endTypingIndicator.mockClear();

    act(() => result.current.setText('h'));
    await act(() => Promise.resolve());
    expect(manager.startTypingIndicator).toHaveBeenCalledWith('user-1', 'user');

    await act(() => vi.advanceTimersByTimeAsync(499));
    expect(manager.endTypingIndicator).not.toHaveBeenCalled();
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(manager.endTypingIndicator).toHaveBeenCalledWith('user-1', 'user');
  });

  it('sends no indicators when disabled, logged out, or the user lookup fails', async () => {
    const disabled = setup({ user: makeUser(), disableTypingEvents: true });
    act(() => disabled.result.current.setText('x'));

    sdk.CometChat.getLoggedinUser.mockResolvedValue(null);
    const loggedOut = setup({ user: makeUser() });
    act(() => loggedOut.result.current.setText('x'));

    sdk.CometChat.getLoggedinUser.mockRejectedValue(new Error('no session'));
    const failing = setup({ user: makeUser() });
    act(() => failing.result.current.setText('x'));
    act(() => failing.result.current.setText(''));

    await act(() => Promise.resolve());
    expect(manager.startTypingIndicator).not.toHaveBeenCalled();
    expect(manager.endTypingIndicator).not.toHaveBeenCalled();
  });
});

describe('SDK listeners', () => {
  function requireMessageListener() {
    if (!listeners.message) throw new Error('message listener was not attached');
    return listeners.message;
  }

  it('closes the edit preview when the edited message is deleted elsewhere', async () => {
    const { result } = setup({ messageToEdit: textMessage(42, 'edit target') });
    await waitFor(() => expect(result.current.isInEditMode).toBe(true));

    act(() => {
      requireMessageListener().onMessageEdited();
      requireMessageListener().onMessageDeleted(textMessage(999, 'unrelated'));
    });
    expect(result.current.isInEditMode).toBe(true);

    act(() => requireMessageListener().onMessageDeleted(textMessage(42, '')));
    expect(result.current.isInEditMode).toBe(false);
  });

  it('closes the reply preview when the quoted message is deleted elsewhere', async () => {
    const { result } = setup({
      messageToReply: textMessage(7, 'reply target'),
    });
    await waitFor(() => expect(result.current.isInReplyMode).toBe(true));

    act(() => requireMessageListener().onMessageDeleted(textMessage(999, 'unrelated')));
    expect(result.current.isInReplyMode).toBe(true);

    act(() => requireMessageListener().onMessageDeleted(textMessage(7, '')));
    expect(result.current.isInReplyMode).toBe(false);
  });

  it('clears the error state when the connection is restored', async () => {
    sdk.CometChat.sendMessage.mockRejectedValueOnce(new Error('offline'));
    const { result } = setup({ user: makeUser() });
    act(() => result.current.setText('hi'));
    await act(() => result.current.sendMessage());
    expect(result.current.state.error).toBe('offline');

    const onConnected = listeners.connection;
    if (!onConnected) throw new Error('connection listener was not attached');
    act(() => onConnected());
    expect(result.current.state.error).toBeNull();
  });
});

describe('compose command events', () => {
  const editEvent = (
    message: CometChat.BaseMessage,
    parentMessageId: number | null = null,
    status = CometChatMessageStatus.inprogress
  ): CometChatEvent => ({
    type: 'ui:compose/edit',
    message,
    status,
    parentMessageId,
  });

  const replyEvent = (
    message: CometChat.BaseMessage,
    parentMessageId: number | null = null,
    status:
      | CometChatMessageStatus.inprogress
      | CometChatMessageStatus.cancelled = CometChatMessageStatus.inprogress
  ): CometChatEvent => ({
    type: 'ui:compose/reply',
    message,
    status,
    parentMessageId,
  });

  it('enters edit mode for in-progress text edits and captioned media only', () => {
    const { result, bus } = setup({});
    bus.emit(editEvent(textMessage(1, 'x'), null, CometChatMessageStatus.success));
    bus.emit(editEvent(mediaMessage(2, '   ')));
    expect(result.current.isInEditMode).toBe(false);

    const captioned = mediaMessage(3, 'caption');
    bus.emit(editEvent(captioned));
    expect(result.current.state.textMessageToEdit).toBe(captioned);

    const text = textMessage(4, 'text');
    bus.emit(editEvent(text));
    expect(result.current.state.textMessageToEdit).toBe(text);
  });

  it('ignores edit requests while attachments are staged', () => {
    const { result, bus } = setup({});
    act(() => {
      result.current.dispatch({
        type: 'TRAY_ADD',
        items: [trayItem('f1')],
        batchId: 'b',
      });
    });
    bus.emit(editEvent(textMessage(1, 'x')));
    expect(result.current.isInEditMode).toBe(false);
  });

  it('scopes edit and reply requests to the matching thread', () => {
    const main = setup({});
    main.bus.emit(editEvent(textMessage(1, 'x'), 50));
    main.bus.emit(replyEvent(textMessage(2, 'x'), 50));
    expect(main.result.current.isInEditMode || main.result.current.isInReplyMode).toBe(false);

    const thread = setup({ parentMessageId: 50 });
    thread.bus.emit(editEvent(textMessage(1, 'x')));
    thread.bus.emit(editEvent(textMessage(1, 'x'), 51));
    thread.bus.emit(replyEvent(textMessage(2, 'x')));
    thread.bus.emit(replyEvent(textMessage(2, 'x'), 51));
    expect(thread.result.current.isInEditMode || thread.result.current.isInReplyMode).toBe(false);

    const threadEdit = textMessage(3, 'x');
    const threadReply = textMessage(4, 'x');
    thread.bus.emit(editEvent(threadEdit, 50));
    expect(thread.result.current.state.textMessageToEdit).toBe(threadEdit);
    thread.bus.emit(replyEvent(threadReply, 50));
    expect(thread.result.current.state.messageToReply).toBe(threadReply);
  });

  it('enters reply mode only for in-progress main-conversation replies', () => {
    const reply = textMessage(2, 'x');
    const { result, bus } = setup({});
    bus.emit(replyEvent(reply, null, CometChatMessageStatus.cancelled));
    expect(result.current.isInReplyMode).toBe(false);
    bus.emit(replyEvent(reply));
    expect(result.current.state.messageToReply).toBe(reply);
  });

  it('sets the text and focuses the input with the caret at the end', async () => {
    const onTextChange = vi.fn();
    const { result, bus } = setup({ onTextChange });
    const input = document.createElement('div');
    input.contentEditable = 'true';
    input.tabIndex = 0;
    input.textContent = 'prefilled';
    document.body.appendChild(input);
    result.current.inputRef.current = input;

    bus.emit({ type: 'ui:compose/text', text: 'prefilled' });

    expect(result.current.state.text).toBe('prefilled');
    expect(onTextChange).toHaveBeenCalledWith('prefilled');
    await waitFor(() => expect(document.activeElement).toBe(input));
    const range = window.getSelection()?.getRangeAt(0);
    expect(range).toEqual(
      expect.objectContaining({
        collapsed: true,
        startContainer: input,
        startOffset: input.childNodes.length,
      })
    );
    input.remove();
  });

  it('stops recording when another composer starts recording', () => {
    const bus = createBus();
    const first = setup({}, bus);
    const second = setup({}, bus);

    act(() => first.result.current.setContentToDisplay('voiceRecording'));
    act(() => first.result.current.setRecording(true));
    expect(bus.publish).toHaveBeenCalledWith({
      type: 'ui:compose/recording-started',
      composerInstanceId: expect.any(String),
    });
    expect(first.result.current.state.isRecording).toBe(true);

    act(() => second.result.current.setRecording(true));
    expect(first.result.current.state).toEqual(
      expect.objectContaining({ isRecording: false, contentToDisplay: 'none' })
    );
    expect(second.result.current.state.isRecording).toBe(true);

    act(() => second.result.current.setRecording(false));
    expect(bus.publish).toHaveBeenCalledTimes(2);
  });
});

describe('dragging', () => {
  it('tracks the drag-over state', () => {
    const { result } = setup({});
    act(() => result.current.setDragging(true));
    expect(result.current.state.isDraggingOver).toBe(true);
    act(() => result.current.setDragging(false));
    expect(result.current.state.isDraggingOver).toBe(false);
  });
});
