import { useEffect, useState } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatAvatar, CometChatCallButtons, verifyCallUser, useLocale } from '@cometchat/chat-uikit-react';
import { CometChatCallLogInfo } from './CometChatCallLogInfo';
import { CometChatCallLogParticipants } from './CometChatCallLogParticipants';
import { CometChatCallLogHistory } from './CometChatCallLogHistory';
import { CometChatCallLogRecordings } from './CometChatCallLogRecordings';
import './CometChatCallLogDetails.css';

interface CometChatCallLogDetailsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selectedItem: any;
  onBack?: () => void;
}

export const CometChatCallLogDetails = ({ selectedItem, onBack }: CometChatCallLogDetailsProps) => {
  const { getLocalizedString } = useLocale();
  const [activeTab, setActiveTab] = useState('participants');
  const [user, setUser] = useState<CometChat.User | undefined>();
  const [subtitleText, setSubtitleText] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');

  const callDetailTabItems = [
    { id: 'participants', name: getLocalizedString('sample_participants') },
    { id: 'recording', name: getLocalizedString('sample_recording') },
    { id: 'history', name: getLocalizedString('sample_history') },
  ];

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const loggedInUser = await CometChat.getLoggedinUser();
        if (!loggedInUser) return;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const callUser = verifyCallUser(selectedItem, loggedInUser);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const uid = callUser?.uid ?? callUser?.getUid?.();
        // Get avatar from call log entity
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const entityAvatar: string = (callUser?.getAvatar?.() ?? callUser?.avatar ?? '') as string;
        setAvatarUrl(entityAvatar);
        if (uid) {
          const fetchedUser = await CometChat.getUser(uid as string);
          setUser(fetchedUser);
          setSubtitleText(fetchedUser.getStatus() === 'online' ? getLocalizedString('sample_online') : getLocalizedString('sample_offline'));
        }
      } catch {
        // ignore
      }
    };
    void fetchUser();
  }, [selectedItem]);

  // User status listener
  useEffect(() => {
    if (!user) return;
    const listenerId = `callLogDetails_user_${Date.now().toString()}`;
    CometChat.addUserListener(
      listenerId,
      new CometChat.UserListener({
        onUserOnline: (onlineUser: CometChat.User) => {
          if (user.getUid() === onlineUser.getUid()) {
            setSubtitleText(getLocalizedString('sample_online'));
          }
        },
        onUserOffline: (offlineUser: CometChat.User) => {
          if (user.getUid() === offlineUser.getUid()) {
            setSubtitleText(getLocalizedString('sample_offline'));
          }
        },
      })
    );
    return () => {
      CometChat.removeUserListener(listenerId);
    };
  }, [user]);

  const getLoadingView = () => {
    return (
      <div className="cometchat-call-log-details__shimmer">
        <div className="cometchat-call-log-details__shimmer-item">
          <div className="cometchat-call-log-details__shimmer-item-avatar" />
          <div className="cometchat-call-log-details__shimmer-item-body">
            <div className="cometchat-call-log-details__shimmer-item-body-title" />
            <div className="cometchat-call-log-details__shimmer-item-body-subtitle" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="cometchat-call-log-details">
      <div className="cometchat-call-log-details__header">
        <div className="cometchat-call-log-details__header-back" onClick={onBack} />
        {getLocalizedString('sample_call_details')}
      </div>

      <div className="cometchat-call-log-details__call-log-item">
        {user ? (
          <div className="cometchat-call-log-details__user-info">
            <div className="cometchat-call-log-details__user-avatar-wrapper">
              <CometChatAvatar name={user.getName()} image={avatarUrl} size="large" />
            </div>
            <div className="cometchat-call-log-details__user-text">
              <div className="cometchat-call-log-details__user-name">{user.getName()}</div>
              <div className="cometchat-call-log-details__subtitle">{subtitleText}</div>
            </div>
            <div className="cometchat-call-log-details__call-buttons">
              <CometChatCallButtons
                user={user}
                className="cometchat-call-log-details__call-buttons-wrapper"
              />
            </div>
          </div>
        ) : (
          getLoadingView()
        )}
      </div>

      <CometChatCallLogInfo call={selectedItem} />

      <div className="cometchat-call-log-details__tabs">
        {callDetailTabItems.map((tabItem) => (
          <div
            key={tabItem.id}
            onClick={() => setActiveTab(tabItem.id)}
            className={
              activeTab === tabItem.id
                ? 'cometchat-call-log-details__tabs-tab-item-active'
                : 'cometchat-call-log-details__tabs-tab-item'
            }
          >
            {tabItem.name}
          </div>
        ))}
      </div>

      {activeTab === 'participants' ? (
        <CometChatCallLogParticipants call={selectedItem} />
      ) : activeTab === 'recording' ? (
        <div className="cometchat-call-log-details__tab-content">
          <CometChatCallLogRecordings call={selectedItem} />
        </div>
      ) : activeTab === 'history' ? (
        <CometChatCallLogHistory call={selectedItem} />
      ) : null}
    </div>
  );
};
