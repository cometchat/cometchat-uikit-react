/**
 * `useReloadOnReconnect` registers its connection listener for the whole life
 * of the list, and reads the offline state when the connection returns.
 *
 * It used to register only when offline was already on at the mount, so a list
 * mounted before `CometChat.init()` / the app's `setOfflineConfig` had taken
 * effect never got a listener at all: for the rest of its life it stayed on its
 * "Connect to load …" view after the connection came back, and only a remount
 * fixed it. Search, the notification feed, reactions, pinned and saved messages
 * all run on this hook.
 *
 * Review: Prajwal `useReloadOnReconnect.ts:30` on #2460.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { useReloadOnReconnect } from '../useReloadOnReconnect';
import { installOfflineSdk, type OfflineSdkFake } from '../../../testing/offline-sdk-fake';

describe('useReloadOnReconnect', () => {
  let fake: OfflineSdkFake;
  let connected: (() => void)[];
  let removed: string[];

  function Probe({ reload }: { reload: () => void }) {
    useReloadOnReconnect(() => true, reload);
    return null;
  }

  beforeEach(() => {
    connected = [];
    removed = [];
    vi.spyOn(CometChat, 'addConnectionListener').mockImplementation(
      (_id: string, listener: unknown) => {
        const onConnected = (listener as { onConnected?: () => void }).onConnected;
        if (onConnected) connected.push(onConnected);
      }
    );
    vi.spyOn(CometChat, 'removeConnectionListener').mockImplementation((id: string) => {
      removed.push(id);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fake.restore();
  });

  it('offline turned on after the mount still reloads on reconnect', () => {
    // The usual order in an app: the screen is up before the kit's init has
    // told the SDK about the offline config.
    fake = installOfflineSdk({ enabled: false });
    const reload = vi.fn();
    render(<Probe reload={reload} />);
    expect(connected).toHaveLength(1);

    fake.setEnabled(true);
    connected.forEach(fire => fire());
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('with offline off the connection listener does nothing', () => {
    fake = installOfflineSdk({ enabled: false });
    const reload = vi.fn();
    render(<Probe reload={reload} />);
    connected.forEach(fire => fire());
    expect(reload).not.toHaveBeenCalled();
  });

  it('offline on at the mount reloads as before, and the listener is removed on unmount', () => {
    fake = installOfflineSdk({ enabled: true });
    const reload = vi.fn();
    const view = render(<Probe reload={reload} />);
    connected.forEach(fire => fire());
    expect(reload).toHaveBeenCalledTimes(1);
    view.unmount();
    expect(removed).toHaveLength(1);
  });
});
