/**
 * The message list's offline (ON) path. Every function here runs only after
 * the caller read `isOfflineOn()` as true for that operation (or reacts to a
 * hub event, which the SDK never fires with offline off); with offline off the
 * hooks keep today's single fetch and merge.
 *
 * - Reads are two-phase: the cached page paints first, the server page then
 *   replaces the same slice in place (README §3.3).
 * - Own sends are drawn from the hub's send-state channel (§3.4).
 * - Reconnect makes no message fetch: the SDK's sweep is consumed, plus one
 *   newest-window refresh after a PARTIAL or failed sweep (§3.7).
 *
 * @internal
 */
import { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatMessageListManager } from './CometChatMessageListManager';
import type { MessageListRefs, MessageListDispatch } from './messageListRefs';
import { cloneMessage, isMessageForConversation } from './CometChatMessageList.utils';
import type { CometChatUIEvent } from '../../context/CometChatEvents.types';
import {
  isSending,
  isSyncDelivered,
  localIdOf,
  OfflineMessageStatus,
  serverIdOf,
  statusOf,
} from '../../utils/offline/identity';
import {
  cachedKeysOf,
  compareRows,
  findRowIndex,
  HeldReceipts,
  newestServerId,
  oldestServerId,
  upsertSorted,
} from '../../utils/offline/reconcile';
import { isSdkConnected } from '../../utils/offline/gate';
import {
  OfflineHub,
  type MessageSyncEvent,
  type MessagesUpdatedEvent,
  type SendStateEvent,
} from '../../utils/offline/hub';

/** Per-list offline bookkeeping, kept beside the list's refs. */
export interface OfflineListState {
  held: HeldReceipts;
  /** Set once this list ran an ON-path operation; scopes kill-switch cleanup. */
  used: boolean;
  /**
   * The newest window a PARTIAL sweep read while the user was reading older
   * messages, waiting for "Jump to latest" (with the manager that continues it).
   */
  pendingLatest: { rows: CometChat.BaseMessage[]; manager: CometChatMessageListManager } | null;
}

const offlineStates = new WeakMap<MessageListRefs, OfflineListState>();

export function offlineStateOf(refs: MessageListRefs): OfflineListState {
  let state = offlineStates.get(refs);
  if (!state) {
    state = { held: new HeldReceipts(), used: false, pendingLatest: null };
    offlineStates.set(refs, state);
  }
  return state;
}

export interface OfflineListContext {
  refs: MessageListRefs;
  dispatch: MessageListDispatch;
  publish: (event: CometChatUIEvent) => void;
  user: CometChat.User | undefined;
  group: CometChat.Group | undefined;
  parentMessageId: number | undefined;
  loggedInUser: CometChat.User;
  isAgentChat: boolean;
  /** The list's types and categories (a consumer's builder, when given, wins). */
  messageTypes?: string[];
  messageCategories?: string[];
  builder?: CometChat.MessagesRequestBuilder;
  /** A fresh manager with the list's request configuration. */
  makeManager: () => CometChatMessageListManager;
}

/** A key that names this list, for notices scoped to it. */
export function listKeyOf(
  ctx: Pick<OfflineListContext, 'user' | 'group' | 'parentMessageId'>
): string {
  const target = ctx.user
    ? `user:${ctx.user.getUid()}`
    : ctx.group
      ? `group:${ctx.group.getGuid()}`
      : '';
  return `${target}:${String(ctx.parentMessageId ?? 0)}`;
}

/** Whether `message` belongs in this list (own messages included). */
export function belongsToList(ctx: OfflineListContext, message: CometChat.BaseMessage): boolean {
  try {
    return isMessageForConversation(
      message,
      ctx.user,
      ctx.group,
      ctx.parentMessageId,
      ctx.loggedInUser.getUid(),
      { excludeSender: false, isAgentChat: ctx.isAgentChat }
    );
  } catch {
    return false;
  }
}

/**
 * Whether the list's configured types and categories show `message`: the
 * acceptance a page load applies. A consumer's builder decides when given
 * (its own types/categories), else the list's. Unlike a page load it does not
 * drop deleted rows: a swept delete updates the row in place (the live delete
 * path), and the server's edit/delete action rows (category action, type
 * message) are not a type any list shows.
 */
