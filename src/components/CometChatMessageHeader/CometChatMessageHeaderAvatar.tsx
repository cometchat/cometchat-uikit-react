import React from 'react';
import type { CometChatMessageHeaderAvatarProps } from './CometChatMessageHeader.types';
import { useCometChatMessageHeaderContext } from './CometChatMessageHeader.context';
import { CometChatAvatar } from '../base/CometChatAvatar';
import { useLocale } from '../../context/locale/LocaleContext';
import './CometChatMessageHeader.css';

/**
 * CometChatMessageHeaderAvatar — avatar with optional status indicator.
 *
 * For user conversations: shows avatar + online/offline status dot.
 * For group conversations: shows group icon without status indicator.
 */
export const CometChatMessageHeaderAvatar: React.FC<CometChatMessageHeaderAvatarProps> = ({
  className,
}) => {
  const { avatarImage, avatarName, isUserConversation, hideUserStatus, userStatus, isTyping } =
    useCometChatMessageHeaderContext();
  const { getLocalizedString } = useLocale();

  const rootClasses = ['cometchat-message-header__leading', className].filter(Boolean).join(' ');

  const showStatusIndicator = isUserConversation && !hideUserStatus && !isTyping;

  return (
    <div className={rootClasses}>
      <div className={'cometchat-message-header__avatar-container'}>
        <CometChatAvatar.Root name={avatarName} image={avatarImage} size="medium">
          <CometChatAvatar.Image />
          <CometChatAvatar.Initials />
        </CometChatAvatar.Root>

        {showStatusIndicator && (
          <span
            className={[
              'cometchat-message-header__status-indicator',
              userStatus === 'online'
                ? 'cometchat-message-header__status-indicator--online'
                : 'cometchat-message-header__status-indicator--offline',
            ]
              .filter(Boolean)
              .join(' ')}
            role="status"
            aria-label={
              userStatus === 'online'
                ? getLocalizedString('message_header_online')
                : getLocalizedString('message_header_offline')
            }
          />
        )}
      </div>
    </div>
  );
};

CometChatMessageHeaderAvatar.displayName = 'CometChatMessageHeaderAvatar';
