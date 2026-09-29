import { useMemo } from 'react';
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
import userIconAsset from '../../assets/user.svg';
import startChatIconAsset from '../../assets/start_chat.svg';
import logoutIconAsset from '../../assets/logout.svg';
import { useFeatureProps } from '../../config/useFeatureProps';
import saveIconAsset from '../../assets/save.svg';
import './CometChatSelector.css';
import { assetUrl } from '../../utils/assetUrl';

const userIcon = assetUrl(userIconAsset);
const startChatIcon = assetUrl(startChatIconAsset);
const logoutIcon = assetUrl(logoutIconAsset);
const saveIcon = assetUrl(saveIconAsset);

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
  onSavedMessagesClicked?: () => void;
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
    onSavedMessagesClicked,
  } = props;

  const { getLocalizedString } = useLocale();
  const featureProps = useFeatureProps();

  // `friendsOnly` restricts the users list to the logged-in user's friends. Built here rather
  // than in the config layer so that layer stays free of the Chat SDK.
  const usersRequestBuilder = useMemo(
    () =>
      featureProps.settings.chatFeatures.userManagement.friendsOnly
        ? new CometChat.UsersRequestBuilder().setLimit(30).friendsOnly(true)
        : undefined,
    [featureProps.settings.chatFeatures.userManagement.friendsOnly]
  );

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
    ];

    if (featureProps.settings.chatFeatures.coreMessagingExperience.saveMessage) {
      options.push({
        id: 'saved-messages',
        title: getLocalizedString('selector_option_saved_messages'),
        iconURL: saveIcon,
        onClick: () => {
          onSavedMessagesClicked?.();
        },
      });
    }

    options.push({
      id: 'log-out',
      title: getLocalizedString('log_out'),
      iconURL: logoutIcon,
      onClick: () => {
        onLogout?.();
      },
      className: 'cometchat-conversations__header-menu-item--logout',
    });
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
            onOptionClicked={item => {
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
          onItemClick={e => {
            onSelectorItemClicked(e, 'updateSelectedItem');
          }}
          onSearchBarClicked={onSearchClicked}
          {...featureProps.conversations}
        />
      ) : activeTab === 'users' ? (
        <CometChatUsers
          {...featureProps.users}
          usersRequestBuilder={usersRequestBuilder}
          headerView={
            <div className="cometchat-users__header">
              <div className="cometchat-users__header-title">{getLocalizedString('users')}</div>
            </div>
          }
          activeUser={activeItem as CometChat.User}
          onItemClick={e => {
            onSelectorItemClicked(e, 'updateSelectedItemUser');
          }}
        />
      ) : activeTab === 'groups' ? (
        <CometChatGroups
          headerView={
            <div className="cometchat-groups__header">
              <div className="cometchat-groups__header-title">{getLocalizedString('groups')}</div>
              {featureProps.settings.chatFeatures.groupManagement.createGroup && (
                <button
                  className="cometchat-groups__header-create-group-button"
                  onClick={() => onCreateGroupClicked?.()}
                  aria-label="Create group"
                  type="button"
                >
                  <span className="cometchat-groups__header-create-group-icon" />
                </button>
              )}
            </div>
          }
          activeGroup={activeItem as CometChat.Group}
          onItemClick={e => {
            onSelectorItemClicked(e, 'updateSelectedItemGroup');
          }}
        />
      ) : activeTab === 'calls' ? (
        <CometChatCallLogs
          onItemClick={call => {
            onSelectorItemClicked(call as CometChat.User, 'updateSelectedItemCall');
          }}
        />
      ) : null}
    </>
  );
};
