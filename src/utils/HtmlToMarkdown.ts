/**
 * HTML to Markdown Converter
 *
 * Converts rich text HTML from the message composer to markdown
 * for storage and transmission.
 *
 * This is a standalone utility that can be used independently of the
 * CometChatRichTextFormatter. The formatter uses this internally.
 *
 * Conversion rules:
 * - <b>, <strong> → **text**
 * - <i>, <em> → _text_
 * - <s>, <strike>, <del> → ~~text~~
 * - <u> → <u>text</u> (HTML-style underline)
 * - <code> (not in pre) → `text`
 * - <pre><code> → ```text```
 * - <blockquote> → > text
 * - <a href="url">text</a> → [text](url)
 * - <ol><li> → 1. text
 * - <ul><li> → • text
 */

/**
 * Convert HTML string to markdown.
 * Requires a DOM environment (browser or jsdom).
 */
export function htmlToMarkdown(html: string): string {
  if (!html) return '';
  if (typeof document === 'undefined') return html;

  const container = document.createElement('div');
  container.innerHTML = html;
  return processNode(container).trim();
}

/**
 * Wrap inline markdown markers per-line.
 * When block elements are nested inside inline formatting tags,
 * the content contains newlines. We close and reopen markers at each
 * line boundary so each line is independently valid markdown.
 */
function wrapInlineMarker(content: string, openMarker: string, closeMarker?: string): string {
  const close = closeMarker ?? openMarker;
  if (!content.includes('\n')) {
    return `${openMarker}${content}${close}`;
  }
  return content
    .split('\n')
    .map(line => (line.trim() === '' ? line : `${openMarker}${line}${close}`))
    .join('\n');
}

function processNode(node: Node, depth = 0): string {
  let result = '';
  for (const child of Array.from(node.childNodes)) {
    result += processChildNode(child, depth);
  }
  return result;
}

function processChildNode(node: Node, depth = 0): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? '';
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return '';
  }

  const element = node as HTMLElement;
  const tagName = element.tagName.toUpperCase();
  const innerContent = processNode(element, depth);

  switch (tagName) {
    case 'B':
    case 'STRONG':
      if (element.querySelector('pre')) return innerContent;
      return wrapInlineMarker(innerContent, '**');

    case 'I':
    case 'EM':
      if (element.querySelector('pre')) return innerContent;
      return wrapInlineMarker(innerContent, '_');

    case 'U':
      if (element.querySelector('pre')) return innerContent;
      return wrapInlineMarker(innerContent, '<u>', '</u>');

    case 'S':
    case 'STRIKE':
    case 'DEL':
      if (element.querySelector('pre')) return innerContent;
      return wrapInlineMarker(innerContent, '~~');

    case 'PRE': {
      const codeEl = element.querySelector('code') ?? element;
      const codeContent = extractCodeContent(codeEl);
      return `\`\`\`${codeContent}\`\`\``;
    }

    case 'CODE': {
      if (element.parentElement?.tagName === 'PRE') return innerContent;
      const codeText = extractCodeContent(element)
        .replace(/\u200B/g, '')
        .trim();
      if (!codeText) return '';
      if (codeText.includes('\n')) {
        return codeText
          .split('\n')
          .map(line => (line.trim() ? `\`${line}\`` : ''))
          .join('\n');
      }
      return `\`${codeText}\``;
    }

    case 'BLOCKQUOTE': {
      const lines = innerContent.split('\n');
      while (lines.length > 0 && (lines[lines.length - 1] ?? '').trim() === '') {
        lines.pop();
      }
      return lines.map(line => `> ${line}`).join('\n');
    }

    case 'A': {
      const href = element.getAttribute('href') ?? '';
      const text = innerContent || href;
      return `[${text}](${href})`;
    }

    case 'OL': {
      const startAttr = element.getAttribute('start');
      let index = startAttr ? parseInt(startAttr, 10) : 1;
      if (isNaN(index)) index = 1;
      let listResult = '';
      const indent = '    '.repeat(depth);
      for (const child of Array.from(element.childNodes)) {
        if (child.nodeType === Node.ELEMENT_NODE && (child as HTMLElement).tagName === 'LI') {
          const { text, nested } = extractListItemContent(child as HTMLElement, depth);
          const trimmed = text.replace(/\n/g, '').trim();
          if (trimmed) {
            listResult += `${indent}${String(index)}. ${text}\n`;
            index++;
          }
          if (nested) listResult += nested;
        }
      }
      return listResult;
    }

    case 'UL': {
      let listResult = '';
      const indent = '    '.repeat(depth);
      for (const child of Array.from(element.childNodes)) {
        if (child.nodeType === Node.ELEMENT_NODE && (child as HTMLElement).tagName === 'LI') {
          const { text, nested } = extractListItemContent(child as HTMLElement, depth);
          const trimmed = text.replace(/\n/g, '').trim();
          if (trimmed) {
            listResult += `${indent}• ${text}\n`;
          }
          if (nested) listResult += nested;
        }
      }
      return listResult;
    }

    case 'LI':
      return innerContent;

    case 'BR':
      return '\n';

    case 'P':
    case 'DIV':
      return innerContent + '\n';

    case 'SPAN': {
      const className = element.className || '';
      if (className.includes('cometchat-mentions')) {
        // Convert mention spans back to SDK format: <@uid:xxx> or <@all:xxx>
        const uid = element.getAttribute('data-uid') ?? '';
        const mentionType = element.getAttribute('data-mention-type') ?? '';
        if (uid === 'all' || mentionType === 'channel') {
          return `<@all:${uid}>`;
        }
        if (uid) {
          return `<@uid:${uid}>`;
        }
        return element.textContent ?? innerContent;
      }
      return innerContent;
    }

    default:
      return innerContent;
  }
}

