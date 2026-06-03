import React from 'react';
import type { CometChatActionSheetItemProps } from './CometChatActionSheet.types';
import { useCometChatActionSheetContext } from './CometChatActionSheet.context';
import './CometChatActionSheet.css';

/**
 * A single action item rendered as a button inside the sheet.
 */
export const CometChatActionSheetItem: React.FC<CometChatActionSheetItemProps> = ({
  item,
  className,
}) => {
  const { layoutMode } = useCometChatActionSheetContext();
  const isGrid = layoutMode === 'grid';

  const baseClass = isGrid ? 'cometchat-action-sheet__item--grid' : 'cometchat-action-sheet__item';
  const combinedClass = className ? `${baseClass} ${className}` : baseClass;
  const finalClass = item.className ? `${combinedClass} ${item.className}` : combinedClass;

  return (
    <button
      type="button"
      className={finalClass}
      onClick={item.disabled ? undefined : item.onClick}
      disabled={item.disabled}
      aria-disabled={item.disabled}
    >
      {item.icon ? <span className={'cometchat-action-sheet__item-icon'}>{item.icon}</span> : null}
      <span className={'cometchat-action-sheet__item-title'}>{item.title}</span>
      {item.subtitle && !isGrid ? (
        <span className={'cometchat-action-sheet__item-subtitle'}>{item.subtitle}</span>
      ) : null}
    </button>
  );
};
