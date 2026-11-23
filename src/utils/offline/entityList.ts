/**
 * Two-phase reads for the entity lists on the offline (ON) path: users,
 * groups, group members, reactions, the notification feed, and the pinned and
 * saved panels (README §3.3, §3.9; UIK-READ-01..05).
 *
 * Each list keeps its own reducer; this module holds the parts they share:
 * the pure page reconcile (a server page replaces, in place, the slice its
 * cached page painted), the reducer arithmetic for a page and for a read's
 * error terminal, and one read runner that drops callbacks from an older read.
 * Nothing here runs with offline off.
 *
 * @internal
 */
import type { CometChatFetchState } from '../../types';
import { copyRequestBuilder } from '../copyRequestBuilder';
import { fetchTwoPhase, type TwoPhaseKind, type TwoPhaseRequest } from './two-phase';

/** One phase of a two-phase page read, as a list's reducer receives it. */
export interface EntityPagePayload<T> {
  phase: 'cached' | 'server';
  rows: readonly T[];
  /**
   * A re-read of page one over the rows already on screen (reconnect,
   * pull-to-refresh): the cached phase never repaints shown rows, and the
   * server page replaces the slice page one covers instead of blanking first.
   */
  refresh: boolean;
  /** Server phase: ids this read's cached phase added to the list. */
  cachedIds?: readonly string[];
  /** Server phase: whether the list has more pages after this one. */
  hasMore?: boolean;
}

