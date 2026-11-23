/**
 * The one send helper for every own send on the offline (ON) path: composer
 * text, media, voice notes, stickers, the staged attachment batch, and the
 * `CometChatUIKit.send*` statics.
 *
 * It sends with the SDK's three-phase `MessageSentListener` (the form the SDK
 * queues offline) and reports each transition to the {@link OfflineHub}, which
 * draws the row and emits the public events exactly once. Callers read the gate
 * themselves when the user taps send and call this only when it said "on";
 * with offline off they keep today's Promise-form path untouched.
 *
 * UI state never waits on the SDK's Promise: offline it rejects for a queued
 * send, and a send destroyed by logout may never settle (SDK ask A3).
 *
 * @internal
 */
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatLogger } from '../CometChatLogger';
import { isSdkConnected, makeSdkListener, offlineSdk } from './gate';
import {
  failureReasonOf,
  localIdOf,
  muidOf,
  OfflineFailureReason,
  OfflineMessageStatus,
  serverIdOf,
  statusOf,
} from './identity';
import { conversationIdOf, OfflineHub } from './hub';
import { isNotConnectedError } from './reconcile';

export type OfflineSendKind = 'text' | 'media' | 'custom' | 'interactive';

/** How the send stands once the SDK has answered the first time. */
export interface OfflineSendResult {
  /** `sending` = accepted and queued: the row keeps the clock; not a failure. */
  state: 'sent' | 'sending' | 'failed';
  message: CometChat.BaseMessage;
  error?: unknown;
  reason?: string;
  /** Failed without entering the outbox; Retry is a fresh send. */
  direct?: boolean;
  /** Let go because the session ended or the SDK removed it: not a failure to show. */
  discarded?: boolean;
}

/** Which SDK send a message goes through. */
export function sendKindOf(message: CometChat.BaseMessage): OfflineSendKind {
  const category = message.getCategory() as string;
  if (category === 'custom') return 'custom';
  if (category === 'interactive') return 'interactive';
  return message.getType() === 'text' ? 'text' : 'media';
}

const KNOWN_REASONS: readonly string[] = Object.values(OfflineFailureReason);

/**
 * SDK error codes that stand for a `MessageFailureReason`. A full queue is
 * refused with Android's code `ERROR_PENDING_QUEUE_LIMIT` only by a JS SDK with
 * chat-sdk-javascript #653 (not released yet); the published 4.3.0 answers
 * with the reason `QUEUE_FULL` as the code, which `KNOWN_REASONS` matches.
 */
const REASON_BY_ERROR_CODE: Readonly<Record<string, string>> = Object.freeze({
  ERROR_PENDING_QUEUE_LIMIT: OfflineFailureReason.queueFull,
});

/** The `MessageFailureReason` carried by a per-send `onError`, if any. */
export function failureReasonFromError(error: unknown, reasonArg?: unknown): string {
  const fields =
    error && typeof error === 'object'
      ? (error as {
          reason?: unknown;
          code?: unknown;
          details?: { reason?: unknown };
        })
      : {};
  const candidates = [reasonArg, fields.reason, fields.code, fields.details?.reason];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && KNOWN_REASONS.includes(candidate)) return candidate;
  }
  const byCode = typeof fields.code === 'string' ? REASON_BY_ERROR_CODE[fields.code] : undefined;
  return byCode ?? '';
}

function isRefusal(reason: string): boolean {
  return reason === OfflineFailureReason.queueFull || reason === OfflineFailureReason.byteOverflow;
}

function sdkSend(kind: OfflineSendKind, message: CometChat.BaseMessage, listener: object): unknown {
  const sdk = offlineSdk();
  switch (kind) {
    case 'media':
      return sdk.sendMediaMessage(message, listener);
    case 'custom':
      return sdk.sendCustomMessage(message, listener);
    case 'interactive':
      return typeof sdk.sendInteractiveMessage === 'function'
        ? sdk.sendInteractiveMessage(message, listener)
        : sdk.sendMessage(message, listener);
    default:
      return sdk.sendMessage(message, listener);
  }
}

