import { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatUIEvent } from '../context/CometChatEvents.types';
import { CometChatLogger } from './CometChatLogger';

/**
 * Thread-subscription controller shared by the two kit surfaces: the
 * `threadSubscription` message option and the thread-header bell.
 *
 * The SDK exposes the server's flag on
 * the message (`isThreadSubscribed()`), a purely-local setter that mirrors a
 * change onto the message objects the kit is holding (`setThreadSubscribed()`),
 * and the two server writes (`subscribeToThread` / `unsubscribeFromThread`). So
 * this module keeps no cache either: state is read off the message, and what it
 * owns is the write path — the in-flight guard, the debounce, the optimistic
 * publish and the revert — plus the small helpers that read/write/mirror the
 * flag defensively.
 *
 * See `uikit-thread-subscription-redesign.md` for the full model.
 */

/** Minimum gap between two toggles of the same thread. */
const TOGGLE_DEBOUNCE_MS = 400;

/** Threads with a subscribe/unsubscribe request in flight. */
const inFlight = new Set<number>();

/**
 * Last accepted toggle per thread, for the debounce.
 *
 * Pruned on every write (below) so it only ever holds threads toggled within
 * the debounce window — in practice one or two entries. Without that it would
 * gain a permanent entry per thread touched and never shrink.
 */
const lastToggleAt = new Map<number, number>();

/** Drop stamps older than the debounce window; they can no longer block anything. */
function pruneToggleStamps(now: number): void {
  for (const [id, at] of lastToggleAt) {
    if (now - at >= TOGGLE_DEBOUNCE_MS) lastToggleAt.delete(id);
  }
}

/**
 * Whether the linked SDK exposes the thread-subscription WRITE API.
 *
 * The state accessors (`isThreadSubscribed` / `setThreadSubscribed`) are read off
 * the message and guarded at their own call sites; what a control needs before it
 * will render is the ability to actually change the subscription.
 */
export function isThreadSubscriptionSupported(): boolean {
  return (
    typeof CometChat.subscribeToThread === 'function' &&
    typeof CometChat.unsubscribeFromThread === 'function'
  );
}

/**
 * Read the server's subscription flag off a message.
 *
 * The flag rides every fetched message in a thread — parent and replies — and
 * answers "does the viewer follow this message's thread." Reads `false` when the
 * accessor is missing or the message is partial,
 * so building an option list on every render can never throw here.
 */
export function readThreadSubscribed(message: CometChat.BaseMessage | null | undefined): boolean {
  return !!(
    message &&
    typeof message.isThreadSubscribed === 'function' &&
    message.isThreadSubscribed()
  );
}

/**
 * Mirror a subscription state onto a message object the kit is holding.
 *
 * Purely local — the SDK setter does not touch the server. It keeps a held copy
 * in step with a change learned elsewhere (an optimistic flip, or an
 * auto-subscribe mirror) so a direct read or a component remount sees the current
 * value between fetches. A no-op on an older SDK without the setter.
 */
export function writeThreadSubscribed(
  message: CometChat.BaseMessage | null | undefined,
  subscribed: boolean
): void {
  if (message && typeof message.setThreadSubscribed === 'function') {
    message.setThreadSubscribed(subscribed);
  }
}

/**
 * Carry a `threadSubscribed` flag forward from the on-screen message onto a
 * replacement, mirroring {@link carryPinSaveForward} for pin/save.
 *
 * An edit or moderation payload describes *that* change and makes no promise to
 * re-send `threadSubscribed`; a socket frame's `false` is untrusted by design (a
 * frame simply doesn't carry the real flag). Swapping such a payload in wholesale
 * would silently clear the optimistic Case-2 subscription — which is exactly what
 * moderation was doing to a just-sent message.
 *
 * Fills a gap only: copies the flag when `previous` is subscribed and `next` is
 * not. It never clears and never overrides a truthy `next`, so a genuine
 * unsubscribe (which arrives as its own `ui:thread/subscription-changed` flip or a
 * server-truth fetch, not as an edit/moderation payload) still wins.
 */
export function carryThreadSubscribed(
  previous: CometChat.BaseMessage | null | undefined,
  next: CometChat.BaseMessage | null | undefined
): void {
  if (readThreadSubscribed(previous) && !readThreadSubscribed(next)) {
    writeThreadSubscribed(next, true);
  }
}

/**
 * The thread a subscription action applies to.
 *
 * Invoked on a reply, it resolves to that reply's parent — a subscription is
 * always rooted at the thread's parent message, never at a reply.
 *
 * Reads defensively: unlike the other options, which only touch the message
 * inside `onClick`, this one is resolved while the option list is being built,
 * so a caller passing a partial message must not take the whole list down.
 */