function dedupe<T>(rows: readonly T[], idOf: (row: T) => string): T[] {
  const seen = new Set<string>();
  return rows.filter(row => {
    const id = idOf(row);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

/**
 * Apply one phase of a page read to the rows on screen. Pure.
 *
 * - Every row is unique by id. A page row already shown outside this read's
 *   slice is replaced where it stands (no duplicate, no jump).
 * - Cached phase: new rows are appended (the slice). On a refresh over shown
 *   rows nothing changes: the rows on screen are at least as fresh as the cache.
 * - Server phase: the page replaces this read's slice in place, in the
 *   server's order; a row the cached page showed that the server page no
 *   longer has is removed. On a refresh the slice is the top of the list down
 *   to the last shown row the page still has (all shown rows when it has none);
 *   rows below it belong to later pages and stay.
 */
export function applyEntityPage<T>(
  current: readonly T[],
  payload: EntityPagePayload<T>,
  idOf: (row: T) => string
): T[] {
  const page = dedupe(payload.rows, idOf);
  if (payload.phase === 'cached' && payload.refresh && current.length > 0) {
    return current as T[];
  }
  const pageById = new Map(page.map(row => [idOf(row), row] as const));
  let owned: Set<string>;
  if (payload.phase === 'server' && payload.refresh) {
    let last = -1;
    current.forEach((row, index) => {
      if (pageById.has(idOf(row))) last = index;
    });
    owned = new Set((last === -1 ? current : current.slice(0, last + 1)).map(idOf));
  } else if (payload.phase === 'server') {
    owned = new Set(payload.cachedIds ?? []);
  } else {
    owned = new Set();
  }
  const outside = new Set<string>();
  for (const row of current) {
    const id = idOf(row);
    if (!owned.has(id)) outside.add(id);
  }
  const block = page.filter(row => !outside.has(idOf(row)));
  // The block goes where the slice's first row stood; at the end when the
  // slice is new.
  const anchor = current.findIndex(row => owned.has(idOf(row)));
  const blockAt = anchor === -1 ? current.length : anchor;
  const next: T[] = [];
  const placed = new Set<string>();
  const place = (row: T) => {
    const id = idOf(row);
    if (placed.has(id)) return;
    placed.add(id);
    next.push(row);
  };
  current.forEach((row, index) => {
    if (index === blockAt) block.forEach(place);
    const id = idOf(row);
    if (owned.has(id)) return;
    place(pageById.get(id) ?? row);
  });
  if (blockAt === current.length) block.forEach(place);
  return next;
}

/** The part of a list's state a page read changes. */
export interface EntityListSlice<T> {
  rows: T[];
  fetchState: CometChatFetchState;
  hasMore: boolean;
}

/**
 * A page phase on a list slice. A cached page, even empty, never ends the list
 * and never shows the empty state; only the server phase does (BEH-READ-09b).
 */
export function reduceEntityPage<T>(
  slice: EntityListSlice<T>,
  payload: EntityPagePayload<T>,
  idOf: (row: T) => string
): EntityListSlice<T> {
  const rows = applyEntityPage(slice.rows, payload, idOf);
  if (payload.phase === 'cached') {
    return {
      rows,
      fetchState: rows.length > 0 ? 'loaded' : slice.fetchState,
      hasMore: slice.hasMore,
    };
  }
  return {
    rows,
    fetchState: rows.length > 0 ? 'loaded' : 'empty',
    hasMore: payload.hasMore ?? payload.rows.length > 0,
  };
}

/**
 * A read that ended without a server page. Rows on screen always stay (no error
 * view over them). With nothing on screen: a real error is the error view; "not
 * connected" (offline past the cache) is the error state the kit words as
 * "Connect to load ..." (D84), or, for a keyword search, the empty state it
 * words as "Connect to search". A quiet read (the kit's own reconnect refetch
 * over shown rows) changes nothing but the loader ending.
 */
export function reduceEntityPageError<T>(
  slice: EntityListSlice<T>,
  notConnected: boolean,
  hasMore: boolean,
  quiet = false,
  keyword = false
): EntityListSlice<T> {
  if (quiet) {
    // The list refetched itself (reconnect) over rows on screen and failed:
    // nothing changes but the loader ending. The next reconnect tries again.
    return {
      rows: slice.rows,
      fetchState: slice.fetchState === 'loading' ? 'loaded' : slice.fetchState,
      hasMore: slice.hasMore,
    };
  }
  if (notConnected) {
    return {
      rows: slice.rows,
      fetchState: slice.rows.length > 0 ? 'loaded' : keyword ? 'empty' : 'error',
      hasMore,
    };
  }
  return {
    rows: slice.rows,
    fetchState:
      slice.rows.length === 0
        ? 'error'
        : slice.fetchState === 'loading'
          ? 'loaded'
          : slice.fetchState,
    hasMore: slice.hasMore,
  };
}

/**
 * The offline states of a list (D84). With nothing on screen, "not connected" is
 * "Connect to search" for a keyword search (rule 7) and "Connect to load ..." for
 * every other read, a filter-only one included (rule 3, addition B).
 */
export function offlineListStates(
  notConnected: boolean,
  keyword: boolean,
  shown: number
): { connectToLoad: boolean; connectToSearch: boolean } {
  const nothing = notConnected && shown === 0;
  return { connectToLoad: nothing && !keyword, connectToSearch: nothing && keyword };
}

/**
 * Whether a read is a keyword search (D84, addition B): the list was given search text,
 * or its request carries a non-empty keyword. A filter alone (online only, tags, a
 * builder without a keyword) is not a search: it is the plain list.
 */
export function carriesKeyword(search: string, request: unknown): boolean {
  if (search !== '') return true;
  const get = (request as { getSearchKeyword?: () => unknown } | null | undefined)
    ?.getSearchKeyword;
  const keyword = typeof get === 'function' ? get.call(request) : '';
  return typeof keyword === 'string' && keyword !== '';
}

/**
 * Whether a read that ended without a server page reaches `onError` (D84).
 * Offline: only with nothing on screen and not a keyword search (rules 2, 3, 7).
 * A real error: always with nothing on screen (rule 4); over rows only when the
 * user or the app started the read, never when the kit did (rule 5).
 */
export function reportsReadError(
  notConnected: boolean,
  shown: boolean,
  keyword: boolean,
  kitStarted: boolean
): boolean {
  if (notConnected) return !shown && !keyword;
  return !(shown && kitStarted);
}

/** What a two-phase entity read reports to its list. */
export interface EntityReadHandlers<T> {
  /** A page phase that is not stale; dispatch it to the list's reducer. */
  onPage(payload: EntityPagePayload<T>): void;
  /**
   * The read ended without a server page. `hasMore` is what the list should
   * keep: a non-empty cached page may be followed by more cached pages; past
   * the cache, stop (a reconnect or a new read starts again).
   */
  onError(error: unknown, notConnected: boolean, hasMore: boolean): void;
}

export interface EntityReadOptions<T> {
  /** The SDK request (built from a copy of any integrator builder). */
  request: TwoPhaseRequest;
  kind: TwoPhaseKind;
  direction?: 'next' | 'previous';
  /** A re-read of page one over the rows on screen (see {@link EntityPagePayload.refresh}). */
  refresh: boolean;
  idOf: (row: T) => string;
  /** True once a newer read, a search, a scope change or an unmount superseded this one. */
  isStale: () => boolean;
  /** The rows on screen now. */
  shown: () => readonly T[];
  /** The server phase's "more pages" rule; default: the page is non-empty. */
  hasMoreOf?: (serverPage: readonly T[]) => boolean;
}

/**
 * One two-phase page read for an entity list. Callbacks of a stale read are
 * dropped (UIK-READ-05). Resolves after the read's terminal; never rejects.
 */
export function readEntityPage<T>(
  options: EntityReadOptions<T>,
  handlers: EntityReadHandlers<T>
): Promise<void> {
  const { request, kind, direction = 'next', refresh, idOf, isStale, shown } = options;
  const hasMoreOf = options.hasMoreOf ?? ((page: readonly T[]) => page.length > 0);
  let cachedIds: string[] = [];
  let cachedCount = 0;
  return fetchTwoPhase<T>(request, direction, kind, {
    onCached: page => {
      if (isStale()) return;
      const onScreen = shown();
      if (!(refresh && onScreen.length > 0)) {
        const shownIds = new Set(onScreen.map(idOf));
        cachedIds = page.map(idOf).filter(id => !shownIds.has(id));
      }
      cachedCount = page.length;
      handlers.onPage({ phase: 'cached', rows: page, refresh });
    },
    onServer: page => {
      if (isStale()) return;
      handlers.onPage({
        phase: 'server',
        rows: page,
        refresh,
        cachedIds,
        hasMore: hasMoreOf(page),
      });
    },
    onError: (error, notConnected) => {
      if (isStale()) return;
      handlers.onError(error, notConnected, notConnected ? cachedCount > 0 : true);
    },
  });
}

let opCounter = 0;

/** A unique id for one read operation (`Date.now()` ids collide within a millisecond). */
export function nextOfflineOpId(prefix: string): string {
  opCounter += 1;
  return `${prefix}_offline_${String(opCounter)}`;
}

/** Error text for a list's `error` field, as the lists' OFF paths word it. */
export function errorMessageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

interface KeywordBuilder {
  setSearchKeyword(keyword: string): unknown;
}

/**
 * The request builder for a users, groups or members read on the offline path:
 * the same choice the list makes today (search builder for a keyword, else the
 * list builder, else a default), but the keyword is set on a copy, so an
 * integrator's builder is never changed.
 */
export function offlineListBuilder<B extends KeywordBuilder>(
  search: string,
  searchBuilder: B | undefined,
  listBuilder: B | undefined,
  makeDefault: () => B
): B {
  let builder: B;
  if (search && searchBuilder) builder = copyRequestBuilder(searchBuilder);
  else if (listBuilder) builder = copyRequestBuilder(listBuilder);
  else {
    builder = makeDefault();
    if (search) builder.setSearchKeyword(search);
    return builder;
  }
  builder.setSearchKeyword(search);
  return builder;
}