/**
 * How long a send the SDK accepted while connected may go unanswered before
 * the composer moves on. Later callbacks still update the row through the hub.
 */
export const QUEUED_ANSWER_WAIT_MS = 15_000;

/** The SDK's per-call code for an unsent message that was removed (and for a logout). */
export const DISCARDED_CODE = 'ERROR_OFFLINE_MESSAGE_DISCARDED';

/**
 * Hands the SDK's own Promise over: its rejection is never an error here (the
 * listener and the hub carry every outcome), except a DISCARDED one, which the
 * listener never hears of, so `onDiscarded` lets the caller go.
 */
function watch(result: unknown, onDiscarded: () => void): void {
  if (result && typeof (result as Promise<unknown>).then === 'function') {
    (result as Promise<unknown>).then(undefined, (error: unknown) => {
      if ((error as { code?: unknown } | null)?.code === DISCARDED_CODE) onDiscarded();
    });
  }
}

/**
 * Send `message` on the offline path. Resolves once the SDK has answered the
 * first time (sent, queued, or failed); never rejects. Later transitions of a
 * queued send arrive through the hub's outbox bridge.
 *
 * `announced`: the caller already published `inprogress` for this message.
 * `onPending`: the SDK has taken it. It is the outbox's now, so a caller holding
 * its next send until this one is answered can let go.
 */
