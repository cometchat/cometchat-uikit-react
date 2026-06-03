import React, { useCallback, useRef } from 'react';
import type { CometChatPopoverTriggerProps } from './CometChatPopover.types';
import { useCometChatPopoverContext } from './CometChatPopover.context';
import './CometChatPopover.css';

/**
 * Trigger element for the popover. Wraps children and handles click, hover,
 * and keyboard interactions to open/close the popover.
 *
 * Sets ARIA attributes on the trigger wrapper: `aria-expanded`, `aria-haspopup`,
 * and `aria-controls`.
 */
export const CometChatPopoverTrigger: React.FC<CometChatPopoverTriggerProps> = ({
  children,
  className,
}) => {
  const {
    isOpen,
    toggle,
    open,
    close,
    showOnHover,
    debounceOnHover,
    showArrow,
    trapFocus,
    triggerRef,
    popoverId,
  } = useCometChatPopoverContext();

  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHoverTimeout = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  }, []);

  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      if (!showOnHover) {
        toggle();
      }
    },
    [showOnHover, toggle]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (showOnHover) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        event.stopPropagation();
        toggle();
      }
    },
    [showOnHover, toggle]
  );

  const handleMouseEnter = useCallback(() => {
    if (!showOnHover) return;
    clearHoverTimeout();
    if (!isOpen) {
      hoverTimeoutRef.current = setTimeout(() => {
        open();
      }, debounceOnHover);
    }
  }, [showOnHover, isOpen, open, debounceOnHover, clearHoverTimeout]);

  const handleMouseLeave = useCallback(
    (event: React.MouseEvent) => {
      if (!showOnHover) return;
      clearHoverTimeout();

      // Don't close if mouse moved to the popover content
      const relatedTarget = event.relatedTarget as Node | null;
      const popoverEl = document.getElementById(popoverId);
      if (relatedTarget && popoverEl) {
        try {
          if (popoverEl.contains(relatedTarget)) {
            return;
          }
        } catch {
          // jsdom or edge cases where relatedTarget is not a valid Node
        }
      }

      if (isOpen) {
        hoverTimeoutRef.current = setTimeout(() => {
          close();
        }, debounceOnHover);
      }
    },
    [showOnHover, isOpen, close, debounceOnHover, clearHoverTimeout, popoverId]
  );

  // Determine aria-haspopup: tooltip-like popovers (showArrow + no trapFocus) use "false"
  const isTooltipMode = showArrow && !trapFocus;
  const ariaHasPopup = isTooltipMode ? undefined : ('dialog' as const);

  const triggerClass = ['cometchat-popover__trigger', className].filter(Boolean).join(' ');

  return (
    <div
      ref={triggerRef}
      className={triggerClass}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-expanded={isOpen}
      aria-haspopup={ariaHasPopup}
      aria-controls={isOpen ? popoverId : undefined}
      role="button"
      tabIndex={0}
    >
      {children}
    </div>
  );
};

CometChatPopoverTrigger.displayName = 'CometChatPopoverTrigger';
