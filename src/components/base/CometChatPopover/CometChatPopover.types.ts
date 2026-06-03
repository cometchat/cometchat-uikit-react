import type { ReactNode, CSSProperties, RefObject } from 'react';

/** Placement of the popover relative to its trigger. */
export type CometChatPopoverPlacement = 'top' | 'right' | 'bottom' | 'left';

/** Props for CometChatPopover.Root. */
export interface CometChatPopoverRootProps {
  /** Whether the popover is open. When provided, component is controlled. */
  isOpen?: boolean;
  /** Callback when the popover requests to close (outside click, Escape). */
  onClose?: () => void;
  /** Callback when the popover opens. */
  onOpen?: () => void;
  /** Preferred placement. Auto-flips if insufficient space. Default: 'bottom'. */
  placement?: CometChatPopoverPlacement;
  /** Whether clicking outside closes the popover. Default: true. */
  closeOnOutsideClick?: boolean;
  /** Show popover on hover instead of click. Default: false. */
  showOnHover?: boolean;
  /** Debounce delay (ms) for hover open/close. Default: 500. */
  debounceOnHover?: number;
  /** Show an arrow pointing to the trigger. Default: false. */
  showArrow?: boolean;
  /** Enable focus trap within popover content. Default: false. */
  trapFocus?: boolean;
  /** Custom ARIA label for the popover content. */
  ariaLabel?: string;
  /** ID of element that labels the popover. */
  ariaLabelledBy?: string;
  /** ID of element that describes the popover. */
  ariaDescribedBy?: string;
  /** Children: CometChatPopover.Trigger and CometChatPopover.Content. */
  children: ReactNode;
  /** Optional custom className. */
  className?: string;
}

/** Props for CometChatPopover.Trigger. */
export interface CometChatPopoverTriggerProps {
  /** Trigger element(s). */
  children: ReactNode;
  /** Optional custom className. */
  className?: string;
}

/** Props for CometChatPopover.Content. */
export interface CometChatPopoverContentProps {
  /** Popover content. */
  children: ReactNode;
  /** Optional custom className. */
  className?: string;
}

/** Context value shared between popover sub-components. */
export interface CometChatPopoverContextValue {
  /** Whether the popover is currently open. */
  isOpen: boolean;
  /** Open the popover. */
  open: () => void;
  /** Close the popover. */
  close: () => void;
  /** Toggle the popover. */
  toggle: () => void;
  /** Whether to show on hover. */
  showOnHover: boolean;
  /** Hover debounce delay. */
  debounceOnHover: number;
  /** Whether to show the arrow. */
  showArrow: boolean;
  /** Whether focus trap is enabled. */
  trapFocus: boolean;
  /** Ref to the trigger element. */
  triggerRef: RefObject<HTMLDivElement | null>;
  /** Ref to the popover content element. */
  popoverRef: RefObject<HTMLDivElement | null>;
  /** Unique ID for ARIA attributes. */
  popoverId: string;
  /** ARIA label. */
  ariaLabel?: string;
  /** ARIA labelledby. */
  ariaLabelledBy?: string;
  /** ARIA describedby. */
  ariaDescribedBy?: string;
  /** Computed placement after viewport-aware adjustment. */
  computedPlacement: CometChatPopoverPlacement;
  /** Computed position styles for the content. */
  positionStyle: CSSProperties;
  /** Whether position has been calculated (prevents flash). */
  isPositioned: boolean;
}
