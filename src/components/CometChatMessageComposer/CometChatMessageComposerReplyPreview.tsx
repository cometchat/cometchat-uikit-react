import React, { useMemo } from 'react';
import type { CometChatMessageComposerReplyPreviewProps } from './CometChatMessageComposer.types';
import { useCometChatMessageComposerContext } from './CometChatMessageComposer.context';
import { useLocale } from '../../context/locale/LocaleContext';
import { CometChatUrlFormatter } from '../../formatters/CometChatUrlFormatter';
import { CometChatMarkdownFormatter } from '../../formatters/CometChatMarkdownFormatter';
import DOMPurify from 'dompurify';
import './CometChatMessageComposer.css';

/**
 * CometChatMessageComposerReplyPreview — reply mode preview banner.
 *
 * - Uses the cometchat-message-preview pattern (background, left border accent)
 * - Title row: sender name in primary color
 * - Subtitle row: message content rendered as formatted HTML (rich text + mentions)
 *   or media type label (Image, Video, Audio, File) for non-text messages
 * - Close button: absolute positioned top-right with close icon mask
 */
export const CometChatMessageComposerReplyPreview: React.FC<
  CometChatMessageComposerReplyPreviewProps
> = ({ className }) => {
  const { isInReplyMode, messageToReply, closePreview } = useCometChatMessageComposerContext();
  const { getLocalizedString } = useLocale();

  // Format the reply preview subtitle
  const formattedSubtitle = useMemo(() => {
    if (!messageToReply) return '';

    const messageType = messageToReply.getType();

    // Non-text messages: return localized type label
    if (messageType !== 'text') {
      switch (messageType) {
        case 'image':
          return getLocalizedString('conversation_subtitle_image');
        case 'video':
          return getLocalizedString('conversation_subtitle_video');
        case 'audio':
          return getLocalizedString('conversation_subtitle_audio');
        case 'file':
          return getLocalizedString('conversation_subtitle_file');
        case 'extension_sticker':
          return getLocalizedString('conversation_subtitle_sticker') || 'Sticker';
        case 'extension_poll': {
          // Try to get poll question from custom data
          try {
            const customData = (
              messageToReply as unknown as { getCustomData?: () => Record<string, unknown> }
            ).getCustomData?.();
            if (customData?.question) {
              return customData.question as string;
            }
          } catch {
            /* ignore */
          }
          return getLocalizedString('conversation_subtitle_poll') || 'Poll';
        }
        case 'extension_whiteboard':
          return (
            getLocalizedString('conversation_subtitle_collaborative_whiteboard') ||
            'Collaborative Whiteboard'
          );
        case 'extension_document':
          return (
            getLocalizedString('conversation_subtitle_collaborative_document') ||
            'Collaborative Document'
          );
        default: {
          // For unknown custom types, try getConversationText or customData.text
          try {
            const customMsg = messageToReply as unknown as {
              getConversationText?: () => string;
              getCustomData?: () => Record<string, unknown>;
            };
            const conversationText = customMsg.getConversationText?.();
            if (conversationText) return conversationText;
            const customData = customMsg.getCustomData?.();
            if (customData && typeof customData === 'object' && 'text' in customData) {
              return String(customData.text);
            }
          } catch {
            /* ignore */
          }
          return messageType.charAt(0).toUpperCase() + messageType.slice(1);
        }
      }
    }

    // Text messages: format with rich text and mentions
    const textMessage = messageToReply as unknown as {
      getText: () => string;
      getMentionedUsers: () => { getUid: () => string; getName: () => string }[];
      getMetadata: () => Record<string, unknown> | undefined;
    };
    const text = textMessage.getText();
    if (!text) return '';

    // Check for rich text metadata HTML (same as Angular's approach)
    try {
      const metadata = textMessage.getMetadata();
      // eslint-disable-next-line @typescript-eslint/dot-notation -- dynamic key access for metadata
      const richText = metadata?.['richText'] as
        | { html?: string; hasFormatting?: boolean }
        | undefined;
      if (richText?.html && richText.hasFormatting) {
        const sanitized = DOMPurify.sanitize(richText.html);
        if (sanitized) return sanitized;
      }
    } catch {
      // Fall through to formatter-based approach
    }

    // Strip markdown formatting for preview (```code```, **bold**, etc. → rendered HTML)
    const markdownFormatter = new CometChatMarkdownFormatter();
    const strippedText = markdownFormatter.stripMarkdownForConversation(text);

    // Escape HTML entities in stripped text (XSS prevention)
    // Note: stripMarkdownForConversation already converts some markdown to HTML tags
    // (bold, italic, code), so we sanitize via DOMPurify instead of escaping
    let formatted = strippedText;
    const mentionedUsers = textMessage.getMentionedUsers();

    if (mentionedUsers.length > 0) {
      // Replace SDK mention tokens with styled spans
      formatted = formatted.replace(/<@uid:(.*?)>/g, (_match, uid: string) => {
        const user = mentionedUsers.find(u => u.getUid() === uid);
        if (user) {
          return `<span style="color: var(--cometchat-primary-color, #6852d6); font-weight: 500;">@${user.getName()}</span>`;
        }
        return '';
      });
    }

    // Channel mentions (@all) — resolve regardless of mentionedUsers array
    formatted = formatted.replace(/<@all:(.*?)>/g, (_match, label: string) => {
      return `<span class="cometchat-mentions-you" style="color: var(--cometchat-warning-color, #ffab00); background: rgba(255, 171, 0, 0.2); font-weight: 500;">@${label}</span>`;
    });

    // Apply URL formatting
    const urlFormatter = new CometChatUrlFormatter();
    formatted = urlFormatter.format(formatted);

    return DOMPurify.sanitize(formatted);
  }, [messageToReply, getLocalizedString]);

  if (!isInReplyMode || !messageToReply) return null;

  const sender = messageToReply.getSender();
  const senderName = sender.getName();

  const rootClass = ['cometchat-message-composer__reply-preview', className ?? '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClass} role="status" aria-live="polite">
      <div className={'cometchat-message-composer__reply-preview-content'}>
        {/* Title row: sender name in primary color (matches Angular message-preview title) */}
        <div className={'cometchat-message-composer__reply-preview-title'}>
          <span className={'cometchat-message-composer__reply-preview-sender'}>{senderName}</span>
        </div>
        {/* Subtitle row — rendered as HTML for rich text support */}
        <div
          className={'cometchat-message-composer__reply-preview-subtitle'}
          dangerouslySetInnerHTML={{ __html: formattedSubtitle }}
        />
      </div>
      {/* Close button — matches Angular's mask-based icon */}
      <button
        type="button"
        className={'cometchat-message-composer__reply-preview-close'}
        onClick={closePreview}
        aria-label={getLocalizedString('message_composer_close_preview')}
      />
    </div>
  );
};
