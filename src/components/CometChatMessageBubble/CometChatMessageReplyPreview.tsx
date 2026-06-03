import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import DOMPurify from 'dompurify';
import { useLocale } from '../../context/locale/LocaleContext';
import './CometChatMessageReplyPreview.css';
import { CometChatMarkdownFormatter } from '../../formatters/CometChatMarkdownFormatter';

/**
 * Sanitizes HTML for safe rendering in the reply preview.
 * Only allows basic inline formatting tags.
 */
function sanitizePreviewHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'strong', 'i', 'em', 'u', 's', 'del', 'strike', 'code', 'a'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
}

export interface CometChatMessageReplyPreviewProps {
  /** The quoted message to preview. */
  quotedMessage: CometChat.BaseMessage;
  /** The logged-in user (to show "You" for own messages). */
  loggedInUser: CometChat.User;
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
 * Strip markdown formatting from text for plain-text display in reply previews.
 * Removes blockquote markers, bold/italic/underline/strikethrough syntax,
 * code fences, and link markdown — leaving only the readable content.
 */
function stripMarkdownForPreview(text: string): string {
  if (!text) return '';
  const lines = text.split('\n');
  const processed = lines.map(line => {
    let r = line;
    // Strip blockquote markers: > text → text
    r = r.replace(/^>\s?/, '');
    // Strip code blocks: ```content``` → content
    r = r.replace(/```([\s\S]*?)```/g, '$1');
    // Strip inline code: `content` → content
    r = r.replace(/`([^`]+)`/g, '$1');
    // Strip bold: **content** → content
    r = r.replace(/\*\*([^*]+)\*\*/g, '$1');
    // Strip underline: __content__ or ++content++ → content
    r = r.replace(/__([^_]+)__/g, '$1');
    r = r.replace(/\+\+([^+]+)\+\+/g, '$1');
    // Strip italic: _content_ → content
    r = r.replace(/_([^_]+)_/g, '$1');
    // Strip strikethrough: ~~content~~ → content
    r = r.replace(/~~([^~]+)~~/g, '$1');
    // Strip links: [text](url) → text
    r = r.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    return r;
  });
  return processed.join('\n');
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

  // Text messages — no icon, just the text (with mentions resolved)
  if (type === 'text' && (category as string) === 'message') {
    let text = getText() || getLocalizedString('message_deleted');
    // Strip markdown formatting for preview display (```code```, **bold**, etc.)
    const markdownFormatter = new CometChatMarkdownFormatter();
    text = markdownFormatter.stripMarkdownForConversation(text);
    // Resolve mention tokens like <@uid:xxx> to @displayName
    try {
      const mentionedUsers = (
        message as unknown as {
          getMentionedUsers?: () => { getUid: () => string; getName: () => string }[];
        }
      ).getMentionedUsers?.();
      if (mentionedUsers && mentionedUsers.length > 0) {
        text = text.replace(/<@uid:(.*?)>/g, (_match: string, uid: string) => {
          const user = mentionedUsers.find(u => u.getUid() === uid);
          return user ? `@${user.getName()}` : `@${uid}`;
        });
      }
      // Also handle @all mentions
      text = text.replace(/<@all:(.*?)>/g, (_match: string, label: string) => `@${label}`);
    } catch {
      /* ignore */
    }
    // Strip markdown formatting for plain text display (blockquotes, bold, italic, etc.)
    text = stripMarkdownForPreview(text);
    return { iconClass: null, text };
  }

  // Media messages
  if ((category as string) === 'message') {
    switch (type) {
      case 'image': {
        const attachments = (
          message as unknown as { getAttachments?: () => { getName?: () => string }[] }
        ).getAttachments?.();
        const name = attachments?.[0]?.getName?.() ?? '';
        const caption = getText();
        return {
          iconClass: 'image',
          text: name || caption || getLocalizedString('conversation_subtitle_image') || 'Image',
        };
      }
      case 'video': {
        const attachments = (
          message as unknown as { getAttachments?: () => { getName?: () => string }[] }
        ).getAttachments?.();
        const name = attachments?.[0]?.getName?.() ?? '';
        const caption = getText();
        return {
          iconClass: 'video',
          text: name || caption || getLocalizedString('conversation_subtitle_video') || 'Video',
        };
      }
      case 'audio': {
        const attachments = (
          message as unknown as { getAttachments?: () => { getName?: () => string }[] }
        ).getAttachments?.();
        const name = attachments?.[0]?.getName?.() ?? '';
        const caption = getText();
        return {
          iconClass: 'audio',
          text: name || caption || getLocalizedString('conversation_subtitle_audio') || 'Audio',
        };
      }
      case 'file': {
        const attachments = (
          message as unknown as { getAttachments?: () => { getName?: () => string }[] }
        ).getAttachments?.();
        const name = attachments?.[0]?.getName?.() ?? '';
        const caption = getText();
        return {
          iconClass: 'file',
          text: name || caption || getLocalizedString('conversation_subtitle_file') || 'File',
        };
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
  loggedInUser,
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
  const isSentByMe = sender.getUid() === loggedInUser.getUid();
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
