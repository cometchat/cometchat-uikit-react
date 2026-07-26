import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import DOMPurify from 'dompurify';
import { CometChatUIKit } from '../../CometChatUIKit/CometChatUIKit';
import { useLocale } from '../../context/locale/LocaleContext';
import './CometChatMessageReplyPreview.css';
import { CometChatMarkdownFormatter } from '../../formatters/CometChatMarkdownFormatter';
import { CometChatUrlFormatter } from '../../formatters/CometChatUrlFormatter';

/**
 * Sanitizes HTML for safe rendering in the reply preview.
 * Only allows basic inline formatting tags.
 */
function sanitizePreviewHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'strong', 'i', 'em', 'u', 's', 'del', 'strike', 'code', 'a', 'span'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'style', 'class'],
  });
}

export interface CometChatMessageReplyPreviewProps {
  /** The quoted message to preview. */
  quotedMessage: CometChat.BaseMessage;
  /** Bubble alignment (affects colors). */
  alignment: 'left' | 'right';
  /** Click handler — scrolls to the quoted message. */
  onClick?: () => void;
  /** Whether the parent message is moderated (affects min-width). */
  isModerated?: boolean;
  /** Optional className. */
  className?: string;
}

/**
 * Shared formatting pipeline for preview text (text message content or media caption).
 * richText metadata HTML → markdown strip → mention spans → URL formatting → sanitize.
 */
function formatTextForPreview(text: string, message: CometChat.BaseMessage): string {
  if (!text) return '';

  // Check for rich text metadata HTML
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const metadata = message.getMetadata() as Record<string, unknown> | undefined;
    // eslint-disable-next-line @typescript-eslint/dot-notation
    const richText = metadata?.['richText'] as
      | { html?: string; hasFormatting?: boolean }
      | undefined;
    if (richText?.html && richText.hasFormatting) {
      const sanitized = DOMPurify.sanitize(richText.html);
      if (sanitized) return sanitized;
    }
  } catch {
    // Fall through
  }

  const markdownFormatter = new CometChatMarkdownFormatter();
  let formatted = markdownFormatter.stripMarkdownForConversation(text);

  // Resolve mentions
  const mentionedUsers = message.getMentionedUsers();
  if (mentionedUsers.length > 0) {
    formatted = formatted.replace(/<@uid:(.*?)>/g, (_match: string, uid: string) => {
      const user = mentionedUsers.find(u => u.getUid() === uid);
      if (user) {
        return `<span style="color: var(--cometchat-primary-color, #6852d6); font-weight: 500;">@${user.getName()}</span>`;
      }
      return `@${uid}`;
    });
  }

  formatted = formatted.replace(/<@all:(.*?)>/g, (_match: string, label: string) => {
    return `<span style="color: var(--cometchat-warning-color, #ffab00); font-weight: 500;">@${label}</span>`;
  });

  // URL formatting
  const urlFormatter = new CometChatUrlFormatter();
  formatted = urlFormatter.format(formatted);

  return DOMPurify.sanitize(formatted);
}

/**
 * Determines the icon class suffix and display text for the quoted message subtitle.
 */
function getSubtitleContent(
  message: CometChat.BaseMessage,
  getLocalizedString: (key: string) => string
): { iconClass: string | null; text: string } {
  const type = message.getType();
  const category = message.getCategory();

  // Helper to get text from message
  const getText = (): string => {
    try {
      const textMsg = message as unknown as { getText?: () => string };
      return textMsg.getText?.() ?? '';
    } catch {
      return '';
    }
  };

  const getConversationText = (): string => {
    try {
      const customMsg = message as unknown as { getConversationText?: () => string };
      return customMsg.getConversationText?.() ?? '';
    } catch {
      return '';
    }
  };

  // Text messages — no icon, just the text (formatted with rich text pipeline)
  if (type === 'text' && (category as string) === 'message') {
    const rawText = getText() || getLocalizedString('message_deleted');
    const text = formatTextForPreview(rawText, message);
    return { iconClass: null, text };
  }

  // Media messages
  if ((category as string) === 'message') {
    switch (type) {
      case 'image':
      case 'video':
      case 'audio':
      case 'file': {
        const mediaMsg = message as unknown as {
          getAttachments?: () => unknown[];
          getCaption?: () => string;
        };
        const attachments = mediaMsg.getAttachments?.() ?? [];
        const count = Math.max(attachments.length, 1);
        const caption = mediaMsg.getCaption?.() ?? '';

        // Build label: "N Images" or just "Image" for single
        let label: string;
        if (count === 1) {
          label = getLocalizedString(`conversation_subtitle_${type}`) || type;
        } else {
          const pluralKey = `media_edit_preview_${type}_plural`;
          const pluralLabel = getLocalizedString(pluralKey);
          label =
            pluralLabel !== pluralKey
              ? `${String(count)} ${pluralLabel}`
              : `${String(count)} ${getLocalizedString(`conversation_subtitle_${type}`) || type}`;
        }

        // Format caption through the rich text pipeline
        if (caption.trim()) {
          const formattedCaption = formatTextForPreview(caption.trim(), message);
          const text = `${label} · ${formattedCaption}`;
          return { iconClass: type, text };
        }
        return { iconClass: type, text: label };
      }
      default:
        break;
    }
  }

  // Custom category — known extension types
  if ((category as string) === 'custom') {
    switch (type) {
      case 'extension_poll': {
        // Try to get the poll question from custom data
        const customData = (
          message as unknown as { getCustomData?: () => Record<string, unknown> }
        ).getCustomData?.();
        const question =
          (customData ? (customData.question as string | undefined) : undefined) ?? '';
        return {
          iconClass: 'poll',
          text:
            question ||
            getConversationText() ||
            getText() ||
            getLocalizedString('conversation_subtitle_poll') ||
            'Poll',
        };
      }
      case 'extension_sticker':
        return {
          iconClass: 'sticker',
          text:
            getConversationText() ||
            getText() ||
            getLocalizedString('conversation_subtitle_sticker') ||
            'Sticker',
        };
      case 'extension_whiteboard':
        return {
          iconClass: 'collaborative-whiteboard',
          text:
            getConversationText() ||
            getText() ||
            getLocalizedString('conversation_subtitle_whiteboard') ||
            'Collaborative Whiteboard',
        };
      case 'extension_document':
        return {
          iconClass: 'collaborative-document',
          text:
            getConversationText() ||
            getText() ||
            getLocalizedString('conversation_subtitle_document') ||
            'Collaborative Document',
        };
      default:
        // Unknown custom type
        return {
          iconClass: `unsupported ${type}`.trim(),
          text: getConversationText() || getText() || type,
        };
    }
  }

  // Non-custom unknown
  return { iconClass: 'unsupported', text: getLocalizedString('message_bubble_unsupported') };
}

