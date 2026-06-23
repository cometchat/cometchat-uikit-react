/**
 * useCometChatCallButtons — standalone hook for managing the call lifecycle.
 *
 * Handles:
 * - Call initiation (user calls via CometChat.initiateCall, group calls via custom message)
 * - Outgoing call state (waiting for answer)
 * - Ongoing call state (active call session)
 * - SDK call listeners (accepted, rejected, cancelled)
 * - UI event listeners (call/ended, call/rejected, call/join)
 */

import { useCallback, useEffect, useId, useReducer } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { useLoggedInUser } from '../../hooks/useLoggedInUser';
import { useCometChatEvents } from '../../hooks/useCometChatEvents';
import { usePublishEvent } from '../../hooks/usePublishEvent';
import { CometChatUIKitConstants } from '../../constants/CometChatUIKitConstants';
import { CometChatMessageStatus } from '../../context/CometChatEvents.types';

// --- State ---

export interface CometChatCallButtonsState {
  /** Active outgoing call object. */
  activeCall: CometChat.Call | null;
  /** Whether call buttons are disabled (during active call). */
  callButtonsDisabled: boolean;
  /** Whether to show outgoing call screen. */
  showOutgoingCallScreen: boolean;
  /** Whether to show ongoing call screen. */
  showOngoingCall: boolean;
  /** Call session ID. */
  callSessionId: string;
  /** Whether current call uses direct calling (group) vs default (user). */
  isDirectCalling: boolean;
  /** Whether current group call is audio-only. */
  isGroupAudioCall: boolean;
}

// --- Actions ---

type CometChatCallButtonsAction =
  | { type: 'SET_ACTIVE_CALL'; call: CometChat.Call }
  | { type: 'SET_CALL_BUTTONS_DISABLED'; disabled: boolean }
  | { type: 'SHOW_OUTGOING_CALL_SCREEN'; show: boolean }
  | {
      type: 'SHOW_ONGOING_CALL';
      show: boolean;
      sessionId: string;
      isDirectCalling: boolean;
      isGroupAudioCall?: boolean;
    }
  | { type: 'RESET_CALL_STATE' };

const initialCallButtonsState: CometChatCallButtonsState = {
  activeCall: null,
  callButtonsDisabled: false,
  showOutgoingCallScreen: false,
  showOngoingCall: false,
  callSessionId: '',
  isDirectCalling: false,
  isGroupAudioCall: false,
};

function callButtonsReducer(
  state: CometChatCallButtonsState,
  action: CometChatCallButtonsAction
): CometChatCallButtonsState {
  switch (action.type) {
    case 'SET_ACTIVE_CALL':
      return {
        ...state,
        activeCall: action.call,
        callButtonsDisabled: true,
      };

    case 'SET_CALL_BUTTONS_DISABLED':
      return {
        ...state,
        callButtonsDisabled: action.disabled,
      };

    case 'SHOW_OUTGOING_CALL_SCREEN':
      return {
        ...state,
        showOutgoingCallScreen: action.show,
      };

    case 'SHOW_ONGOING_CALL':
      return {
        ...state,
        showOngoingCall: action.show,
        callSessionId: action.sessionId,
        isDirectCalling: action.isDirectCalling,
        isGroupAudioCall: action.isGroupAudioCall ?? false,
        showOutgoingCallScreen: false,
        callButtonsDisabled: action.show,
      };

    case 'RESET_CALL_STATE':
      return initialCallButtonsState;

    default:
      return state;
  }
}

// --- Hook Options ---

export interface UseCometChatCallButtonsOptions {
  user?: CometChat.User;
  group?: CometChat.Group;
  onError?: ((error: CometChat.CometChatException) => void) | null;
}

