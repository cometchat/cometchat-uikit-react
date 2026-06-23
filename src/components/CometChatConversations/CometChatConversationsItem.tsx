/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/prefer-nullish-coalescing */
import { CometChat } from '@cometchat/chat-sdk-javascript';
import React, { useCallback, useContext, useState } from 'react';
import { CometChatPluginRegistryContext } from '../../context/PluginRegistryContext';
import { useLoggedInUser } from '../../hooks/useLoggedInUser';
import { CometChatLocalize } from '../../resources/CometChatLocalize/CometChatLocalize';
import { CometChatAvatar } from '../base/CometChatAvatar/CometChatAvatar';
import { CometChatCheckbox } from '../base/CometChatCheckbox/CometChatCheckbox';
import { CometChatContextMenu } from '../base/CometChatContextMenu/CometChatContextMenu';
import type { CometChatContextMenuItemData } from '../base/CometChatContextMenu/CometChatContextMenu.types';
import { CometChatDate } from '../base/CometChatDate';
import { CometChatRadioButton } from '../base/CometChatRadioButton/CometChatRadioButton';
import { useOptionalConversationsContext } from './CometChatConversations.context';
import { sanitizeHtml } from '../../utils/sanitizeHtml';
import './CometChatConversations.css';
import type { CometChatConversationsItemProps } from './CometChatConversations.types';

/**
 * Get the display name for a conversation.
 */
function getConversationName(conversation: CometChat.Conversation): string {
  const conversationWith = conversation.getConversationWith();
  if (!conversationWith) return '';
  if ('getName' in conversationWith) {
    return conversationWith.getName();
  }
  return '';
}

/**
 * Get the avatar URL for a conversation.
 */
function getConversationAvatar(conversation: CometChat.Conversation): string | undefined {
  const conversationWith = conversation.getConversationWith();
  if (!conversationWith) return undefined;
  if (conversation.getConversationType() === 'user') {
    return (conversationWith as CometChat.User).getAvatar?.();
  }
  if (conversation.getConversationType() === 'group') {
    return (conversationWith as CometChat.Group).getIcon?.();
  }
  return undefined;
}

/**
 * Get the user status for a 1:1 conversation.
 * Returns undefined if the user has blocked/been blocked — status should be hidden.
 */
function getUserStatus(conversation: CometChat.Conversation): string | undefined {
  if (conversation.getConversationType() !== 'user') return undefined;
  const user = conversation.getConversationWith() as CometChat.User;
  if (!user) return undefined;
  if (user.getBlockedByMe?.() || user.getHasBlockedMe?.()) return undefined;
  return user.getStatus?.();
}

/**
 * Determine if a call message was a missed call.
 * A missed call is one that was NOT sent by the logged-in user and has a
 * status of unanswered, cancelled, busy, or rejected.
 */
function isMissedCall(message: CometChat.BaseMessage, loggedInUserId: string | undefined): boolean {
  if (!loggedInUserId) return false;

  // Check if the call was initiated by the logged-in user
  const callMsg = message as unknown as {
    getCallInitiator?: () => { getUid: () => string } | undefined;
    getInitiator?: () => { getUid: () => string } | undefined;
    getStatus?: () => string;
  };

  let initiatorUid = '';
  try {
    initiatorUid =
      callMsg.getCallInitiator?.()?.getUid?.() ?? callMsg.getInitiator?.()?.getUid?.() ?? '';
  } catch {
    // fallback
  }

  const sentByMe = !initiatorUid || initiatorUid === loggedInUserId;
  if (sentByMe) return false;

  const callStatus = callMsg.getStatus?.() ?? '';
  const missedStatuses = ['unanswered', 'cancelled', 'busy', 'rejected'];
  return missedStatuses.includes(callStatus);
}

/**
 * Extract the call type from a meeting custom message.
 * Path: data.customData.callType — "audio" or "video"
 * Defaults to "video" if not specified.
 */
