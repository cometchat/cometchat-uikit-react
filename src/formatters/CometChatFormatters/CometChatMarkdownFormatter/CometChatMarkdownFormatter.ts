import { CometChatTextFormatter } from "../CometChatTextFormatter";
import { MentionsTargetElement } from "../../../Enums/Enums";

/**
 * CometChatMarkdownFormatter
 * 
 * Handles bidirectional conversion between HTML and markdown:
 * 
 * BUBBLE SIDE (getFormattedText): Markdown → HTML for display
 * - **bold** → <b>bold</b>
 * - _italic_ → <i>italic</i>
 * - <u>underline</u> → <u>underline</u> (pass-through)
 * - ~~strikethrough~~ → <s>strikethrough</s>
 * - `inline code` → <code>inline code</code>
 * - ```code block``` → <pre><code>code block</code></pre>
 * - > blockquote → <blockquote>blockquote</blockquote>
 * - [text](url) → <a href="url">text</a>
 * 
 * COMPOSER SIDE (getOriginalText): HTML → Markdown for storage
 * - <b>bold</b> → **bold**
 * - <i>italic</i> → _italic_
 * - <u>underline</u> → <u>underline</u>
 * - <s>strikethrough</s> → ~~strikethrough~~
 * - <code>code</code> → `code`
 * - <pre><code>code</code></pre> → ```code```
 * - <blockquote>text</blockquote> → > text
 * - <a href="url">text</a> → [text](url)
 */
export class CometChatMarkdownFormatter extends CometChatTextFormatter {
  constructor() {
    super();
    this.setId("markdown-formatter");
  }

  /**
   * BUBBLE SIDE: Convert markdown syntax to styled HTML for display
   */
  override getFormattedText(
      inputText: string,
      params?: { mentionsTargetElement?: MentionsTargetElement }
    ): string {
      if (!inputText) return inputText;

      // In conversation list context, strip markdown to plain text
      if (params?.mentionsTargetElement === MentionsTargetElement.conversation) {
        const result = this.stripMarkdownForConversation(inputText);
        return result;
      }

      let result = inputText;

      // Process code blocks first (```code```) - must be before inline code
      result = this.formatCodeBlocks(result);

      // Process blockquotes before inline code to prevent line splitting.
      // Use formatOutsideCodeBlocks (not formatOutsideCode) so mentions and inline code
      // backticks are preserved inside blockquote lines without being split out.
      result = this.formatOutsideCodeBlocks(result, (s) => this.formatBlockquotes(s));

      // Process inline code (`code`)
      result = this.formatInlineCode(result);

      // All subsequent formatting must skip content inside <pre><code> and <code> tags
      result = this.formatOutsideCode(result, (s) => this.formatBold(s));
      result = this.formatOutsideCode(result, (s) => this.formatUnderline(s));
      result = this.formatOutsideCode(result, (s) => this.formatItalic(s));
      result = this.formatOutsideCode(result, (s) => this.formatStrikethrough(s));
      result = this.formatOutsideCode(result, (s) => this.formatLinks(s));
      result = this.formatOutsideCode(result, (s) => this.formatOrderedLists(s));
      result = this.formatOutsideCode(result, (s) => this.formatUnorderedLists(s));

      return result;
    }

  /**
   * COMPOSER SIDE: Pass through unchanged.
   * HTML→Markdown conversion is handled exclusively by CometChatRichTextFormatter
   * (via HtmlToMarkdown.ts). Running a second conversion here would double-process
   * the text and corrupt mention spans before CometChatMentionsFormatter can replace
   * them with <@uid:xxx> tokens.
   */
  override getOriginalText(inputText: string | null | undefined): string {
    return inputText ?? "";
  }

  // ============ Markdown → HTML conversion methods ============

  /**
   * Format code blocks: ```code``` → <pre><code>code</code></pre>
   */
  private formatCodeBlocks(text: string): string {
    const result = text.replace(
      /```([\s\S]*?)```/g,
      '<pre><code>$1</code></pre>'
    );
    return result;
  }
  /**
   * Apply a formatting function only to text segments outside of code blocks.
   * Unlike formatOutsideCode, this does NOT split on inline <code> tags or mention placeholders.
   * Used for blockquote processing which runs before inline code conversion.
   */
  private formatOutsideCodeBlocks(text: string, formatter: (segment: string) => string): string {
      const codeBlockPattern = /(<pre><code>[\s\S]*?<\/code><\/pre>)/g;
      const parts = text.split(codeBlockPattern);
      return parts.map(part => {
        if (part.startsWith('<pre><code>')) {
          return part;
        }
        return formatter(part);
      }).join('');
    }

