import React, { useMemo } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatMessageComposerReplyPreviewProps } from './CometChatMessageComposer.types';
import { useCometChatMessageComposerContext } from './CometChatMessageComposer.context';
import { CometChatUIKit } from '../../CometChatUIKit/CometChatUIKit';
import { useLocale } from '../../context/locale/LocaleContext';
import { CometChatUrlFormatter } from '../../formatters/CometChatUrlFormatter';
import { CometChatMarkdownFormatter } from '../../formatters/CometChatMarkdownFormatter';
import DOMPurify from 'dompurify';
import './CometChatMessageComposer.css';

// Icons (same SVGs used in conversation subtitle and edit preview)
import imageIcon from '../../assets/conversations_image-message.svg';
import videoIcon from '../../assets/conversations_video-message.svg';
import audioIcon from '../../assets/conversations_audio-message.svg';
import fileIcon from '../../assets/conversations_file-message.svg';

/**
 * CometChatMessageComposerReplyPreview — reply mode preview banner.
 *
 * - Title row: sender name in primary color
 * - Subtitle row: formatted text/caption or media summary with icon
 * - Close button
 */
export const CometChatMessageComposerReplyPreview: React.FC<
  CometChatMessageComposerReplyPreviewProps
> = ({ className }) => {
  const { isInReplyMode, messageToReply, closePreview } = useCometChatMessageComposerContext();
  const { getLocalizedString } = useLocale();

  /**
   * Shared formatting pipeline for any raw text (message text or media caption).
   * richText metadata HTML → markdown strip → mentions → URLs → sanitize.
   */
  const formatText = (text: string, messageToReply: CometChat.BaseMessage): string => {
    if (!text) return '';

    const message = messageToReply as unknown as {
      getText: () => string;
      getMentionedUsers: () => { getUid: () => string; getName: () => string }[];
      getMetadata: () => Record<string, unknown> | undefined;
    };

    // Check for rich text metadata HTML
    try {
      const metadata = message.getMetadata();
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

    const mentionedUsers = message.getMentionedUsers();
    if (mentionedUsers.length > 0) {
      formatted = formatted.replace(/<@uid:(.*?)>/g, (_match, uid: string) => {
        const user = mentionedUsers.find(u => u.getUid() === uid);
        if (user) {
          return `<span style="color: var(--cometchat-primary-color, #6852d6); font-weight: 500;">@${user.getName()}</span>`;
        }
        return '';
      });
    }

    formatted = formatted.replace(/<@all:(.*?)>/g, (_match, label: string) => {
      return `<span class="cometchat-mentions-you" style="color: var(--cometchat-warning-color, #ffab00); background: rgba(255, 171, 0, 0.2); font-weight: 500;">@${label}</span>`;
    });

    const urlFormatter = new CometChatUrlFormatter();
    formatted = urlFormatter.format(formatted);

    return DOMPurify.sanitize(formatted);
  };

  // Format the reply preview subtitle
  const formattedSubtitle = useMemo(() => {
    if (!messageToReply) return '';

    const messageType = messageToReply.getType();

    // Media messages (image/video/audio/file) are handled via JSX below
    if (['image', 'video', 'audio', 'file'].includes(messageType)) {
      return null;
    }

    // Non-text, non-media messages: return localized type label
    if (messageType !== 'text') {
      switch (messageType) {
        case 'extension_sticker':
          return getLocalizedString('conversation_subtitle_sticker') || 'Sticker';
        case 'extension_poll': {
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

    // Text messages
    const text = (messageToReply as CometChat.TextMessage).getText();
    return formatText(text, messageToReply);
  }, [messageToReply, getLocalizedString]);

  // Media message summary (icon + count + label)
  const mediaSummary = useMemo(() => {
    if (!messageToReply) return null;
    const type = messageToReply.getType();
    if (!['image', 'video', 'audio', 'file'].includes(type)) return null;

    const mediaMsg = messageToReply as CometChat.MediaMessage;
    const attachments =
      typeof mediaMsg.getAttachments === 'function' ? mediaMsg.getAttachments() : [];
    const count = Math.max(attachments.length, 1);

    const iconMap: Record<string, string> = {
      image: imageIcon,
      video: videoIcon,
      audio: audioIcon,
      file: fileIcon,
    };
    const icon = iconMap[type] ?? fileIcon;

    let label: string;
    if (count === 1) {
      label = getLocalizedString(`conversation_subtitle_${type}`);
    } else {
      const pluralKey = `media_edit_preview_${type}_plural`;
      const pluralLabel = getLocalizedString(pluralKey);
      label =
        pluralLabel !== pluralKey
          ? `${String(count)} ${pluralLabel}`
          : `${String(count)} ${getLocalizedString(`conversation_subtitle_${type}`)}`;
    }

    return { icon, label };
  }, [messageToReply, getLocalizedString]);

  // Formatted caption for media messages — uses the shared formatText pipeline
  const formattedMediaCaption = useMemo(() => {
    if (!messageToReply) return '';
    const type = messageToReply.getType();
    if (!['image', 'video', 'audio', 'file'].includes(type)) return '';
    const caption = (messageToReply as CometChat.MediaMessage).getCaption() || '';
    return formatText(caption, messageToReply);
  }, [messageToReply]);

  if (!isInReplyMode || !messageToReply) return null;

  const sender = messageToReply.getSender();
  const loggedInUser = CometChatUIKit.getLoggedInUser();
  const isSentByMe = sender.getUid() === loggedInUser?.getUid();
  const senderName = isSentByMe
    ? getLocalizedString('conversation_subtitle_you_message') || 'You'
    : sender.getName();

  const rootClass = ['cometchat-message-composer__reply-preview', className ?? '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClass} role="status" aria-live="polite">
      <div className={'cometchat-message-composer__reply-preview-content'}>
        {/* Title row: sender name */}
        <div className={'cometchat-message-composer__reply-preview-title'}>
          <span className={'cometchat-message-composer__reply-preview-sender'}>{senderName}</span>
        </div>
        {/* Subtitle row */}
        {mediaSummary ? (
          <div
            className={
              'cometchat-message-composer__reply-preview-subtitle cometchat-message-composer__reply-preview-subtitle--media'
            }
          >
            <img
              src={mediaSummary.icon}
              alt=""
              className={'cometchat-message-composer__reply-preview-media-icon'}
              aria-hidden="true"
            />
            <span className={'cometchat-message-composer__reply-preview-media-label'}>
              {mediaSummary.label}
            </span>
            {formattedMediaCaption && (
              <>
                <span className={'cometchat-message-composer__reply-preview-separator'}>·</span>
                <span
                  className={'cometchat-message-composer__reply-preview-caption'}
                  dangerouslySetInnerHTML={{ __html: formattedMediaCaption }}
                />
              </>
            )}
          </div>
        ) : (
          <div
            className={'cometchat-message-composer__reply-preview-subtitle'}
            dangerouslySetInnerHTML={{ __html: formattedSubtitle ?? '' }}
          />
        )}
      </div>
      {/* Close button */}
      <button
        type="button"
        className={'cometchat-message-composer__reply-preview-close'}
        onClick={closePreview}
        aria-label={getLocalizedString('message_composer_close_preview')}
      />
    </div>
  );
};
