import React from 'react';
import type { CometChatMessageHeaderCallButtonsProps } from './CometChatMessageHeader.types';
import { useCometChatMessageHeaderContext } from './CometChatMessageHeader.context';
import { CometChatCallButtons } from '../CometChatCallButtons/CometChatCallButtons';

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
  const { user, group } = useCometChatMessageHeaderContext();

  return (
    <CometChatCallButtons
      user={user ?? undefined}
      group={group ?? undefined}
      hideVoiceCallButton={hideVoiceCallButton}
      hideVideoCallButton={hideVideoCallButton}
      onVoiceCallClick={onVoiceCallClick}
      onVideoCallClick={onVideoCallClick}
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      callSettingsBuilder={callSettingsBuilder}
      onError={onError}
      className={className}
    />
  );
};

CometChatMessageHeaderCallButtons.displayName = 'CometChatMessageHeaderCallButtons';
