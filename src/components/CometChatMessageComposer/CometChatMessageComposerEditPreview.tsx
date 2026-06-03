import React, { useMemo } from 'react';
import type { CometChatMessageComposerEditPreviewProps } from './CometChatMessageComposer.types';
import { useCometChatMessageComposerContext } from './CometChatMessageComposer.context';
import { useLocale } from '../../context/locale/LocaleContext';
import { convertMarkdownToHtml } from '../../utils/RichTextEditor/RichTextEditor';
import DOMPurify from 'dompurify';
import './CometChatMessageComposer.css';

/**
 * CometChatMessageComposerEditPreview — edit mode preview banner.
 *
 * - Uses the cometchat-message-preview pattern (background, left border accent)
 * - Title row: "Edit message" label
 * - Subtitle row: message text rendered as formatted HTML (rich text + mentions)
 * - Close button: absolute positioned top-right with close icon mask
 *
 * When rich text metadata is available on the message, it renders the HTML directly.
 * Otherwise, it applies mention and URL formatters to produce formatted output.
 */
export const CometChatMessageComposerEditPreview: React.FC<
  CometChatMessageComposerEditPreviewProps
> = ({ className }) => {
  const { isInEditMode, textMessageToEdit, closePreview } = useCometChatMessageComposerContext();
  const { getLocalizedString } = useLocale();

  // Format the edit preview subtitle — render rich text HTML or apply formatters
  const formattedSubtitle = useMemo(() => {
    if (!textMessageToEdit) return '';

    const text = textMessageToEdit.getText() || '';
    if (!text) return '';

    // Check for rich text metadata HTML (same as Angular's approach)
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
      // Fall through to formatter-based approach
    }

    // Escape HTML entities in raw text first (XSS prevention),
    // but protect SDK mention tags and existing HTML formatting tags (like <u>)
    // from being escaped, since they need to render as HTML.
    const sdkMentionRegex = /<@(uid|all):[^>]*>/g;
    const htmlTagRegex = /<\/?(u|b|i|s|em|strong|code|pre|blockquote|ol|ul|li|a|br|p|span)[^>]*>/gi;
    const placeholders: string[] = [];
    let protectedText = text.replace(sdkMentionRegex, match => {
      const idx = placeholders.length;
      placeholders.push(match);
      return `\x00PLACEHOLDER${String(idx)}\x00`;
    });
    protectedText = protectedText.replace(htmlTagRegex, match => {
      const idx = placeholders.length;
      placeholders.push(match);
      return `\x00PLACEHOLDER${String(idx)}\x00`;
    });

    // Convert markdown to HTML
    let formatted = convertMarkdownToHtml(protectedText);

    // Restore placeholders
    // eslint-disable-next-line no-control-regex
    formatted = formatted.replace(/\x00PLACEHOLDER(\d+)\x00/g, (_, idx: string) => {
      return placeholders[parseInt(idx, 10)] ?? '';
    });

    // Resolve mentions to styled spans
    const mentionedUsers = textMessageToEdit.getMentionedUsers();
    if (mentionedUsers.length > 0) {
      formatted = formatted.replace(/<@uid:(.*?)>/g, (_match, uid: string) => {
        const user = mentionedUsers.find((u: { getUid: () => string }) => u.getUid() === uid);
        if (user) {
          return `<span style="color: var(--cometchat-primary-color, #6852d6); font-weight: 500;">@${user.getName()}</span>`;
        }
        return '';
      });

      // Fallback: if no SDK tokens were found, match plain @name patterns
      if (!formatted.includes('font-weight: 500')) {
        for (const u of mentionedUsers) {
          const name = (u as unknown as { getName: () => string }).getName();
          const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const nameRegex = new RegExp(`@${escapedName}(?!\\w)`, 'g');
          formatted = formatted.replace(
            nameRegex,
            `<span style="color: var(--cometchat-primary-color, #6852d6); font-weight: 500;">@${name}</span>`
          );
        }
      }
    }

    // Resolve @all mentions (outside mentionedUsers check since @all isn't a real user)
    formatted = formatted.replace(/<@all:(.*?)>/g, (_match, label: string) => {
      return `<span class="cometchat-mentions-you" style="color: var(--cometchat-warning-color, #ffab00); background: rgba(255, 171, 0, 0.2); font-weight: 500;">@${label}</span>`;
    });

    // Fallback for @all as plain text
    if (!formatted.includes('>@all<') && /(?<!\w)@all(?!\w)/.test(formatted)) {
      formatted = formatted.replace(
        /(?<!\w)@all(?!\w)/g,
        '<span class="cometchat-mentions-you" style="color: var(--cometchat-warning-color, #ffab00); background: rgba(255, 171, 0, 0.2); font-weight: 500;">@all</span>'
      );
    }

    return DOMPurify.sanitize(formatted);
  }, [textMessageToEdit]);

  if (!isInEditMode || !textMessageToEdit) return null;

  const rootClass = ['cometchat-message-composer__edit-preview', className ?? '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClass} role="status" aria-live="polite">
      <div className={'cometchat-message-composer__edit-preview-content'}>
        {/* Title row */}
        <div className={'cometchat-message-composer__edit-preview-title'}>
          <span className={'cometchat-message-composer__edit-preview-label'}>
            {getLocalizedString('message_composer_edit_message')}
          </span>
        </div>
        {/* Subtitle row — rendered as HTML for rich text support */}
        <div
          className={'cometchat-message-composer__edit-preview-subtitle'}
          dangerouslySetInnerHTML={{ __html: formattedSubtitle }}
        />
      </div>
      {/* Close button — matches Angular's mask-based icon */}
      <button
        type="button"
        className={'cometchat-message-composer__edit-preview-close'}
        onClick={closePreview}
        aria-label={getLocalizedString('CANCEL_EDIT')}
      />
    </div>
  );
};
