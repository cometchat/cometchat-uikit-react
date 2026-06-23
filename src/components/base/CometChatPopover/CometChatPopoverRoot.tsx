import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type {
  CometChatPopoverRootProps,
  CometChatPopoverContextValue,
  CometChatPopoverPlacement,
} from './CometChatPopover.types';
import { CometChatPopoverContext } from './CometChatPopover.context';
import { useCometChatFrameContext } from '../../../context/CometChatFrameContext';
import './CometChatPopover.css';

/** Margin (px) between the popover and the viewport edge. */
const VIEWPORT_MARGIN = 10;
/** Gap (px) between the trigger and the popover content. */
const TRIGGER_GAP = 10;
/** Gap (px) between the trigger and the arrow-style popover content. */
const ARROW_GAP = 5;

/**
 * Determines the best placement for the popover based on available viewport space.
 * Tries the preferred placement first, then falls back to alternatives.
 */
function getAvailablePlacement(
  triggerRect: DOMRect,
  contentHeight: number,
  contentWidth: number,
  preferred: CometChatPopoverPlacement,
  currentWindow: Window
): CometChatPopoverPlacement {
  const spaceAbove = triggerRect.top;
  const spaceBelow = currentWindow.innerHeight - triggerRect.bottom;
  const spaceLeft = triggerRect.left;
  const spaceRight = currentWindow.innerWidth - triggerRect.right;

  const fits = (placement: CometChatPopoverPlacement): boolean => {
    switch (placement) {
      case 'top':
        return spaceAbove >= contentHeight + VIEWPORT_MARGIN;
      case 'bottom':
        return spaceBelow >= contentHeight + VIEWPORT_MARGIN;
      case 'left':
        return spaceLeft >= contentWidth + VIEWPORT_MARGIN;
      case 'right':
        return spaceRight >= contentWidth + VIEWPORT_MARGIN;
    }
  };

  // Try preferred first
  if (fits(preferred)) return preferred;

  // Try all placements in order: preferred → opposite → remaining
  const opposite: Record<CometChatPopoverPlacement, CometChatPopoverPlacement> = {
    top: 'bottom',
    bottom: 'top',
    left: 'right',
    right: 'left',
  };
  const remaining: CometChatPopoverPlacement[] = ['top', 'bottom', 'left', 'right'].filter(
    p => p !== preferred && p !== opposite[preferred]
  ) as CometChatPopoverPlacement[];

  if (fits(opposite[preferred])) return opposite[preferred];
  for (const p of remaining) {
    if (fits(p)) return p;
  }

  // Nothing fits — use preferred anyway
  return preferred;
}

/**
 * Computes the fixed position styles for the popover content.
 */
function computePosition(
  triggerRect: DOMRect,
  contentWidth: number,
  contentHeight: number,
  placement: CometChatPopoverPlacement,
  showArrow: boolean,
  currentWindow: Window
): React.CSSProperties {
  const gap = showArrow ? ARROW_GAP : TRIGGER_GAP;
  const viewportWidth = currentWindow.innerWidth;
  const viewportHeight = currentWindow.innerHeight;
  const style: React.CSSProperties = {};

  if (placement === 'top' || placement === 'bottom') {
    const topVal =
      placement === 'top' ? triggerRect.top - contentHeight - gap : triggerRect.bottom + gap;
    style.top = `${String(topVal)}px`;

    let left = triggerRect.left;
    left = Math.max(
      VIEWPORT_MARGIN,
      Math.min(left, viewportWidth - contentWidth - VIEWPORT_MARGIN)
    );
    style.left = `${String(left)}px`;
  } else {
    // Horizontal placement — center vertically, clamp to viewport
    const leftVal =
      placement === 'left' ? triggerRect.left - contentWidth - gap : triggerRect.right + gap;
    style.left = `${String(leftVal)}px`;

    let top = triggerRect.top + triggerRect.height / 2 - contentHeight / 2;
    top = Math.max(
      VIEWPORT_MARGIN,
      Math.min(top, viewportHeight - contentHeight - VIEWPORT_MARGIN)
    );
    style.top = `${String(top)}px`;
  }

  return style;
}

