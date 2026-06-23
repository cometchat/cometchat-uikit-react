import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatOngoingCallProps } from './CometChatOngoingCall.types';
import { CometChatUIKitCalls } from '../../CometChatUIKit/CometChatCalls';
import { useGlobalConfig } from '../../context/GlobalConfigContext';
import { useLocale } from '../../context/locale/LocaleContext';
import { useCometChatEvents } from '../../hooks/useCometChatEvents';

/**
 * CometChatOngoingCall — renders the Calls SDK call UI in a full-screen container.
 *
 * When mounted with a valid sessionID:
 * 1. Gets the logged-in user's auth token
 * 2. Generates a call token via CometChatUIKitCalls.generateToken()
 * 3. Registers event listeners via CometChatUIKitCalls.addEventListener()
 * 4. Joins the session via CometChatUIKitCalls.joinSession()
 *
 * The Calls SDK renders its own UI (video/audio, controls) into the container element.
 */
export const CometChatOngoingCall: React.FC<CometChatOngoingCallProps> = ({
  sessionID,
  isAudioOnly = false,
  isDirectCalling = false,
  callSettings: callSettingsProp,
  onCallEnded,
  onError,
  className,
}) => {
  const { getLocalizedString } = useLocale();
  const callScreenFrameRef = useRef<HTMLDivElement | null>(null);
  const [loggedInUser, setLoggedInUser] = useState<CometChat.User | null>(null);
  const globalConfig = useGlobalConfig();
  const unsubscribersRef = useRef<(() => void)[]>([]);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const effectiveCallSettings = callSettingsProp ?? globalConfig.callSettingsBuilder ?? null;

  // Keep callbacks in refs to avoid stale closures
  const onCallEndedRef = useRef(onCallEnded);
  onCallEndedRef.current = onCallEnded;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  // Get logged-in user on mount
  useEffect(() => {
    CometChat.getLoggedinUser().then(
      (user: CometChat.User | null) => {
        if (user) {
          setLoggedInUser(user);
        }
      },
      (error: unknown) => {
        onErrorRef.current?.(error as CometChat.CometChatException);
      }
    );
  }, []);

  const getCallSettings = useCallback(() => {
    if (!CometChatUIKitCalls) return null;

    if (effectiveCallSettings) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return effectiveCallSettings;
    }

    return {
      sessionType: isAudioOnly ? 'VOICE' : 'VIDEO',
      startAudioMuted: false,
      startVideoPaused: false,
      hideControlPanel: false,
      hideLeaveSessionButton: false,
      hideToggleAudioButton: false,
      hideToggleVideoButton: false,
    };
  }, [isAudioOnly, effectiveCallSettings]);

  // Register event listeners
  const registerEventListeners = useCallback(() => {
    if (!CometChatUIKitCalls) return;

    // Clean up any existing listeners
    unsubscribersRef.current.forEach(unsub => {
      unsub();
    });
    unsubscribersRef.current = [];

    /* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */

    const unsubSessionLeft = CometChatUIKitCalls.addEventListener('onSessionLeft', () => {
      if (!isDirectCalling) {
        CometChat.clearActiveCall();
      }
      onCallEndedRef.current?.();
    });

    const unsubLeaveButton = CometChatUIKitCalls.addEventListener(
      'onLeaveSessionButtonClicked',
      () => {
        if (!isDirectCalling) {
          CometChat.endCall(sessionID)
            .then(() => {
              CometChatUIKitCalls.leaveSession();
              CometChat.clearActiveCall();
              onCallEndedRef.current?.();
            })
            .catch((err: unknown) => {
              console.error('[CometChatOngoingCall] endCall error:', err);
              onErrorRef.current?.(err as CometChat.CometChatException);
            });
        } else {
          CometChatUIKitCalls.leaveSession();
          onCallEndedRef.current?.();
        }
      }
    );

    /* eslint-enable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    unsubscribersRef.current = [unsubSessionLeft, unsubLeaveButton];
  }, [isDirectCalling, sessionID]);

  // Start the call session once we have the logged-in user and a valid sessionID
  const startCall = useCallback(() => {
    if (!loggedInUser || !sessionID) return;

    // Get the Calls SDK — re-read from the module in case it was loaded after mount
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const callsSDK = CometChatUIKitCalls;
    if (!callsSDK) {
      console.error(
        '[CometChatOngoingCall] CometChatUIKitCalls is null — Calls SDK not initialized. Ensure @cometchat/calls-sdk-javascript is installed and callingEnabled={true} is passed to CometChatProvider.'
      );
      onErrorRef.current?.(
        new Error(
          'Calls SDK not available. Install @cometchat/calls-sdk-javascript and pass callingEnabled={true} to CometChatProvider.'
        ) as unknown as CometChat.CometChatException
      );
      return;
    }

    // Register event listeners before joining
    registerEventListeners();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    callsSDK.generateToken(sessionID).then(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (res: any) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        callsSDK.joinSession(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          res?.token,
          getCallSettings(),
          callScreenFrameRef.current
        );
      },
      (err: unknown) => {
        console.error('[CometChatOngoingCall] generateToken error:', err);
        onErrorRef.current?.(err as CometChat.CometChatException);
      }
    );
  }, [sessionID, getCallSettings, loggedInUser, registerEventListeners]);

  useEffect(() => {
    if (sessionID && loggedInUser) {
      startCall();
    }

    // Cleanup event listeners on unmount
    return () => {
      unsubscribersRef.current.forEach(unsub => {
        unsub();
      });
      unsubscribersRef.current = [];
    };
  }, [sessionID, loggedInUser, startCall]);

  useCometChatEvents(
    event => {
      if (event.type === 'call/ended') {
        const call = event.call;
        if (call.getSessionId() === sessionID) {
          if (!isDirectCalling) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            CometChatUIKitCalls?.leaveSession();
            CometChat.clearActiveCall();
          }
          onCallEndedRef.current?.();
        }
      }
    },
    [sessionID, isDirectCalling]
  );

  if (!sessionID) return null;

  const rootClass = ['cometchat-ongoing-call', className].filter(Boolean).join(' ');

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
      }}
    >
      <div
        className={rootClass}
        ref={callScreenFrameRef}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 0,
          border: 'none',
        }}
        role="dialog"
        aria-label={getLocalizedString('accessibility_ongoing_call')}
      />
    </div>
  );
};

CometChatOngoingCall.displayName = 'CometChatOngoingCall';
