import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  CometChatConfirmDialogRootProps,
  CometChatConfirmDialogContextValue,
} from './CometChatConfirmDialog.types';
import { CometChatConfirmDialogContext } from './CometChatConfirmDialog.context';
import { CometChatConfirmDialogIcon } from './CometChatConfirmDialogIcon';
import { CometChatConfirmDialogContent } from './CometChatConfirmDialogContent';
import { CometChatConfirmDialogActions } from './CometChatConfirmDialogActions';
import { useCometChatFrameContext } from '../../../context/CometChatFrameContext';
import './CometChatConfirmDialog.css';

/** Stable IDs for aria-labelledby / aria-describedby. */
export const TITLE_ID = 'cometchat-confirm-dialog-title';
export const MESSAGE_ID = 'cometchat-confirm-dialog-message';

/**
 * Root overlay for the confirm dialog. Provides context, manages open/close state,
 * handles keyboard (Escape), focus trap, outside click, and body scroll lock.
 */
export const CometChatConfirmDialogRoot: React.FC<CometChatConfirmDialogRootProps> = ({
  isOpen: isOpenProp,
  onClose,
  closeOnOutsideClick = true,
  variant = 'danger',
  children,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const IframeContext = useCometChatFrameContext();

  const getCurrentDocument = useCallback(() => {
    return IframeContext.iframeDocument ?? document;
  }, [IframeContext.iframeDocument]);

  // Uncontrolled fallback
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = isOpenProp !== undefined;
  const isOpen = isControlled ? isOpenProp : internalOpen;

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    }
    if (!isControlled) {
      setInternalOpen(false);
    }
  }, [onClose, isControlled]);

  // Store previous focus and restore on close.
  // Focus the container, not the first control — traps focus without painting a
  // focus ring on the cancel button when the dialog opens.
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = getCurrentDocument().activeElement as HTMLElement;
      const id = requestAnimationFrame(() => {
        containerRef.current?.focus();
      });
      return () => {
        cancelAnimationFrame(id);
      };
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
    return undefined;
  }, [isOpen, getCurrentDocument]);

  // Outside click
  useEffect(() => {
    if (!isOpen || !closeOnOutsideClick) return;

    const handleMouseDown = (event: MouseEvent) => {
      const dialog = containerRef.current;
      if (dialog && !dialog.contains(event.target as Node)) {
        handleClose();
      }
    };

    getCurrentDocument().addEventListener('mousedown', handleMouseDown);
    return () => {
      getCurrentDocument().removeEventListener('mousedown', handleMouseDown);
    };
  }, [isOpen, closeOnOutsideClick, handleClose, getCurrentDocument]);

  // Keyboard handler
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleClose();
        return;
      }

      // Focus trap: intercept every Tab and manually cycle focus within the dialog.
      if (event.key === 'Tab') {
        const container = containerRef.current;
        if (!container) return;
        const focusable = Array.from(
          container.querySelectorAll<HTMLElement>(
            'button:not([disabled]):not([aria-disabled="true"]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );
        if (focusable.length === 0) return;

        const currentIdx = focusable.indexOf(getCurrentDocument().activeElement as HTMLElement);
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
    [handleClose, getCurrentDocument]
  );

  // Context value
  const ctxValue = useMemo<CometChatConfirmDialogContextValue>(
    () => ({
      isOpen,
      onClose: handleClose,
      variant,
    }),
    [isOpen, handleClose, variant]
  );

  if (!isOpen) return null;

  const backdropClasses = ['cometchat-confirm-dialog__backdrop', className]
    .filter(Boolean)
    .join(' ');

  return (
    <CometChatConfirmDialogContext.Provider value={ctxValue}>
      <div className={backdropClasses}>
        <div
          ref={containerRef}
          className={'cometchat-confirm-dialog'}
          role="dialog"
          aria-modal="true"
          aria-labelledby={TITLE_ID}
          aria-describedby={MESSAGE_ID}
          tabIndex={-1}
          onKeyDown={handleKeyDown}
        >
          {children ?? (
            <>
              <CometChatConfirmDialogIcon />
              <CometChatConfirmDialogContent />
              <CometChatConfirmDialogActions />
            </>
          )}
        </div>
      </div>
    </CometChatConfirmDialogContext.Provider>
  );
};

CometChatConfirmDialogRoot.displayName = 'CometChatConfirmDialogRoot';