export function sendWithState(
  message: CometChat.BaseMessage,
  kind: OfflineSendKind,
  options: { announced?: boolean; onPending?: () => void } = {}
): Promise<OfflineSendResult> {
  const hub = OfflineHub.getInstance();
  const announced = options.announced ?? true;
  return new Promise<OfflineSendResult>(resolve => {
    // Held in an object: the SDK's callbacks set it, the catch below reads it.
    const phase: { pending: CometChat.BaseMessage | null } = { pending: null };
    let settled = false;
    let waitTimer: ReturnType<typeof setTimeout> | null = null;
    let stopSession: () => void = () => undefined;
    const settle = (result: OfflineSendResult) => {
      if (settled) return;
      settled = true;
      if (waitTimer !== null) clearTimeout(waitTimer);
      stopSession();
      resolve(result);
    };
    // A logout, or a removal the listener is never told about: the caller is let go
    // quietly (not a failure, nothing to show), as Android does. The row's fate
    // is the hub's.
    const settleQuietly = () => {
      settle({
        state: 'sending',
        message: phase.pending ?? message,
        discarded: true,
      });
    };
    stopSession = hub.sessionEnd.subscribe(settleQuietly);
    const failDirect = (failed: CometChat.BaseMessage, error: unknown, reason: string) => {
      hub.reportSendState(failed, 'failed', { reason, direct: true });
      hub.raiseRefusalNotice(failed, reason);
      settle({ state: 'failed', message: failed, error, reason, direct: true });
    };

    const listener = makeSdkListener('MessageSentListener', {
      onMessagePending: (pending: CometChat.BaseMessage | undefined) => {
        phase.pending = pending ?? message;
        hub.reportSendState(phase.pending, 'sending', { announced });
        options.onPending?.();
        // A send waiting behind an unsent message of its chat gets no further
        // callback until it is sent or fails (SDK R77), so the caller (the
        // composer holds its send lock on this Promise) must not wait for one.
        // Offline it settles at once — after a microtask, so an onError the SDK
        // fires in the same turn (a refusal, the not-connected notice) still
        // decides the result. Online the chat drains and answers; the bound
        // keeps the caller from ever waiting on a send for good.
        const queued: OfflineSendResult = {
          state: 'sending',
          message: phase.pending,
        };
        if (!isSdkConnected()) {
          void Promise.resolve().then(() => {
            settle(queued);
          });
        } else {
          waitTimer ??= setTimeout(() => {
            settle(queued);
          }, QUEUED_ANSWER_WAIT_MS);
        }
      },
      onMessageSent: (sent: CometChat.BaseMessage | undefined) => {
        const confirmed = sent ?? phase.pending ?? message;
        hub.reportSendState(confirmed, 'sent');
        settle({ state: 'sent', message: confirmed });
      },
      onError: (error: unknown, reasonArg?: unknown) => {
        const reason = failureReasonFromError(error, reasonArg);
        const pendingMessage = phase.pending;
        if (!pendingMessage) {
          // No pending came first: the SDK never queued it (BEH-SEND-33).
          failDirect(message, error, reason);
          return;
        }
        if (isRefusal(reason)) {
          // iOS fires pending before refusing a full queue (A7); treat it the same everywhere.
          failDirect(pendingMessage, error, reason);
          return;
        }
        if (statusOf(pendingMessage) === OfflineMessageStatus.failed) {
          // A server-refused queued send: from 4.3.1 the per-send `onError` carries
          // the server's own error, not a coded `MessageFailureReason`, so
          // `failureReasonFromError` answers ''. The SDK stamps the reason on the
          // row before calling back, and the global `onOutboxMessageFailed(row,
          // reason)` that follows is dropped as not a forward transition, so
          // without this fallback the row's `failed` transition — and the public
          // `ui:message/send-state-changed` for it — carries no reason at all.
          const failedReason = reason || failureReasonOf(pendingMessage);
          if (isRefusal(failedReason)) {
            failDirect(pendingMessage, error, failedReason);
            return;
          }
          hub.reportSendState(pendingMessage, 'failed', { reason: failedReason });
          settle({ state: 'failed', message: pendingMessage, error, reason: failedReason });
          return;
        }
        // Queued, not failed (BEH-SEND-10): the row keeps the clock and the
        // outbox reports the final state.
        settle({ state: 'sending', message: pendingMessage, error, reason });
      },
    });

    try {
      // The SDK settles its Promise as well; offline it rejects for a queued send.
      watch(sdkSend(kind, message, listener), settleQuietly);
    } catch (error) {
      CometChatLogger.error('OfflineSend', 'SDK send threw:', error);
      if (!phase.pending) failDirect(message, error, failureReasonFromError(error));
    }
  });
}

const SESSION_ENDED = 'The session ended before the message was sent.';
const CACHE_RESET = 'The offline cache was reset before the message was sent.';
const REMOVED = 'The message was removed before it was sent.';

/**
 * Thrown by {@link sendWithStatePromise} on a final failure. The row it is
 * about rides as `sentMessage`: assigning it over `message` replaced
 * `Error.message` with an object, so `String(error)` read
 * `Error: [object Object]` and an integrator logging `error.message` got that
 * instead of text (OpenCode review of #2460, send.ts:243).
 */
function sendFailure(reason: string | undefined, message: CometChat.BaseMessage): Error {
  return Object.assign(new Error(reason ?? 'Message send failed'), {
    code: reason,
    sentMessage: message,
  });
}

/**
 * The Promise contract of the public `CometChatUIKit.send*` statics on the ON
 * path, as on Android: resolves when the message is sent, rejects on a final
 * failure or a direct error, and never rejects because it was merely queued
 * while the session is alive. Every removal rejects it once with
 * `ERROR_OFFLINE_MESSAGE_DISCARDED` ({@link isQuietRejection}: the kit shows
 * nothing for it): a logout or user switch, a cache reset that loses the
 * outbox, the user's Delete of the unsent row, and an outbox `DISCARDED` or
 * `QUEUE_OVERFLOW`. The reason behind a removal is never the rejection's
 * `code`.
 */
/** A rejection the kit must never surface as an error: the session ended or the message was removed. */
export function isQuietRejection(error: unknown): boolean {
  return offlineErrorCodeOf(error) === DISCARDED_CODE;
}

