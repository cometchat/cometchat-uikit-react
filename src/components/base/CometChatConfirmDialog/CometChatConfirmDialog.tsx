import { CometChatConfirmDialogRoot } from './CometChatConfirmDialogRoot';
import { CometChatConfirmDialogIcon } from './CometChatConfirmDialogIcon';
import { CometChatConfirmDialogContent } from './CometChatConfirmDialogContent';
import { CometChatConfirmDialogActions } from './CometChatConfirmDialogActions';

/**
 * CometChatConfirmDialog — compound component for confirmation dialogs.
 *
 * Supports danger, warning, and info variants with configurable icon,
 * content, and action buttons. Handles async confirm with auto loading/error.
 *
 * Usage:
 * ```tsx
 * <CometChatConfirmDialog.Root isOpen={open} onClose={() => setOpen(false)} variant="danger">
 *   <CometChatConfirmDialog.Icon />
 *   <CometChatConfirmDialog.Content title="Delete?" messageText="This cannot be undone." />
 *   <CometChatConfirmDialog.Actions onConfirm={handleDelete} />
 * </CometChatConfirmDialog.Root>
 * ```
 */
export const CometChatConfirmDialog = {
  Root: CometChatConfirmDialogRoot,
  Icon: CometChatConfirmDialogIcon,
  Content: CometChatConfirmDialogContent,
  Actions: CometChatConfirmDialogActions,
} as const;
