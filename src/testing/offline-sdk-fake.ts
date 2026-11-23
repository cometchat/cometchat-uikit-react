/**
 * Test double for the Chat SDK's offline surface (SDK 4.3+), installed on top
 * of the real SDK package the suite runs against (4.2.x, which has none of it).
 *
 * It patches the static members the kit feature-detects, records every call,
 * captures the listeners the kit registers so a test can fire outbox, sync and
 * cache-reset events, and restores the SDK exactly on `restore()`.
 *
 * The listener method names are the 4.3.0 SDK's own (`onOutboxMessagePending /
 * Sent / Failed`, `onMessageSyncCompleted`, `onOfflineCacheReset`, ...); a kit
 * that registers other names receives nothing here, as it would on the SDK.
 *
 * @module testing/offline-sdk-fake
 */
/* eslint-disable @typescript-eslint/prefer-promise-reject-errors -- the SDK rejects with plain CometChatException-shaped objects, not Errors */
import { vi } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';

export interface OfflineSdkFakeOptions {
  /** What `isOfflineEnabled()` answers; change it later with `setEnabled`. */
  enabled?: boolean;
  /** Leave these statics absent, to model a partial SDK. */
  omit?: string[];
  /** Model an SDK before the offline release: every offline static absent. */
  absent?: boolean;
}

type Kind = 'offline' | 'sync' | 'cacheReset' | 'media' | 'message' | 'login';
type Listener = Record<string, ((...args: unknown[]) => unknown) | undefined>;
type SendScript = (listener: Listener, message: CometChat.BaseMessage) => void;

export interface OfflineSdkFake {
  calls: { name: string; args: unknown[] }[];
  listeners: Record<Kind, Record<string, Listener>>;
  setEnabled(enabled: boolean): void;
  /** Make the next `send*` call run this script with the per-send listener. */
  scriptSend(script: SendScript): void;
  /** Answer to the next `discardLocalMessage` / `retryMessage`. */
  discardResult: 'ok' | 'reject';
  /**
   * The error code a rejected `discardLocalMessage` / `retryMessage` answers;
   * unset: IN_FLIGHT for a discard, NOT_FOUND for a retry.
   */
  rejectCode?: string;
  /** `'hold'`: `retryMessage` stays unanswered until {@link OfflineSdkFake.settleRetry}. */
  retryResult?: 'hold';
  /** Resolve the oldest held `retryMessage`. */
  settleRetry(): void;
  /** Answer to `getCachedMediaObjectURL`. */
  cachedMediaUrl: string | null;
  /** What `getConnectionStatus()` reports: connected (default) or disconnected. */
  connected: boolean;
  restore(): void;
  /** Fire a callback on every listener of one kind, e.g. ('offline', 'onOutboxMessageSent', m). */
  fire(kind: Kind, method: string, ...args: unknown[]): void;
  callsTo(name: string): unknown[][];
}

const PATCHED = [
  'isOfflineEnabled',
  'addOfflineMessageListener',
  'removeOfflineMessageListener',
  'addSyncListener',
  'removeSyncListener',
  'addOfflineCacheResetListener',
  'addMediaDownloadListener',
  'retryMessage',
  'discardLocalMessage',
  'getPendingMessages',
  'getCachedMediaObjectURL',
  'getMediaCachingMode',
  'downloadMedia',
  'sendMessage',
  'sendMediaMessage',
  'sendCustomMessage',
  'sendInteractiveMessage',
  'addMessageListener',
  'addLoginListener',
  'markConversationAsRead',
  'markAsRead',
  'getConnectionStatus',
  'OfflineCacheResetReason',
  'MessageSentListener',
  'OfflineMessageListener',
  'SyncListener',
  'OfflineCacheResetListener',
  'MediaDownloadListener',
  'MessageFetchListener',
  'ConversationFetchListener',
  'UserFetchListener',
  'GroupFetchListener',
  'GroupMemberFetchListener',
  'BannedMemberFetchListener',
  'ReactionFetchListener',
  'NotificationFeedFetchListener',
  'ThreadFetchListener',
];

const LISTENER_CLASSES = [
  'MessageSentListener',
  'OfflineMessageListener',
  'SyncListener',
  'OfflineCacheResetListener',
  'MediaDownloadListener',
  'MessageFetchListener',
  'ConversationFetchListener',
  'UserFetchListener',
  'GroupFetchListener',
  'GroupMemberFetchListener',
  'BannedMemberFetchListener',
  'ReactionFetchListener',
  'NotificationFeedFetchListener',
  'ThreadFetchListener',
];

