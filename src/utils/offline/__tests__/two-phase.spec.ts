/**
 * fetchTwoPhase's terminals: exactly one of server page or error, whichever
 * way the request answers (listener, Promise, a missing method, a throw).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchTwoPhase, type TwoPhaseHandlers, type TwoPhaseRequest } from '../two-phase';
import { installOfflineSdk, type OfflineSdkFake } from '../../../testing/offline-sdk-fake';

type Listener = Record<string, (arg?: unknown) => void>;

function handlers(): TwoPhaseHandlers<string> & {
  onCached: ReturnType<typeof vi.fn>;
  onServer: ReturnType<typeof vi.fn>;
  onError: ReturnType<typeof vi.fn>;
} {
  return { onCached: vi.fn(), onServer: vi.fn(), onError: vi.fn() };
}

describe('fetchTwoPhase', () => {
  let fake: OfflineSdkFake;
  beforeEach(() => {
    fake = installOfflineSdk({ enabled: true });
  });
  afterEach(() => {
    fake.restore();
  });

  it("'previous' reads with fetchPrevious and the kind's own handler names", async () => {
    const h = handlers();
    const fetchNext = vi.fn();
    const request: TwoPhaseRequest = {
      fetchPrevious: vi.fn((listener?: object) => {
        const l = listener as Listener;
        l.onCachedMessages?.(['c1']);
        l.onServerMessages?.(['s1', 's2']);
        return Promise.resolve([]);
      }),
      fetchNext,
    };
    await fetchTwoPhase(request, 'previous', 'messages', h);
    expect(fetchNext).not.toHaveBeenCalled();
    expect(h.onCached).toHaveBeenCalledWith(['c1']);
    expect(h.onServer).toHaveBeenCalledWith(['s1', 's2']);
    expect(h.onError).not.toHaveBeenCalled();
  });

  it('a page that is not an array is an empty page', async () => {
    const h = handlers();
    await fetchTwoPhase(
      {
        fetchNext: (listener?: object) => {
          const l = listener as Listener;
          l.onCachedThreads?.(null);
          l.onServerThreads?.({ not: 'a page' });
          return Promise.resolve();
        },
      },
      'next',
      'threads',
      h
    );
    expect(h.onCached).toHaveBeenCalledWith([]);
    expect(h.onServer).toHaveBeenCalledWith([]);
  });

  it('a request without the method ends in one error naming it', async () => {
    const h = handlers();
    await fetchTwoPhase({}, 'previous', 'users', h);
    await fetchTwoPhase({}, 'next', 'users', h);
    expect(h.onError).toHaveBeenCalledTimes(2);
    const [[prevError, prevNotConnected], [nextError]] = h.onError.mock.calls as [
      [Error, boolean],
      [Error, boolean],
    ];
    expect(prevError.message).toBe('fetchPrevious is not available');
    expect(prevNotConnected).toBe(false);
    expect(nextError.message).toBe('fetchNext is not available');
  });

  it('a fetch that throws ends in an error', async () => {
    const h = handlers();
    const boom = new Error('boom');
    await fetchTwoPhase(
      {
        fetchNext: () => {
          throw boom;
        },
      },
      'next',
      'groups',
      h
    );
    expect(h.onError).toHaveBeenCalledWith(boom, false);
    expect(h.onServer).not.toHaveBeenCalled();
  });

  it('a non-Promise result waits for the listener', async () => {
    const h = handlers();
    let listener: Listener = {};
    const done = fetchTwoPhase(
      {
        fetchNext: (l?: object) => {
          listener = l as Listener;
          return null as unknown as Promise<unknown>;
        },
      },
      'next',
      'reactions',
      h
    );
    expect(h.onServer).not.toHaveBeenCalled();
    listener.onServerReactions?.(['r']);
    await done;
    expect(h.onServer).toHaveBeenCalledWith(['r']);
  });

  it('after the terminal, a late cached page, server page or error is ignored', async () => {
    const h = handlers();
    let listener: Listener = {};
    let reject: (e: unknown) => void = () => undefined;
    const done = fetchTwoPhase(
      {
        fetchNext: (l?: object) => {
          listener = l as Listener;
          return new Promise((_, rej) => {
            reject = rej;
          });
        },
      },
      'next',
      'conversations',
      h
    );
    listener.onError?.({ code: 'FAILED_TO_FETCH' });
    await done;
    listener.onCachedConversations?.(['late']);
    listener.onServerConversations?.(['late']);
    listener.onError?.({ code: 'OTHER' });
    reject({ code: 'FAILED_TO_FETCH' });
    await Promise.resolve();
    expect(h.onError).toHaveBeenCalledTimes(1);
    expect(h.onError).toHaveBeenCalledWith({ code: 'FAILED_TO_FETCH' }, true);
    expect(h.onCached).not.toHaveBeenCalled();
    expect(h.onServer).not.toHaveBeenCalled();
  });

  it("the Promise's rejection ends a read the listener never answered", async () => {
    const h = handlers();
    const offline = Object.assign(new Error('offline'), { code: 'ERROR_INTERNET_UNAVAILABLE' });
    await fetchTwoPhase(
      { fetchNext: () => Promise.reject(offline) },
      'next',
      'notificationFeed',
      h
    );
    expect(h.onError).toHaveBeenCalledWith(offline, true);
  });
});

/**
 * The no-hang backstop (P6): a read whose SDK Promise resolves without the
 * listener answering takes the resolved value as its server page. Before it,
 * such a read never settled, and the conversations list's
 * `offlineReadInFlightRef` (cleared only from the terminal) stayed set, so every
 * later `fetchNext` was deferred for good and the list stopped paging.
 *
 * Hardening: the 4.3.x SDKs fire `onServer…` together with the resolve, so no
 * current SDK reaches it.
 *
 * Review: Prajwal `two-phase.ts:95` on #2460. Angular's backstop is 1204799d.
 */
