/**
 * The reaction list on the offline (ON) path: "load more" and Retry read
 * two-phase, a read error that is not "not connected" is reported, a missing
 * request is today's empty list, and a selected emoji whose reactions are gone
 * is cleared.
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
  constructor(
    private readonly read: ScriptedRead,
    private readonly broken = false
  ) {}
  setLimit() {
    return this;
  }
  setMessageId() {
    return this;
  }
  build() {
    if (this.broken) throw new Error('cannot build');
    return { fetchNext: this.read.fn };
  }
}

function messageWithId(id: number) {
  const m = new CometChat.TextMessage('peer', 'hi', 'user');
  m.setId(id);
  return m;
}

describe('useCometChatReactionList offline, paging and retry', () => {
  let fake: OfflineSdkFake;
  let read: ScriptedRead;

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk({ enabled: true });
    vi.spyOn(CometChat, 'isInitialized').mockReturnValue(true);
    vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(null);
    read = scriptedRead('Reactions');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fake.restore();
    OfflineHub.resetForTests();
  });

  function mount(onError = vi.fn(), broken = false) {
    const builder = new StubReactionsBuilder(read, broken);
    return renderHook(() =>
      useCometChatReactionList({
        message: messageWithId(7),
        reactionsRequestBuilder: builder as unknown as CometChat.ReactionsRequestBuilder,
        onError,
      })
    );
  }

  it('a full first page leaves more; load more reads the next page two-phase and appends', async () => {
    const { result } = mount();
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    const page = Array.from({ length: 20 }, (_, i) => reaction(`u${String(i)}`, '👍'));
    act(() => {
      read.last().server(page);
    });
    expect(result.current.hasMore).toBe(true);
    let more: Promise<void> = Promise.resolve();
    act(() => {
      more = result.current.fetchMore();
    });
    await waitFor(() => {
      expect(read.calls).toHaveLength(2);
    });
    expect(read.last().listener).toBeDefined();
    expect(result.current.isFetching).toBe(true);
    await act(async () => {
      read.last().cached([reaction('late', '❤️')]);
      read.last().server([reaction('late', '❤️')]);
      await more;
    });
    expect(result.current.allReactions).toHaveLength(21);
    expect(keys(result.current.allReactions).at(-1)).toBe('late❤️');
    expect(result.current.hasMore).toBe(false);
    expect(result.current.isFetching).toBe(false);
  });

  it("a server error is reported and shows today's error; Retry reads again, two-phase", async () => {
    const onError = vi.fn();
    const { result } = mount(onError);
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    const failure = { code: 'ERR_SERVER' };
    await act(async () => {
      read.last().fail(failure);
      await Promise.resolve();
    });
    expect(onError).toHaveBeenCalledWith(failure);
    expect(result.current.fetchState).toBe('error');

    act(() => {
      result.current.retry();
    });
    await waitFor(() => {
      expect(read.calls).toHaveLength(2);
    });
    expect(read.last().listener).toBeDefined();
    act(() => {
      read.last().server([reaction('a', '👍')]);
    });
    expect(keys(result.current.allReactions)).toEqual(['a👍']);
    expect(result.current.fetchState).toBe('loaded');
  });

  it('no request (the builder cannot build): an empty list, as today', async () => {
    const { result } = mount(vi.fn(), true);
    await waitFor(() => {
      expect(result.current.fetchState).toBe('empty');
    });
    expect(read.calls).toHaveLength(0);
    expect(result.current.hasMore).toBe(false);
  });

  it('a selected emoji whose reactions the server page dropped is cleared', async () => {
    const { result } = mount();
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    act(() => {
      read.last().cached([reaction('a', '👍'), reaction('b', '❤️')]);
    });
    act(() => {
      result.current.selectEmoji('❤️');
    });
    expect(result.current.selectedEmoji).toBe('❤️');
    act(() => {
      read.last().server([reaction('a', '👍')]);
    });
    expect(result.current.selectedEmoji).toBeNull();
  });
});
