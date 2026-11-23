/**
 * Row identity and send state for the offline (ON) path.
 *
 * None of these helpers changes the OFF path: it keeps today's id/muid
 * matching and render keys exactly. Every SDK accessor here is
 * feature-detected, because the kit runs against SDKs that predate the
 * offline release.
 *
 * @internal
 */
import type { CometChat } from '@cometchat/chat-sdk-javascript';

/** Message states the offline SDK reports through `getStatus()`. */
export const OfflineMessageStatus = Object.freeze({
  pending: 'PENDING',
  sending: 'SENDING',
  sent: 'SENT',
  delivered: 'DELIVERED',
  read: 'READ',
  failed: 'FAILED',
});

/** Why a send failed (`MessageFailureReason`); identical on every SDK. */
export const OfflineFailureReason = Object.freeze({
  transient: 'TRANSIENT',
  permanent: 'PERMANENT',
  queueOverflow: 'QUEUE_OVERFLOW',
  queueFull: 'QUEUE_FULL',
  byteOverflow: 'BYTE_OVERFLOW',
  discarded: 'DISCARDED',
});

const CALL_CATEGORY = 'call';

type AnyMessage = CometChat.BaseMessage | null | undefined;

function callIfFunction(target: unknown, name: string): unknown {
  if (!target || typeof target !== 'object') return undefined;
  try {
    const fn = (target as Record<string, unknown>)[name];
    return typeof fn === 'function' ? (fn as () => unknown).call(target) : undefined;
  } catch {
    return undefined;
  }
}

/** The message's server id as a number; `0` until the server has acked it. */
export function serverIdOf(message: AnyMessage): number {
  if (!message) return 0;
  const raw = callIfFunction(message, 'getId');
  const id = typeof raw === 'string' ? parseInt(raw, 10) : Number(raw);
  return Number.isFinite(id) && id > 0 ? id : 0;
}

/**
 * The SDK's local handle for an own message. The JS SDK parses
 * `localMessageId` only on messages it created; a server-parsed copy carries
 * it in `data.localMessageId` (SDK ask A4), so fall back to that.
 */
export function localIdOf(message: AnyMessage): string {
  if (!message) return '';
  const local = callIfFunction(message, 'getLocalMessageId');
  if (typeof local === 'string' && local) return local;
  const data =
    callIfFunction(message, 'getData') ?? (message as unknown as { data?: unknown }).data;
  const fromData =
    data && typeof data === 'object'
      ? (data as { localMessageId?: unknown }).localMessageId
      : undefined;
  return typeof fromData === 'string' && fromData ? fromData : '';
}

export function muidOf(message: AnyMessage): string {
  const muid = callIfFunction(message, 'getMuid');
  return typeof muid === 'string' ? muid : '';
}

/**
 * The offline send state of a message, or `''` when it has none.
 *
 * `getStatus()` is `@private` in the 4.3 typings and `CometChat.Call` uses it
 * for the call status, so it is read feature-detected and never for a call
 * (SDK ask A11).
 */
export function statusOf(message: AnyMessage): string {
  if (!message) return '';
  if (callIfFunction(message, 'getCategory') === CALL_CATEGORY) return '';
  const status = callIfFunction(message, 'getStatus');
  return typeof status === 'string' ? status : '';
}

/** The `MessageFailureReason` stamped on a FAILED message, or `''`. */
export function failureReasonOf(message: AnyMessage): string {
  const reason = callIfFunction(message, 'getFailureReason');
  return typeof reason === 'string' ? reason : '';
}

/** Whether the SDK's catch-up sweep delivered the message (`source === 'SYNC'`). */
export function isSyncDelivered(message: AnyMessage): boolean {
  return callIfFunction(message, 'getSource') === 'SYNC';
}

/** PENDING or SENDING: on its way, shown with the clock. */
export function isSending(message: AnyMessage): boolean {
  const status = statusOf(message);
  return status === OfflineMessageStatus.pending || status === OfflineMessageStatus.sending;
}

/** FAILED in the outbox (derived from `status`, so it survives a restart). */
export function isOutboxFailed(message: AnyMessage): boolean {
  return statusOf(message) === OfflineMessageStatus.failed;
}

/**
 * Not acked by the server yet: PENDING, SENDING or FAILED, or a local handle
 * and no server id. Used only on the ON path.
 */
export function isUnsent(message: AnyMessage): boolean {
  if (!message) return false;
  if (isSending(message) || isOutboxFailed(message)) return true;
  return serverIdOf(message) === 0 && localIdOf(message) !== '';
}

/**
 * The list key on the ON path: the server id once there is one, then the
 * local handle, then the own muid.
 */
export function rowKey(message: CometChat.BaseMessage): string {
  const id = serverIdOf(message);
  if (id > 0) return `s:${String(id)}`;
  const local = localIdOf(message);
  if (local) return `l:${local}`;
  return `m:${muidOf(message)}`;
}

/**
 * The React key on the ON path. An own message keeps one key from compose to
 * ack, so its bubble never remounts when the SDK stamps its local handle or
 * the server id arrives: the muid the kit set at compose (the SDK never
 * touches it and the server echoes it), else the local handle. Other senders'
 * messages are keyed by server id only (their muids can collide).
 */
export function renderKey(message: CometChat.BaseMessage, loggedInUid: string): string {
  const senderUid = callIfFunction(callIfFunction(message, 'getSender'), 'getUid');
  if (senderUid === loggedInUid) {
    const muid = muidOf(message);
    if (muid) return `m:${muid}`;
    const local = localIdOf(message);
    if (local) return `l:${local}`;
  }
  const id = serverIdOf(message);
  if (id > 0) return `s:${String(id)}`;
  // A row the kit renders under a negative id of its own — the AI streaming
  // placeholder (`createStreamingMessage`) — is keyed by that id, as it is with
  // offline off. `serverIdOf` answers 0 for it, and its muid need not be stable
  // (Prajwal CometChatMessageListView.tsx:229).
  const raw = Number(callIfFunction(message, 'getId'));
  if (Number.isFinite(raw) && raw < 0) return `s:${String(raw)}`;
  return `s:${muidOf(message)}`;
}

// --- Alias map (README §3.2): localMessageId <-> server id, filled on ack ---

const MAX_ALIASES = 500;
const serverIdByLocal = new Map<string, number>();
const localIdByServer = new Map<number, string>();

/** Remember that the own message `localMessageId` was acked as `serverId`. */
export function recordAlias(localMessageId: string, serverId: number): void {
  if (!localMessageId || serverId <= 0) return;
  serverIdByLocal.delete(localMessageId);
  serverIdByLocal.set(localMessageId, serverId);
  localIdByServer.set(serverId, localMessageId);
  if (serverIdByLocal.size > MAX_ALIASES) {
    const [oldestLocal, oldestId] = serverIdByLocal.entries().next().value ?? ['', 0];
    serverIdByLocal.delete(oldestLocal);
    localIdByServer.delete(oldestId);
  }
}

/** The server id an own message's local handle was acked as, or `0`. */
export function serverIdForLocal(localMessageId: string): number {
  return localMessageId ? (serverIdByLocal.get(localMessageId) ?? 0) : 0;
}

/** The local handle of the own message acked as `serverId`, or `''`. */
export function localIdForServer(serverId: number): string {
  return serverId > 0 ? (localIdByServer.get(serverId) ?? '') : '';
}

/** Forget every alias (logout, user switch, cache reset). */
export function clearAliases(): void {
  serverIdByLocal.clear();
  localIdByServer.clear();
}
