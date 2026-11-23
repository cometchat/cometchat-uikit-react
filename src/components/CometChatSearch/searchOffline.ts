/**
 * Offline support for CometChatSearch (internal, not exported).
 *
 * With the SDK's offline support on, a search keyword has no offline cache, so a
 * keyword search that fails with the not-connected error shows "Connect to search"
 * (D84, no `onError`), as Android's search screen does. A read with only filters is never
 * "Connect to search" or "Connect to load" here: it answers from the device, and when it
 * cannot reach the server with nothing saved it is the plain empty state (Android). The
 * result lists report whether they are showing "Connect to search" so the root's unified
 * view can say the same.
 *
 * A scope that fails with a real error while nothing is shown is not an error view on its own:
 * Android's `updateFinalStateIfCompleted` ends it in the plain empty state with no `onError`
 * unless the other scope failed too (the error view and `onError`) or has results on screen
 * (they stay, and the failure reaches `onError`). So the scope reports it as `failed`, holds
 * the error, and the root decides once every scope has answered. Nothing here is set with
 * offline off.
 *
 * @internal
 */
import { createContext } from 'react';

export type SearchOfflineScope = 'conversations' | 'messages';

/**
 * What a scope could not do offline: search by keyword (`search`, "Connect to search"), or
 * answer at all for a real reason with nothing to show (`failed`, error held by the root).
 */
export type SearchOfflineKind = 'search' | 'failed' | null;

export interface SearchOfflineContextValue {
  kinds: Record<SearchOfflineScope, SearchOfflineKind>;
  report: (scope: SearchOfflineScope, kind: SearchOfflineKind) => void;
  /**
   * Whether both result scopes are on screen. A scope holds its real failure only when
   * there is another scope to wait for; on its own (in-chat search, or any filter that
   * leaves one scope) it ends in the error view and reports the error at once, as it does
   * with offline off (Prajwal `CometChatSearchRoot.tsx:294`).
   */
  bothScopesActive: boolean;
  /**
   * Hands the root the real error of a scope that has nothing to show, so it reaches `onError`
   * only when Android's final state would (null drops a held error). Stable between renders.
   */
  hold: (scope: SearchOfflineScope, error: unknown) => void;
}

export const CometChatSearchOfflineContext = createContext<SearchOfflineContextValue | null>(null);
CometChatSearchOfflineContext.displayName = 'CometChatSearchOfflineContext';

/** The kind a result list is in, from the flags its hook returns. */
export function searchOfflineKind(
  connectToSearch: boolean | undefined,
  searchFailed?: boolean
): SearchOfflineKind {
  if (searchFailed) return 'failed';
  return connectToSearch ? 'search' : null;
}

/**
 * What a finished search leaves on screen when both scopes are shown (Android's
 * `updateFinalStateIfCompleted`): both scopes failed, at least one for a real reason, is the
 * error view; every other combination keeps each scope's own state.
 */
export function bothScopesFailed(
  conversations: SearchOfflineKind,
  messages: SearchOfflineKind
): boolean {
  return (
    conversations !== null &&
    messages !== null &&
    (conversations === 'failed' || messages === 'failed')
  );
}
