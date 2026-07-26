import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatMessageOption, CometChatMessagePluginContext } from '../../plugin.types';
import { CometChatMarkdownFormatter } from '../../../formatters/CometChatMarkdownFormatter';
import { escapeUserHtml, sanitizeHtml } from '../../../utils/sanitizeHtml';
import { CometChatMessageStatus } from '../../../context/CometChatEvents.types';
import { translateMessage } from '../../../utils/CometChatTranslationUtils';

// --- Icons ---
import addReactionIcon from '../../../assets/add_reaction_icon.svg';
import replyIcon from '../../../assets/reply.svg';
import replyInThreadIcon from '../../../assets/reply_in_thread.svg';
import copyIcon from '../../../assets/Copy.svg';
import editIcon from '../../../assets/edit_icon.svg';
import deleteIcon from '../../../assets/bin.svg';
import infoIcon from '../../../assets/info_icon_fill.svg';
import flagIcon from '../../../assets/warning_neutral.svg';
import sendPrivatelyIcon from '../../../assets/send_message_privately.svg';
import markUnreadIcon from '../../../assets/mark_unread.svg';
import translateIcon from '../../../assets/translate.svg';

// --- Option ID constants ---

export const MESSAGE_OPTION_IDS = {
  react: 'react',
  reply: 'reply',
  replyInThread: 'reply-in-thread',
  copy: 'copy',
  edit: 'edit',
  delete: 'delete',
  messageInfo: 'message-info',
  flag: 'flag',
  sendPrivately: 'send-privately',
  markAsUnread: 'mark-as-unread',
  translate: 'translate',
} as const;

// --- Helpers ---

function isSentByMe(message: CometChat.BaseMessage, loggedInUser: CometChat.User): boolean {
  const sender = message.getSender();
  return sender.getUid() === loggedInUser.getUid();
}

/** Resolve a localization key with fallback. */
function loc(context: CometChatMessagePluginContext, key: string, fallback: string): string {
  if (!context.getLocalizedString) return fallback;
  const result = context.getLocalizedString(key);
  // localization returns the key itself when no translation is found
  return result && result !== key ? result : fallback;
}

// --- Option factories ---

function reactOption(context: CometChatMessagePluginContext): CometChatMessageOption {
  return {
    id: MESSAGE_OPTION_IDS.react,
    title: loc(context, 'message_list_option_react', 'React'),
    iconURL: addReactionIcon,
    onClick: message => {
      context.onReactToMessage?.(message);
    },
  };
}

function replyOption(context: CometChatMessagePluginContext): CometChatMessageOption {
  return {
    id: MESSAGE_OPTION_IDS.reply,
    title: loc(context, 'message_list_option_reply_to_message', 'Reply'),
    iconURL: replyIcon,
    onClick: message => {
      context.publish?.({
        type: 'ui:compose/reply',
        message,
        status: CometChatMessageStatus.inprogress,
        parentMessageId: message.getParentMessageId() || null,
      });
      context.onReplyMessage?.(message);
    },
  };
}

function replyInThreadOption(context: CometChatMessagePluginContext): CometChatMessageOption {
  return {
    id: MESSAGE_OPTION_IDS.replyInThread,
    title: loc(context, 'message_list_option_reply_in_thread', 'Reply in Thread'),
    iconURL: replyInThreadIcon,
    onClick: message => {
      context.onThreadClick?.(message);
    },
  };
}

function copyOption(context: CometChatMessagePluginContext): CometChatMessageOption {
  return {
    id: MESSAGE_OPTION_IDS.copy,
    title: loc(context, 'message_list_option_copy', 'Copy'),
    iconURL: copyIcon,
    onClick: msg => {
      // For media messages, copy the caption; for text messages, copy the text.
      let text: string;
      const mediaMsg = msg as unknown as { getCaption?: () => string };
      if (msg.getType() !== 'text' && typeof mediaMsg.getCaption === 'function') {
        text = mediaMsg.getCaption() || '';
      } else {
        text = (msg as CometChat.TextMessage).getText();
      }

      // Resolve SDK mention tokens to display names before copying
      const mentionedUsers = msg.getMentionedUsers();
      if (mentionedUsers.length > 0) {
        // User mentions: <@uid:xxx> → @DisplayName
        text = text.replace(/<@uid:(.*?)>/g, (match, uid: string) => {
          const user = mentionedUsers.find(u => u.getUid() === uid);
          return user ? `@${user.getName()}` : match;
        });
        // Channel mentions: <@all:xxx> → @label
        text = text.replace(/<@all:(.*?)>/g, (_match, label: string) => {
          return `@${label}`;
        });
      }

      // SECURITY: escape raw HTML before formatting + sanitize, else the clipboard
      // text/html carries a live payload that executes on paste.
      const markdownFormatter = new CometChatMarkdownFormatter();
      const htmlContent = sanitizeHtml(markdownFormatter.format(escapeUserHtml(text)));

      // Strip markdown formatting for the text/plain clipboard blob
      const plainText = stripMarkdownFormatting(text);

      // Write both HTML and plain text to clipboard via ClipboardItem API
      // This allows the composer to paste formatted content when text/html is available
      if (typeof navigator !== 'undefined' && typeof ClipboardItem !== 'undefined') {
        try {
          const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
          const textBlob = new Blob([plainText], { type: 'text/plain' });
          void navigator.clipboard.write([
            new ClipboardItem({
              'text/html': htmlBlob,
              'text/plain': textBlob,
            }),
          ]);
        } catch {
          // Fallback to plain text if ClipboardItem is not supported
          void navigator.clipboard.writeText(plainText);
        }
      } else if (typeof navigator !== 'undefined') {
        void navigator.clipboard.writeText(plainText);
      }

      context.showToast?.(
        loc(context, 'message_list_message_copied', 'Message copied to clipboard.')
      );
    },
  };
}

