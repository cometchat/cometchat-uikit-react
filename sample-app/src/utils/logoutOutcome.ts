/** What Log Out ended in: go to sign-in, or stay with the error. */
export interface LogoutOutcome {
  signedOut: boolean;
  error?: unknown;
}

/**
 * Runs `logout` and says whether the app should go to sign-in.
 *
 * Offline, the Chat SDK ends the session on the device and then rejects `logout()`, so a
 * rejection alone does not mean the user is still signed in. On a rejection the app asks the
 * SDK: no user (or the check itself failing) goes to sign-in, as Android's sample does on any
 * logout result; only a user still logged in keeps the app where it is. A successful logout
 * goes to sign-in as before.
 *
 * Pure (no React or kit imports) so the sample's node test runner can cover it.
 */
export async function resolveLogout(
  logout: () => Promise<unknown>,
  getLoggedinUser: () => Promise<unknown>
): Promise<LogoutOutcome> {
  try {
    await logout();
    return { signedOut: true };
  } catch (error) {
    let stillLoggedIn = false;
    try {
      stillLoggedIn = !!(await getLoggedinUser());
    } catch {
      // The check failing counts as signed out.
    }
    return { signedOut: !stillLoggedIn, error };
  }
}
