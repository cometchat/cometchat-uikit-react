import React from 'react';
import { CometChatThreadHeaderRoot } from './CometChatThreadHeaderRoot';
import { CometChatThreadHeaderTopBar } from './CometChatThreadHeaderTopBar';
import { CometChatThreadHeaderTitle } from './CometChatThreadHeaderTitle';
import { CometChatThreadHeaderSenderName } from './CometChatThreadHeaderSenderName';
import { CometChatThreadHeaderCloseButton } from './CometChatThreadHeaderCloseButton';
import { CometChatThreadHeaderParentBubble } from './CometChatThreadHeaderParentBubble';
import { CometChatThreadHeaderReplyCount } from './CometChatThreadHeaderReplyCount';
import type { CometChatThreadHeaderProps } from './CometChatThreadHeader.types';

/**
 * CometChatThreadHeader — Direct flat API component.
 *
 * Usage (flat API):
 * ```tsx
 * <CometChatThreadHeader
 *   parentMessage={parentMessage}
 *   onClose={() => setThreadOpen(false)}
 *   messageBubbleView={<CustomBubble />}
 * />
 * ```
 *
 * Usage (compound composition via .Root):
 * ```tsx
 * <CometChatThreadHeader.Root parentMessage={parentMessage} onClose={handleClose}>
 *   <CometChatThreadHeader.TopBar>
 *     <CometChatThreadHeader.Title />
 *     <CometChatThreadHeader.SenderName />
 *     <CometChatThreadHeader.CloseButton />
 *   </CometChatThreadHeader.TopBar>
 *   <CometChatThreadHeader.ParentBubble />
 *   <CometChatThreadHeader.ReplyCount />
 * </CometChatThreadHeader.Root>
 * ```
 */
const CometChatThreadHeaderComponent: React.FC<CometChatThreadHeaderProps> = ({
  headerView,
  messageBubbleView,
  subtitleView,
  ...rootProps
}) => {
  const hasConvenienceProps =
    headerView !== undefined || messageBubbleView !== undefined || subtitleView !== undefined;

  if (!hasConvenienceProps) {
    return <CometChatThreadHeaderRoot {...rootProps} />;
  }

  return (
    <CometChatThreadHeaderRoot {...rootProps}>
      {headerView !== undefined ? headerView : <CometChatThreadHeaderTopBar />}
      {subtitleView !== undefined && subtitleView}
      {messageBubbleView !== undefined ? messageBubbleView : <CometChatThreadHeaderParentBubble />}
      <CometChatThreadHeaderReplyCount />
    </CometChatThreadHeaderRoot>
  );
};

CometChatThreadHeaderComponent.displayName = 'CometChatThreadHeader';

export const CometChatThreadHeader = Object.assign(CometChatThreadHeaderComponent, {
  Root: CometChatThreadHeaderRoot,
  TopBar: CometChatThreadHeaderTopBar,
  Title: CometChatThreadHeaderTitle,
  SenderName: CometChatThreadHeaderSenderName,
  CloseButton: CometChatThreadHeaderCloseButton,
  ParentBubble: CometChatThreadHeaderParentBubble,
  ReplyCount: CometChatThreadHeaderReplyCount,
});