function editOption(context: CometChatMessagePluginContext): CometChatMessageOption {
  return {
    id: MESSAGE_OPTION_IDS.edit,
    title: loc(context, 'message_list_option_edit', 'Edit'),
    iconURL: editIcon,
    senderOnly: true,
    onClick: message => {
      context.publish?.({
        type: 'ui:compose/edit',
        message,
        status: CometChatMessageStatus.inprogress,
        parentMessageId: message.getParentMessageId() || null,
      });
      context.onEditMessage?.(message);
    },
  };
}

function deleteOption(context: CometChatMessagePluginContext): CometChatMessageOption {
  return {
    id: MESSAGE_OPTION_IDS.delete,
    title: loc(context, 'message_list_option_delete', 'Delete'),
    iconURL: deleteIcon,
    senderOnly: true,
    onClick: message => {
      context.onDeleteMessage?.(message);
    },
  };
}

function messageInfoOption(context: CometChatMessagePluginContext): CometChatMessageOption {
  return {
    id: MESSAGE_OPTION_IDS.messageInfo,
    title: loc(context, 'message_list_option_info', 'Info'),
    iconURL: infoIcon,
    senderOnly: true,
    onClick: message => {
      context.onMessageInfo?.(message);
    },
  };
}

function flagOption(context: CometChatMessagePluginContext): CometChatMessageOption {
  return {
    id: MESSAGE_OPTION_IDS.flag,
    title: loc(context, 'message_list_option_flag_message', 'Report'),
    iconURL: flagIcon,
    receiverOnly: true,
    onClick: message => {
      context.onFlagMessage?.(message);
    },
  };
}

function sendPrivatelyOption(context: CometChatMessagePluginContext): CometChatMessageOption {
  return {
    id: MESSAGE_OPTION_IDS.sendPrivately,
    title: loc(context, 'message_list_option_message_privately', 'Message Privately'),
    iconURL: sendPrivatelyIcon,
    receiverOnly: true,
    groupOnly: true,
    onClick: message => {
      const sender = message.getSender();
      context.publish?.({ type: 'ui:open-chat', user: sender });
    },
  };
}

function markAsUnreadOption(context: CometChatMessagePluginContext): CometChatMessageOption {
  return {
    id: MESSAGE_OPTION_IDS.markAsUnread,
    title: loc(context, 'message_list_option_mark_as_unread', 'Mark Unread'),
    iconURL: markUnreadIcon,
    receiverOnly: true,
    onClick: message => {
      context.onMarkAsUnread?.(message);
    },
  };
}

function translateOption(context: CometChatMessagePluginContext): CometChatMessageOption {
  return {
    id: MESSAGE_OPTION_IDS.translate,
    title: loc(context, 'message_list_translate', 'Translate'),
    iconURL: translateIcon,
    onClick: message => {
      const textMessage = message as CometChat.TextMessage;
      const browserLang = navigator.language;
      void translateMessage(textMessage, browserLang).then(result => {
        if (result.isSameLanguage) {
          context.showToast?.(
            loc(
              context,
              'message_list_message_already_translated',
              'The selected language for translation is similar to the original message language.'
            )
          );
        } else if (result.translatedText) {
          const metadata: Record<string, unknown> =
            (textMessage.getMetadata() as Record<string, unknown> | null) ?? {};
          metadata.translated_message = result.translatedText;
          textMessage.setMetadata(metadata);
          context.publish?.({ type: 'message/edited', message: textMessage } as never);
          context.showToast?.(
            loc(context, 'message_list_message_translated', 'Message translated successfully.')
          );
        }
      });
    },
  };
}

// --- Filter options based on context ---

/**
 * Strips markdown formatting syntax from text, leaving only the plain text content.
 * Preserves mention display names (@Name) and line breaks.
 */
