import type { ReactNode, MouseEvent, KeyboardEvent } from 'react';

/** Props for CometChatListItemRoot */
export interface CometChatListItemRootProps {
  /** Unique identifier for the list item. */
  id?: string;
  /** Whether the item is currently selected/active (applies active styling). */
  isActive?: boolean;
  /** Whether the item is disabled. */
  disabled?: boolean;
  /** Callback when the item is clicked or activated via keyboard (Enter/Space). */
  onItemClick?: (event: MouseEvent<HTMLDivElement> | KeyboardEvent<HTMLDivElement>) => void;
  /** Children (sub-components: LeadingView, Title, Subtitle, TrailingView, MenuView). */
  children: ReactNode;
  /** Optional custom className for the root container. */
  className?: string;
  /** Optional aria-label for the list item. */
  'aria-label'?: string;
  /**
   * Keyboard shortcut key for toggling menu visibility.
   * Set to empty string or null to disable the shortcut.
   * Default is 'M' (case-insensitive).
   * Per WCAG 2.1.4, single-character shortcuts must be configurable.
   */
  menuShortcutKey?: string | null;
  /** Whether to disable the tabindex on the list item (when parent manages focus via roving tabindex). */
  disableTabIndex?: boolean;
  /** Whether the list item is currently focused (managed by parent). */
  isFocused?: boolean;
}

/** Props for CometChatListItemLeadingView */
export interface CometChatListItemLeadingViewProps {
  /** Content to render in the leading area (typically CometChatAvatar). */
  children: ReactNode;
  /** Optional custom className. */
  className?: string;
}

/** Props for CometChatListItemTitle */
export interface CometChatListItemTitleProps {
  /** Title text or custom ReactNode. */
  children: ReactNode;
  /** Optional custom className. */
  className?: string;
}

/** Props for CometChatListItemSubtitle */
export interface CometChatListItemSubtitleProps {
  /** Subtitle content (text or custom ReactNode). */
  children: ReactNode;
  /** Optional custom className. */
  className?: string;
}

/** Props for CometChatListItemTrailingView */
export interface CometChatListItemTrailingViewProps {
  /** Content to render in the trailing area (badge, date, status, etc.). */
  children: ReactNode;
  /** Optional custom className. */
  className?: string;
}

/** Props for CometChatListItemMenuView */
export interface CometChatListItemMenuViewProps {
  /** Menu content revealed on hover/focus (typically a context menu trigger button). */
  children: ReactNode;
  /** Optional custom className. */
  className?: string;
}

/** Context value shared between CometChatListItem sub-components. */
export interface CometChatListItemContextValue {
  /** Whether the item is currently hovered or focused-within. */
  isHovered: boolean;
  /** Whether the item is currently selected/active. */
  isActive: boolean;
  /** Whether the item is disabled. */
  disabled: boolean;
  /** The unique id of the list item. */
  id: string | undefined;
  /** Whether the menu view is currently visible. */
  isMenuVisible: boolean;
  /** Whether a MenuView sub-component is present. When false, TrailingView stays visible on hover. */
  hasMenuView: boolean;
}
