/**
 * The groups list on the offline (ON) path: two-phase reads (cached page first,
 * server page in place), offline past the cache, the error view
 * (D84), the reconnect re-read without a blank, stale reads dropped; and the OFF path
 * kept exactly (README §3.3, §3.9; UIT-LIST-01/02).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { useCometChatGroups } from '../useCometChatGroups';
import { OfflineHub } from '../../../utils/offline/hub';
import {
  installOfflineSdk,
  scriptedRead,
  type OfflineSdkFake,
  type ScriptedRead,
} from '../../../testing/offline-sdk-fake';

const group = (guid: string, name = guid) => new CometChat.Group(guid, name, 'public');
const guids = (list: CometChat.Group[]) => list.map(g => g.getGuid());

/** An integrator builder whose request is scripted; records the keyword it was given. */
class StubGroupsBuilder {
  keyword = '';
  constructor(private readonly read: ScriptedRead) {}
  setSearchKeyword(keyword: string) {
    this.keyword = keyword;
    return this;
  }
  build() {
    return { fetchNext: this.read.fn, keyword: this.keyword };
  }
}

describe('useCometChatGroups offline', () => {
  let fake: OfflineSdkFake;
  let onConnected: (() => void) | undefined;
  let read: ScriptedRead;
  let builder: CometChat.GroupsRequestBuilder;

  beforeEach(() => {
    fake = installOfflineSdk({ enabled: true });
    vi.spyOn(CometChat, 'addConnectionListener').mockImplementation(((
      _id: string,
      l: { onConnected?: () => void }
    ) => {
      onConnected = l.onConnected;
    }) as never);
    vi.spyOn(CometChat, 'removeConnectionListener').mockImplementation(() => undefined);
    vi.spyOn(CometChat, 'addGroupListener').mockImplementation(() => undefined);
    vi.spyOn(CometChat, 'removeGroupListener').mockImplementation(() => undefined);
    vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(null);
    read = scriptedRead('Groups');
    builder = new StubGroupsBuilder(read) as unknown as CometChat.GroupsRequestBuilder;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fake.restore();
  });

  function mount(options: Parameters<typeof useCometChatGroups>[0] = {}) {
    return renderHook(() => useCometChatGroups({ groupsRequestBuilder: builder, ...options }));
  }

  it('paints the cached page first, then the server page in place: no duplicate, omission removed', async () => {
    const { result } = mount();
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    expect(read.last().listener).toBeDefined();
    expect(result.current.fetchState).toBe('loading');

    act(() => {
      read.last().cached([group('a'), group('b'), group('c')]);
    });
    expect(guids(result.current.groups)).toEqual(['a', 'b', 'c']);
    expect(result.current.fetchState).toBe('loaded');

    const freshA = group('a', 'Alpha');
    act(() => {
      read.last().server([freshA, group('c'), group('d')]);
    });
    expect(guids(result.current.groups)).toEqual(['a', 'c', 'd']);
    expect(result.current.groups[0]).toBe(freshA);
    expect(result.current.hasMore).toBe(true);
  });

  it('a later page replaces only its own cached slice', async () => {
    const { result } = mount();
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    act(() => {
      read.last().server([group('a'), group('b')]);
    });
    await act(async () => {
      void result.current.fetchNext();
      await Promise.resolve();
    });
    expect(read.calls).toHaveLength(2);
    act(() => {
      // A row already shown arrives again on the next page: replaced, not duplicated.
      read.last().cached([group('b'), group('x'), group('y')]);
    });
    expect(guids(result.current.groups)).toEqual(['a', 'b', 'x', 'y']);
    act(() => {
      read.last().server([group('y'), group('z')]);
    });
    expect(guids(result.current.groups)).toEqual(['a', 'b', 'y', 'z']);
  });

  it('an empty cached page never ends the list; only an empty server page does', async () => {
    const onEmpty = vi.fn();
    const { result } = mount({ onEmpty });
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    act(() => {
      read.last().cached([]);
    });
    expect(result.current.hasMore).toBe(true);
    expect(result.current.fetchState).toBe('loading');
    expect(onEmpty).not.toHaveBeenCalled();
    act(() => {
      read.last().server([]);
    });
    expect(result.current.hasMore).toBe(false);
    expect(result.current.fetchState).toBe('empty');
    expect(onEmpty).toHaveBeenCalledTimes(1);
  });

  it('D84 rule 2: offline past the cache with cached rows on screen: rows stay, no error view, no onError', async () => {
    const onError = vi.fn();
    const { result } = mount({ onError });
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    act(() => {
      read.last().cached([group('a')]);
    });
    await act(async () => {
      read.last().fail({ code: 'FAILED_TO_FETCH' });
      await Promise.resolve();
    });
    expect(guids(result.current.groups)).toEqual(['a']);
    expect(result.current.fetchState).toBe('loaded');
    expect(result.current.error).toBeNull();
    expect(result.current.connectToLoad).not.toBe(true);
    expect(onError).not.toHaveBeenCalled();
    // A non-empty cached page: more cached pages may follow.
    expect(result.current.hasMore).toBe(true);
  });

  it('D83 rule 2: a load-more page offline keeps the rows and stays silent (its footer is unchanged)', async () => {
    const onError = vi.fn();
    const { result } = mount({ onError });
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    act(() => {
      read.last().server([group('a')]);
    });
    await act(async () => {
      void result.current.fetchNext();
      await Promise.resolve();
    });
    await act(async () => {
      read.last().fail({ code: 'ERROR_INTERNET_UNAVAILABLE' });
      await Promise.resolve();
    });
    expect(guids(result.current.groups)).toEqual(['a']);
    expect(result.current.fetchState).toBe('loaded');
    expect(onError).not.toHaveBeenCalled();
  });

  it('D83 rule 1: nothing on screen and not connected is the error view and one onError, never the empty view', async () => {
    const onError = vi.fn();
    const onEmpty = vi.fn();
    const { result } = mount({ onError, onEmpty });
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    await act(async () => {
      // An empty cached page is nothing on screen, not rows shown.
      read.last().cached([]);
      read.last().fail({ code: 'ERROR_INTERNET_UNAVAILABLE' });
      await Promise.resolve();
    });
    expect(result.current.fetchState).toBe('error');
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onEmpty).not.toHaveBeenCalled();
    // Past the cache: stop asking until a reconnect or a new read.
    expect(result.current.hasMore).toBe(false);
  });

  it('D83 rule 4: an error view from being offline reloads once by itself on reconnect', async () => {
    const onError = vi.fn();
    const { result } = mount({ onError });
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    await act(async () => {
      read.last().cached([]);
      read.last().fail({ code: 'ERROR_INTERNET_UNAVAILABLE' });
      await Promise.resolve();
    });
    expect(result.current.fetchState).toBe('error');
    expect(onError).toHaveBeenCalledTimes(1);

    act(() => {
      onConnected?.();
    });
    await waitFor(() => {
      expect(read.calls).toHaveLength(2);
    });
    act(() => {
      read.last().server([group('a')]);
    });
    expect(result.current.fetchState).toBe('loaded');
    expect(guids(result.current.groups)).toEqual(['a']);
    expect(onError).toHaveBeenCalledTimes(1);
    // The error view is gone: a later reconnect is the quiet refresh, not another reload.
    act(() => {
      onConnected?.();
    });
    expect(read.calls).toHaveLength(3);
    await act(async () => {
      read.last().fail({ code: 'ERROR_INTERNET_UNAVAILABLE' });
      await Promise.resolve();
    });
    expect(result.current.fetchState).toBe('loaded');
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('D83 rule 4: the reload that fails again with nothing shown is the error view and onError again', async () => {
    const onError = vi.fn();
    const { result } = mount({ onError });
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    await act(async () => {
      read.last().fail({ code: 'ERROR_INTERNET_UNAVAILABLE' });
      await Promise.resolve();
    });
    act(() => {
      onConnected?.();
    });
    await waitFor(() => {
      expect(read.calls).toHaveLength(2);
    });
    await act(async () => {
      read.last().fail({ code: 'ERROR_INTERNET_UNAVAILABLE' });
      await Promise.resolve();
    });
    expect(result.current.fetchState).toBe('error');
    expect(onError).toHaveBeenCalledTimes(2);
    // Still an offline error view: the next reconnect reloads again.
    act(() => {
      onConnected?.();
    });
    await waitFor(() => {
      expect(read.calls).toHaveLength(3);
    });
  });

  it('D83 rule 4: a server error view is not reloaded on reconnect', async () => {
    const onError = vi.fn();
    const { result } = mount({ onError });
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    await act(async () => {
      read.last().fail({ code: 'ERR_SERVER', message: 'boom' });
      await Promise.resolve();
    });
    expect(result.current.fetchState).toBe('error');
    expect(onError).toHaveBeenCalledTimes(1);
    act(() => {
      onConnected?.();
    });
    expect(read.calls).toHaveLength(1);
    expect(result.current.fetchState).toBe('error');
  });

  it('D84 rule 7: an offline keyword search with nothing saved is "Connect to search", no onError, and runs again once on reconnect', async () => {
    const onError = vi.fn();
    const { result } = mount({ searchKeyword: 'jo', onError });
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    await act(async () => {
      read.last().cached([]);
      read.last().fail();
      await Promise.resolve();
    });
    expect(result.current.fetchState).toBe('empty');
    expect(result.current.connectToSearch).toBe(true);
    expect(result.current.connectToLoad).toBe(false);
    expect(onError).not.toHaveBeenCalled();
    act(() => {
      onConnected?.();
    });
    await waitFor(() => {
      expect(read.calls).toHaveLength(2);
    });
    // The reload asks for the same keyword (on a copy of the builder).
    expect((read.fn.mock.contexts[1] as { keyword: string }).keyword).toBe('jo');
    act(() => {
      read.last().server([group('joe')]);
    });
    expect(result.current.fetchState).toBe('loaded');
    expect(result.current.connectToSearch).toBe(false);
    expect(guids(result.current.groups)).toEqual(['joe']);
    // Reloaded once: a second reconnect over the rows is the in-place refresh, not a blank reload.
    expect(onError).not.toHaveBeenCalled();
  });

  it('D84 rule 3: offline with nothing saved is the error state worded "Connect to load", onError once, no Retry, and reloads once on reconnect', async () => {
    const onError = vi.fn();
    const { result } = mount({ onError });
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    await act(async () => {
      read.last().cached([]);
      read.last().fail();
      await Promise.resolve();
    });
    expect(result.current.fetchState).toBe('error');
    expect(result.current.connectToLoad).toBe(true);
    expect(result.current.connectToSearch).toBe(false);
    expect(onError).toHaveBeenCalledTimes(1);
    act(() => {
      onConnected?.();
    });
    await waitFor(() => {
      expect(read.calls).toHaveLength(2);
    });
    act(() => {
      read.last().server([group('a')]);
    });
    expect(result.current.fetchState).toBe('loaded');
    expect(result.current.connectToLoad).toBe(false);
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('D84 addition B: an offline list with only a filter (no keyword) is "Connect to load", never "Connect to search"', async () => {
    const onError = vi.fn();
    const { result } = mount({ onError });
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    // The integrator's builder carries a presence filter and no keyword.
    expect((read.fn.mock.contexts[0] as { keyword: string }).keyword).toBe('');
    await act(async () => {
      read.last().cached([]);
      read.last().fail();
      await Promise.resolve();
    });
    expect(result.current.connectToLoad).toBe(true);
    expect(result.current.connectToSearch).toBe(false);
  });

  it('an offline keyword search reports onEmpty (an empty state), not onError, and never changes the integrator builder', async () => {
    const onError = vi.fn();
    const onEmpty = vi.fn();
    const stub = builder as unknown as StubGroupsBuilder;
    const { result } = mount({ searchKeyword: 'jo', onError, onEmpty });
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    expect(stub.keyword).toBe('');
    await act(async () => {
      read.last().cached([]);
      read.last().fail();
      await Promise.resolve();
    });
    expect(result.current.fetchState).toBe('empty');
    expect(onError).not.toHaveBeenCalled();
    expect(onEmpty).toHaveBeenCalledTimes(1);
  });

  it('D84 rule 5: a real error over rows the user started (open) keeps the rows and reports onError once', async () => {
    const onError = vi.fn();
    const { result } = mount({ onError });
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    act(() => {
      read.last().cached([group('a')]);
    });
    await act(async () => {
      read.last().fail({ code: 'ERR_SERVER', message: 'boom' });
      await Promise.resolve();
    });
    expect(guids(result.current.groups)).toEqual(['a']);
    expect(result.current.fetchState).toBe('loaded');
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('D84 rule 5: a real error over rows on a read the kit started (reconnect refresh) is silent', async () => {
    const onError = vi.fn();
    const { result } = mount({ onError });
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    act(() => {
      read.last().server([group('a')]);
    });
    act(() => {
      onConnected?.();
    });
    await waitFor(() => {
      expect(read.calls).toHaveLength(2);
    });
    await act(async () => {
      read.last().fail({ code: 'ERR_SERVER', message: 'boom' });
      await Promise.resolve();
    });
    expect(guids(result.current.groups)).toEqual(['a']);
    expect(result.current.fetchState).toBe('loaded');
    expect(onError).not.toHaveBeenCalled();
  });

  it('another error keeps the rows already shown (BEH-READ-06) and reports onError', async () => {
    const onError = vi.fn();
    const { result } = mount({ onError });
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    act(() => {
      read.last().server([group('a')]);
    });
    await act(async () => {
      void result.current.fetchNext();
      await Promise.resolve();
    });
    await act(async () => {
      read.last().fail({ code: 'ERR_SERVER', message: 'boom' });
      await Promise.resolve();
    });
    expect(guids(result.current.groups)).toEqual(['a']);
    expect(result.current.fetchState).toBe('loaded');
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('drops callbacks from an older read once the search text changed (UIK-READ-05)', async () => {
    const { result } = mount();
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    const first = read.last();
    act(() => {
      result.current.setSearchText('b');
    });
    expect(read.calls).toHaveLength(2);
    act(() => {
      first.cached([group('stale')]);
      first.server([group('stale')]);
    });
    expect(result.current.groups).toEqual([]);
    act(() => {
      read.last().server([group('bob')]);
    });
    expect(guids(result.current.groups)).toEqual(['bob']);
  });

  it('never starts a second read while the server phase is pending; asks once it lands', async () => {
    const { result } = mount();
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    act(() => {
      read.last().cached([group('a')]);
    });
    await act(async () => {
      await result.current.fetchNext();
    });
    expect(read.calls).toHaveLength(1);
    act(() => {
      read.last().server([group('a')]);
    });
    await waitFor(() => {
      expect(read.calls).toHaveLength(2);
    });
    expect(read.last().listener).toBeDefined();
  });

  it('a reconnect re-reads two-phase into the rows on screen without blanking them', async () => {
    const { result } = mount();
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    act(() => {
      read.last().server([group('a'), group('b'), group('c')]);
    });
    act(() => {
      onConnected?.();
    });
    expect(read.calls).toHaveLength(2);
    expect(read.last().listener).toBeDefined();
    // Never blank: the rows stay through the re-read, and a cached page does not repaint them.
    expect(guids(result.current.groups)).toEqual(['a', 'b', 'c']);
    expect(result.current.fetchState).toBe('loaded');
    act(() => {
      read.last().cached([group('a')]);
    });
    expect(guids(result.current.groups)).toEqual(['a', 'b', 'c']);
    act(() => {
      // b was deleted on the server; n is new.
      read.last().server([group('a'), group('c'), group('n')]);
    });
    expect(guids(result.current.groups)).toEqual(['a', 'c', 'n']);
  });

  it('a reconnect re-read that fails over rows on screen stays quiet: any error, no onError, rows kept', async () => {
    const onError = vi.fn();
    const { result } = mount({ onError });
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    act(() => {
      read.last().server([group('a'), group('b')]);
    });
    act(() => {
      onConnected?.();
    });
    expect(read.calls).toHaveLength(2);
    await act(async () => {
      read.last().fail({ code: 'ERR_SERVER', message: 'boom' });
      await Promise.resolve();
    });
    expect(guids(result.current.groups)).toEqual(['a', 'b']);
    expect(result.current.fetchState).toBe('loaded');
    expect(result.current.error).toBeNull();
    expect(result.current.hasMore).toBe(true);
    expect(onError).not.toHaveBeenCalled();
    // The next reconnect tries again.
    act(() => {
      onConnected?.();
    });
    expect(read.calls).toHaveLength(3);
    act(() => {
      read.last().server([group('a'), group('c')]);
    });
    expect(guids(result.current.groups)).toEqual(['a', 'c', 'b']);
  });

  it('a reconnect re-read that fails "not connected" over rows on screen stays quiet too (rule 3)', async () => {
    const onError = vi.fn();
    const { result } = mount({ onError });
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    act(() => {
      read.last().server([group('a'), group('b')]);
    });
    act(() => {
      onConnected?.();
    });
    expect(read.calls).toHaveLength(2);
    await act(async () => {
      read.last().fail({ code: 'ERROR_INTERNET_UNAVAILABLE' });
      await Promise.resolve();
    });
    expect(guids(result.current.groups)).toEqual(['a', 'b']);
    expect(result.current.fetchState).toBe('loaded');
    expect(onError).not.toHaveBeenCalled();
  });

  it('a server error with nothing on screen is the error view and onError once (rule 1)', async () => {
    const onError = vi.fn();
    const { result } = mount({ onError });
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    await act(async () => {
      read.last().fail({ code: 'ERR_SERVER', message: 'boom' });
      await Promise.resolve();
    });
    expect(result.current.fetchState).toBe('error');
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('an empty server page is the empty view (rule 5)', async () => {
    const onError = vi.fn();
    const onEmpty = vi.fn();
    const { result } = mount({ onError, onEmpty });
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    act(() => {
      read.last().server([]);
    });
    expect(result.current.fetchState).toBe('empty');
    expect(onEmpty).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
  });

  describe('offline OFF', () => {
    it("one Promise-form fetch with no listener; today's reducer and reconnect refetch", async () => {
      fake.setEnabled(false);
      const { result } = mount();
      await waitFor(() => {
        expect(read.calls).toHaveLength(1);
      });
      expect(read.last().args).toHaveLength(0);
      await act(async () => {
        read.last().server([group('a'), group('b')]);
        await Promise.resolve();
      });
      expect(guids(result.current.groups)).toEqual(['a', 'b']);
      act(() => {
        onConnected?.();
      });
      // Today: RESET, then one fetch.
      expect(result.current.groups).toEqual([]);
      expect(read.calls).toHaveLength(2);
      expect(read.last().args).toHaveLength(0);
    });

    it("an SDK without offline support runs today's path", async () => {
      fake.restore();
      fake = installOfflineSdk({ absent: true });
      mount();
      await waitFor(() => {
        expect(read.calls).toHaveLength(1);
      });
      expect(read.last().args).toHaveLength(0);
    });

    it("offline off with a keyword: a Promise rejection is today's error state", async () => {
      fake.setEnabled(false);
      const onError = vi.fn();
      const { result } = mount({ searchKeyword: 'jo', onError });
      await waitFor(() => {
        expect(read.calls).toHaveLength(1);
      });
      await act(async () => {
        read.last().fail();
        await Promise.resolve();
      });
      expect(result.current.fetchState).toBe('error');
      expect(onError).toHaveBeenCalledTimes(1);
      // Today's OFF path sets the keyword on the integrator's own builder.
      expect((builder as unknown as StubGroupsBuilder).keyword).toBe('jo');
    });
  });

  it('logout or user switch clears the list and drops a late read (UIK-LIFE-01)', async () => {
    const { result } = mount();
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    act(() => {
      read.last().cached([group('a')]);
    });
    expect(result.current.groups).toHaveLength(1);
    act(() => {
      OfflineHub.getInstance().session.emit(1);
    });
    expect(result.current.groups).toEqual([]);
    act(() => {
      read.last().server([group('a'), group('b')]);
    });
    expect(result.current.groups).toEqual([]);
    expect(read.calls).toHaveLength(1);
  });

  it('a cache reset clears the list and reads it again, two-phase (UIK-LIFE-02)', async () => {
    const { result } = mount();
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    act(() => {
      read.last().server([group('a')]);
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
      read.last().server([group('b')]);
    });
    expect(guids(result.current.groups)).toEqual(guids([group('b')]));
  });

  it('a list that never used the offline path ignores a logout', async () => {
    fake.setEnabled(false);
    const { result } = mount();
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    read.last().server([group('a')]);
    await waitFor(() => {
      expect(result.current.groups).toHaveLength(1);
    });
    act(() => {
      OfflineHub.getInstance().session.emit(1);
    });
    expect(result.current.groups).toHaveLength(1);
  });
});
