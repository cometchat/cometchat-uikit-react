import type { MouseEvent } from 'react';
import type { CometChatListItemMenuViewProps } from './CometChatListItem.types';
import { useCometChatListItemContext } from './CometChatListItem.context';
import { useLocale } from '../../../context/locale/LocaleContext';
import './CometChatListItem.css';

export function CometChatListItemMenuView({ children, className }: CometChatListItemMenuViewProps) {
  const { isMenuVisible } = useCometChatListItemContext();
  const { getLocalizedString } = useLocale();

  if (!isMenuVisible) return null;

  return (
    <div
      className={`cometchat-list-item__menu-view ${className ?? ''}`}
      role="group"
      aria-label={getLocalizedString('accessibility_actions_for_item')}
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
