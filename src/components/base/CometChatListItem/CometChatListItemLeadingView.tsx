import type { CometChatListItemLeadingViewProps } from './CometChatListItem.types';
import './CometChatListItem.css';

export function CometChatListItemLeadingView({
  children,
  className,
}: CometChatListItemLeadingViewProps) {
  return <div className={`cometchat-list-item__leading-view ${className ?? ''}`}>{children}</div>;
}
