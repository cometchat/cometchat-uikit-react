import { CometChatContextMenuRoot } from './CometChatContextMenuRoot';
import { CometChatContextMenuItem } from './CometChatContextMenuItem';
import { CometChatContextMenuTrigger } from './CometChatContextMenuTrigger';
import { CometChatContextMenuDropdown } from './CometChatContextMenuDropdown';

/**
 * CometChatContextMenu — compound component.
 *
 * Data-driven usage:
 * ```tsx
 * <CometChatContextMenu.Root items={items} topMenuSize={2} placement="left" />
 * ```
 *
 * Fully composed usage:
 * ```tsx
 * <CometChatContextMenu.Root placement="bottom">
 *   <CometChatContextMenu.Item item={item1} variant="icon" />
 *   <CometChatContextMenu.Trigger />
 *   <CometChatContextMenu.Dropdown>
 *     <CometChatContextMenu.Item item={item2} variant="full" />
 *   </CometChatContextMenu.Dropdown>
 * </CometChatContextMenu.Root>
 * ```
 */
export const CometChatContextMenu = {
  Root: CometChatContextMenuRoot,
  Item: CometChatContextMenuItem,
  Trigger: CometChatContextMenuTrigger,
  Dropdown: CometChatContextMenuDropdown,
} as const;
