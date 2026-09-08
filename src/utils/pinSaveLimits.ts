/**
 * Server-owned caps for Pin Message, Save Message, and Pin Conversation.
 *
 * These are app settings the Chat SDK exposes, alongside the feature flags in
 * {@link ./pinSaveFeatures}:
 *
 *   - `CometChat.getPinnedMessagesLimit()`      — max pinned messages per conversation
 *   - `CometChat.getSavedMessagesLimit()`       — max saved messages per user
 *   - `CometChat.getPinnedConversationsLimit()` — max pinned conversations per user
 *
 * Each reads the same cached app-settings blob as the feature flags (no extra network cost),
 * and resolves `null` when the setting is absent — never a guessed number. We warm them once at
 * `CometChat.init()` so the "limit reached" toast can name the real cap synchronously, without an
 * await on the failure path.
 *
 * Concurrent callers share one in-flight promise, so a burst resolves once rather than N times.
 */
import { CometChat } from '@cometchat/chat-sdk-javascript';

/** Resolved pin/save caps. `null` means the setting is unknown (absent, or an older SDK build). */
export interface PinSaveLimits {
  /** Max pinned messages in one conversation. */
  pinnedMessages: number | null;
  /** Max saved messages per user, across all conversations. */
  savedMessages: number | null;
  /** Max pinned conversations per user. */
  pinnedConversations: number | null;
}

/** Everything unknown — the safe default before resolution completes, and on any failure. */
export const PIN_SAVE_LIMITS_UNKNOWN: PinSaveLimits = Object.freeze({
  pinnedMessages: null,
  savedMessages: null,
  pinnedConversations: null,
});

let cached: PinSaveLimits | null = null;
let inFlight: Promise<PinSaveLimits> | null = null;
// Bumped by resetPinSaveLimits(). A resolution commits to `cached` only if the epoch
// it began under is still current — so an older resolution that settles after a reset
// (e.g. a quick logout→login, or a re-login's _postLogin resetting and re-resolving
// mid-flight) can't clobber the newer value. Mirrors the guard in ./pinSaveFeatures.
let epoch = 0;

async function resolveLimit(
  name: 'getPinnedMessagesLimit' | 'getSavedMessagesLimit' | 'getPinnedConversationsLimit'
): Promise<number | null> {
  const fn = (CometChat as unknown as Record<string, unknown>)[name];
  if (typeof fn !== 'function') return null;
  try {
    const value = await (fn as () => Promise<number | null>).call(CometChat);
    return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    // The SDK is documented to resolve `null` rather than reject, but a transport failure
    // shouldn't take the UI with it.
    return null;
  }
}

/**
 * Resolve all three caps, asking the SDK at most once per page load.
 * Concurrent callers share the same in-flight promise.
 *
 * Called at init from both entry points (`init` and `initFromSettings`).
 */
export async function resolvePinSaveLimits(): Promise<PinSaveLimits> {
  if (cached) return cached;
  if (inFlight) return inFlight;
  const startedAt = epoch;
  inFlight = Promise.all([
    resolveLimit('getPinnedMessagesLimit'),
    resolveLimit('getSavedMessagesLimit'),
    resolveLimit('getPinnedConversationsLimit'),
  ])
    .then(([pinnedMessages, savedMessages, pinnedConversations]) => {
      const resolved: PinSaveLimits = { pinnedMessages, savedMessages, pinnedConversations };
      // Only commit if no reset happened while we were in flight (see `epoch`).
      if (startedAt === epoch) cached = resolved;
      return cached ?? resolved;
    })
    .catch(() => PIN_SAVE_LIMITS_UNKNOWN)
    .finally(() => {
      // Don't clear a newer in-flight promise started after a reset.
      if (startedAt === epoch) inFlight = null;
    });
  return inFlight;
}

/**
 * Synchronous read of the cached caps.
 * Returns everything-unknown until {@link resolvePinSaveLimits} has completed.
 */
export function getPinSaveLimits(): PinSaveLimits {
  return cached ?? PIN_SAVE_LIMITS_UNKNOWN;
}

/**
 * Drop the cache. Call on logout — caps are per-app, and a different login may land on a
 * different app. Exported for tests.
 */
export function resetPinSaveLimits(): void {
  cached = null;
  inFlight = null;
  epoch++;
}
