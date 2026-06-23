import { useLocale } from '@cometchat/chat-uikit-react';
import './CometChatCallLogParticipants.css';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const CometChatCallLogParticipants = ({ call }: { call: any }) => {
  const { getLocalizedString } = useLocale();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any
  const participants: any[] = call?.getParticipants?.() ?? [];

  const convertMinutesToDisplay = (minutes: number): string => {
    const hrs = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    const secs = Math.floor((minutes - Math.floor(minutes)) * 60);
    const parts: string[] = [];
    if (hrs > 0) parts.push(`${String(hrs)}h`);
    if (mins > 0) parts.push(`${String(mins)}m`);
    parts.push(`${String(secs)}s`);
    return parts.join(' ');
  };

  if (!participants || participants.length === 0) {
    return (
      <div className="cometchat-call-log-participants__empty">
        {getLocalizedString('sample_no_participants_data')}
      </div>
    );
  }

  return (
    <div className="cometchat-call-log-participants">
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {participants.map((participant: any, index: number) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const name: string = (participant?.getName?.() as string) ?? 'Unknown';
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const avatar: string = (participant?.getAvatar?.() as string) ?? '';
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const hasJoined: boolean = !!(participant?.getHasJoined?.() ?? participant?.getJoinedAt?.());
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const duration: number = (participant?.getTotalDurationInMinutes?.() as number) ?? 0;

        return (
          <div key={index} className="cometchat-call-log-participants__item">
            {avatar ? (
              <img className="cometchat-call-log-participants__avatar" src={avatar} alt={name} />
            ) : (
              <div className="cometchat-call-log-participants__avatar-initials">
                {name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
              </div>
            )}
            <div className="cometchat-call-log-participants__info">
              <div className="cometchat-call-log-participants__name">{name}</div>
            </div>
            <div className={hasJoined ? 'cometchat-call-log-participants__duration' : 'cometchat-call-log-participants__duration--disabled'}>
              {hasJoined ? convertMinutesToDisplay(duration) : '0s'}
            </div>
          </div>
        );
      })}
    </div>
  );
};
