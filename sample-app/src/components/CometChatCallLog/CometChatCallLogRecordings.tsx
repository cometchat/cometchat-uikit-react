import { useLocale } from '@cometchat/chat-uikit-react';
import './CometChatCallLogRecordings.css';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const CometChatCallLogRecordings = ({ call }: { call: any }) => {
  const { getLocalizedString } = useLocale();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  const recordings = call?.getRecordings?.() ?? null;

  if (!recordings || recordings.length === 0) {
    return (
      <div className="cometchat-call-log-recordings__empty-state">
        <div className="cometchat-call-log-recordings__empty-state-icon" />
        <div className="cometchat-call-log-recordings__empty-state-text">
          {getLocalizedString('sample_no_recording_available')}
        </div>
      </div>
    );
  }

  return (
    <div className="cometchat-call-log-recordings">
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {recordings.map((item: any, index: number) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const rid: string = (item?.getRid?.() as string) ?? `Recording ${String(index + 1)}`;
        return (
          <div key={index} className="cometchat-call-log-recordings__item">
            <div className="cometchat-call-log-recordings__item-title">{rid}</div>
          </div>
        );
      })}
    </div>
  );
};
