import { useCometChatDateContext } from './CometChatDate.context';
import './CometChatDate.css';
import type { CometChatDateTextProps } from './CometChatDate.types';

export function CometChatDateText({ className }: CometChatDateTextProps) {
  const { formattedDate } = useCometChatDateContext();

  return <span className={`cometchat-date__text ${className ?? ''}`}>{formattedDate}</span>;
}
