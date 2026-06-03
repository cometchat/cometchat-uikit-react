import DOMPurify from 'dompurify';

/** Tags allowed in sanitized HTML output. */
const ALLOWED_TAGS = [
  'span',
  'strong',
  'em',
  'b',
  'i',
  'u',
  's',
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
];

/** Attributes allowed in sanitized HTML output. */
const ALLOWED_ATTR = [
  'class',
  'data-uid',
  'data-mention-type',
  'data-self',
  'href',
  'target',
  'rel',
  'contenteditable',
  'style',
];

// Configure DOMPurify hook for link security
if (typeof window !== 'undefined') {
  DOMPurify.addHook('afterSanitizeAttributes', node => {
    if (node.tagName === 'A') {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
  });
}

/**
 * Sanitize HTML content using DOMPurify.
 * Removes dangerous elements/attributes while preserving safe formatting tags.
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';
  if (html.trim() === '') return '';

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  });
}

/**
 * Escape HTML entities in user-generated text BEFORE formatters run.
 * Preserves SDK mention patterns (`<@uid:...>`, `<@all:...>`) via placeholders
 * so the mentions formatter can still process them.
 * Preserves `<u>` and `</u>` tags — these are the underline "markdown" syntax
 */
export function escapeUserHtml(text: string): string {
  if (!text || typeof text !== 'string') return '';

  // Protect SDK mention patterns with placeholders
  const mentionPlaceholders: string[] = [];
  const mentionRegex = /<@(?:uid|all):[^>]*>/g;
  let escaped = text.replace(mentionRegex, match => {
    const idx = mentionPlaceholders.length;
    mentionPlaceholders.push(match);
    return `__COMETCHAT_MENTION_${String(idx)}__`;
  });

  // Escape all HTML tags EXCEPT <u> and </u> (underline — no markdown equivalent)
  escaped = escaped.replace(/<[^>]*>/g, match => {
    const inner = match.slice(1, -1).trim();
    // Preserve <u> and </u> — underline formatting tag
    if (/^\/?u$/i.test(inner)) {
      return match;
    }
    // Escape everything else
    return match.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  });

  // Escape bare & that are not already part of an HTML entity
  escaped = escaped.replace(/&(?!(?:#\d+|#x[\da-fA-F]+|[a-zA-Z]\w*);)/g, '&amp;');

  // Restore mention placeholders
  escaped = escaped.replace(
    /__COMETCHAT_MENTION_(\d+)__/g,
    (_, idx) => mentionPlaceholders[parseInt(idx as string, 10)] ?? ''
  );

  return escaped;
}

/**
 * Strip invalid SDK mention formats from text.
 * Preserves valid formats: `<@uid:xxx>` and `<@all:xxx>`.
 * Removes anything like `<@name:display>` where name is not 'uid' or 'all'.
 */
export function stripInvalidMentionFormats(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/<@(?!uid:|all:)[^>]+>/g, '');
}
