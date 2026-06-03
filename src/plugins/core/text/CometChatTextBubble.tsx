import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import type {
  CometChatTextBubbleProps,
  CometChatLinkPreviewData,
} from './CometChatTextBubble.types';
import type { CometChatTextFormatter } from '../../../formatters/CometChatTextFormatter';
import { CometChatMentionsFormatter } from '../../../formatters/CometChatMentionsFormatter';
import {
  sanitizeHtml,
  escapeUserHtml,
  stripInvalidMentionFormats,
} from '../../../utils/sanitizeHtml';
import { convertHtmlToMarkdown } from '../../../utils/HtmlToMarkdown';
import { useLocale } from '../../../context/locale/LocaleContext';
import { usePublishEvent } from '../../../hooks/usePublishEvent';
import './CometChatTextBubble.css';

// --- Utility functions ---

/**
 * Detect if text is a single emoji using Intl.Segmenter with regex fallback.
 */
function detectSingleEmoji(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (trimmed.length === 0) return false;

  // Basic regex check
  const basicRegex =
    /^(?:\p{Extended_Pictographic}(?:\p{Emoji_Modifier}|\uFE0F|\u200D\p{Extended_Pictographic})*|\p{Regional_Indicator}{2}|[0-9#*]\uFE0F?\u20E3)$/u;
  if (basicRegex.test(trimmed)) return true;

  // Intl.Segmenter for complex ZWJ sequences
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    try {
      const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
      const segments = Array.from(segmenter.segment(trimmed));
      if (segments.length !== 1) return false;
      const segment = segments[0]?.segment ?? '';
      return (
        /^\p{Extended_Pictographic}/u.test(segment) ||
        /^\p{Regional_Indicator}{2}$/u.test(segment) ||
        /^[0-9#*]\uFE0F?\u20E3$/u.test(segment)
      );
    } catch {
      // fall through
    }
  }

  // Fallback for complex ZWJ
  const complexRegex =
    /^(?:(?:\p{Extended_Pictographic}|\p{Regional_Indicator}{2})(?:\p{Emoji_Modifier}|\uFE0F)?(?:\u200D(?:\p{Extended_Pictographic}|\p{Regional_Indicator}{2})(?:\p{Emoji_Modifier}|\uFE0F)?)*|[0-9#*]\uFE0F?\u20E3)$/u;
  return complexRegex.test(trimmed);
}

/**
 * Extract link preview data from message metadata.
 * Path: metadata["@injected"]["extensions"]["link-preview"]["links"]
 */
function extractLinkPreviews(message?: {
  getMetadata?: () => unknown;
}): CometChatLinkPreviewData[] {
  if (!message) return [];
  try {
    const metadata = message.getMetadata?.();
    if (!metadata || typeof metadata !== 'object') return [];
    const injected = (metadata as Record<string, unknown>)['@injected'];
    if (!injected || typeof injected !== 'object') return [];
    const extensions = (injected as Record<string, unknown>).extensions;
    if (!extensions || typeof extensions !== 'object') return [];
    const linkPreview = (extensions as Record<string, unknown>)['link-preview'];
    if (!linkPreview || typeof linkPreview !== 'object') return [];
    const links = (linkPreview as Record<string, unknown>).links;
    if (!Array.isArray(links)) return [];

    return links
      .filter(
        (link): link is Record<string, unknown> =>
          link != null &&
          typeof link === 'object' &&
          typeof (link as Record<string, unknown>).url === 'string'
      )
      .map(link => ({
        url: link.url as string,
        title: typeof link.title === 'string' ? link.title : undefined,
        description: typeof link.description === 'string' ? link.description : undefined,
        image: typeof link.image === 'string' ? link.image : undefined,
        favicon: typeof link.favicon === 'string' ? link.favicon : undefined,
      }));
  } catch {
    return [];
  }
}

/**
 * Extract translated text from message metadata.
 * Path: metadata["translated_message"]
 */
function extractTranslation(message?: { getMetadata?: () => unknown }): string {
  if (!message) return '';
  try {
    const metadata = message.getMetadata?.();
    if (!metadata || typeof metadata !== 'object') return '';
    const translated = (metadata as Record<string, unknown>).translated_message;
    return typeof translated === 'string' ? translated : '';
  } catch {
    return '';
  }
}

/** Extract domain from a URL. */
function getDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

/**
 * Apply the formatter pipeline to text.
 *
 * 1. convertFormattingHtmlToMarkdown — if text contains HTML formatting tags, convert to markdown
 * 2. escapeUserHtml — escape remaining dangerous HTML, preserving SDK mention patterns
 * 3. Run formatters in priority order (markdown → mentions → URLs)
 * 4. Strip invalid mention formats
 * 5. Sanitize final HTML output
 */
function applyFormatters(
  text: string,
  formatters: CometChatTextFormatter[],
  message?: { getMentionedUsers?: () => (CometChat.User | CometChat.GroupMember)[] }
): string {
  if (!text) return '';

  // Step 1: If text contains HTML formatting tags (from other platforms or rich text),
  // convert them to markdown so the markdown formatter can process them uniformly.
  let processedText = text;
  const formattingTagPattern =
    /<\/?(b|strong|i|em|u|s|strike|del|code|pre|blockquote|a|ol|ul|li|p|div)[\s>]/i;
  if (formattingTagPattern.test(text)) {
    processedText = convertFormattingHtmlToMarkdown(text);
  }

  // Step 2: Escape user HTML preserving SDK mention patterns
  let result = escapeUserHtml(processedText);

  // Step 3: Sort formatters by priority (lower = first) and run pipeline
  const sorted = [...formatters].sort((a, b) => a.priority - b.priority);

  for (const formatter of sorted) {
    try {
      if (!formatter.shouldFormat(result)) continue;

      // Special handling for mentions formatter with SDK format
      if (formatter instanceof CometChatMentionsFormatter && formatter.hasSdkMentions(result)) {
        const mentionedUsers = message?.getMentionedUsers?.() ?? [];
        const formatted = formatter.formatSdkMentions(result, mentionedUsers);
        if (typeof formatted === 'string') {
          result = formatted;
        }
      } else {
        const formatted = formatter.format(result);
        if (typeof formatted === 'string') {
          result = formatted;
        }
      }
    } catch (error) {
      console.warn('CometChatTextBubble: Error applying text formatter', error);
    }
  }

  // Step 4 & 5: Strip invalid mentions and sanitize
  result = stripInvalidMentionFormats(result);
  return sanitizeHtml(result);
}

/**
 * Convert known rich-text HTML formatting tags to markdown.
 * Handles messages that arrive with raw HTML (from other platforms or older clients)
 * so they can be processed by the markdown formatter on the bubble side.
 * Also handles HTML-entity-escaped tags (e.g., &lt;i&gt;text&lt;/i&gt;).
 */
function convertFormattingHtmlToMarkdown(text: string): string {
  if (!text || typeof text !== 'string') return text;
  if (typeof document === 'undefined') return text;

  // Decode HTML entities for formatting tags so they can be detected
  let decoded = text;
  const entityPattern =
    /&lt;(\/?)(b|strong|i|em|u|s|strike|del|code|pre|blockquote|a|ol|ul|li)((?:\s[^&]*)?)&gt;/gi;
  if (entityPattern.test(text)) {
    decoded = text.replace(
      /&lt;(\/?)(b|strong|i|em|u|s|strike|del|code|pre|blockquote|a|ol|ul|li)((?:\s[^&]*)?)&gt;/gi,
      '<$1$2$3>'
    );
  }

  // Preserve mention tokens (<@uid:...> and <@all:...>) before DOM parsing
  const mentionPlaceholders: string[] = [];
  decoded = decoded.replace(/<@(uid|all):[^>]+>/g, match => {
    const idx = mentionPlaceholders.length;
    mentionPlaceholders.push(match);
    return `\u200B__MENTION_${String(idx)}__\u200B`;
  });

  // Use the existing HTML→markdown converter
  const markdown = convertHtmlToMarkdown(decoded);

  // Restore mention tokens
  const result = markdown.replace(/\u200B__MENTION_(\d+)__\u200B/g, (_, idx) => {
    return mentionPlaceholders[parseInt(idx as string, 10)] ?? '';
  });

  return result;
}

/**
 * CometChatTextBubble — renders text messages with formatting, link previews,
 * translations, emoji detection, and content truncation.
 */
export const CometChatTextBubble: React.FC<CometChatTextBubbleProps> = ({
  text,
  isSentByMe = true,
  textFormatters = [],
  message,
  disableTruncation = false,
  className,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { getLocalizedString } = useLocale();

  // Reset expanded state when text changes
  useEffect(() => {
    setIsExpanded(false);
  }, [text]);

  // Run the formatter pipeline on the text.
  // The text from getMessage().getText() already contains SDK mention tokens (<@uid:xxx>)
  // and markdown formatting. applyFormatters handles HTML→markdown conversion only when
  // the text itself contains HTML tags (from other platforms/older clients).
  const formattedHtml = useMemo(() => {
    return applyFormatters(text, textFormatters, message);
  }, [text, textFormatters, message]);

  // Detect single emoji
  const isSingleEmoji = useMemo(() => detectSingleEmoji(text), [text]);

  // Extract link previews from message metadata
  const linkPreviews = useMemo(() => extractLinkPreviews(message), [message]);

  // Extract translation from message metadata
  const translatedText = useMemo(() => extractTranslation(message), [message]);
  const formattedTranslation = useMemo(
    () => (translatedText ? applyFormatters(translatedText, textFormatters, message) : ''),
    [translatedText, textFormatters, message]
  );

  // Measure content height for truncation.
  // The CSS applies line-clamp on the text element. We check if the content
  // overflows its clamped container (scrollHeight > clientHeight) to determine
  // whether to show the "Read more" button.
  // Uses requestAnimationFrame to measure after browser layout/paint.
  useEffect(() => {
    if (disableTruncation || !contentRef.current) {
      setIsTruncated(false);
      return;
    }
    requestAnimationFrame(() => {
      if (!contentRef.current) return;
      // Tolerance accounts for inline elements (e.g. <code>) whose padding/border
      // add a few extra pixels to scrollHeight without visually overflowing.
      const tolerance = 8;
      const isOverflowing =
        contentRef.current.scrollHeight - contentRef.current.clientHeight > tolerance;
      setIsTruncated(isOverflowing);
    });
  }, [formattedHtml, disableTruncation]);

  // Toggle read more/less
  const toggleReadMore = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const publish = usePublishEvent();

  // Get mentioned users from the message for click handling
  const mentionedUsers: CometChat.User[] = useMemo(() => {
    try {
      return message?.getMentionedUsers() ?? [];
    } catch {
      return [];
    }
  }, [message]);

  // Handle clicks on mentions and links via event delegation
  const handleTextClick = useCallback(
    (event: React.MouseEvent) => {
      const target = event.target as HTMLElement;

      // URL link click
      if (target.tagName === 'A' && target.classList.contains('cometchat-link')) {
        event.preventDefault();
        event.stopPropagation();
        const url = target.getAttribute('href');
        if (url) {
          window.open(url, '_blank', 'noopener,noreferrer');
        }
        return;
      }

      // Mention click — open chat with the mentioned user (skip @all)
      if (target.classList.contains('cometchat-mentions')) {
        event.preventDefault();
        event.stopPropagation();
        const uid = target.getAttribute('data-uid');
        const mentionType = target.getAttribute('data-mention-type');
        if (!uid || uid === 'all' || mentionType === 'channel') return;

        const user = mentionedUsers.find(u => u.getUid() === uid);
        if (user) {
          publish({ type: 'ui:open-chat', user });
        }
      }
    },
    [publish, mentionedUsers]
  );

  // Handle link preview click
  const handleLinkPreviewClick = useCallback((url: string) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, []);

  const handleLinkPreviewKeyDown = useCallback(
    (event: React.KeyboardEvent, url: string) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleLinkPreviewClick(url);
      }
    },
    [handleLinkPreviewClick]
  );

  // Build root class names
  const rootClasses = [
    'cometchat-text-bubble',
    isSentByMe ? 'cometchat-text-bubble--outgoing' : 'cometchat-text-bubble--incoming',
    isSingleEmoji ? 'cometchat-text-bubble--single-emoji' : '',
    linkPreviews.length > 0 ? 'cometchat-text-bubble--has-link-preview' : '',
    // Plain global classes for external CSS targeting (e.g. AI chat overrides)
    'cometchat-text-bubble',
    isSentByMe ? 'cometchat-text-bubble-outgoing' : 'cometchat-text-bubble-incoming',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClasses}>
      {/* Link Previews */}
      {linkPreviews.length > 0 && (
        <div className={'cometchat-text-bubble__link-preview-container'}>
          {linkPreviews.map(preview => (
            <div
              key={preview.url}
              className={'cometchat-text-bubble__link-preview'}
              role="article"
              aria-label={getLocalizedString('accessibility_link_preview_for').replace(
                '{domain}',
                getDomainFromUrl(preview.url)
              )}
              tabIndex={0}
              onClick={() => {
                handleLinkPreviewClick(preview.url);
              }}
              onKeyDown={e => {
                handleLinkPreviewKeyDown(e, preview.url);
              }}
            >
              {preview.image && (
                <div className={'cometchat-text-bubble__link-preview-image-container'}>
                  <img
                    className={'cometchat-text-bubble__link-preview-image'}
                    src={preview.image}
                    alt={preview.title ?? 'Link preview image'}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              )}
              <div className={'cometchat-text-bubble__link-preview-content'}>
                <div className={'cometchat-text-bubble__link-preview-text'}>
                  {preview.title && (
                    <span className={'cometchat-text-bubble__link-preview-title'}>
                      {preview.title}
                    </span>
                  )}
                  {preview.description && (
                    <span className={'cometchat-text-bubble__link-preview-description'}>
                      {preview.description}
                    </span>
                  )}
                  <span className={'cometchat-text-bubble__link-preview-domain'}>
                    {getDomainFromUrl(preview.url)}
                  </span>
                </div>
                {preview.favicon && !preview.image && (
                  <img
                    className={'cometchat-text-bubble__link-preview-favicon-large'}
                    src={preview.favicon}
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Translation or main text */}
      {translatedText ? (
        <div className={'cometchat-text-bubble__translation-container'}>
          {/* Original text */}
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events */}
          <div
            className={'cometchat-text-bubble__text'}
            dangerouslySetInnerHTML={{ __html: formattedHtml }}
            onClick={handleTextClick}
          />
          <div className={'cometchat-text-bubble__translation-separator'} />
          <span className={'cometchat-text-bubble__translation-label'}>
            {getLocalizedString('message_translation_label')}
          </span>
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events */}
          <div
            className={'cometchat-text-bubble__translation-text'}
            dangerouslySetInnerHTML={{ __html: formattedTranslation }}
            onClick={handleTextClick}
          />
        </div>
      ) : (
        <div className={'cometchat-text-bubble__content'}>
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events */}
          <div
            ref={contentRef}
            className={[
              'cometchat-text-bubble__text',
              isExpanded ? 'cometchat-text-bubble__text--expanded' : '',
              disableTruncation ? 'cometchat-text-bubble__text--no-truncation' : '',
              // Plain global class for external CSS targeting
              'cometchat-text-bubble__body-text',
            ]
              .filter(Boolean)
              .join(' ')}
            dangerouslySetInnerHTML={{ __html: formattedHtml }}
            onClick={handleTextClick}
          />
        </div>
      )}

      {/* Read more / show less */}
      {isTruncated && !disableTruncation && (
        <div className={'cometchat-text-bubble__read-more'}>
          <button
            type="button"
            className={'cometchat-text-bubble__read-more-button'}
            aria-label={
              isExpanded
                ? getLocalizedString('text_message_show_less')
                : getLocalizedString('text_message_read_more')
            }
            aria-expanded={isExpanded}
            onClick={toggleReadMore}
          >
            {isExpanded
              ? getLocalizedString('text_message_show_less')
              : getLocalizedString('text_message_read_more')}
          </button>
        </div>
      )}
    </div>
  );
};

CometChatTextBubble.displayName = 'CometChatTextBubble';
