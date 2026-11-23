import { describe, expect, it, vi } from 'vitest';
import { resolveLogout } from './logoutOutcome';

/**
 * Whether Log Out takes the app to sign-in. Offline, the Chat SDK ends the session on the
 * device and then rejects logout(), so a rejection alone must not keep the user on a blank
 * Chats screen: the app asks the SDK whether anyone is still logged in, as Android's sample
 * goes to sign-in whatever logout() answered.
 */
describe('resolveLogout', () => {
  it('signs out when logout succeeds, without asking the SDK again', async () => {
    const getLoggedinUser = vi.fn();
    await expect(resolveLogout(() => Promise.resolve(), getLoggedinUser)).resolves.toEqual({
      signedOut: true,
    });
    expect(getLoggedinUser).not.toHaveBeenCalled();
  });

  it('signs out when logout rejects but the SDK has no user any more (offline logout)', async () => {
    const error = new Error('not connected');
    await expect(
      resolveLogout(
        () => Promise.reject(error),
        () => Promise.resolve(null)
      )
    ).resolves.toEqual({ signedOut: true, error });
  });

  it('signs out when logout rejects and the check itself fails', async () => {
    const error = new Error('not connected');
    await expect(
      resolveLogout(
        () => Promise.reject(error),
        () => Promise.reject(new Error('no session'))
      )
    ).resolves.toEqual({ signedOut: true, error });
  });

  it('stays signed in with the error when the SDK still has the user', async () => {
    const error = new Error('logout failed');
    await expect(
      resolveLogout(
        () => Promise.reject(error),
        () => Promise.resolve({ uid: 'alice' })
      )
    ).resolves.toEqual({ signedOut: false, error });
  });
});
