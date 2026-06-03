import { CometChatActionSheetRoot } from './CometChatActionSheetRoot';
import { CometChatActionSheetItem } from './CometChatActionSheetItem';
import { CometChatActionSheetHeader } from './CometChatActionSheetHeader';
import { CometChatActionSheetLayout } from './CometChatActionSheetLayout';

/**
 * CometChatActionSheet — compound component.
 *
 * Usage:
 * ```tsx
 * <CometChatActionSheet.Root isOpen={open} onClose={close}>
 *   <CometChatActionSheet.Header title="Actions" onClose={close} />
 *   <CometChatActionSheet.Layout mode="list">
 *     <CometChatActionSheet.Item item={item} />
 *   </CometChatActionSheet.Layout>
 * </CometChatActionSheet.Root>
 * ```
 */
export const CometChatActionSheet = {
  Root: CometChatActionSheetRoot,
  Item: CometChatActionSheetItem,
  Header: CometChatActionSheetHeader,
  Layout: CometChatActionSheetLayout,
} as const;
