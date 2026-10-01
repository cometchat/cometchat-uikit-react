import { CometChatUserDetails } from './CometChatUserDetails';
import { CometChatGroupDetails } from './CometChatGroupDetails';
import './CometChatDetails.css';

interface CometChatSideComponentProps {
  type: 'user' | 'group';
  user?: CometChat.User;
  group?: CometChat.Group;
  loggedInUser: CometChat.User;
  onHide: () => void;
  onConversationDeleted?: () => void;
  onGroupLeft?: () => void;
  onGroupDeleted?: () => void;
  isFreshChat?: boolean;
  /** Narrow layout — cover the app rather than sit in a side column. */
  isFullScreen?: boolean;
}

export const CometChatSideComponent = ({
  type,
  user,
  group,
  loggedInUser,
  onHide,
  onConversationDeleted,
  onGroupLeft,
  onGroupDeleted,
  isFreshChat,
  isFullScreen,
}: CometChatSideComponentProps) => {
  return (
    <div
      className={`side-component-wrapper${isFullScreen ? ' side-component-wrapper--fullscreen' : ''}`}
    >
      <div className="side-component-wrapper__content">
        {type === 'user' && user && (
          <CometChatUserDetails
            user={user}
            onHide={onHide}
            onConversationDeleted={onConversationDeleted}
          />
        )}
        {type === 'group' && group && (
          <CometChatGroupDetails
            group={group}
            loggedInUser={loggedInUser}
            onHide={onHide}
            onConversationDeleted={onConversationDeleted}
            onGroupLeft={onGroupLeft}
            onGroupDeleted={onGroupDeleted}
            isFreshChat={isFreshChat}
          />
        )}
      </div>
    </div>
  );
};