export interface OfflineMessageState {
  id?: number;
  localMessageId?: string;
  status?: string;
  source?: string;
  failureReason?: string;
  muid?: string;
  sentAt?: number;
  updatedAt?: number;
}

/** A real SDK message with the offline getters the 4.3 SDK adds. */
export function offlineMessage<T extends CometChat.BaseMessage>(
  message: T,
  state: OfflineMessageState = {}
): T {
  const m = message as unknown as Record<string, unknown> & {
    setId(id: number): void;
    setMuid(muid: string): void;
    setSentAt(sentAt: number): void;
  };
  let status = state.status;
  if (state.id !== undefined) m.setId(state.id);
  if (state.muid !== undefined) m.setMuid(state.muid);
  if (state.sentAt !== undefined) m.setSentAt(state.sentAt);
  if (state.updatedAt !== undefined) m.getUpdatedAt = () => state.updatedAt;
  m.getLocalMessageId = () => state.localMessageId ?? '';
  m.getStatus = () => status ?? '';
  m.setStatus = (value: string) => {
    status = value;
  };
  m.getSource = () => state.source ?? '';
  m.getFailureReason = () => state.failureReason ?? '';
  return message;
}

export function textMessage(
  text: string,
  receiverId = 'peer',
  receiverType: string = CometChat.RECEIVER_TYPE.USER,
  senderUid = 'me'
): CometChat.TextMessage {
  const m = new CometChat.TextMessage(receiverId, text, receiverType);
  m.setSender(new CometChat.User({ uid: senderUid, name: senderUid }));
  return m;
}

