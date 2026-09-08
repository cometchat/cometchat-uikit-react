import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatMessageOption, CometChatMessagePluginContext } from '../../plugin.types';
import { CometChatMarkdownFormatter } from '../../../formatters/CometChatMarkdownFormatter';
import { escapeUserHtml, sanitizeHtml } from '../../../utils/sanitizeHtml';
import { applyDisplayFormatters } from '../../../formatters/applyDisplayFormatters';
import { CometChatMessageStatus } from '../../../context/CometChatEvents.types';
import { translateMessage } from '../../../utils/CometChatTranslationUtils';
import {
  getSubscriptionTargetId,
  readThreadSubscribed,
  isThreadSubscriptionSupported,
  toggleThreadSubscription,
} from '../../../utils/CometChatThreadSubscription';

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
import bellIcon from '../../../assets/bell.svg';
import bellCrossedIcon from '../../../assets/bell_crossed.svg';
import organizeIcon from '../../../assets/organize.svg';
import pinIcon from '../../../assets/pin.svg';
import unpinIcon from '../../../assets/unpin.svg';
import saveIcon from '../../../assets/save.svg';
import unsaveIcon from '../../../assets/unsave.svg';
import { isPinned, isPinSaveEligible, isSaved } from '../../../utils/pinSaveUtils';
import { getPinSaveFeatures } from '../../../utils/pinSaveFeatures';

// --- Option ID constants ---

