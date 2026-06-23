import { CometChatTextFormatter } from './CometChatTextFormatter';
import { escapeUserHtml } from '../utils/sanitizeHtml';

/**
 * CometChatMarkdownFormatter
 *
 * Handles markdown → HTML conversion for display in message bubbles.
 *
 * Supported syntax:
 * - **bold** → <b>bold</b>
 * - _italic_ → <i>italic</i>
 * - __underline__ or ++underline++ → <u>underline</u>
 * - ~~strikethrough~~ → <s>strikethrough</s>
 * - `inline code` → <code>inline code</code>
 * - ```code block``` → <pre><code>code block</code></pre>
 * - > blockquote → <blockquote>blockquote</blockquote>
 * - [text](url) → <a href="url">text</a>
 * - 1. item → <ol><li>item</li></ol>
 * - • item / - item → <ul><li>item</li></ul>
 *
 * This formatter runs FIRST in the pipeline (priority 10) so that
 * subsequent formatters (mentions, URLs) operate on the HTML output.
 */
export class CometChatMarkdownFormatter extends CometChatTextFormatter {
  readonly id = 'markdown-formatter';
  override priority = 10;

  getRegex(): RegExp {
    return /(\*\*|__|~~|`|>|\[.*?\]\(.*?\)|(?:\d+|[a-z]|[ivxlcdm]+)\.\s|[•-]\s)/g;
  }

  format(text: string): string {
    if (!text) {
      this.originalText = '';
      this.formattedText = '';
      return '';
    }

    this.originalText = text;
    let result = text;

    // Process code blocks first (```code```) — must be before inline code
    result = this.formatCodeBlocks(result);

    // Process blockquotes before inline code to prevent line splitting.
    // Use formatOutsideCodeBlocks (not formatOutsideCode) so mentions and inline code
    // backticks are preserved inside blockquote lines without being split out.
    result = this.formatOutsideCodeBlocks(result, s => this.formatBlockquotes(s));

    // Process inline formatting BEFORE inline code conversion.
    // This ensures markers like **_`text`_** are resolved correctly —
    // if we converted inline code first, the bold/italic markers would be split
    // across <code> tag boundaries and fail to match.
    result = this.formatOutsideCodeBlocks(result, s => this.formatBold(s));
    result = this.formatOutsideCodeBlocks(result, s => this.formatUnderline(s));
    result = this.formatOutsideCodeBlocks(result, s => this.formatItalic(s));
    result = this.formatOutsideCodeBlocks(result, s => this.formatStrikethrough(s));

    // Process lists and links BEFORE inline code conversion too.
    // If inline code is converted first, formatOutsideCode splits by <code> tags,
    // which breaks list items that contain inline code (e.g., `• text \`code\``
    // becomes split into separate segments and the list regex can't match).
    result = this.formatOutsideCodeBlocks(result, s => this.formatLinks(s));
    result = this.formatOutsideCodeBlocks(result, s => this.formatOrderedLists(s));
    result = this.formatOutsideCodeBlocks(result, s => this.formatUnorderedLists(s));

    // Process inline code (`code`) LAST among inline conversions
    result = this.formatInlineCode(result);

    this.formattedText = result;
    return this.formattedText;
  }

  // ─── Code Blocks ───────────────────────────────────────────────────────

  private formatCodeBlocks(text: string): string {
    return text.replace(/```\n?([\s\S]*?)\n?```/g, '<pre><code>$1</code></pre>');
  }

  /**
   * Apply a formatting function only to text segments outside of code blocks.
   * Unlike formatOutsideCode, this does NOT split on inline <code> tags or mention placeholders.
   * Used for blockquote processing which runs before inline code conversion.
   */
  private formatOutsideCodeBlocks(text: string, formatter: (segment: string) => string): string {
    // Protect mention tokens from being mangled by formatting regexes
    // (e.g., underscores in UIDs like <@uid:under_score> triggering italic)
    const mentionTokens: string[] = [];
    const mentionPattern = /(<@uid:[^>]+>|<@all:[^>]+>)/g;
    const protectedText = text.replace(mentionPattern, match => {
      const idx = mentionTokens.length;
      mentionTokens.push(match);
      return `\u200B\uFFFCMTKN${String(idx)}\uFFFC\u200B`;
    });

    const codeBlockPattern = /(<pre><code>[\s\S]*?<\/code><\/pre>)/g;
    const parts = protectedText.split(codeBlockPattern);
    let result = parts
      .map(part => (part.startsWith('<pre><code>') ? part : formatter(part)))
      .join('');

    // Restore mention tokens
    result = result.replace(/\u200B\uFFFCMTKN(\d+)\uFFFC\u200B/g, (_, idx: string) => {
      return mentionTokens[parseInt(idx, 10)] ?? '';
    });

    return result;
  }

  /**
   * Apply a formatting function only to text segments outside of code blocks and inline code.
   * Splits the text by <pre><code>...</code></pre> and <code>...</code> segments,
   * applies the formatter only to non-code parts, then reassembles.
   */
  private formatOutsideCode(text: string, formatter: (segment: string) => string): string {
    // Temporarily replace mention tokens with placeholders so formatting markers
    // that span across mentions (e.g., **hello <@uid:123> world**) are not broken.
    // The mention content itself won't get formatting applied because it's replaced
    // with a placeholder during formatting, then restored after.
    const mentionTokens: string[] = [];
    const mentionPattern = /(<@uid:[^>]+>|<@all:[^>]+>)/g;
    const textWithPlaceholders = text.replace(mentionPattern, match => {
      const idx = mentionTokens.length;
      mentionTokens.push(match);
      return `\u200B\uFFFCMTKN${String(idx)}\uFFFC\u200B`;
    });

    // Split by <pre><code>...</code></pre> and <code>...</code>, preserving them
    const codePattern = /(<pre><code>[\s\S]*?<\/code><\/pre>|<code>[\s\S]*?<\/code>)/g;
    const parts = textWithPlaceholders.split(codePattern);
    let result = parts
      .map(part => {
        // Code segments — leave them untouched
        if (part.startsWith('<code>') || part.startsWith('<pre><code>')) {
          return part;
        }
        return formatter(part);
      })
      .join('');

    // Restore mention tokens from placeholders
    result = result.replace(/\u200B\uFFFCMTKN(\d+)\uFFFC\u200B/g, (_, idx) => {
      return mentionTokens[parseInt(idx as string, 10)] ?? '';
    });

    return result;
  }

  private formatInlineCode(text: string): string {
    return text.replace(/`([^`]+)`/g, '<code>$1</code>');
  }

  // ─── Inline Formatting ─────────────────────────────────────────────────

  private formatBold(text: string): string {
    return text.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  }

  private formatItalic(text: string): string {
    return text.replace(/_([^_]+)_/g, '<i>$1</i>');
  }

  private formatUnderline(text: string): string {
    let result = text.replace(/__([^_]+)__/g, '<u>$1</u>');
    result = result.replace(/\+\+([^+]+)\+\+/g, '<u>$1</u>');
    return result;
  }

  private formatStrikethrough(text: string): string {
    return text.replace(/~~([^~]+)~~/g, '<s>$1</s>');
  }

  private formatLinks(text: string): string {
    return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label: string, rawUrl: string) => {
      const href = this.normalizeLinkUrl(rawUrl);
      // Dangerous scheme — drop the link but keep the visible text.
      if (!href) return label;
      // The `cometchat-link` class is what the text bubble's click handler keys off of
      // to open the URL; without it a non-http(s) (scheme-less) link is not clickable.
      return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="cometchat-link">${label}</a>`;
    });
  }

  private normalizeLinkUrl(rawUrl: string): string {
    const url = rawUrl.trim();
    if (!url) return '';

    // Strip whitespace/control chars that can obfuscate the scheme (e.g. "java\tscript:").
    const compact = Array.from(url)
      .filter(ch => ch.charCodeAt(0) > 0x20)
      .join('')
      .toLowerCase();
    if (/^(?:javascript|data|vbscript|file):/.test(compact)) return '';

    let href = url;
    const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(href); // http:, https:, mailto:, tel:, …
    const isAnchorOrRelative =
      /^[#/?]/.test(href) || href.startsWith('./') || href.startsWith('../');
    if (!hasScheme && !isAnchorOrRelative) {
      href = `https://${href}`;
    }

    return href.replace(/"/g, '&quot;');
  }

  // ─── Block Formatting ──────────────────────────────────────────────────

  private formatBlockquotes(text: string): string {
    const lines = text.split('\n');
    const result: string[] = [];
    let blockquoteGroup: string[] = [];

    const flushGroup = () => {
      if (blockquoteGroup.length === 0) return;
      let innerContent = blockquoteGroup.join('\n');
      innerContent = this.formatOrderedLists(innerContent);
      innerContent = this.formatUnorderedLists(innerContent);
      result.push('<blockquote>' + innerContent + '</blockquote>');
      blockquoteGroup = [];
    };

    for (const line of lines) {
      if (/^>\s?/.test(line) || /^&gt;\s?/.test(line)) {
        blockquoteGroup.push(line.replace(/^(?:&gt;|>)\s?/, ''));
      } else {
        flushGroup();
        result.push(line);
      }
    }
    flushGroup();

    return result.join('\n');
  }

  private formatOrderedLists(text: string): string {
    const lines = text.split('\n');
    const result: string[] = [];
    const depthStack: number[] = [];
    const isListHtml: boolean[] = [];

    const listStyleForDepth = (d: number): string => {
      if (d === 0) return 'decimal';
      if (d === 1) return 'lower-alpha';
      return 'lower-roman';
    };

    const closeToDepth = (targetDepth: number) => {
      while (depthStack.length > targetDepth) {
        depthStack.pop();
        result.push('</ol></li>');
        isListHtml.push(true);
      }
    };

    // Match ordered list items: digits (1. 2.), alpha (a. b. c.), or roman (i. ii. iii. iv.)
    const orderedListRegex = /^( *)(?:(\d+)\.|([a-z])\.|([ivxlcdm]+)\.)\s+(.+)$/;

    /**
     * Determine list depth from the marker type and indentation.
     * - Decimal markers (1. 2.) → depth from indentation (base depth 0)
     * - Alpha markers (a. b.) → depth from indentation + 1 (at minimum depth 1)
     * - Roman markers (i. ii.) → depth from indentation + 2 (at minimum depth 2)
     *   BUT only treated as roman if indentation >= 8 spaces OR we're already nested at depth ≥ 2.
     *   Otherwise single-letter roman numerals like "i." are treated as alpha.
     */
    const getDepthFromMarker = (
      leadingSpaces: number,
      decimal: string | undefined,
      alpha: string | undefined,
      roman: string | undefined
    ): number => {
      const indentDepth = Math.floor(leadingSpaces / 4);
      if (decimal) return indentDepth;
      if (
        roman &&
        (indentDepth >= 2 ||
          (depthStack.length > 0 && (depthStack[depthStack.length - 1] ?? 0) >= 1))
      ) {
        return Math.max(indentDepth, 2);
      }
      if (alpha) return Math.max(indentDepth, 1);
      return indentDepth;
    };

    for (const line of lines) {
      const match = orderedListRegex.exec(line);
      if (match) {
        const leadingSpaces = match[1]?.length ?? 0;
        const decimal = match[2];
        const alpha = match[3];
        const roman = match[4];
        const content = match[5];
        const currentDepth = getDepthFromMarker(leadingSpaces, decimal, alpha, roman);

        if (depthStack.length === 0) {
          result.push(
            `<ol style="list-style-type: ${listStyleForDepth(0)}; list-style-position: inside; padding: 0; margin: 0;">`
          );
          isListHtml.push(true);
          depthStack.push(0);
        }

        if (currentDepth > depthStack.length - 1) {
          const lastLine = result[result.length - 1];
          if (lastLine?.endsWith('</li>')) {
            result[result.length - 1] = lastLine.slice(0, -5);
          }
          while (depthStack.length - 1 < currentDepth) {
            const d = depthStack.length;
            result.push(
              `<ol style="list-style-type: ${listStyleForDepth(d)}; list-style-position: inside; padding: 0; margin: 0;">`
            );
            isListHtml.push(true);
            depthStack.push(d);
          }
        } else if (currentDepth < depthStack.length - 1) {
          closeToDepth(currentDepth + 1);
        }

        result.push(
          `<li style="display: list-item; padding-left: 1.5em; text-indent: -1.5em; margin: 0;">${content ?? ''}</li>`
        );
        isListHtml.push(true);
      } else {
        if (depthStack.length > 0) {
          closeToDepth(0);
          result.push('</ol>');
          isListHtml.push(true);
          depthStack.length = 0;
        }
        result.push(line);
        isListHtml.push(false);
      }
    }

    if (depthStack.length > 0) {
      closeToDepth(0);
      result.push('</ol>');
      isListHtml.push(true);
    }

    let output = '';
    for (let i = 0; i < result.length; i++) {
      if (i > 0 && !(isListHtml[i] && isListHtml[i - 1])) {
        output += '\n';
      }
      output += result[i] ?? '';
    }
    return output;
  }

  private formatUnorderedLists(text: string): string {
    const lines = text.split('\n');
    const result: string[] = [];
    const depthStack: number[] = [];
    const isListHtml: boolean[] = [];

    const listStyleForDepth = (d: number): string => {
      if (d === 0) return 'disc';
      if (d === 1) return 'circle';
      return 'square';
    };

    const closeToDepth = (targetDepth: number) => {
      while (depthStack.length > targetDepth) {
        depthStack.pop();
        result.push('</ul></li>');
        isListHtml.push(true);
      }
    };

    for (const line of lines) {
      const match = /^( *)[•-]\s+(.+)$/.exec(line);
      if (match) {
        const leadingSpaces = match[1]?.length ?? 0;
        const content = match[2];
        const currentDepth = Math.floor(leadingSpaces / 4);

        if (depthStack.length === 0) {
          result.push(
            `<ul style="list-style-type: ${listStyleForDepth(0)}; list-style-position: inside; padding: 0; margin: 0;">`
          );
          isListHtml.push(true);
          depthStack.push(0);
        }

        if (currentDepth > depthStack.length - 1) {
          const lastLine = result[result.length - 1];
          if (lastLine?.endsWith('</li>')) {
            result[result.length - 1] = lastLine.slice(0, -5);
          }
          while (depthStack.length - 1 < currentDepth) {
            const d = depthStack.length;
            result.push(
              `<ul style="list-style-type: ${listStyleForDepth(d)}; list-style-position: inside; padding: 0; margin: 0;">`
            );
            isListHtml.push(true);
            depthStack.push(d);
          }
        } else if (currentDepth < depthStack.length - 1) {
          closeToDepth(currentDepth + 1);
        }

        result.push(
          `<li style="display: list-item; padding-left: 1.5em; text-indent: -1.5em; margin: 0;">${content ?? ''}</li>`
        );
        isListHtml.push(true);
      } else {
        if (depthStack.length > 0) {
          closeToDepth(0);
          result.push('</ul>');
          isListHtml.push(true);
          depthStack.length = 0;
        }
        result.push(line);
        isListHtml.push(false);
      }
    }

    if (depthStack.length > 0) {
      closeToDepth(0);
      result.push('</ul>');
      isListHtml.push(true);
    }

    let output = '';
    for (let i = 0; i < result.length; i++) {
      if (i > 0 && !(isListHtml[i] && isListHtml[i - 1])) {
        output += '\n';
      }
      output += result[i] ?? '';
    }
    return output;
  }

  /**
   * Strip markdown for conversation subtitle display.
   * Converts markdown to simple HTML (bold, italic, etc.) without block-level elements.
   */
  public stripMarkdownForConversation(text: string): string {
    let result = text;

    // Strip zero-width spaces (U+200B) inserted by contenteditable
    result = result.replace(/\u200B/g, '');

    // SECURITY: output is injected via dangerouslySetInnerHTML in previews — escape
    // raw HTML so tags become inert text (preserves mentions and <u>).
    result = escapeUserHtml(result);

    // Handle code blocks and inline code on the full text BEFORE splitting
    // into lines, because they can span multiple lines.
    // Strip code blocks: ```content``` → content (flatten for subtitle)
    result = result.replace(/```\n?([\s\S]*?)\n?```/g, '$1');
    // Convert inline code: `content` → <code>content</code>
    result = result.replace(/`([\s\S]+?)`/g, '<code>$1</code>');

    // Normalize ordered list markers: convert indented numeric markers (1.) to
    // depth-appropriate markers (a. for depth 1, i. for depth 2).
    // This handles old messages that stored all levels as "1."
    result = this.normalizeOrderedListMarkers(result);

    // Process remaining formatting line by line
    const lines = result.split('\n');
    const processedLines = lines.map(line => {
      let r = line;

      // Convert bold: **content** → <b>content</b>
      r = r.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');

      // Convert underline: __content__ or ++content++ → <u>content</u>
      r = r.replace(/__([^_]+)__/g, '<u>$1</u>');
      r = r.replace(/\+\+([^+]+)\+\+/g, '<u>$1</u>');

      // Convert italic: _content_ → <i>content</i>
      r = r.replace(/_([^_]+)_/g, '<i>$1</i>');

      // Convert strikethrough: ~~content~~ → <s>content</s>
      r = r.replace(/~~([^~]+)~~/g, '<s>$1</s>');

      // Strip links: [text](url) → text
      r = r.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

      // Strip blockquotes: > text → text
      r = r.replace(/^(?:&gt;|>)\s?/, '');

      return r;
    });

    return processedLines.join('\n');
  }

  /**
   * Normalize ordered list markers so indented items show correct depth markers.
   * Handles backward compatibility: old messages store all levels as "1. 2. 3."
   * regardless of nesting. This converts them based on indentation:
   * - depth 0 (no indent): keep numeric (1. 2. 3.)
   * - depth 1 (4 spaces): convert to alpha (a. b. c.)
   * - depth 2 (8 spaces): convert to roman (i. ii. iii.)
   */
  private normalizeOrderedListMarkers(text: string): string {
    const lines = text.split('\n');
    // Track counters per depth level to assign correct sequential markers
    const depthCounters: number[] = [0, 0, 0];
    let prevDepth = -1;

    const numberToAlpha = (n: number): string => {
      let result = '';
      let num = n;
      while (num > 0) {
        num--;
        result = String.fromCharCode(97 + (num % 26)) + result;
        num = Math.floor(num / 26);
      }
      return result;
    };

    const numberToRoman = (n: number): string => {
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
    };

    const processedLines = lines.map(line => {
      // Match ordered list item: leading spaces + number/alpha/roman + dot + space + content
      const match = /^( *)(?:(\d+)\.|([a-z])\.|([ivxlcdm]+)\.)\s+(.+)$/.exec(line);
      if (!match) {
        // Non-list line resets counters
        prevDepth = -1;
        depthCounters[0] = 0;
        depthCounters[1] = 0;
        depthCounters[2] = 0;
        return line;
      }

      const leadingSpaces = match[1]?.length ?? 0;
      const content = match[5] ?? '';
      const depth = Math.min(Math.floor(leadingSpaces / 4), 2);

      // If already has alpha/roman marker, it's already correct (new format)
      if (match[3] || match[4]) {
        // Already has correct marker — just track the depth
        prevDepth = depth;
        return line;
      }

      // Numeric marker — check if it needs conversion based on depth
      if (depth === 0) {
        // Top-level: keep as numeric
        if (prevDepth < 0 || depth <= prevDepth) {
          // Same or higher level — counter continues or resets
        }
        prevDepth = depth;
        return line;
      }

      // Reset deeper counters when going back up
      if (depth <= prevDepth) {
        for (let d = depth + 1; d < depthCounters.length; d++) {
          depthCounters[d] = 0;
        }
      }
      // Reset this level's counter if we're entering it fresh from a shallower depth
      if (depth > prevDepth) {
        depthCounters[depth] = 0;
      }

      depthCounters[depth] = (depthCounters[depth] ?? 0) + 1;
      prevDepth = depth;

      const indent = '    '.repeat(depth);
      const count = depthCounters[depth] ?? 1;
      if (depth === 1) {
        return `${indent}${numberToAlpha(count)}. ${content}`;
      }
      if (depth >= 2) {
        return `${indent}${numberToRoman(count)}. ${content}`;
      }
      return line;
    });

    return processedLines.join('\n');
  }
}