function extractCodeContent(node: Node): string {
  let out = '';
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      out += child.textContent ?? '';
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as HTMLElement;
      const tag = el.tagName.toUpperCase();
      if (el.classList.contains('cometchat-mentions')) {
        // Convert mention spans back to SDK format
        const uid = el.getAttribute('data-uid') ?? '';
        const mentionType = el.getAttribute('data-mention-type') ?? '';
        if (uid === 'all' || mentionType === 'channel') {
          out += `<@all:${uid}>`;
        } else if (uid) {
          out += `<@uid:${uid}>`;
        } else {
          out += el.textContent ?? '';
        }
      } else if (tag === 'BR') {
        out += '\n';
      } else if (tag === 'DIV' || tag === 'P') {
        if (out.length > 0 && !out.endsWith('\n')) out += '\n';
        out += extractCodeContent(el);
      } else {
        out += extractCodeContent(el);
      }
    }
  }
  return out;
}

function extractListItemContent(li: HTMLElement, depth: number): { text: string; nested: string } {
  let text = '';
  let nested = '';
  for (const child of Array.from(li.childNodes)) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const tag = (child as HTMLElement).tagName.toUpperCase();
      if (tag === 'OL' || tag === 'UL') {
        nested += processChildNode(child, depth + 1);
      } else {
        text += processChildNode(child, depth);
      }
    } else {
      text += child.textContent ?? '';
    }
  }
  return { text, nested };
}

/**
 * Clean up markdown output.
 */
export function cleanMarkdown(markdown: string): string {
  return markdown
    .replace(/```(?:\u200B|\u200C|\u200D|\uFEFF|\s)*```/g, '')
    .replace(/(?<!`)`(?!`)(?:[^\S\n]|\u200B|\u200C|\u200D|\uFEFF)*`(?!`)/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Convert HTML to clean markdown (convenience function).
 */
export function convertHtmlToMarkdown(html: string): string {
  const markdown = htmlToMarkdown(html);
  return cleanMarkdown(markdown);
}
