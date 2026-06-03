import React, { useCallback, useMemo } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatThreadHeaderRootProps } from './CometChatThreadHeader.types';
import { CometChatThreadHeaderContext } from './CometChatThreadHeader.context';
import { useCometChatThreadHeader } from './useCometChatThreadHeader';
import { CometChatThreadHeaderTopBar } from './CometChatThreadHeaderTopBar';
import { CometChatThreadHeaderParentBubble } from './CometChatThreadHeaderParentBubble';
import { CometChatThreadHeaderReplyCount } from './CometChatThreadHeaderReplyCount';
import { useLoggedInUser } from '../../hooks/useLoggedInUser';
import './CometChatThreadHeader.css';

/**
 * Get a short text preview of the parent message for aria-label.
 */
function getMessagePreview(message: CometChat.BaseMessage): string {
  const type = message.getType();

  if (type === 'text') {
    const textMsg = message as CometChat.TextMessage;
    const text = textMsg.getText();
    if (text.length > 50) {
      return text.substring(0, 50) + '...';
    }
    return text || 'Text message';
  }

  switch (type) {
    case 'image':
      return 'Photo';
    case 'video':
      return 'Video';
    case 'audio':
      return 'Audio';
    case 'file':
      return 'File';
    default:
      return 'Message';
  }
}

/**
 * CometChatThreadHeaderRoot — container + context provider.
 *
 * Provides thread header context to all sub-components.
 * If no children are provided, renders the default layout:
 * TopBar + ParentBubble + ReplyCount.
 */
export const CometChatThreadHeaderRoot: React.FC<CometChatThreadHeaderRootProps> = ({
  parentMessage,
  onClose,
  onSubtitleClicked,
  onParentDeleted,
  onError,
  hideDate = false,
  hideReplyCount = false,
  separatorDateTimeFormat,
  messageSentAtDateTimeFormat,
  showScrollbar = false,
  className,
  children,
}) => {
  const loggedInUser = useLoggedInUser();

  const { replyCount, senderName, currentParentMessage } = useCometChatThreadHeader({
    parentMessage,
    onError: onError ?? null,
    loggedInUser,
    onParentDeleted,
  });

  // Handle Escape key on the root container
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onClose?.();
      }
    },
    [onClose]
  );

  const contextValue = useMemo(
    () => ({
      parentMessage: currentParentMessage,
      replyCount,
      senderName,
      onClose,
      onSubtitleClicked,
      hideDate,
      hideReplyCount,
      separatorDateTimeFormat,
      messageSentAtDateTimeFormat,
      showScrollbar,
    }),
    [
      currentParentMessage,
      replyCount,
      senderName,
      onClose,
      onSubtitleClicked,
      hideDate,
      hideReplyCount,
      separatorDateTimeFormat,
      messageSentAtDateTimeFormat,
      showScrollbar,
    ]
  );

  // Build aria-label
  const ariaLabel = useMemo(() => {
    const preview = getMessagePreview(currentParentMessage);
    const countDisplay = replyCount > 999 ? '999+' : String(replyCount);
    return `Thread: ${preview}, ${countDisplay} replies`;
  }, [currentParentMessage, replyCount]);

  const rootClasses = [
    'cometchat-thread-header',
    !showScrollbar && 'cometchat-thread-header--hide-scrollbar',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <CometChatThreadHeaderContext.Provider value={contextValue}>
      <div className={rootClasses} role="banner" aria-label={ariaLabel} onKeyDown={handleKeyDown}>
        {children ?? (
          <>
            <CometChatThreadHeaderTopBar />
            <CometChatThreadHeaderParentBubble
              messageSentAtDateTimeFormat={messageSentAtDateTimeFormat}
            />
            <CometChatThreadHeaderReplyCount />
          </>
        )}
      </div>
    </CometChatThreadHeaderContext.Provider>
  );
};

CometChatThreadHeaderRoot.displayName = 'CometChatThreadHeaderRoot';