export const MESSAGE_OPTION_IDS = {
  react: 'react',
  reply: 'reply',
  replyInThread: 'reply-in-thread',
  threadSubscription: 'thread-subscription',
  copy: 'copy',
  edit: 'edit',
  delete: 'delete',
  messageInfo: 'message-info',
  flag: 'flag',
  sendPrivately: 'send-privately',
  markAsUnread: 'mark-as-unread',
  translate: 'translate',
  organize: 'organize',
  pinMessage: 'pin-message',
  unpinMessage: 'unpin-message',
  saveMessage: 'save-message',
  unsaveMessage: 'unsave-message',
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

/**
 * Follow / unfollow the thread this message belongs to.
 *
 * Action-labelled: the title and the icon describe what the tap will do, so
 * they read inverted against the state — a followed thread offers "stop".
 *
 * Allowed on a message with no replies yet (that is the point — you hear about
 * replies that arrive later), and on a reply, where it acts on the reply's
 * parent. A subscription is always rooted at the thread's parent message.
 */
function threadSubscriptionOption(
  message: CometChat.BaseMessage,
  context: CometChatMessagePluginContext
): CometChatMessageOption {
  // Prefer the message list's reactive value; fall back to the message's own
  // flag for a caller building options outside the list. Both resolve to the
  // same source of truth — the reactive value just reflects an optimistic flip
  // one render sooner (see `isThreadSubscribed` on the plugin context).
  const subscribed = context.isThreadSubscribed ?? readThreadSubscribed(message);

  return {
    id: MESSAGE_OPTION_IDS.threadSubscription,
    title: subscribed
      ? loc(context, 'thread_subscription_unsubscribe', 'Unsubscribe from thread')
      : loc(context, 'thread_subscription_subscribe', 'Subscribe to thread'),
    iconURL: subscribed ? bellCrossedIcon : bellIcon,
    onClick: msg => {
      void toggleThreadSubscription({
        parentMessageId: getSubscriptionTargetId(msg),
        // The same value the user just saw, not a fresh store read.
        subscribe: !subscribed,
        publish: context.publish,
        showToast: context.showToast,
        getLocalizedString: context.getLocalizedString,
      });
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
      // Custom display formatters run on top of the built-in markdown so a
      // copied custom format keeps its styling when pasted into a rich editor.
      const markdownFormatter = new CometChatMarkdownFormatter();
      const htmlContent = sanitizeHtml(
        applyDisplayFormatters(
          markdownFormatter.format(escapeUserHtml(text)),
          context.textFormatters
        )
      );

      // Strip markdown for the text/plain blob, then flatten any custom-format tokens to
      // their visible text (so the clipboard's plain text isn't littered with raw tokens).
      let plainText = stripMarkdownFormatting(text);
      if (context.textFormatters?.length && typeof document !== 'undefined') {
        const tmp = document.createElement('div');
        // SECURITY: escape before this innerHTML write, exactly as the text/html
        // branch above does.
        tmp.innerHTML = applyDisplayFormatters(escapeUserHtml(plainText), context.textFormatters);
        plainText = tmp.textContent ?? plainText;
      }

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

function pinMessageOption(context: CometChatMessagePluginContext): CometChatMessageOption {
  return {
    id: MESSAGE_OPTION_IDS.pinMessage,
    title: loc(context, 'message_list_option_pin_message', 'Pin message'),
    iconURL: pinIcon,
    onClick: message => {
      context.onPinMessage?.(message);
    },
  };
}

function unpinMessageOption(context: CometChatMessagePluginContext): CometChatMessageOption {
  return {
    id: MESSAGE_OPTION_IDS.unpinMessage,
    title: loc(context, 'message_list_option_unpin_message', 'Unpin message'),
    iconURL: unpinIcon,
    onClick: message => {
      context.onUnpinMessage?.(message);
    },
  };
}

function saveMessageOption(context: CometChatMessagePluginContext): CometChatMessageOption {
  return {
    id: MESSAGE_OPTION_IDS.saveMessage,
    title: loc(context, 'message_list_option_save_message', 'Save message'),
    iconURL: saveIcon,
    onClick: message => {
      context.onSaveMessage?.(message);
    },
  };
}

function unsaveMessageOption(context: CometChatMessagePluginContext): CometChatMessageOption {
  return {
    id: MESSAGE_OPTION_IDS.unsaveMessage,
    title: loc(context, 'message_list_option_unsave_message', 'Unsave message'),
    iconURL: unsaveIcon,
    onClick: message => {
      context.onUnsaveMessage?.(message);
    },
  };
}

/**
 * Build the pin/save options for a message, already reduced to what this user may
 * actually do here.
 *
 * Pin/Unpin and Save/Unsave are mutually exclusive per message — the current state
 * decides which of each pair is offered.
 */
function buildPinSaveOptions(
  message: CometChat.BaseMessage,
  context: CometChatMessagePluginContext
): CometChatMessageOption[] {
  if (!isPinSaveEligible(message, context.loggedInUser.getUid())) return [];

  // Prefer the value the renderer passed down — it re-renders when resolution
  // lands. The module cache is the fallback for non-React callers.
  const features = context.pinSaveFeatures ?? getPinSaveFeatures();
  const options: CometChatMessageOption[] = [];

  if (features.pinMessage) {
    if (isPinned(message)) {
      if (!context.hideUnpinMessageOption) options.push(unpinMessageOption(context));
    } else {
      if (!context.hidePinMessageOption) options.push(pinMessageOption(context));
    }
  }

  // Save is private to the acting user — no role gate, ever.
  if (features.saveMessage) {
    if (isSaved(message)) {
      if (!context.hideUnsaveMessageOption) options.push(unsaveMessageOption(context));
    } else {
      if (!context.hideSaveMessageOption) options.push(saveMessageOption(context));
    }
  }

  return options;
}

/**
 * Wrap pin/save under an "Organize ▸" fly-out, or return them flat.
 *
 * - `'nested'` (main message list) — room for a submenu.
 * - `'flat'` (thread column, Pinned/Saved panels) — ~400px wide, nowhere to fly out to.
 *
 * A single surviving option is ALWAYS returned flat: an "Organize ▸" that opens to
 * reveal one item is worse than no submenu at all.
 */
function organizeOptions(
  message: CometChat.BaseMessage,
  context: CometChatMessagePluginContext
): CometChatMessageOption[] {
  const pinSave = buildPinSaveOptions(message, context);
  if (pinSave.length === 0) return [];
  if (context.optionsLayout === 'flat' || pinSave.length === 1) return pinSave;

  return [
    {
      id: MESSAGE_OPTION_IDS.organize,
      title: loc(context, 'message_list_option_organize', 'Organize'),
      iconURL: organizeIcon,
      // The row is a disclosure, not an action — the submenu handles selection.
      onClick: () => {
        /* no-op */
      },
      submenu: pinSave,
    },
  ];
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
      case MESSAGE_OPTION_IDS.threadSubscription:
        // Deliberately not gated on `isThread` the way "Reply in Thread" is:
        // inside a thread the option still applies, to the parent.
        if (context.hideThreadSubscriptionOption) return false;
        if (!isThreadSubscriptionSupported()) return false;
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
    threadSubscriptionOption(message, context),
  ];

  // Add copy and edit when message has a caption (works like text copy/edit)
  const mediaMsg = message as CometChat.MediaMessage;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- runtime guard: message may not implement full MediaMessage interface
  const caption = (mediaMsg.getCaption ? mediaMsg.getCaption() : '') || '';
  if (caption.trim()) {
    allOptions.push(copyOption(context));
    allOptions.push(editOption(context));
  }

  // Organize sits directly after the Copy/Edit block (Figma: expanded_options).
  allOptions.push(...organizeOptions(message, context));

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
    threadSubscriptionOption(message, context),
    copyOption(context),
    editOption(context),
    // Organize sits after Edit, before Translate (Figma: expanded_options).
    ...organizeOptions(message, context),
    translateOption(context),
    messageInfoOption(context),
    deleteOption(context),
    flagOption(context),
    markAsUnreadOption(context),
    sendPrivatelyOption(context),
  ];
  return filterOptions(allOptions, message, context);
}
