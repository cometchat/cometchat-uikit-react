/**
 * Two-phase list reads on the offline (ON) path: the cached page, then the
 * server page, then exactly one terminal. Never used with offline off, where
 * the managers keep today's single Promise-form fetch.
 *
 * @internal
 */
import { makeSdkListener, type OfflineSdkSurface } from './gate';
import { isNotConnectedError } from './reconcile';

export interface TwoPhaseHandlers<T> {
  onCached(page: T[]): void;
  onServer(page: T[]): void;
  /** `notConnected` = an offline read past the cache: keep what is shown. */
  onError(error: unknown, notConnected: boolean): void;
}

/** A request object with the SDK's two-phase overloads (any read type). */
export interface TwoPhaseRequest {
  fetchPrevious?(listener?: object): Promise<unknown>;
  fetchNext?(listener?: object): Promise<unknown>;
}

/**
 * The SDK's two-phase listener for each read type: the listener class and the
 * suffix of its `onCached<Suffix>` / `onServer<Suffix>` handlers (SDK 4.3
 * `index.d.ts`, BEH-SNAP-03/07/08/09).
 */
export const TWO_PHASE_KINDS = {
  messages: { listenerClass: 'MessageFetchListener', suffix: 'Messages' },
  conversations: { listenerClass: 'ConversationFetchListener', suffix: 'Conversations' },
  users: { listenerClass: 'UserFetchListener', suffix: 'Users' },
  groups: { listenerClass: 'GroupFetchListener', suffix: 'Groups' },
  groupMembers: { listenerClass: 'GroupMemberFetchListener', suffix: 'GroupMembers' },
  bannedMembers: { listenerClass: 'BannedMemberFetchListener', suffix: 'BannedGroupMembers' },
  reactions: { listenerClass: 'ReactionFetchListener', suffix: 'Reactions' },
  notificationFeed: {
    listenerClass: 'NotificationFeedFetchListener',
    suffix: 'NotificationFeedItems',
  },
  threads: { listenerClass: 'ThreadFetchListener', suffix: 'Threads' },
} as const satisfies Record<string, { listenerClass: keyof OfflineSdkSurface; suffix: string }>;

/** A read type with a two-phase listener. */
export type TwoPhaseKind = keyof typeof TWO_PHASE_KINDS;

/**
 * One two-phase page read. Resolves after its terminal (server page or
 * error); never rejects. The SDK settles its Promise too, and rejects it
 * offline: the listener is the channel, and the Promise's rejection only ends
 * the read when the listener never answered.
 *
 * The Promise's *resolution* is the backstop that keeps a read from hanging
 * (P6). A read that resolved with neither `onServer…` nor `onError` by the next
 * task takes the resolved value as its server page and ends. Without it, such a
 * read never settles, and a caller that clears its in-flight guard from the
 * terminal (the conversations list's `offlineReadInFlightRef`, every list's
 * `useDeferredLoadMore`) defers every later page for good: the list stops
 * paging until it is remounted.
 */
export function fetchTwoPhase<T>(
  request: TwoPhaseRequest,
  direction: 'previous' | 'next',
  kind: TwoPhaseKind,
  handlers: TwoPhaseHandlers<T>
): Promise<void> {
  const { suffix, listenerClass } = TWO_PHASE_KINDS[kind];
  return new Promise<void>(resolve => {
    let settled = false;
    const end = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    const onError = (error: unknown) => {
      if (settled) return;
      handlers.onError(error, isNotConnectedError(error));
      end();
    };
    const onServer = (page: unknown) => {
      if (settled) return;
      handlers.onServer(Array.isArray(page) ? (page as T[]) : []);
      end();
    };
    const listener = makeSdkListener(listenerClass, {
      [`onCached${suffix}`]: (page: unknown) => {
        if (!settled) handlers.onCached(Array.isArray(page) ? (page as T[]) : []);
      },
      [`onServer${suffix}`]: onServer,
      onError,
    });
    try {
      const result: unknown =
        direction === 'previous'
          ? request.fetchPrevious?.(listener)
          : request.fetchNext?.(listener);
      if (result === undefined) {
        onError(
          new Error(`fetch${direction === 'previous' ? 'Previous' : 'Next'} is not available`)
        );
        return;
      }
      if (result && typeof (result as Promise<unknown>).then === 'function') {
        (result as Promise<unknown>).then(page => {
          // The 4.3.x SDKs fire onServer… together with the resolve, so the read
          // has already ended here and nothing more is scheduled. Only an SDK
          // that resolves without answering reaches the backstop, one task later
          // so a callback fired in the same turn as the resolve still wins.
          if (settled) return;
          setTimeout(() => {
            onServer(page);
          }, 0);
        }, onError);
      }
    } catch (error) {
      onError(error);
    }
  });
}
