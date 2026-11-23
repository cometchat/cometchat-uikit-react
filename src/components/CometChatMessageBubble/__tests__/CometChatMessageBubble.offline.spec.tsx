/**
 * An own message not sent yet: the clock with "Not sent yet", or the error
 * mark with "Not sent. Tap to retry" and a Retry button; no receipt tick.
 * With offline off the bubble renders exactly as before.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CometChatMessageBubble } from '../CometChatMessageBubble';
import { OfflineHub } from '../../../utils/offline/hub';
import {
  getUnsentMessageOptions,
  MESSAGE_OPTION_IDS,
} from '../../../plugins/core/shared/CometChatMessageOptions';
import {
  installOfflineSdk,
  offlineMessage,
  textMessage,
  type OfflineSdkFake,
} from '../../../testing/offline-sdk-fake';
import type { CometChatMessagePluginContext } from '../../../plugins/plugin.types';
import { CometChat } from '@cometchat/chat-sdk-javascript';

describe('offline send state in the bubble (UIK-SEND-04/06, UIK-A11Y-01)', () => {
  let fake: OfflineSdkFake;

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk({ enabled: true });
  });

  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
  });

  const content = <span>Hi</span>;

  it('queued: clock + "Not sent yet", no Retry', () => {
    const m = offlineMessage(textMessage('hi'), {
      localMessageId: 'L1',
      muid: 'M1',
      status: 'PENDING',
      sentAt: 1,
    });
    const { container } = render(
      <CometChatMessageBubble message={m} alignment="right" contentView={content} />
    );
    expect(screen.getByRole('img', { name: 'Not sent yet' })).toBeInTheDocument();
    expect(container.querySelector('.cometchat-receipts-wait')).not.toBeNull();
    expect(screen.queryByTestId('offline-retry')).toBeNull();
  });

  it('failed in the outbox: error mark, label and a Retry that calls retryMessage(localId)', () => {
    const m = offlineMessage(textMessage('hi'), {
      localMessageId: 'L2',
      muid: 'M2',
      status: 'FAILED',
      sentAt: 1,
    });
    const { container } = render(
      <CometChatMessageBubble message={m} alignment="right" contentView={content} />
    );
    expect(container.querySelector('.cometchat-receipts-error')).not.toBeNull();
    fireEvent.click(screen.getByTestId('offline-retry'));
    fireEvent.click(screen.getByTestId('offline-retry'));
    expect(fake.callsTo('retryMessage').map(a => a[0])).toEqual(['L2']);
  });

  it('offline off: today’s receipt (no offline label, no Retry)', () => {
    fake.setEnabled(false);
    const m = offlineMessage(textMessage('hi'), {
      localMessageId: 'L3',
      muid: 'M3',
      status: 'FAILED',
      sentAt: 1,
    });
    render(<CometChatMessageBubble message={m} alignment="right" contentView={content} />);
    expect(screen.queryByTestId('offline-retry')).toBeNull();
    expect(screen.queryByRole('img', { name: 'Not sent. Tap to retry' })).toBeNull();
  });

  it('a failed (direct) mark still shows after offline was switched off (kill switch)', () => {
    const m = offlineMessage(textMessage('hi'), { muid: 'M4', sentAt: 1 });
    OfflineHub.getInstance().markDirectFailed(m, '');
    fake.setEnabled(false);
    render(<CometChatMessageBubble message={m} alignment="right" contentView={content} />);
    expect(screen.getByTestId('offline-retry')).toBeInTheDocument();
  });
});

describe('options for an unsent row (BEH-SEND-37, R162)', () => {
  const context = {
    loggedInUser: new CometChat.User({ uid: 'me', name: 'me' }),
    getLocalizedString: (k: string) => k,
  } as unknown as CometChatMessagePluginContext;

  it('offers only Retry and Delete, as the row allows; nothing that needs a server id', () => {
    const m = offlineMessage(textMessage('hi'), { localMessageId: 'L', status: 'PENDING' });
    expect(
      getUnsentMessageOptions(m, context, { retry: true, discard: true }).map(o => o.id)
    ).toEqual([MESSAGE_OPTION_IDS.retryMessage, MESSAGE_OPTION_IDS.discardMessage]);
    expect(
      getUnsentMessageOptions(m, context, { retry: false, discard: true }).map(o => o.id)
    ).toEqual([MESSAGE_OPTION_IDS.discardMessage]);
    expect(getUnsentMessageOptions(m, context, { retry: false, discard: false })).toEqual([]);
  });

  it('honours hideDeleteMessageOption', () => {
    const m = offlineMessage(textMessage('hi'), { localMessageId: 'L', status: 'FAILED' });
    const hidden = { ...context, hideDeleteMessageOption: true };
    expect(
      getUnsentMessageOptions(m, hidden, { retry: true, discard: true }).map(o => o.id)
    ).toEqual([MESSAGE_OPTION_IDS.retryMessage]);
  });

  it("Delete that went out meanwhile hands the sent copy to today's delete path", async () => {
    OfflineHub.resetForTests();
    const fake = installOfflineSdk({ enabled: true });
    try {
      const onDeleteMessage = vi.fn();
      const showToast = vi.fn();
      const ctx = { ...context, onDeleteMessage, showToast } as CometChatMessagePluginContext;
      const pending = offlineMessage(textMessage('hi'), {
        localMessageId: 'LS',
        muid: 'MS',
        status: 'PENDING',
      });
      const sent = offlineMessage(textMessage('hi'), { localMessageId: 'LS', id: 42 });
      OfflineHub.getInstance().reportSendState(sent, 'sent');
      fake.discardResult = 'reject';
      fake.rejectCode = 'ERROR_OFFLINE_MESSAGE_NOT_FOUND';
      const del = getUnsentMessageOptions(pending, ctx, { retry: true, discard: true }).find(
        o => o.id === MESSAGE_OPTION_IDS.discardMessage
      );
      del?.onClick(pending);
      await vi.waitFor(() => {
        expect(onDeleteMessage).toHaveBeenCalledWith(sent);
      });
      expect(showToast).not.toHaveBeenCalled();
    } finally {
      fake.restore();
      OfflineHub.resetForTests();
    }
  });

  for (const connected of [false, true]) {
    it(`Delete answered NOT_FOUND on a row with no server id removes it, no error toast (${connected ? 'online' : 'offline'})`, async () => {
      OfflineHub.resetForTests();
      const fake = installOfflineSdk({ enabled: true });
      fake.connected = connected;
      try {
        const onDeleteMessage = vi.fn();
        const showToast = vi.fn();
        const ctx = { ...context, onDeleteMessage, showToast } as CometChatMessagePluginContext;
        const states: string[] = [];
        OfflineHub.getInstance().sendState.subscribe(e => states.push(e.state));
        const failed = offlineMessage(textMessage('hi'), {
          localMessageId: 'LP',
          muid: 'MP',
          status: 'FAILED',
        });
        fake.discardResult = 'reject';
        fake.rejectCode = 'ERROR_OFFLINE_MESSAGE_NOT_FOUND';
        getUnsentMessageOptions(failed, ctx, { retry: true, discard: true })
          .find(o => o.id === MESSAGE_OPTION_IDS.discardMessage)
          ?.onClick(failed);
        await vi.waitFor(() => {
          expect(states).toEqual(['discarded']);
        });
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(showToast).not.toHaveBeenCalled();
        expect(onDeleteMessage).not.toHaveBeenCalled();
      } finally {
        fake.restore();
        OfflineHub.resetForTests();
      }
    });
  }

  it('Delete refused IN_FLIGHT keeps the row and raises the "Sending…" notice, no error toast (R162)', async () => {
    OfflineHub.resetForTests();
    const fake = installOfflineSdk({ enabled: true });
    try {
      const showToast = vi.fn();
      const ctx = { ...context, showToast } as CometChatMessagePluginContext;
      const states: string[] = [];
      const notices: string[] = [];
      OfflineHub.getInstance().sendState.subscribe(e => states.push(e.state));
      OfflineHub.getInstance().notice.subscribe(n => notices.push(n.kind));
      const sending = offlineMessage(textMessage('hi'), {
        localMessageId: 'LI',
        status: 'SENDING',
      });
      fake.discardResult = 'reject';
      fake.rejectCode = 'ERROR_OFFLINE_MESSAGE_IN_FLIGHT';
      getUnsentMessageOptions(sending, ctx, { retry: true, discard: true })
        .find(o => o.id === MESSAGE_OPTION_IDS.discardMessage)
        ?.onClick(sending);
      await vi.waitFor(() => {
        expect(notices).toEqual(['send_in_flight']);
      });
      expect(showToast).not.toHaveBeenCalled();
      expect(states).toEqual([]);
    } finally {
      fake.restore();
      OfflineHub.resetForTests();
    }
  });

  it('Retry refused IN_FLIGHT changes nothing and raises the "Sending…" notice (R162)', async () => {
    OfflineHub.resetForTests();
    const fake = installOfflineSdk({ enabled: true });
    try {
      const notices: string[] = [];
      OfflineHub.getInstance().notice.subscribe(n => notices.push(n.kind));
      const sending = offlineMessage(textMessage('hi'), {
        localMessageId: 'LR',
        muid: 'MR',
        status: 'SENDING',
      });
      fake.discardResult = 'reject';
      fake.rejectCode = 'ERROR_OFFLINE_MESSAGE_IN_FLIGHT';
      getUnsentMessageOptions(sending, context, { retry: true, discard: true })
        .find(o => o.id === MESSAGE_OPTION_IDS.retryMessage)
        ?.onClick(sending);
      await vi.waitFor(() => {
        expect(notices).toEqual(['send_in_flight']);
      });
      expect(fake.callsTo('retryMessage').map(a => a[0])).toEqual(['LR']);
      expect(fake.callsTo('sendMessage')).toEqual([]);
    } finally {
      fake.restore();
      OfflineHub.resetForTests();
    }
  });
});

describe('failed rows in the bubble (BEH-SEND-37, R162)', () => {
  let fake: OfflineSdkFake;

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk({ enabled: true });
  });

  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
  });

  it('FAILED + PERMANENT: Retry too, whatever the reason (R162)', () => {
    const m = offlineMessage(textMessage('hi'), {
      localMessageId: 'LP',
      muid: 'MP',
      status: 'FAILED',
      failureReason: 'PERMANENT',
      sentAt: 1,
    });
    render(<CometChatMessageBubble message={m} alignment="right" contentView={<span>x</span>} />);
    expect(screen.getByRole('img', { name: 'Not sent. Tap to retry' })).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('offline-retry'));
    expect(fake.callsTo('retryMessage').map(a => a[0])).toEqual(['LP']);
  });

  it('SENDING: the clock, no Retry', () => {
    const m = offlineMessage(textMessage('hi'), {
      localMessageId: 'LSE',
      muid: 'MSE',
      status: 'SENDING',
      sentAt: 1,
    });
    render(<CometChatMessageBubble message={m} alignment="right" contentView={<span>x</span>} />);
    expect(screen.queryByTestId('offline-retry')).toBeNull();
    expect(screen.getByRole('img', { name: 'Not sent yet' })).toBeInTheDocument();
  });
});
