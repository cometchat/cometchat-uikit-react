/**
 * The entity lists' shared offline core: the page reconcile, the reducer
 * arithmetic, the read runner, and fetchTwoPhase's listener per read type.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  applyEntityPage,
  carriesKeyword,
  offlineListBuilder,
  offlineListStates,
  reportsReadError,
  readEntityPage,
  reduceEntityPage,
  reduceEntityPageError,
  type EntityPagePayload,
} from '../entityList';
import { fetchTwoPhase, TWO_PHASE_KINDS } from '../two-phase';
import {
  installOfflineSdk,
  scriptedRead,
  type OfflineSdkFake,
} from '../../../testing/offline-sdk-fake';

interface Row {
  id: string;
  v?: number;
}
const r = (id: string, v = 0): Row => ({ id, v });
const idOf = (row: Row) => row.id;
const ids = (rows: Row[]) => rows.map(idOf);
const page = (
  p: Partial<EntityPagePayload<Row>> & Pick<EntityPagePayload<Row>, 'phase' | 'rows'>
) => ({ refresh: false, ...p }) as EntityPagePayload<Row>;

describe('applyEntityPage', () => {
  it('a cached page appends; a shown row is replaced where it stands', () => {
    const fresh = r('b', 2);
    const next = applyEntityPage(
      [r('a'), r('b')],
      page({ phase: 'cached', rows: [fresh, r('c')] }),
      idOf
    );
    expect(ids(next)).toEqual(['a', 'b', 'c']);
    expect(next[1]).toBe(fresh);
  });

  it('the server page replaces its cached slice in place, in server order; omissions removed', () => {
    const current = [r('a'), r('x'), r('y'), r('z')];
    const next = applyEntityPage(
      current,
      page({ phase: 'server', rows: [r('z'), r('w')], cachedIds: ['x', 'y', 'z'] }),
      idOf
    );
    expect(ids(next)).toEqual(['a', 'z', 'w']);
  });

  it('a server page with nothing cached appends; duplicates inside a page collapse', () => {
    const next = applyEntityPage(
      [r('a')],
      page({ phase: 'server', rows: [r('b'), r('b'), r('a')] }),
      idOf
    );
    expect(ids(next)).toEqual(['a', 'b']);
  });

  it('refresh: the cached phase never repaints shown rows', () => {
    const current = [r('a'), r('b')];
    expect(
      applyEntityPage(current, page({ phase: 'cached', rows: [r('q')], refresh: true }), idOf)
    ).toBe(current);
  });

  it('refresh: page one replaces the top slice through its last shown row; later rows stay', () => {
    const current = [r('a'), r('b'), r('c'), r('d'), r('e')];
    // c gone, n new; d is the last shown row the page still has; e belongs to a later page.
    const next = applyEntityPage(
      current,
      page({ phase: 'server', rows: [r('a'), r('b'), r('n'), r('d')], refresh: true }),
      idOf
    );
    expect(ids(next)).toEqual(['a', 'b', 'n', 'd', 'e']);
  });

  it('refresh: a page sharing no shown row replaces everything', () => {
    const next = applyEntityPage(
      [r('a'), r('b')],
      page({ phase: 'server', rows: [r('x')], refresh: true }),
      idOf
    );
    expect(ids(next)).toEqual(['x']);
  });
});

describe('reduceEntityPage / reduceEntityPageError', () => {
  const empty = { rows: [] as Row[], fetchState: 'loading' as const, hasMore: true };

  it('a cached page (even empty) never ends the list nor shows the empty state', () => {
    const s = reduceEntityPage(empty, page({ phase: 'cached', rows: [] }), idOf);
    expect(s).toEqual({ rows: [], fetchState: 'loading', hasMore: true });
  });

  it('an empty server page ends the list; a non-empty one keeps going', () => {
    expect(reduceEntityPage(empty, page({ phase: 'server', rows: [] }), idOf)).toMatchObject({
      fetchState: 'empty',
      hasMore: false,
    });
    expect(
      reduceEntityPage(empty, page({ phase: 'server', rows: [r('a')], hasMore: false }), idOf)
    ).toMatchObject({ fetchState: 'loaded', hasMore: false });
  });

  it('not connected (D84): rows kept and the loader ends; with nothing shown, the error state', () => {
    expect(reduceEntityPageError({ ...empty, rows: [r('a')] }, true, false)).toEqual({
      rows: [r('a')],
      fetchState: 'loaded',
      hasMore: false,
    });
    expect(reduceEntityPageError(empty, true, false).fetchState).toBe('error');
  });

  it('not connected with a keyword search and nothing shown is the empty state (Connect to search), not an error', () => {
    expect(reduceEntityPageError(empty, true, false, false, true)).toEqual({
      rows: [],
      fetchState: 'empty',
      hasMore: false,
    });
    // Rows on screen still stay, keyword or not.
    expect(
      reduceEntityPageError({ ...empty, rows: [r('a')] }, true, false, false, true).fetchState
    ).toBe('loaded');
    // A real error is the error state, keyword or not.
    expect(reduceEntityPageError(empty, false, true, false, true).fetchState).toBe('error');
  });

  it('another error: the error screen only over an empty list', () => {
    expect(reduceEntityPageError(empty, false, true).fetchState).toBe('error');
    expect(reduceEntityPageError({ ...empty, rows: [r('a')] }, false, true).fetchState).toBe(
      'loaded'
    );
  });
});

describe('offlineListBuilder', () => {
  class B {
    keyword = 'unset';
    setSearchKeyword(k: string) {
      this.keyword = k;
      return this;
    }
  }

  it('sets the keyword on a copy; the integrator builders are never changed', () => {
    const search = new B();
    const list = new B();
    const built = offlineListBuilder('jo', search, list, () => new B());
    expect(built).not.toBe(search);
    expect(built).toBeInstanceOf(B);
    expect(built.keyword).toBe('jo');
    expect(search.keyword).toBe('unset');
    const plain = offlineListBuilder('', search, list, () => new B());
    expect(plain.keyword).toBe('');
    expect(list.keyword).toBe('unset');
    expect(offlineListBuilder('', undefined, undefined, () => new B()).keyword).toBe('unset');
  });
});

describe('fetchTwoPhase per read type', () => {
  let fake: OfflineSdkFake;
  beforeEach(() => {
    fake = installOfflineSdk({ enabled: true });
  });
  afterEach(() => {
    fake.restore();
  });

  for (const [kind, { suffix }] of Object.entries(TWO_PHASE_KINDS)) {
    it(`${kind}: onCached${suffix} then onServer${suffix}, one terminal`, async () => {
      const read = scriptedRead(suffix);
      const seen: string[] = [];
      const done = fetchTwoPhase<Row>({ fetchNext: read.fn }, 'next', kind as never, {
        onCached: rows => seen.push(`cached:${ids(rows).join()}`),
        onServer: rows => seen.push(`server:${ids(rows).join()}`),
        onError: () => seen.push('error'),
      });
      read.last().cached([r('a')]);
      read.last().server([r('b')]);
      await done;
      expect(seen).toEqual(['cached:a', 'server:b']);
    });
  }

  it('readEntityPage drops every callback of a stale read and reports the not-connected terminal', async () => {
    const read = scriptedRead('Users');
    let stale = false;
    const seen: string[] = [];
    const done = readEntityPage<Row>(
      {
        request: { fetchNext: read.fn },
        kind: 'users',
        refresh: false,
        idOf,
        isStale: () => stale,
        shown: () => [r('a')],
      },
      {
        onPage: p =>
          seen.push(`${p.phase}:${ids([...p.rows]).join()}:${(p.cachedIds ?? []).join()}`),
        onError: (_e, notConnected, hasMore) =>
          seen.push(`error:${String(notConnected)}:${String(hasMore)}`),
      }
    );
    read.last().cached([r('a'), r('b')]);
    read.last().fail({ code: 'FAILED_TO_FETCH' });
    await done;
    // cachedIds exclude rows that were already shown before this read.
    expect(seen).toEqual(['cached:a,b:', 'error:true:true']);

    const second = scriptedRead('Users');
    seen.length = 0;
    const p2 = readEntityPage<Row>(
      {
        request: { fetchNext: second.fn },
        kind: 'users',
        refresh: false,
        idOf,
        isStale: () => stale,
        shown: () => [],
      },
      { onPage: () => seen.push('page'), onError: () => seen.push('error') }
    );
    stale = true;
    second.last().cached([r('x')]);
    second.last().server([r('x')]);
    await p2;
    expect(seen).toEqual([]);
  });
});

describe('D84 offline list rules', () => {
  it('offlineListStates: "Connect to search" for a keyword, "Connect to load" for every other read, only with nothing shown', () => {
    expect(offlineListStates(true, true, 0)).toEqual({ connectToLoad: false, connectToSearch: true });
    // Addition B: no keyword (a filter alone) is the plain list.
    expect(offlineListStates(true, false, 0)).toEqual({ connectToLoad: true, connectToSearch: false });
    expect(offlineListStates(true, true, 3)).toEqual({ connectToLoad: false, connectToSearch: false });
    expect(offlineListStates(true, false, 3)).toEqual({ connectToLoad: false, connectToSearch: false });
    expect(offlineListStates(false, true, 0)).toEqual({ connectToLoad: false, connectToSearch: false });
    expect(offlineListStates(false, false, 0)).toEqual({ connectToLoad: false, connectToSearch: false });
  });

  it('reportsReadError: offline only with nothing shown and no keyword (rules 2, 3, 7)', () => {
    // nothing shown, plain list: the offline state reports once
    expect(reportsReadError(true, false, false, false)).toBe(true);
    // rows shown: silent
    expect(reportsReadError(true, true, false, false)).toBe(false);
    // keyword search: an offline state, no onError
    expect(reportsReadError(true, false, true, false)).toBe(false);
  });

  it('reportsReadError: a real error reports unless the kit started a read over rows (rules 4, 5)', () => {
    expect(reportsReadError(false, false, false, false)).toBe(true);
    expect(reportsReadError(false, false, false, true)).toBe(true);
    expect(reportsReadError(false, false, true, false)).toBe(true);
    // rows shown: user or app started it
    expect(reportsReadError(false, true, false, false)).toBe(true);
    // rows shown: the kit started it (reconnect, foreground, sync)
    expect(reportsReadError(false, true, false, true)).toBe(false);
  });

  it('carriesKeyword: search text or a request keyword makes a search; a filter alone does not (addition B)', () => {
    expect(carriesKeyword('jo', undefined)).toBe(true);
    expect(carriesKeyword('', { getSearchKeyword: () => 'jo' })).toBe(true);
    expect(carriesKeyword('', { getSearchKeyword: () => '' })).toBe(false);
    expect(carriesKeyword('', {})).toBe(false);
    expect(carriesKeyword('', undefined)).toBe(false);
    expect(carriesKeyword('', { getSearchKeyword: () => undefined })).toBe(false);
  });
});
