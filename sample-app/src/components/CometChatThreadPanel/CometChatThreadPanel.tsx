import { useEffect, useState } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  CometChatThreadHeader,
  CometChatMessageList,
  CometChatMessageComposer,
  useCometChatEvents,
  usePublishEvent,
} from '@cometchat/chat-uikit-react';
import type { CometChatEvent } from '@cometchat/chat-uikit-react';
import './CometChatThreadPanel.css';

interface CometChatThreadPanelProps {
  /** The parent message of the thread. */
  parentMessage: CometChat.BaseMessage;
  /** The user in the conversation (1:1 chat). */
  user?: CometChat.User;
  /** The group in the conversation (group chat). */
  group?: CometChat.Group;
  /** The logged-in user. */
  loggedInUser: CometChat.User;
  /** Called when the thread panel should close. */
  onClose: () => void;
  /** Called when the sender name / subtitle is clicked (navigate to parent in main list). */
  onSubtitleClicked: () => void;
  /** Optional message ID to scroll to within the thread. */
  goToMessageId?: number;
}

/**
 * CometChatThreadPanel — right-panel component that shows thread replies.
 *
 * Composes: ThreadHeader + MessageList(parentMessageId) + Composer(parentMessageId)
 * Handles blocked user state: hides composer when user is blocked.
 */
export const CometChatThreadPanel = ({
  parentMessage,
  user,
  group,
  loggedInUser,
  onClose,
  onSubtitleClicked,
  goToMessageId,
}: CometChatThreadPanelProps) => {
  const parentMessageId = parentMessage.getId();

  const [isBlocked, setIsBlocked] = useState(() => user?.getBlockedByMe?.() ?? false);
  const publish = usePublishEvent();

  useEffect(() => {
    setIsBlocked(user?.getBlockedByMe?.() ?? false);
  }, [user]);

  useCometChatEvents(
    (event: CometChatEvent) => {
      if (!user) return;

      if (event.type === 'ui:user/blocked') {
        if (event.user.getUid() === user.getUid()) {
          setIsBlocked(true);
        }
      }
      if (event.type === 'ui:user/unblocked') {
        if (event.user.getUid() === user.getUid()) {
          setIsBlocked(false);
        }
      }
    },
    [user?.getUid()]
  );

  return (
    <div className="cometchat-thread-panel">
      <div className="cometchat-thread-panel__header">
        <CometChatThreadHeader
          parentMessage={parentMessage}
          onClose={onClose}
          onSubtitleClicked={onSubtitleClicked}
          onParentDeleted={onClose}
        />
      </div>
      <div className="cometchat-thread-panel__messages">
        <CometChatMessageList
          user={user}
          group={group}
          loggedInUser={loggedInUser}
          parentMessageId={parentMessageId}
          goToMessageId={goToMessageId}
          className='cometchat-thread-panel__message-list'
        />
      </div>
      {!isBlocked ? (
        <div className="cometchat-thread-panel__composer-wrapper">
          <CometChatMessageComposer
            user={user}
            group={group}
            parentMessageId={parentMessageId}
            layout="compact"
            enableRichTextEditor
            className='cometchat-thread-panel__composer'
          />
        </div>
      ) : (
        <div className="cometchat-thread-panel__blocked">
          <div className="cometchat-thread-panel__blocked-text">
            Cannot send a message to a blocked user.{' '}
            <span
              className="cometchat-thread-panel__blocked-link"
              onClick={() => {
                if (!user) return;
                void CometChat.unblockUsers([user.getUid()]).then(() => {
                  user.setBlockedByMe(false);
                  publish({ type: 'ui:user/unblocked', user });
                });
              }}
              role="button"
              tabIndex={0}
            >
              Click to unblock.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
