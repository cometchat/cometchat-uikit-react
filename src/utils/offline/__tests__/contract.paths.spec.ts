/**
 * The state contract's receipt mapping and the frame probe in an E2E source
 * build (`__CC_FRAME_PROBE__` defined true).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { contractRowOf, contractRowStateOf, reportFrame } from '../contract';
import { OfflineHub } from '../hub';
import * as receipts from '../../MessageReceiptUtils';
import {
  installOfflineSdk,
  offlineMessage,
  textMessage,
  type OfflineSdkFake,
} from '../../../testing/offline-sdk-fake';

interface ProbeGlobals {
  __CC_FRAME_PROBE__?: boolean;
  __ccFrameProbe?: unknown;
}
const g = globalThis as ProbeGlobals;

describe('contractRowStateOf: the receipt when there is no offline send state', () => {
  let fake: OfflineSdkFake;
  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk({ enabled: false });
  });
  afterEach(() => {
    vi.restoreAllMocks();
    fake.restore();
    OfflineHub.resetForTests();
  });

  it('wait → sending, error → failed, delivered, read', () => {
    const inFlight = textMessage('a');
    expect(contractRowStateOf(inFlight)).toBe('sending');

    const errored = textMessage('b');
    (errored as unknown as { error: unknown }).error = { code: 'ERR_PERMISSION' };
    expect(contractRowStateOf(errored)).toBe('failed');

    const delivered = offlineMessage(textMessage('c'), { id: 3, sentAt: 1 });
    delivered.setDeliveredAt(2);
    expect(contractRowStateOf(delivered)).toBe('delivered');

    const read = offlineMessage(textMessage('d'), { id: 4, sentAt: 1 });
    read.setDeliveredAt(2);
    read.setReadAt(3);
    expect(contractRowStateOf(read)).toBe('read');
  });

  it('a receipt lookup that throws reads as sent', () => {
    vi.spyOn(receipts, 'getReceiptStatus').mockImplementation(() => {
      throw new Error('broken message');
    });
    expect(contractRowStateOf(textMessage('e'))).toBe('sent');
  });

  it('a sender getter that throws, or no sender, is not mine', () => {
    const m = offlineMessage(textMessage('f'), { id: 9, sentAt: 1 });
    m.getSender = () => {
      throw new Error('no sender');
    };
    expect(contractRowOf(m, 'me').mine).toBe(false);
    const orphan = offlineMessage(textMessage('g'), { id: 10, sentAt: 1 });
    orphan.getSender = () => undefined as unknown as CometChat.User;
    expect(contractRowOf(orphan, '').mine).toBe(true);
    expect(contractRowOf(orphan, 'me').mine).toBe(false);
  });
});

describe('reportFrame in an E2E source build', () => {
  beforeEach(() => {
    g.__CC_FRAME_PROBE__ = true;
  });
  afterEach(() => {
    delete g.__CC_FRAME_PROBE__;
    delete g.__ccFrameProbe;
  });

  it('hands the list name and the built rows to the installed probe', () => {
    const probe = vi.fn();
    g.__ccFrameProbe = probe;
    reportFrame('conversations', () => [{ key: 'a' }]);
    expect(probe).toHaveBeenCalledWith({ list: 'conversations', rows: [{ key: 'a' }] });
  });

  it('no probe installed: the rows are never built', () => {
    const build = vi.fn(() => []);
    reportFrame('messages', build);
    expect(build).not.toHaveBeenCalled();
  });

  it("a probe's own error, or a row builder's, never reaches the list", () => {
    g.__ccFrameProbe = () => {
      throw new Error('probe broke');
    };
    expect(() => reportFrame('messages', () => [])).not.toThrow();
    g.__ccFrameProbe = vi.fn();
    expect(() =>
      reportFrame('messages', () => {
        throw new Error('rows broke');
      })
    ).not.toThrow();
  });

  it('defined false (the published build): inert even with a probe', () => {
    g.__CC_FRAME_PROBE__ = false;
    const probe = vi.fn();
    g.__ccFrameProbe = probe;
    reportFrame('messages', () => []);
    expect(probe).not.toHaveBeenCalled();
  });
});