  /**
   * Apply a formatting function only to text segments outside of code blocks and inline code.
   * Splits the text by <pre><code>...</code></pre> and <code>...</code> segments,
   * applies the formatter only to non-code parts, then reassembles.
   */
  private formatOutsideCode(text: string, formatter: (segment: string) => string): string {
      // Split by <pre><code>...</code></pre>, <code>...</code>, and mention placeholders, preserving them
      const codePattern = /(<pre><code>[\s\S]*?<\/code><\/pre>|<code>[\s\S]*?<\/code>|<@uid:[^>]+>|<@all:[^>]+>)/g;
      const parts = text.split(codePattern);
      return parts.map(part => {
        // Code segments and mention placeholders — leave them untouched
        if (part.startsWith('<code>') || part.startsWith('<pre><code>') || part.startsWith('<@uid:') || part.startsWith('<@all:')) {
          return part;
        }
        return formatter(part);
      }).join('');
    }


  /**
   * Format inline code: `code` → <code>code</code>
   */
  private formatInlineCode(text: string): string {
    return text.replace(
      /`([^`]+)`/g,
      '<code>$1</code>'
    );
  }

  /**
   * Format bold: **text** → <b>text</b>
   */
  private formatBold(text: string): string {
    const result = text.replace(
      /\*\*([^*]+)\*\*/g,
      '<b>$1</b>'
    );
    return result;
  }

  /**
   * Format italic: _text_ → <i>text</i>
   */
  private formatItalic(text: string): string {
    return text.replace(
      /_([^_]+)_/g,
      '<i>$1</i>'
    );
  }

  /**
   * Format underline: <u>text</u> → <u>text</u>
   * The markdown syntax uses HTML-style <u> tags directly.
   * Also supports legacy ++text++ and __text__ for backward compatibility.
   */
  private formatUnderline(text: string): string {
    // Handle <u>text</u> (primary syntax - passes through as-is since it's already HTML)
    // Handle __text__ for backward compatibility
    let result = text.replace(
      /__([^_]+)__/g,
      '<u>$1</u>'
    );
    // Also handle ++text++ for backward compatibility
    result = result.replace(
      /\+\+([^+]+)\+\+/g,
      '<u>$1</u>'
    );
    return result;
  }

  /**
   * Format strikethrough: ~~text~~ → <s>text</s>
   */
  private formatStrikethrough(text: string): string {
    return text.replace(
      /~~([^~]+)~~/g,
      '<s>$1</s>'
    );
  }

  /**
   * Format links: [text](url) → <a href="url">text</a>
   */
  private formatLinks(text: string): string {
    return text.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );
  }

  /**
   * Format blockquotes: > text → <blockquote>text</blockquote>
   */
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
        // Match both literal > and HTML-entity-encoded &gt; (SDK may encode the >)
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

  /**
   * Format ordered lists: 1. item → <li>item</li>
   */
  /**
     * Format ordered lists: consecutive "N. item" lines → <ol><li>item</li></ol>
     */
    private formatOrderedLists(text: string): string {
      const lines = text.split('\n');
      const result: string[] = [];
      // Stack tracks open list tags at each depth level
      const depthStack: number[] = [];
      // Track which result entries are list HTML (should not have \n between them)
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

      for (const line of lines) {
        const match = line.match(/^( *)(\d+)\.\s+(.+)$/);
        if (match) {
          const leadingSpaces = match[1].length;
          const content = match[3];
          const currentDepth = Math.floor(leadingSpaces / 4);

          if (depthStack.length === 0) {
            // Start a new top-level list
            result.push(`<ol style="list-style-type: ${listStyleForDepth(0)}; font-family: var(--cometchat-font-family); padding-left: var(--cometchat-padding-5);">`);
            isListHtml.push(true);
            depthStack.push(0);
          }

          if (currentDepth > depthStack.length - 1) {
            // Nesting deeper — open nested <ol> inside the current <li>
            // Remove the closing </li> from the last item to nest inside it
            const lastLine = result[result.length - 1];
            if (lastLine && lastLine.endsWith('</li>')) {
              result[result.length - 1] = lastLine.slice(0, -5);
            }
            while (depthStack.length - 1 < currentDepth) {
              const d = depthStack.length;
              result.push(`<ol style="list-style-type: ${listStyleForDepth(d)}; font-family: var(--cometchat-font-family); padding-left: var(--cometchat-padding-5);">`);
              isListHtml.push(true);
              depthStack.push(d);
            }
          } else if (currentDepth < depthStack.length - 1) {
            // Coming back up — close nested lists
            closeToDepth(currentDepth + 1);
          }

          result.push(`<li>${content}</li>`);
          isListHtml.push(true);
        } else {
          // Non-list line — close all open lists
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

      // Close any remaining open lists
      if (depthStack.length > 0) {
        closeToDepth(0);
        result.push('</ol>');
        isListHtml.push(true);
      }

      // Join: no separator between consecutive list HTML entries,
      // newline between non-list lines
      let output = '';
      for (let i = 0; i < result.length; i++) {
        if (i > 0 && !(isListHtml[i] && isListHtml[i - 1])) {
          output += '\n';
        }
        output += result[i];
      }
      return output;
    }

  /**
   * Format unordered lists: • item or - item → <li>item</li>
   */
  /**
     * Format unordered lists: consecutive "• item" or "- item" lines → <ul><li>item</li></ul>
     */
    private formatUnorderedLists(text: string): string {
      const lines = text.split('\n');
      const result: string[] = [];
      // Stack tracks open list tags at each depth level
      const depthStack: number[] = [];
      // Track which result entries are list HTML (should not have \n between them)
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
        const match = line.match(/^( *)[•\-]\s+(.+)$/);
        if (match) {
          const leadingSpaces = match[1].length;
          const content = match[2];
          const currentDepth = Math.floor(leadingSpaces / 4);

          if (depthStack.length === 0) {
            // Start a new top-level list
            result.push(`<ul style="list-style-type: ${listStyleForDepth(0)}; font-family: var(--cometchat-font-family); padding-left: var(--cometchat-padding-5);">`);
            isListHtml.push(true);
            depthStack.push(0);
          }

          if (currentDepth > depthStack.length - 1) {
            // Nesting deeper — open nested <ul> inside the current <li>
            const lastLine = result[result.length - 1];
            if (lastLine && lastLine.endsWith('</li>')) {
              result[result.length - 1] = lastLine.slice(0, -5);
            }
            while (depthStack.length - 1 < currentDepth) {
              const d = depthStack.length;
              result.push(`<ul style="list-style-type: ${listStyleForDepth(d)}; font-family: var(--cometchat-font-family); padding-left: var(--cometchat-padding-5);">`);
              isListHtml.push(true);
              depthStack.push(d);
            }
          } else if (currentDepth < depthStack.length - 1) {
            // Coming back up — close nested lists
            closeToDepth(currentDepth + 1);
          }

          result.push(`<li>${content}</li>`);
          isListHtml.push(true);
        } else {
          // Non-list line — close all open lists
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

      // Close any remaining open lists
      if (depthStack.length > 0) {
        closeToDepth(0);
        result.push('</ul>');
        isListHtml.push(true);
      }

      // Join: no separator between consecutive list HTML entries,
      // newline between non-list lines
      let output = '';
      for (let i = 0; i < result.length; i++) {
        if (i > 0 && !(isListHtml[i] && isListHtml[i - 1])) {
          output += '\n';
        }
        output += result[i];
      }
      return output;
    }

  /**
   * Register click handlers for links
   */
  override registerEventListeners(
    span: Element,
    classList: DOMTokenList
  ): Element {
    return span;
  }
  public stripMarkdownForConversation(text: string): string {
        let result = text;

        // Strip zero-width spaces (U+200B) inserted by contenteditable
        result = result.replace(/\u200B/g, '');

        // Handle code blocks and inline code on the full text BEFORE splitting
        // into lines, because they can span multiple lines.
        // Strip code blocks: ```content``` → content (flatten for subtitle)
        result = result.replace(/```([\s\S]*?)```/g, '$1');
        // Convert inline code: `content` → <code>content</code> ([\s\S] to span newlines)
        result = result.replace(/`([\s\S]+?)`/g, '<code>$1</code>');

        // Process remaining formatting line by line
        const lines = result.split('\n');
        const processedLines = lines.map((line) => {
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



}

