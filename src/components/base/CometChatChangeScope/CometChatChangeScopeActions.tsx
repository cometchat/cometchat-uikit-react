import React from 'react';
import type { CometChatChangeScopeActionsProps } from './CometChatChangeScope.types';
import { useCometChatChangeScopeContext } from './CometChatChangeScope.context';
import { CometChatButton } from '../CometChatButton/CometChatButton';
import { useLocale } from '../../../context/locale/LocaleContext';
import './CometChatChangeScope.css';

/**
 * Cancel and submit buttons for the change scope dialog.
 */
export const CometChatChangeScopeActions: React.FC<CometChatChangeScopeActionsProps> = ({
  submitText,
  cancelText,
  className,
}) => {
  const { getLocalizedString } = useLocale();
  const { hasChanged, isLoading, confirmChange, cancel } = useCometChatChangeScopeContext();

  const resolvedSubmitText = submitText ?? getLocalizedString('change_scope_confirm_yes');
  const resolvedCancelText = cancelText ?? getLocalizedString('change_scope_confirm_no');

  const isSubmitDisabled = !hasChanged || isLoading;

  const baseClass = 'cometchat-change-scope__button-container';
  const actionsClass = className ? `${baseClass} ${className}` : baseClass;

  return (
    <div className={actionsClass}>
      <div className={'cometchat-change-scope__cancel-button'}>
        <CometChatButton
          variant="secondary"
          onClick={cancel}
          style={{ width: '100%', height: '100%' }}
          text={resolvedCancelText}
        />
      </div>
      <div className={'cometchat-change-scope__submit-button'}>
        <CometChatButton
          variant="primary"
          onClick={confirmChange}
          disabled={isSubmitDisabled}
          isLoading={hasChanged && isLoading}
          aria-disabled={isSubmitDisabled || undefined}
          style={{ width: '100%', height: '100%' }}
          text={resolvedSubmitText}
        />
      </div>
    </div>
  );
};