export function getSubscriptionTargetId(message: CometChat.BaseMessage): number {
  /* eslint-disable @typescript-eslint/no-unnecessary-condition -- getOptions is public API; the message is not guaranteed to be a full BaseMessage */
  const rawParentId: unknown =
    typeof message?.getParentMessageId === 'function' ? message.getParentMessageId() : undefined;
  const rawId: unknown = typeof message?.getId === 'function' ? message.getId() : undefined;
  /* eslint-enable @typescript-eslint/no-unnecessary-condition */

  return toThreadId(rawParentId) || toThreadId(rawId);
}

/**
 * Normalize a thread id to a number.
 *
 * Load-bearing: the id reaches us as a number from the typings but as a string
 * from some payloads, and subscription events are matched with `===`. A string
 * on one side and a number on the other makes every cross-surface update
 * silently no-op. Everything that publishes or matches a thread id goes
 * through here.
 *
 * @returns a positive integer id, or 0 for anything else.
 */
export function toThreadId(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

/**
 * Mirror an auto-subscribe locally — Cases 3 (a reply mentions you) and 4 (you
 * reply in a thread).
 *
 * Both are server-side truths: the server has already subscribed the user. The
 * kit only reflects that for immediate feedback — it publishes the flip onto the
 * bus and, deliberately, does NOT call `subscribeToThread`. Re-issuing the write
 * would be a redundant round-trip; the next parent fetch confirms the state.
 */
export function mirrorThreadSubscribed(
  parentMessageId: number,
  publish: ((event: CometChatUIEvent) => void) | undefined
): void {
  const threadId = toThreadId(parentMessageId);
  if (!threadId) return;
  publish?.({
    type: 'ui:thread/subscription-changed',
    parentMessageId: threadId,
    subscribed: true,
  });
}

/** Arguments for {@link applyIncomingReplySubscription}. */
export interface IncomingReplySubscriptionArgs {
  /** The reply that just arrived over the socket. */
  reply: CometChat.BaseMessage;
  /**
   * The thread's parent message, when the consumer holds it (a thread view).
   * Its `isThreadSubscribed()` is the authoritative current state to inherit.
   * Absent in the main list, where the reply is not displayed.
   */
  parentMessage?: CometChat.BaseMessage | null | undefined;
  /** Logged-in user's uid, for the mention/own checks. */
  loggedInUserUid: string;
  /** Publishes the cross-surface flip. */
  publish?: ((event: CometChatUIEvent) => void) | undefined;
  /**
   * Whether authoring the reply (Case 4) subscribes me. `true` for a fresh reply
   * (sending subscribes the author); `false` for an EDIT — editing my own message
   * does not re-subscribe me, only a mention does. @default true
   */
  ownAuthorshipSubscribes?: boolean;
}

/**
 * Reconcile subscription state for a thread reply that arrives (or is edited) in real
 * time. A socket-delivered message carries `threadSubscribed: false` regardless of the
 * truth (§ the SDK's one rule), so its own flag can't be trusted. This resolves it:
 *
 * - **@mentions me** (Case 3) — from anyone, myself included; on a fresh reply OR an
 *   edit that adds/keeps the mention. Server subscribes me. Stamp `true` on the reply
 *   and the held parent, and mirror the flip so every mounted surface agrees.
 * - **I authored the reply** (Case 4) — a fresh threaded send subscribes me. NOT on an
 *   edit (editing my own message doesn't re-subscribe me — only a mention does), so the
 *   caller passes `ownAuthorshipSubscribes: false` for edits.
 * - **Any other reply** doesn't change the subscription, so — when we hold the parent
 *   (thread view) — inherit the thread's current state onto the reply, correcting the
 *   socket `false`. In the main list (no parent held) the reply isn't displayed.
 *
 * Fires the mirror regardless of whether the thread panel is open (the caller invokes
 * it from both the append path and the main-list reply-count path). A no-op on anything
 * that isn't a thread reply — so a top-level mention never subscribes.
 */
export function applyIncomingReplySubscription({
  reply,
  parentMessage,
  loggedInUserUid,
  publish,
  ownAuthorshipSubscribes = true,
}: IncomingReplySubscriptionArgs): void {
  /* eslint-disable @typescript-eslint/no-unnecessary-condition -- realtime frames are not guaranteed to be full BaseMessages */
  const parentId = toThreadId(
    typeof reply?.getParentMessageId === 'function' ? reply.getParentMessageId() : 0
  );
  if (!parentId) return;

  const senderUid = typeof reply.getSender === 'function' ? reply.getSender().getUid() : '';
  const isOwnReply = senderUid !== '' && senderUid === loggedInUserUid;
  const mentioned =
    (typeof reply.getMentionedUsers === 'function' ? reply.getMentionedUsers() : []) ?? [];
  /* eslint-enable @typescript-eslint/no-unnecessary-condition */
  const mentionsMe = mentioned.some(u => u.getUid() === loggedInUserUid);

  if (mentionsMe || (isOwnReply && ownAuthorshipSubscribes)) {
    writeThreadSubscribed(reply, true);
    writeThreadSubscribed(parentMessage, true);
    mirrorThreadSubscribed(parentId, publish);
    return;
  }

  if (parentMessage) {
    writeThreadSubscribed(reply, readThreadSubscribed(parentMessage));
  }
}

/** Options for {@link toggleThreadSubscription}. */
export interface ToggleThreadSubscriptionOptions {
  /** Root message id of the thread. */
  parentMessageId: number;
  /** Desired next state — `true` follows, `false` unfollows. */
  subscribe: boolean;
  /** Publishes the optimistic flip and the revert onto the kit event bus. */
  publish?: ((event: CometChatUIEvent) => void) | undefined;
  /**
   * Surfaces the outcome. Called with a confirmation on success and the failure
   * message on error. `variant` is optional so a plain `(text) => void` toast —
   * like the message list's — can be passed straight in.
   */
  showToast?: ((text: string, variant?: 'default' | 'error') => void) | undefined;
  /** Localization lookup. */
  getLocalizedString?: ((key: string) => string) | undefined;
}

/**
 * Follow or unfollow a thread — Case 1, the only path that writes to the server.
 *
 * Flips the UI immediately by publishing the optimistic event, then reconciles:
 * a failure has to put the control back where it was. Both the POST and the
 * DELETE are idempotent server-side, so a duplicate never surfaces an error.
 *
 * Ignored while a request for the same thread is in flight, or within
 * {@link TOGGLE_DEBOUNCE_MS} of the last accepted toggle.
 *
 * @returns the state the control should be left in.
 */
export async function toggleThreadSubscription({
  parentMessageId: rawParentMessageId,
  subscribe,
  publish,
  showToast,
  getLocalizedString,
}: ToggleThreadSubscriptionOptions): Promise<boolean> {
  const parentMessageId = toThreadId(rawParentMessageId);
  if (!parentMessageId) return false;
  if (!isThreadSubscriptionSupported()) return false;

  const now = Date.now();
  pruneToggleStamps(now);
  const last = lastToggleAt.get(parentMessageId) ?? 0;
  if (inFlight.has(parentMessageId) || now - last < TOGGLE_DEBOUNCE_MS) {
    // A swallowed tap changes nothing, so the control stays where the user sees
    // it — the pre-click state, which is the opposite of the flip they asked for.
    return !subscribe;
  }

  lastToggleAt.set(parentMessageId, now);
  inFlight.add(parentMessageId);

  publish?.({ type: 'ui:thread/subscription-changed', parentMessageId, subscribed: subscribe });

  try {
    if (subscribe) {
      await CometChat.subscribeToThread(parentMessageId);
    } else {
      await CometChat.unsubscribeFromThread(parentMessageId);
    }
    showToast?.(
      subscribe
        ? loc(getLocalizedString, 'thread_subscription_subscribed_toast', SUBSCRIBED_FALLBACK)
        : loc(getLocalizedString, 'thread_subscription_unsubscribed_toast', UNSUBSCRIBED_FALLBACK),
      'default'
    );
    return subscribe;
  } catch (error) {
    CometChatLogger.error('CometChatThreadSubscription', 'toggleThreadSubscription failed', error);
    // The toast tells the user to try again, so let them: the debounce exists to
    // swallow an impatient double-tap, not a deliberate retry. `inFlight` still
    // guards against overlapping writes.
    lastToggleAt.delete(parentMessageId);
    // Revert — the server was never written, so the control must not claim otherwise.
    publish?.({
      type: 'ui:thread/subscription-changed',
      parentMessageId,
      subscribed: !subscribe,
    });
    showToast?.(loc(getLocalizedString, 'thread_subscription_failed', FAILED_FALLBACK), 'error');
    return !subscribe;
  } finally {
    inFlight.delete(parentMessageId);
  }
}

const SUBSCRIBED_FALLBACK = "Subscribed. You'll be notified about new replies in this thread.";
const UNSUBSCRIBED_FALLBACK =
  'Unsubscribed. Notifications are off until you reply or are mentioned.';
const FAILED_FALLBACK = "Couldn't update. Please try again.";

/**
 * Localized string with an English fallback.
 *
 * Localization returns the key itself when there is no translation, which would
 * otherwise surface a raw key in a toast.
 */
function loc(
  getLocalizedString: ((key: string) => string) | undefined,
  key: string,
  fallback: string
): string {
  const text = getLocalizedString?.(key);
  return text && text !== key ? text : fallback;
}

/** Clears the in-flight and debounce state. Tests only. */
export function resetThreadSubscriptionGuards(): void {
  inFlight.clear();
  lastToggleAt.clear();
}
