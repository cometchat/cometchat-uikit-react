import React from 'react';
import { CometChatContextMenuRoot } from './CometChatContextMenuRoot';
import { CometChatContextMenuItem } from './CometChatContextMenuItem';
import { CometChatContextMenuTrigger } from './CometChatContextMenuTrigger';
import { CometChatContextMenuDropdown } from './CometChatContextMenuDropdown';
import type { CometChatContextMenuRootProps } from './CometChatContextMenu.types';

/**
 * Flat API props for CometChatContextMenu.
 * Same as Root props — the Root already supports data-driven rendering
 * when no children are provided (splits items into top-row + dropdown).
 */
export type CometChatContextMenuProps = Omit<CometChatContextMenuRootProps, 'children'>;

/**
 * CometChatContextMenu — Flat API component (data-driven).
 *
 * Usage (flat/data-driven):
 * ```tsx
 * <CometChatContextMenu items={items} topMenuSize={2} placement="left" />
 * ```
 *
 * Usage (compound):
 * ```tsx
 * <CometChatContextMenu.Root placement="bottom">
 *   <CometChatContextMenu.Trigger>
 *     <button>⋮</button>
 *   </CometChatContextMenu.Trigger>
 *   <CometChatContextMenu.Dropdown>
 *     <CometChatContextMenu.Item item={item} variant="full" />
 *   </CometChatContextMenu.Dropdown>
 * </CometChatContextMenu.Root>
 * ```
 */
const CometChatContextMenuComponent: React.FC<CometChatContextMenuProps> = props => {
  return <CometChatContextMenuRoot {...props} />;
};

CometChatContextMenuComponent.displayName = 'CometChatContextMenu';

export const CometChatContextMenu = Object.assign(CometChatContextMenuComponent, {
  Root: CometChatContextMenuRoot,
  Item: CometChatContextMenuItem,
  Trigger: CometChatContextMenuTrigger,
  Dropdown: CometChatContextMenuDropdown,
});