/** As {@link sendFailure}: `message` is the sentence, `sentMessage` the row. */
function discardedError(message: CometChat.BaseMessage, why: string): Error {
  return Object.assign(new Error(why), { code: DISCARDED_CODE, sentMessage: message });
}

export function sendWithStatePromise(
  message: CometChat.BaseMessage,
  kind: OfflineSendKind
): Promise<CometChat.BaseMessage> {
  return sendWithState(message, kind).then(result => {
    if (result.state === 'sent') return result.message;
    if (result.discarded) {
      // The session ended, or the SDK removed it, before its first answer.
      return Promise.reject(discardedError(result.message, SESSION_ENDED));
    }
    if (result.state === 'failed') {
      // Rejects with the SDK's own error object, as the offline-off path does.
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw result.error ?? sendFailure(result.reason, result.message);
    }
    const localMessageId = localIdOf(result.message);
    const hub = OfflineHub.getInstance();
    // The outcome may already have come through the outbox while the first
    // answer was settling: answer from it rather than wait for a second one.
    if (localMessageId) {
      const already = hub.stateOf(localMessageId);
      if (already === 'sent') return hub.sentCopyOf(localMessageId) ?? result.message;
      // A removal (the user's Delete, an outbox DISCARDED or QUEUE_OVERFLOW) is not
      // a send failure: it rejects with the documented ERROR_OFFLINE_MESSAGE_DISCARDED,
      // which isQuietRejection matches, so nothing is shown for it.
      if (already === 'discarded') {
        return Promise.reject(discardedError(result.message, REMOVED));
      }
      if (already === 'failed') {
        return Promise.reject(
          sendFailure(hub.failureReasonFor(localMessageId) || undefined, result.message)
        );
      }
    }
    return new Promise<CometChat.BaseMessage>((resolve, reject) => {
      // A send with no local id has no outbox row to follow: only the session
      // end and a cache reset can answer it.
      const stopState = localMessageId
        ? hub.sendState.subscribe(event => {
            if (event.localMessageId !== localMessageId || event.state === 'sending') return;
            stop();
            if (event.state === 'sent') resolve(event.message);
            // As above: a removal rejects with ERROR_OFFLINE_MESSAGE_DISCARDED, not
            // with the hub's reason ('DISCARDED' / 'QUEUE_OVERFLOW') as its code.
            else if (event.state === 'discarded') {
              reject(discardedError(event.message, REMOVED));
            } else reject(sendFailure(event.reason, event.message));
          })
        : () => undefined;
      // The session ended first: rejected once, quietly, as on Android.
      const stopSession = hub.sessionEnd.subscribe(() => {
        stop();
        reject(discardedError(result.message, SESSION_ENDED));
      });
      // A cache reset that lost the outbox (any count but a known 0) took this
      // message with it: the caller is told it will never be sent.
      const stopReset = hub.cacheReset.subscribe(event => {
        if (event.pendingMessagesLost === 0) return;
        stop();
        reject(discardedError(result.message, CACHE_RESET));
      });
      function stop(): void {
        stopState();
        stopSession();
        stopReset();
      }
    });
  });
}

/** The SDK's error code on a rejected offline operation, or `''`. */
export function offlineErrorCodeOf(error: unknown): string {
  if (!error || typeof error !== 'object') return '';
  const { code } = error as { code?: unknown };
  return typeof code === 'string' ? code : '';
}

/** Rejection codes of `retryMessage` / `discardLocalMessage` (R160, BEH-SEND-36). */
export const OfflineOperationError = Object.freeze({
  inFlight: 'ERROR_OFFLINE_MESSAGE_IN_FLIGHT',
  notFound: 'ERROR_OFFLINE_MESSAGE_NOT_FOUND',
  disabled: 'ERROR_OFFLINE_DISABLED',
});

