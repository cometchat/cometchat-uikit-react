/**
 * Mentions suggestions on the offline (ON) path (UIT-LIST-09, BEH-SNAP-04):
 * without a keyword the cached people show first (two-phase users/members
 * read); with a keyword offline the suggestions close as for no match, with no
 * error (the people lists report to onError under D83; this popup stays quiet).
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatMessageComposerMentionsList } from '../CometChatMessageComposerMentionsList';
import {
  installOfflineSdk,
  scriptedRead,
  type OfflineSdkFake,
  type ScriptedRead,
} from '../../../testing/offline-sdk-fake';

class StubBuilder {
  keyword = '';
  constructor(private readonly read: ScriptedRead) {}
  setLimit() {
    return this;
  }
  setSearchKeyword(k: string) {
    this.keyword = k;
    return this;
  }
  build() {
    return { fetchNext: this.read.fn };
  }
}

describe('mentions suggestions offline', () => {
  let fake: OfflineSdkFake;

  beforeEach(() => {
    fake = installOfflineSdk({ enabled: true });
    vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(null);
    vi.spyOn(CometChat, 'addConnectionListener').mockImplementation(() => undefined);
    vi.spyOn(CometChat, 'removeConnectionListener').mockImplementation(() => undefined);
    vi.spyOn(CometChat, 'addUserListener').mockImplementation(() => undefined);
    vi.spyOn(CometChat, 'removeUserListener').mockImplementation(() => undefined);
    vi.spyOn(CometChat, 'addGroupListener').mockImplementation(() => undefined);
    vi.spyOn(CometChat, 'removeGroupListener').mockImplementation(() => undefined);
    // jsdom does not implement scrollIntoView.
    Element.prototype.scrollIntoView = vi.fn();
    vi.stubGlobal(
      'IntersectionObserver',
      vi.fn(() => ({ observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn() }))
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    fake.restore();
  });

  it('without a keyword: the cached people show first (1:1, users read)', async () => {
    const read = scriptedRead('Users');
    const builder = new StubBuilder(read);
    render(
      <CometChatMessageComposerMentionsList
        isOpen
        searchKeyword=""
        user={new CometChat.User({ uid: 'peer', name: 'Peer' })}
        usersRequestBuilder={builder as unknown as CometChat.UsersRequestBuilder}
        onItemClick={vi.fn()}
      />
    );
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    expect(read.last().listener).toBeDefined();
    act(() => {
      read.last().cached([new CometChat.User({ uid: 'u1', name: 'Cached Carol' })]);
    });
    expect(screen.getByText('Cached Carol')).toBeTruthy();
  });

  it('with a keyword offline (group): closes as for no match (onEmpty), never an error (D83 leaves this popup alone)', async () => {
    const read = scriptedRead('GroupMembers');
    const builder = new StubBuilder(read);
    const onEmpty = vi.fn();
    const onError = vi.fn();
    render(
      <CometChatMessageComposerMentionsList
        isOpen
        searchKeyword="ca"
        group={new CometChat.Group('g1', 'G', 'public')}
        groupMembersRequestBuilder={builder as unknown as CometChat.GroupMembersRequestBuilder}
        disableMentionAll
        onItemClick={vi.fn()}
        onEmpty={onEmpty}
        onError={onError}
      />
    );
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    // The integrator's builder never carries the keyword.
    expect(builder.keyword).toBe('');
    await act(async () => {
      read.last().cached([]);
      read.last().fail();
      await Promise.resolve();
    });
    expect(onEmpty).toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });
});