function getMeetingCallType(message: CometChat.BaseMessage): 'audio' | 'video' {
  try {
    const customMsg = message as CometChat.CustomMessage;
    const data = customMsg.getData() as Record<string, unknown> | undefined;
    const customData = data?.customData as Record<string, unknown> | undefined;
    const callType = customData?.callType as string | undefined;
    return callType === 'audio' ? 'audio' : 'video';
  } catch {
    return 'video';
  }
}

/**
 * Get the last message preview text.
 *
 * Delegates entirely to the plugin registry's getLastMessagePreview().
 * The plugin registry finds the correct plugin for the message type and
 * returns a plain-text preview string.
 *
 * For text messages, the raw message text is returned so that formatters
 * can be applied downstream (in the rendering layer) to produce styled HTML.
 */
function getLastMessageText(
  conversation: CometChat.Conversation,
  loggedInUserId: string | undefined,
  pluginRegistry?: {
    getLastMessagePreview: (
      message: CometChat.BaseMessage,
      loggedInUser: CometChat.User,
      t?: (key: string) => string
    ) => string | undefined;
    findPlugin: (message: CometChat.BaseMessage) => unknown;
  } | null,
  loggedInUser?: CometChat.User | null
): { senderPrefix: string | null; text: string; isHtml: boolean } {
  const lastMessage = conversation.getLastMessage();
  const t = (key: string, fallback: string) =>
    CometChatLocalize.getSharedInstance()?.t(key) ?? fallback;
  if (!lastMessage)
    return {
      senderPrefix: null,
      text: t('conversation_start', 'Click to start conversation'),
      isHtml: false,
    };

  if (lastMessage.getDeletedAt?.())
    return {
      senderPrefix: null,
      text: t('conversation_message_deleted', 'Message is deleted'),
      isHtml: false,
    };

  const category = lastMessage.getCategory?.() ?? '';
  const isGroup = conversation.getConversationType() === 'group';

  // Helper: get sender prefix for group conversations
  const getSenderPrefix = (): string | null => {
    if (!isGroup) return null;
    if (category === 'action') return null;
    const type = lastMessage.getType?.() ?? '';
    if (category === 'custom' && type === 'meeting') return null;
    if (category === 'call') return null;
    const sender = lastMessage.getSender?.();
    if (!sender) return null;
    return sender.getUid() === loggedInUserId
      ? t('conversation_subtitle_you_message', 'You')
      : sender.getName();
  };

  const senderPrefix = getSenderPrefix();

  // --- Plugin delegation ---
  // Delegate to the plugin registry for ALL message types.
  if (pluginRegistry && loggedInUser) {
    const tKey = (key: string) => CometChatLocalize.getSharedInstance()?.t(key) ?? key;
    const preview = pluginRegistry.getLastMessagePreview(lastMessage, loggedInUser, tKey);
    if (preview !== undefined && preview !== '') {
      return { senderPrefix, text: preview, isHtml: false };
    }
  }

  // --- Fallback (no plugin registry or plugin returned empty) ---
  // This handles edge cases where the plugin registry is not available.
  if (lastMessage.getDeletedAt?.()) {
    return {
      senderPrefix: null,
      text: t('conversation_message_deleted', 'Message is deleted'),
      isHtml: false,
    };
  }

  const type = lastMessage.getType();

  if (category === 'message') {
    switch (type) {
      case 'text':
        return {
          senderPrefix,
          text: (lastMessage as CometChat.TextMessage).getText?.() ?? '',
          isHtml: false,
        };
      case 'image':
        return { senderPrefix, text: t('conversation_subtitle_image', 'Image'), isHtml: false };
      case 'video':
        return { senderPrefix, text: t('conversation_subtitle_video', 'Video'), isHtml: false };
      case 'audio':
        return { senderPrefix, text: t('conversation_subtitle_audio', 'Audio'), isHtml: false };
      case 'file':
        return { senderPrefix, text: t('conversation_subtitle_file', 'File'), isHtml: false };
      default:
        return { senderPrefix, text: type, isHtml: false };
    }
  }

  if (category === 'call') {
    const iconName = getCallIconName(lastMessage, loggedInUserId);
    return {
      senderPrefix,
      text: iconName.includes('video')
        ? t('conversation_subtitle_video_call', 'Video call')
        : t('conversation_subtitle_voice_call', 'Voice call'),
      isHtml: false,
    };
  }

  if (category === 'custom') {
    switch (type) {
      case 'extension_poll':
        return { senderPrefix, text: t('conversation_subtitle_poll', 'Poll'), isHtml: false };
      case 'extension_sticker':
        return { senderPrefix, text: t('conversation_subtitle_sticker', 'Sticker'), isHtml: false };
      case 'extension_whiteboard':
        return {
          senderPrefix,
          text: t('conversation_subtitle_collaborative_whiteboard', 'Collaborative Whiteboard'),
          isHtml: false,
        };
      case 'extension_document':
        return {
          senderPrefix,
          text: t('conversation_subtitle_collaborative_document', 'Collaborative Document'),
          isHtml: false,
        };
      case 'meeting': {
        const customMsg = lastMessage as CometChat.CustomMessage;
        const convText = customMsg.getConversationText?.();
        if (convText) return { senderPrefix, text: convText, isHtml: false };
        const callType = getMeetingCallType(lastMessage);
        const sender = lastMessage.getSender?.();
        const isSentByMe = sender?.getUid() === loggedInUserId;
        const initiator = isSentByMe
          ? t(
              'conversation_subtitle_group_video_call_initated_self',
              'You have initiated a group call'
            )
          : `${String(sender?.getName() ?? '')} ${t(callType === 'audio' ? 'conversation_subtitle_group_voice_call_initated' : 'conversation_subtitle_group_video_call_initated', 'initiated a call')}`;
        return { senderPrefix: null, text: initiator, isHtml: false };
      }
      default: {
        const customMsg = lastMessage as CometChat.CustomMessage;
        const convText = customMsg.getConversationText?.();
        return { senderPrefix, text: convText ?? type, isHtml: false };
      }
    }
  }

  // Action messages — construct localized text from action parts
  if (category === 'action') {
    const actionMsg = lastMessage as CometChat.Action;
    const actionType: string =
      (actionMsg as unknown as { getAction?: () => string }).getAction?.() ?? '';
    const actionBy: unknown = (
      actionMsg as unknown as { getActionBy?: () => unknown }
    ).getActionBy?.();
    const actionOn: unknown = (
      actionMsg as unknown as { getActionOn?: () => unknown }
    ).getActionOn?.();
    const byName: string =
      actionBy && typeof (actionBy as { getName?: () => string }).getName === 'function'
        ? (actionBy as { getName: () => string }).getName()
        : '';
    const onName: string =
      actionOn && typeof (actionOn as { getName?: () => string }).getName === 'function'
        ? (actionOn as { getName: () => string }).getName()
        : '';

    let verb = '';
    switch (actionType) {
      case 'added':
        verb = t('conversation_subtitle_added', 'added');
        break;
      case 'joined':
        verb = t('conversation_subtitle_joined', 'joined');
        break;
      case 'left':
        verb = t('conversation_subtitle_left', 'left');
        break;
      case 'kicked':
        verb = t('conversation_subtitle_kicked', 'kicked');
        break;
      case 'banned':
        verb = t('conversation_subtitle_banned', 'banned');
        break;
      case 'unbanned':
        verb = t('conversation_subtitle_unbanned', 'unbanned');
        break;
      default:
        return { senderPrefix: null, text: actionMsg.getMessage?.() ?? '', isHtml: false };
    }

    const text = `${byName} ${verb}${onName ? ` ${onName}` : ''}`;
    return { senderPrefix: null, text, isHtml: false };
  }

  // Interactive messages
  if (category === 'interactive') {
    return {
      senderPrefix,
      text: t('message_type_not_supported', 'Message type not supported'),
      isHtml: false,
    };
  }

  return { senderPrefix, text: type || '', isHtml: false };
}

