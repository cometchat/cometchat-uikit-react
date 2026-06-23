import { CometChatTextFormatter } from './CometChatTextFormatter';

/**
 * CometChatRichTextFormatter
 *
 * Converts HTML from the contenteditable composer to markdown for storage/transmission.
 *
 * This formatter runs on the COMPOSER SIDE only. It takes the rich HTML produced
 * by the RichTextEditor and converts it to markdown before the message is sent.
 *
 * Conversion rules:
 * - <b>, <strong> → **text**
 * - <i>, <em> → _text_
 * - <u> → <u>text</u> (HTML-style underline, no standard markdown equivalent)
 * - <s>, <strike>, <del> → ~~text~~
 * - <code> (not in pre) → `text`
 * - <pre><code> → ```text```
 * - <blockquote> → > text
 * - <a href="url">text</a> → [text](url)
 * - <ol><li> → 1. text
 * - <ul><li> → • text
 * - <br> → \n
 * - <div>, <p> → \n
 *
 * Priority is set high (200) so it runs AFTER other formatters in the pipeline.
 */
export class CometChatRichTextFormatter extends CometChatTextFormatter {
  readonly id = 'rich-text-formatter';
  override priority = 200;

  getRegex(): RegExp {
    return /<(b|strong|i|em|u|s|strike|del|code|pre|blockquote|a|ol|ul|li|br|div|p)[^>]*>/i;
  }

  /**
   * Only format if the input contains HTML tags that need conversion.
   */
  override shouldFormat(text: string): boolean {
    return this.getRegex().test(text);
  }

  format(text: string): string {
    if (!text) {
      this.originalText = '';
      this.formattedText = '';
      return '';
    }

    this.originalText = text;

    // If no HTML tags, pass through
    if (!this.shouldFormat(text)) {
      this.formattedText = text;
      return text;
    }

    // Use DOM parsing to convert HTML → markdown
    const markdown = this.htmlToMarkdown(text);
    this.formattedText = this.cleanMarkdown(markdown);
    return this.formattedText;
  }

  // ─── HTML → Markdown Conversion ────────────────────────────────────────

  private htmlToMarkdown(html: string): string {
    // SSR safety: check for document
    if (typeof document === 'undefined') {
      return this.fallbackHtmlToMarkdown(html);
    }

    const container = document.createElement('div');
    container.innerHTML = html;
    return this.processNode(container);
  }

  private processNode(node: Node, depth = 0): string {
    let result = '';
    for (const child of Array.from(node.childNodes)) {
      result += this.processChildNode(child, depth);
    }
    return result;
  }

