/**
 * The send state a bubble or conversation row draws for an own message on the
 * offline path: `'sending'` (clock, "Not sent yet"), `'failed'` (error mark,
 * "Not sent"), or `null` (today's receipt logic, untouched).
 *
 * Derived on every render, so an outbox failure shows after a restart too
 * (BEH-SEND-30). The session's failed-direct mark is checked first and without
 * the gate: it exists only for sends the offline path made, and it must still
 * show after offline was switched off mid-session (kill switch). The status is
 * read only while the gate says on.
 *
 * @internal
 */
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { isOfflineOn } from './gate';
import { OfflineHub } from './hub';
import { isOutboxFailed, isSending, localIdOf, serverIdOf } from './identity';

export type OfflineRowState = 'sending' | 'failed' | null;

export function offlineRowStateOf(
  message: CometChat.BaseMessage | null | undefined
): OfflineRowState {
  if (!message || serverIdOf(message) > 0) return null;
  if (OfflineHub.getInstance().directFailureOf(message) !== undefined) return 'failed';
  if (!isOfflineOn()) return null;
  if (isOutboxFailed(message)) return 'failed';
  if (isSending(message) || localIdOf(message) !== '') return 'sending';
  return null;
}

/**
 * What the options menu of an own unsent message offers (BEH-SEND-37 as
 * rewritten by ruling R162 / S73, 2026-11-03).
 */
export interface UnsentMessageActions {
  /** Retry: `retryMessage` for an outbox row, a fresh send for a failed (direct) one. */
  retry: boolean;
  /** Delete: `discardLocalMessage` for an outbox row, screen-only for a failed (direct) one. */
  discard: boolean;
}

const RETRY_AND_DISCARD: UnsentMessageActions = Object.freeze({ retry: true, discard: true });

/**
 * The actions an own message that has no server id offers, or `null` when it
 * is not an offline unsent row (offline off, someone else's message, a sent
 * message): the caller then keeps today's menu.
 *
 * R162 / S73: Retry and Delete on every own unsent or failed message —
 * `PENDING`, `SENDING`, `FAILED` with any reason, and a failed (direct) one
 * kept in memory (BEH-SEND-33, `QUEUE_FULL` / `BYTE_OVERFLOW`, kill switch).
 * On a message whose send is under way the SDK answers
 * `ERROR_OFFLINE_MESSAGE_IN_FLIGHT` and changes nothing; the kit then shows
 * the "Sending… try again in a moment" notice (see `send.ts`).
 */
export function unsentActionsOf(
  message: CometChat.BaseMessage | null | undefined
): UnsentMessageActions | null {
  return offlineRowStateOf(message) === null ? null : RETRY_AND_DISCARD;
}
