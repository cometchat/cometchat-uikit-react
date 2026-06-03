import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatMessageHeader, CometChatMessageList, useCometChatEvents, usePublishEvent, useLocale } from '@cometchat/chat-uikit-react';
import type { CometChatEvent } from '@cometchat/chat-uikit-react';
import { useCallback, useEffect, useState } from 'react';
import { CometChatMessageComposer } from './CometChatMessageComposer';
import '../../styles/CometChatMessages/CometChatMessages.css';

interface MessagesViewProps {
  user?: CometChat.User;
  group?: CometChat.Group;
  loggedInUser: CometChat.User;
  onHeaderClicked?: () => void;
  onThreadRepliesClick?: (message: CometChat.BaseMessage) => void;
  onSearchClicked?: () => void;
  showComposer?: boolean;
  onBack?: () => void;
  goToMessageId?: string;
}

export const CometChatMessages = (props: MessagesViewProps) => {
  const {
    user,
    group,
    loggedInUser,
    onHeaderClicked = () => {},
    onThreadRepliesClick = () => {},
    onSearchClicked,
    showComposer = true,
    onBack = () => {},
    goToMessageId,
  } = props;

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isBlockedByMe, setIsBlockedByMe] = useState(user?.getBlockedByMe?.() ?? false);
  const publish = usePublishEvent();
  const { getLocalizedString } = useLocale();

  useEffect(() => {
    setIsBlockedByMe(user?.getBlockedByMe?.() ?? false);
  }, [user]);

  useCometChatEvents((event: CometChatEvent) => {
    if (event.type === 'ui:user/blocked' && user && event.user.getUid() === user.getUid()) {
      setIsBlockedByMe(true);
    }
    if (event.type === 'ui:user/unblocked' && user && event.user.getUid() === user.getUid()) {
      setIsBlockedByMe(false);
    }
  }, [user?.getUid()]);

  const handleUnblock = useCallback(async () => {
    if (!user) return;
    try {
      await CometChat.unblockUsers([user.getUid()]);
      user.setBlockedByMe(false);
      setIsBlockedByMe(false);
      publish({ type: 'ui:user/unblocked', user });
    } catch (error) {
      console.error('Error unblocking user:', error);
    }
  }, [user, publish]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="cometchat-messages-wrapper">
      <div className="cometchat-header-wrapper">
        <CometChatMessageHeader
          user={user}
          group={group}
          onBack={onBack}
          hideBackButton={!isMobile}
          onItemClick={onHeaderClicked}
          onSearchOptionClicked={onSearchClicked}
          showSearchOption={true}
        />
      </div>
      <div className="cometchat-message-list-wrapper">
        <CometChatMessageList
          user={user}
          group={group}
          loggedInUser={loggedInUser}
          onThreadRepliesClick={(message: CometChat.BaseMessage) => onThreadRepliesClick(message)}
          goToMessageId={goToMessageId ? Number(goToMessageId) : undefined}
          startFromUnreadMessages={true}
          showMarkAsUnreadOption={true}
        />
      </div>
      {showComposer && !isBlockedByMe && (
        <div className="cometchat-composer-wrapper">
          <CometChatMessageComposer user={user} group={group} />
        </div>
      )}
      {isBlockedByMe && (
        <div className="cometchat-messages__blocked-banner">
          <div className="cometchat-messages__blocked-banner-text">
            {getLocalizedString('cannot_send_to_blocked_user')}{' '}
            <span
              className="cometchat-messages__blocked-banner-link"
              onClick={handleUnblock}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') handleUnblock(); }}
            >
              {getLocalizedString('click_to_unblock')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
