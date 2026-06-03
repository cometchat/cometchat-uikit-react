import { CometChatPopoverRoot } from './CometChatPopoverRoot';
import { CometChatPopoverTrigger } from './CometChatPopoverTrigger';
import { CometChatPopoverContent } from './CometChatPopoverContent';

/**
 * CometChatPopover — compound component for floating popover UI.
 *
 * Positions content relative to a trigger element with viewport-aware
 * auto-flipping. Supports click and hover triggers, focus trap,
 * keyboard navigation, and full ARIA attributes.
 *
 * Usage:
 * ```tsx
 * <CometChatPopover.Root placement="bottom" closeOnOutsideClick>
 *   <CometChatPopover.Trigger>
 *     <button>Click me</button>
 *   </CometChatPopover.Trigger>
 *   <CometChatPopover.Content>
 *     <div>Popover content here</div>
 *   </CometChatPopover.Content>
 * </CometChatPopover.Root>
 * ```
 */
export const CometChatPopover = {
  Root: CometChatPopoverRoot,
  Trigger: CometChatPopoverTrigger,
  Content: CometChatPopoverContent,
} as const;
