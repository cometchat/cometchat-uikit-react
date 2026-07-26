import React, { forwardRef, useEffect, useRef, useCallback } from 'react';
import type { CometChatToastProps } from './CometChatToast.types';
import { useCometChatFrameContext } from '../../../context/CometChatFrameContext';
import './CometChatToast.css';
import { useLocale } from '../../../context/locale/LocaleContext';

/**
 * CometChatToast — a temporary notification for displaying feedback messages.
 *
 * Supports auto-dismiss via `duration`, a close button, and Escape key dismissal.
 * The parent controls the toast lifecycle by conditionally rendering it and
 * responding to the `onClose` callback to unmount.
 *
 * Usage:
 * ```tsx
 * {showToast && (
 *   <CometChatToast
 *     text="Message copied"
 *     duration={3000}
 *     onClose={() => setShowToast(false)}
 *   />
 * )}
 * ```
 */
export const CometChatToast = forwardRef<HTMLDivElement, CometChatToastProps>(
  (
    {
      text,
      duration = 3000,
      onClose,
      showCloseButton = true,
      dismissOnEscape = true,
      variant = 'default',
      className,
      ...rest
    },
    ref
  ) => {
    const { getLocalizedString } = useLocale();
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Guard against double-fire: once onClose is called, skip subsequent calls
    const closedRef = useRef(false);
    const IframeContext = useCometChatFrameContext();

    const getCurrentDocument = useCallback(() => {
      return IframeContext.iframeDocument ?? document;
    }, [IframeContext.iframeDocument]);

    const handleClose = useCallback(() => {
      if (closedRef.current) return;
      closedRef.current = true;

      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      onClose?.();
    }, [onClose]);

    // Auto-dismiss timer
    useEffect(() => {
      if (duration <= 0) return;

      timerRef.current = setTimeout(() => {
        handleClose();
      }, duration);

      return () => {
        if (timerRef.current !== null) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      };
    }, [duration, handleClose]);

    // Escape key listener
    useEffect(() => {
      if (!dismissOnEscape) return;

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
    }, [dismissOnEscape, handleClose, getCurrentDocument]);

    if (!text) return null;

    const rootClass = [
      'cometchat-toast',
      variant === 'error' ? 'cometchat-toast--error' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div
        ref={ref}
        className={rootClass}
        role="status"
        aria-live="polite"
        aria-label={text}
        {...rest}
      >
        <div className={'cometchat-toast__content'}>
          <span className={'cometchat-toast__text'}>{text}</span>
        </div>
        {showCloseButton && (
          <button
            type="button"
            className={'cometchat-toast__close'}
            onClick={handleClose}
            aria-label={getLocalizedString('toast_close')}
          >
            <span className={'cometchat-toast__close-icon'} aria-hidden="true" />
          </button>
        )}
      </div>
    );
  }
);

CometChatToast.displayName = 'CometChatToast';
