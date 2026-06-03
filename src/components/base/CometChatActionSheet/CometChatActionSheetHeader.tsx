import React from 'react';
import type { CometChatActionSheetHeaderProps } from './CometChatActionSheet.types';
import './CometChatActionSheet.css';
import { useLocale } from '../../../context/locale/LocaleContext';

const HEADER_TITLE_ID = 'cometchat-action-sheet-title';

/**
 * Optional header bar for the action sheet.
 * Renders a title and/or close button. Supports custom children.
 */
export const CometChatActionSheetHeader: React.FC<CometChatActionSheetHeaderProps> = ({
  title,
  onClose,
  children,
}) => {
  const { getLocalizedString } = useLocale();
  if (children) {
    return <div className={'cometchat-action-sheet__header'}>{children}</div>;
  }

  return (
    <div className={'cometchat-action-sheet__header'}>
      {title ? (
        <h2 id={HEADER_TITLE_ID} className={'cometchat-action-sheet__header-title'}>
          {title}
        </h2>
      ) : (
        <span />
      )}
      {onClose ? (
        <button
          type="button"
          className={'cometchat-action-sheet__header-close-button'}
          onClick={onClose}
          aria-label={getLocalizedString('accessibility_close')}
        >
          ✕
        </button>
      ) : null}
    </div>
  );
};

export { HEADER_TITLE_ID };