function matchesConfiguredFilter(ctx: OfflineListContext, message: CometChat.BaseMessage): boolean {
  const b = ctx.builder as unknown as
    | { types?: string[]; type?: string; categories?: string[]; category?: string }
    | undefined;
  const types = b ? (b.types ?? (b.type && [b.type])) : ctx.messageTypes;
  const categories = b ? (b.categories ?? (b.category && [b.category])) : ctx.messageCategories;
  return (
    (!types || !types.length || types.includes(message.getType())) &&
    (!categories || !categories.length || categories.includes(message.getCategory()))
  );
}

/** Apply receipts that arrived before their message's ack (BEH-SEND-32). */
function applyHeldReceipts(
  ctx: OfflineListContext,
  rows: readonly CometChat.BaseMessage[]
): CometChat.BaseMessage[] {
  const { held } = offlineStateOf(ctx.refs);
  if (held.size === 0) return rows.slice();
  return rows.map(row => {
    const id = serverIdOf(row);
    const receipt = id > 0 ? held.take(id) : undefined;
    if (!receipt) return row;
    const next = cloneMessage(row);
    if (receipt.receiptType === 'read') {
      next.setReadAt(receipt.timestamp);
      if (!next.getDeliveredAt()) next.setDeliveredAt(receipt.timestamp);
    } else {
      next.setDeliveredAt(receipt.timestamp);
    }
    return next;
  });
}

export interface OfflinePageResult {
  /** The read's error when it ended without a server page. */
  error?: unknown;
  /** The server page, or `null` when the read ended without one. */
  serverPage: CometChat.BaseMessage[] | null;
  cachedPage: CometChat.BaseMessage[];
  /**
   * Whether this direction has more, from the raw server page (BEH-READ-09b);
   * `null` when the read ended without a server page.
   */
  moreOnServer: boolean | null;
  notConnected: boolean;
  /** This list was replaced meanwhile (chat switch, logout, reset). */
  stale: boolean;
}

/** What a jump to a message reports: its rows and the first error a read of it ended with. */
export interface OfflineAroundResult {
  rows: CometChat.BaseMessage[];
  hasMoreNewer: boolean;
  stale: boolean;
  /** The first read error of the jump (offline too); the caller reports it to `onError` once. */
  error?: unknown;
  /** That error was "not connected". */
  notConnected?: boolean;
}

/**
 * One two-phase page read. Only a non-empty server page says "this direction
 * has more", and only an empty one, online, ends it (BEH-READ-09b). An offline
 * read past the cache shows the "Connect to load older messages" footer
 * instead of an error.
 *
 * A page the kit filtered on the client can come back short, even empty, with
 * history left. A server-side filter would have filled the page, and a short
 * list has no scroll to load more on, so the read goes on until it has a full
 * page or the history ends. A read that filtered nothing is one read.
 *
 * Reading on assumes the SDK's cursor moves, which it does for a page it
 * answered. It is not left to that assumption: a read that answers the same
 * raw page as the one before it, and a page count past
 * {@link MAX_READS_PER_PAGE}, end the read with what it has, so a cursor that
 * ever stood still cannot leave the list on its loader until the chat is left
 * (Prajwal `messageListOffline.ts:236`).
 */
/**
 * The most SDK reads one page read may take while the client filter keeps the
 * page short. Ten pages of filtered-out rows is already far past any real
 * chat; past it the list shows what it has and the user scrolls for more.
 */
const MAX_READS_PER_PAGE = 10;

