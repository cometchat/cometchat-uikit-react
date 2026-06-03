import { useCallback, useEffect, useRef, useState } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatUIKitCalls, verifyCallUser, useLocale } from '@cometchat/chat-uikit-react';
import '../../styles/CometChatCallLog/CometChatCallLogHistory.css';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const CometChatCallLogHistory = ({ call }: { call: any }) => {
  const { getLocalizedString } = useLocale();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [callList, setCallList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggedInUser, setLoggedInUser] = useState<CometChat.User | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const requestBuilder = useRef<any>(null);

  useEffect(() => {
    CometChat.getLoggedinUser().then((user) => setLoggedInUser(user));
  }, []);

  useEffect(() => {
    if (!loggedInUser || !CometChatUIKitCalls) return;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const callUser = verifyCallUser(call, loggedInUser);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const callUserId: string = (callUser?.uid ?? callUser?.getUid?.()) as string;
    const authToken = loggedInUser.getAuthToken();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    let builder = new CometChatUIKitCalls.CallLogRequestBuilder()
      .setLimit(30)
      .setCallCategory('call')
      .setAuthToken(authToken);

    if (callUserId) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      builder = builder.setUid(callUserId);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    requestBuilder.current = builder.build();
    void fetchCallList();
  }, [loggedInUser]);

  const fetchCallList = useCallback(async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const calls = await requestBuilder.current?.fetchNext();
      if (calls && calls.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        setCallList((prev) => [...prev, ...calls]);
      }
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, []);

  const isSentByMe = (item: any): boolean => { // eslint-disable-line @typescript-eslint/no-explicit-any
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const initiatorUid: string = (item?.getInitiator?.()?.getUid?.() as string) ?? '';
    return !initiatorUid || initiatorUid === loggedInUser?.getUid();
  };

  const getCallStatus = (item: any): string => { // eslint-disable-line @typescript-eslint/no-explicit-any
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const status: string = (item?.getStatus?.() as string) ?? '';
    const sentByMe = isSentByMe(item);
    const missedStatuses = ['unanswered', 'cancelled', 'busy', 'rejected'];
    if (!sentByMe && missedStatuses.includes(status)) return getLocalizedString('sample_missed_call');
    if (sentByMe) return getLocalizedString('sample_outgoing_call');
    return getLocalizedString('sample_incoming_call');
  };

  const formatDate = (item: any): string => { // eslint-disable-line @typescript-eslint/no-explicit-any
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const timestamp: number = (item?.getInitiatedAt?.() as number) ?? 0;
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    const day = String(date.getDate());
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()] ?? '';
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;
    return `${day} ${month}, ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
  };

  const getDuration = (item: any): string => { // eslint-disable-line @typescript-eslint/no-explicit-any
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const minutes: number = (item?.getTotalDurationInMinutes?.() as number) ?? 0;
    if (!minutes) return '00:00';
    const hrs = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    const secs = Math.floor((minutes - Math.floor(minutes)) * 60);
    const parts: string[] = [];
    if (hrs > 0) parts.push(`${String(hrs)}h`);
    if (mins > 0) parts.push(`${String(mins)}m`);
    parts.push(`${String(secs)}s`);
    return parts.join(' ');
  };

  if (loading) {
    return (
      <div className="cometchat-call-log-history__shimmer">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="cometchat-call-log-history__shimmer-item">
            <div className="cometchat-call-log-history__shimmer-item-avatar" />
            <div className="cometchat-call-log-history__shimmer-item-body">
              <div className="cometchat-call-log-history__shimmer-item-body-title" />
              <div className="cometchat-call-log-history__shimmer-item-body-subtitle" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (callList.length === 0) {
    return <div className="cometchat-call-log-history__empty">{getLocalizedString('sample_no_call_history')}</div>;
  }

  return (
    <div className="cometchat-call-log-history">
      {callList.map((item, index) => (
        <div key={index} className="cometchat-call-log-history__item">
          <div className={`cometchat-call-log-history__icon ${getCallStatus(item) === getLocalizedString('sample_missed_call') ? 'cometchat-call-log-history__icon--missed' : getCallStatus(item) === getLocalizedString('sample_outgoing_call') ? 'cometchat-call-log-history__icon--outgoing' : 'cometchat-call-log-history__icon--incoming'}`} />
          <div className="cometchat-call-log-history__text">
            <div className="cometchat-call-log-history__title">{getCallStatus(item)}</div>
            <div className="cometchat-call-log-history__subtitle">{formatDate(item)}</div>
          </div>
          <div className="cometchat-call-log-history__duration">{getDuration(item)}</div>
        </div>
      ))}
    </div>
  );
};