describe('fetchTwoPhase: the resolve-without-callback backstop', () => {
  let fake: OfflineSdkFake;
  beforeEach(() => {
    fake = installOfflineSdk({ enabled: true });
  });
  afterEach(() => {
    fake.restore();
  });

  const tick = () => new Promise<void>(resolve => setTimeout(resolve, 5));

  it('ends the read with the resolved page', async () => {
    const h = handlers();
    let ended = false;
    void fetchTwoPhase<string>(
      { fetchNext: () => Promise.resolve(['s1', 's2']) },
      'next',
      'conversations',
      h
    ).then(() => {
      ended = true;
    });
    await tick();
    expect(ended).toBe(true);
    expect(h.onServer).toHaveBeenCalledTimes(1);
    expect(h.onServer).toHaveBeenCalledWith(['s1', 's2']);
    expect(h.onError).not.toHaveBeenCalled();
  });

  it('a resolution that is not an array ends the read with an empty page', async () => {
    const h = handlers();
    await fetchTwoPhase<string>(
      { fetchNext: () => Promise.resolve(undefined) },
      'next',
      'users',
      h
    );
    await tick();
    expect(h.onServer).toHaveBeenCalledWith([]);
  });

  it('a callback fired in the same turn as the resolve still wins: onServer is not doubled', async () => {
    const h = handlers();
    await fetchTwoPhase<string>(
      {
        fetchNext: (listener?: object) => {
          const l = listener as Listener;
          l.onCachedMessages?.(['cached']);
          l.onServerMessages?.(['server']);
          return Promise.resolve(['resolved']);
        },
      },
      'next',
      'messages',
      h
    );
    await tick();
    expect(h.onCached).toHaveBeenCalledTimes(1);
    expect(h.onServer).toHaveBeenCalledTimes(1);
    expect(h.onServer).toHaveBeenCalledWith(['server']);
  });

  it('an error terminal is not overwritten by the later resolve', async () => {
    const h = handlers();
    await fetchTwoPhase<string>(
      {
        fetchNext: (listener?: object) => {
          (listener as Listener).onError?.({ code: 'FAILED_TO_FETCH' });
          return Promise.resolve(['late']);
        },
      },
      'next',
      'groups',
      h
    );
    await tick();
    expect(h.onError).toHaveBeenCalledTimes(1);
    expect(h.onServer).not.toHaveBeenCalled();
  });

  it('a rejection still ends the read through onError, not as a server page', async () => {
    const h = handlers();
    await fetchTwoPhase<string>(
      { fetchNext: () => Promise.reject(new Error('nope')) },
      'next',
      'reactions',
      h
    );
    await tick();
    expect(h.onError).toHaveBeenCalledTimes(1);
    expect(h.onServer).not.toHaveBeenCalled();
  });
});