export async function readPageOffline(
  ctx: OfflineListContext,
  manager: CometChatMessageListManager,
  direction: 'previous' | 'next',
  gen: number
): Promise<OfflinePageResult> {
  offlineStateOf(ctx.refs).used = true;
  const stale = () => ctx.refs.generationRef.current !== gen;
  const result: OfflinePageResult = {
    serverPage: null,
    cachedPage: [],
    moreOnServer: null,
    notConnected: false,
    stale: false,
  };
  const join = (shown: CometChat.BaseMessage[], page: CometChat.BaseMessage[]) =>
    direction === 'previous' ? [...page, ...shown] : [...shown, ...page];
  let visible = 0;
  let filteredSome = false;
  /** SDK reads this page read has taken, and the raw page the last one answered. */
  let reads = 0;
  let lastRawKeys = '';
  const keysOf = (page: CometChat.BaseMessage[]) =>
    Array.from(cachedKeysOf(page)).sort().join('|');
  /** Whether one more read may follow this raw page (see the function doc). */
  const mayReadAgain = (rawPage: CometChat.BaseMessage[]) => {
    if (reads + 1 >= MAX_READS_PER_PAGE) return false;
    const keys = keysOf(rawPage);
    return keys === '' || keys !== lastRawKeys;
  };
  /** Whether this read's filter left the page short with more to read. */
  const isShort = (page: CometChat.BaseMessage[], rawPage: CometChat.BaseMessage[]) => {
    visible += page.length;
    if (page.length < rawPage.length) filteredSome = true;
    return rawPage.length > 0 && filteredSome && visible < manager.getPageLimit();
  };
  const readOnce = async (): Promise<boolean> => {
    let cachedKeys: string[] = [];
    let painted: { paintedKeys: string[]; rawCachedKeys: string[] } | undefined;
    let cachedShort = false;
    let again = false;
    /** The raw page the SDK last answered with, cached or server. */
    let rawAnswer: CometChat.BaseMessage[] = [];
    const handlers = {
      onCached: (page: CometChat.BaseMessage[], rawPage = page) => {
        if (stale()) return;
        rawAnswer = rawPage;
        result.cachedPage = join(result.cachedPage, page);
        cachedKeys = Array.from(cachedKeysOf(page));
        const listed = cachedKeysOf(ctx.refs.stateRef.current.messages);
        const paintedKeys = cachedKeys.filter(key => !listed.has(key));
        if (paintedKeys.length > 0)
          painted = { paintedKeys, rawCachedKeys: Array.from(cachedKeysOf(rawPage)) };
        // Cached rows are the first paint: no loader over them.
        if (page.length > 0) {
          ctx.dispatch({ type: 'OFFLINE_UPSERT', messages: applyHeldReceipts(ctx, page) });
        }
        // Only an offline read goes on from here: the server phase decides otherwise.
        cachedShort =
          rawPage.length > 0 &&
          page.length < rawPage.length &&
          result.cachedPage.length < manager.getPageLimit();
      },
      onServer: (page: CometChat.BaseMessage[], rawPage = page) => {
        if (stale()) return;
        rawAnswer = rawPage;
        result.serverPage = join(result.serverPage ?? [], page);
        result.moreOnServer = rawPage.length > 0;
        again = isShort(page, rawPage) && mayReadAgain(rawPage);
        ctx.dispatch({
          type: 'OFFLINE_SERVER_PAGE',
          direction,
          cachedKeys,
          messages: applyHeldReceipts(ctx, page),
          rawMessages: rawPage,
          ...(again && { continuing: true }),
          ...painted,
        });
      },
      onError: (error: unknown, notConnected: boolean) => {
        if (stale()) return;
        // Offline, the next cached page may hold what this one filtered out.
        if (notConnected && cachedShort && mayReadAgain(rawAnswer)) {
          again = true;
          return;
        }
        result.notConnected = notConnected;
        result.error = error;
        ctx.dispatch({
          type: 'OFFLINE_PAGE_ERROR',
          direction,
          notConnected,
          error: error instanceof Error ? error.message : 'Failed to load messages',
          // The connection came back while this read was giving up.
          ...(notConnected && isSdkConnected() && { retryable: true }),
        });
      },
    };
    await (direction === 'previous'
      ? manager.fetchPreviousTwoPhase(handlers)
      : manager.fetchNextTwoPhase(handlers));
    reads += 1;
    const answered = keysOf(rawAnswer);
    if (answered !== '') lastRawKeys = answered;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- set by the handlers
    return again && !stale();
  };
  while (await readOnce()) {
    // The SDK refuses a second read until it has settled this one.
    await new Promise(resolve => setTimeout(resolve, 0));
    if (stale()) break;
  }
  result.stale = stale();
  return result;
}

/** The rows a page read showed: the server page, else the cached page. */
export function rowsOf(result: OfflinePageResult): CometChat.BaseMessage[] {
  return result.serverPage ?? result.cachedPage;
}

