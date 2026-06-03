import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatUserDetails } from './CometChatUserDetails';
import { CometChatGroupDetails } from './CometChatGroupDetails';
import '../../styles/CometChatDetails/CometChatDetails.css';

interface CometChatSideComponentProps {
  type: 'user' | 'group';
  user?: CometChat.User;
  group?: CometChat.Group;
  loggedInUser: CometChat.User;
  onHide: () => void;
  onConversationDeleted?: () => void;
  onGroupLeft?: () => void;
  onGroupDeleted?: () => void;
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
}: CometChatSideComponentProps) => {
  return (
    <div className="side-component-wrapper">
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
          />
        )}
      </div>
    </div>
  );
};
