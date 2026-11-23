/**
 * The conversation list's offline (ON) path: the server page of a two-phase
 * read over its cached page, and the reconcile of the SDK's catch-up sync page
 * instead of a refetch on reconnect (README §3.7, UIK-SYNC-04). Pure; nothing
 * here runs with offline off.
 *
 * @internal
 */
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { isUnsent } from '../../utils/offline/identity';
import { compareRows, findRowIndex } from '../../utils/offline/reconcile';
import { OfflineHub } from '../../utils/offline/hub';
import { peerIdOf } from './CometChatConversations.utils';

function idOf(conversation: CometChat.Conversation): string {
  return conversation.getConversationId();
}

/** Keep the first copy of each conversation id. */
export function dedupeConversations(list: CometChat.Conversation[]): CometChat.Conversation[] {
  const seen = new Set<string>();
  return list.filter(c => {
    const id = idOf(c);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

/** A row whose preview is an own message the server has not acked: never dropped by a read (BEH-CONV-06). */
export function hasUnsentPreview(conversation: CometChat.Conversation): boolean {
  const last = conversation.getLastMessage() as CometChat.BaseMessage | undefined;
  return !!last && isUnsent(last);
}

/**
 * When the row last changed, or `0` when unknown. SDK 4.3's `Conversation` has
 * no `getUpdatedAt()`, so it is called only when present and the preview's
 * `sentAt` is the fallback; a row with neither (no last message) is unknown.
 */
function updatedAtOf(conversation: CometChat.Conversation): number {
  const raw = (conversation as unknown as { getUpdatedAt?: () => unknown }).getUpdatedAt?.();
  const fromLast = (
    conversation.getLastMessage() as CometChat.BaseMessage | undefined
  )?.getSentAt();
  const value = Number(raw ?? fromLast);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

/**
 * The server page of the first page over its cached page: the page's rows
 * replace the cached ones; a row the page no longer has is dropped, except one
 * whose preview is an own unsent message.
 */
export function applyFirstServerPage(
  current: CometChat.Conversation[],
  page: CometChat.Conversation[]
): CometChat.Conversation[] {
  const pageIds = new Set(page.map(idOf));
  const keptUnsent = current.filter(c => !pageIds.has(idOf(c)) && hasUnsentPreview(c));
  return dedupeConversations([...keptUnsent, ...page]);
}

/**
 * Whether a conversation request asks the server for something other than the
 * plain list: a type other than both, tags, a search keyword, unread only,
 * `pinnedBy`, or hide/only agentic. A builder that only sets a limit (or other
 * non-narrowing options) is a plain list. Feature-checked: a getter the SDK
 * build lacks counts as not asking.
 */
export function requestNarrows(request: CometChat.ConversationsRequest | null | undefined): boolean {
  if (!request) return false;
  const asks = request as unknown as Record<string, (() => unknown) | undefined>;
  const text = (name: string) => {
    const value = asks[name]?.();
    return typeof value === 'string' ? value : '';
  };
  const some = (name: string) => {
    const value = asks[name]?.();
    return Array.isArray(value) && value.length > 0;
  };
  const type = text('getConversationType').toLowerCase();
  return (
    (type !== '' && type !== 'both') ||
    some('getTags') ||
    some('getUserTags') ||
    some('getGroupTags') ||
    text('getSearchKeyword') !== '' ||
    asks.getUnread?.() === true ||
    some('getPinnedBy') ||
    asks.getHideAgentic?.() === true ||
    asks.getOnlyAgentic?.() === true
  );
}

/** Oldest-to-newest order of two rows by (when it last changed, id). */
function compareByRange(a: CometChat.Conversation, b: CometChat.Conversation): number {
  const byTime = updatedAtOf(a) - updatedAtOf(b);
  if (byTime !== 0) return byTime;
  const x = idOf(a);
  const y = idOf(b);
  return x < y ? -1 : x > y ? 1 : 0;
}

/**
 * The server page of a narrowed list's re-read (the kit's own resync after a
 * sync page), merged into the rows shown: the page's rows are upserted and sit
 * in recency order; a row is dropped only if this read's cached phase delivered
 * it, it lies inside the page's (last change, id) range and the page lacks it
 * (and its preview is not an own unsent message). Rows the user paged in below
 * stay. A page with no rows proves nothing gone and changes nothing (D17).
 */
export function mergeFirstServerPage(
  current: CometChat.Conversation[],
  cachedIds: ReadonlySet<string>,
  page: CometChat.Conversation[]
): CometChat.Conversation[] {
  const first = page[0];
  if (!first) return current;
  const pageIds = new Set(page.map(idOf));
  let low = first;
  let high = first;
  for (const row of page) {
    if (compareByRange(row, low) < 0) low = row;
    if (compareByRange(row, high) > 0) high = row;
  }
  const byId = new Map(current.map(c => [idOf(c), c] as const));
  const upserted = page.map(incoming => {
    const existing = byId.get(idOf(incoming));
    // An own unsent preview is newer than anything the server has.
    if (existing && hasUnsentPreview(existing) && updatedAtOf(existing) >= updatedAtOf(incoming)) {
      return existing;
    }
    return incoming;
  });
  const kept = current.filter(row => {
    if (pageIds.has(idOf(row))) return false;
    if (!cachedIds.has(idOf(row)) || hasUnsentPreview(row)) return true;
    return compareByRange(row, low) < 0 || compareByRange(row, high) > 0;
  });
  return dedupeConversations([...upserted, ...kept].sort((a, b) => updatedAtOf(b) - updatedAtOf(a)));
}

/**
 * A later page's server copy over its cached copy: rows of that page are
 * replaced in place, rows the server page no longer has are dropped, new
 * rows are appended. Rows of other pages stay.
 */
export function applyNextServerPage(
  current: CometChat.Conversation[],
  cachedIds: ReadonlySet<string>,
  page: CometChat.Conversation[]
): CometChat.Conversation[] {
  const serverById = new Map(page.map(c => [idOf(c), c] as const));
  const next: CometChat.Conversation[] = [];
  const seen = new Set<string>();
  for (const row of current) {
    const id = idOf(row);
    if (seen.has(id)) continue;
    const fresh = serverById.get(id);
    if (fresh) {
      next.push(fresh);
      seen.add(id);
      continue;
    }
    if (cachedIds.has(id) && !hasUnsentPreview(row)) continue;
    next.push(row);
    seen.add(id);
  }
  for (const row of page) {
    if (!seen.has(idOf(row))) {
      next.push(row);
      seen.add(idOf(row));
    }
  }
  return next;
}

/**
 * A pinned row. The server returns pinned chats first, ordered by `pinnedAt`
 * rather than by recency (`CometChatConversations.utils.ts` pin banding), so a
 * pinned row says nothing about the recency range a page covers.
 * Feature-checked: an SDK build without the getters has no pins.
 */
function isPinnedRow(conversation: CometChat.Conversation): boolean {
  const loose = conversation as unknown as {
    isPinned?: () => unknown;
    getPinnedAt?: () => unknown;
  };
  if (typeof loose.isPinned === 'function') return loose.isPinned() === true;
  const pinnedAt = Number(loose.getPinnedAt?.());
  return Number.isFinite(pinnedAt) && pinnedAt > 0;
}

/**
 * Reconcile the slice one sync page covers on the plain, unfiltered list: rows
 * in the page are replaced or added; rows inside the page's range that the
 * page no longer has are removed (unless their preview is an own unsent
 * message); rows below the page are kept; nothing moves backwards. The range is
 * measured over the page's unpinned rows only, and a pinned row the page lacks
 * is kept.
 */
export function reconcileSyncPage(
  current: CometChat.Conversation[],
  page: CometChat.Conversation[]
): CometChat.Conversation[] {
  if (page.length === 0) return current;
  const pageIds = new Set(page.map(idOf));
  // A synced row with no timestamp (no last message) does not bound the page's
  // range; with no timestamp at all the range is unknown and no row is dropped.
  // Pinned rows are left out of it: the server puts them first, by `pinnedAt`,
  // so one long-quiet pinned chat in the page would otherwise reach the range
  // back past every page the user has paged in and drop the unpinned rows
  // between them, which the request's cursor can never bring back
  // (Prajwal conversationsOffline.ts:204).
  const stamps = page
    .filter(row => !isPinnedRow(row))
    .map(updatedAtOf)
    .filter(t => t > 0);
  const oldestInPage = stamps.length > 0 ? Math.min(...stamps) : Number.POSITIVE_INFINITY;
  const byId = new Map(current.map(c => [idOf(c), c] as const));
  const merged = page.map(incoming => {
    const existing = byId.get(idOf(incoming));
    // An own unsent preview is newer than anything the server has.
    if (existing && hasUnsentPreview(existing) && updatedAtOf(existing) >= updatedAtOf(incoming)) {
      return existing;
    }
    return incoming;
  });
  const rest = current.filter(c => {
    if (pageIds.has(idOf(c))) return false;
    if (hasUnsentPreview(c)) return true;
    // A pinned row the page lacks is not proof that it is gone — the recency
    // range says nothing about the pin band, and a pin or unpin arrives as its
    // own event — so it is kept.
    if (isPinnedRow(c)) return true;
    return updatedAtOf(c) < oldestInPage;
  });
  return dedupeConversations([...merged, ...rest].sort((a, b) => updatedAtOf(b) - updatedAtOf(a)));
}

// ---------------------------------------------------------------------------
// Rows rebuilt from an own message
// ---------------------------------------------------------------------------

/**
 * Whether the row can render its peer. An own message off the outbox can carry a
 * receiver with only an id, and the SDK's `getName()` throws without a name.
 */
function hasPeer(conversation: CometChat.Conversation): boolean {
  const peer = (
    conversation as unknown as { getConversationWith?: () => unknown }
  ).getConversationWith?.() as
    | { getUid?: () => string; getGuid?: () => string; getName?: () => string }
    | undefined;
  try {
    return Boolean((peer?.getGuid?.() ?? peer?.getUid?.()) && peer.getName?.());
  } catch {
    return false;
  }
}

/** The (type, with) an own message was sent to. */
export function receiverKeyOf(message: CometChat.BaseMessage): PinKey | null {
  const type = message.getReceiverType() as string | undefined;
  const id = message.getReceiverId() as string | undefined;
  if (!type || !id) return null;
  return { type: type.toLowerCase(), with: id.toLowerCase() };
}

/**
 * A row for the chat `message` belongs to, or `null` when the list cannot make
 * an addressable one. With offline on, the SDK hands back the composed message
 * for an own send (pending and acked alike), with a receiver id but no whole
 * receiver, so the conversation rebuilt from it has no `getName()`.
 *
 * A row like that is now safe to show: the item falls back to the peer id
 * instead of a blank name (a50ffa4a7), and a chat whose peer is a plain object
 * stays deletable and follows presence (068ab91ac). So where this used to
 * insist on a listed row, it now only insists on an addressable one:
 *
 * - A listed chat keeps today's behaviour exactly — the listed row supplies the
 *   peer, its id and its type, so the name the user already sees is not replaced
 *   by a bare uid.
 * - A chat that is NOT listed (the first message to a new contact) gets a row
 *   of its own, so it appears in Chats while still offline instead of only
 *   after the reconnect brings a server copy. Android does the same: its Outbox
 *   stamps the conversation target and "renders the uid instead of a blank".
 *   The id is the one the SDK stamped at compose time — `offlineSend` sets the
 *   canonical `<min>_user_<max>` / `group_<guid>` id on the message before any
 *   ack, and `getConversationFromMessage` copies it through — so the row is
 *   keyed exactly as the server's copy will be and `reconcileSyncPage` folds
 *   the two into one row on reconnect. A message with no stamped id is left
 *   alone (`null`): an unaddressable row cannot dedupe, and the caller's own
 *   fallback asks the SDK for the whole conversation instead.
 *
 * A whole conversation (a server copy) passes through untouched.
 */
export async function rowFromMessageOffline(
  message: CometChat.BaseMessage,
  list: readonly CometChat.Conversation[]
): Promise<CometChat.Conversation | null> {
  const conversation = await CometChat.CometChatHelper.getConversationFromMessage(message);
  if (hasPeer(conversation) && conversation.getConversationId()) return conversation;
  // An acked composed message may have no conversation id either.
  const id = conversation.getConversationId();
  const key = receiverKeyOf(message);
  const listed =
    (id ? list.find(row => row.getConversationId() === id) : undefined) ??
    (key ? findByPinKey(list, key) : undefined);
  if (listed) {
    conversation.setConversationWith(listed.getConversationWith());
    conversation.setConversationId(listed.getConversationId());
    conversation.setConversationType(listed.getConversationType());
    conversation.setLastMessage(message);
    return conversation;
  }
  // Not listed: a first message to a new contact. Needs the SDK's stamped id to
  // be addressable, and a receiver to render.
  if (!id || !key || !peerIdOf(conversation.getConversationWith())) return null;
  conversation.setLastMessage(message);
  return conversation;
}

/**
 * Offline (ON): fold `conversation`, rebuilt from `message`, onto the row listed
 * for it. An own message (pending, failed or acked) and a message the reconnect
 * sweep delivered never change the row's unread count: the listed count is kept
 * (the sweep's messages are counted by the conversation sync page). Returns
 * `null` when the listed row already previews a newer message than `message`,
 * so a late ack or an older swept message never brings an older preview back.
 * A chat that is not listed passes through, with its unread count set to
 * `unlistedUnread` when given.
 */
export function foldOntoListedRow(
  conversation: CometChat.Conversation,
  message: CometChat.BaseMessage,
  list: readonly CometChat.Conversation[],
  unlistedUnread?: number
): CometChat.Conversation | null {
  const id = conversation.getConversationId();
  const listed = id ? list.find(row => row.getConversationId() === id) : undefined;
  if (!listed) {
    if (unlistedUnread !== undefined) conversation.setUnreadMessageCount(unlistedUnread);
    return conversation;
  }
  const shown = listed.getLastMessage() as CometChat.BaseMessage | undefined;
  if (shown && findRowIndex([shown], message) === -1 && compareRows(shown, message) > 0) {
    return null;
  }
  conversation.setUnreadMessageCount(listed.getUnreadMessageCount());
  return conversation;
}

// ---------------------------------------------------------------------------
// Pin events (UIK-CONV-01, BEH-CPIN-09)
// ---------------------------------------------------------------------------

/** (type, with) of a conversation, lower-cased: how pin events are matched. */
export interface PinKey {
  type: string;
  with: string;
}

export function pinKeyOf(conversation: CometChat.Conversation | null | undefined): PinKey | null {
  if (!conversation) return null;
  // Feature-checked: a pin event may carry a partly parsed conversation.
  const loose = conversation as unknown as {
    getConversationType?: () => unknown;
    getConversationWith?: () => unknown;
  };
  const type = loose.getConversationType?.();
  const peer = loose.getConversationWith?.() as
    | { getUid?: () => string; getGuid?: () => string }
    | undefined;
  const id = peer?.getGuid?.() ?? peer?.getUid?.();
  if (typeof type !== 'string' || !type || !id) return null;
  return { type: type.toLowerCase(), with: id.toLowerCase() };
}

export function samePinKey(a: PinKey | null, b: PinKey | null): boolean {
  return !!a && !!b && a.type === b.type && a.with === b.with;
}

/** The listed row a pin event is about, by (type, with), case-insensitive. */
export function findByPinKey(
  list: readonly CometChat.Conversation[],
  key: PinKey
): CometChat.Conversation | undefined {
  return list.find(c => samePinKey(pinKeyOf(c), key));
}

/**
 * Keep a chat this device read offline at zero unread in a conversation sync
 * page. The read is flushed only after the message sync, so the server's copy
 * still carries the count the user cleared, and installing the page put the
 * badge back for good (Aanshi D3 on #2460). Once the flush reaches the server
 * the mark is gone and the server's count is the truth again — and a read that
 * lands there zeroes the chat anyway, so this only brings that forward.
 *
 * Rows the page carries are the SDK's fresh copies, not the rows on screen, so
 * the count is set on them in place as the other sync paths do.
 */
export function keepReadsMadeOffline(
  page: readonly CometChat.Conversation[]
): CometChat.Conversation[] {
  const hub = OfflineHub.getInstance();
  return page.map(conversation => {
    if (conversation.getUnreadMessageCount() <= 0) return conversation;
    const key = pinKeyOf(conversation);
    if (!key || !hub.readStillUnsent(key.with, key.type)) return conversation;
    // Only up to where the user actually read. A page whose newest message is
    // past that mark carries messages that arrived during the outage, and they
    // are still unread — zeroing the row hid them for good (Aanshi N1 on #2460).
    const mark = hub.readMarkFor(key.with, key.type);
    const last = conversation.getLastMessage() as CometChat.BaseMessage | undefined;
    if (mark && last && last.getId() > mark.getId()) return conversation;
    conversation.setUnreadMessageCount(0);
    return conversation;
  });
}

export interface RemotePinEventDeps {
  /** The rows on screen now. */
  list: () => readonly CometChat.Conversation[];
  /** The logged-in user's uid (a 1:1 event whose peer is the user is ignored). */
  loggedInUid: string | null | undefined;
  /** A filtered, tagged, searched or `pinnedBy` list: only rows it shows are updated. */
  filtered: boolean;
  /** Pin attributes onto the listed row `targetId`, then re-place it. */
  updateRow: (targetId: string, conversation: CometChat.Conversation) => void;
  /** Insert a fetched chat that is not on screen, respecting the pin tiers. */
  insertRow: (conversation: CometChat.Conversation) => void;
  /** `CometChat.getConversation(with, type)`. */
  fetch: (withId: string, type: string) => Promise<CometChat.Conversation | null | undefined>;
  /** Session generation: a fetch that outlives its session is dropped. */
  gen: () => number;
  onFetchError?: (error: unknown) => void;
}

/**
 * Offline (ON) path of a pin or unpin event from another device, an admin or
 * the reconnect sweep (UIK-CONV-01). Own pins do not come here: they update
 * from the action's `onSuccess` (R1). Resolves when the event has been applied
 * or dropped; never rejects.
 */
export async function applyRemotePinEvent(
  conversation: CometChat.Conversation,
  pinned: boolean,
  deps: RemotePinEventDeps
): Promise<void> {
  const key = pinKeyOf(conversation);
  if (!key) return;
  const me = deps.loggedInUid?.toLowerCase();
  if (key.type === 'user' && me && key.with === me) return;
  const listed = findByPinKey(deps.list(), key);
  if (listed) {
    deps.updateRow(listed.getConversationId(), conversation);
    return;
  }
  // A filtered list only updates rows it shows; an unpin of a chat not shown
  // changes nothing.
  if (deps.filtered || !pinned) return;
  const gen = deps.gen();
  try {
    const fetched = await deps.fetch(key.with, key.type);
    if (!fetched || gen !== deps.gen()) return;
    const nowListed = findByPinKey(deps.list(), key);
    if (nowListed) deps.updateRow(nowListed.getConversationId(), fetched);
    else deps.insertRow(fetched);
  } catch (error) {
    deps.onFetchError?.(error);
  }
}

// ---------------------------------------------------------------------------
// Kill switch (README §3.6): previews the offline path left unsent
// ---------------------------------------------------------------------------

/**
 * Rows whose preview is an own message the offline path left unsent and that
 * is not yet marked failed for this session. Once offline is off nothing will
 * send them, so they are shown failed (direct) like the message list's rows.
 */
export function strandedPreviewRows(
  list: readonly CometChat.Conversation[]
): CometChat.Conversation[] {
  const hub = OfflineHub.getInstance();
  return list.filter(c => {
    const last = c.getLastMessage() as CometChat.BaseMessage | undefined;
    return !!last && isUnsent(last) && hub.directFailureOf(last) === undefined;
  });
}
