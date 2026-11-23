/**
 * Message panels on the offline (ON) path: a "load more" asked for while the
 * saved panel's read waits for its server phase runs once that read lands
 * (never dropped, never doubled); a pinned panel with no conversation is an
 * empty list with no read.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { useCometChatSavedMessages } from '../useCometChatSavedMessages';
import { useCometChatPinnedMessages } from '../../CometChatPinnedMessages/useCometChatPinnedMessages';
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
  constructor(private readonly read: ScriptedRead) {}
  setLimit() {
    return this;
  }
  setSaved() {
    return this;
  }
  build() {
    return { fetchPrevious: this.read.fn, getLimit: () => 2 };
  }
}

describe('message panels, offline ON', () => {
  let fake: OfflineSdkFake;
  let read: ScriptedRead;

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk({ enabled: true });
    read = scriptedRead('Messages');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fake.restore();
    OfflineHub.resetForTests();
  });

  it('saved: a load more during the server phase waits for it, then reads the next page once', async () => {
    const builder = new StubBuilder(read);
    const { result } = renderHook(() =>
      useCometChatSavedMessages(builder as unknown as CometChat.MessagesRequestBuilder)
    );
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    act(() => {
      read.last().cached([msg(9), msg(8)]);
    });
    // The cached page is shown; its server phase is still pending.
    expect(result.current.hasMore).toBe(true);
    act(() => {
      result.current.loadMore();
      result.current.loadMore();
    });
    expect(read.calls).toHaveLength(1);
    act(() => {
      read.last().server([msg(9), msg(8)]);
    });
    await waitFor(() => {
      expect(read.calls).toHaveLength(2);
    });
    act(() => {
      read.last().server([msg(7), msg(6)]);
    });
    expect(ids(result.current.messages)).toEqual([9, 8, 7, 6]);
    // Two taps during the first read asked for one page, not two.
    await act(async () => {
      await Promise.resolve();
    });
    expect(read.calls).toHaveLength(2);
  });

  it('pinned: no user and no group is an empty list, with no read', async () => {
    const { result } = renderHook(() => useCometChatPinnedMessages(undefined, undefined));
    await waitFor(() => {
      expect(result.current.fetchState).not.toBe('loading');
    });
    expect(result.current.messages).toEqual([]);
    expect(result.current.hasMore).toBe(false);
    expect(read.calls).toHaveLength(0);
  });
});
