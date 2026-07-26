import React from 'react';
import type { CometChatVoiceNoteBubbleProps } from './CometChatVoiceNoteBubble.types';
import { CometChatAudioBubble } from '../CometChatAudioBubble/CometChatAudioBubble';

/**
 * CometChatVoiceNoteBubble — thin wrapper around the existing CometChatAudioBubble
 * waveform renderer. Always standalone (no grid), used for voice notes.
 *
 * Used only for audio messages explicitly tagged `audioType === "voice_note"`.
 * Audio without that tag renders as a normal audio row (CometChatAudiosBubble).
 */
export const CometChatVoiceNoteBubble: React.FC<CometChatVoiceNoteBubbleProps> = ({
  message,
  alignment,
  textFormatters = [],
  className,
}) => {
  return (
    <CometChatAudioBubble
      message={message}
      alignment={alignment}
      textFormatters={textFormatters}
      className={className}
    />
  );
};

CometChatVoiceNoteBubble.displayName = 'CometChatVoiceNoteBubble';
