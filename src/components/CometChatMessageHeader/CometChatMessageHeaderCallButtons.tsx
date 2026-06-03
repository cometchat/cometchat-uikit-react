import React, { useCallback } from 'react';
import type { CometChatMessageHeaderCallButtonsProps } from './CometChatMessageHeader.types';
import { useCometChatMessageHeaderContext } from './CometChatMessageHeader.context';
import './CometChatMessageHeader.css';
import { useLocale } from '../../context/locale/LocaleContext';

/**
 * CometChatMessageHeaderCallButtons — voice and video call buttons.
 *
 * Renders voice and video call icon buttons. Delegates call initiation
 * to the context's `initiateAudioCall` / `initiateVideoCall` methods,
 * or to custom `onVoiceCallClick` / `onVideoCallClick` callbacks if provided.
 *
 * Buttons are disabled during active calls (callButtonsDisabled from context).
 */
export const CometChatMessageHeaderCallButtons: React.FC<
  CometChatMessageHeaderCallButtonsProps
> = ({ className }) => {
  const {
    user,
    group,
    callButtonsDisabled,
    initiateAudioCall,
    initiateVideoCall,
    onVoiceCallClick,
    onVideoCallClick,
  } = useCometChatMessageHeaderContext();

  const entity = user ?? group;

  const { getLocalizedString } = useLocale();
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

  const rootClasses = ['cometchat-message-header__call-buttons', className]
    .filter(Boolean)
    .join(' ');

  return (
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
      <button
        type="button"
        className={'cometchat-message-header__call-button'}
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
            'cometchat-message-header__call-button-icon',
            'cometchat-message-header__call-button-icon--voice',
          ].join(' ')}
          aria-hidden="true"
        />
      </button>

      {/* Video Call Button */}
      <button
        type="button"
        className={'cometchat-message-header__call-button'}
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
            'cometchat-message-header__call-button-icon',
            'cometchat-message-header__call-button-icon--video',
          ].join(' ')}
          aria-hidden="true"
        />
      </button>
    </div>
  );
};

CometChatMessageHeaderCallButtons.displayName = 'CometChatMessageHeaderCallButtons';
