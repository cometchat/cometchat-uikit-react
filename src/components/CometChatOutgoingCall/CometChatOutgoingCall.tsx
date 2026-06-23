import React, { useCallback, useEffect, useRef } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatOutgoingCallProps } from './CometChatOutgoingCall.types';
import { CometChatAvatar } from '../base/CometChatAvatar/CometChatAvatar';
import { CometChatSoundManager } from '../../resources/CometChatSoundManager/CometChatSoundManager';
import { CometChatUIKitConstants } from '../../constants/CometChatUIKitConstants';
import './CometChatOutgoingCall.css';
import { useLocale } from '../../context/locale/LocaleContext';

/**
 * CometChatOutgoingCall — shown when you initiate a call, waiting for the other person to pick up.
 *
 * Displays receiver name, avatar, "Calling..." subtitle, and a red end-call button.
 * Plays the outgoing call sound (looping) while visible and pauses on unmount.
 */
export const CometChatOutgoingCall: React.FC<CometChatOutgoingCallProps> = ({
  call,
  disableSoundForCalls = false,
  customSoundForCalls,
  onCallCanceled,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onError: _onError,
  titleView,
  subtitleView,
  avatarView,
  cancelButtonView,
  className,
}) => {
  const { getLocalizedString } = useLocale();
  const callRef = useRef<CometChat.Call>(call);
  callRef.current = call;

  const receiver = call.getReceiver();
  const receiverName = receiver.getName() || 'Unknown';
  const receiverAvatar = (() => {
    const receiverType = call.getReceiverType();
    if (receiverType === CometChatUIKitConstants.MessageReceiverType.user) {
      return (receiver as { getAvatar: () => string | undefined }).getAvatar();
    }
    return (receiver as { getIcon: () => string | undefined }).getIcon();
  })();

  // --- Sound management ---
  const playAudio = useCallback(() => {
    if (!disableSoundForCalls) {
      CometChatSoundManager.onOutgoingCall(customSoundForCalls);
    }
  }, [disableSoundForCalls, customSoundForCalls]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      playAudio();
    });

    return () => {
      clearTimeout(timeoutId);
      CometChatSoundManager.pause();
    };
  }, [call, playAudio]);

  // --- Cancel handler ---
  const handleCancel = useCallback(() => {
    CometChatSoundManager.pause();
    onCallCanceled?.();
  }, [onCallCanceled]);

  const rootClass = ['cometchat-outgoing-call', className].filter(Boolean).join(' ');

  return (
    <div
      className={rootClass}
      role="dialog"
      aria-label={getLocalizedString('accessibility_outgoing_call')}
    >
      <div className={'cometchat-outgoing-call__title-container'}>
        {titleView ?? <div className={'cometchat-outgoing-call__title'}>{receiverName}</div>}
        {subtitleView ?? (
          <div className={'cometchat-outgoing-call__subtitle'}>
            {getLocalizedString('calls_outgoing_call')}
          </div>
        )}
      </div>

      {avatarView ?? (
        <div className={'cometchat-outgoing-call__avatar'}>
          <CometChatAvatar name={receiverName} image={receiverAvatar} size="large" />
        </div>
      )}

      {cancelButtonView ?? (
        <button
          type="button"
          className={'cometchat-outgoing-call__button'}
          onClick={handleCancel}
          aria-label={getLocalizedString('outgoing_call_end')}
        >
          <span className={'cometchat-outgoing-call__button-icon'} aria-hidden="true" />
        </button>
      )}
    </div>
  );
};

CometChatOutgoingCall.displayName = 'CometChatOutgoingCall';
