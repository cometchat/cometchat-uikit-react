import React, { useCallback } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatCallButtonsProps } from './CometChatCallButtons.types';
import { useCometChatCallButtons } from './useCometChatCallButtons';
import { CometChatOutgoingCall } from '../CometChatOutgoingCall/CometChatOutgoingCall';
import { CometChatOngoingCall } from '../CometChatOngoingCall/CometChatOngoingCall';
import { useLocale } from '../../context/locale/LocaleContext';
import './CometChatCallButtons.css';

/**
 * CometChatCallButtons — standalone component that renders voice and video call buttons
 * and manages the complete call lifecycle (outgoing + ongoing).
 *
 * Usage:
 * ```tsx
 * <CometChatCallButtons user={selectedUser} />
 * <CometChatCallButtons group={selectedGroup} />
 * <CometChatCallButtons user={user} hideVoiceCallButton />
 * ```
 *
 * This component is self-contained: clicking a button initiates the call,
 * shows the outgoing call UI, transitions to the ongoing call screen on acceptance,
 * and cleans up when the call ends.
 */
export const CometChatCallButtons: React.FC<CometChatCallButtonsProps> = ({
  user,
  group,
  hideVoiceCallButton = false,
  hideVideoCallButton = false,
  onVoiceCallClick,
  onVideoCallClick,
  callSettingsBuilder,
  onError,
  onCallEnded,
  className,
  voiceCallButtonView,
  videoCallButtonView,
}) => {
  const { getLocalizedString } = useLocale();
  const entity = user ?? group;

  const {
    callButtonsDisabled,
    showOutgoingCallScreen,
    showOngoingCall,
    callSessionId,
    isDirectCalling,
    isGroupAudioCall,
    activeCall,
    initiateAudioCall,
    initiateVideoCall,
    cancelOutgoingCall,
    resetCallState,
  } = useCometChatCallButtons({ user, group, onError });

  const handleVoiceCall = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      if (callButtonsDisabled) return;

      if (onVoiceCallClick && entity) {
        onVoiceCallClick(entity);
      } else {
        void initiateAudioCall();
      }
    },
    [callButtonsDisabled, onVoiceCallClick, entity, initiateAudioCall]
  );

  const handleVideoCall = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      if (callButtonsDisabled) return;

      if (onVideoCallClick && entity) {
        onVideoCallClick(entity);
      } else {
        void initiateVideoCall();
      }
    },
    [callButtonsDisabled, onVideoCallClick, entity, initiateVideoCall]
  );

  const handleKeyDown = useCallback(
    (handler: () => void) => (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        event.stopPropagation();
        if (!callButtonsDisabled) handler();
      }
    },
    [callButtonsDisabled]
  );

  const handleCallEnded = useCallback(() => {
    resetCallState();
    onCallEnded?.();
  }, [resetCallState, onCallEnded]);

  // Nothing to show if both buttons are hidden and no active call screens
  if (hideVoiceCallButton && hideVideoCallButton && !showOutgoingCallScreen && !showOngoingCall) {
    return null;
  }

  const rootClasses = ['cometchat-call-buttons', className].filter(Boolean).join(' ');

  return (
    <>
      {/* Call buttons */}
      {(!hideVoiceCallButton || !hideVideoCallButton) && (
        <div
          className={rootClasses}
          onClick={e => {
            e.stopPropagation();
          }}
          onKeyDown={e => {
            if (e.key === 'Escape') e.stopPropagation();
          }}
          role="presentation"
        >
          {/* Voice Call Button */}
          {!hideVoiceCallButton &&
            (voiceCallButtonView ?? (
              <button
                type="button"
                className={'cometchat-call-buttons__button'}
                aria-label={getLocalizedString('call_button_voice_hover')}
                aria-disabled={callButtonsDisabled}
                disabled={callButtonsDisabled}
                tabIndex={0}
                onClick={handleVoiceCall}
                onKeyDown={handleKeyDown(() => {
                  if (onVoiceCallClick && entity) {
                    onVoiceCallClick(entity);
                  } else {
                    void initiateAudioCall();
                  }
                })}
              >
                <span
                  className={[
                    'cometchat-call-buttons__button-icon',
                    'cometchat-call-buttons__button-icon--voice',
                  ].join(' ')}
                  aria-hidden="true"
                />
              </button>
            ))}

          {/* Video Call Button */}
          {!hideVideoCallButton &&
            (videoCallButtonView ?? (
              <button
                type="button"
                className={'cometchat-call-buttons__button'}
                aria-label={getLocalizedString('call_button_video_hover')}
                aria-disabled={callButtonsDisabled}
                disabled={callButtonsDisabled}
                tabIndex={0}
                onClick={handleVideoCall}
                onKeyDown={handleKeyDown(() => {
                  if (onVideoCallClick && entity) {
                    onVideoCallClick(entity);
                  } else {
                    void initiateVideoCall();
                  }
                })}
              >
                <span
                  className={[
                    'cometchat-call-buttons__button-icon',
                    'cometchat-call-buttons__button-icon--video',
                  ].join(' ')}
                  aria-hidden="true"
                />
              </button>
            ))}
        </div>
      )}

      {/* Outgoing Call — overlay shown when initiating a call */}
      {showOutgoingCallScreen && activeCall && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9998,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.5)',
          }}
        >
          <CometChatOutgoingCall
            call={activeCall}
            onCallCanceled={() => void cancelOutgoingCall()}
            onError={
              onError
                ? (error: CometChat.CometChatException) => {
                    onError(error);
                  }
                : null
            }
          />
        </div>
      )}

      {/* Ongoing Call — full-screen overlay when a call is active */}
      {showOngoingCall && callSessionId && (
        <CometChatOngoingCall
          sessionID={callSessionId}
          isAudioOnly={isGroupAudioCall || activeCall?.getType() === 'audio'}
          isDirectCalling={isDirectCalling}
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          callSettings={callSettingsBuilder}
          onCallEnded={handleCallEnded}
          onError={
            onError
              ? (error: CometChat.CometChatException) => {
                  onError(error);
                }
              : null
          }
        />
      )}
    </>
  );
};

CometChatCallButtons.displayName = 'CometChatCallButtons';
