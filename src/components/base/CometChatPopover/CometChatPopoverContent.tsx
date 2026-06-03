import React, { useCallback, useRef } from 'react';
import type { CometChatPopoverContentProps } from './CometChatPopover.types';
import { useCometChatPopoverContext } from './CometChatPopover.context';
import './CometChatPopover.css';

/**
 * Floating content panel for the popover. Renders only when the popover is open.
 * Handles focus trap (Tab cycling), ARIA attributes, positioning, and optional arrow.
 * When showOnHover is enabled, keeps the popover open while hovering over the content.
 */
export const CometChatPopoverContent: React.FC<CometChatPopoverContentProps> = ({
  children,
  className,
}) => {
  const {
    isOpen,
    close,
    trapFocus,
    showOnHover,
    debounceOnHover,
    showArrow,
    triggerRef,
    popoverRef,
    popoverId,
    ariaLabel,
    ariaLabelledBy,
    ariaDescribedBy,
    computedPlacement,
    positionStyle,
    isPositioned,
  } = useCometChatPopoverContext();

  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHoverTimeout = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  }, []);

  const handleContentMouseEnter = useCallback(() => {
    if (!showOnHover) return;
    clearHoverTimeout();
  }, [showOnHover, clearHoverTimeout]);

  const handleContentMouseLeave = useCallback(
    (event: React.MouseEvent) => {
      if (!showOnHover) return;
      clearHoverTimeout();

      // Don't close if mouse moved back to the trigger
      const relatedTarget = event.relatedTarget as Node | null;
      if (relatedTarget && triggerRef.current?.contains(relatedTarget)) {
        return;
      }

      hoverTimeoutRef.current = setTimeout(() => {
        close();
      }, debounceOnHover);
    },
    [showOnHover, close, debounceOnHover, clearHoverTimeout, triggerRef]
  );

  // Focus trap: intercept Tab and cycle within the popover content.
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!trapFocus) return;

      // Stop arrow key propagation to prevent parent handlers from processing them
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.stopPropagation();
      }

      if (event.key === 'Tab') {
        const container = popoverRef.current;
        if (!container) return;

        const focusable = Array.from(
          container.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );
        if (focusable.length === 0) return;

        const currentIdx = focusable.indexOf(document.activeElement as HTMLElement);
        let nextIdx: number;

        if (event.shiftKey) {
          nextIdx = currentIdx <= 0 ? focusable.length - 1 : currentIdx - 1;
        } else {
          nextIdx = currentIdx >= focusable.length - 1 ? 0 : currentIdx + 1;
        }

        event.preventDefault();
        focusable[nextIdx]?.focus();
      }
    },
    [trapFocus, popoverRef]
  );

  if (!isOpen) return null;

  // Determine role: tooltip for arrow-only popovers without focus trap, dialog otherwise
  const isTooltipMode = showArrow && !trapFocus;
  const role = isTooltipMode ? 'tooltip' : 'dialog';

  const contentClasses = [
    'cometchat-popover__content',
    `cometchat-popover__content--${computedPlacement}`,
    isPositioned ? 'cometchat-popover__content--positioned' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // Arrow element
  const arrow = showArrow ? (
    <div
      className={['cometchat-popover__arrow', `cometchat-popover__arrow--${computedPlacement}`]
        .filter(Boolean)
        .join(' ')}
      aria-hidden="true"
    />
  ) : null;

  // Arrow goes before content for top/left, after for bottom/right
  const arrowBefore = computedPlacement === 'bottom' || computedPlacement === 'right';
  const arrowAfter = computedPlacement === 'top' || computedPlacement === 'left';

  return (
    <div
      ref={popoverRef}
      id={popoverId}
      className={contentClasses}
      style={positionStyle}
      role={role}
      aria-modal={!isTooltipMode && trapFocus ? 'true' : undefined}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      tabIndex={trapFocus ? -1 : undefined}
      onKeyDown={trapFocus ? handleKeyDown : undefined}
      onMouseEnter={showOnHover ? handleContentMouseEnter : undefined}
      onMouseLeave={showOnHover ? handleContentMouseLeave : undefined}
    >
      {arrowBefore && arrow}
      {children}
      {arrowAfter && arrow}
    </div>
  );
};

CometChatPopoverContent.displayName = 'CometChatPopoverContent';
