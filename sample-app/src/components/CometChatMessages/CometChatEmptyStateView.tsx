import { useLocale } from '@cometchat/chat-uikit-react';
import emptyStateIcon from '../../assets/emptyStateIconChat.svg';
import './CometChatEmptyStateView.css';

export const CometChatEmptyStateView = (props: { activeTab?: string }) => {
  const { activeTab } = props;
  const { getLocalizedString } = useLocale();

  return (
    <div className="cometchat-empty-state-view">
      <img
        src={emptyStateIcon}
        alt=""
        className="cometchat-empty-state-view__icon"
      />
      <div className="cometchat-empty-state-view__text">
        <div className="cometchat-empty-state-view__text-title">
          {activeTab === 'chats'
            ? getLocalizedString('sample_no_conversation_selected')
            : activeTab === 'users'
              ? getLocalizedString('sample_select_user_to_chat')
              : activeTab === 'calls'
                ? getLocalizedString('sample_select_call_log')
                : getLocalizedString('sample_select_group_to_chat')}
        </div>
        <div className="cometchat-empty-state-view__text-subtitle">
          {getLocalizedString('sample_empty_state_subtitle')}
        </div>
      </div>
    </div>
  );
};
