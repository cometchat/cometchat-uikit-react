import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  CometChatConversations,
  CometChatUsers,
  CometChatGroups,
  CometChatCallLogs,
  CometChatContextMenu,
  useLocale,
  type CometChatContextMenuItemData,
} from '@cometchat/chat-uikit-react';
import userIcon from '../../assets/user.svg';
import startChatIcon from '../../assets/start_chat.svg';
import logoutIcon from '../../assets/logout.svg';
import './CometChatSelector.css';

interface SelectorProps {
  activeTab?: string;
  activeItem?: CometChat.User | CometChat.Group | CometChat.Conversation;
  loggedInUser?: CometChat.User;
  onSelectorItemClicked?: (
    input: CometChat.User | CometChat.Group | CometChat.Conversation,
    type: string
  ) => void;
  onLogout?: () => void;
  onNewChatClicked?: () => void;
  onCreateGroupClicked?: () => void;
  onSearchClicked?: () => void;
}

export const CometChatSelector = (props: SelectorProps) => {
  const {
    activeItem,
    activeTab,
    loggedInUser,
    onSelectorItemClicked = () => {},
    onLogout,
    onNewChatClicked,
    onCreateGroupClicked,
    onSearchClicked,
  } = props;

  const { getLocalizedString } = useLocale();

  const getMenuOptions = (): CometChatContextMenuItemData[] => {
    const options: CometChatContextMenuItemData[] = [
      {
        id: 'logged-in-user',
        title: loggedInUser?.getName() || 'User',
        iconURL: userIcon,
        onClick: () => {},
        className: 'cometchat-conversations__header-menu-item--user',
      },
      {
        id: 'create-conversation',
        title: getLocalizedString('create_conversation'),
        iconURL: startChatIcon,
        onClick: () => {
          onNewChatClicked?.();
        },
      },
      {
        id: 'log-out',
        title: getLocalizedString('log_out'),
        iconURL: logoutIcon,
        onClick: () => {
          onLogout?.();
        },
        className: 'cometchat-conversations__header-menu-item--logout',
      },
    ];
    return options;
  };

  const conversationsHeaderView = () => {
    return (
      <div className="cometchat-conversations__header">
        <div className="cometchat-conversations__header-title">{getLocalizedString('chats')}</div>
        <div className="cometchat-conversations__header-menu">
          <CometChatContextMenu
            items={getMenuOptions()}
            topMenuSize={0}
            placement="bottom"
            closeOnOutsideClick={true}
            onOptionClicked={(item) => {
              item.onClick();
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <>
      {activeTab === 'chats' ? (
        <CometChatConversations
          headerView={conversationsHeaderView()}
          activeConversation={activeItem as CometChat.Conversation}
          onItemClick={(e) => {
            onSelectorItemClicked(e, 'updateSelectedItem');
          }}
          onSearchBarClicked={onSearchClicked}
        />
      ) : activeTab === 'users' ? (
        <CometChatUsers
          headerView={<div className="cometchat-users__header"><div className="cometchat-users__header-title">{getLocalizedString('users')}</div></div>}
          activeUser={activeItem as CometChat.User}
          onItemClick={(e) => {
            onSelectorItemClicked(e, 'updateSelectedItemUser');
          }}
        />
      ) : activeTab === 'groups' ? (
        <CometChatGroups
          headerView={
            <div className="cometchat-groups__header">
              <div className="cometchat-groups__header-title">{getLocalizedString('groups')}</div>
              <button
                className="cometchat-groups__header-create-group-button"
                onClick={() => onCreateGroupClicked?.()}
                aria-label="Create group"
                type="button"
              >
                <span className="cometchat-groups__header-create-group-icon" />
              </button>
            </div>
          }
          activeGroup={activeItem as CometChat.Group}
          onItemClick={(e) => {
            onSelectorItemClicked(e, 'updateSelectedItemGroup');
          }}
        />
      ) : activeTab === 'calls' ? (
        <CometChatCallLogs
          onItemClick={(call) => {
            onSelectorItemClicked(call as CometChat.User, 'updateSelectedItemCall');
          }}
        />
      ) : null}
    </>
  );
};
