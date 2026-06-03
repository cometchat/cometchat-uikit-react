/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
/**
 * useOngoingCall — hook for managing ongoing call sessions.
 *
 * Handles:
 * - Generating a call token via CometChatUIKitCalls.generateToken()
 * - Joining a call session via CometChatUIKitCalls.joinSession()
 * - Leaving a call session via CometChatUIKitCalls.leaveSession()
 * - Registering granular event listeners via addEventListener()
 *
 * Usage:
 * ```tsx
 * const { startCall, endSession, endCall, isCallActive } = useOngoingCall({
 *   sessionId: 'abc123',
 *   isAudioOnly: false,
 *   isDirectCalling: false,
 *   onCallEnded: () => { ... },
 *   onError: (err) => { ... },
 * });
 * ```
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatUIKitCalls } from '../CometChatUIKit/CometChatCalls';

export interface UseOngoingCallOptions {
  /** The call session ID. */
  sessionId: string;
  /** Whether this is an audio-only call. Default: false. */
  isAudioOnly?: boolean;
  /** Whether this uses direct calling (group) vs default calling (user). Default: false. */
  isDirectCalling?: boolean;
  /** Callback when the call ends (from any source). */
  onCallEnded?: () => void;
  /** Error callback. */
  onError?: (error: unknown) => void;
}

export interface UseOngoingCallReturn {
  /** Start the call session — renders the call UI into the provided element. */
  startCall: (callScreenFrame: HTMLElement) => Promise<void>;
  /** End the current session (local cleanup only). */
  endSession: () => void;
  /** End the call fully (server + local + events). */
  endCall: () => Promise<void>;
  /** Whether a call session is currently active. */
  isCallActive: boolean;
}

export function useOngoingCall(options: UseOngoingCallOptions): UseOngoingCallReturn {
  const { sessionId, isAudioOnly = false, isDirectCalling = false, onCallEnded, onError } = options;
  const [isCallActive, setIsCallActive] = useState(false);
  const sessionIdRef = useRef(sessionId);
  sessionIdRef.current = sessionId;
  const unsubscribersRef = useRef<(() => void)[]>([]);

  // Keep callbacks in refs to avoid recreating functions on every render
  const onCallEndedRef = useRef(onCallEnded);
  onCallEndedRef.current = onCallEnded;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const getCallSettings = useCallback(() => {
    return {
      sessionType: isAudioOnly ? 'VOICE' : 'VIDEO',
      layout: 'SIDEBAR',
      startAudioMuted: false,
      startVideoPaused: false,
      hideControlPanel: false,
      hideLeaveSessionButton: false,
      hideToggleAudioButton: false,
      hideToggleVideoButton: false,
    };
  }, [isAudioOnly]);

  // Register event listeners
  const registerEventListeners = useCallback(() => {
    if (!CometChatUIKitCalls) return;

    // Clean up any existing listeners
    unsubscribersRef.current.forEach(unsub => {
      unsub();
    });
    unsubscribersRef.current = [];

    const unsubSessionLeft = CometChatUIKitCalls.addEventListener('onSessionLeft', () => {
      if (!isDirectCalling) {
        CometChat.clearActiveCall();
      }
      setIsCallActive(false);
      onCallEndedRef.current?.();
    });

    const unsubLeaveButton = CometChatUIKitCalls.addEventListener(
      'onLeaveSessionButtonClicked',
      () => {
        const sid = sessionIdRef.current;
        if (!isDirectCalling) {
          CometChat.endCall(sid)
            .then(() => {
              CometChatUIKitCalls.leaveSession();
              setIsCallActive(false);
              onCallEndedRef.current?.();
            })
            .catch((err: unknown) => {
              onErrorRef.current?.(err);
            });
        } else {
          CometChatUIKitCalls.leaveSession();
          setIsCallActive(false);
          onCallEndedRef.current?.();
        }
      }
    );

    unsubscribersRef.current = [unsubSessionLeft, unsubLeaveButton];
  }, [isDirectCalling]);

  // Cleanup listeners on unmount
  useEffect(() => {
    return () => {
      unsubscribersRef.current.forEach(unsub => {
        unsub();
      });
      unsubscribersRef.current = [];
    };
  }, []);

  const startCall = useCallback(
    async (callScreenFrame: HTMLElement) => {
      if (!CometChatUIKitCalls) {
        onErrorRef.current?.(
          new Error('Calls SDK not available. Install @cometchat/calls-sdk-javascript.')
        );
        return;
      }

      try {
        const user = await CometChat.getLoggedinUser();
        if (!user) {
          throw new Error('No logged-in user found');
        }

        const sid = sessionIdRef.current;

        // Register event listeners before joining
        registerEventListeners();

        const tokenResponse = await CometChatUIKitCalls.generateToken(sid);
        const callToken = tokenResponse.token;

        const callSettings = getCallSettings();

        CometChatUIKitCalls.joinSession(callToken, callSettings, callScreenFrame);
        setIsCallActive(true);
      } catch (error) {
        onErrorRef.current?.(error);
      }
    },
    [getCallSettings, registerEventListeners]
  );

  const endSession = useCallback(() => {
    if (CometChatUIKitCalls) {
      CometChatUIKitCalls.leaveSession();
    }
    // Clean up listeners
    unsubscribersRef.current.forEach(unsub => {
      unsub();
    });
    unsubscribersRef.current = [];
    setIsCallActive(false);
  }, []);

  const endCall = useCallback(async () => {
    const sid = sessionIdRef.current;

    if (!isDirectCalling) {
      try {
        await CometChat.endCall(sid);
        endSession();
        onCallEnded?.();
      } catch (error) {
        onError?.(error);
      }
    } else {
      endSession();
      onCallEnded?.();
    }
  }, [isDirectCalling, endSession, onCallEnded, onError]);

  return { startCall, endSession, endCall, isCallActive };
}