/**
 * Jump to a message (search result, quoted reply, unread anchor): the page
 * before it, the target, and the page after it, each two-phase (BEH-READ-29).
 * The region between this window and the newest page loads on scroll.
 */
export async function fetchAroundOffline(
  ctx: OfflineListContext,
  manager: CometChatMessageListManager,
  messageId: number,
  gen: number,
  highlight: boolean,
  knownTarget?: CometChat.BaseMessage | null
): Promise<OfflineAroundResult> {
  // The target first: one two-phase read (the device's copy, else the server's),
  // unless the caller already read it.
  const target = knownTarget ?? (await manager.getMessageDetailsTwoPhase(messageId));
  if (ctx.refs.generationRef.current !== gen) return { rows: [], hasMoreNewer: false, stale: true };
  if (!target) {
    // Not cached and not reachable (BEH-READ-29), whatever the SDK says of the
    // connection (it notices a lost socket late): open on the newest cached
    // page as a normal offline open does, with no scroll target. If that read
    // fails too, the caller reports it (D83).
    manager.resetPreviousRequest();
    const newest = await readPageOffline(ctx, manager, 'previous', gen);
    if (newest.stale) return { rows: [], hasMoreNewer: false, stale: true };
    ctx.dispatch({ type: 'SET_HAS_REACHED_LATEST', hasReachedLatest: true });
    return {
      rows: rowsOf(newest),
      hasMoreNewer: false,
      stale: false,
      ...(newest.error !== undefined && { error: newest.error, notConnected: newest.notConnected }),
    };
  }
  // Rows arrive page by page (cached first); until the window is positioned on
  // the target, the list must not settle at the bottom and load newer from
  // there, or start-from-unread ends at the newest message.
  ctx.dispatch({ type: 'OFFLINE_AROUND_START', messageId });
  manager.resetPreviousRequest(messageId);
  const before = await readPageOffline(ctx, manager, 'previous', gen);
  if (before.stale) return { rows: [], hasMoreNewer: false, stale: true };
  if (belongsToList(ctx, target))
    ctx.dispatch({ type: 'OFFLINE_UPSERT', messages: [target] });
  const anchor =
    Math.max(newestServerId(rowsOf(before)), serverIdOf(target)) || messageId;
  manager.initNextRequest(anchor);
  const after = await readPageOffline(ctx, manager, 'next', gen);
  if (after.stale) return { rows: [], hasMoreNewer: false, stale: true };
  const rows = upsertSorted(rowsOf(before), [target, ...rowsOf(after)]).rows;
  const hasMoreNewer = after.moreOnServer !== false;
  ctx.dispatch({ type: 'SET_HAS_REACHED_LATEST', hasReachedLatest: !hasMoreNewer });
  ctx.dispatch({ type: 'SET_SCROLL_TO_MESSAGE', messageId, highlight });
  // Older pages continue from the oldest row with a server id.
  const oldest = oldestServerId(rows);
  if (oldest > 0) manager.resetPreviousRequest(oldest);
  const error = before.error ?? after.error;
  const notConnected = before.error !== undefined ? before.notConnected : after.notConnected;
  return {
    rows,
    hasMoreNewer,
    stale: false,
    ...(error !== undefined && { error, notConnected }),
  };
}

/**
 * Re-read the newest window of the open chat after a PARTIAL or failed sweep:
 * one fresh two-phase read with no anchor, read without touching the list
 * first, so nothing is inserted before it is known to fit.
 *
 * - The list is viewing a jumped window (not the newest messages): it is left
 *   alone; newer pages load on scroll as today.
 * - The page overlaps what is shown: it is upserted in place.
 * - It does not overlap (more was missed than one page): at the bottom the list
 *   resets to the newest window (its unsent rows kept); reading older
 *   messages, the list stays and offers "Jump to latest".
 */
