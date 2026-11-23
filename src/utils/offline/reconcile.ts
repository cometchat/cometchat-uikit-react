/**
 * Pure list operations for the offline (ON) path: sorted upsert by identity,
 * the windowed reconcile of a server page against its cached page, and the
 * held-receipt map. Nothing here runs with offline off.
 *
 * Order: sent rows by `(sentAt, id)`; rows without a server id last, by
 * compose time (BEH-READ-10). A row without a server id is never removed by a
 * read (BEH-READ-30).
 *
 * @internal
 */
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  localIdForServer,
  localIdOf,
  muidOf,
  rowKey,
  serverIdForLocal,
  serverIdOf,
} from './identity';

/** The not-connected terminal of an offline read or receipt. */
export function isNotConnectedError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const { code, name } = error as { code?: unknown; name?: unknown };
  const value = code ?? name;
  return (
    value === 'FAILED_TO_FETCH' ||
    value === 'ERROR_INTERNET_UNAVAILABLE' ||
    value === 'NO_WEBSOCKET_CONNECTION' ||
    value === 'NOT_CONNECTED'
  );
}

function numberFrom(message: CometChat.BaseMessage, getter: 'getSentAt' | 'getUpdatedAt'): number {
  try {
    const fn = (message as unknown as Record<string, unknown>)[getter];
    const value = typeof fn === 'function' ? Number((fn as () => unknown).call(message)) : 0;
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

/** Sort comparator: sent rows by (sentAt, id), then unsent rows by compose time. */
export function compareRows(a: CometChat.BaseMessage, b: CometChat.BaseMessage): number {
  const aId = serverIdOf(a);
  const bId = serverIdOf(b);
  if (aId > 0 !== bId > 0) return aId > 0 ? -1 : 1;
  const bySentAt = numberFrom(a, 'getSentAt') - numberFrom(b, 'getSentAt');
  if (bySentAt !== 0) return bySentAt;
  return aId - bId;
}

/**
 * Index of the row that is the same message as `message`: server id first,
 * then the local handle, then the muid.
 */
export function findRowIndex(
  rows: readonly CometChat.BaseMessage[],
  message: CometChat.BaseMessage
): number {
  const id = serverIdOf(message);
  const local = localIdOf(message);
  // The alias map fills the identity a late copy lacks: an acked id for a
  // local handle, or the local handle of an acked id (README §3.2).
  const knownId = id > 0 ? id : serverIdForLocal(local);
  if (knownId > 0) {
    const byId = rows.findIndex(row => serverIdOf(row) === knownId);
    if (byId !== -1) return byId;
  }
  const knownLocal = local || localIdForServer(id);
  if (knownLocal) {
    const byLocal = rows.findIndex(row => localIdOf(row) === knownLocal);
    if (byLocal !== -1) return byLocal;
  }
  const muid = muidOf(message);
  if (muid) {
    const byMuid = rows.findIndex(
      row => muidOf(row) === muid && (serverIdOf(row) === 0 || id === 0 || serverIdOf(row) === id)
    );
    if (byMuid !== -1) return byMuid;
  }
  return -1;
}

/** Index at which `message` belongs in the sorted `rows`. */
function sortedIndex(
  rows: readonly CometChat.BaseMessage[],
  message: CometChat.BaseMessage
): number {
  let low = 0;
  let high = rows.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    const row = rows[mid];
    if (row && compareRows(row, message) <= 0) low = mid + 1;
    else high = mid;
  }
  return low;
}

export interface UpsertResult {
  rows: CometChat.BaseMessage[];
  changed: boolean;
}

/**
 * Upsert `incoming` into `rows` by identity, each into its sorted place. For
 * the same server id the copy with the newer `updatedAt` wins, so a read never
 * reverts a live edit. Returns a new array; untouched rows keep their objects.
 */
export function upsertSorted(
  rows: readonly CometChat.BaseMessage[],
  incoming: readonly CometChat.BaseMessage[]
): UpsertResult {
  const next = rows.slice();
  let changed = false;
  for (const message of incoming) {
    const index = findRowIndex(next, message);
    if (index !== -1) {
      const existing = next[index];
      if (!existing || existing === message) continue;
      // An acked row is never replaced by an older, un-acked copy of itself.
      if (serverIdOf(existing) > 0 && serverIdOf(message) === 0) continue;
      const sameServerRow =
        serverIdOf(existing) > 0 && serverIdOf(existing) === serverIdOf(message);
      if (
        sameServerRow &&
        numberFrom(existing, 'getUpdatedAt') > numberFrom(message, 'getUpdatedAt')
      ) {
        continue;
      }
      next.splice(index, 1);
      next.splice(sortedIndex(next, message), 0, message);
      changed = true;
      continue;
    }
    next.splice(sortedIndex(next, message), 0, message);
    changed = true;
  }
  return { rows: changed ? next : (rows as CometChat.BaseMessage[]), changed };
}

/** Server-id keys of the rows a cached page showed. */
export function cachedKeysOf(messages: readonly CometChat.BaseMessage[]): Set<string> {
  const keys = new Set<string>();
  for (const message of messages) {
    if (serverIdOf(message) > 0) keys.add(rowKey(message));
  }
  return keys;
}

/**
 * Apply a server page: upsert it, then remove rows its cached page showed that
 * the page no longer shows, but only inside the id range the server answered
 * for (a proven omission). `rawPage` is the page before any client filter: its
 * range is what the server answered for, however few rows the filter kept. Rows
 * without a server id are never removed.
 */
export function reconcileServerPage(
  rows: readonly CometChat.BaseMessage[],
  cachedKeys: ReadonlySet<string>,
  serverPage: readonly CometChat.BaseMessage[],
  rawPage: readonly CometChat.BaseMessage[] = serverPage
): UpsertResult {
  const upserted = upsertSorted(rows, serverPage);
  const serverIds = rawPage.map(serverIdOf).filter(id => id > 0);
  if (serverIds.length === 0 || cachedKeys.size === 0) return upserted;
  const minId = Math.min(...serverIds);
  const maxId = Math.max(...serverIds);
  const serverKeys = new Set(serverPage.map(rowKey));
  const kept = upserted.rows.filter(row => {
    const id = serverIdOf(row);
    if (id === 0) return true;
    const key = rowKey(row);
    if (!cachedKeys.has(key) || serverKeys.has(key)) return true;
    return id < minId || id > maxId;
  });
  if (kept.length === upserted.rows.length) return upserted;
  return { rows: kept, changed: true };
}

/**
 * D13-R2: a cached page is kept only when it joins the server page that
 * answered the same read (the two share a row; filtered-out rows count). One
 * that does not join is stale: more arrived than one page holds. The rows it
 * painted beyond the server page's far end (older for `previous`, newer for
 * `next`) are dropped, not stitched to it over a hidden gap; the next page
 * reads them again from the server page's edge. Rows already listed before the
 * cached page, and rows without a server id, are never removed.
 */
export function dropUnjoinedCachedPage(
  rows: CometChat.BaseMessage[],
  paintedKeys: readonly string[],
  rawCachedKeys: readonly string[],
  rawPage: readonly CometChat.BaseMessage[],
  direction: 'previous' | 'next'
): CometChat.BaseMessage[] {
  const serverIds = rawPage.map(serverIdOf).filter(id => id > 0);
  const serverKeys = cachedKeysOf(rawPage);
  if (serverIds.length === 0 || rawCachedKeys.some(key => serverKeys.has(key))) return rows;
  const edge = direction === 'previous' ? Math.min(...serverIds) : Math.max(...serverIds);
  return rows.filter(row => {
    const id = serverIdOf(row);
    if (id < 1 || !paintedKeys.includes(rowKey(row))) return true;
    return direction === 'previous' ? id > edge : id < edge;
  });
}

/** Remove the row that is `message`, by identity. */
export function removeRow(
  rows: readonly CometChat.BaseMessage[],
  message: CometChat.BaseMessage
): UpsertResult {
  const index = findRowIndex(rows, message);
  if (index === -1) return { rows: rows as CometChat.BaseMessage[], changed: false };
  const next = rows.slice();
  next.splice(index, 1);
  return { rows: next, changed: true };
}

/** Newest row that has a server id: the cursor anchor (rows without one are skipped). */
export function newestServerId(rows: readonly CometChat.BaseMessage[]): number {
  for (let i = rows.length - 1; i >= 0; i--) {
    const id = serverIdOf(rows[i]);
    if (id > 0) return id;
  }
  return 0;
}

/** Oldest row that has a server id. */
export function oldestServerId(rows: readonly CometChat.BaseMessage[]): number {
  for (const row of rows) {
    const id = serverIdOf(row);
    if (id > 0) return id;
  }
  return 0;
}

const MAX_HELD_RECEIPTS = 200;

/** A receipt held until its row acquires the server id. */
export interface HeldReceipt {
  receiptType: 'delivered' | 'read';
  timestamp: number;
}

/**
 * Receipts for server ids the list does not show yet (their ack has not
 * landed) are held here and applied when a row acquires that id
 * (BEH-SEND-32). Capped at 200; cleared on a new generation and after a sync.
 */
export class HeldReceipts {
  private readonly held = new Map<number, HeldReceipt>();

  hold(messageId: number, receipt: HeldReceipt): void {
    if (!(messageId > 0)) return;
    const previous = this.held.get(messageId);
    // A read receipt implies delivered; never downgrade.
    if (previous?.receiptType === 'read' && receipt.receiptType === 'delivered') return;
    this.held.delete(messageId);
    this.held.set(messageId, receipt);
    if (this.held.size > MAX_HELD_RECEIPTS) {
      const oldest = this.held.keys().next().value;
      if (oldest !== undefined) this.held.delete(oldest);
    }
  }

  /** Remove and return the receipt held for `messageId`, if any. */
  take(messageId: number): HeldReceipt | undefined {
    const receipt = this.held.get(messageId);
    if (receipt) this.held.delete(messageId);
    return receipt;
  }

  clear(): void {
    this.held.clear();
  }

  get size(): number {
    return this.held.size;
  }
}