/**
 * Get the icon name for a call message based on whether it was missed/outgoing and audio/video.
 */
function getCallIconName(
  message: CometChat.BaseMessage,
  loggedInUserId: string | undefined
): string {
  const type = message.getType();
  const missed = isMissedCall(message, loggedInUserId);

  if (missed) {
    return type === 'video' ? 'incoming-video-call' : 'incoming-audio-call';
  }
  return type === 'video' ? 'outgoing-video-call' : 'outgoing-audio-call';
}

/**
 * Get the icon class suffix for the last message type.
 * Returns empty string if no icon should be shown.
 */
function getLastMessageIconName(
  conversation: CometChat.Conversation,
  loggedInUserId: string | undefined
): string {
  const lastMessage = conversation.getLastMessage();
  if (!lastMessage) return '';

  if (lastMessage.getDeletedAt?.()) return 'deleted';

  const category = lastMessage.getCategory?.() ?? '';
  const type = lastMessage.getType();

  // Call messages
  if (category === 'call') {
    return getCallIconName(lastMessage, loggedInUserId);
  }

  if (category === 'message') {
    switch (type) {
      case 'text':
        return '';
      case 'image':
        return 'image';
      case 'video':
        return 'video';
      case 'audio':
        return 'audio';
      case 'file':
        return 'file';
      default:
        return 'unsupported';
    }
  }

  if (category === 'custom') {
    switch (type) {
      case 'extension_poll':
        return 'poll';
      case 'extension_sticker':
        return 'sticker';
      case 'extension_whiteboard':
        return 'collaborative-whiteboard';
      case 'extension_document':
        return 'collaborative-document';
      case 'meeting': {
        const callType = getMeetingCallType(lastMessage);
        return callType === 'audio' ? 'outgoing-audio-call' : 'outgoing-video-call';
      }
      default:
        return 'unsupported';
    }
  }

  if (category === 'interactive') {
    return 'unsupported';
  }

  return '';
}

