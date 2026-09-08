/**
 * Shared helpers for Pin Message and Save Message.
 *
 * Two rules govern everything here, both from the SDK's PIN_SAVE_CONTRACT:
 *
 *   1. The *presence* of `pinnedAt` / `savedAt` IS the boolean. The fields are absent
 *      when unset and CLEARED (not zeroed) on unpin/unsave, so `getPinnedAt() === 0`
 *      is never a valid test. Always go through `isPinned()` / `isSaved()`.
 *   2. `pinnedAt`/`pinnedBy` are global — identical for every member of the
 *      conversation. `savedAt` is per-viewer and only ever populated on the acting
 *      user's own copy of the message.
 */
import * as ChatSDK from '@cometchat/chat-sdk-javascript';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatUIKitConstants } from '../constants/CometChatUIKitConstants';
import {
  isMessageModerated,
  isMessagePendingModeration,
  isPermissionDeniedError,
} from './MessageReceiptUtils';

/** Literal to fall back on; see {@link getSystemPinnerSentinel}. */
const SYSTEM_PINNER_FALLBACK = 'app_system';

let systemPinnerSentinel: string | null = null;

/**
 * `pinnedBy` value meaning the pin came from the app/admin rather than a member.
 *
 * A MODULE export of the SDK, not a static on `CometChat` — reading it off the
 * class (as this module once did) always missed and silently used the literal,
 * which defeats the point of tracking the constant at all.
 *
 * Resolved LAZILY and inside a try/catch rather than at module scope. Both are
 * about the same hazard: a spec that replaces the SDK with a partial `vi.mock`
 * has no such export, and its mock proxy THROWS on the access rather than
 * returning undefined. At module scope that took down every spec importing this
 * file, however unrelated. Deferred, only a caller that actually needs the
 * sentinel pays, and it degrades to the literal instead of exploding.
 */
function getSystemPinnerSentinel(): string {
  if (systemPinnerSentinel !== null) return systemPinnerSentinel;
  try {
    const exported = (ChatSDK as { PIN_SAVE_SENTINELS?: { SYSTEM_PINNER?: string } })
      .PIN_SAVE_SENTINELS?.SYSTEM_PINNER;
    systemPinnerSentinel = exported ?? SYSTEM_PINNER_FALLBACK;
  } catch {
    systemPinnerSentinel = SYSTEM_PINNER_FALLBACK;
  }
  return systemPinnerSentinel;
}

/** Is this message currently pinned in its conversation? Global — same for everyone. */
export function isPinned(message: CometChat.BaseMessage): boolean {
  // Guarded: an older SDK build may not expose the accessor at all.
  return typeof message.isPinned === 'function' ? message.isPinned() : false;
}

/** Has the logged-in user saved this message? Private to that user. */
export function isSaved(message: CometChat.BaseMessage): boolean {
  return typeof message.isSaved === 'function' ? message.isSaved() : false;
}

/**
 * Was the pin placed by the app/admin rather than by a member?
 * Render these as a system pin — never resolve `app_system` as a user.
 */
export function isSystemPinned(message: CometChat.BaseMessage): boolean {
  if (!isPinned(message)) return false;
  if (typeof message.isSystemPinned === 'function') return message.isSystemPinned();
  return getPinnedBy(message) === getSystemPinnerSentinel();
}

/** UID of the most recent pinner, or `app_system`. Empty string when not pinned. */
export function getPinnedBy(message: CometChat.BaseMessage): string {
  if (typeof message.getPinnedBy !== 'function') return '';
  return message.getPinnedBy() ?? '';
}

/**
 * Copy pin/save attributes from the message already on screen onto a replacement.
 *
 * An edit, moderation or reaction payload describes *that* change; it carries no
 * promise of also carrying `pinnedAt`/`savedAt`. Swapping it in wholesale would
 * silently clear the indicators — and on the Pinned panel, erase the very reason
 * the row is there.
 *
 * Only ever fills gaps: a replacement that does assert pin/save state keeps it,
 * and genuine unpin/unsave arrive as their own events.
 */
export function carryPinSaveForward(
  previous: CometChat.BaseMessage,
  next: CometChat.BaseMessage
): void {
  if (isPinned(previous) && !isPinned(next)) {
    next.setPinnedAt(previous.getPinnedAt());
    next.setPinnedBy(previous.getPinnedBy());
  }

  if (isSaved(previous) && !isSaved(next)) {
    next.setSavedAt(previous.getSavedAt());
  }
}

/**
 * Is this message eligible to be pinned or saved at all?
 *
 * Excludes action/call bubbles, deleted messages, optimistic messages that the
 * server has not yet acknowledged, and anything blocked or held by moderation.
 */
export function isPinSaveEligible(
  message: CometChat.BaseMessage,
  loggedInUserUid: string
): boolean {
  // This runs for every bubble on every render. A message-like object missing an
  // accessor must make the options EMPTY, never throw — a throw here would take
  // the whole context menu down, not just pin/save.
  const probe = message as unknown as Partial<Record<string, () => unknown>>;
  const call = (name: string): unknown =>
    typeof probe[name] === 'function' ? probe[name]() : undefined;

  // Optimistic / unsent — no server id to act on yet.
  if (!call('getId')) return false;

  if (call('getDeletedAt')) return false;

  const category = call('getCategory');
  if (
    category === CometChatUIKitConstants.MessageCategory.action ||
    category === CometChatUIKitConstants.MessageCategory.call
  ) {
    return false;
  }

  if (isMessagePendingModeration(message)) return false;
  if (isMessageModerated(message, loggedInUserUid)) return false;
  if (isPermissionDeniedError(message, loggedInUserUid)) return false;

  return true;
}