export function installOfflineSdk(options: OfflineSdkFakeOptions = {}): OfflineSdkFake {
  const sdk = CometChat as unknown as Record<string, unknown>;
  const saved = new Map<string, PropertyDescriptor | undefined>();
  for (const name of PATCHED) saved.set(name, Object.getOwnPropertyDescriptor(sdk, name));
  let enabled = options.enabled ?? true;
  const omit = new Set(
    options.absent
      ? PATCHED.filter(
          n =>
            !n.startsWith('send') &&
            n !== 'addMessageListener' &&
            n !== 'addLoginListener' &&
            n !== 'markConversationAsRead' &&
            n !== 'markAsRead' &&
            n !== 'getConnectionStatus'
        )
      : (options.omit ?? [])
  );
  const scripts: SendScript[] = [];
  const heldRetries: (() => void)[] = [];
  const fake: OfflineSdkFake = {
    calls: [],
    listeners: { offline: {}, sync: {}, cacheReset: {}, media: {}, message: {}, login: {} },
    discardResult: 'ok',
    cachedMediaUrl: null,
    connected: true,
    setEnabled(value) {
      enabled = value;
    },
    scriptSend(script) {
      scripts.push(script);
    },
    settleRetry() {
      heldRetries.shift()?.();
    },
    restore() {
      for (const [name, descriptor] of saved) {
        if (descriptor) Object.defineProperty(sdk, name, descriptor);
        else Reflect.deleteProperty(sdk, name);
      }
    },
    fire(kind, method, ...args) {
      for (const listener of Object.values(fake.listeners[kind])) listener[method]?.(...args);
    },
    callsTo(name) {
      return fake.calls.filter(c => c.name === name).map(c => c.args);
    },
  };
  const record = (name: string, args: unknown[]) => fake.calls.push({ name, args });
  const define = (name: string, value: unknown) => {
    if (omit.has(name)) {
      Reflect.deleteProperty(sdk, name);
      return;
    }
    Object.defineProperty(sdk, name, { value, configurable: true, writable: true });
  };
  // The SDK's listener classes copy their handlers onto the instance.
  // eslint-disable-next-line @typescript-eslint/no-extraneous-class
  class Holder {
    constructor(handlers: Record<string, unknown>) {
      Object.assign(this, handlers);
    }
  }
  for (const name of LISTENER_CLASSES) define(name, Holder);
  const registrar = (kind: Kind, name: string) => (id: string, l: Listener) => {
    record(name, [id]);
    fake.listeners[kind][id] = l;
  };
  define('isOfflineEnabled', () => enabled);
  // The 4.3.1 shape. SCHEMA_RESET is the member the kit's SDK floor probes for
  // (gate.ts hasOfflineSdk); `omit: ['OfflineCacheResetReason']` models published
  // 4.3.0, whose enum has every other reason but not this one.
  define('OfflineCacheResetReason', {
    KEY_LOST: 'KEY_LOST',
    WRONG_KEY: 'WRONG_KEY',
    CORRUPTED: 'CORRUPTED',
    ESCALATED: 'ESCALATED',
    ENCRYPTION_CHANGED: 'ENCRYPTION_CHANGED',
    SCHEMA_RESET: 'SCHEMA_RESET',
  });
  define('addOfflineMessageListener', registrar('offline', 'addOfflineMessageListener'));
  define('removeOfflineMessageListener', (id: string) => {
    record('removeOfflineMessageListener', [id]);
    Reflect.deleteProperty(fake.listeners.offline, id);
  });
  define('addSyncListener', registrar('sync', 'addSyncListener'));
  define('removeSyncListener', (id: string) => {
    record('removeSyncListener', [id]);
    Reflect.deleteProperty(fake.listeners.sync, id);
  });
  define('addOfflineCacheResetListener', registrar('cacheReset', 'addOfflineCacheResetListener'));
  define('addMediaDownloadListener', registrar('media', 'addMediaDownloadListener'));
  define('addMessageListener', registrar('message', 'addMessageListener'));
  define('addLoginListener', registrar('login', 'addLoginListener'));
  define(
    'markConversationAsRead',
    vi.fn((id: string, type: string) => {
      record('markConversationAsRead', [id, type]);
      return Promise.resolve('ok');
    })
  );
  define(
    'markAsRead',
    vi.fn((message: { getId?: () => number }) => {
      record('markAsRead', [message.getId?.() ?? 0]);
      return Promise.resolve('ok');
    })
  );
  define('getConnectionStatus', () =>
    fake.connected
      ? ((CometChat as unknown as { CONNECTION_STATUS?: { CONNECTED?: string } }).CONNECTION_STATUS
          ?.CONNECTED ?? 'connected')
      : 'disconnected'
  );
  define('getPendingMessages', () => Promise.resolve([]));
  define('getMediaCachingMode', () => 'AUTO');
  define('downloadMedia', (attachment: unknown, callback?: unknown) => {
    record('downloadMedia', [attachment, callback]);
  });
  define('getCachedMediaObjectURL', (attachment: unknown) => {
    record('getCachedMediaObjectURL', [attachment]);
    return Promise.resolve(fake.cachedMediaUrl);
  });
  define('retryMessage', (localId: string, listener?: Listener) => {
    record('retryMessage', [localId, listener]);
    if (fake.retryResult === 'hold') {
      return new Promise<void>(resolve => {
        heldRetries.push(resolve);
      });
    }
    return fake.discardResult === 'ok'
      ? Promise.resolve()
      : Promise.reject({ code: fake.rejectCode ?? 'ERROR_OFFLINE_MESSAGE_NOT_FOUND' });
  });
  define('discardLocalMessage', (localId: string) => {
    record('discardLocalMessage', [localId]);
    return fake.discardResult === 'ok'
      ? Promise.resolve()
      : Promise.reject({ code: fake.rejectCode ?? 'ERROR_OFFLINE_MESSAGE_IN_FLIGHT' });
  });
  const send = (name: string) => (message: CometChat.BaseMessage, listener?: Listener) => {
    record(name, [message, listener]);
    const script = scripts.shift();
    if (script && listener) script(listener, message);
    // The SDK's Promise: offline it rejects even for a queued send.
    return Promise.reject({ code: 'FAILED_TO_FETCH' });
  };
  define('sendMessage', send('sendMessage'));
  define('sendMediaMessage', send('sendMediaMessage'));
  define('sendCustomMessage', send('sendCustomMessage'));
  define('sendInteractiveMessage', send('sendInteractiveMessage'));
  return fake;
}

