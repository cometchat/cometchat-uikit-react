import type { ReactNode } from 'react';

/** A single action item rendered inside the sheet. */
export interface CometChatActionSheetItemData {
  /** Unique identifier. */
  id: string;
  /** Display title. */
  title: string;
  /** Icon element (SVG or ReactNode). */
  icon?: ReactNode;
  /** Callback when item is selected. */
  onClick: () => void;
  /** Optional secondary text. */
  subtitle?: string;
  /** Whether the item is disabled. */
  disabled?: boolean;
  /** Optional custom className. */
  className?: string;
}

/** Layout mode for the action sheet. */
export type CometChatActionSheetLayoutMode = 'list' | 'grid';

/** Props for ActionSheetRoot. */
export interface CometChatActionSheetRootProps {
  /** Whether the sheet is open. */
  isOpen: boolean;
  /** Callback when the sheet requests to close (backdrop click, Escape key). */
  onClose: () => void;
  /** Layout mode. Defaults to 'list'. */
  layoutMode?: CometChatActionSheetLayoutMode;
  /** Optional title displayed in the header. */
  title?: string;
  /** Children (ActionSheet.Item elements or custom content). */
  children: ReactNode;
  /** Optional custom className for the root container. */
  className?: string;
}

/** Props for ActionSheetItem. */
export interface CometChatActionSheetItemProps {
  /** The action item data. */
  item: CometChatActionSheetItemData;
  /** Optional custom className. */
  className?: string;
}

/** Props for ActionSheetHeader. */
export interface CometChatActionSheetHeaderProps {
  /** Title text. */
  title?: string;
  /** Optional close button callback. */
  onClose?: () => void;
  /** Children for custom header content. */
  children?: ReactNode;
}

/** Props for ActionSheetLayout. */
export interface CometChatActionSheetLayoutProps {
  /** Layout mode: list (vertical) or grid (icon grid). Defaults to 'list'. */
  mode?: CometChatActionSheetLayoutMode;
  /** Children (ActionSheet.Item elements). */
  children: ReactNode;
}

/** Context value for ActionSheet. */
export interface CometChatActionSheetContextValue {
  isOpen: boolean;
  onClose: () => void;
  layoutMode: CometChatActionSheetLayoutMode;
}
