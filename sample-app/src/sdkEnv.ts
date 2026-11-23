/// <reference types="vite/client" />

/**
 * Optional SDK overrides read from Vite env vars.
 *
 * None of these are set for the normal `npm run dev` / `npm run build`. The one
 * difference from the kit's own defaults: the sample app turns offline support
 * ON unless `VITE_COMETCHAT_OFFLINE=0` (the kit itself keeps it OFF unless the
 * integrator calls `setOfflineConfig`). `vite --mode offline-e2e` (`npm run dev:offline-e2e`)
 * loads `.env.offline-e2e`, which points the app at the offline conformance
 * harness's local fake CometChat server, turns offline support on and turns
 * calling off. It is used only by `playwright.offline.config.ts`.
 */
const env = import.meta.env as Record<string, string | undefined>;

export const SDK_ENV = {
  appId: env.VITE_COMETCHAT_APP_ID ?? '',
  region: env.VITE_COMETCHAT_REGION ?? '',
  authKey: env.VITE_COMETCHAT_AUTH_KEY ?? '',
  /** Custom data-plane hosts, e.g. `127.0.0.1:48787/v3.0` for the fake server. */
  clientHost: env.VITE_COMETCHAT_CLIENT_HOST ?? '',
  adminHost: env.VITE_COMETCHAT_ADMIN_HOST ?? '',
  /**
   * The sample app turns the Chat SDK's offline support on by default.
   * `VITE_COMETCHAT_OFFLINE=0` turns it off for the whole build; `?offline=0`
   * turns it off for one page load.
   */
  offline: env.VITE_COMETCHAT_OFFLINE !== '0',
  /**
   * Calling is on unless explicitly turned off. The fake server has no Calls
   * backend, and a failed Calls SDK login clears the chat session.
   */
  calling: env.VITE_COMETCHAT_CALLING !== '0',
};

/**
 * Offline support is on in the sample app unless `?offline=0` (or a build with
 * `VITE_COMETCHAT_OFFLINE=0`); `?offline=1` forces it on. It needs a Chat SDK
 * with offline support (4.3.0 or later); older SDKs ignore it.
 */
export function isOfflineRequested(search: string = window.location.search): boolean {
  const param = new URLSearchParams(search).get('offline');
  return param === '1' || (param !== '0' && SDK_ENV.offline);
}

/**
 * Extra offline settings for the offline E2E suite, from `?offlineConfig=<JSON>`
 * (e.g. `{"maxPendingMessages":2}`), merged over `{ enabled: true }`. Only read
 * when offline is requested; anything that is not a JSON object is ignored.
 */
export function offlineConfigOverrides(
  search: string = window.location.search
): Record<string, unknown> {
  const raw = new URLSearchParams(search).get('offlineConfig');
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}
