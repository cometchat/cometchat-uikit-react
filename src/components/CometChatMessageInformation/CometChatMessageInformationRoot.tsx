import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import type { CometChatMessageInformationRootProps } from './CometChatMessageInformation.types';
import { CometChatMessageInformationContext } from './CometChatMessageInformation.context';
import { useCometChatMessageInformation } from './useCometChatMessageInformation';
import { CometChatMessageInformationHeader } from './CometChatMessageInformationHeader';
import { CometChatMessageInformationMessagePreview } from './CometChatMessageInformationMessagePreview';
import { CometChatMessageInformationReceiptList } from './CometChatMessageInformationReceiptList';
import './CometChatMessageInformation.css';

const DEFAULT_DATE_FORMAT = {
  today: 'DD MMM, hh:mm A',
  yesterday: 'DD MMM, hh:mm A',
  otherDays: 'DD MMM, hh:mm A',
};

/**
 * CometChatMessageInformation.Root — context provider and root container.
 *
 * Initializes the message information hook, provides context to sub-components.
 * When no children are provided, renders the default layout (Header + MessagePreview + ReceiptList).
 * Implements focus trap and Escape-to-close for accessibility.
 */
export const CometChatMessageInformationRoot: React.FC<CometChatMessageInformationRootProps> = ({
  message,
  onClose,
  onError,
  messageInfoDateTimeFormat,
  messageSentAtDateTimeFormat,
  textFormatters,
  showScrollbar = false,
  children,
  className,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const {
    fetchState,
    userReceipts,
    oneOnOneReadAt,
    oneOnOneDeliveredAt,
    error,
    isGroupMessage,
    retry,
  } = useCometChatMessageInformation({
    message,
    onError,
  });

  const handleClose = useCallback(() => {
    onClose?.();
  }, [onClose]);

  // --- Focus management ---
  useEffect(() => {
    // Store the element that had focus before the panel opened
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Focus the close button on mount
    const closeButton = panelRef.current?.querySelector<HTMLElement>(
      '[data-cometchat-message-info-close]'
    );
    if (closeButton) {
      closeButton.focus();
    }

    return () => {
      // Return focus to the trigger element on unmount
      previousFocusRef.current?.focus();
    };
  }, []);

  // --- Keyboard handler (Escape to close, focus trap) ---
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleClose();
        return;
      }

      // Focus trap: Tab/Shift+Tab cycles within the panel
      if (event.key === 'Tab' && panelRef.current) {
        const focusableElements = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement?.focus();
          }
        }
      }
    },
    [handleClose]
  );

  const contextValue = useMemo(
    () => ({
      message,
      fetchState,
      userReceipts,
      oneOnOneReadAt,
      oneOnOneDeliveredAt,
      error,
      isGroupMessage,
      messageInfoDateTimeFormat: messageInfoDateTimeFormat ?? DEFAULT_DATE_FORMAT,
      messageSentAtDateTimeFormat,
      textFormatters: textFormatters ?? [],
      showScrollbar,
      onClose: handleClose,
      retry,
    }),
    [
      message,
      fetchState,
      userReceipts,
      oneOnOneReadAt,
      oneOnOneDeliveredAt,
      error,
      isGroupMessage,
      messageInfoDateTimeFormat,
      messageSentAtDateTimeFormat,
      textFormatters,
      showScrollbar,
      handleClose,
      retry,
    ]
  );

  const rootClass = ['cometchat-message-information', className ?? ''].filter(Boolean).join(' ');

  return (
    <CometChatMessageInformationContext.Provider value={contextValue}>
      <div
        ref={panelRef}
        className={rootClass}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cometchat-message-info-title"
        onKeyDown={handleKeyDown}
      >
        {children ?? (
          <>
            <CometChatMessageInformationHeader />
            <CometChatMessageInformationMessagePreview />
            <CometChatMessageInformationReceiptList />
          </>
        )}
      </div>
    </CometChatMessageInformationContext.Provider>
  );
};
