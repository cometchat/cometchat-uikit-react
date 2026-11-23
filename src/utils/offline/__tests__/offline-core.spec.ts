/**
 * The offline core: gate, identity, reconcile, hub (registration, dedupe,
 * session) and the send state machine, against a fake offline SDK patched onto
 * the real 4.2.x package (which has no offline surface of its own).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { hasSdkFunction, isOfflineOn } from '../gate';
import { isUnsent, localIdOf, renderKey, rowKey, serverIdOf, statusOf } from '../identity';
import { createStreamingMessage } from '../../CometChatStreamingMessageFactory';
import {
  cachedKeysOf,
  compareRows,
  dropUnjoinedCachedPage,
  HeldReceipts,
  newestServerId,
  oldestServerId,
  reconcileServerPage,
  upsertSorted,
} from '../reconcile';
import { OfflineHub, type SendStateEvent } from '../hub';
import {
  discardUnsentMessage,
  QUEUED_ANSWER_WAIT_MS,
  retryFailedMessage,
  sendWithState,
  sendWithStatePromise,
} from '../send';
import { offlineRowStateOf, unsentActionsOf } from '../rowState';
import { getLocalizedPlural, offlineNoticeText } from '../notices';
import {
  installOfflineSdk,
  offlineMessage,
  sendScripts,
  textMessage,
  type OfflineSdkFake,
} from '../../../testing/offline-sdk-fake';
import type { CometChatUIEvent } from '../../../context/CometChatEvents.types';
import { CometChatMessageStatus } from '../../../context/CometChatEvents.types';

function row(id: number, sentAt: number, extra: Parameters<typeof offlineMessage>[1] = {}) {
  return offlineMessage(textMessage(`m${String(id)}`), { id, sentAt, ...extra });
}

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

describe('offline gate (UIK-GATE-01/04)', () => {
  it('is off on an SDK without the offline surface (4.2.x)', () => {
    const fake = installOfflineSdk({ absent: true });
    try {
      expect(isOfflineOn()).toBe(false);
      expect(hasSdkFunction('addOfflineMessageListener')).toBe(false);
    } finally {
      fake.restore();
    }
  });

  it('reads the SDK at every call: no cached flag', () => {
    const fake = installOfflineSdk({ enabled: true });
    try {
      expect(isOfflineOn()).toBe(true);
      fake.setEnabled(false);
      expect(isOfflineOn()).toBe(false);
      fake.setEnabled(true);
      expect(isOfflineOn()).toBe(true);
    } finally {
      fake.restore();
    }
  });

  it('answers false when isOfflineEnabled throws', () => {
    const fake = installOfflineSdk();
    Object.defineProperty(CometChat, 'isOfflineEnabled', {
      value: () => {
        throw new Error('store closed');
      },
      configurable: true,
      writable: true,
    });
    try {
      expect(isOfflineOn()).toBe(false);
    } finally {
      fake.restore();
    }
  });
});

describe('row identity (§3.2)', () => {
  it('server id once acked, then local handle, then muid', () => {
    const acked = row(7, 1);
    const queued = offlineMessage(textMessage('q'), { localMessageId: 'L1', muid: 'M1' });
    const optimistic = offlineMessage(textMessage('o'), { muid: 'M2' });
    expect(rowKey(acked)).toBe('s:7');
    expect(rowKey(queued)).toBe('l:L1');
    expect(rowKey(optimistic)).toBe('m:M2');
  });

  it('falls back to data.localMessageId on a server-parsed copy (A4)', () => {
    const m = textMessage('x');
    m.setData({ localMessageId: 'L9' } as never);
    expect(localIdOf(m)).toBe('L9');
  });

  it('never reads getStatus for a call (A11)', () => {
    const call = new CometChat.Call('peer', 'audio', 'user');
    (call as unknown as { getStatus: () => string }).getStatus = () => 'initiated';
    expect(statusOf(call)).toBe('');
  });

  it("an own message keeps one render key from compose to ack; others' use the server id", () => {
    const own = offlineMessage(textMessage('hi'), { muid: 'M1' });
    const before = renderKey(own, 'me');
    offlineMessage(own, { muid: 'M1', localMessageId: 'L1', status: 'PENDING' });
    expect(renderKey(own, 'me')).toBe(before);
    own.setId(42);
    expect(renderKey(own, 'me')).toBe(before);
    const other = row(5, 1);
    other.setSender(new CometChat.User({ uid: 'peer', name: 'peer' }));
    expect(renderKey(other, 'me')).toBe('s:5');
  });

  it('the AI streaming placeholder keeps one key, its negative id, as it does with offline off', () => {
    const placeholder = createStreamingMessage({
      originalMessageId: 77,
      sender: new CometChat.User({ uid: 'agent', name: 'Agent' }),
      receiver: new CometChat.User({ uid: 'me', name: 'me' }),
      chatId: 'me_user_agent',
    });
    // The regression: the key fell back to the factory's muid, a fresh
    // `Date.now()` on every call, so the bubble remounted on every render.
    expect(renderKey(placeholder, 'me')).toBe('s:-77');
    expect(renderKey(placeholder, 'me')).toBe('s:-77');
    // The key the list uses with offline off.
    expect(String(placeholder.getId() || placeholder.getMuid())).toBe('-77');
  });

  it('unsent = queued/sending/failed status, or a local handle without a server id', () => {
    expect(isUnsent(offlineMessage(textMessage('a'), { status: 'PENDING' }))).toBe(true);
    expect(isUnsent(offlineMessage(textMessage('b'), { status: 'FAILED' }))).toBe(true);
    expect(isUnsent(offlineMessage(textMessage('c'), { localMessageId: 'L' }))).toBe(true);
    expect(isUnsent(row(3, 1))).toBe(false);
  });
});

describe('windowed reconcile (§3.3)', () => {
  it('orders sent rows by (sentAt, id) and keeps unsent rows last', () => {
    const unsent = offlineMessage(textMessage('u'), { localMessageId: 'L', sentAt: 1 });
    const rows = upsertSorted([], [row(3, 30), unsent, row(1, 10), row(2, 10)]).rows;
    expect(rows.map(m => serverIdOf(m))).toEqual([1, 2, 3, 0]);
    expect(compareRows(row(9, 1), unsent)).toBeLessThan(0);
  });

  it('upserts by identity and never reverts a newer copy', () => {
    const newer = row(5, 10, { updatedAt: 200 });
    const older = row(5, 10, { updatedAt: 100 });
    const result = upsertSorted([newer], [older]);
    expect(result.changed).toBe(false);
    expect(result.rows[0]).toBe(newer);
  });

  it('a pending row is replaced in place by its ack (same local handle)', () => {
    const pending = offlineMessage(textMessage('p'), {
      localMessageId: 'L1',
      muid: 'M1',
      sentAt: 5,
    });
    const acked = offlineMessage(textMessage('p'), {
      localMessageId: 'L1',
      muid: 'M1',
      id: 9,
      sentAt: 5,
    });
    const rows = upsertSorted([row(1, 1), pending], [acked]).rows;
    expect(rows).toHaveLength(2);
    expect(serverIdOf(rows[1])).toBe(9);
  });

  it('removes only proven omissions inside the server page range, never unsent rows', () => {
    const cached = [row(1, 1), row(2, 2), row(3, 3), row(4, 4)];
    const unsent = offlineMessage(textMessage('u'), { localMessageId: 'L' });
    const outside = row(9, 9);
    const keys = cachedKeysOf(cached);
    const server = [row(1, 1), row(3, 3), row(4, 4)];
    const result = reconcileServerPage([...cached, outside, unsent], keys, server);
    expect(result.rows.map(m => serverIdOf(m))).toEqual([1, 3, 4, 9, 0]);
  });

  it('D13-R2: a cached page that shares no row with the server page is dropped beyond its far end; unsent and listed rows stay', () => {
    const unsent = offlineMessage(textMessage('u'), { localMessageId: 'L' });
    const listed = row(5, 5);
    const ids = (rows: CometChat.BaseMessage[]) => rows.map(m => serverIdOf(m));
    const painted = Array.from(cachedKeysOf([row(1, 1), row(2, 2)]));
    const rawCached = [...painted, rowKey(listed)];
    const server = [row(71, 71), row(72, 72)];
    const rows = [row(1, 1), row(2, 2), listed, ...server, unsent];
    expect(ids(dropUnjoinedCachedPage(rows, painted, rawCached, server, 'previous'))).toEqual([
      5, 71, 72, 0,
    ]);
    // A shared row (here one the client filter hid) is a join: nothing is dropped.
    const joined = [...server, row(2, 2)];
    const kept = dropUnjoinedCachedPage(rows, painted, rawCached, joined, 'previous');
    expect(ids(kept)).toEqual(ids(rows));
    // An empty server page proves nothing.
    expect(dropUnjoinedCachedPage(rows, painted, rawCached, [], 'previous')).toBe(rows);
    // A newer read drops the painted rows beyond its newest edge.
    const newer = [row(1, 1), row(90, 90), unsent];
    const newerKeys = Array.from(cachedKeysOf([row(90, 90)]));
    expect(ids(dropUnjoinedCachedPage(newer, newerKeys, newerKeys, server, 'next'))).toEqual([1, 0]);
  });

  it('cursors anchor on rows with a server id (UIK-READ-06)', () => {
    const unsent = offlineMessage(textMessage('u'), { localMessageId: 'L' });
    expect(newestServerId([row(4, 1), row(6, 2), unsent])).toBe(6);
    expect(oldestServerId([unsent, row(4, 1)])).toBe(4);
  });

  it('holds receipts, never downgrades read, and caps at 200', () => {
    const held = new HeldReceipts();
    held.hold(10, { receiptType: 'read', timestamp: 5 });
    held.hold(10, { receiptType: 'delivered', timestamp: 6 });
    expect(held.take(10)).toEqual({ receiptType: 'read', timestamp: 5 });
    for (let i = 1; i <= 205; i++) held.hold(i, { receiptType: 'delivered', timestamp: i });
    expect(held.size).toBe(200);
    expect(held.take(1)).toBeUndefined();
  });
});

describe('OfflineHub (§3.5)', () => {
  let fake: OfflineSdkFake;
  let published: CometChatUIEvent[];

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk({ enabled: true });
    published = [];
    OfflineHub.getInstance().setPublicEmit(e => published.push(e));
  });

  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
  });

  it('registers each SDK listener once, under its own id, with the 4.3.0 method names', () => {
    const hub = OfflineHub.getInstance();
    hub.start();
    hub.start();
    expect(fake.callsTo('addOfflineMessageListener')).toHaveLength(1);
    expect(fake.callsTo('addSyncListener')).toHaveLength(1);
    expect(fake.callsTo('addOfflineCacheResetListener')).toHaveLength(1);
    const ids = [
      ...fake.callsTo('addOfflineMessageListener'),
      ...fake.callsTo('addSyncListener'),
      ...fake.callsTo('addOfflineCacheResetListener'),
      ...fake.callsTo('addMediaDownloadListener'),
      ...fake.callsTo('addMessageListener'),
      ...fake.callsTo('addLoginListener'),
    ].map(args => args[0]);
    expect(new Set(ids).size).toBe(ids.length);
    const outbox = Object.values(fake.listeners.offline)[0];
    expect(typeof outbox?.onOutboxMessagePending).toBe('function');
    expect(typeof outbox?.onOutboxMessageSent).toBe('function');
    expect(typeof outbox?.onOutboxMessageFailed).toBe('function');
  });

  it('registers nothing on an SDK without offline support, and init still succeeds', () => {
    fake.restore();
    fake = installOfflineSdk({ absent: true });
    OfflineHub.getInstance().start();
    expect(fake.calls).toHaveLength(0);
  });

  it('registers even while offline is off (inert listeners)', () => {
    fake.setEnabled(false);
    OfflineHub.getInstance().start();
    expect(fake.callsTo('addOfflineMessageListener')).toHaveLength(1);
  });

  it('per-call and outbox signals for one send make exactly one public event per transition', () => {
    const hub = OfflineHub.getInstance();
    hub.start();
    const m = offlineMessage(textMessage('x'), {
      localMessageId: 'L1',
      muid: 'M1',
      status: 'PENDING',
    });
    const states: SendStateEvent[] = [];
    hub.sendState.subscribe(e => states.push(e));
    hub.reportSendState(m, 'sending', { announced: true });
    fake.fire('offline', 'onOutboxMessagePending', m);
    m.setId(10);
    hub.reportSendState(m, 'sent');
    fake.fire('offline', 'onOutboxMessageSent', m);
    expect(states.map(s => s.state)).toEqual(['sending', 'sent']);
    const sent = published.filter(e => e.type === 'ui:message/sent');
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ status: 'success' });
    expect(published.filter(e => e.type === 'ui:message/send-state-changed')).toHaveLength(2);
  });

  it('a retry re-announces inprogress publicly (failed → sending), forward-only after sent', () => {
    const hub = OfflineHub.getInstance();
    const m = offlineMessage(textMessage('x'), { localMessageId: 'L2', muid: 'M2' });
    hub.reportSendState(m, 'sending', { announced: true });
    hub.reportSendState(m, 'failed', { reason: 'PERMANENT' });
    hub.reportSendState(m, 'sending');
    hub.reportSendState(m, 'sent');
    expect(hub.reportSendState(m, 'failed')).toBe(false);
    const statuses = published
      .filter(e => e.type === 'ui:message/sent')
      .map(e => (e as { status: string }).status);
    expect(statuses).toEqual(['error', 'inprogress', 'success']);
  });

  it('outbox DISCARDED removes the row and raises one notice; QUEUE_FULL is failed (direct)', () => {
    const hub = OfflineHub.getInstance();
    hub.start();
    const notices: string[] = [];
    hub.notice.subscribe(n => notices.push(n.kind));
    const states: SendStateEvent[] = [];
    hub.sendState.subscribe(e => states.push(e));
    const a = offlineMessage(textMessage('a'), { localMessageId: 'LA', muid: 'MA' });
    const b = offlineMessage(textMessage('b'), { localMessageId: 'LB', muid: 'MB' });
    fake.fire('offline', 'onOutboxMessageFailed', a, 'DISCARDED');
    fake.fire('offline', 'onOutboxMessageFailed', a, 'DISCARDED');
    fake.fire('offline', 'onOutboxMessageFailed', b, 'QUEUE_FULL');
    expect(states.map(s => [s.state, s.direct])).toEqual([
      ['discarded', undefined],
      ['failed', true],
    ]);
    expect(notices).toEqual(['unsent_message_removed', 'queue_full']);
    expect(hub.directFailureOf(b)).toBe('QUEUE_FULL');
  });

  it('cache reset bumps gen, emits the public event and the right notice', () => {
    const hub = OfflineHub.getInstance();
    hub.start();
    const notices: string[] = [];
    hub.notice.subscribe(n => notices.push(n.kind));
    const gen = hub.gen;
    fake.fire('cacheReset', 'onOfflineCacheReset', 'SCHEMA_CHANGED', 2);
    fake.fire('cacheReset', 'onOfflineCacheReset', 'SCHEMA_CHANGED', -1);
    fake.fire('cacheReset', 'onOfflineCacheReset', 'ENCRYPTION_CHANGED', -1);
    fake.fire('cacheReset', 'onOfflineCacheReset', 'SCHEMA_CHANGED', 0);
    expect(hub.gen).toBe(gen + 4);
    expect(notices).toEqual(['unsent_messages_lost', 'unsent_messages_maybe_lost']);
    expect(published.find(e => e.type === 'ui:offline/cache-reset')).toMatchObject({
      reason: 'SCHEMA_CHANGED',
      pendingMessagesLost: 2,
    });
  });

  it('a reset whose lost sends were each reported does not also raise the "N lost" notice (D5)', () => {
    const hub = OfflineHub.getInstance();
    hub.start();
    const notices: string[] = [];
    hub.notice.subscribe(n => notices.push(n.kind));
    const a = offlineMessage(textMessage('a'), { localMessageId: 'LD1', muid: 'MD1' });
    const b = offlineMessage(textMessage('b'), { localMessageId: 'LD2', muid: 'MD2' });

    // The order the SDK uses: each lost send as DISCARDED, then the reset with
    // their count, in one turn (`OfflineRuntime.ts:2615`).
    fake.fire('offline', 'onOutboxMessageFailed', a, 'DISCARDED');
    fake.fire('offline', 'onOutboxMessageFailed', b, 'DISCARDED');
    fake.fire('cacheReset', 'onOfflineCacheReset', 'ENCRYPTION_CHANGED', 2);

    // Two notices that name their chat, not a third saying "2 messages lost".
    expect(notices).toEqual(['unsent_message_removed', 'unsent_message_removed']);
  });

  it('a reset is still announced when no DISCARDED reached the hub (D5)', async () => {
    const hub = OfflineHub.getInstance();
    hub.start();
    const notices: string[] = [];
    hub.notice.subscribe(n => notices.push(n.kind));
    const a = offlineMessage(textMessage('a'), { localMessageId: 'LD3', muid: 'MD3' });
    fake.fire('offline', 'onOutboxMessageFailed', a, 'DISCARDED');
    // A later turn: this reset's own lost sends were never reported here, so
    // the count is the only thing the user has.
    await flush();
    notices.length = 0;

    fake.fire('cacheReset', 'onOfflineCacheReset', 'ENCRYPTION_CHANGED', 3);

    expect(notices).toEqual(['unsent_messages_lost']);
  });

  it('logout clears marks and bumps gen; a user switch does too; a same-uid login does not', () => {
    const hub = OfflineHub.getInstance();
    hub.start();
    const m = offlineMessage(textMessage('x'), { muid: 'MX' });
    hub.markDirectFailed(m, 'QUEUE_FULL');
    hub.onLogin(new CometChat.User({ uid: 'me', name: 'me' }));
    const gen = hub.gen;
    fake.fire('login', 'loginSuccess', new CometChat.User({ uid: 'me', name: 'me' }));
    expect(hub.gen).toBe(gen);
    fake.fire('login', 'loginSuccess', new CometChat.User({ uid: 'other', name: 'other' }));
    expect(hub.gen).toBe(gen + 1);
    expect(hub.directFailureOf(m)).toBeUndefined();
    fake.fire('login', 'logoutSuccess');
    expect(hub.gen).toBe(gen + 2);
  });

  it('`login` says when someone is signed in after a session ended, and only then', () => {
    // The lists that clear themselves on `session` read again from this
    // (Prajwal `useCometChatConversations.ts:849`): nothing for the first login
    // of the process, or for the same user signed in again.
    const hub = OfflineHub.getInstance();
    hub.start();
    const logins: number[] = [];
    hub.login.subscribe(gen => logins.push(gen));
    const user = (uid: string) => new CometChat.User({ uid, name: uid });

    hub.onLogin(user('me'));
    expect(logins).toEqual([]);
    fake.fire('login', 'loginSuccess', user('me'));
    expect(logins).toEqual([]);

    // A user switch: the old session ends and the new user is signed in.
    fake.fire('login', 'loginSuccess', user('other'));
    expect(logins).toEqual([hub.gen]);

    // A logout on its own says nothing; the login after it does.
    fake.fire('login', 'logoutSuccess');
    expect(logins).toHaveLength(1);
    fake.fire('login', 'loginSuccess', user('third'));
    expect(logins).toEqual([logins[0], hub.gen]);
  });

  it('flushes reads made offline after the message sweep', () => {
    const hub = OfflineHub.getInstance();
    hub.start();
    hub.rememberReadWhileOffline('peer', 'user');
    fake.fire('sync', 'onMessageSyncCompleted', [], 'CAUGHT_UP');
    expect(fake.callsTo('markConversationAsRead')).toEqual([['peer', 'user']]);
  });

  it('flushes a read made offline up to the message the user actually read', () => {
    // Read chat X offline at its newest message (id 10). Three peer messages
    // arrive during the outage. Clearing the WHOLE conversation on reconnect
    // marked those three read too, so the user was never told about them —
    // on this device or any other (Aanshi N1 on #2460).
    const hub = OfflineHub.getInstance();
    hub.start();
    hub.rememberReadWhileOffline('peer', 'user', row(10, 1000) as unknown as CometChat.BaseMessage);
    fake.fire('sync', 'onMessageSyncCompleted', [], 'CAUGHT_UP');
    expect(fake.callsTo('markAsRead')).toEqual([[10]]);
    expect(fake.callsTo('markConversationAsRead')).toEqual([]);
  });

  it('keeps the furthest mark when the same chat is read again', () => {
    const hub = OfflineHub.getInstance();
    hub.start();
    hub.rememberReadWhileOffline('peer', 'user', row(10, 1000) as unknown as CometChat.BaseMessage);
    hub.rememberReadWhileOffline('peer', 'user', row(14, 1400) as unknown as CometChat.BaseMessage);
    // A later read with no mark of its own must not throw the one we have away.
    hub.rememberReadWhileOffline('peer', 'user');
    expect(hub.readMarkFor('peer', 'user')?.getId()).toBe(14);
    fake.fire('sync', 'onMessageSyncCompleted', [], 'CAUGHT_UP');
    expect(fake.callsTo('markAsRead')).toEqual([[14]]);
  });

  it('clears the whole chat only when there is no mark to read up to', () => {
    const hub = OfflineHub.getInstance();
    hub.start();
    hub.rememberReadWhileOffline('peer', 'user');
    fake.fire('sync', 'onMessageSyncCompleted', [], 'CAUGHT_UP');
    expect(fake.callsTo('markConversationAsRead')).toEqual([['peer', 'user']]);
    expect(fake.callsTo('markAsRead')).toEqual([]);
  });

  it('a flush that settles after a user switch changes nothing in the new session', async () => {
    // The result carried the generation read when it SETTLED, so a read that
    // landed after a logout zeroed a same-id chat in the next user's list, and
    // a rejection re-armed the previous user's read (Aanshi F2 on #2460).
    const hub = OfflineHub.getInstance();
    hub.start();
    const read: unknown[] = [];
    hub.conversationRead.subscribe(event => read.push(event));
    let settle: (value: unknown) => void = () => undefined;
    const markConversationAsRead = (CometChat as unknown as Record<string, unknown>)
      .markConversationAsRead as {
      mockImplementationOnce: (fn: () => Promise<unknown>) => void;
    };
    markConversationAsRead.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          settle = resolve;
        })
    );
    hub.rememberReadWhileOffline('peer', 'user');
    fake.fire('sync', 'onMessageSyncCompleted', [], 'CAUGHT_UP');
    // The user switches before the read lands.
    fake.fire('login', 'logoutSuccess');
    fake.fire('login', 'loginSuccess', new CometChat.User({ uid: 'next', name: 'next' }));
    settle('ok');
    await Promise.resolve();
    await Promise.resolve();
    expect(read).toEqual([]);
    expect(hub.readStillUnsent('peer', 'user')).toBe(false);
  });

  it('says a read is still unsent until the server has it, whatever the case of the uid', () => {
    const hub = OfflineHub.getInstance();
    hub.start();
    expect(hub.readStillUnsent('peer', 'user')).toBe(false);
    hub.rememberReadWhileOffline('Peer', 'user');
    // The conversation row spells the peer in lower case; it is the same chat.
    expect(hub.readStillUnsent('peer', 'user')).toBe(true);
    expect(hub.readStillUnsent('peer', 'group')).toBe(false);
    fake.fire('sync', 'onMessageSyncCompleted', [], 'CAUGHT_UP');
    expect(hub.readStillUnsent('peer', 'user')).toBe(false);
  });

  it('a flushed read that reached the server is announced, so a list can clear the badge', async () => {
    const hub = OfflineHub.getInstance();
    hub.start();
    const read: { id: string; type: string }[] = [];
    hub.conversationRead.subscribe(event => {
      if (event.gen === hub.gen) read.push({ id: event.id, type: event.type });
    });
    hub.rememberReadWhileOffline('peer', 'user');
    fake.fire('sync', 'onMessageSyncCompleted', [], 'CAUGHT_UP');
    expect(read).toEqual([]);
    await Promise.resolve();
    expect(read).toEqual([{ id: 'peer', type: 'user' }]);
  });

  it('a flush that fails is remembered again and announces nothing', async () => {
    const hub = OfflineHub.getInstance();
    hub.start();
    const read: unknown[] = [];
    hub.conversationRead.subscribe(event => read.push(event));
    const markAsRead = (CometChat as unknown as Record<string, unknown>)
      .markConversationAsRead as {
      mockImplementationOnce: (fn: () => Promise<unknown>) => void;
    };
    markAsRead.mockImplementationOnce(() => Promise.reject(new Error('offline')));
    hub.rememberReadWhileOffline('peer', 'user');
    fake.fire('sync', 'onMessageSyncCompleted', [], 'CAUGHT_UP');
    await Promise.resolve();
    await Promise.resolve();
    expect(read).toEqual([]);
    expect(hub.readStillUnsent('peer', 'user')).toBe(true);
  });
});

describe('send state machine (§3.4)', () => {
  let fake: OfflineSdkFake;
  let published: CometChatUIEvent[];

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk({ enabled: true });
    published = [];
    const hub = OfflineHub.getInstance();
    hub.setPublicEmit(e => published.push(e));
    hub.start();
  });

  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
  });

  it('queued ≠ failed: pending then the not-connected notice keeps it sending (UIK-SEND-02)', async () => {
    fake.scriptSend(sendScripts.queued('L1'));
    const m = textMessage('hello');
    m.setMuid('M1');
    const result = await sendWithState(m, 'text');
    expect(result.state).toBe('sending');
    expect(published.some(e => e.type === 'ui:message/sent')).toBe(false);
    expect(fake.callsTo('sendMessage')[0]?.[1]).toBeDefined();
    // The outbox later sends it: exactly one public success.
    m.setId(5);
    fake.fire('offline', 'onOutboxMessageSent', m);
    fake.fire('offline', 'onOutboxMessageSent', m);
    expect(published.filter(e => e.type === 'ui:message/sent')).toHaveLength(1);
  });

  it('offline, a send queued behind another unsent one resolves on pending: the caller never waits on it (R77)', async () => {
    fake.connected = false;
    fake.scriptSend(sendScripts.queued('L1'));
    const first = textMessage('first');
    first.setMuid('MF');
    expect((await sendWithState(first, 'text')).state).toBe('sending');
    // Pending only: the SDK stays silent until the chat drains.
    fake.scriptSend(sendScripts.queuedBehind('L2'));
    const second = textMessage('second');
    second.setMuid('MS');
    const result = await sendWithState(second, 'text');
    expect(result.state).toBe('sending');
    expect(
      published.some(e => e.type === 'ui:message/sent' && e.status === CometChatMessageStatus.error)
    ).toBe(false);
    // The later ack still reaches the row (and the public event) through the outbox.
    second.setId(9);
    fake.fire('offline', 'onOutboxMessageSent', second);
    expect(
      published.filter(e => e.type === 'ui:message/sent' && e.message === second)
    ).toHaveLength(1);
  });

  it('offline, a refusal fired in the same turn as pending still decides the result', async () => {
    fake.connected = false;
    fake.scriptSend((listener, message) => {
      offlineMessage(message, { localMessageId: 'LR', status: 'PENDING' });
      listener.onMessagePending?.(message);
      listener.onError?.({ code: 'QUEUE_FULL' });
    });
    const m = textMessage('full');
    m.setMuid('MR');
    expect(await sendWithState(m, 'text')).toMatchObject({ state: 'failed', direct: true });
  });

  it('online, a pending send that goes unanswered resolves as sending after the bound', async () => {
    vi.useFakeTimers();
    try {
      fake.connected = true;
      fake.scriptSend(sendScripts.queuedBehind('L3'));
      let state = '';
      void sendWithState(textMessage('x'), 'text').then(r => {
        state = r.state;
      });
      await vi.advanceTimersByTimeAsync(QUEUED_ANSWER_WAIT_MS - 1);
      expect(state).toBe('');
      await vi.advanceTimersByTimeAsync(1);
      expect(state).toBe('sending');
    } finally {
      vi.useRealTimers();
    }
  });

  it('online, an answer before the bound wins and the bound does not fire later', async () => {
    vi.useFakeTimers();
    try {
      fake.connected = true;
      fake.scriptSend(sendScripts.sent('L4', 44));
      const result = await sendWithState(textMessage('quick'), 'text');
      expect(result.state).toBe('sent');
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('an error without a prior pending is failed (direct), whatever the code (UIK-SEND-03)', async () => {
    fake.scriptSend(sendScripts.refused('ERR_SOMETHING'));
    const m = textMessage('x');
    m.setMuid('M2');
    const result = await sendWithState(m, 'text');
    expect(result).toMatchObject({ state: 'failed', direct: true });
    expect(OfflineHub.getInstance().directFailureOf(m)).toBe('');
    expect(published.find(e => e.type === 'ui:message/sent')).toMatchObject({
      status: 'error',
    });
  });

  it('QUEUE_FULL / BYTE_OVERFLOW are failed (direct) with a notice', async () => {
    const notices: string[] = [];
    OfflineHub.getInstance().notice.subscribe(n => notices.push(n.kind));
    fake.scriptSend(sendScripts.refused('QUEUE_FULL'));
    const a = textMessage('a');
    a.setMuid('MA');
    await sendWithState(a, 'text');
    fake.scriptSend((listener, message) => {
      offlineMessage(message, { localMessageId: 'LB', status: 'PENDING' });
      listener.onMessagePending?.(message);
      listener.onError?.({ code: 'BYTE_OVERFLOW' });
    });
    const b = textMessage('b');
    b.setMuid('MB');
    const rb = await sendWithState(b, 'media');
    expect(rb).toMatchObject({ state: 'failed', direct: true, reason: 'BYTE_OVERFLOW' });
    expect(notices).toEqual(['queue_full', 'file_too_large_offline']);
  });

  it('a failed outbox row is derived from status on every render (UIK-SEND-04)', () => {
    const m = offlineMessage(textMessage('x'), { localMessageId: 'L', status: 'FAILED' });
    expect(offlineRowStateOf(m)).toBe('failed');
    fake.setEnabled(false);
    expect(offlineRowStateOf(m)).toBeNull();
  });

  it('statics Promise: resolves on sent, rejects on final failure, never on queued', async () => {
    fake.scriptSend(sendScripts.queued('LQ'));
    const queued = textMessage('q');
    queued.setMuid('MQ');
    let settled = false;
    const p = sendWithStatePromise(queued, 'text').then(
      () => (settled = true),
      () => (settled = true)
    );
    await flush();
    expect(settled).toBe(false);
    queued.setId(77);
    fake.fire('offline', 'onOutboxMessageSent', queued);
    await p;
    expect(settled).toBe(true);

    fake.scriptSend(sendScripts.queued('LF'));
    const failing = textMessage('f');
    failing.setMuid('MF');
    const rejected = sendWithStatePromise(failing, 'text');
    await flush();
    fake.fire('offline', 'onOutboxMessageFailed', failing, 'PERMANENT');
    await expect(rejected).rejects.toMatchObject({ code: 'PERMANENT' });
  });

  it('statics Promise: a cache reset that lost the outbox rejects it; a reset that lost none leaves it waiting', async () => {
    fake.scriptSend(sendScripts.queued('LR1'));
    const lost = textMessage('lost');
    lost.setMuid('MR1');
    const rejected = sendWithStatePromise(lost, 'text');
    await flush();
    fake.fire('cacheReset', 'onOfflineCacheReset', 'KEY_LOST', -1);
    await expect(rejected).rejects.toMatchObject({
      code: 'ERROR_OFFLINE_MESSAGE_DISCARDED',
    });

    fake.scriptSend(sendScripts.queued('LR2'));
    const kept = textMessage('kept');
    kept.setMuid('MR2');
    const waiting = sendWithStatePromise(kept, 'text');
    await flush();
    fake.fire('cacheReset', 'onOfflineCacheReset', 'SCHEMA_RESET', 0);
    kept.setId(81);
    fake.fire('offline', 'onOutboxMessageSent', kept);
    await expect(waiting).resolves.toBe(kept);
  });

  it('statics Promise: a logout rejects a queued send once, quietly, with the DISCARDED error', async () => {
    fake.scriptSend(sendScripts.queued('LR3'));
    const m = textMessage('logout');
    m.setMuid('MR3');
    const outcomes: unknown[] = [];
    void sendWithStatePromise(m, 'text').then(
      v => outcomes.push(['resolved', v]),
      (e: unknown) => outcomes.push(['rejected', e])
    );
    await flush();
    expect(outcomes).toHaveLength(0);
    OfflineHub.getInstance().endSession();
    await flush();
    // A late outbox answer cannot settle it a second time.
    m.setId(82);
    fake.fire('offline', 'onOutboxMessageSent', m);
    await flush();
    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]).toMatchObject([
      'rejected',
      { code: 'ERROR_OFFLINE_MESSAGE_DISCARDED', sentMessage: m },
    ]);
  });

  it('statics Promise: a queued send is never rejected while the session is alive', async () => {
    fake.scriptSend(sendScripts.queued('LR4'));
    const m = textMessage('alive');
    m.setMuid('MR4');
    let settled = false;
    void sendWithStatePromise(m, 'text').then(
      () => (settled = true),
      () => (settled = true)
    );
    await flush();
    await flush();
    expect(settled).toBe(false);
  });

  it('statics Promise: a send with no local id still settles when the session ends or the cache is reset', async () => {
    for (const end of ['session', 'reset'] as const) {
      // The SDK accepts it (offline) but hands back no local id.
      fake.connected = false;
      fake.scriptSend((listener, message) => {
        listener.onMessagePending?.(message);
      });
      const m = textMessage(`nolocal-${end}`);
      m.setMuid(`MN-${end}`);
      const outcomes: unknown[] = [];
      void sendWithStatePromise(m, 'text').then(
        () => outcomes.push('resolved'),
        (e: unknown) => outcomes.push(e)
      );
      await flush();
      expect(outcomes).toHaveLength(0);
      if (end === 'session') OfflineHub.getInstance().endSession();
      else fake.fire('cacheReset', 'onOfflineCacheReset', 'KEY_LOST', -1);
      await flush();
      expect(outcomes).toHaveLength(1);
      expect(outcomes[0]).toMatchObject({
        code: 'ERROR_OFFLINE_MESSAGE_DISCARDED',
      });
    }
  });

  it('statics Promise: a send whose first answer lands after the session ended is rejected too', async () => {
    // The SDK rejects the per-call Promise with DISCARDED (the listener never hears of it).
    fake.scriptSend(() => undefined);
    vi.spyOn(CometChat as never, 'sendMessage').mockImplementation(() =>
      Promise.reject(
        Object.assign(new Error('discarded'), {
          code: 'ERROR_OFFLINE_MESSAGE_DISCARDED',
        })
      )
    );
    await expect(sendWithStatePromise(textMessage('gone'), 'text')).rejects.toMatchObject({
      code: 'ERROR_OFFLINE_MESSAGE_DISCARDED',
    });
  });

  it('statics Promise: an outcome the outbox reported before the first answer settled still resolves it', async () => {
    fake.connected = false;
    const sentCopy = offlineMessage(textMessage('early'), { localMessageId: 'LE', id: 61 });
    fake.scriptSend((listener, message) => {
      offlineMessage(message, { localMessageId: 'LE', status: 'PENDING' });
      listener.onMessagePending?.(message);
      // The outbox answers before the per-call result settles (offline: a microtask).
      fake.fire('offline', 'onOutboxMessageSent', sentCopy);
    });
    const m = textMessage('early');
    m.setMuid('ME');
    await expect(sendWithStatePromise(m, 'text')).resolves.toBe(sentCopy);
  });

  it('Retry: an outbox row goes through retryMessage(localId); a direct one is a fresh send', async () => {
    const outboxRow = offlineMessage(textMessage('o'), {
      localMessageId: 'LO',
      muid: 'MO',
      status: 'FAILED',
    });
    await retryFailedMessage(outboxRow);
    expect(fake.callsTo('retryMessage')[0]?.[0]).toBe('LO');

    const direct = offlineMessage(textMessage('d'), { muid: 'MD' });
    OfflineHub.getInstance().markDirectFailed(direct, 'QUEUE_FULL');
    fake.scriptSend(sendScripts.queued('LD2'));
    await retryFailedMessage(direct);
    expect(fake.callsTo('sendMessage')).toHaveLength(1);
    expect(OfflineHub.getInstance().directFailureOf(direct)).toBeUndefined();
  });

  it('Retry on a failed interactive message sends it again through sendInteractiveMessage', async () => {
    const interactive = offlineMessage(textMessage('form'), { muid: 'MI' });
    (interactive as unknown as { getCategory: () => string }).getCategory = () => 'interactive';
    OfflineHub.getInstance().markDirectFailed(interactive, 'QUEUE_FULL');
    fake.scriptSend(sendScripts.queued('LI2'));
    await retryFailedMessage(interactive);
    expect(fake.callsTo('sendInteractiveMessage')).toHaveLength(1);
    expect(fake.callsTo('sendMessage')).toHaveLength(0);
    expect(OfflineHub.getInstance().directFailureOf(interactive)).toBeUndefined();
  });

  it('a rejected retry Promise is caught (no unhandled rejection)', async () => {
    fake.discardResult = 'reject';
    const m = offlineMessage(textMessage('o'), {
      localMessageId: 'LR',
      muid: 'MR',
      status: 'FAILED',
    });
    await expect(retryFailedMessage(m)).resolves.toBeUndefined();
  });

  it('Delete: discardLocalMessage, then the kit removes the row itself', async () => {
    const states: string[] = [];
    OfflineHub.getInstance().sendState.subscribe(e => states.push(e.state));
    const m = offlineMessage(textMessage('x'), {
      localMessageId: 'LX',
      muid: 'MX',
      status: 'FAILED',
    });
    expect(await discardUnsentMessage(m)).toBe('removed');
    expect(fake.callsTo('discardLocalMessage')[0]?.[0]).toBe('LX');
    expect(states).toEqual(['discarded']);
  });

  it('Delete refused IN_FLIGHT keeps the row and changes nothing', async () => {
    const states: string[] = [];
    OfflineHub.getInstance().sendState.subscribe(e => states.push(e.state));
    fake.discardResult = 'reject';
    fake.rejectCode = 'ERROR_OFFLINE_MESSAGE_IN_FLIGHT';
    const n = offlineMessage(textMessage('y'), {
      localMessageId: 'LY',
      muid: 'MY',
      status: 'PENDING',
    });
    expect(await discardUnsentMessage(n)).toBe('in-flight');
    expect(states).toEqual([]);
  });

  it('Delete answered NOT_FOUND hands back the sent copy so it is deleted the normal way', async () => {
    const hub = OfflineHub.getInstance();
    const pending = offlineMessage(textMessage('gone'), {
      localMessageId: 'LN',
      muid: 'MN',
      status: 'PENDING',
    });
    const sent = offlineMessage(textMessage('gone'), {
      localMessageId: 'LN',
      muid: 'MN',
      id: 77,
      status: 'SENT',
    });
    hub.reportSendState(sent, 'sent');
    fake.discardResult = 'reject';
    fake.rejectCode = 'ERROR_OFFLINE_MESSAGE_NOT_FOUND';
    const outcome = await discardUnsentMessage(pending);
    expect(outcome).toEqual({ sent });
  });

  for (const connected of [false, true]) {
    it(`Delete answered NOT_FOUND on a row with no server id removes it at once (${connected ? 'online' : 'offline'})`, async () => {
      fake.connected = connected;
      const states: string[] = [];
      OfflineHub.getInstance().sendState.subscribe(e => states.push(e.state));
      fake.discardResult = 'reject';
      fake.rejectCode = 'ERROR_OFFLINE_MESSAGE_NOT_FOUND';
      const m = offlineMessage(textMessage('purged'), {
        localMessageId: 'LG',
        muid: 'MG',
        status: 'FAILED',
      });
      // No wait for a sent copy: the answer settles in the same tick as the SDK's.
      let outcome: unknown;
      void discardUnsentMessage(m).then(o => (outcome = o));
      await flush();
      expect(outcome).toBe('removed');
      expect(states).toEqual(['discarded']);
    });
  }

  it('Delete answered NOT_FOUND on a row with a server id deletes it the normal way', async () => {
    fake.connected = false;
    const states: string[] = [];
    OfflineHub.getInstance().sendState.subscribe(e => states.push(e.state));
    fake.discardResult = 'reject';
    fake.rejectCode = 'ERROR_OFFLINE_MESSAGE_NOT_FOUND';
    const m = offlineMessage(textMessage('sent'), {
      localMessageId: 'LV',
      muid: 'MV',
      id: 90,
      status: 'PENDING',
    });
    expect(await discardUnsentMessage(m)).toEqual({ sent: m });
    expect(states).toEqual([]);
  });

  it('a sent copy that arrives after a NOT_FOUND Delete removed the row is deleted on the server', async () => {
    const deleted = vi
      .spyOn(CometChat, 'deleteMessage')
      .mockResolvedValue(undefined as unknown as CometChat.BaseMessage);
    try {
      const hub = OfflineHub.getInstance();
      const states: string[] = [];
      hub.sendState.subscribe(e => states.push(e.state));
      fake.discardResult = 'reject';
      fake.rejectCode = 'ERROR_OFFLINE_MESSAGE_NOT_FOUND';
      const m = offlineMessage(textMessage('late'), {
        localMessageId: 'LW',
        muid: 'MW',
        status: 'PENDING',
      });
      expect(await discardUnsentMessage(m)).toBe('removed');
      hub.reportSendState(offlineMessage(textMessage('late'), { localMessageId: 'LW', id: 78 }), 'sent');
      // The row stays removed, and the server copy is deleted once.
      expect(states).toEqual(['discarded']);
      expect(deleted).toHaveBeenCalledTimes(1);
      expect(deleted).toHaveBeenCalledWith('78');
      hub.reportSendState(offlineMessage(textMessage('late'), { localMessageId: 'LW', id: 78 }), 'sent');
      expect(deleted).toHaveBeenCalledTimes(1);
    } finally {
      deleted.mockRestore();
    }
  });

  it('Retry answered NOT_FOUND on a row with no server id removes the row like a discard', async () => {
    fake.connected = false;
    const states: string[] = [];
    OfflineHub.getInstance().sendState.subscribe(e => states.push(e.state));
    fake.discardResult = 'reject';
    fake.rejectCode = 'ERROR_OFFLINE_MESSAGE_NOT_FOUND';
    const m = offlineMessage(textMessage('purged'), {
      localMessageId: 'LRN',
      muid: 'MRN',
      status: 'FAILED',
    });
    await retryFailedMessage(m);
    expect(states).toEqual(['sending', 'discarded']);
  });

  it('Retry answered NOT_FOUND on a row with a server id leaves it', async () => {
    const states: string[] = [];
    OfflineHub.getInstance().sendState.subscribe(e => states.push(e.state));
    fake.discardResult = 'reject';
    fake.rejectCode = 'ERROR_OFFLINE_MESSAGE_NOT_FOUND';
    const m = offlineMessage(textMessage('sent'), {
      localMessageId: 'LRS',
      muid: 'MRS',
      id: 91,
      status: 'FAILED',
    });
    await retryFailedMessage(m);
    expect(states).toEqual(['sending']);
  });

  it('Retry answered not-connected keeps the row (silent, still sending)', async () => {
    fake.connected = false;
    const states: string[] = [];
    OfflineHub.getInstance().sendState.subscribe(e => states.push(e.state));
    fake.discardResult = 'reject';
    fake.rejectCode = 'NOT_CONNECTED';
    const m = offlineMessage(textMessage('queued'), {
      localMessageId: 'LRC',
      muid: 'MRC',
      status: 'FAILED',
    });
    await retryFailedMessage(m);
    expect(states).toEqual(['sending']);
    expect(OfflineHub.getInstance().stateOf('LRC')).toBe('sending');
  });

  it('Delete answered ERROR_OFFLINE_DISABLED (kill switch) removes the row from the screen', async () => {
    fake.discardResult = 'reject';
    fake.rejectCode = 'ERROR_OFFLINE_DISABLED';
    const m = offlineMessage(textMessage('k'), {
      localMessageId: 'LK',
      muid: 'MK',
      status: 'PENDING',
    });
    expect(await discardUnsentMessage(m)).toBe('removed');
  });

  it('Delete of a store-busy refusal keeps the row', async () => {
    fake.discardResult = 'reject';
    fake.rejectCode = 'ERROR_OFFLINE_MESSAGE_PERSIST_FAILED';
    const m = offlineMessage(textMessage('s'), {
      localMessageId: 'LS',
      muid: 'MS2',
      status: 'PENDING',
    });
    expect(await discardUnsentMessage(m)).toBe('failed');
  });

  it('no kit code calls the never-shipped deletePendingMessage', () => {
    expect(fake.callsTo('deletePendingMessage')).toHaveLength(0);
  });

  it('a direct failure (not in the outbox) is removed without calling the SDK', async () => {
    const m = offlineMessage(textMessage('x'), { muid: 'MZ' });
    OfflineHub.getInstance().markDirectFailed(m, '');
    expect(await discardUnsentMessage(m)).toBe('removed');
    expect(fake.callsTo('discardLocalMessage')).toHaveLength(0);
  });

  it('Retry refused with ERROR_OFFLINE_DISABLED becomes a fresh send without the old handle', async () => {
    fake.discardResult = 'reject';
    fake.rejectCode = 'ERROR_OFFLINE_DISABLED';
    const m = offlineMessage(textMessage('again'), {
      localMessageId: 'LOLD',
      muid: 'MA',
      status: 'PENDING',
    });
    m.setData({ text: 'again', localMessageId: 'LOLD' } as unknown as object);
    fake.scriptSend(sendScripts.queued('LNEW'));
    await retryFailedMessage(m);
    const sent = fake.callsTo('sendMessage')[0]?.[0] as CometChat.BaseMessage | undefined;
    expect(sent).toBeDefined();
    expect((sent?.getData() as { localMessageId?: string }).localMessageId).toBeUndefined();
  });
});

describe('unsent row actions (BEH-SEND-37 as rewritten by R162 / S73)', () => {
  let fake: OfflineSdkFake;

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk({ enabled: true });
  });

  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
  });

  const cases: [
    string,
    Parameters<typeof offlineMessage>[1],
    { retry: boolean; discard: boolean } | null,
  ][] = [
    ['PENDING', { localMessageId: 'L1', status: 'PENDING' }, { retry: true, discard: true }],
    ['SENDING', { localMessageId: 'L2', status: 'SENDING' }, { retry: true, discard: true }],
    [
      'FAILED + TRANSIENT',
      { localMessageId: 'L3', status: 'FAILED', failureReason: 'TRANSIENT' },
      { retry: true, discard: true },
    ],
    [
      'FAILED + PERMANENT',
      { localMessageId: 'L4', status: 'FAILED', failureReason: 'PERMANENT' },
      { retry: true, discard: true },
    ],
    [
      'FAILED + QUEUE_OVERFLOW',
      { localMessageId: 'L4b', status: 'FAILED', failureReason: 'QUEUE_OVERFLOW' },
      { retry: true, discard: true },
    ],
    [
      'FAILED, reason unknown after a restart (R95) = TRANSIENT',
      { localMessageId: 'L5', status: 'FAILED' },
      { retry: true, discard: true },
    ],
    ["a sent message keeps today's menu", { localMessageId: 'L6', id: 5, status: 'SENT' }, null],
  ];
  for (const [name, state, expected] of cases) {
    it(name, () => {
      const m = offlineMessage(textMessage(name), { muid: `M-${name}`, ...state });
      expect(unsentActionsOf(m)).toEqual(expected);
    });
  }

  it('FAILED with the reason only known from the outbox event this session: still Retry', () => {
    const m = offlineMessage(textMessage('p'), { localMessageId: 'L7', status: 'FAILED' });
    OfflineHub.getInstance().reportSendState(m, 'failed', { reason: 'PERMANENT' });
    expect(unsentActionsOf(m)).toEqual({ retry: true, discard: true });
  });

  it('a failed (direct) row kept in memory offers Retry and Delete', () => {
    const m = offlineMessage(textMessage('d'), { muid: 'MDIR' });
    OfflineHub.getInstance().markDirectFailed(m, 'QUEUE_FULL');
    expect(unsentActionsOf(m)).toEqual({ retry: true, discard: true });
  });

  it("offline off: no unsent actions at all (today's menu)", () => {
    fake.setEnabled(false);
    const m = offlineMessage(textMessage('off'), { localMessageId: 'L8', status: 'PENDING' });
    expect(unsentActionsOf(m)).toBeNull();
  });
});

describe('review regressions', () => {
  let fake: OfflineSdkFake;
  let published: CometChatUIEvent[];

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk({ enabled: true });
    published = [];
    OfflineHub.getInstance().setPublicEmit(e => published.push(e));
  });

  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
  });

  it('a removal publishes no ui:message/sent error, only the send-state event', async () => {
    const m = offlineMessage(textMessage('x'), { muid: 'MD' });
    OfflineHub.getInstance().markDirectFailed(m, '');
    await discardUnsentMessage(m);
    expect(published.some(e => e.type === 'ui:message/sent')).toBe(false);
    expect(published.find(e => e.type === 'ui:message/send-state-changed')).toMatchObject({
      state: 'discarded',
    });
  });

  it('a send the SDK delivered directly (no local handle) still reaches the screen once', async () => {
    fake.scriptSend((listener, message) => {
      message.setId(31);
      listener.onMessageSent?.(message);
    });
    const states: string[] = [];
    OfflineHub.getInstance().sendState.subscribe(e => states.push(e.state));
    const m = textMessage('direct');
    m.setMuid('MS');
    const result = await sendWithState(m, 'text');
    expect(result.state).toBe('sent');
    expect(states).toEqual(['sent']);
    expect(published.filter(e => e.type === 'ui:message/sent')).toHaveLength(1);
  });

  it('an acked row is never replaced by an un-acked copy of itself', () => {
    const acked = offlineMessage(textMessage('a'), { localMessageId: 'L', id: 9, sentAt: 1 });
    const staleCopy = offlineMessage(textMessage('a'), { localMessageId: 'L', sentAt: 1 });
    const result = upsertSorted([acked], [staleCopy]);
    expect(result.changed).toBe(false);
    expect(result.rows[0]).toBe(acked);
  });
});

describe('notices text (plural lookup)', () => {
  const strings: Record<string, string> = {
    message_list_messages_not_sent_one: '{{count}} message was not sent',
    message_list_messages_not_sent_other: '{{count}} messages were not sent',
    message_list_queue_full: 'Too many',
  };
  const localize = (key: string) => strings[key] ?? key;

  it('picks the plural form with Intl.PluralRules and fills {{count}}', () => {
    expect(getLocalizedPlural(localize, 'en-us', 'message_list_messages_not_sent', 1)).toBe(
      '1 message was not sent'
    );
    expect(getLocalizedPlural(localize, 'en-us', 'message_list_messages_not_sent', 3)).toBe(
      '3 messages were not sent'
    );
    expect(offlineNoticeText({ id: 1, gen: 0, kind: 'queue_full' }, localize, 'en-us')).toBe(
      'Too many'
    );
  });
});
