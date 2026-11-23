/**
 * sendBatch on the offline (ON) path, in a thread and as a reply: the reply
 * event follows only an acknowledged lead message, the thread flag is stamped,
 * the quote rides on the first message only, and a refused send is skipped.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import type { TrayItem } from '../CometChatMessageComposer.types';
import { sendBatch, type SendBatchOptions } from '../sendBatch';
import { OfflineHub } from '../../../utils/offline/hub';
import {
  installOfflineSdk,
  sendScripts,
  textMessage,
  type OfflineSdkFake,
} from '../../../testing/offline-sdk-fake';

const file = (name: string, type: string) => new File(['x'], name, { type });

const uploaded = (fileId: string, kind: TrayItem['kind'], name: string): TrayItem => ({
  fileId,
  file: file(name, kind === 'image' ? 'image/png' : 'application/pdf'),
  kind,
  status: 'success',
  percent: 100,
  attachment: new CometChat.Attachment({ url: `https://cdn/${name}`, name }),
});

const queuedOffline = (fileId: string, name: string): TrayItem => ({
  fileId,
  file: file(name, 'image/png'),
  kind: 'image',
  status: 'failed',
  percent: 0,
  queueOffline: true,
});

interface Published {
  type: string;
  status?: string;
  message?: CometChat.BaseMessage;
}

describe('sendBatch, offline ON, threads and replies', () => {
  let fake: OfflineSdkFake;
  const quoted = (() => {
    const m = textMessage('the question', 'me', 'user', 'sam');
    m.setId(77);
    return m;
  })();

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk({ enabled: true });
    vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(
      new CometChat.User({ uid: 'me', name: 'me' })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fake.restore();
    OfflineHub.resetForTests();
  });

  function options(items: TrayItem[], extra: Partial<SendBatchOptions> = {}) {
    const publish = vi.fn();
    const onSent = vi.fn();
    const onSendButtonClick = vi.fn();
    const batch: SendBatchOptions = {
      items,
      batchId: 'batch-1',
      caption: '',
      receiverId: 'sam',
      receiverType: 'user',
      publish,
      onSent,
      onSendButtonClick,
      ...extra,
    };
    return { batch, publish, onSent, onSendButtonClick };
  }

  const published = (publish: ReturnType<typeof vi.fn>) =>
    publish.mock.calls.map(([event]) => event as Published);

  it('an acknowledged lead message of a threaded reply: stamped subscribed, one reply event', async () => {
    fake.scriptSend(sendScripts.sent('L1', 101));
    fake.scriptSend(sendScripts.sent('L2', 102));
    const opts = options([uploaded('f1', 'image', 'a.png'), uploaded('f2', 'file', 'b.pdf')], {
      parentMessageId: 9,
      messageToReply: quoted,
    });

    await sendBatch(opts.batch);

    const sends = fake.callsTo('sendMediaMessage').map(([m]) => m as CometChat.MediaMessage);
    expect(sends.map(m => m.getType())).toEqual(['image', 'file']);
    expect(sends.every(m => m.getParentMessageId() === 9)).toBe(true);
    expect(sends.every(m => m.isThreadSubscribed())).toBe(true);
    // The quote rides on the lead message only.
    expect(sends[0]?.getQuotedMessageId()).toBe(77);
    expect(sends[1]?.getQuotedMessageId()).toBeFalsy();

    const replies = published(opts.publish).filter(e => e.type === 'ui:compose/reply');
    expect(replies).toHaveLength(1);
    expect(replies[0]).toMatchObject({ status: 'success', parentMessageId: 9 });
    expect(replies[0]?.message?.getId()).toBe(101);
    expect(opts.onSent).toHaveBeenCalledTimes(2);
    expect(opts.onSendButtonClick).toHaveBeenCalledTimes(2);
    expect(opts.onSendButtonClick).toHaveBeenCalledWith(expect.anything(), 'send');
  });

  it('a queued (not yet acknowledged) lead message publishes no reply event yet', async () => {
    fake.scriptSend(sendScripts.queued('L1'));
    const opts = options([uploaded('f1', 'image', 'a.png')], { messageToReply: quoted });
    await sendBatch(opts.batch);
    expect(published(opts.publish).some(e => e.type === 'ui:compose/reply')).toBe(false);
    expect(opts.onSent).toHaveBeenCalledTimes(1);
    expect(opts.onSendButtonClick).toHaveBeenCalledTimes(1);
  });

  it('a send the SDK refuses is skipped: no onSent, no click callback; the rest still go', async () => {
    fake.scriptSend(sendScripts.refused('ERR_FILE_TOO_LARGE'));
    fake.scriptSend(sendScripts.refused('ERR_FILE_TOO_LARGE'));
    fake.scriptSend(sendScripts.sent('L3', 103));
    const opts = options([
      uploaded('f1', 'image', 'a.png'),
      queuedOffline('q1', 'offline-1.png'),
      queuedOffline('q2', 'offline-2.png'),
    ]);
    await sendBatch(opts.batch);
    expect(fake.callsTo('sendMediaMessage')).toHaveLength(3);
    expect(opts.onSent).toHaveBeenCalledTimes(1);
    expect((opts.onSent.mock.calls[0]?.[0] as CometChat.BaseMessage).getId()).toBe(103);
    expect(opts.onSendButtonClick).toHaveBeenCalledTimes(1);
  });

  it('only queued files: the first carries the quote and the thread, the last the caption', async () => {
    fake.scriptSend(sendScripts.queued('Q1'));
    fake.scriptSend(sendScripts.queued('Q2'));
    const opts = options([queuedOffline('q1', 'one.png'), queuedOffline('q2', 'two.png')], {
      parentMessageId: 5,
      messageToReply: quoted,
      caption: '  both  ',
    });
    await sendBatch(opts.batch);
    const sends = fake.callsTo('sendMediaMessage').map(([m]) => m as CometChat.MediaMessage);
    expect(sends).toHaveLength(2);
    expect(sends.map(m => m.getParentMessageId())).toEqual([5, 5]);
    expect(sends.every(m => m.isThreadSubscribed())).toBe(true);
    expect(sends[0]?.getQuotedMessageId()).toBe(77);
    expect(sends[1]?.getQuotedMessageId()).toBeFalsy();
    expect(sends[0]?.getCaption()).toBeFalsy();
    expect(sends[1]?.getCaption()).toBe('both');
    // Each carries its own file, not an uploaded attachment.
    expect(sends.map(m => (m.getMetadata() as { fileName?: string }).fileName)).toEqual([
      'one.png',
      'two.png',
    ]);
  });

  it('a queued file after uploaded ones is not the lead: no quote on it', async () => {
    fake.scriptSend(sendScripts.sent('L1', 1));
    fake.scriptSend(sendScripts.queued('Q1'));
    const opts = options([uploaded('f1', 'image', 'a.png'), queuedOffline('q1', 'late.png')], {
      messageToReply: quoted,
    });
    await sendBatch(opts.batch);
    const sends = fake.callsTo('sendMediaMessage').map(([m]) => m as CometChat.MediaMessage);
    expect(sends[0]?.getQuotedMessageId()).toBe(77);
    expect(sends[1]?.getQuotedMessageId()).toBeFalsy();
  });

  describe('offline turned off between the failed upload and Send', () => {
    // The item was flagged `queueOffline` while offline was on; the kill switch
    // (or the next login) then turned offline off. Sending it anyway reached
    // `sendWithState`'s listener form with the gate off, where no callback is
    // guaranteed to fire: `await sendBatch` could hang and the composer never
    // released its upload. Review: Prajwal `sendBatch.ts:301` on #2460.
    beforeEach(() => {
      fake.setEnabled(false);
    });

    it('only queued files: nothing is sent and the batch returns', async () => {
      const opts = options([queuedOffline('q1', 'one.png')]);
      await sendBatch(opts.batch);
      expect(fake.callsTo('sendMediaMessage')).toHaveLength(0);
      expect(published(opts.publish)).toEqual([]);
      expect(opts.onSent).not.toHaveBeenCalled();
    });

    it('an uploaded file beside it still goes, and keeps the caption', async () => {
      const opts = options([uploaded('f1', 'image', 'a.png'), queuedOffline('q1', 'late.png')], {
        caption: '  just this  ',
      });
      await sendBatch(opts.batch);
      const sends = fake.callsTo('sendMediaMessage').map(([m]) => m as CometChat.MediaMessage);
      expect(sends).toHaveLength(1);
      expect(sends[0]?.getCaption()).toBe('just this');
    });
  });

  it('a logged-in user lookup that fails still sends, with no sender set', async () => {
    vi.spyOn(CometChat, 'getLoggedinUser').mockRejectedValue(new Error('not ready'));
    fake.scriptSend(sendScripts.queued('Q1'));
    const opts = options([queuedOffline('q1', 'x.png')]);
    await sendBatch(opts.batch);
    const [message] = fake.callsTo('sendMediaMessage')[0] as [CometChat.MediaMessage];
    expect(message.getSender()).toBeFalsy();
    expect(opts.onSent).toHaveBeenCalledTimes(1);
  });
});
