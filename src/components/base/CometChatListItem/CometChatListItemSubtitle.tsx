import type { CometChatListItemSubtitleProps } from './CometChatListItem.types';
import './CometChatListItem.css';

export function CometChatListItemSubtitle({ children, className }: CometChatListItemSubtitleProps) {
  return <div className={`cometchat-list-item__subtitle ${className ?? ''}`}>{children}</div>;
}
