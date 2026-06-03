/* eslint-disable @typescript-eslint/no-explicit-any */

/** Fetch lifecycle state for call logs. */
export type CometChatCallLogsFetchState = 'idle' | 'loading' | 'loaded' | 'error' | 'empty';

export interface CometChatCallLogsState {
  callList: any[];
  fetchState: CometChatCallLogsFetchState;
  hasMore: boolean;
  error: string | null;
}

export type CometChatCallLogsAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; calls: any[]; hasMore: boolean }
  | { type: 'FETCH_ERROR'; error: string }
  | { type: 'RESET' };

export const initialCallLogsState: CometChatCallLogsState = {
  callList: [],
  fetchState: 'idle',
  hasMore: true,
  error: null,
};

export function callLogsReducer(
  state: CometChatCallLogsState,
  action: CometChatCallLogsAction
): CometChatCallLogsState {
  switch (action.type) {
    case 'FETCH_START':
      return {
        ...state,
        fetchState: state.callList.length === 0 ? 'loading' : state.fetchState,
        error: null,
      };
    case 'FETCH_SUCCESS': {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const merged = [...state.callList, ...action.calls] as any[];
      return {
        ...state,
        callList: merged,
        fetchState: merged.length === 0 ? 'empty' : 'loaded',
        hasMore: action.hasMore,
      };
    }
    case 'FETCH_ERROR':
      return {
        ...state,
        fetchState: state.callList.length === 0 ? 'error' : state.fetchState,
        error: action.error,
      };
    case 'RESET':
      return initialCallLogsState;
    default:
      return state;
  }
}
