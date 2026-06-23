/**
 * Shared AI-specific HTML sanitization utilities.
 *
 * Used by CometChatStreamMessageBubble and CometChatAIAssistantBubble
 * to sanitize markdown-rendered HTML with a permissive tag/attribute allowlist
 * suitable for AI-generated content.
 */

import DOMPurify from 'dompurify';

/** Tags allowed in AI-generated HTML content. */
export const AI_ALLOWED_TAGS = [
  'span',
  'strong',
  'em',
  'b',
  'i',
  'u',
  's',
  'del',
  'code',
  'pre',
  'blockquote',
  'ul',
  'ol',
  'li',
  'a',
  'br',
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'img',
  'hr',
];

/** Attributes allowed in AI-generated HTML content. */
export const AI_ALLOWED_ATTR = [
  'class',
  'href',
  'target',
  'rel',
  'src',
  'alt',
  'width',
  'height',
  'style',
  'data-uid',
  'data-mention-type',
];

/**
 * Sanitize HTML produced by AI markdown rendering.
 * Uses DOMPurify with an AI-specific allowlist of tags and attributes.
 */
export function sanitizeAIHtml(html: string): string {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: AI_ALLOWED_TAGS,
    ALLOWED_ATTR: AI_ALLOWED_ATTR,
  });
}
