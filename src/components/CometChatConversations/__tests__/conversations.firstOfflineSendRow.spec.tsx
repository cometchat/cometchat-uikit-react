/**
 * The first message sent offline to a contact who is not in Chats yet.
 *
 * With offline on, the SDK's `offlineSend` composes the own message, stamps the
 * canonical conversation id on it (`<min>_user_<max>`, or `group_<guid>`) before
 * any ack, and hands back a receiver that carries only an id. The list used to
 * refuse to build a row for a chat it had never listed, so that chat was absent
 * from Chats until the reconnect brought a server copy. It must appear at once,
 * and the reconnect must leave ONE row, not two.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { reconcileSyncPage, rowFromMessageOffline } from '../conversationsOffline';
import { OfflineHub } from '../../../utils/offline/hub';
import { installOfflineSdk, offlineMessage, type OfflineSdkFake } from '../../../testing/offline-sdk-fake';

const me = new CometChat.User({ uid: 'me', name: 'Me' });
const sam = new CometChat.User({ uid: 'sam', name: 'Sam' });

/** A chat the user already has, so the list is not simply empty. */
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

/**
 * What the SDK hands the kit for a send queued while offline: the composed
 * message, its receiver stamped id-only (`stampReceiverIfAbsent`) and the
 * canonical conversation id already set (`offlineSend`). `bea_user_me` is the
 * canonical pair id for ('me', 'bea') — uids ASCII-lowercased, UTF-8 sorted.
 */
function queuedToNewContact(uid = 'bea'): CometChat.TextMessage {
  const message = new CometChat.TextMessage(uid, 'hello', 'user');
  message.setSender(me);
  message.setReceiver(new CometChat.User({ uid }));
  message.setConversationId(`${uid}_user_me`);
  return offlineMessage(message, {
    id: 0,
    sentAt: 500,
    localMessageId: 'L1',
    status: 'PENDING',
  });
}

/** The server's own copy of that chat, as the reconnect sync page carries it. */
function serverRow(uid = 'bea'): CometChat.Conversation {
  const echo = CometChat.CometChatHelper.processMessage({
    id: '9',
    muid: 'm',
    conversationId: `${uid}_user_me`,
    sender: { uid: 'me', name: 'Me' },
    receiver: { uid, name: 'Bea' },
    receiverUid: uid,
    receiverType: 'user',
    type: 'text',
    category: 'message',
    data: { text: 'hello', entities: {} },
    sentAt: 500,
  }) as unknown as CometChat.BaseMessage;
  return new CometChat.Conversation(
    `${uid}_user_me`,
    'user',
    echo as never,
    new CometChat.User({ uid, name: 'Bea' }),
    0,
    [],
    null,
    null
  );
}

function peerUidOf(conversation: CometChat.Conversation): string | undefined {
  return (conversation.getConversationWith() as CometChat.User | undefined)?.getUid();
}

describe('the first message sent offline to a new contact', () => {
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

  // The user-visible symptom.
  it('puts a row in Chats for a contact who is not listed yet', async () => {
    const message = queuedToNewContact();
    const row = await rowFromMessageOffline(message, [listedRow()]);

    expect(row).not.toBeNull();
    expect(peerUidOf(row!)).toBe('bea');
    expect(row!.getLastMessage()).toBe(message);
  });

  it('keys that row by the id the SDK stamped, so it is addressable', async () => {
    const row = await rowFromMessageOffline(queuedToNewContact(), [listedRow()]);
    expect(row!.getConversationId()).toBe('bea_user_me');
    expect(row!.getConversationType()).toBe('user');
  });

  // The dedupe case: the reconnect must not leave two rows for one chat.
  // Once the send is acked its preview is no longer unsent, so the sync page's
  // own copy replaces the row the offline send made.
  it('folds into ONE row when the reconnect brings the server copy', async () => {
    const acked = queuedToNewContact();
    acked.setId(9);
    const ackedRow = await rowFromMessageOffline(
      offlineMessage(acked, { id: 9, sentAt: 500, localMessageId: 'L1', status: 'SENT' }),
      [listedRow()]
    );
    const shown = [listedRow(), ackedRow!];

    const after = reconcileSyncPage(shown, [serverRow(), listedRow()]);

    const beaRows = after.filter(c => c.getConversationId() === 'bea_user_me');
    expect(beaRows).toHaveLength(1);
    expect(after).toHaveLength(2);
    // The surviving row is the server's, which can render a name.
    expect((beaRows[0]!.getConversationWith() as CometChat.User).getName()).toBe('Bea');
  });

  // The same invariant while the send is still queued: a sync page that reaches
  // the list before the ack must still not double the chat. Here the pending
  // preview is deliberately kept (BEH-CONV-06) — but as ONE row.
  it('still leaves ONE row when a sync page arrives before the ack', async () => {
    const offlineRow = await rowFromMessageOffline(queuedToNewContact(), [listedRow()]);
    const shown = [listedRow(), offlineRow!];

    const after = reconcileSyncPage(shown, [serverRow(), listedRow()]);

    expect(after.filter(c => c.getConversationId() === 'bea_user_me')).toHaveLength(1);
    expect(after).toHaveLength(2);
  });

  it('a group chat not listed yet gets its row under the group id', async () => {
    const message = new CometChat.TextMessage('team', 'hello', 'group');
    message.setSender(me);
    // Id-only, as the outbox stamps it: a group with no display fields yet, so
    // this goes through the rebuild path rather than passing through whole.
    message.setReceiver(new CometChat.Group('team', '', 'public'));
    message.setConversationId('group_team');
    const queued = offlineMessage(message, {
      id: 0,
      sentAt: 500,
      localMessageId: 'L2',
      status: 'PENDING',
    });

    const row = await rowFromMessageOffline(queued, [listedRow()]);

    expect(row).not.toBeNull();
    expect(row!.getConversationId()).toBe('group_team');
  });

  it('a message with no stamped id still makes no row, so nothing unaddressable is added', async () => {
    const message = new CometChat.TextMessage('bea', 'hello', 'user');
    message.setSender(me);
    message.setReceiver(new CometChat.User({ uid: 'bea' }));
    const queued = offlineMessage(message, {
      id: 0,
      sentAt: 500,
      localMessageId: 'L3',
      status: 'PENDING',
    });

    expect(await rowFromMessageOffline(queued, [listedRow()])).toBeNull();
  });

  // Guard on requirement 3: a listed chat keeps the name the user already sees.
  it('a listed chat still takes its peer, id and type from the listed row', async () => {
    const message = new CometChat.TextMessage('sam', 'hello', 'user');
    message.setSender(me);
    message.setReceiver(new CometChat.User({ uid: 'sam' }));
    message.setConversationId('me_user_sam');
    const queued = offlineMessage(message, {
      id: 0,
      sentAt: 500,
      localMessageId: 'L4',
      status: 'PENDING',
    });

    const row = await rowFromMessageOffline(queued, [listedRow()]);

    expect(row!.getConversationId()).toBe('me_user_sam');
    expect((row!.getConversationWith() as CometChat.User).getName()).toBe('Sam');
  });
});