export async function refreshNewestWindow(ctx: OfflineListContext): Promise<void> {
  const gen = ctx.refs.generationRef.current;
  if (!ctx.refs.stateRef.current.hasReachedLatest) return;
  const manager = ctx.makeManager();
  let cachedKeys: string[] = [];
  let serverPage: CometChat.BaseMessage[] | null = null;
  let rawServerPage: CometChat.BaseMessage[] | undefined;
  const stale = () => ctx.refs.generationRef.current !== gen;
  await manager.fetchPreviousTwoPhase({
    onCached: page => {
      cachedKeys = Array.from(cachedKeysOf(page));
    },
    onServer: (page, rawPage) => {
      serverPage = page;
      rawServerPage = rawPage;
    },
    onError: () => {
      /* the next sweep heals; nothing shown changes */
    },
  });
  const page = serverPage as CometChat.BaseMessage[] | null;
  if (stale() || !page || page.length === 0) return;
  const state = ctx.refs.stateRef.current;
  const shownIds = new Set(state.messages.map(serverIdOf).filter(id => id > 0));
  const withReceipts = applyHeldReceipts(ctx, page);
  if (shownIds.size === 0 || page.some(m => shownIds.has(serverIdOf(m)))) {
    ctx.dispatch({
      type: 'OFFLINE_SERVER_PAGE',
      direction: 'previous',
      cachedKeys,
      messages: withReceipts,
      ...(rawServerPage && { rawMessages: rawServerPage }),
    });
    return;
  }
  const offline = offlineStateOf(ctx.refs);
  if (state.isAtBottom) {
    jumpToWindow(ctx, withReceipts, manager);
    return;
  }
  offline.pendingLatest = { rows: withReceipts, manager };
  ctx.dispatch({ type: 'OFFLINE_SET_JUMP_TO_LATEST', value: true });
}

/**
 * Show a newest window the sweep read, at the bottom.
 *
 * The window is a snapshot: the list goes on taking live messages while it
 * waits for the tap, because it has reached the latest. Installing the snapshot
 * alone dropped every peer message and every acked own send that arrived in
 * between, until the chat was reopened. So rows the list holds that sort after
 * the window's last row are carried over with the unsent ones (Aanshi D2 on
 * #2460).
 *
 * The generation moves with the manager: an older-page read still running on
 * the manager this one replaces would otherwise pass its own staleness check
 * and prepend its page above the new window, across a hidden gap.
 */
function jumpToWindow(
  ctx: OfflineListContext,
  rows: CometChat.BaseMessage[],
  manager: CometChatMessageListManager
): void {
  const newest = rows[rows.length - 1];
  const keep = ctx.refs.stateRef.current.messages.filter(
    m => serverIdOf(m) === 0 || (newest !== undefined && compareRows(newest, m) < 0)
  );
  ctx.dispatch({ type: 'OFFLINE_REPLACE_ALL', messages: upsertSorted(rows, keep).rows });
  // Older pages now continue from this window.
  ctx.refs.generationRef.current += 1;
  ctx.refs.managerRef.current = manager;
  offlineStateOf(ctx.refs).pendingLatest = null;
}

/**
 * A chat opened offline with nothing cached shows the error view (D83), but no
 * read has answered for it and the sweep only carries what changed, so nothing
 * else would ever fill it (UIK-READ-04, P6). The connection is back: read it
 * again, once. An error view from any other error, or a chat known to be empty,
 * makes no request. An empty list whose read is still in flight waits for it to
 * settle first, as long as the window is unchanged.
 */
export function recoverEmptyChat(
  ctx: OfflineListContext,
  gen = ctx.refs.generationRef.current,
  tries = 0
): void {
  const state = ctx.refs.stateRef.current;
  if (ctx.refs.generationRef.current !== gen) return;
  if (state.fetchState === 'loading' && state.messages.length === 0 && tries < 200) {
    setTimeout(recoverEmptyChat, 50, ctx, gen, tries + 1);
    return;
  }
  if (
    state.fetchState !== 'error' ||
    state.messages.length > 0 ||
    state.offlineFooter !== 'connect_to_load_more'
  ) {
    return;
  }
  const initialize = ctx.refs.initializeRef.current;
  if (!initialize) return;
  ctx.refs.generationRef.current += 1;
  ctx.refs.managerRef.current = ctx.makeManager();
  initialize();
}

