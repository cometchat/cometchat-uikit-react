/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import { useCallback, useEffect, useId, useReducer, useRef, useState } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatUIKitCalls } from '../../CometChatUIKit/CometChatCalls';
import { CometChatCallLogsManager } from './CometChatCallLogsManager';
import { callLogsReducer, initialCallLogsState } from './CometChatCallLogs.reducer';
import { verifyCallUser } from './CometChatCallLogs.utils';
import { useCometChatEvents } from '../../hooks/useCometChatEvents';

export interface UseCometChatCallLogsOptions {
  callLogRequestBuilder?: any;
  onError?: ((error: CometChat.CometChatException) => void) | null | undefined;
  onCallButtonClicked?: ((call: any) => void) | undefined;
}

export function useCometChatCallLogs(options: UseCometChatCallLogsOptions = {}) {
  const { callLogRequestBuilder, onError, onCallButtonClicked } = options;
  const [state, dispatch] = useReducer(callLogsReducer, initialCallLogsState);
  const [loggedInUser, setLoggedInUser] = useState<CometChat.User | null>(null);
  const managerRef = useRef<CometChatCallLogsManager | null>(null);
  const instanceId = useId();

  // Call state for outgoing/ongoing calls initiated from call logs
  const [showOutgoingCallScreen, setShowOutgoingCallScreen] = useState(false);
  const [showOngoingCall, setShowOngoingCall] = useState(false);
  const [activeCallObj, setActiveCallObj] = useState<CometChat.Call | null>(null);
  const [callSessionId, setCallSessionId] = useState<string | null>(null);
  const activeCallRef = useRef<CometChat.Call | null>(null);

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

  // --- Initiate call from call logs ---
  const initiateCall = useCallback((callType: string, uid: string) => {
    const callObj = new CometChat.Call(uid, callType, CometChat.RECEIVER_TYPE.USER);
    CometChat.initiateCall(callObj).then(
      (outgoingCall: CometChat.Call) => {
        activeCallRef.current = outgoingCall;
        setActiveCallObj(outgoingCall);
        setShowOutgoingCallScreen(true);
      },
      (error: unknown) => {
        onErrorRef.current?.(error as CometChat.CometChatException);
      }
    );
  }, []);

  // --- Handle call button click (trailing view) ---
  const handleCallButtonClick = useCallback(
    (call: any) => {
      if (onCallButtonClicked) {
        onCallButtonClicked(call);
      } else if (loggedInUser) {
        const entity = verifyCallUser(call, loggedInUser);
        const uid: string = (entity?.uid ?? entity?.getUid?.()) as string;
        const type: string = (call.type ?? call.getType?.() ?? 'audio') as string;
        if (uid) {
          initiateCall(type, uid);
        }
      }
    },
    [onCallButtonClicked, loggedInUser, initiateCall]
  );

  // --- Cancel outgoing call ---
  const cancelOutgoingCall = useCallback(() => {
    if (!activeCallObj) return;
    CometChat.rejectCall(activeCallObj.getSessionId(), CometChat.CALL_STATUS.CANCELLED).then(
      () => {
        setActiveCallObj(null);
        activeCallRef.current = null;
        setShowOutgoingCallScreen(false);
      },
      (error: unknown) => {
        setShowOutgoingCallScreen(false);
        onErrorRef.current?.(error as CometChat.CometChatException);
      }
    );
  }, [activeCallObj]);

  // --- Call listener for outgoing call accepted/rejected ---
  useEffect(() => {
    if (!loggedInUser) return;

    const listenerId = `CometChatCallLogs_call_${instanceId}`;
    CometChat.addCallListener(
      listenerId,
      new CometChat.CallListener({
        onOutgoingCallRejected: (callObj: CometChat.Call) => {
          if (callObj.getSessionId() === activeCallRef.current?.getSessionId()) {
            setActiveCallObj(null);
            activeCallRef.current = null;
            setShowOutgoingCallScreen(false);
            setShowOngoingCall(false);
          }
        },
        onOutgoingCallAccepted: (callObj: CometChat.Call) => {
          if (callObj.getSessionId() === activeCallRef.current?.getSessionId()) {
            setShowOutgoingCallScreen(false);
            setCallSessionId(callObj.getSessionId());
            setShowOngoingCall(true);
            setActiveCallObj(null);
            activeCallRef.current = null;
          }
        },
      })
    );

    return () => {
      CometChat.removeCallListener(listenerId);
    };
  }, [loggedInUser, instanceId]);

  // --- Listen for call ended events ---
  useCometChatEvents(event => {
    if (event.type === 'ui:call/ended') {
      setShowOngoingCall(false);
      setCallSessionId(null);
      setActiveCallObj(null);
      activeCallRef.current = null;
    }
  }, []);

  // --- Close call screen ---
  const closeCallScreen = useCallback(() => {
    setShowOngoingCall(false);
    setCallSessionId(null);
    setActiveCallObj(null);
    activeCallRef.current = null;
  }, []);

  return {
    ...state,
    loggedInUser,
    fetchNext,
    handleCallButtonClick,
    initiateCall,
    cancelOutgoingCall,
    closeCallScreen,
    showOutgoingCallScreen,
    showOngoingCall,
    activeCallObj,
    callSessionId,
  };
}