/**
 * CometChatMessageReplyPreview — compact preview of a quoted message.
 *
 * Renders above the content inside a message bubble when the message
 * is a reply. Clicking scrolls to the original quoted message.
 */
export const CometChatMessageReplyPreview: React.FC<CometChatMessageReplyPreviewProps> = ({
  quotedMessage,
  alignment,
  onClick,
  isModerated = false,
  className,
}) => {
  const { getLocalizedString } = useLocale();
  const previewRef = useRef<HTMLDivElement>(null);
  const [contentWidth, setContentWidth] = useState(0);

  // Observe the content view sibling to constrain preview width to the bubble content width.
  // This prevents the reply preview from stretching the bubble beyond its natural content width.
  useEffect(() => {
    if (!previewRef.current) return;

    // Traverse: previewRef → reply-view wrapper → body → find content-view sibling
    const replyViewWrapper = previewRef.current.parentElement;
    const body = replyViewWrapper?.parentElement;
    const contentView = body?.querySelector('[class*="body-content-view"]') as HTMLElement | null;

    if (!contentView) return;

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width;
        setContentWidth(prev => (prev !== newWidth ? newWidth : prev));
      }
    });

    observer.observe(contentView);
    setContentWidth(contentView.offsetWidth);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Constrain max-width to the content view width (min 105px for very short content)
  const containerStyle = useMemo(
    () => ({
      maxWidth: contentWidth <= 100 ? 105 : contentWidth,
      width: '100%',
    }),
    [contentWidth]
  );

  const isDeleted = Boolean(quotedMessage.getDeletedAt());
  const sender = quotedMessage.getSender();
  const loggedInUser = CometChatUIKit.getLoggedInUser();
  const isSentByMe = sender.getUid() === loggedInUser?.getUid();
  const titleText = isSentByMe
    ? getLocalizedString('conversation_subtitle_you_message') || 'You'
    : sender.getName() || '';

  const variant = alignment === 'right' ? 'outgoing' : 'incoming';

  const containerClasses = [
    'cometchat-message-reply-preview',
    `cometchat-message-reply-preview--${variant}`,
    isModerated ? 'cometchat-message-reply-preview--moderated' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const handleClick = () => {
    onClick?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  // Deleted state
  if (isDeleted) {
    return (
      <div
        ref={previewRef}
        className={containerClasses}
        style={contentWidth > 0 ? containerStyle : undefined}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label={getLocalizedString('message_bubble_quoted_deleted')}
      >
        <div className={'cometchat-message-reply-preview__title'}>{titleText}</div>
        <div className={'cometchat-message-reply-preview__deleted'}>
          <div className={'cometchat-message-reply-preview__deleted-icon'} />
          <div className={'cometchat-message-reply-preview__deleted-text'}>
            {getLocalizedString('message_deleted') || 'This message was deleted'}
          </div>
        </div>
      </div>
    );
  }

  // Normal state
  const { iconClass, text } = getSubtitleContent(quotedMessage, getLocalizedString);

  return (
    <div
      ref={previewRef}
      className={containerClasses}
      style={contentWidth > 0 ? containerStyle : undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={getLocalizedString('accessibility_quoted_message_from').replace(
        '{name}',
        titleText
      )}
    >
      <div className={'cometchat-message-reply-preview__title'}>{titleText}</div>
      <div className={'cometchat-message-reply-preview__subtitle'}>
        {iconClass && (
          <div
            className={[
              'cometchat-message-reply-preview__subtitle-icon',
              `cometchat-message-reply-preview__subtitle-icon-${iconClass}`,
            ]
              .filter(Boolean)
              .join(' ')}
          />
        )}
        <div
          className={'cometchat-message-reply-preview__subtitle-text'}
          dangerouslySetInnerHTML={{ __html: sanitizePreviewHtml(text) }}
        />
      </div>
    </div>
  );
};

CometChatMessageReplyPreview.displayName = 'CometChatMessageReplyPreview';