/**
 * The SDK answered `ERROR_OFFLINE_MESSAGE_IN_FLIGHT` to a Retry or Delete: the
 * message's send is under way and nothing changed (BEH-SEND-20/36). The user
 * gets the short "Sending… try again in a moment" notice (R162 / S73).
 */
function noticeSendInFlight(message: CometChat.BaseMessage): void {
  OfflineHub.getInstance().raiseNotice({
    kind: 'send_in_flight',
    message,
    conversationId: conversationIdOf(message),
  });
}

/**
 * A copy of `message` that behaves like it: the same prototype, the same own
 * properties and accessors, so every SDK getter on it still answers.
 *
 * Deliberately shallow, and deliberately local to this module:
 * `CometChatUIKitUtility.clone` would pull `CometChatUIKitConstants` into the
 * offline send path, whose static initializer reads SDK enums that are absent
 * from some SDK mocks. Nothing below is mutated through the copy, so the nested
 * objects (sender, receiver, attachments) stay shared by reference as the SDK
 * expects, and `data` is replaced with a new object rather than edited.
 */
function cloneMessage(message: CometChat.BaseMessage): CometChat.BaseMessage {
  const copy = Object.create(
    Object.getPrototypeOf(message) as object,
    Object.getOwnPropertyDescriptors(message)
  ) as CometChat.BaseMessage;
  return copy;
}

/**
 * A copy of `message` for a fresh send: the old local handle is dropped (the
 * SDK mints a new one when offline is on; with offline off the request body
 * must carry none, BEH-SEND-34). The muid stays, so the row keeps its key.
 *
 * It really is a copy. The message handed in is the object the row holds in
 * list state, and changing it in place would change the rendered row before any
 * state was dispatched: memoized bubbles would not re-render, and identity
 * lookups (`findRowIndex`, `hub.stateOf`) would see a row whose local id just
 * vanished — so a fresh send that fails before `onMessagePending` would be
 * reported with `localMessageId: ''` and only the muid left to tie it back.
 */
function withoutLocalHandle(message: CometChat.BaseMessage): CometChat.BaseMessage {
  const copy = cloneMessage(message);
  const target = copy as unknown as {
    localMessageId?: unknown;
    getData?: () => unknown;
    setData?: (data: unknown) => void;
    data?: unknown;
  };
  try {
    if (target.localMessageId !== undefined) delete target.localMessageId;
    const data = typeof target.getData === 'function' ? target.getData() : target.data;
    if (data && typeof data === 'object' && 'localMessageId' in data) {
      const rest = { ...(data as Record<string, unknown>) };
      delete rest.localMessageId;
      if (typeof target.setData === 'function') target.setData(rest);
      else target.data = rest;
    }
  } catch {
    /* the fresh send still goes; the SDK replaces a stale handle when offline is on */
  }
  return copy;
}

/**
 * A fresh send of a failed (direct) row: through the one send helper, a new
 * local handle. `onPending`: the SDK has taken it.
 */
async function resendFresh(
  message: CometChat.BaseMessage,
  onPending?: () => void
): Promise<void> {
  const hub = OfflineHub.getInstance();
  hub.clearDirectFailed(message);
  await sendWithState(withoutLocalHandle(message), sendKindOf(message), {
    announced: false,
    onPending,
  });
}

/**
 * Retry an unsent own message on the user's tap (never by itself, UIK-SEND-07).
 * An outbox row (PENDING, SENDING, or FAILED with any reason: R162) is retried
 * by the SDK (`retryMessage`); one whose send is under way is answered
 * `ERROR_OFFLINE_MESSAGE_IN_FLIGHT`, and the "Sending…" notice is raised. A
 * failed (direct) row, which the outbox does not hold, is sent again as a
 * fresh send. Resolves once the retry was handed over; outcomes arrive through
 * the hub (the SDK's global outbox listener reports every transition).
 * `onHandedOver`: a fresh send was taken by the SDK (it may settle much later).
 */
