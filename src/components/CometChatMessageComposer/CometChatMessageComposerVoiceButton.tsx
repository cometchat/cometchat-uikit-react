import React, { useCallback } from 'react';
import type { CometChatMessageComposerVoiceButtonProps } from './CometChatMessageComposer.types';
import { useCometChatMessageComposerContext } from './CometChatMessageComposer.context';
import { useLocale } from '../../context/locale/LocaleContext';
import micIcon from '../../assets/mic.svg';
import './CometChatMessageComposer.css';

/**
 * CometChatMessageComposerVoiceButton — voice recording trigger.
 *
 * Toggles inline voice recording mode. When recording is active,
 * the input area is replaced by the media recorder.
 *
 * Animation: slides out to the right when text has content (showVoiceButton=false),
 * slides back in when text is cleared. Uses CSS transitions on width/opacity/transform.
 */
export const CometChatMessageComposerVoiceButton: React.FC<
  CometChatMessageComposerVoiceButtonProps
> = ({ className }) => {
  const { isRecording, setRecording, setContentToDisplay, showVoiceButton } =
    useCometChatMessageComposerContext();
  const { getLocalizedString } = useLocale();

  const handleToggle = useCallback(() => {
    if (isRecording) {
      setRecording(false);
      setContentToDisplay('none');
    } else {
      setRecording(true);
      setContentToDisplay('voiceRecording');
    }
  }, [isRecording, setRecording, setContentToDisplay]);

  // Hide completely when recording is active (replaced by MediaRecorder UI)
  if (isRecording) {
    return null;
  }

  const btnClass = [
    'cometchat-message-composer__voice-button',
    !showVoiceButton ? 'cometchat-message-composer__voice-button--hidden' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={btnClass}
      onClick={handleToggle}
      aria-label={getLocalizedString('VOICE_RECORDING')}
      aria-hidden={!showVoiceButton}
      tabIndex={showVoiceButton ? 0 : -1}
    >
      <img
        src={micIcon}
        alt=""
        aria-hidden="true"
        width={24}
        height={24}
        draggable={false}
        className={'cometchat-message-composer__button-icon'}
      />
    </button>
  );
};
