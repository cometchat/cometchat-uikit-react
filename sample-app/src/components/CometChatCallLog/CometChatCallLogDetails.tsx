import { useEffect, useId, useRef, useState } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatAvatar, CometChatOutgoingCall, CometChatOngoingCall, verifyCallUser, useLocale } from '@cometchat/chat-uikit-react';
import { CometChatCallLogInfo } from './CometChatCallLogInfo';
import { CometChatCallLogParticipants } from './CometChatCallLogParticipants';
import { CometChatCallLogHistory } from './CometChatCallLogHistory';
import { CometChatCallLogRecordings } from './CometChatCallLogRecordings';
import audioCallIcon from '../../assets/audio_call_button.svg';
import videoCallIcon from '../../assets/video_call_button.svg';
import '../../styles/CometChatCallLog/CometChatCallLogDetails.css';

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
  const [showOutgoing, setShowOutgoing] = useState(false);
  const [showOngoing, setShowOngoing] = useState(false);
  const [activeCall, setActiveCall] = useState<CometChat.Call | null>(null);
  const [callSessionId, setCallSessionId] = useState('');
  const activeCallRef = useRef<CometChat.Call | null>(null);
  const listenerId = useId();

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
        // Get avatar from call log entity (not from fetched user — fetched user may have default avatar)
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

  const handleVoiceCall = () => {
    if (!user) return;
    const callObj = new CometChat.Call(user.getUid(), CometChat.CALL_TYPE.AUDIO, CometChat.RECEIVER_TYPE.USER);
    CometChat.initiateCall(callObj).then(
      (outgoingCall: CometChat.Call) => {
        activeCallRef.current = outgoingCall;
        setActiveCall(outgoingCall);
        setShowOutgoing(true);
      },
      (err) => console.error('initiateCall error:', err)
    );
  };

  const handleVideoCall = () => {
    if (!user) return;
    const callObj = new CometChat.Call(user.getUid(), CometChat.CALL_TYPE.VIDEO, CometChat.RECEIVER_TYPE.USER);
    CometChat.initiateCall(callObj).then(
      (outgoingCall: CometChat.Call) => {
        activeCallRef.current = outgoingCall;
        setActiveCall(outgoingCall);
        setShowOutgoing(true);
      },
      (err) => console.error('initiateCall error:', err)
    );
  };

  const cancelOutgoingCall = () => {
    if (!activeCall) return;
    CometChat.rejectCall(activeCall.getSessionId(), CometChat.CALL_STATUS.CANCELLED).then(
      () => {
        setShowOutgoing(false);
        setActiveCall(null);
        activeCallRef.current = null;
      },
      () => {
        setShowOutgoing(false);
        setActiveCall(null);
        activeCallRef.current = null;
      }
    );
  };

  const closeCallScreen = () => {
    setShowOngoing(false);
    setCallSessionId('');
    setActiveCall(null);
    activeCallRef.current = null;
  };

  // Call listener for outgoing call accepted/rejected
  useEffect(() => {
    if (!user) return;
    const id = `callLogDetails_call_${listenerId}`;
    CometChat.addCallListener(
      id,
      new CometChat.CallListener({
        onOutgoingCallAccepted: (call: CometChat.Call) => {
          if (activeCallRef.current && call.getSessionId() === activeCallRef.current.getSessionId()) {
            setShowOutgoing(false);
            setCallSessionId(call.getSessionId());
            setShowOngoing(true);
            setActiveCall(null);
            activeCallRef.current = null;
          }
        },
        onOutgoingCallRejected: () => {
          setShowOutgoing(false);
          setActiveCall(null);
          activeCallRef.current = null;
        },
      })
    );
    return () => {
      CometChat.removeCallListener(id);
    };
  }, [user, listenerId]);

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
      {/* Outgoing call overlay */}
      {showOutgoing && activeCall && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
          <CometChatOutgoingCall
            call={activeCall}
            onCallCanceled={cancelOutgoingCall}
          />
        </div>
      )}

      {/* Ongoing call overlay */}
      {showOngoing && callSessionId && (
        <CometChatOngoingCall
          sessionID={callSessionId}
          isAudioOnly={activeCall?.getType() === 'audio'}
          isDirectCalling={false}
          onCallEnded={closeCallScreen}
        />
      )}

      <div className="cometchat-call-log-details__header">
        <div className="cometchat-call-log-details__header-back" onClick={onBack} />
        {getLocalizedString('sample_call_details')}
      </div>

      <div className="cometchat-call-log-details__call-log-item">
        {user ? (
          <div className="cometchat-call-log-details__user-info">
            <div className="cometchat-call-log-details__user-avatar-wrapper">
              <CometChatAvatar.Root name={user.getName()} image={avatarUrl} size="large">
                <CometChatAvatar.Image />
                <CometChatAvatar.Initials />
              </CometChatAvatar.Root>
            </div>
            <div className="cometchat-call-log-details__user-text">
              <div className="cometchat-call-log-details__user-name">{user.getName()}</div>
              <div className="cometchat-call-log-details__subtitle">{subtitleText}</div>
            </div>
            <div className="cometchat-call-log-details__call-buttons">
              <button
                className="cometchat-call-log-details__call-button"
                onClick={handleVoiceCall}
                aria-label="Voice call"
                type="button"
              >
                <img src={audioCallIcon} alt="" className="cometchat-call-log-details__call-button-icon" />
              </button>
              <button
                className="cometchat-call-log-details__call-button"
                onClick={handleVideoCall}
                aria-label="Video call"
                type="button"
              >
                <img src={videoCallIcon} alt="" className="cometchat-call-log-details__call-button-icon" />
              </button>
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
