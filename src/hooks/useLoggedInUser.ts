import { useEffect, useState } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatUIKit } from '../CometChatUIKit';

/**
 * useLoggedInUser — get the logged-in user.
 *
 * Reads synchronously from CometChatUIKit first (instant if init+login was done via UIKit class).
 * Falls back to async CometChat.getLoggedinUser() for cases where the SDK was initialized directly.
 * SSR-safe: returns null if no user is available.
 *
 * Use this in components that can render without a user (graceful degradation).
 * For components that REQUIRE a user, check the return value and handle null.
 */
export function useLoggedInUser(): CometChat.User | null {
  const [user, setUser] = useState<CometChat.User | null>(() => CometChatUIKit.getLoggedInUser());

  useEffect(() => {
    if (user) return;

    let cancelled = false;
    void CometChat.getLoggedinUser()
      .then(resolved => {
        if (!cancelled && resolved && typeof resolved.getUid === 'function') {
          setUser(resolved);
        }
      })
      .catch(() => {
        // SDK not initialized or not logged in — leave as null
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  return user;
}