export async function retryFailedMessage(
  message: CometChat.BaseMessage,
  onHandedOver?: () => void
): Promise<void> {
  const hub = OfflineHub.getInstance();
  const sdk = offlineSdk();
  const localMessageId = localIdOf(message);
  // Only a failure the outbox does not hold is re-sent fresh; an outbox row is
  // retried by the SDK (re-sending it would queue a duplicate).
  if (hub.directFailureOf(message) !== undefined || !localMessageId) {
    await resendFresh(message, onHandedOver);
    return;
  }
  if (typeof sdk.retryMessage !== 'function') return;
  // The reason the row failed with, to put it back if the retry is refused.
  const priorReason = hub.failureReasonFor(localMessageId) || failureReasonOf(message);
  // A FAILED row goes back to PENDING at once, online or off, with no callback
  // to say so; the kit draws it, and any final outcome arrives as usual.
  hub.reportSendState(message, 'sending', { announced: false });
  try {
    await sdk.retryMessage(
      localMessageId,
      makeSdkListener('MessageSentListener', {
        onMessagePending: (pending: CometChat.BaseMessage | undefined) => {
          hub.reportSendState(pending ?? message, 'sending');
        },
        onMessageSent: (sent: CometChat.BaseMessage | undefined) => {
          hub.reportSendState(sent ?? message, 'sent');
        },
        onError: () => {
          /* reported below (refusals) or by the outbox listener (final failures) */
        },
      })
    );
  } catch (error) {
    const code = offlineErrorCodeOf(error);
    if (code === OfflineOperationError.inFlight) {
      noticeSendInFlight(message);
      return;
    }
    if (code === OfflineOperationError.disabled) {
      // The kill switch dropped the outbox (BEH-AUTH-04/10): the row is failed
      // (direct) now, and this tap is its fresh send.
      hub.reportSendState(message, 'failed', { direct: true });
      await resendFresh(message, onHandedOver);
      return;
    }
    // Offline the retry's Promise rejects with the not-connected notice (the row
    // keeps the clock). NOT_FOUND: the SDK no longer holds it; a row that was
    // sent stays, any other is removed (as on Android).
    CometChatLogger.warn('OfflineSend', 'retryMessage did not complete:', error);
    if (code === OfflineOperationError.notFound) {
      sentOrRemoved(message, localMessageId);
      return;
    }
    if (isNotConnectedError(error)) return;
    // Any other refusal (store unavailable, a final failure): the row goes back
    // to failed instead of keeping the clock, unless the outbox listener already
    // reported its outcome.
    if (hub.stateOf(localMessageId) === 'sending') {
      hub.reportSendState(message, 'failed', priorReason ? { reason: priorReason } : {});
    }
  }
}

/** How a Delete of an unsent own message ended (BEH-SEND-36/37, R162). */
export type DiscardOutcome =
  /** Removed (from the device's outbox, or from the screen for a failed-direct row). */
  | 'removed'
  /** Its send already started: the row stays, and the "Sending…" notice is raised. */
  | 'in-flight'
  /** It was sent: this acked copy (with a server id) is deleted the normal way. */
  | { sent: CometChat.BaseMessage }
  /** Not removed for another reason (store busy, SDK without the API): the row stays. */
  | 'failed';

/** Remove an unsent row like a discard (which also takes back a thread reply's count). */
function removeUnsent(message: CometChat.BaseMessage): void {
  OfflineHub.getInstance().reportSendState(message, 'discarded', {
    reason: OfflineFailureReason.discarded,
  });
}

/**
 * Retry or Delete answered NOT_FOUND: the SDK no longer holds the message (it
 * was sent, or purged with its chat). A row with a server id, or one sent this
 * session, is its sent copy (returned); any other row is removed at once.
 */
