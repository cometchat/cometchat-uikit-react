import React, { useCallback, useState } from 'react';
import type { CometChatConfirmDialogActionsProps } from './CometChatConfirmDialog.types';
import { useCometChatConfirmDialogContext } from './CometChatConfirmDialog.context';
import { useLocale } from '../../../context/locale/LocaleContext';
import { CometChatButton } from '../CometChatButton/CometChatButton';
import './CometChatConfirmDialog.css';

/**
 * Actions area for the confirm dialog. Renders cancel + confirm buttons
 * with automatic async loading and error handling.
 */
export const CometChatConfirmDialogActions: React.FC<CometChatConfirmDialogActionsProps> = ({
  cancelButtonText,
  confirmButtonText,
  onConfirm,
  onCancel,
  isLoading: isLoadingProp,
  errorText: errorTextProp,
  children,
  className,
}) => {
  const { onClose, variant } = useCometChatConfirmDialogContext();
  const { getLocalizedString } = useLocale();

  const [internalLoading, setInternalLoading] = useState(false);
  const [internalError, setInternalError] = useState<string | undefined>(undefined);

  const isLoading = isLoadingProp ?? internalLoading;
  const errorText = errorTextProp ?? internalError;

  const resolvedCancelText =
    cancelButtonText ?? getLocalizedString('conversation_delete_confirm_no');
  const resolvedConfirmText =
    confirmButtonText ?? getLocalizedString('conversation_delete_confirm_yes');

  const handleConfirm = useCallback(async () => {
    if (!onConfirm || isLoading) return;

    const result = onConfirm();

    // If onConfirm returns a Promise, manage loading/error automatically
    if (result instanceof Promise) {
      setInternalLoading(true);
      setInternalError(undefined);
      try {
        await result;
        setInternalLoading(false);
        setInternalError(undefined);
        onClose();
      } catch {
        setInternalError(getLocalizedString('conversation_delete_error'));
        setInternalLoading(false);
      }
    }
  }, [onConfirm, isLoading, onClose, getLocalizedString]);

  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  }, [onCancel, onClose]);

  const actionsClasses = ['cometchat-confirm-dialog__actions', className].filter(Boolean).join(' ');

  if (children) {
    return <div className={actionsClasses}>{children}</div>;
  }

  const confirmModifier = `cometchat-confirm-dialog__actions-confirm--${variant}`;

  return (
    <>
      {errorText && (
        <div className={'cometchat-confirm-dialog__error'} role="alert" aria-live="assertive">
          {errorText}
        </div>
      )}
      <div className={actionsClasses}>
        <div className={'cometchat-confirm-dialog__actions-cancel'}>
          <CometChatButton variant="secondary" onClick={handleCancel} text={resolvedCancelText} />
        </div>
        <div
          className={['cometchat-confirm-dialog__actions-confirm', confirmModifier]
            .filter(Boolean)
            .join(' ')}
        >
          <CometChatButton
            variant="primary"
            onClick={() => {
              void handleConfirm();
            }}
            isLoading={isLoading}
            disabled={isLoading}
            aria-busy={isLoading}
            aria-disabled={isLoading}
            text={resolvedConfirmText}
          />
        </div>
      </div>
    </>
  );
};

CometChatConfirmDialogActions.displayName = 'CometChatConfirmDialogActions';