/** Scripts for the per-send listener, as the 4.3.0 SDK behaves. */
export const sendScripts = {
  /** Offline: pending, then the not-connected notice while the row stays PENDING. */
  queued(localMessageId: string): SendScript {
    return (listener, message) => {
      offlineMessage(message, { localMessageId, status: 'PENDING' });
      listener.onMessagePending?.(message);
      listener.onError?.({ code: 'FAILED_TO_FETCH' });
    };
  },
  /**
   * Queued behind an earlier unsent message of the same chat (SDK R77):
   * pending only, then silence until the outbox sends or fails it.
   */
  queuedBehind(localMessageId: string): SendScript {
    return (listener, message) => {
      offlineMessage(message, { localMessageId, status: 'PENDING' });
      listener.onMessagePending?.(message);
    };
  },
  /** Online: pending, then sent with a server id. */
  sent(localMessageId: string, id: number): SendScript {
    return (listener, message) => {
      offlineMessage(message, { localMessageId, status: 'PENDING' });
      listener.onMessagePending?.(message);
      (message as unknown as { setStatus(s: string): void }).setStatus('SENT');
      message.setId(id);
      listener.onMessageSent?.(message);
    };
  },
  /**
   * The outbox refuses a send because `maxPendingMessages` are already waiting,
   * exactly as the 4.3.0 SDK does: the message is stamped with its local id,
   * there is no pending callback, and the per-send `onError` gets Android's
   * code (`ERROR_PENDING_QUEUE_LIMIT`), not the `QUEUE_FULL` reason. The global
   * `onOutboxMessageFailed(message, 'QUEUE_FULL')` follows; fire it from the
   * test with `fake.fire('offline', 'onOutboxMessageFailed', message, 'QUEUE_FULL')`.
   */
  queueFull(localMessageId: string, cap = 2): SendScript {
    return (listener, message) => {
      offlineMessage(message, { localMessageId, status: 'FAILED', failureReason: 'QUEUE_FULL' });
      listener.onError?.({
        code: 'ERROR_PENDING_QUEUE_LIMIT',
        name: 'ERROR_PENDING_QUEUE_LIMIT',
        message: `The message was not queued: ${String(cap)} messages are already waiting to send (maxPendingMessages). Nothing queued was lost.`,
        details: { maxPendingMessages: cap },
      });
    };
  },
  /** Not queued at all: an error with no pending first. */
  refused(code: string): SendScript {
    return listener => {
      listener.onError?.({ code });
    };
  },
};

/** One call to a {@link scriptedRead} fetch: drive its phases from the test. */
export interface ScriptedReadCall {
  /** The listener the kit passed (absent for today's Promise-form call). */
  listener: Listener | undefined;
  /** Every argument the kit passed. */
  args: unknown[];
  /** Fire `onCached<Suffix>(rows)` (no-op for a Promise-form call). */
  cached(rows: unknown[]): void;
  /** Fire `onServer<Suffix>(rows)` and resolve the returned Promise with them. */
  server(rows: unknown[]): void;
  /** Fire `onError(error)` and reject the returned Promise (offline: the not-connected code). */
  fail(error?: unknown): void;
}

export interface ScriptedRead {
  /** The fetch function to install as `fetchNext` / `fetchPrevious` on a request. */
  fn: ReturnType<typeof vi.fn>;
  calls: ScriptedReadCall[];
  /** The newest call. */
  last(): ScriptedReadCall;
}

/**
 * A request fetch whose phases the test drives, as the 4.3 SDK delivers them:
 * the listener's `onCached<Suffix>` / `onServer<Suffix>` / `onError`, and the
 * returned Promise that settles on the server phase (rejects offline).
 * `suffix` is the handler suffix, e.g. 'Users', 'GroupMembers', 'Reactions'.
 */
export function scriptedRead(suffix: string): ScriptedRead {
  const calls: ScriptedReadCall[] = [];
  const fn = vi.fn((...args: unknown[]) => {
    const listener = args[0] as Listener | undefined;
    let resolve: (rows: unknown[]) => void = () => undefined;
    let reject: (error: unknown) => void = () => undefined;
    const promise = new Promise<unknown[]>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    // The kit may ignore the Promise on the listener path; never leave it unhandled.
    promise.catch(() => undefined);
    calls.push({
      listener,
      args,
      cached(rows) {
        listener?.[`onCached${suffix}`]?.(rows);
      },
      server(rows) {
        listener?.[`onServer${suffix}`]?.(rows);
        resolve(rows);
      },
      fail(error = { code: 'FAILED_TO_FETCH' }) {
        listener?.onError?.(error);
        reject(error);
      },
    });
    return promise;
  });
  return {
    fn,
    calls,
    last() {
      const call = calls[calls.length - 1];
      if (!call) throw new Error('scriptedRead: no call yet');
      return call;
    },
  };
}
