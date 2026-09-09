import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { CometChatContextMenuSubmenuProps } from './CometChatContextMenu.types';
import { useCometChatContextMenuContext } from './CometChatContextMenu.context';
import { CometChatContextMenuItem } from './CometChatContextMenuItem';
import { useCometChatFrameContext } from '../../../context/CometChatFrameContext';
import chevronRightIcon from '../../../assets/chevron_right.svg';
import './CometChatContextMenu.css';

/**
 * Hover-intent delays. Opening is near-instant so the menu feels responsive;
 * closing is slower so a diagonal mouse path from the parent row to the panel
 * doesn't dismiss the thing you're travelling toward.
 */
const OPEN_DELAY_MS = 120;
const CLOSE_DELAY_MS = 250;

interface PanelPosition {
  top: number;
  left: number;
}

/**
 * A menu row that opens a nested fly-out panel — "Organize ▸".
 *
 * The panel is `position: fixed` (like the parent dropdown) so it escapes any
 * `overflow: hidden` ancestor, and is measured before being shown to avoid a
 * flash at the wrong coordinates.
 *
 * Direction is logical (`start`/`end`), resolved against the element's computed
 * `direction`, so RTL works without a second code path. If the resolved side
 * would overflow the viewport, it flips.
 */
export const CometChatContextMenuSubmenu: React.FC<CometChatContextMenuSubmenuProps> = ({
  item,
  className,
}) => {
  const { submenuDirection = 'end' } = useCometChatContextMenuContext();
  const IframeContext = useCometChatFrameContext();

  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<PanelPosition | null>(null);
  /**
   * Whether the panel was opened from the keyboard, which is the only case that
   * should move focus into it. Hover must not: focus-follows-mouse is a WAI-ARIA
   * anti-pattern, and when the pointer leaves, the focused panel unmounts and
   * focus falls to <body> — which the parent dropdown reads as a focusout and
   * closes on.
   */
  const openedByKeyboard = useRef(false);

  const rowRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getCurrentWindow = useCallback(
    () => IframeContext.iframeWindow ?? window,
    [IframeContext.iframeWindow]
  );

  const clearTimers = useCallback(() => {
    if (openTimer.current) {
      clearTimeout(openTimer.current);
      openTimer.current = null;
    }
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  /** Open from a keyboard or click activation — focus moves into the panel. */
  const openNow = useCallback(() => {
    clearTimers();
    openedByKeyboard.current = true;
    setIsOpen(true);
  }, [clearTimers]);

  const closeNow = useCallback(() => {
    clearTimers();
    openedByKeyboard.current = false;
    setIsOpen(false);
    setPosition(null);
  }, [clearTimers]);

  /** Open from hover — the panel appears but focus stays where the user put it. */
  const scheduleOpen = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    if (isOpen || openTimer.current) return;
    openTimer.current = setTimeout(() => {
      openTimer.current = null;
      openedByKeyboard.current = false;
      setIsOpen(true);
    }, OPEN_DELAY_MS);
  }, [isOpen]);

  const scheduleClose = useCallback(() => {
    if (openTimer.current) {
      clearTimeout(openTimer.current);
      openTimer.current = null;
    }
    if (closeTimer.current) return;
    closeTimer.current = setTimeout(() => {
      closeTimer.current = null;
      // Hover-close must not yank focus out of a panel the keyboard is using —
      // the pointer may have drifted off while the user tabs through it.
      if (openedByKeyboard.current) return;
      setIsOpen(false);
      setPosition(null);
    }, CLOSE_DELAY_MS);
  }, []);

  // Measure, then place. Resolves logical direction against the computed
  // writing direction and flips if the preferred side would overflow.
  useEffect(() => {
    if (!isOpen) return;

    const id = requestAnimationFrame(() => {
      const row = rowRef.current;
      const panel = panelRef.current;
      if (!row || !panel) return;

      const rowRect = row.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      const win = getCurrentWindow();
      const gap = 4;
      const padding = 8;

      const isRtl = getComputedStyle(row).direction === 'rtl';
      // Logical → physical. In RTL, "end" is to the left.
      const preferLeft = isRtl ? submenuDirection === 'end' : submenuDirection === 'start';

      const leftSideX = rowRect.left - panelRect.width - gap;
      const rightSideX = rowRect.right + gap;

      const fitsLeft = leftSideX >= padding;
      const fitsRight = rightSideX + panelRect.width <= win.innerWidth - padding;

      let left: number;
      if (preferLeft) {
        left = fitsLeft ? leftSideX : fitsRight ? rightSideX : padding;
      } else {
        left = fitsRight
          ? rightSideX
          : fitsLeft
            ? leftSideX
            : Math.max(padding, win.innerWidth - panelRect.width - padding);
      }

      // Vertically align to the row, nudged back inside the viewport if needed.
      let top = rowRect.top;
      if (top + panelRect.height > win.innerHeight - padding) {
        top = win.innerHeight - panelRect.height - padding;
      }
      if (top < padding) top = padding;

      setPosition({ top, left });
    });

    return () => {
      cancelAnimationFrame(id);
    };
  }, [isOpen, submenuDirection, getCurrentWindow]);

  // Focus the first child once the panel is placed — but only when the keyboard
  // opened it. Hovering "Organize" must not pull focus off whatever had it.
  useEffect(() => {
    if (!isOpen || !position || !openedByKeyboard.current) return;
    const id = requestAnimationFrame(() => {
      panelRef.current
        ?.querySelector<HTMLElement>('button[role="menuitem"]:not(:disabled)')
        ?.focus();
    });
    return () => {
      cancelAnimationFrame(id);
    };
    // Only refocus on the open→placed transition, not on every reposition.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, position !== null]);

  const focusRow = useCallback(() => {
    rowRef.current?.focus();
  }, []);

  const isRtlNow = useCallback(() => {
    const row = rowRef.current;
    return row ? getComputedStyle(row).direction === 'rtl' : false;
  }, []);

  const handleRowKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      const forward = isRtlNow() ? 'ArrowLeft' : 'ArrowRight';
      if (e.key === forward || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        openNow();
      }
    },
    [openNow, isRtlNow]
  );

  const handlePanelKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const back = isRtlNow() ? 'ArrowRight' : 'ArrowLeft';

      if (e.key === back || e.key === 'Escape') {
        // Collapse only this level — the parent menu stays open.
        e.preventDefault();
        e.stopPropagation();
        closeNow();
        focusRow();
        return;
      }

      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;

      const items = Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>('button[role="menuitem"]:not(:disabled)') ??
          []
      );
      if (items.length === 0) return;

      e.preventDefault();
      e.stopPropagation();
      const doc = IframeContext.iframeDocument ?? document;
      const current = items.indexOf(doc.activeElement as HTMLElement);
      const next =
        e.key === 'ArrowDown'
          ? current < items.length - 1
            ? current + 1
            : 0
          : current > 0
            ? current - 1
            : items.length - 1;
      items[next]?.focus();
    },
    [closeNow, focusRow, isRtlNow, IframeContext.iframeDocument]
  );

  const children = item.submenu ?? [];

  const rowClasses = [
    'cometchat-context-menu__dropdown-item',
    'cometchat-context-menu__submenu-row',
    isOpen ? 'cometchat-context-menu__submenu-row--open' : '',
    item.disabled ? 'cometchat-context-menu__dropdown-item--disabled' : '',
    item.className,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const iconContent = item.icon ? (
    <span className={'cometchat-context-menu__dropdown-item-icon'}>{item.icon}</span>
  ) : item.iconURL ? (
    <img
      className={'cometchat-context-menu__dropdown-item-icon'}
      src={item.iconURL}
      alt=""
      aria-hidden="true"
      width={24}
      height={24}
      style={{ width: 24, height: 24, flexShrink: 0 }}
    />
  ) : null;

  return (
    <div
      className={'cometchat-context-menu__submenu'}
      onMouseEnter={scheduleOpen}
      onMouseLeave={scheduleClose}
    >
      <button
        ref={rowRef}
        type="button"
        role="menuitem"
        className={rowClasses}
        disabled={item.disabled}
        aria-disabled={item.disabled ?? undefined}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        tabIndex={-1}
        onKeyDown={handleRowKeyDown}
        onClick={e => {
          // The row is a disclosure, not an action — never fires item.onClick.
          e.preventDefault();
          e.stopPropagation();
          if (item.disabled) return;
          if (isOpen) {
            closeNow();
          } else {
            openNow();
          }
        }}
      >
        {iconContent}
        <span className={'cometchat-context-menu__dropdown-item-title'}>{item.title}</span>
        <img
          className={'cometchat-context-menu__submenu-chevron'}
          src={chevronRightIcon}
          alt=""
          aria-hidden="true"
          width={16}
          height={16}
        />
      </button>

      {isOpen && (
        <div
          ref={panelRef}
          className={'cometchat-context-menu__submenu-panel'}
          role="menu"
          aria-label={item.title}
          tabIndex={-1}
          onKeyDown={handlePanelKeyDown}
          onMouseEnter={scheduleOpen}
          onMouseLeave={scheduleClose}
          style={{
            top: position ? `${String(position.top)}px` : undefined,
            left: position ? `${String(position.left)}px` : undefined,
            // Measure off-screen first so the panel never flashes at 0,0.
            visibility: position ? undefined : 'hidden',
          }}
        >
          {children.map(child => (
            // CometChatContextMenuItem closes the whole menu via context on click,
            // which is what selecting a leaf should do.
            <CometChatContextMenuItem key={child.id} item={child} variant="full" />
          ))}
        </div>
      )}
    </div>
  );
};

CometChatContextMenuSubmenu.displayName = 'CometChatContextMenu.Submenu';
