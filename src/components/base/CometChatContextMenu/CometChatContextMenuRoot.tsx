import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  CometChatContextMenuRootProps,
  CometChatContextMenuContextValue,
} from './CometChatContextMenu.types';
import { CometChatContextMenuContext } from './CometChatContextMenu.context';
import { CometChatContextMenuItem } from './CometChatContextMenuItem';
import { CometChatContextMenuTrigger } from './CometChatContextMenuTrigger';
import { CometChatContextMenuDropdown } from './CometChatContextMenuDropdown';
import { useCometChatFrameContext } from '../../../context/CometChatFrameContext';
import './CometChatContextMenu.css';

/**
 * Root container for the context menu.
 * Provides context and orchestrates top-row items + dropdown.
 *
 * When `children` is provided, renders them directly (fully custom mode).
 * Otherwise, splits `items` into top-row and dropdown based on `topMenuSize`.
 */
export const CometChatContextMenuRoot: React.FC<CometChatContextMenuRootProps> = ({
  items = [],
  topMenuSize = 2,
  onOptionClicked,
  placement = 'left',
  moreButtonTooltip,
  closeOnOutsideClick = true,
  disableBackgroundInteraction = false,
  onDropdownClose,
  useParentContainer = false,
  useParentHeight = false,
  forceStaticPlacement = false,
  children,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const IframeContext = useCometChatFrameContext();

  const getCurrentDocument = useCallback(() => {
    return IframeContext.iframeDocument ?? document;
  }, [IframeContext.iframeDocument]);
  const onDropdownCloseRef = useRef(onDropdownClose);
  onDropdownCloseRef.current = onDropdownClose;

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);
  const close = useCallback(() => {
    setIsOpen(false);
    onDropdownCloseRef.current?.();
  }, []);
  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  // Close on outside click.
  useEffect(() => {
    if (!isOpen || !closeOnOutsideClick) return;

    const handleClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        close();
      }
    };

    getCurrentDocument().addEventListener('mousedown', handleClick);
    return () => {
      getCurrentDocument().removeEventListener('mousedown', handleClick);
    };
  }, [isOpen, closeOnOutsideClick, close, getCurrentDocument]);

  const ctxValue = useMemo<CometChatContextMenuContextValue>(
    () => ({
      isOpen,
      open,
      close,
      toggle,
      placement,
      onOptionClicked,
      triggerRef,
      useParentContainer,
      useParentHeight,
      forceStaticPlacement,
      disableBackgroundInteraction,
    }),
    [
      isOpen,
      open,
      close,
      toggle,
      placement,
      onOptionClicked,
      useParentContainer,
      useParentHeight,
      forceStaticPlacement,
      disableBackgroundInteraction,
    ]
  );

  const baseClass = 'cometchat-context-menu';
  const classes = [baseClass, className].filter(Boolean).join(' ');

  // Fully custom rendering.
  if (children) {
    return (
      <CometChatContextMenuContext.Provider value={ctxValue}>
        <div ref={rootRef} className={classes}>
          {children}
        </div>
      </CometChatContextMenuContext.Provider>
    );
  }

  // Data-driven rendering: split items into top-row and overflow.
  const effectiveTopSize = Math.max(0, Math.min(topMenuSize, items.length));
  const topItems = items.slice(0, effectiveTopSize);
  const overflowItems = items.slice(effectiveTopSize);
  const showTrigger = overflowItems.length > 0;

  return (
    <CometChatContextMenuContext.Provider value={ctxValue}>
      <div ref={rootRef} className={classes}>
        <div className={'cometchat-context-menu__top-menu'}>
          {topItems.map(item => (
            <CometChatContextMenuItem key={item.id} item={item} variant="icon" />
          ))}
          {showTrigger && (
            <div className={'cometchat-context-menu__trigger-wrapper'}>
              <CometChatContextMenuTrigger tooltip={moreButtonTooltip} />
              <CometChatContextMenuDropdown>
                {overflowItems.map(item => (
                  <CometChatContextMenuItem key={item.id} item={item} variant="full" />
                ))}
              </CometChatContextMenuDropdown>
            </div>
          )}
        </div>
      </div>
    </CometChatContextMenuContext.Provider>
  );
};