/**
 * Get the timestamp of the last message.
 */
function getLastMessageTimestamp(conversation: CometChat.Conversation): number | undefined {
  const lastMessage = conversation.getLastMessage();
  if (!lastMessage) return undefined;
  return lastMessage.getSentAt();
}

/**
 * Determine the receipt status of the last message.
 * Only applicable when the last message was sent by the logged-in user.
 */
type ReceiptStatus = 'wait' | 'sent' | 'delivered' | 'read' | 'error' | null;

function getReceiptStatus(
  conversation: CometChat.Conversation,
  loggedInUserId?: string
): ReceiptStatus {
  const lastMessage = conversation.getLastMessage();
  if (!lastMessage) return null;

  // Action, call, and interactive messages should never show receipts
  const category = lastMessage.getCategory?.() ?? '';
  if (category === 'action' || category === 'call' || category === 'interactive') return null;

  // Custom messages of type 'meeting' (group calls) should not show receipts
  const type = lastMessage.getType?.() ?? '';
  if (category === 'custom' && type === 'meeting') return null;

  // Only show receipts for messages sent by the logged-in user
  const sender = lastMessage.getSender?.();
  if (!sender || !loggedInUserId) return null;
  if (sender.getUid() !== loggedInUserId) return null;

  // Check receipt status.
  if (lastMessage.getReadAt?.()) return 'read';
  if (lastMessage.getDeliveredAt?.()) return 'delivered';
  if (lastMessage.getSentAt?.()) return 'sent';

  return 'wait';
}

/**
 * CometChatConversationsItem — Individual conversation item.
 *
 * Displays avatar, name, last message preview, timestamp, and unread badge.
 * Memoized to prevent unnecessary re-renders in large lists.
 */
