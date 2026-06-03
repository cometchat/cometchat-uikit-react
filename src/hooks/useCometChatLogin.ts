/**
 * useCometChatLogin — handles CometChat SDK login via CometChatUIKit.
 *
 * Waits for init to complete, then logs in using either:
 * - authToken (preferred, production) via CometChatUIKit.loginWithAuthToken()
 * - uid + authKey via CometChatUIKit.login()
 *
 * Also checks for an existing session (CometChatUIKit may have already resumed it
 * during init) before attempting a fresh login.
 *
 * This hook is internal to CometChatProvider — not exported publicly.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatInitState, CometChatLoginState } from '../context/ChatState.types';
import { CometChatUIKit } from '../CometChatUIKit/CometChatUIKit';
import { CometChatLogger } from '../utils/CometChatLogger';

export interface UseCometChatLoginOptions {
  initState: CometChatInitState;
  authToken?: string | undefined;
  uid?: string | undefined;
  onError?: ((error: Error) => void) | undefined;
  onLoginSuccess?: ((user: CometChat.User) => void) | undefined;
}

export interface UseCometChatLoginResult {
  loginState: CometChatLoginState;
  loginError: Error | null;
  loggedInUser: CometChat.User | null;
}

export function useCometChatLogin({
  initState,
  authToken,
  uid,
  onError,
  onLoginSuccess,
}: UseCometChatLoginOptions): UseCometChatLoginResult {
  const [loginState, setLoginState] = useState<CometChatLoginState>('idle');
  const [loginError, setLoginError] = useState<Error | null>(null);
  const [loggedInUser, setLoggedInUser] = useState<CometChat.User | null>(null);
  const loginCalledRef = useRef(false);

  const performLogin = useCallback(async () => {
    // Prevent double-login in StrictMode
    if (loginCalledRef.current) return;
    loginCalledRef.current = true;

    setLoginState('logging-in');
    setLoginError(null);

    try {
      // Check if CometChatUIKit already has a logged-in user (session resumed during init)
      const existingUser = CometChatUIKit.getLoggedInUser();
      if (existingUser) {
        CometChatLogger.info(
          'useCometChatLogin',
          `Existing session found for user: ${existingUser.getUid()}`
        );
        setLoggedInUser(existingUser);
        setLoginState('logged-in');
        onLoginSuccess?.(existingUser);
        return;
      }

      // No existing session — perform login via CometChatUIKit
      let user: CometChat.User;

      if (authToken) {
        user = await CometChatUIKit.loginWithAuthToken(authToken);
      } else if (uid) {
        // CometChatUIKit.login() uses the authKey from UIKitSettings.
        // If authKey is also passed as a prop, we need to ensure it's in settings.
        // The provider builds settings with authKey included, so this works.
        user = await CometChatUIKit.login(uid);
      } else {
        const error = new Error(
          'CometChatProvider: Either authToken or uid must be provided for login.'
        );
        setLoginState('error');
        setLoginError(error);
        onError?.(error);
        return;
      }

      CometChatLogger.info('useCometChatLogin', `Login successful: ${user.getUid()}`);
      setLoggedInUser(user);
      setLoginState('logged-in');
      onLoginSuccess?.(user);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      CometChatLogger.error('useCometChatLogin', 'Login failed', error);
      setLoginState('error');
      setLoginError(error);
      onError?.(error);
    }
  }, [authToken, uid, onError, onLoginSuccess]);

  // Only attempt login after init succeeds
  useEffect(() => {
    if (initState === 'initialized') {
      void performLogin();
    }
  }, [initState, performLogin]);

  return { loginState, loginError, loggedInUser };
}
