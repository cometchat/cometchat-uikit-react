import type {
  CometChatMessageInformationFetchState,
  CometChatUserReceiptInfo,
} from './CometChatMessageInformation.types';

/** State for the CometChatMessageInformation component. */
export interface CometChatMessageInformationState {
  /** Fetch lifecycle state. */
  fetchState: CometChatMessageInformationFetchState;
  /** User receipts for group messages. */
  userReceipts: CometChatUserReceiptInfo[];
  /** Read timestamp for 1-on-1 messages (Unix seconds). */
  oneOnOneReadAt: number;
  /** Delivered timestamp for 1-on-1 messages (Unix seconds). */
  oneOnOneDeliveredAt: number;
  /** Error message, if any. */
  error: string | null;
}

/** Actions for the message information reducer. */
export type CometChatMessageInformationAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS_GROUP'; userReceipts: CometChatUserReceiptInfo[] }
  | { type: 'FETCH_SUCCESS_ONE_ON_ONE'; readAt: number; deliveredAt: number }
  | { type: 'FETCH_ERROR'; error: string }
  | { type: 'UPDATE_RECEIPT'; uid: string; readAt?: number; deliveredAt?: number }
  | { type: 'UPDATE_ONE_ON_ONE_RECEIPT'; readAt?: number; deliveredAt?: number }
  | { type: 'RESET' };

export const initialState: CometChatMessageInformationState = {
  fetchState: 'idle',
  userReceipts: [],
  oneOnOneReadAt: 0,
  oneOnOneDeliveredAt: 0,
  error: null,
};

/** Reducer for CometChatMessageInformation state. Pure function — no side effects. */
export function messageInformationReducer(
  state: CometChatMessageInformationState,
  action: CometChatMessageInformationAction
): CometChatMessageInformationState {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, fetchState: 'loading', error: null };

    case 'FETCH_SUCCESS_GROUP':
      return {
        ...state,
        fetchState: action.userReceipts.length === 0 ? 'empty' : 'loaded',
        userReceipts: action.userReceipts,
      };

    case 'FETCH_SUCCESS_ONE_ON_ONE':
      return {
        ...state,
        fetchState: 'loaded',
        oneOnOneReadAt: action.readAt,
        oneOnOneDeliveredAt: action.deliveredAt,
      };

    case 'FETCH_ERROR':
      return { ...state, fetchState: 'error', error: action.error };

    case 'UPDATE_RECEIPT': {
      const updated = state.userReceipts.map(r =>
        r.user.getUid() === action.uid
          ? {
              ...r,
              readAt: action.readAt ?? r.readAt,
              deliveredAt: action.deliveredAt ?? r.deliveredAt,
            }
          : r
      );
      return { ...state, userReceipts: updated };
    }

    case 'UPDATE_ONE_ON_ONE_RECEIPT':
      return {
        ...state,
        oneOnOneReadAt: action.readAt ?? state.oneOnOneReadAt,
        oneOnOneDeliveredAt: action.deliveredAt ?? state.oneOnOneDeliveredAt,
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}
