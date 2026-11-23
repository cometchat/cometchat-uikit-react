/**
 * AC-12.4: a file attached offline can be sent. Its upload cannot reach the
 * server, so Send queues the file itself and the SDK uploads it when the
 * connection returns. Any other failed upload still holds Send, and with offline
 * off nothing here applies.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  composerReducer,
  initialComposerState,
  selectCanSend,
} from '../CometChatMessageComposer.reducer';
import type { TrayItem } from '../CometChatMessageComposer.types';
import { sendBatch } from '../sendBatch';
import { OfflineHub } from '../../../utils/offline/hub';
import {
  installOfflineSdk,
  sendScripts,
  type OfflineSdkFake,
} from '../../../testing/offline-sdk-fake';

describe('a file attached offline (AC-12.4)', () => {
  let fake: OfflineSdkFake;

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

  const file = new File(['x'], 'photo.png', { type: 'image/png' });
  const failedOffline = {
    fileId: 'f1',
    file,
    kind: 'image' as const,
    status: 'failed' as const,
    percent: 0,
    queueOffline: true,
  };
  const batch = (items: TrayItem[], caption = '') => ({
    items,
    batchId: 'b1',
    caption,
    receiverId: 'sam',
    receiverType: 'user',
    publish: vi.fn(),
  });

  it('an upload that could not reach the server lets Send go', () => {
    expect(selectCanSend({ items: [failedOffline], batchId: 'b1' } as never)).toBe(true);
  });

  it('any other failed upload still holds Send', () => {
    const failed: TrayItem = { ...failedOffline, queueOffline: false };
    expect(selectCanSend({ items: [failed], batchId: 'b1' } as never)).toBe(false);
  });

  it('a retry clears the mark: it is uploading again', () => {
    const state = composerReducer(
      { ...initialComposerState, tray: { ...initialComposerState.tray, items: [failedOffline] } },
      { type: 'TRAY_UPDATE_STATUS', fileId: 'f1', status: 'uploading' }
    );
    expect(state.tray.items[0]?.queueOffline).toBeUndefined();
  });

  it('Send queues the file itself through the helper, as one message with the caption', async () => {
    fake.scriptSend(sendScripts.queued('L1'));
    const options = batch([failedOffline], 'look');
    await sendBatch(options);
    const sends = fake.callsTo('sendMediaMessage');
    expect(sends).toHaveLength(1);
    const message = sends[0]?.[0] as CometChat.MediaMessage;
    expect(message.getReceiverId()).toBe('sam');
    expect(message.getType()).toBe('image');
    expect(sends[0]?.[1]).toBeDefined();
    expect(message.getCaption()).toBe('look');
    expect(options.publish).toHaveBeenCalledTimes(1);
  });

  it('uploaded files keep their path; the caption stays on the very last message', async () => {
    fake.scriptSend(sendScripts.sent('L1', 5));
    fake.scriptSend(sendScripts.queued('L2'));
    const uploaded: TrayItem = {
      fileId: 'f0',
      file,
      kind: 'image',
      status: 'success',
      percent: 100,
      attachment: new CometChat.Attachment({ url: 'https://x/y.png', name: 'y.png' }),
    };
    await sendBatch(batch([uploaded, failedOffline], 'look'));
    const sends = fake.callsTo('sendMediaMessage');
    expect(sends).toHaveLength(2);
    expect((sends[0]?.[0] as CometChat.MediaMessage).getCaption()).toBeFalsy();
    expect((sends[1]?.[0] as CometChat.MediaMessage).getCaption()).toBe('look');
  });

  it('with offline off no file carries the mark: failed files are not sent, as today', async () => {
    fake.setEnabled(false);
    const failed: TrayItem = { ...failedOffline, queueOffline: false };
    await sendBatch(batch([failed]));
    expect(fake.callsTo('sendMediaMessage')).toHaveLength(0);
  });
});
