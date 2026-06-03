import React, { useCallback, useMemo } from 'react';
import type { CometChatMessageHeaderOverflowMenuProps } from './CometChatMessageHeader.types';
import { useCometChatMessageHeaderContext } from './CometChatMessageHeader.context';
import { CometChatContextMenu } from '../base/CometChatContextMenu';
import searchIcon from '../../assets/search.svg';
import conversationSummaryIcon from '../../assets/ai_conversation_summary.svg';
import './CometChatMessageHeader.css';
import { useLocale } from '../../context/locale/LocaleContext';

/**
 * CometChatMessageHeaderOverflowMenu — context menu for search + summary.
 *
 * Renders when both search and summary buttons are enabled.
 * Uses CometChatContextMenu for the dropdown. Matches menu
 * with icon + title per option.
 */
export const CometChatMessageHeaderOverflowMenu: React.FC<
  CometChatMessageHeaderOverflowMenuProps
> = ({ className }) => {
  const { getLocalizedString } = useLocale();
  const { onSearchOptionClicked, onSummaryClick } = useCometChatMessageHeaderContext();

  const menuItems = useMemo(
    () => [
      {
        id: 'search',
        title: getLocalizedString('search_title'),
        iconURL: searchIcon,
        onClick: () => {
          onSearchOptionClicked?.();
        },
      },
      {
        id: 'summary',
        title: getLocalizedString('ai_conversation_summary_title'),
        iconURL: conversationSummaryIcon,
        onClick: () => {
          onSummaryClick?.();
        },
      },
    ],
    [onSearchOptionClicked, onSummaryClick, getLocalizedString]
  );

  const handleOptionClick = useCallback((item: { id: string; onClick?: () => void }) => {
    item.onClick?.();
  }, []);

  const rootClasses = ['cometchat-message-header__overflow-menu', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={rootClasses}
      onClick={e => {
        e.stopPropagation();
      }}
      onKeyDown={e => {
        if (e.key === 'Escape') e.stopPropagation();
      }}
      role="presentation"
    >
      <CometChatContextMenu.Root>
        <CometChatContextMenu.Trigger>
          <div
            className={'cometchat-message-header__menu-button'}
            aria-label={getLocalizedString('accessibility_more_options')}
            tabIndex={0}
            role="button"
          >
            <span
              className={[
                'cometchat-message-header__menu-button-icon',
                'cometchat-message-header__menu-button-icon--more',
              ].join(' ')}
              aria-hidden="true"
            />
          </div>
        </CometChatContextMenu.Trigger>
        <CometChatContextMenu.Dropdown>
          {menuItems.map(item => (
            <CometChatContextMenu.Item
              key={item.id}
              item={{
                id: item.id,
                title: item.title,
                iconURL: item.iconURL,
                onClick: () => {
                  handleOptionClick(item);
                },
              }}
            />
          ))}
        </CometChatContextMenu.Dropdown>
      </CometChatContextMenu.Root>
    </div>
  );
};

CometChatMessageHeaderOverflowMenu.displayName = 'CometChatMessageHeaderOverflowMenu';
