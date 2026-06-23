import React, { forwardRef, useCallback, useEffect, useRef } from 'react';
import type { CometChatLinkPopoverProps } from './CometChatLinkPopover.types';
import { CometChatButton } from '../CometChatButton';
import { useCometChatFrameContext } from '../../../context/CometChatFrameContext';
import './CometChatLinkPopover.css';
import { useLocale } from '../../../context/locale/LocaleContext';

/**
 * CometChatLinkPopover — a floating popover for link actions in the rich text editor.
 *
 * Positioned absolutely above the clicked link using the provided coordinates.
 *
 * Usage:
 * ```tsx
 * {showPopover && (
 *   <CometChatLinkPopover
 *     text="Example"
 *     url="https://example.com"
 *     position={{ top: 200, left: 100 }}
 *     onEdit={({ url, text }) => handleEdit(url, text)}
 *     onRemove={handleRemove}
 *     onClose={() => setShowPopover(false)}
 *   />
 * )}
 * ```
 */
export const CometChatLinkPopover = forwardRef<HTMLDivElement, CometChatLinkPopoverProps>(
  ({ text, url, position, onEdit, onRemove, onClose, className, ...rest }, ref) => {
    const { getLocalizedString } = useLocale();
    const popoverRef = useRef<HTMLDivElement>(null);
    const IframeContext = useCometChatFrameContext();

    const getCurrentWindow = useCallback(() => {
      return IframeContext.iframeWindow ?? window;
    }, [IframeContext.iframeWindow]);

    const getCurrentDocument = useCallback(() => {
      return IframeContext.iframeDocument ?? document;
    }, [IframeContext.iframeDocument]);

    // Merge refs
    const setRef = useCallback(
      (node: HTMLDivElement | null) => {
        popoverRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref]
    );

    // Close on outside click
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
          onClose();
        }
      };

      const timeoutId = setTimeout(() => {
        getCurrentDocument().addEventListener('mousedown', handleClickOutside);
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        getCurrentDocument().removeEventListener('mousedown', handleClickOutside);
      };
    }, [onClose, getCurrentDocument]);

    // Close on Escape key
    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose();
        }
      };

      getCurrentDocument().addEventListener('keydown', handleKeyDown);
      return () => {
        getCurrentDocument().removeEventListener('keydown', handleKeyDown);
      };
    }, [onClose, getCurrentDocument]);

    const handleEdit = useCallback(() => {
      onEdit({ url, text });
    }, [onEdit, url, text]);

    const handleUrlClick = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        getCurrentWindow().open(url, '_blank', 'noopener,noreferrer');
      },
      [url, getCurrentWindow]
    );

    const rootClass = ['cometchat-link-popover', className].filter(Boolean).join(' ');

    return (
      <div
        ref={setRef}
        className={rootClass}
        style={{ bottom: position.top, left: position.left }}
        {...rest}
      >
        <div className={'cometchat-link-popover__content'}>
          {/* Close button */}
          <button
            type="button"
            className={'cometchat-link-popover__close'}
            onClick={onClose}
            aria-label={getLocalizedString('accessibility_close')}
          >
            &times;
          </button>

          {/* Link title */}
          <div className={'cometchat-link-popover__title'}>{text}</div>

          {/* Link URL */}
          <a
            className={'cometchat-link-popover__url'}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleUrlClick}
          >
            {url}
          </a>

          {/* Action buttons */}
          <div className={'cometchat-link-popover__actions'}>
            <CometChatButton.Root
              variant="secondary"
              className={'cometchat-link-popover__button--edit'}
              onClick={handleEdit}
              aria-label={getLocalizedString('link_popover_edit')}
            >
              <CometChatButton.Text>{getLocalizedString('link_popover_edit')}</CometChatButton.Text>
            </CometChatButton.Root>

            <CometChatButton.Root
              variant="primary"
              className={'cometchat-link-popover__button--remove'}
              onClick={onRemove}
              aria-label={getLocalizedString('link_popover_remove')}
            >
              <CometChatButton.Text>
                {getLocalizedString('link_popover_remove')}
              </CometChatButton.Text>
            </CometChatButton.Root>
          </div>
        </div>
      </div>
    );
  }
);

CometChatLinkPopover.displayName = 'CometChatLinkPopover';
