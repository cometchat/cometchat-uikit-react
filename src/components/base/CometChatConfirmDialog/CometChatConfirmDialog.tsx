import React from 'react';
import { CometChatConfirmDialogRoot } from './CometChatConfirmDialogRoot';
import { CometChatConfirmDialogIcon } from './CometChatConfirmDialogIcon';
import { CometChatConfirmDialogContent } from './CometChatConfirmDialogContent';
import { CometChatConfirmDialogActions } from './CometChatConfirmDialogActions';
import type {
  CometChatConfirmDialogVariant,
  CometChatConfirmDialogIconProps,
  CometChatConfirmDialogContentProps,
  CometChatConfirmDialogActionsProps,
} from './CometChatConfirmDialog.types';

/**
 * Flat API props for CometChatConfirmDialog.
 * Renders Root + Icon + Content + Actions in one call.
 */
export interface CometChatConfirmDialogProps {
  /** Whether the dialog is currently open. */
  isOpen?: boolean;
  /** Callback when the dialog requests to close. */
  onClose?: () => void;
  /** Whether clicking outside closes the dialog. Defaults to true. */
  closeOnOutsideClick?: boolean;
  /** Visual variant. Defaults to 'danger'. */
  variant?: CometChatConfirmDialogVariant;
  /** Optional custom className for the root backdrop. */
  className?: string;
  /** Custom icon element for the Icon slot. */
  icon?: CometChatConfirmDialogIconProps['icon'];
  /** Title text for the Content slot. */
  title?: CometChatConfirmDialogContentProps['title'];
  /** Message text for the Content slot. */
  messageText?: CometChatConfirmDialogContentProps['messageText'];
  /** Cancel button text. */
  cancelButtonText?: CometChatConfirmDialogActionsProps['cancelButtonText'];
  /** Confirm button text. */
  confirmButtonText?: CometChatConfirmDialogActionsProps['confirmButtonText'];
  /** Callback when confirm is clicked. */
  onConfirm?: CometChatConfirmDialogActionsProps['onConfirm'];
  /** Callback when cancel is clicked. */
  onCancel?: CometChatConfirmDialogActionsProps['onCancel'];
  /** Whether confirm button shows loading state. */
  isLoading?: CometChatConfirmDialogActionsProps['isLoading'];
  /** Error text to display above buttons. */
  errorText?: CometChatConfirmDialogActionsProps['errorText'];
}

/**
 * CometChatConfirmDialog — Flat API component.
 *
 * Usage (flat):
 * ```tsx
 * <CometChatConfirmDialog
 *   isOpen={showDialog}
 *   onClose={() => setShowDialog(false)}
 *   variant="danger"
 *   title="Delete?"
 *   messageText="This cannot be undone."
 *   confirmButtonText="Delete"
 *   onConfirm={handleDelete}
 *   onCancel={() => setShowDialog(false)}
 * />
 * ```
 *
 * Usage (compound):
 * ```tsx
 * <CometChatConfirmDialog.Root isOpen={open} onClose={() => setOpen(false)} variant="danger">
 *   <CometChatConfirmDialog.Icon />
 *   <CometChatConfirmDialog.Content title="Delete?" messageText="This cannot be undone." />
 *   <CometChatConfirmDialog.Actions onConfirm={handleDelete} />
 * </CometChatConfirmDialog.Root>
 * ```
 */
const CometChatConfirmDialogComponent: React.FC<CometChatConfirmDialogProps> = ({
  isOpen,
  onClose,
  closeOnOutsideClick,
  variant,
  className,
  icon,
  title,
  messageText,
  cancelButtonText,
  confirmButtonText,
  onConfirm,
  onCancel,
  isLoading,
  errorText,
}) => {
  return (
    <CometChatConfirmDialogRoot
      isOpen={isOpen}
      onClose={onClose}
      closeOnOutsideClick={closeOnOutsideClick}
      variant={variant}
      className={className}
    >
      <CometChatConfirmDialogIcon icon={icon} />
      <CometChatConfirmDialogContent title={title} messageText={messageText} />
      <CometChatConfirmDialogActions
        cancelButtonText={cancelButtonText}
        confirmButtonText={confirmButtonText}
        onConfirm={onConfirm}
        onCancel={onCancel}
        isLoading={isLoading}
        errorText={errorText}
      />
    </CometChatConfirmDialogRoot>
  );
};

CometChatConfirmDialogComponent.displayName = 'CometChatConfirmDialog';

export const CometChatConfirmDialog = Object.assign(CometChatConfirmDialogComponent, {
  Root: CometChatConfirmDialogRoot,
  Icon: CometChatConfirmDialogIcon,
  Content: CometChatConfirmDialogContent,
  Actions: CometChatConfirmDialogActions,
});
