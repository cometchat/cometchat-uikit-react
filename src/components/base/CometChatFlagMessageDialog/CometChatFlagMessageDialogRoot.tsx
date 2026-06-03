import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  CometChatFlagMessageDialogRootProps,
  CometChatFlagMessageDialogContextValue,
} from './CometChatFlagMessageDialog.types';
import { CometChatFlagMessageDialogContext } from './CometChatFlagMessageDialog.context';
import { CometChatFlagMessageDialogHeader } from './CometChatFlagMessageDialogHeader';
import { CometChatFlagMessageDialogReasons } from './CometChatFlagMessageDialogReasons';
import { CometChatFlagMessageDialogRemark } from './CometChatFlagMessageDialogRemark';
import { CometChatFlagMessageDialogActions } from './CometChatFlagMessageDialogActions';
import { useCometChatFlagMessageDialog } from './useCometChatFlagMessageDialog';
import { useLocale } from '../../../context/locale/LocaleContext';
import './CometChatFlagMessageDialog.css';

/** Stable IDs for aria-labelledby / aria-describedby. */
export const TITLE_ID = 'cometchat-flag-message-dialog-title';
export const SUBTITLE_ID = 'cometchat-flag-message-dialog-subtitle';

/**
 * Root overlay for the flag message dialog. Provides context, manages open/close state,
 * handles keyboard (Escape), focus trap, outside click, and fetches flag reasons.
 */
export const CometChatFlagMessageDialogRoot: React.FC<CometChatFlagMessageDialogRootProps> = ({
  message,
  isOpen: isOpenProp,
  onClose,
  closeOnOutsideClick = true,
  onSubmit,
  onError,
  children,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const { getLocalizedString } = useLocale();

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

  const hookData = useCometChatFlagMessageDialog({
    message,
    onSubmit,
    onError,
    onClose: handleClose,
  });

  // Store previous focus and restore on close.
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      const id = requestAnimationFrame(() => {
        const firstFocusable = containerRef.current?.querySelector<HTMLElement>(
          'button:not([disabled]):not([aria-disabled="true"]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (firstFocusable) {
          firstFocusable.focus();
        } else {
          containerRef.current?.focus();
        }
      });
      return () => {
        cancelAnimationFrame(id);
      };
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
    return undefined;
  }, [isOpen]);

  // Outside click
  useEffect(() => {
    if (!isOpen || !closeOnOutsideClick) return;

    const handleMouseDown = (event: MouseEvent) => {
      const dialog = containerRef.current;
      if (dialog && !dialog.contains(event.target as Node)) {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [isOpen, closeOnOutsideClick, handleClose]);

  // Keyboard handler
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleClose();
        return;
      }

      // Focus trap: intercept Tab and manually cycle focus within the dialog.
      if (event.key === 'Tab') {
        const container = containerRef.current;
        if (!container) return;
        const focusable = Array.from(
          container.querySelectorAll<HTMLElement>(
            'button:not([disabled]):not([aria-disabled="true"]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
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
    [handleClose]
  );

  // Context value
  const ctxValue = useMemo<CometChatFlagMessageDialogContextValue>(
    () => ({
      isOpen,
      onClose: handleClose,
      message,
      flagReasons: hookData.flagReasons,
      selectedReason: hookData.selectedReason,
      selectReason: hookData.selectReason,
      remark: hookData.remark,
      setRemark: hookData.setRemark,
      errorMessage: hookData.errorMessage,
      setErrorMessage: hookData.setErrorMessage,
      isLoading: hookData.isLoading,
      handleSubmit: hookData.handleSubmit,
      isLoadingReasons: hookData.isLoadingReasons,
    }),
    [isOpen, handleClose, message, hookData]
  );

  if (!isOpen) return null;

  const backdropClasses = ['cometchat-flag-message-dialog__backdrop', className]
    .filter(Boolean)
    .join(' ');

  return (
    <CometChatFlagMessageDialogContext.Provider value={ctxValue}>
      <div className={backdropClasses}>
        {hookData.errorMessage && (
          <div
            className={'cometchat-flag-message-dialog__error'}
            role="alert"
            aria-live="assertive"
          >
            {getLocalizedString(hookData.errorMessage) || hookData.errorMessage}
          </div>
        )}
        <div
          ref={containerRef}
          className={'cometchat-flag-message-dialog'}
          role="dialog"
          aria-modal="true"
          aria-labelledby={TITLE_ID}
          aria-describedby={SUBTITLE_ID}
          tabIndex={-1}
          onKeyDown={handleKeyDown}
          onClick={e => {
            e.stopPropagation();
          }}
        >
          {children ?? (
            <>
              <CometChatFlagMessageDialogHeader />
              <CometChatFlagMessageDialogReasons />
              <CometChatFlagMessageDialogRemark />
              <CometChatFlagMessageDialogActions />
            </>
          )}
        </div>
      </div>
    </CometChatFlagMessageDialogContext.Provider>
  );
};

CometChatFlagMessageDialogRoot.displayName = 'CometChatFlagMessageDialogRoot';
