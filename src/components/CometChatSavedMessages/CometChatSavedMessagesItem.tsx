import React from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatListItem } from '../base/CometChatListItem';
import { CometChatAvatar } from '../base/CometChatAvatar';
import { CometChatDate } from '../base/CometChatDate';
import { useLoggedInUser } from '../../hooks/useLoggedInUser';
import { useLocale } from '../../context/locale/LocaleContext';
import { isThreadReply } from '../../utils/pinSaveUtils';
import { getMessageSubtitle } from '../../utils/messageSubtitle';
import { applyDisplayFormatters } from '../../formatters/applyDisplayFormatters';
import { sanitizeHtml } from '../../utils/sanitizeHtml';
import type { CometChatTextFormatter } from '../../formatters/CometChatTextFormatter';
import threadIcon from '../../assets/conversations_thread.svg';
import { localizeWithFallback } from '../../utils/localizeWithFallback';

export interface CometChatSavedMessagesItemProps {
  message: CometChat.BaseMessage;
  onClick: (message: CometChat.BaseMessage) => void;
  onUnsave: (message: CometChat.BaseMessage) => void;
  /** Drop the row's only action, leaving it read-only. */
  hideUnsaveOption?: boolean;
  /** Custom display formatters applied to the message preview. */
  textFormatters?: CometChatTextFormatter[];
}

/**
 * Which conversation does this message belong to, from the viewer's side?
 *
 * For a message we sent, that's the receiver. For one we received, it's the
 * sender. Reading `getReceiver()` alone would label our own messages with our
 * own name.
 */
function resolveConversationEntity(
  message: CometChat.BaseMessage,
  loggedInUserUid: string | undefined
): { name: string; avatar: string } {
  // `getReceiver()` is not guaranteed to be hydrated on a cross-conversation
  // read (design doc §6.4 anticipates a cache miss), so every access is guarded
  // and falls back to the raw id. A row must render regardless — never blank.
  const probe = message as unknown as {
    getReceiverType?: () => string;
    getReceiverId?: () => string;
    getReceiver?: () => CometChat.User | CometChat.Group | undefined;
  };
  const receiverType = probe.getReceiverType?.() ?? '';
  const receiverId = probe.getReceiverId?.() ?? '';
  const receiver = probe.getReceiver?.();
  const sender = message.getSender();

  const nameOf = (entity: CometChat.User | CometChat.Group | undefined): string | undefined =>
    typeof (entity as { getName?: () => string } | undefined)?.getName === 'function'
      ? (entity as { getName: () => string }).getName()
      : undefined;

  // Groups are the conversation, whoever spoke.
  if (receiverType === 'group') {
    const group = receiver as CometChat.Group | undefined;
    return {
      name: nameOf(group) ?? receiverId,
      avatar: typeof group?.getIcon === 'function' ? group.getIcon() : '',
    };
  }

  // In a 1-1 the conversation is the OTHER party: the receiver for a message we
  // sent, the sender for one we received. Reading the receiver unconditionally
  // would label our own messages with our own name.
  if (sender.getUid() === loggedInUserUid) {
    const user = receiver as CometChat.User | undefined;
    return {
      name: nameOf(user) ?? receiverId,
      avatar: typeof user?.getAvatar === 'function' ? user.getAvatar() : '',
    };
  }

  return { name: sender.getName(), avatar: sender.getAvatar() };
}

/**
 * CometChatSavedMessagesItem — one saved message, rendered as a conversation row.
 *
 * Deliberately a list row rather than a chat bubble: the Saved screen sits over
 * the conversation list, so it reads as "which chat, who said it, what they
 * said". Built on CometChatListItem, the same primitive the other lists use.
 */
export const CometChatSavedMessagesItem: React.FC<CometChatSavedMessagesItemProps> = ({
  message,
  onClick,
  onUnsave,
  hideUnsaveOption = false,
  textFormatters,
}) => {
  const { getLocalizedString } = useLocale();

  const loc = (key: string, fallback: string): string =>
    localizeWithFallback(getLocalizedString, key, fallback);
  const loggedInUser = useLoggedInUser();

  const { name, avatar } = resolveConversationEntity(message, loggedInUser?.getUid());

  const sender = message.getSender();
  const senderLabel =
    sender.getUid() === loggedInUser?.getUid()
      ? loc('conversation_subtitle_you_message', 'You')
      : sender.getName();

  // Same preview builder search uses, so rich text (bold/italic/code/mentions)
  // and the media-type icon render here exactly as they do there. Custom display
  // formatters are then applied on top (as Search does at its sink), before
  // sanitizing. The sender prefix is rendered as its own element below rather
  // than baked into the HTML.
  const previewHtml = sanitizeHtml(
    applyDisplayFormatters(
      getMessageSubtitle(message, {
        loggedInUserId: loggedInUser?.getUid(),
        iconClassPrefix: 'cometchat-saved-messages__item-subtitle-icon',
        t: getLocalizedString,
      }),
      textFormatters
    )
  );

  return (
    <CometChatListItem
      id={String(message.getId())}
      onItemClick={() => {
        onClick(message);
      }}
      className="cometchat-saved-messages__item"
      leadingView={
        <CometChatAvatar.Root name={name} image={avatar} size="large">
          <CometChatAvatar.Image />
          <CometChatAvatar.Initials />
        </CometChatAvatar.Root>
      }
      title={name}
      subtitle={
        <span className={'cometchat-saved-messages__item-subtitle'}>
          {isThreadReply(message) && (
            <img
              className={'cometchat-saved-messages__item-thread-icon'}
              src={threadIcon}
              alt=""
              aria-hidden="true"
              width={12}
              height={12}
            />
          )}
          <span className={'cometchat-saved-messages__item-sender'}>{senderLabel}:</span>
          <span
            className={'cometchat-saved-messages__item-preview'}
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </span>
      }
      trailingView={
        <CometChatDate
          timestamp={message.getSentAt()}
          variant="caption2"
          formatConfig={{
            today: 'hh:mm A',
            yesterday: loc('date_yesterday', 'Yesterday'),
            otherDays: 'DD/MM/YYYY',
          }}
        />
      }
      // Omitted entirely rather than passed as null: CometChatListItem keys its
      // hover behaviour on whether a menuView exists at all, so an empty one would
      // still claim the slot and hide the timestamp on hover.
      {...(hideUnsaveOption
        ? {}
        : {
            menuView: (
              <button
                type="button"
                className={'cometchat-saved-messages__item-unsave'}
                aria-label={loc('message_list_option_unsave_message', 'Unsave message')}
                title={loc('message_list_option_unsave_message', 'Unsave message')}
                onClick={e => {
                  // The row navigates; this button must not.
                  e.stopPropagation();
                  onUnsave(message);
                }}
              >
                <span className={'cometchat-saved-messages__item-unsave-icon'} aria-hidden="true" />
              </button>
            ),
          })}
    />
  );
};

CometChatSavedMessagesItem.displayName = 'CometChatSavedMessagesItem';
