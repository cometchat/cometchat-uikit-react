import React from 'react';
import type { CometChatMessageHeaderCallButtonsProps } from './CometChatMessageHeader.types';
import { useCometChatMessageHeaderContext } from './CometChatMessageHeader.context';
import { CometChatCallButtons } from '../CometChatCallButtons/CometChatCallButtons';
import { CometChatUIKit } from '../../CometChatUIKit/CometChatUIKit';

/**
 * CometChatMessageHeaderCallButtons — thin wrapper that renders the standalone
 * CometChatCallButtons component within the MessageHeader context.
 *
 * This component reads user/group from the MessageHeader context and passes them
 * to CometChatCallButtons, which owns all calling logic.
 */
export const CometChatMessageHeaderCallButtons: React.FC<
  CometChatMessageHeaderCallButtonsProps
> = ({
  className,
  hideVoiceCallButton,
  hideVideoCallButton,
  onVoiceCallClick,
  onVideoCallClick,
  callSettingsBuilder,
  onError,
}) => {
  const header = useCometChatMessageHeaderContext();

  // The header's props apply wherever this part is placed; its own props win over them.
  const callingEnabled = CometChatUIKit.getSettings()?.isCallingEnabled() ?? false;
  const hideVoice = !callingEnabled || (hideVoiceCallButton ?? header.hideVoiceCallButton);
  const hideVideo = !callingEnabled || (hideVideoCallButton ?? header.hideVideoCallButton);
  if (hideVoice && hideVideo) return null;

  return (
    <CometChatCallButtons
      user={header.user ?? undefined}
      group={header.group ?? undefined}
      hideVoiceCallButton={hideVoice}
      hideVideoCallButton={hideVideo}
      onVoiceCallClick={onVoiceCallClick ?? header.onVoiceCallClick}
      onVideoCallClick={onVideoCallClick ?? header.onVideoCallClick}
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      callSettingsBuilder={callSettingsBuilder ?? header.callSettingsBuilder}
      onError={onError ?? header.onError}
      className={className}
    />
  );
};

CometChatMessageHeaderCallButtons.displayName = 'CometChatMessageHeaderCallButtons';
