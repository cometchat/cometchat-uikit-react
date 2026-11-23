/**
 * The saved panel on the offline (ON) path (UIT-LIST-03/10, BEH-SAVE-02):
 * cached then server pages in place, deduped by id, in the panel's sent-time
 * order; "load more" never repeats; offline past the cache keeps the rows;
 * OFF keeps today's single fetch.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { useCometChatSavedMessages } from '../useCometChatSavedMessages';
import { OfflineHub } from '../../../utils/offline/hub';
import {
  installOfflineSdk,
  scriptedRead,
  type OfflineSdkFake,
  type ScriptedRead,
} from '../../../testing/offline-sdk-fake';

const msg = (id: number) => {
  const m = new CometChat.TextMessage('peer', `m${String(id)}`, 'user');
  m.setId(id);
  m.setSentAt(id);
  return m;
};
const ids = (list: CometChat.BaseMessage[]) => list.map(m => m.getId());

class StubBuilder {
  saved = false;
  constructor(private readonly read: ScriptedRead) {}
  setLimit() {
    return this;
  }
  setSaved(s: boolean) {
    this.saved = s;
    return this;
  }
  build() {
    return { fetchPrevious: this.read.fn, getLimit: () => 2 };
  }
}

describe('useCometChatSavedMessages offline', () => {
  let fake: OfflineSdkFake;
  let read: ScriptedRead;
  let onConnected: (() => void) | undefined;
  let builder: StubBuilder;

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

  function mount() {
    return renderHook(() =>
      useCometChatSavedMessages(builder as unknown as CometChat.MessagesRequestBuilder)
    );
  }

  it('cached then server in place; omission removed; no duplicate across pages', async () => {
    const { result } = mount();
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    expect(read.last().listener).toBeDefined();
    act(() => {
      read.last().cached([msg(9), msg(8)]);
    });
    expect(ids(result.current.messages)).toEqual([9, 8]);
    act(() => {
      read.last().server([msg(9), msg(7)]);
    });
    expect(ids(result.current.messages)).toEqual([9, 7]);
    act(() => {
      result.current.loadMore();
    });
    act(() => {
      read.last().cached([msg(7), msg(5)]);
    });
    act(() => {
      read.last().server([msg(5), msg(4)]);
    });
    expect(ids(result.current.messages)).toEqual([9, 7, 5, 4]);
  });

  it('offline past the cache with nothing on screen is the error view (D83 rule 1)', async () => {
    const { result } = mount();
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    await act(async () => {
      read.last().cached([]);
      read.last().fail();
      await Promise.resolve();
    });
    expect(result.current.fetchState).toBe('error');
  });

  it('offline past the cache keeps the cached rows', async () => {
    const { result } = mount();
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    await act(async () => {
      read.last().cached([msg(9)]);
      read.last().fail();
      await Promise.resolve();
    });
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.fetchState).toBe('loaded');
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
    expect(result.current.messages).toHaveLength(1);
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

  it('offline off: one Promise-form fetchPrevious with no listener', async () => {
    fake.setEnabled(false);
    const { result } = mount();
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    expect(read.last().args).toHaveLength(0);
    await act(async () => {
      read.last().server([msg(9), msg(8)]);
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(ids(result.current.messages)).toEqual([9, 8]);
    });
    // The caller's builder is never changed on either path (D4).
    expect(builder.saved).toBe(false);
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
