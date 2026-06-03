import { useEffect, useState } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { useLocale } from '@cometchat/chat-uikit-react';
import { CometChatDate } from '@cometchat/chat-uikit-react';
import '../../styles/CometChatCallLog/CometChatCallLogInfo.css';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const CometChatCallLogInfo = ({ call }: { call: any }) => {
  const { getLocalizedString } = useLocale();
  const [loggedInUser, setLoggedInUser] = useState<CometChat.User | null>(null);

  useEffect(() => {
    CometChat.getLoggedinUser().then((user) => setLoggedInUser(user));
  }, []);

  const isSentByMe = (): boolean => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const initiatorUid: string = call?.getInitiator?.()?.getUid?.() ?? '';
    return !initiatorUid || initiatorUid === loggedInUser?.getUid();
  };

  const getCallStatus = (): string => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const status: string = (call?.getStatus?.() as string) ?? '';
    const sentByMe = isSentByMe();

    const missedStatuses = ['unanswered', 'cancelled', 'busy', 'rejected'];
    if (!sentByMe && missedStatuses.includes(status)) {
      return getLocalizedString('sample_missed_call');
    }
    if (sentByMe) {
      return getLocalizedString('sample_outgoing_call');
    }
    return getLocalizedString('sample_incoming_call');
  };

  const getCallDuration = (): string => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const minutes: number = (call?.getTotalDurationInMinutes?.() as number) ?? 0;
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

  const initiatedAt: number = (call?.getInitiatedAt?.() as number) ?? 0;

  if (!loggedInUser) return null;

  const callStatus = getCallStatus();
  const isMissed = callStatus === getLocalizedString('sample_missed_call');
  const duration = getCallDuration();
  const hasDuration = duration !== '00:00';

  return (
    <div className="cometchat-call-log-info">
      <div className="cometchat-call-log-info__item">
        <div className={`cometchat-call-log-info__icon ${isMissed ? 'cometchat-call-log-info__icon--missed' : callStatus === getLocalizedString('sample_outgoing_call') ? 'cometchat-call-log-info__icon--outgoing' : 'cometchat-call-log-info__icon--incoming'}`} />
        <div className="cometchat-call-log-info__text">
          <div className="cometchat-call-log-info__title">{callStatus}</div>
          <div className="cometchat-call-log-info__subtitle">
            {initiatedAt > 0 ? (
              <CometChatDate.Root
                timestamp={initiatedAt}
                formatConfig={{
                  today: 'DD MMM, hh:mm A',
                  yesterday: 'DD MMM, hh:mm A',
                  lastWeek: 'DD MMM, hh:mm A',
                  otherDays: 'DD MMM, hh:mm A',
                }}
                variant="body"
              >
                <CometChatDate.Text />
              </CometChatDate.Root>
            ) : ''}
          </div>
        </div>
        <div className={hasDuration ? 'cometchat-call-log-info__duration' : 'cometchat-call-log-info__duration--disabled'}>
          {duration}
        </div>
      </div>
    </div>
  );
};
