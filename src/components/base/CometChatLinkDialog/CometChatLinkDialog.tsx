import React, { forwardRef, useState, useCallback, useEffect, useRef, useId, useMemo } from 'react';
import type { CometChatLinkDialogProps } from './CometChatLinkDialog.types';
import { CometChatButton } from '../CometChatButton';
import { useLocale } from '../../../context/locale/LocaleContext';
import './CometChatLinkDialog.css';

/**
 * Normalizes a URL by prepending `https://` if no protocol is present.
 */
function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//i.test(trimmed) || /^mailto:/i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

/**
 * CometChatLinkDialog — a dialog for adding and editing hyperlinks in the
 * rich text editor. Includes text and URL inputs with validation, URL
 * normalization, focus trapping, and full keyboard accessibility.
 *
 * Usage:
 * ```tsx
 * {showDialog && (
 *   <CometChatLinkDialog
 *     mode="add"
 *     onSave={({ text, url }) => insertLink(text, url)}
 *     onCancel={() => setShowDialog(false)}
 *   />
 * )}
 * ```
 */
export const CometChatLinkDialog = forwardRef<HTMLDivElement, CometChatLinkDialogProps>(
  (
    {
      mode = 'add',
      initialText = '',
      initialUrl = '',
      selectedText = '',
      onSave,
      onCancel,
      className,
      ...rest
    },
    ref
  ) => {
    const titleId = useId();
    const errorId = useId();
    const { getLocalizedString } = useLocale();

    // Determine initial values
    const startText = mode === 'edit' ? initialText : selectedText || initialText;
    const startUrl = initialUrl;

    const [text, setText] = useState(startText);
    const [url, setUrl] = useState(startUrl);
    const [errorMessage, setErrorMessage] = useState('');

    const dialogRef = useRef<HTMLDivElement | null>(null);
    const textInputRef = useRef<HTMLInputElement>(null);
    const urlInputRef = useRef<HTMLInputElement>(null);
    const cancelButtonRef = useRef<HTMLButtonElement>(null);
    const saveButtonRef = useRef<HTMLButtonElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);

    // Has changes check for edit mode
    const hasChanges = useMemo(() => {
      if (mode !== 'edit') return true;
      return text.trim() !== initialText.trim() || url.trim() !== initialUrl.trim();
    }, [mode, text, url, initialText, initialUrl]);

    // Store previously focused element
    useEffect(() => {
      previousFocusRef.current = document.activeElement as HTMLElement;
    }, []);

    // Auto-focus appropriate input
    useEffect(() => {
      const timer = setTimeout(() => {
        if (mode === 'add' && !startText) {
          textInputRef.current?.focus();
        } else {
          urlInputRef.current?.focus();
          urlInputRef.current?.select();
        }
      }, 0);
      return () => {
        clearTimeout(timer);
      };
    }, [mode, startText]);

    // Restore focus on unmount
    useEffect(() => {
      return () => {
        const el = previousFocusRef.current;
        if (el && typeof el.focus === 'function') {
          setTimeout(() => {
            el.focus();
          }, 0);
        }
      };
    }, []);

    // Focus trap + keyboard handler
    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          onCancel();
          return;
        }

        if (event.key === 'Enter' && event.target instanceof HTMLInputElement) {
          event.preventDefault();
          handleSave();
          return;
        }

        // Focus trap
        if (event.key === 'Tab') {
          const focusable = getFocusableElements();
          if (focusable.length === 0) return;

          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          const active = document.activeElement;

          if (event.shiftKey && active === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && active === last) {
            event.preventDefault();
            first?.focus();
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onCancel, text, url, hasChanges, mode]);

    const getFocusableElements = useCallback((): HTMLElement[] => {
      if (!dialogRef.current) return [];
      const selectors =
        'input:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])';
      return Array.from(dialogRef.current.querySelectorAll<HTMLElement>(selectors));
    }, []);

    const handleSave = useCallback(() => {
      setErrorMessage('');

      const trimmedText = text.trim();
      const trimmedUrl = url.trim();

      if (mode === 'add' && !trimmedText) {
        setErrorMessage(getLocalizedString('link_dialog_text_required'));
        textInputRef.current?.focus();
        return;
      }

      if (!trimmedUrl) {
        setErrorMessage(getLocalizedString('link_url_required'));
        urlInputRef.current?.focus();
        return;
      }

      if (mode === 'edit' && !hasChanges) return;

      const normalizedUrl = normalizeUrl(trimmedUrl);
      onSave({
        text: trimmedText || normalizedUrl,
        url: normalizedUrl,
      });
    }, [text, url, mode, hasChanges, onSave, getLocalizedString]);

    const handleTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      setText(e.target.value);
      setErrorMessage('');
    }, []);

    const handleUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      setUrl(e.target.value);
      setErrorMessage('');
    }, []);

    const rootClass = ['cometchat-link-dialog', className].filter(Boolean).join(' ');
    const isEdit = mode === 'edit';
    const saveDisabled = isEdit && !hasChanges;

    return (
      <div
        ref={node => {
          dialogRef.current = node;
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        className={rootClass}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={errorMessage ? errorId : undefined}
        {...rest}
      >
        {/* Title */}
        <div id={titleId} className={'cometchat-link-dialog__title'}>
          {isEdit
            ? getLocalizedString('link_dialog_edit_link')
            : getLocalizedString('link_dialog_add_link')}
        </div>

        {/* Inputs */}
        <div className={'cometchat-link-dialog__inputs'}>
          {/* Text input */}
          <div className={'cometchat-link-dialog__input-group'}>
            <label className={'cometchat-link-dialog__label'} htmlFor="link-text-input">
              Text
            </label>
            <input
              ref={textInputRef}
              id="link-text-input"
              type="text"
              className={'cometchat-link-dialog__input'}
              autoComplete="off"
              value={text}
              onChange={handleTextChange}
              placeholder={getLocalizedString('link_dialog_text_placeholder')}
              aria-required={mode === 'add' ? 'true' : undefined}
              aria-invalid={errorMessage ? 'true' : undefined}
            />
          </div>

          {/* URL input */}
          <div className={'cometchat-link-dialog__input-group'}>
            <label className={'cometchat-link-dialog__label'} htmlFor="link-url-input">
              Link
            </label>
            <input
              ref={urlInputRef}
              id="link-url-input"
              type="text"
              className={'cometchat-link-dialog__input'}
              autoComplete="off"
              value={url}
              onChange={handleUrlChange}
              placeholder="https://www.cometchat.com/"
              aria-required="true"
              aria-invalid={errorMessage ? 'true' : undefined}
            />
          </div>

          {/* Error message */}
          {errorMessage && (
            <div
              id={errorId}
              className={'cometchat-link-dialog__error'}
              role="alert"
              aria-live="polite"
            >
              {errorMessage}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className={'cometchat-link-dialog__button-group'}>
          <div className={'cometchat-link-dialog__button-group-cancel'}>
            <CometChatButton.Root
              ref={cancelButtonRef}
              variant="secondary"
              onClick={onCancel}
              aria-label={getLocalizedString('cancel')}
            >
              <CometChatButton.Text>{getLocalizedString('cancel')}</CometChatButton.Text>
            </CometChatButton.Root>
          </div>
          <div className={'cometchat-link-dialog__button-group-save'}>
            <CometChatButton.Root
              ref={saveButtonRef}
              variant="primary"
              onClick={handleSave}
              disabled={saveDisabled}
              aria-label={getLocalizedString('link_dialog_save')}
            >
              <CometChatButton.Text>{getLocalizedString('link_dialog_save')}</CometChatButton.Text>
            </CometChatButton.Root>
          </div>
        </div>
      </div>
    );
  }
);

CometChatLinkDialog.displayName = 'CometChatLinkDialog';
