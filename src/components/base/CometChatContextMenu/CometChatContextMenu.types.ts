import type { ReactNode } from 'react';

/** Placement of the dropdown relative to the trigger. */
export type CometChatContextMenuPlacement = 'top' | 'right' | 'bottom' | 'left';

/** A single menu item. */
export interface CometChatContextMenuItemData {
  /** Unique identifier. */
  id: string;
  /** Display title. */
  title: string;
  /** Icon element (SVG component or ReactNode). */
  icon?: ReactNode;
  /** Icon URL (for mask-image rendering). */
  iconURL?: string;
  /** Callback when item is selected. */
  onClick: () => void;
  /** Whether the item is disabled. */
  disabled?: boolean;
  /** Optional custom className. */
  className?: string;
}

/** Props for CometChatContextMenuRoot. */
export interface CometChatContextMenuRootProps {
  /** All menu items. */
  items?: CometChatContextMenuItemData[];
  /** Number of items to show in the top row. Remaining go to the dropdown. Defaults to 2. */
  topMenuSize?: number;
  /** Callback when any menu item is clicked. Overrides individual item.onClick if provided. */
  onOptionClicked?: (item: CometChatContextMenuItemData) => void;
  /** Placement of the dropdown popover. Defaults to 'left'. */
  placement?: CometChatContextMenuPlacement;
  /** Tooltip text for the "more" button. */
  moreButtonTooltip?: string;
  /** Whether clicking outside closes the dropdown. Defaults to true. */
  closeOnOutsideClick?: boolean;
  /**
   * When true, renders a transparent overlay behind the dropdown that blocks
   * scroll and pointer events on the background. Also closes the dropdown on scroll.
   */
  disableBackgroundInteraction?: boolean;
  /**
   * Callback fired when the dropdown closes. Useful for the parent to hide
   * the entire options toolbar when the menu dismisses.
   */
  onDropdownClose?: () => void;
  /**
   * When true, uses the nearest scrollable ancestor as the boundary for dropdown positioning.
   * Useful for iframe or constrained container scenarios.
   */
  useParentContainer?: boolean;
  /**
   * When true (and useParentContainer is true), clamps the dropdown vertically
   * within the parent container's bounds.
   */
  useParentHeight?: boolean;
  /**
   * When true, disables dynamic flip/reposition logic for the dropdown.
   */
  forceStaticPlacement?: boolean;
  /** Children for fully custom rendering (overrides items-based rendering). */
  children?: ReactNode;
  /** Optional custom className for the root container. */
  className?: string;
}

/** Props for CometChatContextMenuItem. */
export interface CometChatContextMenuItemProps {
  /** The menu item data. */
  item: CometChatContextMenuItemData;
  /** Display variant: 'icon' for top-row (icon only) or 'full' for dropdown (icon + title). */
  variant?: 'icon' | 'full';
  /** Optional custom className. */
  className?: string;
}

/** Props for CometChatContextMenuTrigger (the "more" button). */
export interface CometChatContextMenuTriggerProps {
  /** Tooltip text. */
  tooltip?: string;
  /** Optional custom className. */
  className?: string;
  /** Custom trigger content (replaces default "more" icon). */
  children?: ReactNode;
}

/** Props for CometChatContextMenuDropdown. */
export interface CometChatContextMenuDropdownProps {
  /** Placement relative to the trigger. */
  placement?: CometChatContextMenuPlacement;
  /**
   * When true, uses the nearest scrollable ancestor (or `.cometchat` container)
   * as the boundary for positioning instead of the viewport.
   * Useful when rendered inside iframes or constrained containers.
   */
  useParentContainer?: boolean;
  /**
   * When true (and useParentContainer is true), clamps the dropdown's vertical
   * position to stay within the parent container's height.
   */
  useParentHeight?: boolean;
  /**
   * When true, disables dynamic flip/reposition logic. The dropdown opens exactly
   * at the specified placement without checking available space.
   */
  forceStaticPlacement?: boolean;
  /** Children (CometChatContextMenu.Item elements). */
  children?: ReactNode;
  /** Optional custom className. */
  className?: string;
}

/** Context value shared across sub-components. */
export interface CometChatContextMenuContextValue {
  /** Whether the dropdown is open. */
  isOpen: boolean;
  /** Open the dropdown. */
  open: () => void;
  /** Close the dropdown. */
  close: () => void;
  /** Toggle the dropdown. */
  toggle: () => void;
  /** Placement of the dropdown. */
  placement: CometChatContextMenuPlacement;
  /** Callback when an item is clicked. */
  onOptionClicked?: (item: CometChatContextMenuItemData) => void;
  /** Ref for the trigger button (used for focus restoration). */
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  /** Use parent container as positioning boundary. */
  useParentContainer?: boolean;
  /** Clamp vertical position to parent height. */
  useParentHeight?: boolean;
  /** Disable dynamic flip/reposition logic. */
  forceStaticPlacement?: boolean;
  /** Block background scroll/interaction when dropdown is open. */
  disableBackgroundInteraction?: boolean;
}
