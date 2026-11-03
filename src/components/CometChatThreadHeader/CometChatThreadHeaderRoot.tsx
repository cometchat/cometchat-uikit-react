import React, { useCallback, useMemo } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatThreadHeaderRootProps } from './CometChatThreadHeader.types';
import { CometChatThreadHeaderContext } from './CometChatThreadHeader.context';
import { useCometChatThreadHeader } from './useCometChatThreadHeader';
import { CometChatThreadHeaderTopBar } from './CometChatThreadHeaderTopBar';
import { CometChatThreadHeaderParentBubble } from './CometChatThreadHeaderParentBubble';
import { CometChatThreadHeaderReplyCount } from './CometChatThreadHeaderReplyCount';
import { useLoggedInUser } from '../../hooks/useLoggedInUser';
import { useLocale } from '../../context/locale/LocaleContext';
import './CometChatThreadHeader.css';
import { fillTemplate } from '../../utils/fillTemplate';

/**
 * Get a short text preview of the parent message for aria-label.
 */
function getMessagePreview(
  message: CometChat.BaseMessage,
  getLocalizedString: (key: string) => string
): string {
  const type = message.getType();

  if (type === 'text') {
    const textMsg = message as CometChat.TextMessage;
    const text = textMsg.getText();
    if (text.length > 50) {
      return text.substring(0, 50) + '...';
    }
    return text || getLocalizedString('text_message_fallback');
  }

  switch (type) {
    case 'image':
      return getLocalizedString('conversation_subtitle_image');
    case 'video':
      return getLocalizedString('conversation_subtitle_video');
    case 'audio':
      return getLocalizedString('conversation_subtitle_audio');
    case 'file':
      return getLocalizedString('conversation_subtitle_file');
    default:
      return getLocalizedString('accessibility_message');
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
  hideReceipts,
  hideDate = false,
  hideReplyCount = false,
  hideThreadSubscriptionToggle = false,
  onThreadSubscriptionChange,
  separatorDateTimeFormat,
  messageSentAtDateTimeFormat,
  showScrollbar = false,
  textFormatters,
  className,
  children,
}) => {
  const loggedInUser = useLoggedInUser();
  const { getLocalizedString } = useLocale();

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
      hideReceipts,
      hideDate,
      hideReplyCount,
      hideThreadSubscriptionToggle,
      onThreadSubscriptionChange,
      separatorDateTimeFormat,
      messageSentAtDateTimeFormat,
      showScrollbar,
      textFormatters,
    }),
    [
      currentParentMessage,
      replyCount,
      senderName,
      onClose,
      onSubtitleClicked,
      hideReceipts,
      hideDate,
      hideReplyCount,
      hideThreadSubscriptionToggle,
      onThreadSubscriptionChange,
      separatorDateTimeFormat,
      messageSentAtDateTimeFormat,
      showScrollbar,
      textFormatters,
    ]
  );

  // Build aria-label
  const ariaLabel = useMemo(() => {
    const preview = getMessagePreview(currentParentMessage, getLocalizedString);
    const countDisplay = replyCount > 999 ? '999+' : String(replyCount);
    return fillTemplate(getLocalizedString('accessibility_thread_header'), { preview, count: countDisplay });
  }, [currentParentMessage, replyCount, getLocalizedString]);

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
