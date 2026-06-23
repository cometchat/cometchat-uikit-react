import React from 'react';
import { CometChatPopoverRoot } from './CometChatPopoverRoot';
import { CometChatPopoverTrigger } from './CometChatPopoverTrigger';
import { CometChatPopoverContent } from './CometChatPopoverContent';
import type { CometChatPopoverRootProps } from './CometChatPopover.types';

/**
 * Flat API props for CometChatPopover.
 *
 * Note: Popover inherently requires composed children (Trigger + Content),
 * so the flat API accepts `trigger` and `content` as render props.
 */
export interface CometChatPopoverProps extends Omit<CometChatPopoverRootProps, 'children'> {
  /** The trigger element that toggles the popover. */
  trigger: React.ReactNode;
  /** The popover content displayed when open. */
  content: React.ReactNode;
}

/**
 * CometChatPopover — Flat API component.
 *
 * Usage (flat):
 * ```tsx
 * <CometChatPopover
 *   placement="bottom"
 *   closeOnOutsideClick
 *   trigger={<button>Click me</button>}
 *   content={<div>Popover content here</div>}
 * />
 * ```
 *
 * Usage (compound):
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
const CometChatPopoverComponent: React.FC<CometChatPopoverProps> = ({
  trigger,
  content,
  ...rootProps
}) => {
  return (
    <CometChatPopoverRoot {...rootProps}>
      <CometChatPopoverTrigger>{trigger}</CometChatPopoverTrigger>
      <CometChatPopoverContent>{content}</CometChatPopoverContent>
    </CometChatPopoverRoot>
  );
};

CometChatPopoverComponent.displayName = 'CometChatPopover';

export const CometChatPopover = Object.assign(CometChatPopoverComponent, {
  Root: CometChatPopoverRoot,
  Trigger: CometChatPopoverTrigger,
  Content: CometChatPopoverContent,
});
