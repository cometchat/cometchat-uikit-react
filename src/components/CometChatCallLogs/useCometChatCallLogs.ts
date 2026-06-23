/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment */
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatUIKitCalls } from '../../CometChatUIKit/CometChatCalls';
import { CometChatCallLogsManager } from './CometChatCallLogsManager';
import { callLogsReducer, initialCallLogsState } from './CometChatCallLogs.reducer';

export interface UseCometChatCallLogsOptions {
  callLogRequestBuilder?: any;
  onError?: ((error: CometChat.CometChatException) => void) | null | undefined;
  onCallButtonClicked?: ((call: any) => void) | undefined;
}

/**
 * useCometChatCallLogs — hook for fetching and managing call logs.
 *
 * Call initiation and call state management is now handled by
 * CometChatCallButtons, which is used in the trailing view of each call log item.
 */
export function useCometChatCallLogs(options: UseCometChatCallLogsOptions = {}) {
  const { callLogRequestBuilder, onError } = options;
  const [state, dispatch] = useReducer(callLogsReducer, initialCallLogsState);
  const [loggedInUser, setLoggedInUser] = useState<CometChat.User | null>(null);
  const managerRef = useRef<CometChatCallLogsManager | null>(null);

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  // --- Get logged-in user ---
  useEffect(() => {
    CometChat.getLoggedinUser().then(
      (user: CometChat.User | null) => {
        if (user) setLoggedInUser(user);
      },
      (err: unknown) => onErrorRef.current?.(err as CometChat.CometChatException)
    );
  }, []);

  // --- Initialize manager and fetch first page ---
  useEffect(() => {
    if (!loggedInUser) return;

    // If Calls SDK is not available (calling disabled or SDK not installed), show error state
    if (!CometChatUIKitCalls) {
      dispatch({
        type: 'FETCH_ERROR',
        error: 'Calling is not enabled. Enable calling in UIKitSettings to view call logs.',
      });
      return;
    }

    const authToken = loggedInUser.getAuthToken();
    managerRef.current = CometChatCallLogsManager.createWithAuthToken(
      authToken,
      callLogRequestBuilder
    );
    dispatch({ type: 'RESET' });
    void fetchNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedInUser, callLogRequestBuilder]);

  // --- Fetch next page ---
  const fetchNext = useCallback(async () => {
    if (!managerRef.current || !state.hasMore || state.fetchState === 'loading') return;

    dispatch({ type: 'FETCH_START' });
    try {
      const calls = await managerRef.current.fetchNext();
      dispatch({
        type: 'FETCH_SUCCESS',
        calls,
        hasMore: calls.length > 0,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      dispatch({ type: 'FETCH_ERROR', error: message });
      onErrorRef.current?.(error as CometChat.CometChatException);
    }
  }, [state.hasMore, state.fetchState]);

  return {
    ...state,
    loggedInUser,
    fetchNext,
  };
}
