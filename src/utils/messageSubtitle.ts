import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatLocalize } from '../resources/CometChatLocalize/CometChatLocalize';

/**
 * Builds the one-line HTML preview of a message used by list surfaces — search
 * results and saved messages.
 *
 * Returns an HTML string, deliberately: a preview has to carry rich text (bold,
 * italic, code, mentions) and a leading media-type icon, neither of which
 * survives a plain-text round trip. Every caller MUST pass the result through
 * `sanitizeHtml` at the render sink.
 *
 * Extracted from CometChatSearchMessagesList so the Saved panel renders previews
 * identically rather than growing a second, subtly different implementation.
 */

function defaultLocalize(key: string): string {
  const instance = CometChatLocalize.getSharedInstance();
  if (instance) {
    const result = instance.t(key);
    return result && result !== key ? result : key;
  }
  return key;
}

export interface MessageSubtitleOptions {
  /** Used to decide whether the sender prefix reads "You". */
  loggedInUserId?: string | undefined;
  /**
   * Class prefix for the media-type icon span, e.g.
   * `cometchat-search__messages-subtitle-icon`. The emitted markup is
   * `<span class="{prefix} {prefix}--image"></span>`, so each surface styles the
   * icon with its own rules.
   */
  iconClassPrefix: string;
  /** Prepend "{sender}: " to the preview. */
  includeSenderPrefix?: boolean;
  /** Localized "You", used when the sender is the logged-in user. */
  youLabel?: string;
  /** Localization lookup; defaults to the shared CometChatLocalize instance. */
  t?: (key: string) => string;
}