  private processChildNode(node: Node, depth = 0): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent ?? '';
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }

    const element = node as HTMLElement;
    const tagName = element.tagName.toUpperCase();
    const innerContent = this.processNode(element, depth);

    switch (tagName) {
      case 'B':
      case 'STRONG':
        if (element.querySelector('pre')) return innerContent;
        return this.wrapPerLine(innerContent, '**', '**');

      case 'I':
      case 'EM':
        if (element.querySelector('pre')) return innerContent;
        return this.wrapPerLine(innerContent, '_', '_');

      case 'U':
        if (element.querySelector('pre')) return innerContent;
        return this.wrapPerLine(innerContent, '<u>', '</u>');

      case 'S':
      case 'STRIKE':
      case 'DEL':
        if (element.querySelector('pre')) return innerContent;
        return this.wrapPerLine(innerContent, '~~', '~~');

      case 'PRE': {
        const codeEl = element.querySelector('code') ?? element;
        const codeContent = this.extractCodeContent(codeEl, false);
        return `\`\`\`\n${codeContent}\n\`\`\``;
      }

      case 'CODE': {
        if (element.parentElement?.tagName === 'PRE') return innerContent;
        // Check if code contains a link — output as a link (link styling takes precedence)
        const hasLink = element.querySelector('a') !== null;
        if (hasLink) {
          const linkEl = element.querySelector('a');
          if (linkEl) {
            const href = linkEl.getAttribute('href') ?? '';
            const linkText = linkEl.textContent ?? href;
            return `[${linkText}](${href})`;
          }
        }
        const codeText = this.extractCodeContent(element, true)
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
        const linkText = innerContent || href;
        return `[${linkText}](${href})`;
      }

      case 'OL': {
        const startAttr = element.getAttribute('start');
        let index = startAttr ? parseInt(startAttr, 10) : 1;
        if (isNaN(index)) index = 1;
        let listResult = '';
        const indent = '    '.repeat(depth);
        for (const child of Array.from(element.childNodes)) {
          if (child.nodeType === Node.ELEMENT_NODE && (child as HTMLElement).tagName === 'LI') {
            const { text: textContent, nested } = this.extractListItemContent(
              child as HTMLElement,
              depth
            );
            const trimmed = textContent.replace(/\n/g, '').trim();
            if (trimmed) {
              const marker = this.getOrderedListMarker(index, depth);
              listResult += `${indent}${marker} ${textContent}\n`;
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
            const { text: textContent, nested } = this.extractListItemContent(
              child as HTMLElement,
              depth
            );
            const trimmed = textContent.replace(/\n/g, '').trim();
            if (trimmed) {
              listResult += `${indent}• ${textContent}\n`;
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
        // Convert mention spans back to SDK format: <@uid:xxx> or <@all:xxx>
        if (className.includes('cometchat-mentions')) {
          const uid = element.getAttribute('data-uid') ?? '';
          const mentionType = element.getAttribute('data-mention-type') ?? '';
          if (uid === 'all' || mentionType === 'channel') {
            return `<@all:${uid}>`;
          }
          if (uid) {
            return `<@uid:${uid}>`;
          }
          // Fallback: return the visible text (e.g. @Name)
          return element.textContent ?? innerContent;
        }
        return innerContent;
      }

      default:
        return innerContent;
    }
  }

  // ─── Helpers ───────────────────────────────────────────────────────────

  /**
   * Get the ordered list marker based on nesting depth.
   * depth 0: 1. 2. 3. (decimal)
   * depth 1: a. b. c. (lower-alpha)
   * depth 2: i. ii. iii. (lower-roman)
   * depth 3+: cycles back through the pattern
   */
  private getOrderedListMarker(index: number, depth: number): string {
    const level = depth % 3;
    switch (level) {
      case 0:
        return `${String(index)}.`;
      case 1:
        return `${this.numberToLowerAlpha(index)}.`;
      case 2:
        return `${this.numberToLowerRoman(index)}.`;
      default:
        return `${String(index)}.`;
    }
  }

  private numberToLowerAlpha(n: number): string {
    let result = '';
    let num = n;
    while (num > 0) {
      num--;
      result = String.fromCharCode(97 + (num % 26)) + result;
      num = Math.floor(num / 26);
    }
    return result;
  }

  private numberToLowerRoman(n: number): string {
    const values = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
    const symbols = ['m', 'cm', 'd', 'cd', 'c', 'xc', 'l', 'xl', 'x', 'ix', 'v', 'iv', 'i'];
    let result = '';
    let num = n;
    for (let i = 0; i < values.length; i++) {
      while (num >= (values[i] ?? 0)) {
        result += symbols[i] ?? '';
        num -= values[i] ?? 0;
      }
    }
    return result;
  }

  /**
   * Wrap inline markers per-line to handle block elements nested inside inline tags.
   */
  private wrapPerLine(content: string, open: string, close: string): string {
    if (!content.includes('\n')) {
      return `${open}${content}${close}`;
    }
    return content
      .split('\n')
      .map(line => (line.trim() === '' ? line : `${open}${line}${close}`))
      .join('\n');
  }

  /**
   * Extract text content from a code element, preserving structure.
   * For inline code: preserves inline formatting (bold/italic/underline/strikethrough)
   * by converting them to markdown markers.
   * For code blocks (pre): strips all formatting to plain text.
   */
  private extractCodeContent(node: Node, preserveFormatting = false): string {
    let out = '';
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        out += child.textContent ?? '';
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as HTMLElement;
        const tag = el.tagName.toUpperCase();
        if (el.classList.contains('cometchat-mentions')) {
          if (preserveFormatting) {
            // Inside inline code: treat mentions as plain text (not clickable)
            out += el.textContent ?? '';
          } else {
            // Inside code block: convert mention spans back to SDK format
            const uid = el.getAttribute('data-uid') ?? '';
            const mentionType = el.getAttribute('data-mention-type') ?? '';
            if (uid === 'all' || mentionType === 'channel') {
              out += `<@all:${uid}>`;
            } else if (uid) {
              out += `<@uid:${uid}>`;
            } else {
              out += el.textContent ?? '';
            }
          }
        } else if (tag === 'BR') {
          out += '\n';
        } else if (tag === 'DIV' || tag === 'P') {
          if (out.length > 0 && !out.endsWith('\n')) out += '\n';
          out += this.extractCodeContent(el, preserveFormatting);
        } else if (preserveFormatting) {
          // Preserve inline formatting inside inline code
          const innerText = this.extractCodeContent(el, true);
          switch (tag) {
            case 'B':
            case 'STRONG':
              out += `**${innerText}**`;
              break;
            case 'I':
            case 'EM':
              out += `_${innerText}_`;
              break;
            case 'U':
              out += `<u>${innerText}</u>`;
              break;
            case 'S':
            case 'STRIKE':
            case 'DEL':
              out += `~~${innerText}~~`;
              break;
            case 'A': {
              const href = el.getAttribute('href') ?? '';
              out += `[${innerText}](${href})`;
              break;
            }
            default:
              out += innerText;
              break;
          }
        } else {
          out += this.extractCodeContent(el, false);
        }
      }
    }
    return out;
  }

  /**
   * Extract text and nested list content from a <li> element.
   * Treats <div>/<p>/<br> inside list items as inline (space separator) rather than
   * block (newline) since browsers wrap inline content in divs inside <li>.
   */
  private extractListItemContent(li: HTMLElement, depth: number): { text: string; nested: string } {
    let text = '';
    let nested = '';
    for (const child of Array.from(li.childNodes)) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const tag = (child as HTMLElement).tagName.toUpperCase();
        if (tag === 'OL' || tag === 'UL') {
          nested += this.processChildNode(child, depth + 1);
        } else if (tag === 'DIV' || tag === 'P') {
          // Flatten div/p inside list items — treat as inline content
          const innerContent = this.processNode(child as HTMLElement, depth);
          // Only add space separator if there's already content (avoid leading spaces)
          if (text && innerContent.trim()) {
            text += ' ';
          }
          text += innerContent.replace(/\n$/, '');
        } else if (tag === 'BR') {
          // Treat <br> inside list items as space (not newline) to keep content on one line
          if (text && !text.endsWith(' ')) {
            text += ' ';
          }
        } else {
          text += this.processChildNode(child, depth);
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
  private cleanMarkdown(markdown: string): string {
    return markdown
      .replace(/```\n?(?:\u200B|\u200C|\u200D|\uFEFF|\s)*\n?```/g, '')
      .replace(/(?<!`)`(?!`)(?:[^\S\n]|\u200B|\u200C|\u200D|\uFEFF)*`(?!`)/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /**
   * Fallback for SSR environments where document is not available.
   * Does basic regex-based HTML stripping.
   */
  private fallbackHtmlToMarkdown(html: string): string {
    let result = html;
    result = result.replace(/<br\s*\/?>/gi, '\n');
    result = result.replace(/<\/?(div|p)>/gi, '\n');
    result = result.replace(/<b>(.*?)<\/b>/gi, '**$1**');
    result = result.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
    result = result.replace(/<i>(.*?)<\/i>/gi, '_$1_');
    result = result.replace(/<em>(.*?)<\/em>/gi, '_$1_');
    result = result.replace(/<s>(.*?)<\/s>/gi, '~~$1~~');
    result = result.replace(/<del>(.*?)<\/del>/gi, '~~$1~~');
    result = result.replace(/<code>(.*?)<\/code>/gi, '`$1`');
    result = result.replace(/<a\s+href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');
    result = result.replace(/<[^>]+>/g, '');
    return result;
  }
}
