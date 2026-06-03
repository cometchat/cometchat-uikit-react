import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import type {
  CometChatActionSheetRootProps,
  CometChatActionSheetContextValue,
} from './CometChatActionSheet.types';
import { CometChatActionSheetContext } from './CometChatActionSheet.context';
import { HEADER_TITLE_ID } from './CometChatActionSheetHeader';
import './CometChatActionSheet.css';

/**
 * Root overlay container for the action sheet.
 * Provides context, backdrop, focus trap, and keyboard handling.
 */
export const CometChatActionSheetRoot: React.FC<CometChatActionSheetRootProps> = ({
  isOpen,
  onClose,
  layoutMode = 'list',
  children,
  className,
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(false);

  // Capture the trigger element during render, before effects run.
  // This ensures we grab the button that was focused when the user clicked to open.
  if (isOpen && !wasOpenRef.current) {
    previousFocusRef.current = document.activeElement as HTMLElement | null;
  }
  wasOpenRef.current = isOpen;

  // Move focus into the sheet when it opens. On close, restore focus.
  useEffect(() => {
    if (!isOpen) {
      // Restore focus to the element that triggered the sheet.
      previousFocusRef.current?.focus();
      return;
    }

    const id = requestAnimationFrame(() => {
      const firstFocusable = sheetRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (firstFocusable) {
        firstFocusable.focus();
      }
    });

    return () => {
      cancelAnimationFrame(id);
    };
  }, [isOpen]);

  // Escape key handler.
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }

      // Arrow key navigation: move focus between focusable items.
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Home' || e.key === 'End') {
        const sheet = sheetRef.current;
        if (!sheet) return;

        const focusable = Array.from(
          sheet.querySelectorAll<HTMLElement>(
            'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
          )
        );
        if (focusable.length === 0) return;

        const currentIndex = focusable.indexOf(document.activeElement as HTMLElement);

        let nextIndex: number;
        if (e.key === 'ArrowDown') {
          nextIndex = currentIndex < focusable.length - 1 ? currentIndex + 1 : 0;
        } else if (e.key === 'ArrowUp') {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : focusable.length - 1;
        } else if (e.key === 'Home') {
          nextIndex = 0;
        } else {
          // End
          nextIndex = focusable.length - 1;
        }

        e.preventDefault();
        focusable[nextIndex]?.focus();
        return;
      }

      // Focus trap: cycle Tab within the sheet.
      if (e.key === 'Tab') {
        const sheet = sheetRef.current;
        if (!sheet) return;

        const focusable = Array.from(
          sheet.querySelectorAll<HTMLElement>(
            'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
          )
        );
        if (focusable.length === 0) return;

        const currentIdx = focusable.indexOf(document.activeElement as HTMLElement);

        let nextIdx: number;
        if (e.shiftKey) {
          nextIdx = currentIdx <= 0 ? focusable.length - 1 : currentIdx - 1;
        } else {
          nextIdx = currentIdx >= focusable.length - 1 ? 0 : currentIdx + 1;
        }

        e.preventDefault();
        focusable[nextIdx]?.focus();
      }
    },
    [onClose]
  );

  // Backdrop click handler.
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  const ctxValue = useMemo<CometChatActionSheetContextValue>(
    () => ({ isOpen, onClose, layoutMode }),
    [isOpen, onClose, layoutMode]
  );

  if (!isOpen) return null;

  const sheetBase = 'cometchat-action-sheet';
  const sheetClass = className ? `${sheetBase} ${className}` : sheetBase;

  return (
    <CometChatActionSheetContext.Provider value={ctxValue}>
      <div
        className={'cometchat-action-sheet__backdrop'}
        onClick={handleBackdropClick}
        onKeyDown={handleKeyDown}
        role="presentation"
      />
      <div
        ref={sheetRef}
        className={sheetClass}
        role="dialog"
        aria-modal="true"
        aria-labelledby={HEADER_TITLE_ID}
        onKeyDown={handleKeyDown}
      >
        {children}
      </div>
    </CometChatActionSheetContext.Provider>
  );
};
