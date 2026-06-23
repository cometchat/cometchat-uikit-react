import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import type {
  CometChatChangeScopeRootProps,
  CometChatChangeScopeContextValue,
} from './CometChatChangeScope.types';
import { CometChatChangeScopeContext } from './CometChatChangeScope.context';
import { useCometChatChangeScope } from './useCometChatChangeScope';
import { useCometChatFrameContext } from '../../../context/CometChatFrameContext';
import './CometChatChangeScope.css';

const TITLE_ID = 'cometchat-change-scope-title';

/**
 * Root container for the change scope dialog.
 * Provides context, focus trap, and keyboard handling.
 */
export const CometChatChangeScopeRoot: React.FC<CometChatChangeScopeRootProps> = ({
  options,
  defaultSelection = '',
  onScopeChanged,
  onClose,
  className,
  children,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const IframeContext = useCometChatFrameContext();

  const getCurrentDocument = useCallback(() => {
    return IframeContext.iframeDocument ?? document;
  }, [IframeContext.iframeDocument]);

  const hookValue = useCometChatChangeScope({
    options,
    defaultSelection,
    onScopeChanged,
    onClose,
  });

  // Capture trigger element on mount.
  useEffect(() => {
    previousFocusRef.current = getCurrentDocument().activeElement as HTMLElement | null;

    // Focus the dialog container, not the first control — traps focus without
    // painting a focus ring on the first radio when the dialog opens.
    const id = requestAnimationFrame(() => {
      dialogRef.current?.focus();
    });

    return () => {
      cancelAnimationFrame(id);
      // Restore focus on unmount.
      previousFocusRef.current?.focus();
    };
  }, [getCurrentDocument]);

  // Keyboard handler: Escape to close, Tab focus trap, Arrow keys for radio navigation.
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        hookValue.cancel();
        return;
      }

      // Focus trap on Tab.
      if (e.key === 'Tab') {
        const dialog = dialogRef.current;
        if (!dialog) return;

        const focusable = Array.from(
          dialog.querySelectorAll<HTMLElement>(
            'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
          )
        );
        if (focusable.length === 0) return;

        const currentIdx = focusable.indexOf(getCurrentDocument().activeElement as HTMLElement);
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
    [hookValue, getCurrentDocument]
  );

  const ctxValue = useMemo<CometChatChangeScopeContextValue>(
    () => ({
      options,
      selectedId: hookValue.selectedId,
      defaultSelection,
      isLoading: hookValue.isLoading,
      error: hookValue.error,
      selectOption: hookValue.selectOption,
      confirmChange: hookValue.confirmChange,
      cancel: hookValue.cancel,
      hasChanged: hookValue.hasChanged,
    }),
    [options, defaultSelection, hookValue]
  );

  const baseClass = 'cometchat-change-scope';
  const rootClass = className ? `${baseClass} ${className}` : baseClass;

  return (
    <CometChatChangeScopeContext.Provider value={ctxValue}>
      <div
        ref={dialogRef}
        className={rootClass}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={TITLE_ID}
        onKeyDown={handleKeyDown}
      >
        {children}
      </div>
    </CometChatChangeScopeContext.Provider>
  );
};

export { TITLE_ID };