/** Is this message a reply inside a thread? Same defensive contract as above. */
export function isThreadReply(message: CometChat.BaseMessage): boolean {
  if (typeof message.getParentMessageId !== 'function') return false;
  return message.getParentMessageId() > 0;
}

/**
 * Read a pin/save cap out of a rejection's PROSE (e.g. "…has reached the allowed limit of 5.").
 *
 * This is the FALLBACK source for the number shown in the "limit reached" toast. The primary
 * source is the warmed app-settings cap (see {@link ./pinSaveLimits} —
 * `CometChat.getPinnedMessagesLimit()` etc.); this text extraction covers the case where that
 * setting is unknown. Returns `null` when the text carries no cap.
 */
export function readLimitFromError(error: unknown): number | null {
  return readLimitFromErrorText(error);
}

/**
 * The exact server error codes for the three pin/save caps, in the only three
 * places a limit toast is shown: pinning a message, saving a message, and pinning
 * a conversation. Matching the code exactly (rather than sniffing the message for
 * "limit") keeps an unrelated future `*LIMIT*` failure from masquerading as one of
 * these.
 */
const LIMIT_ERROR_CODES: ReadonlySet<string> = new Set([
  'ERR_PINNED_MESSAGES_LIMIT_EXCEEDED',
  'ERR_SAVED_MESSAGES_LIMIT_EXCEEDED',
  'ERR_PINNED_CONVERSATIONS_LIMIT_EXCEEDED',
]);

/**
 * Did this rejection come from hitting a pin/save cap? Decided by an exact match
 * on one of the known {@link LIMIT_ERROR_CODES} — used to decide whether to show a
 * limit toast at all (vs a network/other failure). The NUMBER shown comes from the
 * warmed app-settings cap, with {@link readLimitFromError} as the fallback.
 */
export function isLimitError(error: unknown): boolean {
  const source = error as { code?: unknown; error?: { code?: unknown } } | null | undefined;
  const code = typeof source?.code === 'string' ? source.code : source?.error?.code;
  return typeof code === 'string' && LIMIT_ERROR_CODES.has(code);
}

/**
 * Largest number the trailing-digits fallback will accept as a cap.
 *
 * Pin and save caps are small (single or double digits today). The guard is what
 * keeps the fallback from reading a message id out of "Cannot pin message 84213"
 * and telling the user they may pin up to 84,213 messages — a wrong number stated
 * confidently is worse than the generic copy.
 */
const MAX_PLAUSIBLE_LIMIT = 1000;

/**
 * Read the cap out of the error's prose.
 *
 * Looks for the "limit of <n>" phrasing first and only then for a bare trailing
 * number, so an id embedded in the same sentence — these messages name the
 * conversation — can't be mistaken for the cap.
 */
function readLimitFromErrorText(error: unknown): number | null {
  for (const text of collectErrorText(error)) {
    const phrased = /limit of\s+(\d+)/i.exec(text);
    if (phrased?.[1]) return Number.parseInt(phrased[1], 10);
  }

  for (const text of collectErrorText(error)) {
    const trailing = /(\d+)\s*\.?\s*$/.exec(text.trim());
    if (!trailing?.[1]) continue;
    const value = Number.parseInt(trailing[1], 10);
    // Only the phrased form is unambiguous; a bare trailing number is a guess, so
    // it has to look like a cap before we repeat it back as one.
    if (value > 0 && value <= MAX_PLAUSIBLE_LIMIT) return value;
  }

  return null;
}

/** Message strings worth searching, across the shapes an error can arrive in. */
function collectErrorText(error: unknown): string[] {
  if (typeof error === 'string') return [error];
  if (!error || typeof error !== 'object') return [];

  const shape = error as {
    message?: unknown;
    devMessage?: unknown;
    error?: { message?: unknown; devMessage?: unknown };
  };

  return [shape.message, shape.devMessage, shape.error?.message, shape.error?.devMessage].filter(
    (value): value is string => typeof value === 'string' && value.length > 0
  );
}

/** SBAC/RBAC rejection codes: the user's role may not pin/unpin (or save) here. */
const PERMISSION_ERROR_CODES: ReadonlySet<string> = new Set([
  'ERR_ACTION_NOT_ALLOWED',
  'ERR_PERMISSION_DENIED',
]);

/**
 * Did this rejection come from SBAC/RBAC? Pin and unpin are independently gated on
 * the server; either denial surfaces the same "you don't have permission" toast,
 * so a single code check covers both. Reads the code top-level or nested.
 */
export function isPermissionError(error: unknown): boolean {
  const source = error as { code?: unknown; error?: { code?: unknown } } | null | undefined;
  const code = typeof source?.code === 'string' ? source.code : source?.error?.code;
  return typeof code === 'string' && PERMISSION_ERROR_CODES.has(code);
}
