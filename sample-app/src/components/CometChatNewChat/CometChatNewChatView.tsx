import { useState } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatUsers, CometChatGroups, useLocale } from '@cometchat/chat-uikit-react';
import '../../styles/CometChatNewChat/CometChatNewChatView.css';

interface CometChatNewChatViewProps {
  onBack: () => void;
  onUserSelected: (user: CometChat.User) => void;
  onGroupSelected: (group: CometChat.Group) => void;
}

export const CometChatNewChatView = ({
  onBack,
  onUserSelected,
  onGroupSelected,
}: CometChatNewChatViewProps) => {
  const [selectedTab, setSelectedTab] = useState<'user' | 'group'>('user');
  const { getLocalizedString } = useLocale();

  return (
    <div className="cometchat-new-chat-view">
      {/* Header with back icon and title */}
      <div className="cometchat-new-chat-view__header">
        <button
          className="cometchat-new-chat-view__header-back"
          onClick={onBack}
          aria-label="Back"
        >
          <span className="cometchat-new-chat-view__header-back-icon" />
        </button>
        <div className="cometchat-new-chat-view__header-title">{getLocalizedString('sample_new_chat')}</div>
      </div>

      {/* Tabs for User and Group */}
      <div className="cometchat-new-chat-view__tabs">
        <div
          className={`cometchat-new-chat-view__tabs-tab ${selectedTab === 'user' ? 'cometchat-new-chat-view__tabs-tab-active' : ''}`}
          onClick={() => setSelectedTab('user')}
        >
          {getLocalizedString('sample_tab_users')}
        </div>
        <div
          className={`cometchat-new-chat-view__tabs-tab ${selectedTab === 'group' ? 'cometchat-new-chat-view__tabs-tab-active' : ''}`}
          onClick={() => setSelectedTab('group')}
        >
          {getLocalizedString('sample_tab_groups')}
        </div>
      </div>

      {/* Dynamic content based on selected tab */}
      <div className="cometchat-new-chat-view__content">
        {selectedTab === 'user' ? (
          <CometChatUsers
            onItemClick={(user: CometChat.User) => {
              onUserSelected(user);
            }}
          />
        ) : (
          <CometChatGroups
            onItemClick={(group: CometChat.Group) => {
              onGroupSelected(group);
            }}
          />
        )}
      </div>
    </div>
  );
};