function CometChatConversationsItemInner({
  conversation,
  hideUserStatus: hideUserStatusProp,
  hideUnreadCount: hideUnreadCountProp,
  hideReceipts: hideReceiptsProp,
  hideDeleteButton = false,
  isActive: isActiveProp,
  options: optionsProp,
  leadingView,
  titleView,
  subtitleView,
  trailingView,
}: CometChatConversationsItemProps) {
  const ctx = useOptionalConversationsContext();
  const pluginRegistry = useContext(CometChatPluginRegistryContext);
  const chatStateUser = useLoggedInUser();

  // Build a loggedInUser for plugin delegation.
  // Prefer the full User object from useLoggedInUser(); fall back to a minimal
  // object built from the conversations context's loggedInUserId.
  const loggedInUserId = ctx?.loggedInUserId ?? undefined;
  const loggedInUser =
    chatStateUser ??
    (loggedInUserId
      ? ({ getUid: () => loggedInUserId, getName: () => '' } as unknown as CometChat.User)
      : null);

  const convId = conversation.getConversationId();
  const name = getConversationName(conversation);
  const avatar = getConversationAvatar(conversation);
  const userStatus = getUserStatus(conversation);
  const lastMessageResult = getLastMessageText(
    conversation,
    ctx?.loggedInUserId ?? undefined,
    pluginRegistry,
    loggedInUser
  );
  const lastMessageIconName = getLastMessageIconName(
    conversation,
    ctx?.loggedInUserId ?? undefined
  );
  const lastMessageTimestamp = getLastMessageTimestamp(conversation);
  const unreadCount = conversation.getUnreadMessageCount();

  const typingConvWith = conversation.getConversationWith();
  const typingKey =
    'getGuid' in typingConvWith ? typingConvWith.getGuid() : typingConvWith.getUid();
  const typingIndicator = ctx?.typingIndicatorMap?.get(typingKey);

  const isActive = isActiveProp ?? (ctx ? ctx.activeConversationId === convId : false);
  const isSelected = ctx ? ctx.selectedConversationIds.includes(convId) : false;
  const hideStatus = hideUserStatusProp ?? ctx?.hideUserStatus ?? false;
  const hideUnread = hideUnreadCountProp ?? ctx?.hideUnreadCount ?? false;
  const hideReceipts = hideReceiptsProp ?? ctx?.hideReceipts ?? false;
  const effectiveHideDeleteButton = hideDeleteButton || (ctx?.hideDeleteConversation ?? false);

  const options = optionsProp ?? ctx?.options;

  const convWith = conversation.getConversationWith();
  const isAgentChat = convWith instanceof CometChat.User && convWith.getRole() === '@agentic';

  // Determine group type for the indicator icon
  const hideGroupType = ctx?.hideGroupType ?? false;
  const groupType =
    conversation.getConversationType() === 'group'
      ? ((convWith as CometChat.Group).getType?.() ?? '')
      : '';

  const handleDeleteClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      ctx?.setConversationToBeDeleted(conversation);
    },
    [ctx, conversation]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      ctx?.handleItemClick(conversation, { shiftKey: e.shiftKey });
    },
    [ctx, conversation]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        ctx?.handleItemClick(conversation, { shiftKey: e.shiftKey });
      }
    },
    [ctx, conversation]
  );

  const handleCheckboxChange = useCallback(
    (event: { checked: boolean; shiftKey?: boolean | undefined }) => {
      ctx?.handleItemClick(conversation, { shiftKey: event.shiftKey ?? false });
    },
    [ctx, conversation]
  );

  const handleRadioChange = useCallback(() => {
    ctx?.handleItemClick(conversation);
  }, [ctx, conversation]);

  const classNames = [
    'cometchat-conversations__item',
    isActive ? 'cometchat-conversations__item--active' : '',
    isSelected ? 'cometchat-conversations__item--selected' : '',
    effectiveHideDeleteButton && !options ? 'cometchat-conversations__item--subtle-hover' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const [isItemHovered, setIsItemHovered] = useState(false);

  return (
    <div
      className={classNames}
      role="option"
      aria-selected={isSelected || isActive}
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => {
        setIsItemHovered(true);
      }}
      onMouseLeave={() => {
        setIsItemHovered(false);
      }}
    >
      {/* Leading: Avatar + Status Indicator */}
      {leadingView ?? (
        <div className={'cometchat-conversations__item-avatar'}>
          <CometChatAvatar.Root name={name} image={avatar ?? ''} size="large">
            <CometChatAvatar.Image />
            <CometChatAvatar.Initials />
            {!hideStatus && userStatus === 'online' && (
              <CometChatAvatar.StatusIndicator status="online" />
            )}
          </CometChatAvatar.Root>
          {!hideGroupType && (groupType === 'private' || groupType === 'password') && (
            <span
              className={`cometchat-conversations__item-group-type cometchat-conversations__item-group-type--${groupType}`}
              aria-label={groupType === 'private' ? 'Private group' : 'Password protected group'}
            >
              <span className="cometchat-conversations__item-group-type-icon" />
            </span>
          )}
        </div>
      )}

      {/* Body: Title + Subtitle (last message preview) */}
      <div className={'cometchat-conversations__item-body'}>
        {titleView ?? (
          <span
            className={[
              'cometchat-conversations__item-title',
              unreadCount > 0 ? 'cometchat-conversations__item-title--unread' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {name}
          </span>
        )}
        {subtitleView ?? (
          <div className={'cometchat-conversations__item-subtitle'}>
            {typingIndicator ? (
              <span className={'cometchat-conversations__item-subtitle-typing'}>
                {conversation.getConversationType() === 'group'
                  ? `${typingIndicator.getSender()?.getName() ?? ''}: ${CometChatLocalize.getSharedInstance()?.t('conversation_subtitle_typing') ?? 'typing...'}`
                  : (CometChatLocalize.getSharedInstance()?.t('conversation_subtitle_typing') ??
                    'typing...')}
              </span>
            ) : isAgentChat ? (
              <span className={'cometchat-conversations__item-subtitle-text'}>
                {CometChatLocalize.getSharedInstance()?.t('conversation_start') ??
                  'Click to start conversation'}
              </span>
            ) : (
              <>
                {/* Thread icon — shown when last message is a reply in a thread */}
                {(() => {
                  const lastMessage = conversation.getLastMessage();
                  if (!lastMessage) return null;
                  const parentId = lastMessage.getParentMessageId?.();
                  if (!parentId) return null;
                  return (
                    <span
                      className={'cometchat-conversations__item-subtitle-icon--thread'}
                      aria-label={
                        CometChatLocalize.getSharedInstance()?.t('accessibility_thread_reply') ??
                        'Thread reply'
                      }
                    />
                  );
                })()}
                {!hideReceipts &&
                  (() => {
                    const receipt = getReceiptStatus(
                      conversation,
                      ctx?.loggedInUserId ?? undefined
                    );
                    if (!receipt) return null;
                    const receiptClass = `cometchat-conversations__item-receipt--${receipt}`;
                    return (
                      <span
                        className={`cometchat-conversations__item-receipt ${receiptClass}`}
                        aria-label={(
                          CometChatLocalize.getSharedInstance()?.t(
                            'accessibility_message_receipt'
                          ) ?? 'Message {status}'
                        ).replace('{status}', receipt)}
                      />
                    );
                  })()}
                {(() => {
                  const lastMessage = conversation.getLastMessage();
                  const isGroup = conversation.getConversationType() !== 'user';
                  if (!isGroup || !lastMessage) return null;
                  const category = lastMessage.getCategory?.() ?? '';
                  const type = lastMessage.getType?.() ?? '';
                  // Don't show prefix for action messages or call messages
                  if (category === 'action' || category === 'call') return null;
                  if (category === 'custom' && type === 'meeting') return null;
                  const sender = lastMessage.getSender?.();
                  if (!sender) return null;
                  const isFromMe = sender.getUid() === ctx?.loggedInUserId;
                  const senderName = isFromMe
                    ? (CometChatLocalize.getSharedInstance()?.t(
                        'conversation_subtitle_you_message'
                      ) ?? 'You')
                    : sender.getName();
                  return (
                    <span className={'cometchat-conversations__item-subtitle-sender'}>
                      {senderName}:
                    </span>
                  );
                })()}
                {lastMessageIconName && (
                  <span
                    className={[
                      'cometchat-conversations__item-subtitle-icon',
                      `cometchat-conversations__item-subtitle-icon--${lastMessageIconName}`,
                      lastMessageIconName === 'unsupported'
                        ? `cometchat-conversations__item-subtitle-icon--${String(conversation.getLastMessage()?.getType() ?? '')}`
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    aria-hidden="true"
                  />
                )}
                <span
                  className={[
                    'cometchat-conversations__item-subtitle-text',
                    unreadCount > 0 ? 'cometchat-conversations__item-subtitle-text--unread' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(lastMessageResult.text),
                  }}
                />
              </>
            )}
          </div>
        )}
      </div>

      {/* Trailing: Timestamp + Unread Badge or custom */}
      {trailingView !== undefined ? (
        <div className={'cometchat-conversations__item-trailing'}>{trailingView}</div>
      ) : isAgentChat ? null : (
        <div className={'cometchat-conversations__item-tail'}>
          {/* Default trailing view: time + badge (hidden on hover when menu is present) */}
          <div className={'cometchat-conversations__item-trailing'}>
            {lastMessageTimestamp && (
              <CometChatDate
                timestamp={lastMessageTimestamp}
                variant="caption2"
                formatConfig={{
                  today: 'hh:mm A',
                  yesterday:
                    CometChatLocalize.getSharedInstance()?.t('date_yesterday') ?? 'Yesterday',
                  otherDays: 'DD/MM/YYYY',
                }}
              />
            )}
            {!hideUnread && unreadCount > 0 && (
              <span
                className={'cometchat-conversations__item-unread-badge'}
                aria-label={(
                  CometChatLocalize.getSharedInstance()?.t('accessibility_unread_messages') ??
                  '{count} unread messages'
                ).replace('{count}', String(unreadCount))}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          {(options || !effectiveHideDeleteButton) && (
            <div className={'cometchat-conversations__item-menu-view'}>
              {!effectiveHideDeleteButton && (
                <button
                  type="button"
                  className={'cometchat-conversations__item-delete-button'}
                  onClick={handleDeleteClick}
                  onKeyDown={e => {
                    e.stopPropagation();
                  }}
                  aria-label={
                    CometChatLocalize.getSharedInstance()?.t('conversation_delete_icon_hover') ??
                    'Delete conversation'
                  }
                >
                  <span className={'cometchat-conversations__item-delete-icon'} />
                </button>
              )}
              {options && (
                <div
                  className={'cometchat-conversations__item-options'}
                  onClick={e => {
                    e.stopPropagation();
                  }}
                  onKeyDown={e => {
                    e.stopPropagation();
                  }}
                  role="presentation"
                >
                  <CometChatContextMenu
                    key={isItemHovered ? 'hovered' : 'not-hovered'}
                    items={options(conversation).map(
                      (opt): CometChatContextMenuItemData => ({
                        id: opt.id,
                        title: opt.title,
                        ...(opt.iconURL ? { iconURL: opt.iconURL } : {}),
                        onClick: () => {
                          opt.onClick(conversation);
                        },
                      })
                    )}
                    topMenuSize={0}
                    placement="left"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Selection controls */}
      {ctx?.selectionMode === 'multiple' && trailingView === undefined && (
        <div
          className={'cometchat-conversations__item-selection'}
          onClick={e => {
            e.stopPropagation();
          }}
          onKeyDown={e => {
            e.stopPropagation();
          }}
          role="presentation"
        >
          <CometChatCheckbox
            checked={isSelected}
            onChange={handleCheckboxChange}
            aria-label={(
              CometChatLocalize.getSharedInstance()?.t('accessibility_select_item') ??
              'Select {name}'
            ).replace('{name}', name)}
          />
        </div>
      )}
      {ctx?.selectionMode === 'single' && trailingView === undefined && (
        <div
          className={'cometchat-conversations__item-selection'}
          onClick={e => {
            e.stopPropagation();
          }}
          onKeyDown={e => {
            e.stopPropagation();
          }}
          role="presentation"
        >
          <CometChatRadioButton
            name="cometchat-conversations-selection"
            checked={isSelected}
            onChange={handleRadioChange}
            ariaLabel={(
              CometChatLocalize.getSharedInstance()?.t('accessibility_select_item') ??
              'Select {name}'
            ).replace('{name}', name)}
          />
        </div>
      )}
    </div>
  );
}

export const CometChatConversationsItem: React.FC<CometChatConversationsItemProps> =
  CometChatConversationsItemInner;

(CometChatConversationsItem as { displayName?: string }).displayName =
  'CometChatConversations.Item';
