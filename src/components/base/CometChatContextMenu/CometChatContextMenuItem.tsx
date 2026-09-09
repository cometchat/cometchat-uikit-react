import React from 'react';
import type { CometChatContextMenuItemProps } from './CometChatContextMenu.types';
import { useCometChatContextMenuContext } from './CometChatContextMenu.context';
import { CometChatContextMenuSubmenu } from './CometChatContextMenuSubmenu';
import './CometChatContextMenu.css';

/**
 * A single menu item rendered as a button.
 * - `variant="icon"`: icon-only button for the top row.
 * - `variant="full"`: icon + title for the dropdown.
 *
 * An item carrying a non-empty `submenu` renders as a fly-out disclosure row
 * instead — see CometChatContextMenuSubmenu. Submenus only exist in the dropdown,
 * so an icon-variant item ignores them.
 */
export const CometChatContextMenuItem: React.FC<CometChatContextMenuItemProps> = ({
  item,
  variant = 'full',
  className,
}) => {
  const { onOptionClicked, close } = useCometChatContextMenuContext();

  if (variant !== 'icon' && item.submenu && item.submenu.length > 0) {
    return <CometChatContextMenuSubmenu item={item} {...(className ? { className } : {})} />;
  }

  const handleClick = () => {
    if (item.disabled) return;
    if (onOptionClicked) {
      onOptionClicked(item);
    } else {
      item.onClick();
    }
    close();
  };

  const isIcon = variant === 'icon';

  const baseClass = isIcon
    ? 'cometchat-context-menu__top-menu-item'
    : 'cometchat-context-menu__dropdown-item';
  const disabledClass =
    !isIcon && item.disabled ? 'cometchat-context-menu__dropdown-item--disabled' : '';
  const classes = [baseClass, disabledClass, item.className, className].filter(Boolean).join(' ');

  const iconSize = isIcon ? 16 : 24;

  const iconContent = item.icon ? (
    <span
      className={
        isIcon
          ? 'cometchat-context-menu__top-menu-item-icon'
          : 'cometchat-context-menu__dropdown-item-icon'
      }
    >
      {item.icon}
    </span>
  ) : item.iconURL ? (
    <img
      className={
        isIcon
          ? 'cometchat-context-menu__top-menu-item-icon'
          : 'cometchat-context-menu__dropdown-item-icon'
      }
      src={item.iconURL}
      alt=""
      aria-hidden="true"
      width={iconSize}
      height={iconSize}
      style={{ width: iconSize, height: iconSize, flexShrink: 0 }}
    />
  ) : null;

  if (isIcon) {
    return (
      <button
        type="button"
        className={classes}
        onClick={handleClick}
        disabled={item.disabled}
        aria-disabled={item.disabled ?? undefined}
        aria-label={item.title}
        title={item.title}
      >
        {iconContent}
      </button>
    );
  }

  return (
    <button
      type="button"
      role="menuitem"
      className={classes}
      onClick={handleClick}
      disabled={item.disabled}
      aria-disabled={item.disabled ?? undefined}
      tabIndex={-1}
    >
      {iconContent}
      <span className={'cometchat-context-menu__dropdown-item-title'}>{item.title}</span>
    </button>
  );
};
