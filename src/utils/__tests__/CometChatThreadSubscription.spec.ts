import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockSubscribe = vi.fn();
const mockUnsubscribe = vi.fn();

vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
    RECEIVER_TYPE: { USER: 'user', GROUP: 'group' },
    subscribeToThread: (id: number) => mockSubscribe(id) as unknown,
    unsubscribeFromThread: (id: number) => mockUnsubscribe(id) as unknown,
  },
}));

import {
  getSubscriptionTargetId,
  readThreadSubscribed,
  writeThreadSubscribed,
  carryThreadSubscribed,
  mirrorThreadSubscribed,
  applyIncomingReplySubscription,
  isThreadSubscriptionSupported,
  resetThreadSubscriptionGuards,
  toggleThreadSubscription,
  toThreadId,
} from '../CometChatThreadSubscription';
import { buildTextMessage, buildUser } from '../../testing/mock-builders';
import { CometChat } from '@cometchat/chat-sdk-javascript';

const PARENT_ID = 101;

function message(over: Record<string, unknown> = {}) {
  return buildTextMessage(over) as unknown as CometChat.BaseMessage;
}

beforeEach(() => {
  vi.clearAllMocks();
  resetThreadSubscriptionGuards();
  mockSubscribe.mockResolvedValue('ok');
  mockUnsubscribe.mockResolvedValue('ok');
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('isThreadSubscriptionSupported', () => {
  it('is true when the linked SDK exposes the write API', () => {
    expect(isThreadSubscriptionSupported()).toBe(true);
  });

  it('is false when the write API is absent — the surfaces hide rather than fail', () => {
    // eslint-disable-next-line @typescript-eslint/unbound-method -- capturing the mock to restore it, not calling it
    const orig = CometChat.subscribeToThread;
    (CometChat as unknown as { subscribeToThread?: unknown }).subscribeToThread = undefined;
    expect(isThreadSubscriptionSupported()).toBe(false);
    (CometChat as unknown as { subscribeToThread?: unknown }).subscribeToThread = orig;
  });
});

describe('toThreadId', () => {
  it('coerces a string id so bus matching still works', () => {
    expect(toThreadId('101')).toBe(101);
  });

  it('rejects junk rather than producing NaN', () => {
    expect(toThreadId(undefined)).toBe(0);
    expect(toThreadId('abc')).toBe(0);
    expect(toThreadId(-5)).toBe(0);
    expect(toThreadId(0)).toBe(0);
  });
});

describe('readThreadSubscribed — the flag is read off the message', () => {
  it('is true when the message reports subscribed', () => {
    expect(readThreadSubscribed(message({ threadSubscribed: true }))).toBe(true);
  });

  it('is false when the message reports not subscribed', () => {
    expect(readThreadSubscribed(message({ threadSubscribed: false }))).toBe(false);
  });

  it('is false, never a throw, for null/undefined or a message missing the accessor', () => {
    expect(readThreadSubscribed(null)).toBe(false);
    expect(readThreadSubscribed(undefined)).toBe(false);
    expect(readThreadSubscribed({} as unknown as CometChat.BaseMessage)).toBe(false);
  });
});

describe('writeThreadSubscribed — mirror the flag onto a held message', () => {
  it('writes through the SDK setter', () => {
    const msg = message({ threadSubscribed: false });
    writeThreadSubscribed(msg, true);
    expect(msg.isThreadSubscribed()).toBe(true);
    writeThreadSubscribed(msg, false);
    expect(msg.isThreadSubscribed()).toBe(false);
  });

  it('is a no-op, never a throw, when the setter is missing or the message is null', () => {
    expect(() => writeThreadSubscribed({} as unknown as CometChat.BaseMessage, true)).not.toThrow();
    expect(() => writeThreadSubscribed(null, true)).not.toThrow();
  });
});

describe('carryThreadSubscribed — preserve the flag across a wholesale replacement', () => {
  it('carries a subscribed flag onto a replacement that lacks it (edit/moderation frame)', () => {
    const previous = message({ threadSubscribed: true });
    const next = message({ threadSubscribed: false });
    carryThreadSubscribed(previous, next);
    expect(next.isThreadSubscribed()).toBe(true);
  });

  it('does not resurrect a deliberate unsubscribe (previous not subscribed)', () => {
    const previous = message({ threadSubscribed: false });
    const next = message({ threadSubscribed: false });
    carryThreadSubscribed(previous, next);
    expect(next.isThreadSubscribed()).toBe(false);
  });

  it('never overrides a replacement that already asserts subscribed', () => {
    const previous = message({ threadSubscribed: false });
    const next = message({ threadSubscribed: true });
    carryThreadSubscribed(previous, next);
    expect(next.isThreadSubscribed()).toBe(true);
  });

  it('is a no-op, never a throw, on null/partial messages', () => {
    expect(() => carryThreadSubscribed(null, null)).not.toThrow();
    expect(() =>
      carryThreadSubscribed(
        message({ threadSubscribed: true }),
        {} as unknown as CometChat.BaseMessage
      )
    ).not.toThrow();
  });
});

describe('mirrorThreadSubscribed — Cases 3 & 4, mirror only', () => {
  it('publishes the optimistic flip to subscribed', () => {
    const publish = vi.fn();
    mirrorThreadSubscribed(PARENT_ID, publish);
    expect(publish).toHaveBeenCalledWith({
      type: 'ui:thread/subscription-changed',
      parentMessageId: PARENT_ID,
      subscribed: true,
    });
  });

  it('does NOT call subscribeToThread — the server already made the write', () => {
    mirrorThreadSubscribed(PARENT_ID, vi.fn());
    expect(mockSubscribe).not.toHaveBeenCalled();
    expect(mockUnsubscribe).not.toHaveBeenCalled();
  });

  it('coerces a string id so a numeric consumer still matches', () => {
    const publish = vi.fn();
    mirrorThreadSubscribed('101' as unknown as number, publish);
    expect(publish).toHaveBeenCalledWith({
      type: 'ui:thread/subscription-changed',
      parentMessageId: 101,
      subscribed: true,
    });
  });

  it('is a no-op for a missing parent id', () => {
    const publish = vi.fn();
    mirrorThreadSubscribed(0, publish);
    expect(publish).not.toHaveBeenCalled();
  });
});

describe('applyIncomingReplySubscription — reconcile a realtime reply', () => {
  const ME = 'me';

  function reply(over: Record<string, unknown> = {}) {
    return buildTextMessage({
      id: 9,
      parentMessageId: 5,
      sender: buildUser({ uid: 'peer' }),
      ...over,
    }) as unknown as CometChat.BaseMessage;
  }

  it('is a no-op for a non-thread message', () => {
    const publish = vi.fn();
    const top = buildTextMessage({ id: 9, parentMessageId: 0 }) as unknown as CometChat.BaseMessage;
    applyIncomingReplySubscription({ reply: top, loggedInUserUid: ME, publish });
    expect(publish).not.toHaveBeenCalled();
  });

  describe('a reply from someone else that @mentions me (Case 3)', () => {
    const mentioning = () => reply({ mentionedUsers: [buildUser({ uid: ME })] });

    it('stamps the reply, stamps the held parent, and publishes the flip', () => {
      const publish = vi.fn();
      const parent = message({ id: 5, threadSubscribed: false });
      const r = mentioning();

      applyIncomingReplySubscription({
        reply: r,
        parentMessage: parent,
        loggedInUserUid: ME,
        publish,
      });

      expect(r.isThreadSubscribed()).toBe(true);
      expect(parent.isThreadSubscribed()).toBe(true);
      expect(publish).toHaveBeenCalledWith({
        type: 'ui:thread/subscription-changed',
        parentMessageId: 5,
        subscribed: true,
      });
    });

    it('never issues a server write — the server already subscribed me', () => {
      applyIncomingReplySubscription({
        reply: mentioning(),
        parentMessage: message({ id: 5 }),
        loggedInUserUid: ME,
        publish: vi.fn(),
      });
      expect(mockSubscribe).not.toHaveBeenCalled();
    });

    it('still flips surfaces in the main list, where no parent is held', () => {
      const publish = vi.fn();
      applyIncomingReplySubscription({ reply: mentioning(), loggedInUserUid: ME, publish });
      expect(publish).toHaveBeenCalledWith({
        type: 'ui:thread/subscription-changed',
        parentMessageId: 5,
        subscribed: true,
      });
    });
  });

  describe('an ordinary reply inherits the thread state onto the socket frame', () => {
    it('stamps true when the thread is followed', () => {
      const publish = vi.fn();
      const r = reply();
      applyIncomingReplySubscription({
        reply: r,
        parentMessage: message({ id: 5, threadSubscribed: true }),
        loggedInUserUid: ME,
        publish,
      });
      expect(r.isThreadSubscribed()).toBe(true);
      expect(publish).not.toHaveBeenCalled();
    });

    it('stamps false when the thread is not followed', () => {
      const r = reply();
      applyIncomingReplySubscription({
        reply: r,
        parentMessage: message({ id: 5, threadSubscribed: false }),
        loggedInUserUid: ME,
        publish: vi.fn(),
      });
      expect(r.isThreadSubscribed()).toBe(false);
    });

    it('mirrors on my OWN reply — a fresh threaded send subscribes me (Case 4)', () => {
      const publish = vi.fn();
      const own = reply({ sender: buildUser({ uid: ME }) });
      const parent = message({ id: 5, threadSubscribed: false });
      applyIncomingReplySubscription({
        reply: own,
        parentMessage: parent,
        loggedInUserUid: ME,
        publish,
      });
      expect(own.isThreadSubscribed()).toBe(true);
      expect(parent.isThreadSubscribed()).toBe(true);
      expect(publish).toHaveBeenCalledWith({
        type: 'ui:thread/subscription-changed',
        parentMessageId: 5,
        subscribed: true,
      });
    });

    it('stamps nothing in the main list (no parent held) for a non-mention reply', () => {
      const publish = vi.fn();
      const r = reply();
      applyIncomingReplySubscription({ reply: r, loggedInUserUid: ME, publish });
      expect(publish).not.toHaveBeenCalled();
      expect(r.isThreadSubscribed()).toBe(false);
    });
  });

  // An edit reuses the same reconciliation but with ownAuthorshipSubscribes=false:
  // a mention (added or preserved, by anyone) subscribes me, but editing my own
  // message without a mention does not.
  describe('an edit (ownAuthorshipSubscribes=false)', () => {
    it('subscribes me when the edited reply @mentions me — from anyone', () => {
      const publish = vi.fn();
      const parent = message({ id: 5, threadSubscribed: false });
      const edited = reply({ mentionedUsers: [buildUser({ uid: ME })] }); // from peer
      applyIncomingReplySubscription({
        reply: edited,
        parentMessage: parent,
        loggedInUserUid: ME,
        publish,
        ownAuthorshipSubscribes: false,
      });
      expect(parent.isThreadSubscribed()).toBe(true);
      expect(publish).toHaveBeenCalledWith({
        type: 'ui:thread/subscription-changed',
        parentMessageId: 5,
        subscribed: true,
      });
    });

    it('does NOT re-subscribe me when I edit my OWN reply without a mention', () => {
      const publish = vi.fn();
      const own = reply({ sender: buildUser({ uid: ME }) });
      applyIncomingReplySubscription({
        reply: own,
        parentMessage: message({ id: 5, threadSubscribed: false }),
        loggedInUserUid: ME,
        publish,
        ownAuthorshipSubscribes: false,
      });
      expect(publish).not.toHaveBeenCalled();
    });

    it('subscribes me when I edit my OWN reply to include a mention of me', () => {
      const publish = vi.fn();
      const own = reply({
        sender: buildUser({ uid: ME }),
        mentionedUsers: [buildUser({ uid: ME })],
      });
      applyIncomingReplySubscription({
        reply: own,
        parentMessage: message({ id: 5, threadSubscribed: false }),
        loggedInUserUid: ME,
        publish,
        ownAuthorshipSubscribes: false,
      });
      expect(publish).toHaveBeenCalledWith({
        type: 'ui:thread/subscription-changed',
        parentMessageId: 5,
        subscribed: true,
      });
    });
  });
});

describe('getSubscriptionTargetId', () => {
  it('uses the message id for a parent message', () => {
    expect(getSubscriptionTargetId(message({ id: 7, parentMessageId: 0 }))).toBe(7);
  });

  it('uses the PARENT id when invoked on a reply — never the reply itself', () => {
    expect(getSubscriptionTargetId(message({ id: 9, parentMessageId: 7 }))).toBe(7);
  });
});

describe('toggleThreadSubscription', () => {
  it('subscribes and publishes the optimistic flip before the ack', async () => {
    const publish = vi.fn();
    let resolveCall: (value: string) => void = () => undefined;
    mockSubscribe.mockReturnValue(
      new Promise<string>(resolve => {
        resolveCall = resolve;
      })
    );

    const pending = toggleThreadSubscription({
      parentMessageId: PARENT_ID,
      subscribe: true,
      publish,
    });

    // Published before the request settles — that is what makes the flip instant.
    expect(publish).toHaveBeenCalledWith({
      type: 'ui:thread/subscription-changed',
      parentMessageId: PARENT_ID,
      subscribed: true,
    });

    resolveCall('ok');
    await expect(pending).resolves.toBe(true);
    expect(mockSubscribe).toHaveBeenCalledWith(PARENT_ID);
    expect(publish).toHaveBeenCalledTimes(1);
  });

  it('confirms with a toast on success', async () => {
    const showToast = vi.fn();
    await toggleThreadSubscription({
      parentMessageId: PARENT_ID,
      subscribe: true,
      showToast,
      getLocalizedString: (key: string) => key,
    });
    expect(showToast).toHaveBeenCalledWith(
      "Subscribed. You'll be notified about new replies in this thread.",
      'default'
    );
  });

  it('confirms with the opposite toast when unsubscribing', async () => {
    const showToast = vi.fn();
    await toggleThreadSubscription({
      parentMessageId: PARENT_ID,
      subscribe: false,
      showToast,
      getLocalizedString: (key: string) => key,
    });
    expect(showToast).toHaveBeenCalledWith(
      'Unsubscribed. Notifications are off until you reply or are mentioned.',
      'default'
    );
  });

  it('accepts a string id — ids arrive as strings from some payloads', async () => {
    const publish = vi.fn();
    await toggleThreadSubscription({
      parentMessageId: '101' as unknown as number,
      subscribe: true,
      publish,
    });

    expect(mockSubscribe).toHaveBeenCalledWith(101);
    // Published as a number, so a numeric consumer's `===` match still lands.
    expect(publish).toHaveBeenCalledWith({
      type: 'ui:thread/subscription-changed',
      parentMessageId: 101,
      subscribed: true,
    });
  });

  it('unsubscribes when subscribe is false', async () => {
    await toggleThreadSubscription({ parentMessageId: PARENT_ID, subscribe: false });
    expect(mockUnsubscribe).toHaveBeenCalledWith(PARENT_ID);
    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it('reverts and toasts when the request fails', async () => {
    const publish = vi.fn();
    const showToast = vi.fn();
    mockSubscribe.mockRejectedValue(new Error('network'));

    await expect(
      toggleThreadSubscription({
        parentMessageId: PARENT_ID,
        subscribe: true,
        publish,
        showToast,
        getLocalizedString: () => 'Nope.',
      })
    ).resolves.toBe(false);

    expect(publish).toHaveBeenNthCalledWith(1, {
      type: 'ui:thread/subscription-changed',
      parentMessageId: PARENT_ID,
      subscribed: true,
    });
    expect(publish).toHaveBeenNthCalledWith(2, {
      type: 'ui:thread/subscription-changed',
      parentMessageId: PARENT_ID,
      subscribed: false,
    });
    expect(showToast).toHaveBeenCalledWith('Nope.', 'error');
  });

  it('falls back to English when the failure key is unresolved', async () => {
    const showToast = vi.fn();
    mockSubscribe.mockRejectedValue(new Error('network'));

    await toggleThreadSubscription({
      parentMessageId: PARENT_ID,
      subscribe: true,
      showToast,
      // Localization returns the key itself when there is no translation.
      getLocalizedString: (key: string) => key,
    });

    expect(showToast).toHaveBeenCalledWith("Couldn't update. Please try again.", 'error');
  });

  it('leaves the control at its pre-click state when a tap is swallowed', async () => {
    // In flight: a second tap for the opposite direction is ignored and reports
    // the state the user is still looking at (the pre-click one).
    let resolveCall: (value: string) => void = () => undefined;
    mockSubscribe.mockReturnValue(
      new Promise<string>(resolve => {
        resolveCall = resolve;
      })
    );

    const first = toggleThreadSubscription({ parentMessageId: PARENT_ID, subscribe: true });
    await expect(
      toggleThreadSubscription({ parentMessageId: PARENT_ID, subscribe: false })
    ).resolves.toBe(true);

    expect(mockUnsubscribe).not.toHaveBeenCalled();
    resolveCall('ok');
    await first;
  });

  it('debounces rapid taps on the same thread', async () => {
    await toggleThreadSubscription({ parentMessageId: PARENT_ID, subscribe: true });
    await toggleThreadSubscription({ parentMessageId: PARENT_ID, subscribe: false });

    expect(mockSubscribe).toHaveBeenCalledTimes(1);
    expect(mockUnsubscribe).not.toHaveBeenCalled();
  });

  it('accepts the next toggle once the debounce window has passed', async () => {
    await toggleThreadSubscription({ parentMessageId: PARENT_ID, subscribe: true });
    vi.advanceTimersByTime(500);
    await toggleThreadSubscription({ parentMessageId: PARENT_ID, subscribe: false });

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it('allows an immediate retry after a failure', async () => {
    // The failure toast says "try again", so the debounce must not swallow the
    // next tap. Only an in-flight request should block one.
    mockSubscribe.mockRejectedValueOnce(new Error('network'));
    await toggleThreadSubscription({ parentMessageId: PARENT_ID, subscribe: true });

    mockSubscribe.mockResolvedValue('ok');
    await expect(
      toggleThreadSubscription({ parentMessageId: PARENT_ID, subscribe: true })
    ).resolves.toBe(true);

    expect(mockSubscribe).toHaveBeenCalledTimes(2);
  });

  it('still debounces a retry after a SUCCESSFUL toggle', async () => {
    await toggleThreadSubscription({ parentMessageId: PARENT_ID, subscribe: true });
    await toggleThreadSubscription({ parentMessageId: PARENT_ID, subscribe: false });
    expect(mockUnsubscribe).not.toHaveBeenCalled();
  });

  it('does not debounce a different thread', async () => {
    await toggleThreadSubscription({ parentMessageId: PARENT_ID, subscribe: true });
    await toggleThreadSubscription({ parentMessageId: 202, subscribe: true });

    expect(mockSubscribe).toHaveBeenCalledTimes(2);
  });

  it('does nothing for a missing parent id', async () => {
    await expect(toggleThreadSubscription({ parentMessageId: 0, subscribe: true })).resolves.toBe(
      false
    );
    expect(mockSubscribe).not.toHaveBeenCalled();
  });
});
