/**
 * Session-wide notices are buffered by the hub until a screen takes them
 * (UIT-LIFE-05): the SDK reports a cache reset once, often during init or
 * login before any list is mounted, and each notice is shown in one place.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { OfflineHub } from '../hub';
import { installOfflineSdk, type OfflineSdkFake } from '../../../testing/offline-sdk-fake';
import { MockCometChatProvider } from '../../../testing/mock-providers';
import { CometChatConversationsOfflineNotices } from '../../../components/CometChatConversations/CometChatConversationsOfflineNotices';

describe('hub: session-wide notice buffer', () => {
  let fake: OfflineSdkFake;

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk({ enabled: true });
    OfflineHub.getInstance().start();
  });

  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
  });

  it('a reset before any screen subscribed is kept and handed to the first taker only', () => {
    const hub = OfflineHub.getInstance();
    fake.fire('cacheReset', 'onOfflineCacheReset', 'SCHEMA_CHANGED', 2);
    const taken = hub.takeSessionNotices();
    expect(taken.map(n => [n.kind, n.count])).toEqual([['unsent_messages_lost', 2]]);
    expect(hub.takeSessionNotices()).toEqual([]);
  });

  it('a live notice is claimed once: the second mounted screen does not show it again', () => {
    const hub = OfflineHub.getInstance();
    const claims: boolean[] = [];
    hub.notice.subscribe(n => claims.push(hub.claimSessionNotice(n.id)));
    hub.notice.subscribe(n => claims.push(hub.claimSessionNotice(n.id)));
    fake.fire('cacheReset', 'onOfflineCacheReset', 'SCHEMA_CHANGED', -1);
    expect(claims).toEqual([true, false]);
    expect(hub.takeSessionNotices()).toEqual([]);
  });

  it('per-chat notices are not buffered', () => {
    const hub = OfflineHub.getInstance();
    hub.raiseNotice({ kind: 'queue_full', conversationId: 'c1' });
    expect(hub.takeSessionNotices()).toEqual([]);
  });

  it('a later reset keeps the earlier lost count; logout clears the buffer', () => {
    const hub = OfflineHub.getInstance();
    fake.fire('cacheReset', 'onOfflineCacheReset', 'SCHEMA_CHANGED', 3);
    fake.fire('cacheReset', 'onOfflineCacheReset', 'SCHEMA_CHANGED', -1);
    expect(hub.takeSessionNotices().map(n => n.kind)).toEqual([
      'unsent_messages_lost',
      'unsent_messages_maybe_lost',
    ]);
    fake.fire('cacheReset', 'onOfflineCacheReset', 'SCHEMA_CHANGED', 1);
    fake.fire('login', 'logoutSuccess');
    expect(hub.takeSessionNotices()).toEqual([]);
  });
});

describe('conversation list notices: replay on mount (UIT-LIFE-05)', () => {
  let fake: OfflineSdkFake;

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk({ enabled: true });
    OfflineHub.getInstance().start();
  });

  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
  });

  it('shows a reset reported before the list mounted, once', () => {
    fake.fire('cacheReset', 'onOfflineCacheReset', 'SCHEMA_CHANGED', 2);
    render(
      <MockCometChatProvider>
        <CometChatConversationsOfflineNotices />
        <CometChatConversationsOfflineNotices />
      </MockCometChatProvider>
    );
    expect(screen.getAllByTestId('offline-notice')).toHaveLength(1);
  });

  it('a reset while two lists are mounted shows in one of them only', () => {
    render(
      <MockCometChatProvider>
        <CometChatConversationsOfflineNotices />
        <CometChatConversationsOfflineNotices />
      </MockCometChatProvider>
    );
    act(() => {
      fake.fire('cacheReset', 'onOfflineCacheReset', 'SCHEMA_CHANGED', -1);
    });
    expect(screen.getAllByTestId('offline-notice')).toHaveLength(1);
  });
});