function stripMarkdownFormatting(text: string): string {
  if (!text || typeof text !== 'string') return text;

  let result = text;

  // Strip code blocks: ```content```
  result = result.replace(/```([\s\S]*?)```/g, '$1');
  // Strip inline code: `content`
  result = result.replace(/`([^`]+)`/g, '$1');
  // Strip bold: **content**
  result = result.replace(/\*\*([^*]+)\*\*/g, '$1');
  // Strip italic: _content_
  result = result.replace(/(?<!\w)_([^_]+)_(?!\w)/g, '$1');
  // Strip strikethrough: ~~content~~
  result = result.replace(/~~([^~]+)~~/g, '$1');
  // Strip underline: <u>content</u>
  result = result.replace(/<u>([\s\S]*?)<\/u>/gi, '$1');
  // Strip blockquote markers: > text
  result = result.replace(/^>\s?/gm, '');
  // Strip link syntax: [text](url) → text
  result = result.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  // Strip ordered list markers: 1. text → text
  result = result.replace(/^\s*\d+\.\s+/gm, '');
  // Strip unordered list markers: • text or - text → text
  result = result.replace(/^\s*[•-]\s+/gm, '');

  return result;
}

function filterOptions(
  options: CometChatMessageOption[],
  message: CometChat.BaseMessage,
  context: CometChatMessagePluginContext
): CometChatMessageOption[] {
  const sentByMe = isSentByMe(message, context.loggedInUser);
  const isGroup = context.group != null;
  const isThread = message.getParentMessageId() > 0;

  return options.filter(opt => {
    if (opt.senderOnly && !sentByMe) return false;
    if (opt.receiverOnly && sentByMe) return false;
    if (opt.groupOnly && !isGroup) return false;
    // Hide "Reply in Thread" for messages already in a thread
    if (opt.id === MESSAGE_OPTION_IDS.replyInThread && isThread) return false;

    // Hide* toggle filtering (driven by MessageList props via pluginContext)
    switch (opt.id) {
      case MESSAGE_OPTION_IDS.reply:
        if (context.hideReplyOption) return false;
        break;
      case MESSAGE_OPTION_IDS.replyInThread:
        if (context.hideReplyInThreadOption) return false;
        break;
      case MESSAGE_OPTION_IDS.edit:
        if (context.hideEditMessageOption) return false;
        break;
      case MESSAGE_OPTION_IDS.delete:
        if (context.hideDeleteMessageOption) return false;
        break;
      case MESSAGE_OPTION_IDS.copy:
        if (context.hideCopyMessageOption) return false;
        break;
      case MESSAGE_OPTION_IDS.react:
        if (context.hideReactionOption) return false;
        break;
      case MESSAGE_OPTION_IDS.messageInfo:
        if (context.hideMessageInfoOption) return false;
        break;
      case MESSAGE_OPTION_IDS.flag:
        if (context.hideFlagMessageOption) return false;
        break;
      case MESSAGE_OPTION_IDS.sendPrivately:
        if (context.hideMessagePrivatelyOption) return false;
        break;
      case MESSAGE_OPTION_IDS.translate:
        if (context.hideTranslateMessageOption) return false;
        break;
      case MESSAGE_OPTION_IDS.markAsUnread:
        if (!context.showMarkAsUnreadOption) return false;
        break;
    }

    return true;
  });
}

// --- Public API ---

/**
 * Returns context menu options for media messages (image, video, audio, file).
 * Includes copy and edit options when the message has a caption.
 */
export function getMediaMessageOptions(
  message: CometChat.BaseMessage,
  context: CometChatMessagePluginContext
): CometChatMessageOption[] {
  const allOptions: CometChatMessageOption[] = [
    reactOption(context),
    replyOption(context),
    replyInThreadOption(context),
  ];

  // Add copy and edit when message has a caption (works like text copy/edit)
  const mediaMsg = message as CometChat.MediaMessage;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- runtime guard: message may not implement full MediaMessage interface
  const caption = (mediaMsg.getCaption ? mediaMsg.getCaption() : '') || '';
  if (caption.trim()) {
    allOptions.push(copyOption(context));
    allOptions.push(editOption(context));
  }

  allOptions.push(
    messageInfoOption(context),
    deleteOption(context),
    flagOption(context),
    markAsUnreadOption(context),
    sendPrivatelyOption(context)
  );
  return filterOptions(allOptions, message, context);
}

/**
 * Returns context menu options for text messages.
 * Extends media options with Copy and Edit.
 */
export function getTextMessageOptions(
  message: CometChat.BaseMessage,
  context: CometChatMessagePluginContext
): CometChatMessageOption[] {
  const allOptions: CometChatMessageOption[] = [
    reactOption(context),
    replyOption(context),
    replyInThreadOption(context),
    copyOption(context),
    editOption(context),
    translateOption(context),
    messageInfoOption(context),
    deleteOption(context),
    flagOption(context),
    markAsUnreadOption(context),
    sendPrivatelyOption(context),
  ];
  return filterOptions(allOptions, message, context);
}