/** Markdown → HTML, mentions, and whitespace collapsing. Shared by body and caption. */
function applyInlineFormatting(input: string, message: CometChat.BaseMessage): string {
  let text = input;

  // Bold: **text** → <b>text</b>
  text = text.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  // Underline: __text__ → <u>text</u>
  text = text.replace(/__([^_]+)__/g, '<u>$1</u>');
  // Italic: _text_ → <i>text</i>
  text = text.replace(/(?<!_)_([^_]+)_(?!_)/g, '<i>$1</i>');
  // Strikethrough: ~~text~~ → <s>text</s>
  text = text.replace(/~~([^~]+)~~/g, '<s>$1</s>');
  // Inline code: `text` → <code>text</code>
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Strip links: [text](url) → text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  // Strip blockquotes: > text → text
  text = text.replace(/^(?:&gt;|>)\s?/gm, '');

  // Mentions: <@uid:xxx> → styled @displayName, <@all:label> → styled @label
  const mentionedUsers =
    (
      message as unknown as {
        getMentionedUsers?: () => { getUid: () => string; getName: () => string }[];
      }
    ).getMentionedUsers?.() ?? [];
  const mentionMap = new Map<string, string>();
  for (const user of mentionedUsers) {
    mentionMap.set(user.getUid(), user.getName());
  }
  text = text.replace(/<@uid:([^>]+)>/g, (_match, uid: string) => {
    const name = mentionMap.get(uid) ?? uid;
    return `<span class="cometchat-mentions cometchat-mentions-other"><span>@${name}</span></span>`;
  });
  text = text.replace(/<@all:([^>]+)>/g, (_match, label: string) => {
    return `<span class="cometchat-mentions cometchat-mentions-you"><span>@${label}</span></span>`;
  });

  // Collapse whitespace and newlines — this is a single line.
  return text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Friendly one-line label for a custom/extension message (poll, sticker, collaborative
 * document/whiteboard, …), mirroring the conversation subtitle's `getLastMessageText`
 * so the two surfaces read the same. Falls back to the message's own conversationText,
 * then the raw type, for app-defined custom types the kit doesn't know.
 */
function customMessageSubtitle(
  message: CometChat.BaseMessage,
  type: string,
  t: (key: string) => string
): string {
  const label = (key: string, fallback: string): string => {
    const v = t(key);
    return v && v !== key ? v : fallback;
  };
  switch (type) {
    case 'extension_poll':
      return label('conversation_subtitle_poll', 'Poll');
    case 'extension_sticker':
      return label('conversation_subtitle_sticker', 'Sticker');
    case 'extension_whiteboard':
      return label('conversation_subtitle_collaborative_whiteboard', 'Collaborative Whiteboard');
    case 'extension_document':
      return label('conversation_subtitle_collaborative_document', 'Collaborative Document');
    default: {
      const convText = (message as CometChat.CustomMessage).getConversationText();
      return convText || type;
    }
  }
}

export function getMessageSubtitle(
  message: CometChat.BaseMessage,
  options: MessageSubtitleOptions
): string {
  const { loggedInUserId, iconClassPrefix, includeSenderPrefix = false, youLabel } = options;
  const t = options.t ?? defaultLocalize;

  const type = message.getType();
  let text = '';

  if (type === 'text') {
    const textMsg = message as CometChat.TextMessage;
    // The rich-text editor stores generated HTML in metadata; prefer it over the
    // plain body so formatting survives into the preview.
    try {
      const metadata = textMsg.getMetadata() as Record<string, unknown> | undefined;
      // eslint-disable-next-line @typescript-eslint/dot-notation
      const richText = metadata?.['richText'] as
        | { html?: string; hasFormatting?: boolean }
        | undefined;
      text = richText?.html && richText.hasFormatting ? richText.html : textMsg.getText();
    } catch {
      text = textMsg.getText();
    }

    // Normalize HTML formatting tags to their markdown equivalents first, so the
    // single markdown→HTML pass below handles both input shapes.
    text = text.replace(/<b>([\s\S]*?)<\/b>/gi, '**$1**');
    text = text.replace(/<strong>([\s\S]*?)<\/strong>/gi, '**$1**');
    text = text.replace(/<i>([\s\S]*?)<\/i>/gi, '_$1_');
    text = text.replace(/<em>([\s\S]*?)<\/em>/gi, '_$1_');
    text = text.replace(/<s>([\s\S]*?)<\/s>/gi, '~~$1~~');
    text = text.replace(/<strike>([\s\S]*?)<\/strike>/gi, '~~$1~~');
    text = text.replace(/<del>([\s\S]*?)<\/del>/gi, '~~$1~~');

    // Escape (don't drop) any remaining tags so a payload renders as inert text;
    // preserve <u> and mention pseudo-tags. Output is sanitized at the sink too.
    text = text.replace(/<[^>]*>/g, match => {
      const inner = match.slice(1, -1).trim();
      if (/^\/?u$/i.test(inner)) return match;
      if (inner.startsWith('@')) return match;
      return match.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    });

    text = applyInlineFormatting(text, message);
  } else if (type === 'image' || type === 'video' || type === 'audio' || type === 'file') {
    const media = message as CometChat.MediaMessage;
    const attachments = typeof media.getAttachments === 'function' ? media.getAttachments() : [];
    const count = Math.max(attachments.length, 1);
    const caption = typeof media.getCaption === 'function' ? media.getCaption() || '' : '';
    const iconSpan = `<span class="${iconClassPrefix} ${iconClassPrefix}--${type}"></span>`;

    const formattedCaption = caption.trim() ? applyInlineFormatting(caption, message) : '';
    const hasCaption = formattedCaption.length > 0;
    const fileName = attachments[0]?.getName() ?? type;

    const pluralLabel = (): string => {
      const pluralKey = `media_edit_preview_${type}_plural`;
      const plural = t(pluralKey);
      return plural !== pluralKey
        ? `${String(count)} ${plural}`
        : `${String(count)} ${t(`conversation_subtitle_${type}`)}`;
    };

    if (count === 1 && !hasCaption) {
      // One attachment, no caption → the file's own name is the most useful label.
      text = `${iconSpan}${fileName}`;
    } else if (count > 1 && !hasCaption) {
      text = `${iconSpan}${pluralLabel()}`;
    } else if (count === 1 && hasCaption) {
      text = `${iconSpan}${formattedCaption}`;
    } else if (type === 'image' || type === 'video') {
      // The count is already visible via the +N overlay on the thumbnail.
      text = `${iconSpan}${formattedCaption}`;
    } else {
      text = `${iconSpan}${pluralLabel()} · ${formattedCaption}`;
    }
  } else if ((message.getCategory() as string) === 'custom') {
    // Custom/extension messages — a friendly label (poll, sticker, collaborative, …),
    // matching the conversation subtitle, instead of leaking the raw type key.
    text = customMessageSubtitle(message, type, t);
  } else {
    text = type;
  }

  if (includeSenderPrefix) {
    const sender = message.getSender();
    const isMe = sender.getUid() === loggedInUserId;
    const senderName = isMe
      ? (youLabel ?? t('conversation_subtitle_you_message'))
      : sender.getName();
    if (senderName) {
      text = `${senderName}: ${text}`;
    }
  }

  return text;
}
