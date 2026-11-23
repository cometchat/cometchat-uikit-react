/**
 * The reactors tooltip (CometChatReactionsInfo) on the offline (ON) path
 * (UIT-LIST-07, BEH-SNAP-08): cached reactors first, server reactors replace
 * them, offline past the cache keeps them; OFF keeps today's single fetch.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatReactionsInfo } from '../CometChatReactionsInfo';
import { CometChatReactionsContext } from '../CometChatReactions.context';
import type { CometChatReactionsContextValue } from '../CometChatReactions.types';
import {
  installOfflineSdk,
  scriptedRead,
  type OfflineSdkFake,
  type ScriptedRead,
} from '../../../testing/offline-sdk-fake';

const reactor = (uid: string) =>
  ({
    getReaction: () => '👍',
    getReactedBy: () => new CometChat.User({ uid, name: `Name ${uid}` }),
  }) as unknown as CometChat.Reaction;

class StubBuilder {
  messageId = 0;
  reaction = '';
  constructor(private readonly read: ScriptedRead) {}
  setLimit() {
    return this;
  }
  setMessageId(id: number) {
    this.messageId = id;
    return this;
  }
  setReaction(r: string) {
    this.reaction = r;
    return this;
  }
  build() {
    return { fetchNext: this.read.fn };
  }
}

describe('CometChatReactionsInfo offline', () => {
  let fake: OfflineSdkFake;
  let read: ScriptedRead;
  let builder: StubBuilder;

  beforeEach(() => {
    fake = installOfflineSdk({ enabled: true });
    vi.spyOn(CometChat, 'isInitialized').mockReturnValue(true);
    vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(null);
    read = scriptedRead('Reactions');
    builder = new StubBuilder(read);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fake.restore();
  });

  function renderInfo() {
    const message = new CometChat.TextMessage('peer', 'hi', 'user');
    message.setId(5);
    const value = {
      message,
      reactionsRequestBuilder: builder,
    } as unknown as CometChatReactionsContextValue;
    return render(
      <CometChatReactionsContext.Provider value={value}>
        <CometChatReactionsInfo emoji="👍" />
      </CometChatReactionsContext.Provider>
    );
  }

  it('shows cached reactors, then the server reactors; offline keeps the cached names', async () => {
    renderInfo();
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    expect(read.last().listener).toBeDefined();
    expect(builder.messageId).toBe(0);
    act(() => {
      read.last().cached([reactor('a')]);
    });
    expect(screen.getByText('Name a')).toBeTruthy();
    await act(async () => {
      read.last().fail();
      await Promise.resolve();
    });
    expect(screen.getByText('Name a')).toBeTruthy();
  });

  it('the server reactors replace the cached ones', async () => {
    renderInfo();
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    act(() => {
      read.last().cached([reactor('a')]);
    });
    act(() => {
      read.last().server([reactor('b')]);
    });
    expect(screen.queryByText('Name a')).toBeNull();
    expect(screen.getByText('Name b')).toBeTruthy();
  });

  it('offline off: one Promise-form fetch with no listener', async () => {
    fake.setEnabled(false);
    renderInfo();
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    expect(read.last().args).toHaveLength(0);
    expect(builder.messageId).toBe(5);
  });
});
