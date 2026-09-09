import React from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatUIKit } from '../../CometChatUIKit/CometChatUIKit';
import { CometChatMessageBubbleRenderer } from '../CometChatMessageBubble/CometChatMessageBubbleRenderer';
import { CometChatMessageBubbleWrapper } from '../CometChatMessageBubble/CometChatMessageBubbleWrapper';
import type { CometChatDateFormatConfig } from '../base/CometChatDate/CometChatDate.types';
import type { CometChatTextFormatter } from '../../formatters/CometChatTextFormatter';

/**
 * A single message row.
 *
 * Historically this was `React.memo<...>` with a reference-equality
 * comparator on the `message` prop. That was an easy source of silent bugs:
 * any in-place mutation of a message (receipt update, reaction tweak, etc.)
 * would keep the same reference and the memo would skip the re-render.  * also does not memoize per-row; we match that behavior here.
 *
 * If a future profile reveals scroll jank on long threads, reintroduce
 * memoization per-plugin (image / video / poll) rather than at this layer.
 */
export interface MessageItemProps {
  message: CometChat.BaseMessage;
  group?: CometChat.Group;
  messageAlignment?: number;
  index: number;
  total: number;
  /** Batch position within a multi-attachment batch group. */
  batchPosition?: 'first' | 'middle' | 'last' | 'single';
  onThreadRepliesClick?: (message: CometChat.BaseMessage) => void;
  onAvatarClick?: (user: CometChat.User) => void;
  onDeleteMessage?: (message: CometChat.BaseMessage) => void;
  onFlagMessage?: (message: CometChat.BaseMessage) => void;
  onMarkAsUnread?: (message: CometChat.BaseMessage) => void;
  onEditMessage?: (message: CometChat.BaseMessage) => void;
  onReplyMessage?: (message: CometChat.BaseMessage) => void;
  onReactToMessage?: (message: CometChat.BaseMessage) => void;
  onReactionChipClick?: (messageId: number, emoji: string) => void;
  onReactorClick?: (reaction: CometChat.Reaction, message: CometChat.BaseMessage) => void;
  onMessageInfo?: (message: CometChat.BaseMessage) => void;
  onReplyPreviewClick?: (message: CometChat.BaseMessage) => void;
  showToast?: (text: string) => void;
  disableTruncation?: boolean;
  hideModerationView?: boolean;
  isAgentChat?: boolean;
  textFormatters?: CometChatTextFormatter[];
  hideAvatar?: boolean;
  quickOptionsCount?: number;
  hideReplyOption?: boolean;
  hideReplyInThreadOption?: boolean;
  /** Hide the thread-subscription option. Group chats only regardless. */
  hideThreadSubscriptionOption?: boolean;
  hideEditMessageOption?: boolean;
  hideDeleteMessageOption?: boolean;
  hideCopyMessageOption?: boolean;
  hideReactionOption?: boolean;
  hideMessageInfoOption?: boolean;
  hideFlagMessageOption?: boolean;
  hideMessagePrivatelyOption?: boolean;
  hideTranslateMessageOption?: boolean;
  showMarkAsUnreadOption?: boolean;
  hidePinMessageOption?: boolean;
  hideUnpinMessageOption?: boolean;
  hideSaveMessageOption?: boolean;
  hideUnsaveMessageOption?: boolean;
  optionsLayout?: 'nested' | 'flat';
  onPinMessage?: (message: CometChat.BaseMessage) => void;
  onUnpinMessage?: (message: CometChat.BaseMessage) => void;
  onSaveMessage?: (message: CometChat.BaseMessage) => void;
  onUnsaveMessage?: (message: CometChat.BaseMessage) => void;
  messageSentAtDateTimeFormat?: CometChatDateFormatConfig;
}

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  group,
  messageAlignment,
  index,
  total,
  batchPosition,
  onThreadRepliesClick,
  onAvatarClick,
  onDeleteMessage,
  onFlagMessage,
  onMarkAsUnread,
  onEditMessage,
  onReplyMessage,
  onReactToMessage,
  onReactionChipClick,
  onReactorClick,
  onMessageInfo,
  onReplyPreviewClick,
  showToast,
  disableTruncation,
  hideModerationView,
  isAgentChat,
  textFormatters,
  hideAvatar,
  quickOptionsCount,
  hideReplyOption,
  hideReplyInThreadOption,
  hideThreadSubscriptionOption,
  hideEditMessageOption,
  hideDeleteMessageOption,
  hideCopyMessageOption,
  hideReactionOption,
  hideMessageInfoOption,
  hideFlagMessageOption,
  hideMessagePrivatelyOption,
  hideTranslateMessageOption,
  showMarkAsUnreadOption,
  hidePinMessageOption,
  hideUnpinMessageOption,
  hideSaveMessageOption,
  hideUnsaveMessageOption,
  optionsLayout,
  onPinMessage,
  onUnpinMessage,
  onSaveMessage,
  onUnsaveMessage,
  messageSentAtDateTimeFormat,
}) => {
  const loggedInUser = CometChatUIKit.getLoggedInUser();
  const category = message.getCategory() as string;
  const alignment =
    category === 'action' || category === 'call'
      ? ('center' as const)
      : messageAlignment === 0
        ? ('left' as const)
        : message.getSender().getUid() === loggedInUser?.getUid()
          ? ('right' as const)
          : ('left' as const);

  return (
    <CometChatMessageBubbleWrapper
      alignment={alignment}
      {...(batchPosition &&
        batchPosition !== 'single' && {
          className: `cometchat-message-bubble-wrapper--batch-${batchPosition}`,
        })}
    >
      <CometChatMessageBubbleRenderer
        message={message}
        {...(group !== undefined && { group })}
        {...(messageAlignment !== undefined && { messageAlignment })}
        index={index}
        total={total}
        {...(batchPosition !== undefined && { batchPosition })}
        {...(onThreadRepliesClick !== undefined && { onThreadRepliesClick })}
        {...(onAvatarClick !== undefined && { onAvatarClick })}
        {...(onDeleteMessage !== undefined && { onDeleteMessage })}
        {...(onFlagMessage !== undefined && { onFlagMessage })}
        {...(onMarkAsUnread !== undefined && { onMarkAsUnread })}
        {...(onEditMessage !== undefined && { onEditMessage })}
        {...(onReplyMessage !== undefined && { onReplyMessage })}
        {...(onReactToMessage !== undefined && { onReactToMessage })}
        {...(onReactionChipClick !== undefined && { onReactionChipClick })}
        {...(onReactorClick !== undefined && { onReactorClick })}
        {...(onMessageInfo !== undefined && { onMessageInfo })}
        {...(onReplyPreviewClick !== undefined && { onReplyPreviewClick })}
        {...(showToast !== undefined && { showToast })}
        {...(disableTruncation !== undefined && { disableTruncation })}
        {...(hideAvatar !== undefined && { hideAvatar })}
        {...(quickOptionsCount !== undefined && { quickOptionsCount })}
        {...(hideReplyOption !== undefined && { hideReplyOption })}
        {...(hideReplyInThreadOption !== undefined && { hideReplyInThreadOption })}
        {...(hideThreadSubscriptionOption !== undefined && { hideThreadSubscriptionOption })}
        {...(hideEditMessageOption !== undefined && { hideEditMessageOption })}
        {...(hideDeleteMessageOption !== undefined && { hideDeleteMessageOption })}
        {...(hideCopyMessageOption !== undefined && { hideCopyMessageOption })}
        {...(hideReactionOption !== undefined && { hideReactionOption })}
        {...(hideMessageInfoOption !== undefined && { hideMessageInfoOption })}
        {...(hideFlagMessageOption !== undefined && { hideFlagMessageOption })}
        {...(hideMessagePrivatelyOption !== undefined && { hideMessagePrivatelyOption })}
        {...(hideTranslateMessageOption !== undefined && { hideTranslateMessageOption })}
        {...(showMarkAsUnreadOption !== undefined && { showMarkAsUnreadOption })}
        {...(hidePinMessageOption !== undefined && { hidePinMessageOption })}
        {...(hideUnpinMessageOption !== undefined && { hideUnpinMessageOption })}
        {...(hideSaveMessageOption !== undefined && { hideSaveMessageOption })}
        {...(hideUnsaveMessageOption !== undefined && { hideUnsaveMessageOption })}
        {...(optionsLayout !== undefined && { optionsLayout })}
        {...(onPinMessage !== undefined && { onPinMessage })}
        {...(onUnpinMessage !== undefined && { onUnpinMessage })}
        {...(onSaveMessage !== undefined && { onSaveMessage })}
        {...(onUnsaveMessage !== undefined && { onUnsaveMessage })}
        {...(messageSentAtDateTimeFormat !== undefined && { messageSentAtDateTimeFormat })}
        {...(hideModerationView !== undefined && { hideModerationView })}
        {...(isAgentChat !== undefined && { isAgentChat })}
        {...(textFormatters !== undefined && { textFormatters })}
      />
    </CometChatMessageBubbleWrapper>
  );
};

export default MessageItem;