export function useCometChatCallButtons(options: UseCometChatCallButtonsOptions) {
  const { user, group, onError } = options;
  const [state, dispatch] = useReducer(callButtonsReducer, initialCallButtonsState);
  const instanceId = useId();
  const loggedInUser = useLoggedInUser();
  const publish = usePublishEvent();

  // --- Error handler ---
  const handleError = useCallback(
    (error: unknown) => {
      if (onError) {
        onError(error as CometChat.CometChatException);
      }
    },
    [onError]
  );

  // --- Reset on user/group change ---
  useEffect(() => {
    dispatch({ type: 'RESET_CALL_STATE' });
  }, [user, group]);

  // --- Call listener ---
  useEffect(() => {
    if (!user && !group) return;

    const listenerId = `CometChatCallButtons_call_${instanceId}`;

    CometChat.addCallListener(
      listenerId,
      new CometChat.CallListener({
        onIncomingCallReceived: () => {
          dispatch({ type: 'SET_CALL_BUTTONS_DISABLED', disabled: true });
        },
        onIncomingCallCancelled: () => {
          dispatch({ type: 'SET_CALL_BUTTONS_DISABLED', disabled: false });
        },
        onOutgoingCallAccepted: (call: CometChat.Call) => {
          const currentCall = state.activeCall;
          const senderUid = call.getSender().getUid();

          // Ignore if the sender is the logged-in user (callee's own listener)
          if (senderUid === loggedInUser?.getUid()) {
            return;
          }

          // Only handle if it matches our active outgoing call
          if (call.getSessionId() !== currentCall?.getSessionId()) {
            return;
          }

          // Our outgoing call was accepted — transition to ongoing call
          dispatch({
            type: 'SHOW_ONGOING_CALL',
            show: true,
            sessionId: call.getSessionId(),
            isDirectCalling: false,
          });
        },
        onOutgoingCallRejected: () => {
          CometChat.clearActiveCall();
          dispatch({ type: 'RESET_CALL_STATE' });
        },
      })
    );

    return () => {
      CometChat.removeCallListener(listenerId);
    };
  }, [user, group, instanceId, state.activeCall, loggedInUser]);

  // --- UI Events subscription ---
  useCometChatEvents(
    event => {
      if (event.type === 'ui:call/rejected') {
        CometChat.clearActiveCall();
        dispatch({ type: 'SET_CALL_BUTTONS_DISABLED', disabled: false });
      }
      if (event.type === 'ui:call/ended') {
        CometChat.clearActiveCall();
        dispatch({ type: 'RESET_CALL_STATE' });
      }
    },
    [user?.getUid(), group?.getGuid()]
  );

  // --- Send group call "meeting" custom message ---
  const sendGroupCallMessage = useCallback(
    (targetGroup: CometChat.Group, sessionId: string, callType: string) => {
      const receiverId = targetGroup.getGuid();
      const customData = {
        sessionID: sessionId,
        sessionId: sessionId,
        callType,
      };

      const customMessage = new CometChat.CustomMessage(
        receiverId,
        CometChat.RECEIVER_TYPE.GROUP,
        CometChatUIKitConstants.calls.meeting,
        customData
      );

      (
        customMessage as unknown as { setMetadata: (m: Record<string, unknown>) => void }
      ).setMetadata({ incrementUnreadCount: true });

      (
        customMessage as unknown as { shouldUpdateConversation: (v: boolean) => void }
      ).shouldUpdateConversation(true);
      if (loggedInUser) {
        customMessage.setSender(loggedInUser);
      }

      CometChat.sendCustomMessage(customMessage).then(
        sentMessage => {
          publish({
            type: 'ui:message/sent',
            message: sentMessage,
            status: CometChatMessageStatus.success,
          });
        },
        (error: unknown) => {
          handleError(error);
        }
      );
    },
    [loggedInUser, publish, handleError]
  );

  const initiateAudioCall = useCallback(async () => {
    try {
      if (user) {
        const callObj = new CometChat.Call(
          user.getUid(),
          CometChat.CALL_TYPE.AUDIO,
          CometChat.RECEIVER_TYPE.USER
        );
        const outgoingCall = await CometChat.initiateCall(callObj);
        publish({ type: 'ui:call/outgoing', call: outgoingCall });
        dispatch({ type: 'SET_ACTIVE_CALL', call: outgoingCall });
        dispatch({ type: 'SHOW_OUTGOING_CALL_SCREEN', show: true });
      } else if (group) {
        const sessionId = group.getGuid();
        sendGroupCallMessage(group, sessionId, 'audio');
        dispatch({
          type: 'SHOW_ONGOING_CALL',
          show: true,
          sessionId,
          isDirectCalling: true,
          isGroupAudioCall: true,
        });
      }
    } catch (error) {
      handleError(error);
    }
  }, [user, group, publish, sendGroupCallMessage, handleError]);

  const initiateVideoCall = useCallback(async () => {
    try {
      if (user) {
        const callObj = new CometChat.Call(
          user.getUid(),
          CometChat.CALL_TYPE.VIDEO,
          CometChat.RECEIVER_TYPE.USER
        );
        const outgoingCall = await CometChat.initiateCall(callObj);
        publish({ type: 'ui:call/outgoing', call: outgoingCall });
        dispatch({ type: 'SET_ACTIVE_CALL', call: outgoingCall });
        dispatch({ type: 'SHOW_OUTGOING_CALL_SCREEN', show: true });
      } else if (group) {
        const sessionId = group.getGuid();
        sendGroupCallMessage(group, sessionId, 'video');
        dispatch({
          type: 'SHOW_ONGOING_CALL',
          show: true,
          sessionId,
          isDirectCalling: true,
          isGroupAudioCall: false,
        });
      }
    } catch (error) {
      handleError(error);
    }
  }, [user, group, publish, sendGroupCallMessage, handleError]);

  const cancelOutgoingCall = useCallback(async () => {
    const call = state.activeCall;
    if (!call) return;

    try {
      const sessionId = call.getSessionId();
      await CometChat.rejectCall(sessionId, CometChat.CALL_STATUS.CANCELLED);
      CometChat.clearActiveCall();
    } catch (error) {
      handleError(error);
    }
    dispatch({ type: 'RESET_CALL_STATE' });
  }, [state.activeCall, handleError]);

  const resetCallState = useCallback(() => {
    dispatch({ type: 'RESET_CALL_STATE' });
  }, []);

  return {
    ...state,
    initiateAudioCall,
    initiateVideoCall,
    cancelOutgoingCall,
    resetCallState,
  };
}