/**
 * Root container for the popover. Manages open/close state, positioning,
 * outside click, keyboard handling, and provides context to sub-components.
 */
export const CometChatPopoverRoot: React.FC<CometChatPopoverRootProps> = ({
  isOpen: isOpenProp,
  onClose,
  onOpen,
  placement = 'bottom',
  closeOnOutsideClick = true,
  showOnHover = false,
  debounceOnHover = 500,
  showArrow = false,
  trapFocus = false,
  ariaLabel,
  ariaLabelledBy,
  ariaDescribedBy,
  children,
  className,
}) => {
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const IframeContext = useCometChatFrameContext();

  const getCurrentDocument = useCallback(() => {
    return IframeContext.iframeDocument ?? document;
  }, [IframeContext.iframeDocument]);

  const getCurrentWindow = useCallback(() => {
    return IframeContext.iframeWindow ?? window;
  }, [IframeContext.iframeWindow]);

  const reactId = useId();
  const popoverId = `cometchat-popover-${reactId.replace(/:/g, '')}`;

  // Controlled / uncontrolled state
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = isOpenProp !== undefined;
  const isOpen = isControlled ? isOpenProp : internalOpen;

  // Positioning state
  const [computedPlacement, setComputedPlacement] = useState<CometChatPopoverPlacement>(placement);
  const [positionStyle, setPositionStyle] = useState<React.CSSProperties>({});
  const [isPositioned, setIsPositioned] = useState(false);

  // --- Open / Close handlers ---

  const handleOpen = useCallback(() => {
    if (isOpen) return;
    previousFocusRef.current = getCurrentDocument().activeElement as HTMLElement;
    if (!isControlled) {
      setInternalOpen(true);
    }
    if (onOpen) {
      onOpen();
    }
  }, [isOpen, isControlled, onOpen, getCurrentDocument]);

  const handleClose = useCallback(() => {
    if (!isOpen) return;
    if (!isControlled) {
      setInternalOpen(false);
    }
    if (onClose) {
      onClose();
    }
  }, [isOpen, isControlled, onClose]);

  const handleToggle = useCallback(() => {
    if (isOpen) {
      handleClose();
    } else {
      handleOpen();
    }
  }, [isOpen, handleOpen, handleClose]);

  // --- Positioning ---

  const updatePosition = useCallback(() => {
    if (!triggerRef.current || !popoverRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const contentEl = popoverRef.current;

    // Temporarily make visible for measurement
    contentEl.style.visibility = 'hidden';
    contentEl.style.display = 'block';
    const contentWidth = contentEl.scrollWidth || contentEl.offsetWidth;
    const contentHeight = contentEl.scrollHeight || contentEl.offsetHeight;
    contentEl.style.visibility = '';
    contentEl.style.display = '';

    const resolved = getAvailablePlacement(
      triggerRect,
      contentHeight,
      contentWidth,
      placement,
      getCurrentWindow()
    );
    const style = computePosition(
      triggerRect,
      contentWidth,
      contentHeight,
      resolved,
      showArrow,
      getCurrentWindow()
    );

    setComputedPlacement(resolved);
    setPositionStyle(style);
    setIsPositioned(true);
  }, [placement, showArrow, getCurrentWindow]);

  // Calculate position after the content DOM is rendered.
  // useEffect (not useLayoutEffect) ensures the Content component has mounted.
  useEffect(() => {
    if (isOpen) {
      // Reset positioned flag so content starts hidden
      setIsPositioned(false);
      // Use rAF to ensure layout is complete for accurate measurements
      const id = requestAnimationFrame(() => {
        updatePosition();
      });
      return () => {
        cancelAnimationFrame(id);
      };
    } else {
      setIsPositioned(false);
      setPositionStyle({});
    }
    return undefined;
  }, [isOpen, updatePosition]);

  // --- Focus management ---

  useEffect(() => {
    if (isOpen && trapFocus && popoverRef.current) {
      const id = requestAnimationFrame(() => {
        const focusable = popoverRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable && focusable.length > 0) {
          focusable[0].focus();
        } else {
          popoverRef.current?.focus();
        }
      });
      return () => {
        cancelAnimationFrame(id);
      };
    } else if (!isOpen && previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
    return undefined;
  }, [isOpen, trapFocus]);

  // --- Outside click ---

  useEffect(() => {
    if (!isOpen || !closeOnOutsideClick) return;

    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      const trigger = triggerRef.current;
      const popover = popoverRef.current;

      if (trigger && !trigger.contains(target) && popover && !popover.contains(target)) {
        handleClose();
      }
    };

    getCurrentDocument().addEventListener('mousedown', handleMouseDown);
    return () => {
      getCurrentDocument().removeEventListener('mousedown', handleMouseDown);
    };
  }, [isOpen, closeOnOutsideClick, handleClose, getCurrentDocument]);

  // --- Escape key (document-level so it works even without focus trap) ---

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleClose();
      }
    };

    getCurrentDocument().addEventListener('keydown', handleKeyDown);
    return () => {
      getCurrentDocument().removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleClose, getCurrentDocument]);

  // --- Scroll / resize repositioning ---

  useEffect(() => {
    if (!isOpen) return;

    const handleScroll = () => {
      // Auto-close if trigger scrolled out of view
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        if (
          rect.bottom < 0 ||
          rect.top > getCurrentWindow().innerHeight ||
          rect.right < 0 ||
          rect.left > getCurrentWindow().innerWidth
        ) {
          handleClose();
          return;
        }
      }
      requestAnimationFrame(updatePosition);
    };

    const handleResize = () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = setTimeout(() => {
        requestAnimationFrame(updatePosition);
      }, 0);
    };

    getCurrentWindow().addEventListener('scroll', handleScroll, true);
    getCurrentWindow().addEventListener('resize', handleResize);

    return () => {
      getCurrentWindow().removeEventListener('scroll', handleScroll, true);
      getCurrentWindow().removeEventListener('resize', handleResize);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [isOpen, updatePosition, handleClose, getCurrentWindow]);

  // --- ResizeObserver on popover content ---

  useEffect(() => {
    if (!isOpen || !popoverRef.current || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => {
      requestAnimationFrame(updatePosition);
    });
    observer.observe(popoverRef.current);
    resizeObserverRef.current = observer;

    return () => {
      observer.disconnect();
      resizeObserverRef.current = null;
    };
  }, [isOpen, updatePosition]);

  // --- Context value ---

  const ctxValue = useMemo<CometChatPopoverContextValue>(
    () => ({
      isOpen,
      open: handleOpen,
      close: handleClose,
      toggle: handleToggle,
      showOnHover,
      debounceOnHover,
      showArrow,
      trapFocus,
      triggerRef,
      popoverRef,
      popoverId,
      ariaLabel,
      ariaLabelledBy,
      ariaDescribedBy,
      computedPlacement,
      positionStyle,
      isPositioned,
    }),
    [
      isOpen,
      handleOpen,
      handleClose,
      handleToggle,
      showOnHover,
      debounceOnHover,
      showArrow,
      trapFocus,
      popoverId,
      ariaLabel,
      ariaLabelledBy,
      ariaDescribedBy,
      computedPlacement,
      positionStyle,
      isPositioned,
    ]
  );

  const rootClass = ['cometchat-popover', className].filter(Boolean).join(' ');

  return (
    <CometChatPopoverContext.Provider value={ctxValue}>
      <div className={rootClass}>{children}</div>
    </CometChatPopoverContext.Provider>
  );
};

CometChatPopoverRoot.displayName = 'CometChatPopoverRoot';
