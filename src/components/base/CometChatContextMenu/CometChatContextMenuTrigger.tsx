import React from 'react';
import type { CometChatContextMenuTriggerProps } from './CometChatContextMenu.types';
import { useCometChatContextMenuContext } from './CometChatContextMenu.context';
import { useLocale } from '../../../context/locale/LocaleContext';
import './CometChatContextMenu.css';

const MoreIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M12 19.27a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm0-5.77a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm0-5.77a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z"
      fill="currentColor"
    />
  </svg>
);

/**
 * The "more" button that toggles the dropdown.
 */
export const CometChatContextMenuTrigger: React.FC<CometChatContextMenuTriggerProps> = ({
  tooltip,
  className,
  children,
}) => {
  const { isOpen, toggle, open, triggerRef } = useCometChatContextMenuContext();
  const { getLocalizedString } = useLocale();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        open();
      }
    }
  };

  const baseClass = 'cometchat-context-menu__trigger';
  const classes = [baseClass, className].filter(Boolean).join(' ');

  return (
    <button
      ref={triggerRef}
      type="button"
      className={classes}
      onClick={toggle}
      onKeyDown={handleKeyDown}
      aria-haspopup="true"
      aria-expanded={isOpen}
      aria-label={tooltip ?? getLocalizedString('accessibility_more_options')}
      title={tooltip}
    >
      {children ?? (
        <span className={'cometchat-context-menu__trigger-icon'}>
          <MoreIcon />
        </span>
      )}
    </button>
  );
};
