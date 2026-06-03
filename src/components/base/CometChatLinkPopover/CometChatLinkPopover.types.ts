import type { HTMLAttributes } from 'react';

/** Data emitted on edit action. */
export interface CometChatLinkPopoverData {
  /** The link URL. */
  url: string;
  /** The link display text. */
  text: string;
}

/** Props for CometChatLinkPopover. */
export interface CometChatLinkPopoverProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children'
> {
  /** The link display text shown as the popover title. */
  text: string;
  /** The link URL displayed and opened on click. */
  url: string;
  /** Position of the popover (top/left in px, fixed relative to viewport). */
  position: { top: number; left: number };
  /** Callback when the Edit button is clicked. Receives { url, text }. */
  onEdit: (data: CometChatLinkPopoverData) => void;
  /** Callback when the Remove button is clicked. */
  onRemove: () => void;
  /** Callback when the popover should close (Escape, Tab, outside click, close button). */
  onClose: () => void;
  /** Optional custom className. */
  className?: string;
}
