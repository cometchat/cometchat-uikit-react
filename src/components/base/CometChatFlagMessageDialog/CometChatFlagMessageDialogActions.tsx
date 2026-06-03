import React from 'react';
import type { CometChatFlagMessageDialogActionsProps } from './CometChatFlagMessageDialog.types';
import { useCometChatFlagMessageDialogContext } from './CometChatFlagMessageDialog.context';
import { useLocale } from '../../../context/locale/LocaleContext';
import { CometChatButton } from '../CometChatButton/CometChatButton';
import './CometChatFlagMessageDialog.css';

/**
 * Actions area for the flag message dialog. Renders cancel + submit buttons
 * with loading state and error display.
 */
export const CometChatFlagMessageDialogActions: React.FC<
  CometChatFlagMessageDialogActionsProps
> = ({ cancelText, submitText, children, className }) => {
  const { onClose, selectedReason, isLoading, handleSubmit } =
    useCometChatFlagMessageDialogContext();
  const { getLocalizedString } = useLocale();

  const resolvedCancelText = cancelText ?? getLocalizedString('flag_message_confirm_no');
  const resolvedSubmitText = submitText ?? getLocalizedString('flag_message_confirm_yes');

  const actionsClasses = ['cometchat-flag-message-dialog__actions', className]
    .filter(Boolean)
    .join(' ');

  if (children) {
    return <div className={actionsClasses}>{children}</div>;
  }

  const isDisabled = !selectedReason;

  return (
    <div className={actionsClasses}>
      <div className={'cometchat-flag-message-dialog__actions-cancel'}>
        <CometChatButton.Root variant="secondary" onClick={onClose}>
          <CometChatButton.Text>{resolvedCancelText}</CometChatButton.Text>
        </CometChatButton.Root>
      </div>
      <div className={'cometchat-flag-message-dialog__actions-submit'}>
        <CometChatButton.Root
          variant="primary"
          onClick={() => {
            void handleSubmit();
          }}
          isLoading={isLoading}
          disabled={isDisabled || isLoading}
          aria-disabled={isDisabled || isLoading}
          aria-busy={isLoading}
        >
          <CometChatButton.Text>{resolvedSubmitText}</CometChatButton.Text>
        </CometChatButton.Root>
      </div>
    </div>
  );
};

CometChatFlagMessageDialogActions.displayName = 'CometChatFlagMessageDialogActions';
