import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { CometChatContextMenuDropdownProps } from './CometChatContextMenu.types';
import { useCometChatContextMenuContext } from './CometChatContextMenu.context';
import { useCometChatFrameContext } from '../../../context/CometChatFrameContext';
import './CometChatContextMenu.css';
import { useLocale } from '../../../context/locale/LocaleContext';

interface DropdownPosition {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
}

/**
 * Dropdown popover for overflow menu items.
 *
 * Positioning logic:
 * - Uses `position: fixed` so the dropdown escapes any `overflow: hidden` ancestors.
 * - Calculates position relative to the viewport using `getBoundingClientRect()`.
 * - Default: below the trigger, left edge aligned with trigger's left edge.
 * - If not enough space on the right: shift left, only as much as needed.
 * - If not enough space below: open above the trigger.
 * - No flicker: renders invisible first, measures, then shows at final position.
 */
export const CometChatContextMenuDropdown: React.FC<CometChatContextMenuDropdownProps> = ({
  children,
  className,
  useParentContainer: useParentContainerProp,
  useParentHeight: useParentHeightProp,
  forceStaticPlacement: forceStaticPlacementProp,
}) => {
  const { getLocalizedString } = useLocale();
  const {
    isOpen,
    close,
    triggerRef,
    placement,
    useParentContainer: useParentContainerCtx,
    useParentHeight: useParentHeightCtx,
    forceStaticPlacement: forceStaticPlacementCtx,
    disableBackgroundInteraction,
  } = useCometChatContextMenuContext();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<DropdownPosition | null>(null);
  const [measured, setMeasured] = useState(false);
  const IframeContext = useCometChatFrameContext();

  const getCurrentDocument = useCallback(() => {
    return IframeContext.iframeDocument ?? document;
  }, [IframeContext.iframeDocument]);

  // Props take precedence over context
  const useParentContainer = useParentContainerProp ?? useParentContainerCtx ?? false;
  const useParentHeight = useParentHeightProp ?? useParentHeightCtx ?? false;
  const forceStaticPlacement = forceStaticPlacementProp ?? forceStaticPlacementCtx ?? false;

  const getCurrentWindow = useCallback(() => {
    return IframeContext.iframeWindow ?? window;
  }, [IframeContext.iframeWindow]);

  // Close on scroll when disableBackgroundInteraction is enabled
  useEffect(() => {
    if (!isOpen || !disableBackgroundInteraction) return;

    const handleScroll = () => {
      close();
    };

    // Listen on capture phase to catch scroll on any ancestor
    getCurrentDocument().addEventListener('scroll', handleScroll, true);
    return () => {
      getCurrentDocument().removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen, disableBackgroundInteraction, close, getCurrentDocument]);

  // Measure and compute position after the dropdown content renders
  useEffect(() => {
    if (!isOpen) {
      setPosition(null);
      setMeasured(false);
      return;
    }

    // Use rAF to ensure the dropdown content has rendered so we can measure it
    const id = requestAnimationFrame(() => {
      const dropdown = dropdownRef.current;
      const trigger = triggerRef.current;
      if (!dropdown || !trigger) return;

      const triggerRect = trigger.getBoundingClientRect();
      const dropdownRect = dropdown.getBoundingClientRect();
      const padding = 8;

      // Determine boundary: parent container or viewport
      let boundaryTop = 0;
      let boundaryBottom = getCurrentWindow().innerHeight;
      let boundaryLeft = 0;
      let boundaryRight = getCurrentWindow().innerWidth;

      if (useParentContainer) {
        // Find the nearest `.cometchat` ancestor or scrollable parent
        let parent: HTMLElement | null = trigger.parentElement;
        while (parent) {
          if (parent.classList.contains('cometchat') || parent.scrollHeight > parent.clientHeight) {
            const parentRect = parent.getBoundingClientRect();
            boundaryTop = parentRect.top;
            boundaryBottom = parentRect.bottom;
            boundaryLeft = parentRect.left;
            boundaryRight = parentRect.right;
            break;
          }
          parent = parent.parentElement;
        }
      }

      const pos: DropdownPosition = {};

      if (forceStaticPlacement) {
        // Static placement — no flip logic
        switch (placement) {
          case 'top':
            pos.top = `${String(triggerRect.top - dropdownRect.height - padding)}px`;
            pos.left = `${String(Math.min(triggerRect.right - dropdownRect.width, boundaryRight - dropdownRect.width - padding))}px`;
            break;
          case 'bottom':
            pos.top = `${String(triggerRect.bottom + padding)}px`;
            pos.left = `${String(Math.min(triggerRect.right - dropdownRect.width, boundaryRight - dropdownRect.width - padding))}px`;
            break;
          case 'left':
            pos.top = `${String(triggerRect.top)}px`;
            pos.left = `${String(triggerRect.left - dropdownRect.width - padding)}px`;
            break;
          case 'right':
            pos.top = `${String(triggerRect.top)}px`;
            pos.left = `${String(triggerRect.right + padding)}px`;
            break;
          default:
            pos.top = `${String(triggerRect.bottom + padding)}px`;
            pos.left = `${String(Math.min(triggerRect.right - dropdownRect.width, boundaryRight - dropdownRect.width - padding))}px`;
        }
      } else {
        // --- Vertical: below or above ---
        const spaceBelow = boundaryBottom - triggerRect.bottom;
        if (spaceBelow >= dropdownRect.height + padding) {
          pos.top = `${String(triggerRect.bottom + padding)}px`;
        } else {
          pos.top = `${String(triggerRect.top - dropdownRect.height - padding)}px`;
        }

        // --- Horizontal: right-align dropdown with trigger's right edge ---
        const rightAlignedLeft = triggerRect.right - dropdownRect.width;
        if (rightAlignedLeft >= boundaryLeft + padding) {
          pos.left = `${String(rightAlignedLeft)}px`;
        } else {
          pos.left = `${String(boundaryLeft + padding)}px`;
        }
      }

      // Clamp to parent height if useParentHeight is set
      if (useParentHeight && useParentContainer) {
        const topVal = parseFloat(pos.top ?? '0');
        if (topVal < boundaryTop) {
          pos.top = `${String(boundaryTop + padding)}px`;
        }
        if (topVal + dropdownRect.height > boundaryBottom) {
          pos.top = `${String(boundaryBottom - dropdownRect.height - padding)}px`;
        }
      }

      setPosition(pos);
      setMeasured(true);
    });

    return () => {
      cancelAnimationFrame(id);
    };
  }, [
    isOpen,
    triggerRef,
    placement,
    useParentContainer,
    useParentHeight,
    forceStaticPlacement,
    getCurrentWindow,
  ]);

  // Focus the first enabled menu item after positioning is done
  useEffect(() => {
    if (!isOpen || !measured) return;

    const id = requestAnimationFrame(() => {
      const firstItem = dropdownRef.current?.querySelector<HTMLElement>(
        'button[role="menuitem"]:not(:disabled)'
      );
      firstItem?.focus();
    });

    return () => {
      cancelAnimationFrame(id);
    };
  }, [isOpen, measured]);

  const getMenuItems = useCallback(() => {
    if (!dropdownRef.current) return [];
    return Array.from(
      dropdownRef.current.querySelectorAll<HTMLElement>('button[role="menuitem"]:not(:disabled)')
    );
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const items = getMenuItems();
      if (items.length === 0) return;

      const currentIndex = items.indexOf(getCurrentDocument().activeElement as HTMLElement);

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          const next = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
          items[next]?.focus();
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          const prev = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
          items[prev]?.focus();
          break;
        }
        case 'Home': {
          e.preventDefault();
          items[0]?.focus();
          break;
        }
        case 'End': {
          e.preventDefault();
          items[items.length - 1]?.focus();
          break;
        }
        case 'Escape': {
          e.preventDefault();
          e.stopPropagation();
          close();
          triggerRef.current?.focus();
          break;
        }
        case 'Tab': {
          e.preventDefault();
          if (items.length === 0) break;
          let nextIdx: number;
          if (e.shiftKey) {
            nextIdx = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
          } else {
            nextIdx = currentIndex >= items.length - 1 ? 0 : currentIndex + 1;
          }
          items[nextIdx]?.focus();
          break;
        }
        default:
          break;
      }
    },
    [close, getMenuItems, triggerRef, getCurrentDocument]
  );

  const baseClass = 'cometchat-context-menu__dropdown';
  const hiddenClass = !isOpen ? 'cometchat-context-menu__dropdown--hidden' : '';
  const classes = [baseClass, hiddenClass, className].filter(Boolean).join(' ');

  // Inline style: use computed position, hide until measured to prevent flicker
  const inlineStyle: React.CSSProperties = {
    ...(position ?? {}),
    // Before measurement: render off-screen to get dimensions without flicker
    visibility: isOpen && !measured ? 'hidden' : undefined,
  };

  return (
    <>
      {isOpen && disableBackgroundInteraction && (
        <div className={'cometchat-context-menu__overlay'} onClick={close} aria-hidden="true" />
      )}
      <div
        ref={dropdownRef}
        className={classes}
        role="menu"
        aria-label={getLocalizedString('accessibility_context_menu')}
        onKeyDown={isOpen ? handleKeyDown : undefined}
        tabIndex={-1}
        style={inlineStyle}
      >
        {isOpen ? children : null}
      </div>
    </>
  );
};