/** "Jump to latest": show the newest window a sweep read, at the bottom. */
export function jumpToLatest(ctx: OfflineListContext): void {
  const pending = offlineStateOf(ctx.refs).pendingLatest;
  if (!pending) {
    ctx.dispatch({ type: 'OFFLINE_SET_JUMP_TO_LATEST', value: false });
    return;
  }
  jumpToWindow(ctx, pending.rows, pending.manager);
}

/** Draw one transition of an own send that belongs to this list. */
export function applySendState(ctx: OfflineListContext, event: SendStateEvent): void {
  if (event.gen !== OfflineHub.getInstance().gen) return;
  const { message } = event;
  if (!belongsToList(ctx, message)) return;
  offlineStateOf(ctx.refs).used = true;
  if (event.state === 'discarded') {
    ctx.dispatch({ type: 'OFFLINE_REMOVE', message });
    return;
  }
  // Always a fresh reference: the SDK often hands back the very object the row
  // already holds, and memoized bubbles re-render only on a new one.
  const row = cloneMessage(message);
  if (event.state === 'sending' && statusOf(message) === OfflineMessageStatus.failed) {
    // A retry is under way; the object the SDK handed back may still read FAILED.
    try {
      (row as unknown as { setStatus?: (status: string) => void }).setStatus?.(
        OfflineMessageStatus.pending
      );
    } catch {
      /* status stays as it was */
    }
  }
  const [withReceipts] = applyHeldReceipts(ctx, [row]);
  const state = ctx.refs.stateRef.current;
  // Viewing older history: update a row shown, but never append out of order.
  const updateOnly = !state.hasReachedLatest && findRowIndex(state.messages, row) === -1;
  ctx.dispatch({
    type: 'OFFLINE_UPSERT',
    messages: [withReceipts ?? row],
    ...(updateOnly && { updateOnly: true }),
  });
}

/**
 * The sweep finished: upsert every message of the sweep for this chat in
 * sorted place (the only path for action and call rows, BEH-SYNC-25), send one
 * cumulative read receipt, and refresh the newest window if it was PARTIAL.
 */
export function applyMessageSync(
  ctx: OfflineListContext,
  event: MessageSyncEvent,
  hideGroupActionMessages: boolean
): void {
  if (event.gen !== OfflineHub.getInstance().gen) return;
  const forThisChat = event.messages.filter(m => {
    if (!belongsToList(ctx, m)) return false;
    if (hideGroupActionMessages && (m.getCategory() as string) === CometChat.CATEGORY_ACTION) {
      return false;
    }
    return matchesConfiguredFilter(ctx, m);
  });
  offlineStateOf(ctx.refs).held.clear();
  const state = ctx.refs.stateRef.current;
  if (forThisChat.length > 0) {
    ctx.dispatch({
      type: 'OFFLINE_UPSERT',
      messages: forThisChat,
      ...(!state.hasReachedLatest && { updateOnly: true }),
    });
    sendCumulativeRead(ctx, forThisChat);
  } else {
    recoverEmptyChat(ctx);
  }
  if (event.outcome === 'PARTIAL') void refreshNewestWindow(ctx);
}

/**
 * One read receipt for the newest swept message from someone else, when the
 * user is looking at the bottom of the chat (swept messages are never receipted
 * one by one, UIK-SYNC-02).
 */
function sendCumulativeRead(ctx: OfflineListContext, swept: CometChat.BaseMessage[]): void {
  const state = ctx.refs.stateRef.current;
  if (
    ctx.parentMessageId ||
    !state.isAtBottom ||
    !state.hasReachedLatest ||
    state.markedUnreadByUser
  ) {
    return;
  }
  const uid = ctx.loggedInUser.getUid();
  let newest: CometChat.BaseMessage | undefined;
  for (const m of swept) {
    const senderUid = (m.getSender() as CometChat.User | undefined)?.getUid();
    if (serverIdOf(m) === 0 || !senderUid || senderUid === uid || m.getReadAt()) continue;
    if (!newest || serverIdOf(m) > serverIdOf(newest)) newest = m;
  }
  if (!newest) return;
  const manager = ctx.refs.managerRef.current;
  if (!manager) return;
  manager.markAsRead(newest).catch(() => {
    rememberOfflineRead(ctx);
  });
  ctx.publish({ type: 'ui:message/read', message: newest });
}

