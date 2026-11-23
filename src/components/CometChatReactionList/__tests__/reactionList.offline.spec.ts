/**
 * The reaction list on the offline (ON) path (UIT-LIST-07, BEH-SNAP-08):
 * cached then server pages in place, deduped by reactor+emoji, offline past
 * the cache keeps the rows (or the error view with none, D83), stale reads dropped; OFF keeps today's fetch.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { useCometChatReactionList } from '../useCometChatReactionList';
import { OfflineHub } from '../../../utils/offline/hub';
import {
  installOfflineSdk,
  scriptedRead,
  type OfflineSdkFake,
  type ScriptedRead,
} from '../../../testing/offline-sdk-fake';

const reaction = (uid: string, emoji: string) =>
  ({
    getReactionId: () => `${uid}:${emoji}`,
    getReaction: () => emoji,
    getReactedBy: () => new CometChat.User({ uid, name: uid }),
  }) as unknown as CometChat.Reaction;
const keys = (list: CometChat.Reaction[]) =>
  list.map(r => `${r.getReactedBy().getUid()}${r.getReaction()}`);

class StubReactionsBuilder {
  messageId = 0;
  constructor(private readonly read: ScriptedRead) {}
  setLimit() {
    return this;
  }
  setMessageId(id: number) {
    this.messageId = id;
    return this;
  }
  build() {
    return { fetchNext: this.read.fn };
  }
}

function messageWithId(id: number) {
  const m = new CometChat.TextMessage('peer', 'hi', 'user');
  m.setId(id);
  return m;
}

describe('useCometChatReactionList offline', () => {
  let fake: OfflineSdkFake;
  let read: ScriptedRead;
  let builder: StubReactionsBuilder;
  let onConnected: (() => void) | undefined;

  beforeEach(() => {
    fake = installOfflineSdk({ enabled: true });
    onConnected = undefined;
    vi.spyOn(CometChat, 'addConnectionListener').mockImplementation(((
      _id: string,
      listener: { onConnected?: () => void }
    ) => {
      onConnected = listener.onConnected;
    }) as never);
    vi.spyOn(CometChat, 'removeConnectionListener').mockImplementation(() => undefined);
    vi.spyOn(CometChat, 'isInitialized').mockReturnValue(true);
    vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(null);
    read = scriptedRead('Reactions');
    builder = new StubReactionsBuilder(read);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fake.restore();
  });

  function mount(message = messageWithId(7), onError = vi.fn()) {
    return renderHook(
      ({ m }: { m: CometChat.BaseMessage }) =>
        useCometChatReactionList({
          message: m,
          reactionsRequestBuilder: builder as unknown as CometChat.ReactionsRequestBuilder,
          onError,
        }),
      { initialProps: { m: message } }
    );
  }

  it('cached page then server page in place; no duplicate; omission removed; builder untouched', async () => {
    const { result } = mount();
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    expect(read.last().listener).toBeDefined();
    expect(builder.messageId).toBe(0);
    act(() => {
      read.last().cached([reaction('a', '👍'), reaction('b', '👍'), reaction('c', '❤️')]);
    });
    expect(keys(result.current.allReactions)).toEqual(['a👍', 'b👍', 'c❤️']);
    expect(result.current.fetchState).toBe('loaded');
    expect(result.current.isFetching).toBe(true);
    act(() => {
      read.last().server([reaction('a', '👍'), reaction('c', '❤️'), reaction('d', '😂')]);
    });
    expect(keys(result.current.allReactions)).toEqual(['a👍', 'c❤️', 'd😂']);
    expect(result.current.emojiTabs).toEqual(['👍', '❤️', '😂']);
    expect(result.current.isFetching).toBe(false);
    // A short server page ends the list (today's rule).
    expect(result.current.hasMore).toBe(false);
  });

  it('an empty cached page never ends the list; offline past it is the error view and one onError (D83 rule 1)', async () => {
    const onError = vi.fn();
    const { result } = mount(messageWithId(7), onError);
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    act(() => {
      read.last().cached([]);
    });
    expect(result.current.hasMore).toBe(true);
    expect(result.current.fetchState).toBe('loading');
    await act(async () => {
      read.last().fail();
      await Promise.resolve();
    });
    expect(result.current.fetchState).toBe('error');
    expect(result.current.isFetching).toBe(false);
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('D83 rule 4: an error view from being offline reads again once on reconnect', async () => {
    const onError = vi.fn();
    const { result } = mount(messageWithId(7), onError);
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    await act(async () => {
      read.last().fail();
      await Promise.resolve();
    });
    expect(result.current.fetchState).toBe('error');
    act(() => {
      onConnected?.();
    });
    await waitFor(() => {
      expect(read.calls).toHaveLength(2);
    });
    // A second reconnect while the reload is running reads nothing more.
    act(() => {
      onConnected?.();
    });
    expect(read.calls).toHaveLength(2);
    act(() => {
      read.last().server([reaction('a', '👍')]);
    });
    expect(keys(result.current.allReactions)).toEqual(['a👍']);
    expect(result.current.fetchState).toBe('loaded');
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('D83 rule 4: a server error view is not read again on reconnect', async () => {
    const { result } = mount();
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    await act(async () => {
      read.last().fail({ code: 'ERR_SERVER', message: 'boom' });
      await Promise.resolve();
    });
    expect(result.current.fetchState).toBe('error');
    act(() => {
      onConnected?.();
    });
    expect(read.calls).toHaveLength(1);
  });

  it('D83 rule 2: offline past the cache keeps the cached rows and reports onError once', async () => {
    const onError = vi.fn();
    const { result } = mount(messageWithId(7), onError);
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    await act(async () => {
      read.last().cached([reaction('a', '👍')]);
      read.last().fail({ code: 'ERROR_INTERNET_UNAVAILABLE' });
      await Promise.resolve();
    });
    expect(keys(result.current.allReactions)).toEqual(['a👍']);
    expect(result.current.fetchState).toBe('loaded');
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('D83 rule 2: a load-more page offline keeps the rows and stays silent', async () => {
    const onError = vi.fn();
    const { result } = mount(messageWithId(7), onError);
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    act(() => {
      read.last().server(Array.from({ length: 20 }, (_, i) => reaction(`u${String(i)}`, '👍')));
    });
    expect(result.current.hasMore).toBe(true);
    await act(async () => {
      void result.current.fetchMore();
      await Promise.resolve();
    });
    expect(read.calls).toHaveLength(2);
    await act(async () => {
      read.last().fail({ code: 'ERROR_INTERNET_UNAVAILABLE' });
      await Promise.resolve();
    });
    expect(result.current.allReactions).toHaveLength(20);
    expect(result.current.fetchState).toBe('loaded');
    expect(onError).not.toHaveBeenCalled();
  });

  it('drops a late callback after the message changed', async () => {
    const { result, rerender } = mount();
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    const old = read.last();
    rerender({ m: messageWithId(8) });
    await waitFor(() => {
      expect(read.calls).toHaveLength(2);
    });
    act(() => {
      old.cached([reaction('stale', '👍')]);
    });
    expect(result.current.allReactions).toEqual([]);
  });

  it("offline off: one Promise-form fetch with no listener, today's reducer", async () => {
    fake.setEnabled(false);
    const { result } = mount();
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    expect(read.last().args).toHaveLength(0);
    // Today the integrator's builder carries the message id.
    expect(builder.messageId).toBe(7);
    await act(async () => {
      read.last().fail({ code: 'FAILED_TO_FETCH' });
      await Promise.resolve();
    });
    expect(result.current.fetchState).toBe('error');
  });

  it('logout or user switch clears the list and drops a late read (UIK-LIFE-01)', async () => {
    const { result } = mount();
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    act(() => {
      read.last().cached([reaction('a', '👍')]);
    });
    expect(result.current.allReactions).toHaveLength(1);
    act(() => {
      OfflineHub.getInstance().session.emit(1);
    });
    expect(result.current.allReactions).toEqual([]);
    act(() => {
      read.last().server([reaction('a', '👍'), reaction('b', '👍')]);
    });
    expect(result.current.allReactions).toEqual([]);
    expect(read.calls).toHaveLength(1);
  });

  it('a cache reset clears the list and reads it again, two-phase (UIK-LIFE-02)', async () => {
    const { result } = mount();
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    act(() => {
      read.last().server([reaction('a', '👍')]);
    });
    const hub = OfflineHub.getInstance();
    act(() => {
      hub.session.emit(1);
      hub.cacheReset.emit({ gen: 1, reason: 'KEY_LOST', pendingMessagesLost: 0 });
    });
    await waitFor(() => {
      expect(read.calls).toHaveLength(2);
    });
    expect(read.last().listener).toBeDefined();
    act(() => {
      read.last().server([reaction('b', '👍')]);
    });
    expect(keys(result.current.allReactions)).toEqual(keys([reaction('b', '👍')]));
  });

  it('a list that never used the offline path ignores a logout', async () => {
    fake.setEnabled(false);
    const { result } = mount();
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    read.last().server([reaction('a', '👍')]);
    await waitFor(() => {
      expect(result.current.allReactions).toHaveLength(1);
    });
    act(() => {
      OfflineHub.getInstance().session.emit(1);
    });
    expect(result.current.allReactions).toHaveLength(1);
  });
});
