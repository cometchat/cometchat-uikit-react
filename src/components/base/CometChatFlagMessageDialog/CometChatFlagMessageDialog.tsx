import { CometChatFlagMessageDialogRoot } from './CometChatFlagMessageDialogRoot';
import { CometChatFlagMessageDialogHeader } from './CometChatFlagMessageDialogHeader';
import { CometChatFlagMessageDialogReasons } from './CometChatFlagMessageDialogReasons';
import { CometChatFlagMessageDialogRemark } from './CometChatFlagMessageDialogRemark';
import { CometChatFlagMessageDialogActions } from './CometChatFlagMessageDialogActions';

/**
 * CometChatFlagMessageDialog — compound component for reporting/flagging messages.
 *
 * Fetches flag reasons from the CometChat SDK, lets the user select a reason
 * and optionally provide a remark, then submits the report.
 *
 * Usage:
 * ```tsx
 * <CometChatFlagMessageDialog.Root message={msg} isOpen={open} onClose={() => setOpen(false)}>
 *   <CometChatFlagMessageDialog.Header />
 *   <CometChatFlagMessageDialog.Reasons />
 *   <CometChatFlagMessageDialog.Remark />
 *   <CometChatFlagMessageDialog.Actions />
 * </CometChatFlagMessageDialog.Root>
 * ```
 */
export const CometChatFlagMessageDialog = {
  Root: CometChatFlagMessageDialogRoot,
  Header: CometChatFlagMessageDialogHeader,
  Reasons: CometChatFlagMessageDialogReasons,
  Remark: CometChatFlagMessageDialogRemark,
  Actions: CometChatFlagMessageDialogActions,
} as const;