function sentOrRemoved(
  message: CometChat.BaseMessage,
  localMessageId: string
): CometChat.BaseMessage | undefined {
  const sent =
    serverIdOf(message) > 0 ? message : OfflineHub.getInstance().sentCopyOf(localMessageId);
  if (!sent) removeUnsent(message);
  return sent;
}

/**
 * Delete an unsent own message (BEH-SEND-36/37). An outbox row (PENDING or
 * FAILED) goes through `discardLocalMessage`: durable, device only, works
 * offline. A failed (direct) row is not on the device, so it is removed from
 * the screen only. The SDK fires no outbox event on success, so the hub
 * reports the removal (one `discarded` transition).
 *
 * - `ERROR_OFFLINE_MESSAGE_IN_FLIGHT` → `'in-flight'`, nothing changes; the
 *   "Sending… try again in a moment" notice is raised (R162).
 * - `ERROR_OFFLINE_MESSAGE_NOT_FOUND` → the SDK no longer holds it. A row
 *   with a server id (or sent this session) is returned so the caller deletes
 *   it the normal way (offline that ends in today's not-connected error).
 *   Any other row is removed at once, online or offline, as on Android; if
 *   its sent copy still arrives later, it is deleted on the server then.
 * - `ERROR_OFFLINE_DISABLED` → the kill switch dropped the outbox: the message
 *   is not on the device any more, so the row is removed from the screen.
 */
export async function discardUnsentMessage(
  message: CometChat.BaseMessage
): Promise<DiscardOutcome> {
  const hub = OfflineHub.getInstance();
  const sdk = offlineSdk();
  const localMessageId = localIdOf(message);
  const inOutbox = !!localMessageId && hub.directFailureOf(message) === undefined;
  if (inOutbox) {
    if (typeof sdk.discardLocalMessage !== 'function') return 'failed';
    try {
      await sdk.discardLocalMessage(localMessageId);
    } catch (error) {
      const code = offlineErrorCodeOf(error);
      if (code === OfflineOperationError.inFlight) {
        noticeSendInFlight(message);
        return 'in-flight';
      }
      if (code === OfflineOperationError.notFound) {
        const sent = sentOrRemoved(message, localMessageId);
        if (sent) return { sent };
        hub.deleteWhenSent(localMessageId);
        return 'removed';
      }
      if (code !== OfflineOperationError.disabled) {
        CometChatLogger.warn('OfflineSend', 'discardLocalMessage refused:', error);
        return 'failed';
      }
    }
  }
  removeUnsent(message);
  return 'removed';
}

/**
 * Retries in flight, by muid (stable across a fresh send's new local handle),
 * else local handle, each with its release: further taps are ignored meanwhile.
 */
const retriesInFlight = new Map<string, () => void>();

/**
 * {@link retryFailedMessage}, ignoring taps while a retry of the same message
 * runs. As on Android, the guard lets go when the retry answers (a fresh send
 * once the SDK has taken it), on any final transition of the message, and when
 * the session ends or the cache is reset.
 */
export function retryFailedMessageOnce(message: CometChat.BaseMessage): void {
  const muid = muidOf(message);
  const localMessageId = localIdOf(message);
  const key = muid || localMessageId;
  if (!key || retriesInFlight.has(key)) return;
  const hub = OfflineHub.getInstance();
  // Lets go of this retry only: a late answer never frees a newer one.
  const release = (): void => {
    stopState();
    stopSession();
    if (retriesInFlight.get(key) === release) retriesInFlight.delete(key);
  };
  const stopState = hub.sendState.subscribe(event => {
    if (
      event.state !== 'sending' &&
      ((muid && muidOf(event.message) === muid) ||
        (localMessageId && event.localMessageId === localMessageId))
    )
      release();
  });
  const stopSession = hub.session.subscribe(release);
  retriesInFlight.set(key, release);
  void retryFailedMessage(message, release).finally(release);
}
