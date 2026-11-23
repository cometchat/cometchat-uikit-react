/**
 * A logout clears the list through the hub, which renders it once more before
 * the app takes it away, with the user already gone. That render must not
 * throw (it would blank the app). With offline off nothing changes.
 */
import React from 'react';
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { useCometChatMessageList } from '../useCometChatMessageList';
import { CometChatUIKit } from '../../../CometChatUIKit/CometChatUIKit';
import { OfflineHub } from '../../../utils/offline/hub';
import { CometChatPluginRegistryContext } from '../../../context/PluginRegistryContext';
import { CometChatPluginRegistry } from '../../../plugins/CometChatPluginRegistry';
import { installOfflineSdk, type OfflineSdkFake } from '../../../testing/offline-sdk-fake';

const me = new CometChat.User({ uid: 'me', name: 'Me' });
const registry = new CometChatPluginRegistry([]);
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <CometChatPluginRegistryContext.Provider value={registry}>
    {children}
  </CometChatPluginRegistryContext.Provider>
);

describe('useCometChatMessageList after the user is gone', () => {
  let fake: OfflineSdkFake;

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk({ enabled: true });
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
    vi.restoreAllMocks();
  });

  it('offline on: the render during logout keeps the user the list had', () => {
    const user = vi.spyOn(CometChatUIKit, 'getLoggedInUser').mockReturnValue(me);
    const { rerender, result } = renderHook(() => useCometChatMessageList({}), { wrapper });
    user.mockReturnValue(null);
    fake.setEnabled(false); // The SDK says off once logged out.
    expect(() => {
      rerender();
    }).not.toThrow();
    expect(result.current.loggedInUser.getUid()).toBe('me');
  });

  it('offline off: a render with no user still throws, as today', () => {
    fake.setEnabled(false);
    const user = vi.spyOn(CometChatUIKit, 'getLoggedInUser').mockReturnValue(me);
    const { rerender } = renderHook(() => useCometChatMessageList({}), { wrapper });
    user.mockReturnValue(null);
    expect(() => {
      rerender();
    }).toThrow('requires a logged-in user');
  });

  it('a list that never had a user throws, offline on or off', () => {
    vi.spyOn(CometChatUIKit, 'getLoggedInUser').mockReturnValue(null);
    expect(() => renderHook(() => useCometChatMessageList({}), { wrapper })).toThrow(
      'requires a logged-in user'
    );
  });
});
