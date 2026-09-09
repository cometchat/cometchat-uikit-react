/**
 * Feature-flag gate for Pin Message and Save Message.
 *
 * WHY THIS EXISTS: the SDK's flags are `Promise<boolean>`, but the consumer is
 * synchronous. `getStandardMessageOptions()` builds a memoized array during render
 * to decide whether Pin/Save appear in the context menu — it cannot await. So this
 * module's real job is to turn an async flag into a synchronous read
 * ({@link getPinSaveFeatures}) plus a re-render signal (the `usePinSaveFeatures`
 * hook), warmed once at `CometChatUIKit.init()`.
 *
 * NOT a network optimisation. The SDK's `isFeatureEnabled` already reads the app
 * settings blob from local storage and only calls the API on a cache miss, so the
 * memo here saves a storage read, nothing more. (Careful: the `@internal`
 * `CometChat.getAppSettings()` is a different function that always hits the network
 * and overwrites that cache — this module deliberately does not use it.)
 *
 * Both SDK calls resolve `false` rather than rejecting when the flag is missing or
 * settings are unavailable, so an unavailable setting degrades to "hidden" rather than
 * to an unhandled rejection. We still wrap them, because an older SDK build may not
 * expose the methods at all.
 *
 * Concurrent callers share one in-flight promise, so a burst of mounting bubbles
 * resolves once rather than N times.
 */
import { CometChat } from '@cometchat/chat-sdk-javascript';

/** Resolved state of the pin/save flags. */
export interface PinSaveFeatures {
  /** Whether Pin Message is enabled for this app's plan. */
  pinMessage: boolean;
  /** Whether Save Message is enabled for this app's plan. */
  saveMessage: boolean;
  /**
   * Whether Pin Conversation is enabled for this app's plan.
   */
  pinConversation: boolean;
}

/** Everything off — the safe default before resolution completes, and on any failure. */
export const PIN_SAVE_FEATURES_DISABLED: PinSaveFeatures = Object.freeze({
  pinMessage: false,
  saveMessage: false,
  pinConversation: false,
});

let cached: PinSaveFeatures | null = null;
let inFlight: Promise<PinSaveFeatures> | null = null;
// Bumped by resetPinSaveFeatures(). A resolution captures the epoch it began under
// and commits to `cached` only if that epoch is still current. This matters because
// a reset can happen while a resolve is still in flight — e.g. a quick logout→login,
// or a re-login whose _postLogin() resets and re-resolves before the previous
// resolution settled. Without this guard, that older promise could land last and
// clobber the newer value with a stale (or different-session) result.
let epoch = 0;

async function resolveFlag(
  name: 'isPinMessageEnabled' | 'isSaveMessageEnabled' | 'isPinConversationEnabled'
): Promise<boolean> {
  const fn = (CometChat as unknown as Record<string, unknown>)[name];
  if (typeof fn !== 'function') return false;
  try {
    return await (fn as () => Promise<boolean>).call(CometChat);
  } catch {
    // Documented not to reject, but a transport failure shouldn't take the UI with it.
    return false;
  }
}

/**
 * Resolve both flags, asking the SDK at most once per page load.
 * Concurrent callers share the same in-flight promise.
 *
 * Called at init from both entry points (`init` and `initFromSettings`), and again
 * by `usePinSaveFeatures` for consumers that mount before it lands.
 */
export async function resolvePinSaveFeatures(): Promise<PinSaveFeatures> {
  if (cached) return cached;
  if (inFlight) return inFlight;
  const startedAt = epoch;
  inFlight = Promise.all([
    resolveFlag('isPinMessageEnabled'),
    resolveFlag('isSaveMessageEnabled'),
    resolveFlag('isPinConversationEnabled'),
  ])
    .then(([pinMessage, saveMessage, pinConversation]) => {
      const resolved: PinSaveFeatures = { pinMessage, saveMessage, pinConversation };
      // Only commit if no reset happened while we were in flight (see `epoch`).
      if (startedAt === epoch) cached = resolved;
      return cached ?? resolved;
    })
    .catch(() => PIN_SAVE_FEATURES_DISABLED)
    .finally(() => {
      // Don't clear a newer in-flight promise started after a reset.
      if (startedAt === epoch) inFlight = null;
    });
  return inFlight;
}

/**
 * Synchronous read of the cached flags.
 * Returns everything-off until {@link resolvePinSaveFeatures} has completed — callers
 * that need to react to resolution should use the `usePinSaveFeatures` hook.
 */
export function getPinSaveFeatures(): PinSaveFeatures {
  return cached ?? PIN_SAVE_FEATURES_DISABLED;
}

/**
 * Drop the cache. Call on logout — flags are per-app, and a different login may land
 * on a different app. Exported for tests.
 */
export function resetPinSaveFeatures(): void {
  cached = null;
  inFlight = null;
  epoch++;
}
