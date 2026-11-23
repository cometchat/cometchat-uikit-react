/**
 * R162 / S73: Retry or Delete tapped on a message whose send is under way is
 * answered ERROR_OFFLINE_MESSAGE_IN_FLIGHT by the SDK; the list then shows a
 * short "Sending… try again in a moment" notice that goes by itself, one at a
 * time.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { OfflineHub } from '../../../utils/offline/hub';
import { discardUnsentMessage, retryFailedMessage } from '../../../utils/offline/send';
import {
  installOfflineSdk,
  offlineMessage,
  textMessage,
  type OfflineSdkFake,
} from '../../../testing/offline-sdk-fake';
import {
  CometChatMessageListOfflineNotices,
  QUEUE_FULL_NOTICE_MS,
  SEND_IN_FLIGHT_NOTICE_MS,
} from '../CometChatMessageListOfflineNotices';

describe('the "Sending… try again" notice (R162)', () => {
  let fake: OfflineSdkFake;
  const me = new CometChat.User({ uid: 'me', name: 'me' });
  const peer = new CometChat.User({ uid: 'peer', name: 'peer' });

  beforeEach(() => {
    vi.useFakeTimers();
    OfflineHub.resetForTests();
    fake = installOfflineSdk({ enabled: true });
    fake.discardResult = 'reject';
    fake.rejectCode = 'ERROR_OFFLINE_MESSAGE_IN_FLIGHT';
  });

  afterEach(() => {
    vi.useRealTimers();
    fake.restore();
    OfflineHub.resetForTests();
  });

  const sending = () =>
    offlineMessage(textMessage('going', 'peer'), {
      localMessageId: 'LS',
      muid: 'MS',
      status: 'SENDING',
    });

  const renderNotices = () =>
    render(
      <CometChatMessageListOfflineNotices
        user={peer}
        group={undefined}
        parentMessageId={undefined}
        loggedInUser={me}
      />
    );

  it('Retry on a sending row shows it, keyed send_in_flight, and it dismisses itself', async () => {
    renderNotices();
    await act(async () => {
      await retryFailedMessage(sending());
    });
    const notice = screen.getByTestId('offline-notice');
    expect(notice.getAttribute('data-cc-key')).toBe('send_in_flight');
    expect(notice.textContent).toContain('Sending… try again in a moment');
    act(() => {
      vi.advanceTimersByTime(SEND_IN_FLIGHT_NOTICE_MS - 1);
    });
    expect(screen.queryByTestId('offline-notice')).not.toBeNull();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.queryByTestId('offline-notice')).toBeNull();
  });

  it('repeated taps show one notice, not a stack', async () => {
    renderNotices();
    await act(async () => {
      await retryFailedMessage(sending());
      await discardUnsentMessage(sending());
      await retryFailedMessage(sending());
    });
    expect(screen.getAllByTestId('offline-notice')).toHaveLength(1);
  });

  it('other notices stay until dismissed', async () => {
    renderNotices();
    act(() => {
      OfflineHub.getInstance().raiseNotice({
        kind: 'file_too_large_offline',
        message: textMessage('x', 'peer'),
      });
    });
    await act(async () => {
      await retryFailedMessage(sending());
    });
    act(() => {
      vi.advanceTimersByTime(QUEUE_FULL_NOTICE_MS * 2);
    });
    const left = screen.getAllByTestId('offline-notice');
    expect(left.map(n => n.getAttribute('data-cc-key'))).toEqual(['file_too_large_offline']);
  });

  it('"Too many messages waiting to send" goes by itself once the queue has had time to drain', () => {
    renderNotices();
    act(() => {
      OfflineHub.getInstance().raiseNotice({
        kind: 'queue_full',
        message: textMessage('x', 'peer'),
      });
    });
    expect(screen.getByTestId('offline-notice').textContent).toContain(
      'Too many messages waiting to send'
    );
    act(() => {
      vi.advanceTimersByTime(QUEUE_FULL_NOTICE_MS - 1);
    });
    expect(screen.queryByTestId('offline-notice')).not.toBeNull();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.queryByTestId('offline-notice')).toBeNull();
  });

  it('unmounting clears its timer', async () => {
    const { unmount } = renderNotices();
    await act(async () => {
      await retryFailedMessage(sending());
    });
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('offline notices across chats, and Copy', () => {
  const me = new CometChat.User({ uid: 'me', name: 'me' });
  const peer = new CometChat.User({ uid: 'peer', name: 'peer' });
  const other = new CometChat.User({ uid: 'other', name: 'other' });
  let fake: OfflineSdkFake;

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk({ enabled: true });
  });

  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
  });

  const notices = (user: CometChat.User) => (
    <CometChatMessageListOfflineNotices
      user={user}
      group={undefined}
      parentMessageId={undefined}
      loggedInUser={me}
    />
  );

  it('a notice of one chat is not carried to the next chat', () => {
    const { rerender } = render(notices(peer));
    act(() => {
      OfflineHub.getInstance().raiseNotice({
        kind: 'queue_full',
        message: textMessage('x', 'peer'),
      });
    });
    expect(screen.getAllByTestId('offline-notice')).toHaveLength(1);
    rerender(notices(other));
    expect(screen.queryAllByTestId('offline-notice')).toHaveLength(0);
  });

  it('Copy without the Clipboard API does not throw and closes the notice', () => {
    const saved = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    try {
      render(notices(peer));
      act(() => {
        OfflineHub.getInstance().raiseNotice({
          kind: 'unsent_message_removed',
          count: 1,
          message: textMessage('keep me', 'peer'),
        });
      });
      const copy = screen.getByText(/copy/i);
      expect(() => {
        act(() => {
          copy.click();
        });
      }).not.toThrow();
      expect(screen.queryAllByTestId('offline-notice')).toHaveLength(0);
    } finally {
      if (saved) Object.defineProperty(navigator, 'clipboard', saved);
      else Reflect.deleteProperty(navigator, 'clipboard');
    }
  });
});