/** `onMessagesSynced`: update rows shown; never insert (BEH-INV-11). */
export function applyMessagesUpdated(ctx: OfflineListContext, event: MessagesUpdatedEvent): void {
  if (event.gen !== OfflineHub.getInstance().gen) return;
  const forThisChat = event.messages.filter(m => belongsToList(ctx, m));
  if (forThisChat.length > 0) {
    ctx.dispatch({ type: 'OFFLINE_UPSERT', messages: forThisChat, updateOnly: true });
  }
}

/**
 * Kill switch (UIK-LIFE-03): offline turned off while un-acked rows are shown.
 * They turn failed (direct), with Retry as a fresh send, and one notice. Rows
 * whose per-call answer already came are left alone.
 */
export function failStrandedSends(ctx: OfflineListContext): void {
  if (!offlineStateOf(ctx.refs).used) return;
  const hub = OfflineHub.getInstance();
  const stranded = ctx.refs.stateRef.current.messages.filter(
    m =>
      serverIdOf(m) === 0 &&
      (isSending(m) || localIdOf(m) !== '') &&
      hub.directFailureOf(m) === undefined &&
      statusOf(m) !== OfflineMessageStatus.failed
  );
  if (stranded.length === 0) return;
  // Each one is announced failed once; the hub's send-state channel redraws it.
  for (const message of stranded) hub.reportSendState(message, 'failed', { direct: true });
  ctx.dispatch({ type: 'OFFLINE_TOUCH', messages: stranded });
  hub.raiseNotice({ kind: 'messages_not_sent', count: stranded.length, listKey: listKeyOf(ctx) });
}

/**
 * Remember that this chat's read could not reach the server (sent after the next
 * sync), and how far it was read.
 *
 * The mark is the newest message the list is showing. The flush marks read up to
 * it, so a message that arrives during the outage is still unread afterwards —
 * clearing the whole conversation swallowed it silently (Aanshi N1 on #2460).
 */
export function rememberOfflineRead(ctx: OfflineListContext): void {
  if (ctx.parentMessageId) return;
  const hub = OfflineHub.getInstance();
  const upTo = newestShownMessage(ctx);
  if (ctx.user)
    hub.rememberReadWhileOffline(ctx.user.getUid(), CometChat.RECEIVER_TYPE.USER, upTo);
  else if (ctx.group)
    hub.rememberReadWhileOffline(ctx.group.getGuid(), CometChat.RECEIVER_TYPE.GROUP, upTo);
}

/**
 * The newest message on screen that the server knows about — the furthest point
 * a read can honestly claim. A row still waiting for its ack has no server id,
 * so it cannot be the mark.
 */
function newestShownMessage(ctx: OfflineListContext): CometChat.BaseMessage | undefined {
  const shown = ctx.refs.stateRef.current.messages;
  let newest: CometChat.BaseMessage | undefined;
  for (const message of shown) {
    if (serverIdOf(message) === 0) continue;
    if (!newest || serverIdOf(message) > serverIdOf(newest)) newest = message;
  }
  return newest;
}

/**
 * Hold a receipt for a server id the list does not show yet (its ack has not
 * landed); it is applied when a row acquires that id.
 */
export function holdReceiptIfUnshown(
  ctx: Pick<OfflineListContext, 'refs'>,
  messageId: number,
  receiptType: 'delivered' | 'read',
  timestamp: number
): void {
  const rows = ctx.refs.stateRef.current.messages;
  if (rows.some(row => serverIdOf(row) === messageId)) return;
  // An id newer than every row shown can be an ack still on its way; so can an
  // older one while an own message is still unsent (its ack may land below a
  // newer message from someone else). Otherwise an id not on screen is simply
  // not loaded. The map is capped, so holding is cheap.
  const awaitingAck = rows.some(row => serverIdOf(row) === 0);
  if (messageId <= newestServerId(rows) && !awaitingAck) return;
  offlineStateOf(ctx.refs).held.hold(messageId, { receiptType, timestamp });
}

/** Whether a live message is one the SDK's sweep delivered. */
export function isSwept(message: CometChat.BaseMessage): boolean {
  return isSyncDelivered(message);
}
