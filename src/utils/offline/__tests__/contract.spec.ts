/**
 * The state contract (TEST-PLAN §3.3): row identifiers carry key, id, state and
 * mine, never text; the same identifiers with offline on and off; the frame
 * probe is inert unless the build defines it and the page installs it.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { contractRowOf, messageRowAttributes, reportFrame } from '../contract';
import { OfflineHub } from '../hub';
import {
  installOfflineSdk,
  offlineMessage,
  textMessage,
  type OfflineSdkFake,
} from '../../../testing/offline-sdk-fake';

describe('state contract (TEST-PLAN §3.3)', () => {
  let fake: OfflineSdkFake;

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk({ enabled: true });
  });

  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
  });

  it('an own pending row: renderKey, no server id, sending, mine; no text', () => {
    const m = offlineMessage(textMessage('secret words', 'peer', 'user', 'me'), {
      localMessageId: 'L1',
      muid: 'M1',
      status: 'PENDING',
    });
    const attributes = messageRowAttributes(contractRowOf(m, 'me'));
    expect(attributes).toEqual({
      'data-cc': 'message-row',
      'data-cc-key': 'm:M1',
      'data-cc-id': '',
      'data-cc-state': 'sending',
      'data-cc-mine': 'true',
    });
    expect(JSON.stringify(attributes)).not.toContain('secret');
  });

  it('a failed outbox row reads failed; an acked one its receipt', () => {
    const failed = offlineMessage(textMessage('f'), { localMessageId: 'L2', status: 'FAILED' });
    expect(contractRowOf(failed, 'me').state).toBe('failed');
    const sent = offlineMessage(textMessage('s'), { id: 12, muid: 'M3', sentAt: 5 });
    const row = contractRowOf(sent, 'me');
    expect(row.id).toBe('12');
    expect(row.state).toBe('sent');
  });

  it("offline off: the same identifiers, from today's receipt", () => {
    fake.setEnabled(false);
    const other = offlineMessage(textMessage('x', 'me', 'user', 'sam'), { id: 7, sentAt: 1 });
    expect(contractRowOf(other, 'me')).toEqual({ key: 's:7', id: '7', state: 'sent', mine: false });
  });

  it('the frame probe is inert unless the build defines it (the package defines it false)', () => {
    const probe = vi.fn();
    (globalThis as { __ccFrameProbe?: unknown }).__ccFrameProbe = probe;
    const build = vi.fn(() => []);
    reportFrame('messages', build);
    // vitest defines nothing: like a package build, nothing is collected.
    expect(probe).not.toHaveBeenCalled();
    expect(build).not.toHaveBeenCalled();
    delete (globalThis as { __ccFrameProbe?: unknown }).__ccFrameProbe;
  });
});
