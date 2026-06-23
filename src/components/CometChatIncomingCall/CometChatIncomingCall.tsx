import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatIncomingCallProps } from './CometChatIncomingCall.types';
import { CometChatAvatar } from '../base/CometChatAvatar/CometChatAvatar';
import { CometChatOngoingCall } from '../CometChatOngoingCall/CometChatOngoingCall';
import { CometChatSoundManager } from '../../resources/CometChatSoundManager/CometChatSoundManager';
import { usePublishEvent } from '../../hooks/usePublishEvent';
import { CometChatUIKit } from '../../CometChatUIKit/CometChatUIKit';
import { useGlobalConfig } from '../../context/GlobalConfigContext';
import './CometChatIncomingCall.css';
import { useLocale } from '../../context/locale/LocaleContext';

/**
 * CometChatIncomingCall — listens for incoming calls and shows accept/reject UI.
 *
 * When an incoming call is received, displays a card with caller info and
 * Accept/Decline buttons. On accept, transitions to the ongoing call screen.
 *
 * Render this component at the app root level (it manages its own visibility).
 */
export const CometChatIncomingCall: React.FC<CometChatIncomingCallProps> = ({
  onAccept,
  onDecline,
  onCallEnded,
  disableSoundForCalls: disableSoundProp,
  customSoundForCalls: customSoundProp,
  callSettingsBuilder,
  onError,
  itemView,
  leadingView,
  titleView,
  subtitleView,
  trailingView,
  className,
}) => {
  const { getLocalizedString } = useLocale();
  const [incomingCall, setIncomingCall] = useState<CometChat.Call | null>(null);
  const [showOngoingCall, setShowOngoingCall] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const callRef = useRef<CometChat.Call | null>(null);
  const listenerId = useId();
  const publish = usePublishEvent();
  const globalConfig = useGlobalConfig();

  // Resolve sound config: prop > globalConfig > default
  const disableSoundForCalls = disableSoundProp ?? globalConfig.disableSoundForCalls ?? false;
  const customSoundForCalls = customSoundProp ?? globalConfig.customSoundForCalls;

  // Attach SDK call listener
  useEffect(() => {
    const id = `incoming_call_${listenerId}_${String(Date.now())}`;

    CometChat.addCallListener(
      id,
      new CometChat.CallListener({
        onIncomingCallReceived: (call: CometChat.Call) => {
          const loggedInUser = CometChatUIKit.getLoggedInUser();
          if (call.getSender().getUid() === loggedInUser?.getUid()) {
            return;
          }

          callRef.current = call;
          setIncomingCall(call);
          // Play incoming call sound
          if (!disableSoundForCalls) {
            CometChatSoundManager.onIncomingCall(customSoundForCalls);
          }
        },
        onIncomingCallCancelled: () => {
          callRef.current = null;
          setIncomingCall(null);
          CometChatSoundManager.pause();
        },
        onOutgoingCallAccepted: (call: CometChat.Call) => {
          void call;
        },
        onOutgoingCallRejected: () => {
          CometChatSoundManager.pause();
          callRef.current = null;
          setIncomingCall(null);
          setShowOngoingCall(false);
        },
      })
    );

    return () => {
      CometChat.removeCallListener(id);
    };
  }, [listenerId, disableSoundForCalls, customSoundForCalls]);

  const handleAccept = useCallback(async () => {
    if (!callRef.current) return;
    CometChatSoundManager.pause();

    if (onAccept) {
      onAccept(callRef.current);
      return;
    }

    try {
      const acceptedCall = await CometChat.acceptCall(callRef.current.getSessionId());
      publish({ type: 'ui:call/accepted', call: acceptedCall as unknown as CometChat.Call });
      setSessionId(acceptedCall.getSessionId());
      setIncomingCall(null);
      setShowOngoingCall(true);
    } catch (error) {
      console.error('[CometChatIncomingCall] acceptCall error:', error);
      onError?.(error as CometChat.CometChatException);
    }
  }, [onAccept, onError, publish]);

  const handleDecline = useCallback(async () => {
    if (!callRef.current) return;
    CometChatSoundManager.pause();

    if (onDecline) {
      onDecline(callRef.current);
      publish({ type: 'ui:call/rejected', call: callRef.current });
      setIncomingCall(null);
      callRef.current = null;
      return;
    }

    try {
      const rejectedCall = await CometChat.rejectCall(
        callRef.current.getSessionId(),
        CometChat.CALL_STATUS.REJECTED
      );
      CometChat.clearActiveCall();
      publish({ type: 'ui:call/rejected', call: rejectedCall as unknown as CometChat.Call });
      setIncomingCall(null);
      callRef.current = null;
    } catch (error) {
      onError?.(error as CometChat.CometChatException);
    }
  }, [onDecline, onError, publish]);

  const handleCallEnded = useCallback(() => {
    setShowOngoingCall(false);
    setSessionId('');
    callRef.current = null;
    // Notify other components (MessageHeader) that the call ended so they re-enable buttons
    publish({ type: 'ui:call/ended' });
    onCallEnded?.();
  }, [onCallEnded, publish]);

  const isAudioOnly = callRef.current?.getType() === 'audio';

  // Ongoing call screen (after accepting)
  if (showOngoingCall && sessionId) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const resolvedCallSettings =
      callSettingsBuilder && callRef.current ? callSettingsBuilder(callRef.current) : undefined;

    return (
      <CometChatOngoingCall
        sessionID={sessionId}
        isAudioOnly={isAudioOnly}
        isDirectCalling={false}
        {...(resolvedCallSettings !== undefined && { callSettingsBuilder: resolvedCallSettings })}
        onCallEnded={handleCallEnded}
        onError={onError ?? null}
      />
    );
  }

  // No incoming call
  if (!incomingCall) return null;

  const callerName = incomingCall.getSender().getName() || 'Unknown';
  const callerAvatar = incomingCall.getSender().getAvatar();
  const callType = incomingCall.getType() === 'audio' ? 'Voice' : 'Video';

  const rootClass = ['cometchat-incoming-call', className].filter(Boolean).join(' ');

  return (
    <div
      className={rootClass}
      role="alertdialog"
      aria-label={getLocalizedString('accessibility_incoming_call_from')
        .replace('{type}', callType)
        .replace('{name}', callerName)}
    >
      {itemView ? (
        itemView(incomingCall)
      ) : (
        <div className={'cometchat-incoming-call__info'}>
          <div className={'cometchat-incoming-call__avatar'}>
            {leadingView ? (
              leadingView(incomingCall)
            ) : (
              <CometChatAvatar.Root name={callerName} image={callerAvatar} size="medium">
                <CometChatAvatar.Image />
                <CometChatAvatar.Initials />
              </CometChatAvatar.Root>
            )}
          </div>
          <div className={'cometchat-incoming-call__details'}>
            {titleView ? (
              titleView(incomingCall)
            ) : (
              <div className={'cometchat-incoming-call__title'}>{callerName}</div>
            )}
            {subtitleView ? (
              subtitleView(incomingCall)
            ) : (
              <div className={'cometchat-incoming-call__subtitle'}>Incoming {callType} Call</div>
            )}
          </div>
          {trailingView && (
            <div className={'cometchat-incoming-call__trailing'}>{trailingView(incomingCall)}</div>
          )}
        </div>
      )}

      <div className={'cometchat-incoming-call__button-group'}>
        <button
          type="button"
          className={'cometchat-incoming-call__button-decline'}
          onClick={() => void handleDecline()}
          aria-label={getLocalizedString('incoming_call_confirm_no')}
        >
          Decline
        </button>
        <button
          type="button"
          className={'cometchat-incoming-call__button-accept'}
          onClick={() => void handleAccept()}
          aria-label={getLocalizedString('incoming_call_confirm_yes')}
        >
          Accept
        </button>
      </div>
    </div>
  );
};

CometChatIncomingCall.displayName = 'CometChatIncomingCall';
