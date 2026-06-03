import type { MouseEvent } from 'react';
import type { CometChatListItemTrailingViewProps } from './CometChatListItem.types';
import { useCometChatListItemContext } from './CometChatListItem.context';
import './CometChatListItem.css';

export function CometChatListItemTrailingView({
  children,
  className,
}: CometChatListItemTrailingViewProps) {
  const { isMenuVisible, hasMenuView } = useCometChatListItemContext();

  // When menu is visible (hover/focus) AND a MenuView exists, hide the trailing view
  // so the menu can take its place. If no MenuView exists, always show trailing view.
  if (isMenuVisible && hasMenuView) return null;

  return (
    <div
      className={`cometchat-list-item__trailing-view ${className ?? ''}`}
      onClick={(event: MouseEvent<HTMLDivElement>) => {
        event.stopPropagation();
      }}
      onKeyDown={event => {
        event.stopPropagation();
      }}
    >
      {children}
    </div>
  );
}
