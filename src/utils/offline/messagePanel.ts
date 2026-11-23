/**
 * The pinned and saved panels on the offline (ON) path: their two-phase reads
 * (`MessagesRequest` with `pinned` / `saved`, read with `fetchPrevious`) and
 * the reducer wrapper that applies them. The panels' public reducers, action
 * types and managers are untouched; this module is internal and runs only
 * with offline on (BEH-PIN-02, BEH-SAVE-02, UIT-LIST-03/10).
 *
 * @internal
 */
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatFetchState } from '../../types';
import { copyRequestBuilder } from '../copyRequestBuilder';
import {
  readEntityPage,
  reduceEntityPage,
  reduceEntityPageError,
  offlineListStates,
  type EntityPagePayload,
} from './entityList';

/** A message's identity in a panel: its server id (panel rows always have one). */
export const panelMessageIdOf = (message: CometChat.BaseMessage): string => String(message.getId());

/** The panel actions only the offline path dispatches. */
export type MessagePanelOfflineAction =
  | { type: 'OFFLINE_PAGE'; page: EntityPagePayload<CometChat.BaseMessage> }
  | { type: 'OFFLINE_PAGE_ERROR'; notConnected: boolean; hasMore: boolean; error: string };

interface PanelState {
  messages: CometChat.BaseMessage[];
  fetchState: CometChatFetchState;
  hasMore: boolean;
  error: string | null;
  /** Offline: nothing saved and not connected (never set offline off). */
  connectToLoad?: boolean;
}

function isOfflineAction(action: { type: string }): action is MessagePanelOfflineAction {
  return action.type === 'OFFLINE_PAGE' || action.type === 'OFFLINE_PAGE_ERROR';
}

/**
 * Wrap a panel's reducer so it also applies the offline path's page actions.
 * The server's order is kept; `order`, when given, re-sorts as the panel does
 * today on every merge (the saved panel sorts by sent time).
 */
export function withOfflinePages<S extends PanelState, A extends { type: string }>(
  reducer: (state: S, action: A) => S,
  order?: (a: CometChat.BaseMessage, b: CometChat.BaseMessage) => number
): (state: S, action: A | MessagePanelOfflineAction) => S {
  return (state, action) => {
    if (!isOfflineAction(action)) return reducer(state, action);
    if (action.type === 'OFFLINE_PAGE') {
      const next = reduceEntityPage(
        { rows: state.messages, fetchState: state.fetchState, hasMore: state.hasMore },
        action.page,
        panelMessageIdOf
      );
      return {
        ...state,
        messages: order ? [...next.rows].sort(order) : next.rows,
        fetchState: next.fetchState,
        hasMore: next.hasMore,
        ...(action.page.phase === 'server' && { error: null, connectToLoad: false }),
      };
    }
    const next = reduceEntityPageError(
      { rows: state.messages, fetchState: state.fetchState, hasMore: state.hasMore },
      action.notConnected,
      action.hasMore
    );
    return {
      ...state,
      fetchState: next.fetchState,
      hasMore: next.hasMore,
      error: action.notConnected && next.rows.length > 0 ? state.error : action.error,
      ...offlineListStates(action.notConnected, false, next.rows.length),
    };
  };
}

/** The request and page size an offline panel read uses. */
export interface PanelRequest {
  request: CometChat.MessagesRequest;
  pageSize: number;
}

function withPageSize(request: CometChat.MessagesRequest, fallback: number): PanelRequest {
  const limit = typeof request.getLimit === 'function' ? request.getLimit() : fallback;
  return { request, pageSize: limit || fallback };
}

/**
 * The pinned request, built as the pinned manager builds it today (pinned flag
 * and conversation scope re-asserted) but on a copy of the caller's builder.
 * Null without a scope (today's answer: nothing to ask for).
 */
export function buildPinnedRequest(
  uid: string | undefined,
  guid: string | undefined,
  builder: CometChat.MessagesRequestBuilder | undefined,
  makeDefault: () => CometChat.MessagesRequestBuilder,
  pageSize: number
): PanelRequest | null {
  if (!guid && !uid) return null;
  const b = builder ? copyRequestBuilder(builder) : makeDefault();
  b.setPinned(true);
  if (guid) b.setGUID(guid);
  else if (uid) b.setUID(uid);
  return withPageSize(b.build(), pageSize);
}

/** The saved request, built on a copy of the caller's builder. */
export function buildSavedRequest(
  builder: CometChat.MessagesRequestBuilder | undefined,
  makeDefault: () => CometChat.MessagesRequestBuilder,
  pageSize: number
): PanelRequest {
  const b = builder ? copyRequestBuilder(builder) : makeDefault();
  return withPageSize(b.setSaved(true).build(), pageSize);
}

export interface PanelReadOptions {
  panel: PanelRequest;
  isStale: () => boolean;
  shown: () => readonly CometChat.BaseMessage[];
  dispatch: (action: MessagePanelOfflineAction) => void;
  /** Today's fallback error text. */
  errorText: string;
}

/**
 * One two-phase panel page: `fetchPrevious` with the messages listener. A
 * full server page means there may be more (today's rule); a cached page
 * never ends the list. Resolves after the terminal; never rejects.
 */
export function readPanelPage(options: PanelReadOptions): Promise<void> {
  const { panel, isStale, shown, dispatch, errorText } = options;
  return readEntityPage<CometChat.BaseMessage>(
    {
      request: panel.request,
      kind: 'messages',
      direction: 'previous',
      refresh: false,
      idOf: panelMessageIdOf,
      isStale,
      shown,
      hasMoreOf: page => page.length >= panel.pageSize,
    },
    {
      onPage: page => {
        dispatch({ type: 'OFFLINE_PAGE', page });
      },
      onError: (error, notConnected, hasMore) => {
        dispatch({
          type: 'OFFLINE_PAGE_ERROR',
          notConnected,
          hasMore,
          error: error instanceof Error ? error.message : errorText,
        });
      },
    }
  );
}
