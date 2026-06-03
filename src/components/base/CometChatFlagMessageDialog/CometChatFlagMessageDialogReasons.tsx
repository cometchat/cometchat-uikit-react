import React, { useCallback } from 'react';
import type { CometChatFlagMessageDialogReasonsProps } from './CometChatFlagMessageDialog.types';
import { useCometChatFlagMessageDialogContext } from './CometChatFlagMessageDialog.context';
import { useLocale } from '../../../context/locale/LocaleContext';
import './CometChatFlagMessageDialog.css';

/**
 * Reasons list for the flag message dialog. Renders selectable reason buttons
 * as a radio group with arrow key navigation.
 */
export const CometChatFlagMessageDialogReasons: React.FC<
  CometChatFlagMessageDialogReasonsProps
> = ({ children, className }) => {
  const { flagReasons, selectedReason, selectReason, isLoadingReasons } =
    useCometChatFlagMessageDialogContext();
  const { getLocalizedString } = useLocale();

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (flagReasons.length === 0) return;

      const currentIndex = selectedReason
        ? flagReasons.findIndex(r => r.id === selectedReason.id)
        : -1;

      let nextIndex = -1;

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        nextIndex = currentIndex < flagReasons.length - 1 ? currentIndex + 1 : 0;
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        nextIndex = currentIndex > 0 ? currentIndex - 1 : flagReasons.length - 1;
      }

      if (nextIndex >= 0) {
        const reason = flagReasons[nextIndex];
        if (reason) {
          selectReason(reason);
          // Focus the newly selected reason button
          const container = event.currentTarget as HTMLElement;
          const buttons = container.querySelectorAll<HTMLElement>('[role="radio"]');
          buttons[nextIndex]?.focus();
        }
      }
    },
    [flagReasons, selectedReason, selectReason]
  );

  const reasonsClasses = ['cometchat-flag-message-dialog__reasons', className]
    .filter(Boolean)
    .join(' ');

  if (children) {
    return <div className={reasonsClasses}>{children}</div>;
  }

  if (isLoadingReasons) {
    return (
      <div className={reasonsClasses} aria-busy="true">
        <div className={'cometchat-flag-message-dialog__reasons-loading'}>
          {getLocalizedString('LOADING')}
        </div>
      </div>
    );
  }

  return (
    <div
      className={reasonsClasses}
      role="radiogroup"
      tabIndex={0}
      aria-label={getLocalizedString('flag_message_title')}
      onKeyDown={handleKeyDown}
    >
      {flagReasons.map(reason => {
        const isSelected = selectedReason?.id === reason.id;
        const reasonClasses = [
          'cometchat-flag-message-dialog__reason',
          isSelected ? 'cometchat-flag-message-dialog__reason--selected' : '',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <button
            key={reason.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            className={reasonClasses}
            tabIndex={isSelected || (!selectedReason && reason === flagReasons[0]) ? 0 : -1}
            onClick={() => {
              selectReason(reason);
            }}
          >
            {reason.name}
          </button>
        );
      })}
    </div>
  );
};

CometChatFlagMessageDialogReasons.displayName = 'CometChatFlagMessageDialogReasons';
