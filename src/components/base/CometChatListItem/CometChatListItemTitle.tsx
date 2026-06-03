import type { CometChatListItemTitleProps } from './CometChatListItem.types';
import './CometChatListItem.css';

export function CometChatListItemTitle({ children, className }: CometChatListItemTitleProps) {
  return (
    <div
      className={`cometchat-list-item__title ${className ?? ''}`}
      title={typeof children === 'string' ? children : undefined}
    >
      {children}
    </div>
  );
}
