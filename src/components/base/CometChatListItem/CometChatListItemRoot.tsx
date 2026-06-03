import { useState, useCallback, useMemo, Children, isValidElement } from 'react';
import type { KeyboardEvent, MouseEvent, ReactNode } from 'react';
import type { CometChatListItemRootProps } from './CometChatListItem.types';
import { CometChatListItemContext } from './CometChatListItem.context';
import { CometChatListItemLeadingView } from './CometChatListItemLeadingView';
import { CometChatListItemTrailingView } from './CometChatListItemTrailingView';
import { CometChatListItemMenuView } from './CometChatListItemMenuView';
import './CometChatListItem.css';

/**
 * Separates children into layout slots based on sub-component type.
 */
function separateChildren(children: ReactNode) {
  let leadingView: ReactNode = null;
  const titleChildren: ReactNode[] = [];
  let trailingView: ReactNode = null;
  let menuView: ReactNode = null;

  Children.forEach(children, child => {
    if (!isValidElement(child)) return;

    if (child.type === CometChatListItemLeadingView) {
      leadingView = child;
    } else if (child.type === CometChatListItemTrailingView) {
      trailingView = child;
    } else if (child.type === CometChatListItemMenuView) {
      menuView = child;
    } else {
      // Title, Subtitle, and any other children go in the title container
      titleChildren.push(child);
    }
  });

  return { leadingView, titleChildren, trailingView, menuView };
}

export function CometChatListItemRoot({
  id,
  isActive = false,
  disabled = false,
  onItemClick,
  children,
  className,
  'aria-label': ariaLabel,
  menuShortcutKey = 'M',
  disableTabIndex = false,
  isFocused = false,
}: CometChatListItemRootProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isListItemFocused, setIsListItemFocused] = useState(false);

  const handleMouseEnter = useCallback(() => {
    if (!disabled) {
      setIsHovering(true);
      setIsMenuVisible(true);
    }
  }, [disabled]);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    if (!isListItemFocused) {
      setIsMenuVisible(false);
    }
  }, [isListItemFocused]);

  const handleFocus = useCallback(() => {
    setIsListItemFocused(true);
    setIsMenuVisible(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsListItemFocused(false);
    if (!isHovering) {
      setIsMenuVisible(false);
    }
  }, [isHovering]);

  const handleClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (disabled) return;

      const target = event.target as HTMLElement;
      const currentTarget = event.currentTarget as HTMLElement;

      // Skip if the click was on a nested interactive element (button, link, tabindex)
      // but NOT if the interactive element is the root itself.
      const isNestedInteractive =
        target !== currentTarget &&
        (target.tagName === 'BUTTON' ||
          target.tagName === 'A' ||
          target.closest('button, a, [tabindex]:not([role="option"])'));

      if (!isNestedInteractive) {
        onItemClick?.(event);
      }
    },
    [disabled, onItemClick]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;

      const target = event.target as HTMLElement;
      const currentTarget = event.currentTarget as HTMLElement;
      if (target !== currentTarget) return;

      switch (event.key) {
        case 'Enter':
        case ' ':
          event.preventDefault();
          onItemClick?.(event);
          break;
        default:
          if (menuShortcutKey) {
            const pressedKey = event.key.toLowerCase();
            const shortcutKey = menuShortcutKey.toLowerCase();
            if (pressedKey === shortcutKey) {
              event.preventDefault();
              setIsMenuVisible(prev => !prev);
            }
          }
          break;
      }
    },
    [disabled, onItemClick, menuShortcutKey]
  );

  const showMenu = isHovering || isMenuVisible || isFocused;

  const { leadingView, titleChildren, trailingView, menuView } = separateChildren(children);

  const contextValue = useMemo(
    () => ({
      isHovered: isHovering || isFocused,
      isActive,
      disabled,
      id,
      isMenuVisible: showMenu,
      hasMenuView: Boolean(menuView),
    }),
    [isHovering, isFocused, isActive, disabled, id, showMenu, menuView]
  );

  const rootClasses = [
    'cometchat-list-item',
    isActive ? 'cometchat-list-item--active' : '',
    disabled ? 'cometchat-list-item--disabled' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <CometChatListItemContext.Provider value={contextValue}>
      <div
        className={rootClasses}
        id={id}
        role="option"
        tabIndex={disableTabIndex ? -1 : 0}
        aria-selected={isActive}
        aria-disabled={disabled || undefined}
        aria-label={ariaLabel}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        {leadingView}
        <div className={'cometchat-list-item__body'}>
          <div className={'cometchat-list-item__title-container'}>{titleChildren}</div>
          {trailingView}
          {menuView}
        </div>
      </div>
    </CometChatListItemContext.Provider>
  );
}
