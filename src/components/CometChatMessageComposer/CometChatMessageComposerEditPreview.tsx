import React, { useMemo } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatMessageComposerEditPreviewProps } from './CometChatMessageComposer.types';
import { useCometChatMessageComposerContext } from './CometChatMessageComposer.context';
import { useLocale } from '../../context/locale/LocaleContext';
import { CometChatMarkdownFormatter } from '../../formatters/CometChatMarkdownFormatter';
import { CometChatUrlFormatter } from '../../formatters/CometChatUrlFormatter';
import DOMPurify from 'dompurify';
import './CometChatMessageComposer.css';

import imageIcon from '../../assets/conversations_image-message.svg';
import videoIcon from '../../assets/conversations_video-message.svg';
import audioIcon from '../../assets/conversations_audio-message.svg';
import fileIcon from '../../assets/conversations_file-message.svg';

/**
 * Build an attachment summary for the edit preview subtitle.
 * Returns { icon, label } where label is like "4 Images".
 */
function getMediaSummaryParts(
  message: CometChat.BaseMessage,
  t: (key: string) => string
): { icon: string; label: string } | null {
  const type = message.getType();
  if (type === 'text') return null;

  const mediaMsg = message as CometChat.MediaMessage;
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
    label = t(`conversation_subtitle_${type}`);
  } else {
    const pluralKey = `media_edit_preview_${type}_plural`;
    const pluralLabel = t(pluralKey);
    label =
      pluralLabel !== pluralKey
        ? `${String(count)} ${pluralLabel}`
        : `${String(count)} ${t(`conversation_subtitle_${type}`)}`;
  }

  return { icon, label };
}

/**
 * CometChatMessageComposerEditPreview — edit mode preview banner.
 *
 * For text messages: title = "Edit message", subtitle = formatted text (single line).
 * For media messages with captions: title = "Edit message",
 *   subtitle = [icon] N Images · caption (single row, trimmed).
 *
 * Text formatting replicates the reply preview flow exactly:
 * richText metadata HTML → stripMarkdownForConversation → mentions → URL formatting.
 */
export const CometChatMessageComposerEditPreview: React.FC<
  CometChatMessageComposerEditPreviewProps
> = ({ className }) => {
  const { isInEditMode, textMessageToEdit, closePreview } = useCometChatMessageComposerContext();
  const { getLocalizedString } = useLocale();

  const isMediaEdit = useMemo(() => {
    if (!textMessageToEdit) return false;
    return textMessageToEdit.getType() !== 'text';
  }, [textMessageToEdit]);

  const mediaSummary = useMemo(() => {
    if (!isMediaEdit || !textMessageToEdit) return null;
    return getMediaSummaryParts(textMessageToEdit, getLocalizedString);
  }, [isMediaEdit, textMessageToEdit, getLocalizedString]);

  const captionText = useMemo(() => {
    if (!textMessageToEdit || !isMediaEdit) return '';
    return (textMessageToEdit as CometChat.MediaMessage).getCaption() || '';
  }, [textMessageToEdit, isMediaEdit]);

  // Format text (used for both text message subtitle and media caption)
  // Same flow as reply preview: richText HTML → stripMarkdownForConversation → mentions → URLs
  const formatText = (text: string): string => {
    if (!text || !textMessageToEdit) return '';

    // Check for rich text metadata HTML
    try {
      const metadata = textMessageToEdit.getMetadata() as Record<string, unknown> | undefined;
      // eslint-disable-next-line @typescript-eslint/dot-notation -- dynamic key access for metadata
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
    const strippedText = markdownFormatter.stripMarkdownForConversation(text);

    let formatted = strippedText;
    const mentionedUsers = textMessageToEdit.getMentionedUsers();

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

  // Format the subtitle for TEXT messages
  const formattedSubtitle = useMemo(() => {
    if (!textMessageToEdit || isMediaEdit) return '';
    const text = (textMessageToEdit as CometChat.TextMessage).getText() || '';
    return formatText(text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textMessageToEdit, isMediaEdit]);

  // Format the caption for MEDIA messages
  const formattedCaption = useMemo(() => {
    if (!captionText.trim()) return '';
    return formatText(captionText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [captionText, textMessageToEdit]);

  if (!isInEditMode || !textMessageToEdit) return null;

  const rootClass = ['cometchat-message-composer__edit-preview', className ?? '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClass} role="status" aria-live="polite">
      <div className={'cometchat-message-composer__edit-preview-content'}>
        {/* Title row: always "Edit message" */}
        <div className={'cometchat-message-composer__edit-preview-title'}>
          <span className={'cometchat-message-composer__edit-preview-label'}>
            {getLocalizedString('message_composer_edit_message')}
          </span>
        </div>
        {/* Subtitle row */}
        {isMediaEdit && mediaSummary ? (
          <div
            className={
              'cometchat-message-composer__edit-preview-subtitle cometchat-message-composer__edit-preview-subtitle--media'
            }
          >
            <img
              src={mediaSummary.icon}
              alt=""
              className={'cometchat-message-composer__edit-preview-media-icon'}
              aria-hidden="true"
            />
            <span className={'cometchat-message-composer__edit-preview-media-label'}>
              {mediaSummary.label}
            </span>
            {captionText.trim() && (
              <>
                <span className={'cometchat-message-composer__edit-preview-separator'}>·</span>
                <span
                  className={'cometchat-message-composer__edit-preview-caption'}
                  dangerouslySetInnerHTML={{ __html: formattedCaption }}
                />
              </>
            )}
          </div>
        ) : (
          <div
            className={'cometchat-message-composer__edit-preview-subtitle'}
            dangerouslySetInnerHTML={{ __html: formattedSubtitle }}
          />
        )}
      </div>
      {/* Close button */}
      <button
        type="button"
        className={'cometchat-message-composer__edit-preview-close'}
        onClick={closePreview}
        aria-label={getLocalizedString('CANCEL_EDIT')}
      />
    </div>
  );
};
