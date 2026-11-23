/**
 * The pinned panel on the offline (ON) path (UIT-LIST-03/10, BEH-PIN-02):
 * cached then server pages in the server's order, in place, deduped by id;
 * "load more" never repeats or skips; offline past the cache keeps the rows (the error
 * view with none, D83);
 * a conversation switch drops the old read; OFF keeps today's single fetch.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { useCometChatPinnedMessages } from '../useCometChatPinnedMessages';
import { OfflineHub } from '../../../utils/offline/hub';
import {
  installOfflineSdk,
  scriptedRead,
  type OfflineSdkFake,
  type ScriptedRead,
} from '../../../testing/offline-sdk-fake';

const msg = (id: number) => {
  const m = new CometChat.TextMessage('g1', `m${String(id)}`, 'group');
  m.setId(id);
  m.setSentAt(id);
  return m;
};
const ids = (list: CometChat.BaseMessage[]) => list.map(m => m.getId());

/** A caller's builder; records what the kit set on it. */
class StubBuilder {
  pinned = false;
  guid = '';
  constructor(
    private readonly read: ScriptedRead,
    private readonly limit = 3
  ) {}
  setLimit() {
    return this;
  }
  setPinned(p: boolean) {
    this.pinned = p;
    return this;
  }
  setGUID(g: string) {
    this.guid = g;
    return this;
  }
  setUID() {
    return this;
  }
  build() {
    return { fetchPrevious: this.read.fn, getLimit: () => this.limit };
  }
}

describe('useCometChatPinnedMessages offline', () => {
  let fake: OfflineSdkFake;
  let read: ScriptedRead;
  let builder: StubBuilder;
  let onConnected: (() => void) | undefined;
  const group = new CometChat.Group('g1', 'G', 'public');

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
    read = scriptedRead('Messages');
    builder = new StubBuilder(read);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fake.restore();
  });

  function mount(g: CometChat.Group = group) {
    return renderHook(
      ({ grp }: { grp: CometChat.Group }) =>
        useCometChatPinnedMessages(
          undefined,
          grp,
          builder as unknown as CometChat.MessagesRequestBuilder
        ),
      { initialProps: { grp: g } }
    );
  }

  it('cached then server page in place, server order; the caller builder is untouched', async () => {
    const { result } = mount();
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    expect(read.last().listener).toBeDefined();
    expect(builder.pinned).toBe(false);
    expect(builder.guid).toBe('');
    act(() => {
      read.last().cached([msg(9), msg(7), msg(5)]);
    });
    expect(ids(result.current.messages)).toEqual([9, 7, 5]);
    expect(result.current.fetchState).toBe('loaded');
    act(() => {
      // 7 was unpinned on another device; 8 is new.
      read.last().server([msg(9), msg(8), msg(5)]);
    });
    expect(ids(result.current.messages)).toEqual([9, 8, 5]);
    expect(result.current.hasMore).toBe(true);
  });

  it('"load more" never repeats or skips (UIT-LIST-10)', async () => {
    const { result } = mount();
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    act(() => {
      read.last().server([msg(9), msg(8), msg(7)]);
    });
    act(() => {
      result.current.loadMore();
    });
    expect(read.calls).toHaveLength(2);
    act(() => {
      // A re-delivered row and the next ones.
      read.last().cached([msg(7), msg(6)]);
    });
    expect(ids(result.current.messages)).toEqual([9, 8, 7, 6]);
    act(() => {
      read.last().server([msg(6), msg(5)]);
    });
    expect(ids(result.current.messages)).toEqual([9, 8, 7, 6, 5]);
    // A short server page ends the list.
    expect(result.current.hasMore).toBe(false);
  });

  it('a load-more asked while a read is in flight runs once it lands', async () => {
    const { result } = mount();
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    act(() => {
      read.last().cached([msg(9), msg(8), msg(7)]);
    });
    act(() => {
      result.current.loadMore();
    });
    expect(read.calls).toHaveLength(1);
    act(() => {
      read.last().server([msg(9), msg(8), msg(7)]);
    });
    await waitFor(() => {
      expect(read.calls).toHaveLength(2);
    });
  });

  it('an empty cached page never ends the list; offline past it: the error view (D83 rule 1)', async () => {
    const { result } = mount();
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
  });

  it('D83 rule 4: an error view from being offline reads again once on reconnect', async () => {
    const { result } = mount();
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    await act(async () => {
      read.last().cached([]);
      read.last().fail({ code: 'ERROR_INTERNET_UNAVAILABLE' });
      await Promise.resolve();
    });
    expect(result.current.fetchState).toBe('error');
    act(() => {
      onConnected?.();
    });
    await waitFor(() => {
      expect(read.calls).toHaveLength(2);
    });
    act(() => {
      onConnected?.();
    });
    expect(read.calls).toHaveLength(2);
    act(() => {
      read.last().server([msg(9)]);
    });
    expect(ids(result.current.messages)).toEqual([9]);
    expect(result.current.fetchState).toBe('loaded');
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

  it('offline past the cache keeps the cached pins', async () => {
    const { result } = mount();
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    await act(async () => {
      read.last().cached([msg(9)]);
      read.last().fail({ code: 'ERROR_INTERNET_UNAVAILABLE' });
      await Promise.resolve();
    });
    expect(ids(result.current.messages)).toEqual([9]);
    expect(result.current.fetchState).toBe('loaded');
  });

  it('a conversation switch drops the old read', async () => {
    const { result, rerender } = mount();
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    const old = read.last();
    rerender({ grp: new CometChat.Group('g2', 'G2', 'public') });
    await waitFor(() => {
      expect(read.calls).toHaveLength(2);
    });
    act(() => {
      old.server([msg(1)]);
    });
    expect(result.current.messages).toEqual([]);
  });

  it("offline off: one Promise-form fetchPrevious with no listener; today's builder use", async () => {
    fake.setEnabled(false);
    const { result } = mount();
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    expect(read.last().args).toHaveLength(0);
    expect(builder.pinned).toBe(true);
    await act(async () => {
      read.last().server([msg(9)]);
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(ids(result.current.messages)).toEqual([9]);
    });
  });

  it('logout or user switch clears the list and drops a late read (UIK-LIFE-01)', async () => {
    const { result } = mount();
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    act(() => {
      read.last().cached([msg(1)]);
    });
    expect(result.current.messages).toHaveLength(1);
    act(() => {
      OfflineHub.getInstance().session.emit(1);
    });
    expect(result.current.messages).toEqual([]);
    act(() => {
      read.last().server([msg(1), msg(2)]);
    });
    expect(result.current.messages).toEqual([]);
    expect(read.calls).toHaveLength(1);
  });

  it('a cache reset clears the list and reads it again, two-phase (UIK-LIFE-02)', async () => {
    const { result } = mount();
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    act(() => {
      read.last().server([msg(1)]);
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
      read.last().server([msg(2)]);
    });
    expect(ids(result.current.messages)).toEqual(ids([msg(2)]));
  });

  it('a list that never used the offline path ignores a logout', async () => {
    fake.setEnabled(false);
    const { result } = mount();
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    read.last().server([msg(1)]);
    await waitFor(() => {
      expect(result.current.messages).toHaveLength(1);
    });
    act(() => {
      OfflineHub.getInstance().session.emit(1);
    });
    expect(result.current.messages).toHaveLength(1);
  });
});
