/**
 * `useOfflineListLifecycle` reloads its list when someone is signed in again
 * after a session ended, the same way Conversations and the message list do
 * (a33976682).
 *
 * Without it, users, groups, members, reactions, the notification feed, pinned,
 * saved and search cleared themselves on `session` and then stayed on that
 * blank frame for the rest of their life: their initial-fetch effect only
 * re-runs for a new request builder or prop, so a list still mounted across a
 * user switch showed an empty list until it was remounted.
 *
 * Review: Aanshi F1 on #2460.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { OfflineHub } from '../hub';
import { useOfflineListLifecycle } from '../useOfflineListLifecycle';

function signedIn(uid: string): CometChat.User {
  return new CometChat.User({ uid, name: uid });
}

describe('useOfflineListLifecycle on login', () => {
  const calls: string[] = [];

  function Probe({ usedOffline }: { usedOffline: boolean }) {
    const usedRef = useOfflineListLifecycle({
      onSessionEnd: () => calls.push('sessionEnd'),
      onCacheReset: () => calls.push('cacheReset'),
      onLogin: () => calls.push('login'),
    });
    if (usedOffline) usedRef.current = true;
    return null;
  }

  beforeEach(() => {
    calls.length = 0;
    // A clean session on the shared hub: the previous spec's uid must not make
    // the first login of this spec a user switch.
    OfflineHub.getInstance().endSession();
    calls.length = 0;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('a user switch clears the list and then loads it for the new user', () => {
    render(<Probe usedOffline />);
    const hub = OfflineHub.getInstance();
    hub.onLogin(signedIn('first'));
    calls.length = 0;

    hub.onLogin(signedIn('second'));

    // Cleared first, then read again: in that order, so the reload never shows
    // the previous user's rows.
    expect(calls).toEqual(['sessionEnd', 'login']);
  });

  it('a login after a logout loads the list again', () => {
    render(<Probe usedOffline />);
    const hub = OfflineHub.getInstance();
    hub.onLogin(signedIn('first'));
    hub.endSession();
    calls.length = 0;

    hub.onLogin(signedIn('first'));

    expect(calls).toEqual(['login']);
  });

  it('a list that never used the offline path is left alone', () => {
    render(<Probe usedOffline={false} />);
    const hub = OfflineHub.getInstance();
    hub.onLogin(signedIn('first'));
    hub.onLogin(signedIn('second'));

    expect(calls).toEqual([]);
  });

  it('the listener goes away with the list', () => {
    const view = render(<Probe usedOffline />);
    const hub = OfflineHub.getInstance();
    hub.onLogin(signedIn('first'));
    view.unmount();
    calls.length = 0;

    hub.onLogin(signedIn('second'));

    expect(calls).toEqual([]);
  });
});
