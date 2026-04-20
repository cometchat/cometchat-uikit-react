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

      // Process inline formatting BEFORE inline code conversion so that
      // formatting markers spanning across backtick segments are matched
      // before <code> tags fragment them. Use formatOutsideCodeBlocks since
      // only <pre><code> blocks exist at this point (no inline <code> yet).
      result = this.formatOutsideCodeBlocks(result, (s) => this.formatBold(s));
      result = this.formatOutsideCodeBlocks(result, (s) => this.formatUnderline(s));
      result = this.formatOutsideCodeBlocks(result, (s) => this.formatItalic(s));
      result = this.formatOutsideCodeBlocks(result, (s) => this.formatStrikethrough(s));
      result = this.formatOutsideCodeBlocks(result, (s) => this.formatLinks(s));

      // List formatting runs before inline code so that list-item lines are matched
      // in full (e.g. "1. `code` text") before <code> tags fragment them.
      // Process both ordered and unordered lists in a single pass so interleaved
      // items (e.g. 1,2,3,•,4,5,6) maintain alignment and numbering continuity.
      result = this.formatOutsideCodeBlocks(result, (s) => this.formatLists(s));

      // Process inline code (`code`) after lists so <li> content is already wrapped
      result = this.formatInlineCode(result);

      // Move formatting tags from outside <code> to inside it so they render
      // visually in monospace fonts (CSS inheritance of font-weight/font-style
      // is unreliable across monospace font families).
      result = this.moveFormattingInsideCode(result);

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
      (_match, content) => {
        // Skip empty code blocks — strip zero-width spaces and other invisible chars
        const stripped = content?.replace(/[\u200B\u200C\u200D\uFEFF]/g, '').trim();
        if (!stripped) {
          return '';
        }
        // Trim leading/trailing whitespace and zero-width chars from edges only
        const trimmed = content?.replace(/^[\s\u200B\u200C\u200D\uFEFF]+|[\s\u200B\u200C\u200D\uFEFF]+$/g, '');
        return `<pre><code>${trimmed}</code></pre>`;
      }
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
      // Temporarily replace mention tokens with placeholders so formatting markers
      // that span across mentions (e.g., **hello <@uid:123> world**) are not broken
      const mentionTokens: string[] = [];
      const mentionPattern = /(<@uid:[^>]+>|<@all:[^>]+>)/g;
      let textWithPlaceholders = text.replace(mentionPattern, (match) => {
        const idx = mentionTokens.length;
        mentionTokens.push(match);
        return `\u200B\uFFFCMTKN${idx}\uFFFC\u200B`;
      });

      // Split by <pre><code>...</code></pre> and <code>...</code>, preserving them
      const codePattern = /(<pre><code>[\s\S]*?<\/code><\/pre>|<code>[\s\S]*?<\/code>)/g;
      const parts = textWithPlaceholders.split(codePattern);
      let result = parts.map(part => {
        // Code segments — leave them untouched
        if (part.startsWith('<code>') || part.startsWith('<pre><code>')) {
          return part;
        }
        return formatter(part);
      }).join('');

      // Restore mention tokens from placeholders
      result = result.replace(/\u200B\uFFFCMTKN(\d+)\uFFFC\u200B/g, (_, idx) => {
        return mentionTokens[parseInt(idx, 10)];
      });

      return result;
    }


  /**
   * Format inline code: `code` → <code>code</code>
   * Excludes newlines from the captured group to prevent matching across line breaks.
   * Also converts any remaining formatting markers inside the backtick content
   * to HTML, since the earlier formatting pass may miss markers adjacent to
   * backticks due to lookbehind/lookahead boundary constraints.
   */
  private formatInlineCode(text: string): string {
    return text.replace(
      /`([^`\n]+)`/g,
      (_match, content: string) => {
        let c = content;
        // Convert formatting markers that may not have been caught by the
        // earlier pass (e.g. italic `_text_` where _ is adjacent to backtick)
        c = c.replace(/\*\*([^*\n]+)\*\*/g, '<b>$1</b>');
        c = c.replace(/__([^_\n]+)__/g, '<u>$1</u>');
        c = c.replace(/(?:^|(?<=[>\s]))_([^_\n]+)_(?=[<\s]|$)/gm, '<i>$1</i>');
        // Fallback: italic markers at backtick boundaries (no whitespace/tag neighbor)
        c = c.replace(/^_([^_\n]+)_$/gm, '<i>$1</i>');
        c = c.replace(/~~([^~\n]+)~~/g, '<s>$1</s>');
        return `<code>${c}</code>`;
      }
    );
  }

  /**
   * Move formatting tags from outside <code> to inside it.
   * Transforms <b><code>text</code></b> → <code><b>text</b></code>
   * This ensures formatting renders visually inside monospace code spans,
   * since CSS inheritance of font-weight/font-style is unreliable across
   * monospace font families.
   * Handles nested formatting: <b><i><code>text</code></i></b> → <code><b><i>text</i></b></code>
   */
  private moveFormattingInsideCode(text: string): string {
    // Match one or more nested formatting tags wrapping a <code>...</code>
    // Pattern: (<tag>)+ <code>content</code> (</tag>)+
    const formattingTagPattern = /(<(?:b|i|u|s|strong|em|del)>)+(<code>)([\s\S]*?)(<\/code>)(<\/(?:b|i|u|s|strong|em|del)>)+/gi;
    return text.replace(formattingTagPattern, (_match, _openTags, _codeOpen, content, _codeClose, _closeTags) => {
      // Extract all opening and closing formatting tags
      const openTags = _match.match(/^(<(?:b|i|u|s|strong|em|del)>)+/i)?.[0] || '';
      const closeTags = _match.match(/(<\/(?:b|i|u|s|strong|em|del)>)+$/i)?.[0] || '';
      return `<code>${openTags}${content}${closeTags}</code>`;
    });
  }

  /**
   * Format bold: **text** → <b>text</b>
   * Excludes newlines from the captured group to prevent matching across line breaks.
   */
  private formatBold(text: string): string {
    const result = text.replace(
      /\*\*([^*\n]+)\*\*/g,
      '<b>$1</b>'
    );
    return result;
  }

  /**
   * Format italic: _text_ → <i>text</i>
   * Requires whitespace, start-of-line, or an HTML tag closing (>) before opening _
   * and whitespace, end-of-line, or an HTML tag opening (<) after closing _
   * to avoid matching underscores inside URLs (e.g., this_is_a_path)
   * Excludes newlines from the captured group to prevent matching across line breaks.
   */
  private formatItalic(text: string): string {
    return text.replace(
      /(?:^|(?<=[\s>]))_([^_\n]+)_(?=[\s<]|$)/gm,
      '<i>$1</i>'
    );
  }

  /**
   * Format underline: <u>text</u> → <u>text</u>
   * The markdown syntax uses HTML-style <u> tags directly.
   * Also supports legacy ++text++ and __text__ for backward compatibility.
   * Excludes newlines from the captured groups to prevent matching across line breaks.
   */
  private formatUnderline(text: string): string {
    // Handle <u>text</u> (primary syntax - passes through as-is since it's already HTML)
    // Handle __text__ for backward compatibility — require word boundaries to avoid URLs
    let result = text.replace(
      /(?:^|(?<=[\s>]))__([^_\n]+)__(?=[\s<]|$)/gm,
      '<u>$1</u>'
    );
    // Also handle ++text++ for backward compatibility
    result = result.replace(
      /\+\+([^+\n]+)\+\+/g,
      '<u>$1</u>'
    );
    return result;
  }

  /**
   * Format strikethrough: ~~text~~ → <s>text</s>
   * Excludes newlines from the captured group to prevent matching across line breaks.
   */
  private formatStrikethrough(text: string): string {
    return text.replace(
      /~~([^~\n]+)~~/g,
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
   * Combined list formatter: processes both ordered and unordered list items
   * in a single pass so interleaved items maintain alignment and numbering
   * continuity (e.g. 1,2,3,•,4,5,6 instead of 1,2,3,•,1,2,3).
   * Requires at least 2 consecutive list lines (of any type) to trigger formatting.
   */
  private formatLists(text: string): string {
    const lines = text.split('\n');
    const olPattern = /^( *)(\d+)\.\s+(.+)$/;
    const ulPattern = /^( *)[•\-]\s+(.+)$/;

    // Classify each line
    type LineInfo = { type: 'ol'; match: RegExpMatchArray } | { type: 'ul'; match: RegExpMatchArray } | { type: 'none' };
    const lineInfos: LineInfo[] = lines.map(line => {
      const olMatch = line.match(olPattern);
      if (olMatch) return { type: 'ol' as const, match: olMatch };
      const ulMatch = line.match(ulPattern);
      if (ulMatch) return { type: 'ul' as const, match: ulMatch };
      return { type: 'none' as const };
    });

    // Mark lines that belong to a consecutive group of 2+ list items (any type).
    // Bridge across empty lines so that list groups separated by blank lines
    // are still treated as one logical group.
    const isInListGroup: boolean[] = new Array(lines.length).fill(false);
    let i = 0;
    while (i < lines.length) {
      if (lineInfos[i].type !== 'none') {
        const groupStart = i;
        let j = i;
        let listItemCount = 0;
        while (j < lines.length) {
          if (lineInfos[j].type !== 'none') {
            listItemCount++;
            j++;
          } else if (lines[j].trim() === '') {
            // Empty line — bridge over it if more list items follow
            let k = j;
            while (k < lines.length && lines[k].trim() === '') k++;
            if (k < lines.length && lineInfos[k].type !== 'none') {
              j = k; // skip empty lines, continue with next list item
            } else {
              break;
            }
          } else {
            break;
          }
        }
        if (listItemCount >= 2) {
          for (let k = groupStart; k < j; k++) {
            if (lineInfos[k].type !== 'none') isInListGroup[k] = true;
          }
        }
        i = j;
      } else {
        i++;
      }
    }

    const result: string[] = [];
    const isListHtml: boolean[] = [];
    // Track running count of top-level ordered list items for numbering continuity
    let runningOlItemCount = 0;

    // Stack tracks open list tags at each depth level: { depth, type }
    const depthStack: { depth: number; type: 'ol' | 'ul' }[] = [];

    const olStyleForDepth = (d: number): string => {
      if (d === 0) return 'decimal';
      if (d === 1) return 'lower-alpha';
      return 'lower-roman';
    };

    const ulStyleForDepth = (d: number): string => {
      if (d === 0) return 'disc';
      if (d === 1) return 'circle';
      return 'square';
    };

    const closeToDepth = (targetDepth: number) => {
      while (depthStack.length > targetDepth) {
        const popped = depthStack.pop()!;
        const tag = popped.type === 'ol' ? 'ol' : 'ul';
        result.push(`</${tag}></li>`);
        isListHtml.push(true);
      }
    };


    for (let idx = 0; idx < lines.length; idx++) {
      const info = lineInfos[idx];

      if (!isInListGroup[idx]) {
        // Non-list line — close all open lists
        if (depthStack.length > 0) {
          const rootTag = depthStack[0].type === 'ul' ? 'ul' : 'ol';
          closeToDepth(0);
          result.push(`</${rootTag}>`);
          isListHtml.push(true);
          depthStack.length = 0;
        }
        // Only reset running count for lines with actual content.
        if (lines[idx].trim() !== '') {
          runningOlItemCount = 0;
        }
        result.push(lines[idx]);
        isListHtml.push(false);
        continue;
      }

      const listType = info.type as 'ol' | 'ul';
      const match = (info as { type: 'ol' | 'ul'; match: RegExpMatchArray }).match;
      const leadingSpaces = match[1].length;
      const content = listType === 'ol' ? match[3] : match[2];
      const currentDepth = Math.floor(leadingSpaces / 4);

      if (depthStack.length === 0) {
        // Start a new root list
        if (listType === 'ol') {
          const startValue = runningOlItemCount + 1;
          const startAttr = startValue !== 1 ? ` start="${startValue}"` : '';
          result.push(`<ol${startAttr} style="list-style-type: ${olStyleForDepth(0)}; list-style-position: inside; font-family: var(--cometchat-font-family);">`);
        } else {
          result.push(`<ul style="list-style-type: ${ulStyleForDepth(0)}; list-style-position: inside; font-family: var(--cometchat-font-family);">`);
        }
        isListHtml.push(true);
        depthStack.push({ depth: 0, type: listType });
      } else if (currentDepth > depthStack[depthStack.length - 1].depth) {
        // Nesting deeper — open nested list inside the current <li>
        // Remove the closing </li> from the last item to nest inside it
        const lastLine = result[result.length - 1];
        if (lastLine && lastLine.endsWith('</li>')) {
          result[result.length - 1] = lastLine.slice(0, -5);
        }
        // Open nested lists up to the target depth
        while (depthStack[depthStack.length - 1].depth < currentDepth) {
          const d = depthStack.length;
          if (listType === 'ol') {
            result.push(`<ol style="list-style-type: ${olStyleForDepth(d)}; list-style-position: inside; font-family: var(--cometchat-font-family);">`);
          } else {
            result.push(`<ul style="list-style-type: ${ulStyleForDepth(d)}; list-style-position: inside; font-family: var(--cometchat-font-family);">`);
          }
          isListHtml.push(true);
          depthStack.push({ depth: depthStack[depthStack.length - 1].depth + 1, type: listType });
        }
      } else if (currentDepth < depthStack[depthStack.length - 1].depth) {
        // Coming back up — close nested lists down to the target depth
        while (depthStack.length > 1 && depthStack[depthStack.length - 1].depth > currentDepth) {
          const popped = depthStack.pop()!;
          const tag = popped.type === 'ol' ? 'ol' : 'ul';
          result.push(`</${tag}></li>`);
          isListHtml.push(true);
        }
        // If the list type changed at this depth, close and reopen
        if (depthStack.length > 0 && depthStack[depthStack.length - 1].type !== listType) {
          const popped = depthStack[depthStack.length - 1];
          const oldTag = popped.type === 'ol' ? 'ol' : 'ul';
          if (depthStack.length === 1) {
            // Root level — close and reopen
            result.push(`</${oldTag}>`);
            isListHtml.push(true);
            depthStack.pop();
            if (listType === 'ol') {
              const startValue = runningOlItemCount + 1;
              const startAttr = startValue !== 1 ? ` start="${startValue}"` : '';
              result.push(`<ol${startAttr} style="list-style-type: ${olStyleForDepth(0)}; list-style-position: inside; font-family: var(--cometchat-font-family);">`);
            } else {
              result.push(`<ul style="list-style-type: ${ulStyleForDepth(0)}; list-style-position: inside; font-family: var(--cometchat-font-family);">`);
            }
            isListHtml.push(true);
            depthStack.push({ depth: 0, type: listType });
          }
        }
      } else {
        // Same depth — check if list type changed
        if (depthStack.length > 0 && depthStack[depthStack.length - 1].type !== listType) {
          if (depthStack.length === 1) {
            // Root level type change — close old, open new
            const oldTag = depthStack[0].type === 'ol' ? 'ol' : 'ul';
            result.push(`</${oldTag}>`);
            isListHtml.push(true);
            depthStack.pop();
            if (listType === 'ol') {
              const startValue = runningOlItemCount + 1;
              const startAttr = startValue !== 1 ? ` start="${startValue}"` : '';
              result.push(`<ol${startAttr} style="list-style-type: ${olStyleForDepth(0)}; list-style-position: inside; font-family: var(--cometchat-font-family);">`);
            } else {
              result.push(`<ul style="list-style-type: ${ulStyleForDepth(0)}; list-style-position: inside; font-family: var(--cometchat-font-family);">`);
            }
            isListHtml.push(true);
            depthStack.push({ depth: 0, type: listType });
          } else {
            // Nested level type change — close current nested, open new type
            const popped = depthStack.pop()!;
            const oldTag = popped.type === 'ol' ? 'ol' : 'ul';
            result.push(`</${oldTag}>`);
            isListHtml.push(true);
            const d = depthStack.length;
            if (listType === 'ol') {
              result.push(`<ol style="list-style-type: ${olStyleForDepth(d)}; list-style-position: inside; font-family: var(--cometchat-font-family);">`);
            } else {
              result.push(`<ul style="list-style-type: ${ulStyleForDepth(d)}; list-style-position: inside; font-family: var(--cometchat-font-family);">`);
            }
            isListHtml.push(true);
            depthStack.push({ depth: currentDepth, type: listType });
          }
        }
      }

      // Only count top-level ordered items for running total
      if (currentDepth === 0 && listType === 'ol') {
        runningOlItemCount++;
      }
      result.push(`<li>${content}</li>`);
      isListHtml.push(true);
    }

    // Close any remaining open lists
    if (depthStack.length > 0) {
      const rootTag = depthStack[0].type === 'ol' ? 'ol' : 'ul';
      closeToDepth(0);
      result.push(`</${rootTag}>`);
      isListHtml.push(true);
      depthStack.length = 0;
    }

    // Join: no separator between consecutive list HTML entries,
    // newline between non-list lines
    let output = '';
    for (let idx = 0; idx < result.length; idx++) {
      if (idx > 0 && !(isListHtml[idx] && isListHtml[idx - 1])) {
        output += '\n';
      }
      output += result[idx];
    }
    return output;
  }

  /**
     * Format ordered lists: consecutive "N. item" lines → <ol><li>item</li></ol>
     * Requires at least 2 consecutive matching lines to trigger list formatting.
     * A single line like "123456. text" stays as plain text.
     */
    private formatOrderedLists(text: string): string {
      const lines = text.split('\n');

      // Pre-scan: identify which lines match the ordered-list pattern
      const listPattern = /^( *)(\d+)\.\s+(.+)$/;
      // Pattern to detect unordered list items (used to preserve numbering
      // continuity when ordered lists are interrupted by bullet points)
      const unorderedPattern = /^( *)[•\-]\s+(.+)$/;
      const matches: (RegExpMatchArray | null)[] = lines.map(l => l.match(listPattern));

      // Mark lines that belong to a consecutive group of 2+ ordered-list matches.
      // Also bridge across unordered list items: if ordered groups are separated
      // only by unordered list lines, treat them as one logical group so that
      // even a single trailing ordered item (e.g. "4. e" after "• d") is included.
      const isInListGroup: boolean[] = new Array(lines.length).fill(false);
      let i = 0;
      while (i < lines.length) {
        if (matches[i]) {
          // Found start of an ordered run — scan forward, bridging over
          // unordered list lines to find the full extent of the logical group
          const groupStart = i;
          let j = i;
          let orderedCount = 0;
          while (j < lines.length) {
            if (matches[j]) {
              orderedCount++;
              j++;
            } else if (unorderedPattern.test(lines[j])) {
              // Unordered line — bridge over it, but only if there are more
              // ordered items after it
              let k = j;
              while (k < lines.length && unorderedPattern.test(lines[k])) k++;
              if (k < lines.length && matches[k]) {
                // More ordered items follow — bridge over the unordered gap
                j = k;
              } else {
                break;
              }
            } else {
              break;
            }
          }
          if (orderedCount >= 2) {
            for (let k = groupStart; k < j; k++) {
              if (matches[k]) isInListGroup[k] = true;
            }
          }
          i = j;
        } else {
          i++;
        }
      }

      const result: string[] = [];
      // Stack tracks open list tags at each depth level
      const depthStack: number[] = [];
      // Track which result entries are list HTML (should not have \n between them)
      const isListHtml: boolean[] = [];
      // Track the running count of top-level ordered list items for numbering
      // continuity when ordered lists are interrupted by unordered list items
      let runningOlItemCount = 0;

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

      for (let idx = 0; idx < lines.length; idx++) {
        const line = lines[idx];
        const match = matches[idx];
        if (match && isInListGroup[idx]) {
          const leadingSpaces = match[1].length;
          const content = match[3];
          const currentDepth = Math.floor(leadingSpaces / 4);

          if (depthStack.length === 0) {
            // Start a new top-level list — use running count to maintain
            // numbering continuity when ordered lists are interrupted by
            // unordered list items (e.g. 1,2,3,•,4,5,6 not 1,2,3,•,1,2,3)
            const startValue = runningOlItemCount + 1;
            const startAttr = startValue !== 1 ? ` start="${startValue}"` : '';
            result.push(`<ol${startAttr} style="list-style-type: ${listStyleForDepth(0)}; list-style-position: inside; font-family: var(--cometchat-font-family);">`);
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
              result.push(`<ol style="list-style-type: ${listStyleForDepth(d)}; list-style-position: inside; font-family: var(--cometchat-font-family);">`);
              isListHtml.push(true);
              depthStack.push(d);
            }
          } else if (currentDepth < depthStack.length - 1) {
            // Coming back up — close nested lists
            closeToDepth(currentDepth + 1);
          }

          // Only count top-level items for running total
          if (currentDepth === 0) {
            runningOlItemCount++;
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
          // Reset running count if this line is NOT an unordered list item.
          // Unordered items between ordered groups should not reset numbering,
          // allowing continuity like 1,2,3,•,4,5,6
          if (!unorderedPattern.test(line) && line.trim() !== '') {
            runningOlItemCount = 0;
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
     * Requires at least 2 consecutive matching lines to trigger list formatting.
     * A single line like "- text" stays as plain text.
     */
    private formatUnorderedLists(text: string): string {
      const lines = text.split('\n');

      // Pre-scan: identify which lines match the unordered-list pattern
      const listPattern = /^( *)[•\-]\s+(.+)$/;
      const matches: (RegExpMatchArray | null)[] = lines.map(l => l.match(listPattern));

      // Mark lines that belong to a consecutive group of 2+ matches
      const isInListGroup: boolean[] = new Array(lines.length).fill(false);
      let i = 0;
      while (i < lines.length) {
        if (matches[i]) {
          let j = i;
          while (j < lines.length && matches[j]) j++;
          if (j - i >= 2) {
            for (let k = i; k < j; k++) isInListGroup[k] = true;
          }
          i = j;
        } else {
          i++;
        }
      }

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

      for (let idx = 0; idx < lines.length; idx++) {
        const line = lines[idx];
        const match = matches[idx];
        if (match && isInListGroup[idx]) {
          const leadingSpaces = match[1].length;
          const content = match[2];
          const currentDepth = Math.floor(leadingSpaces / 4);

          if (depthStack.length === 0) {
            // Start a new top-level list
            result.push(`<ul style="list-style-type: ${listStyleForDepth(0)}; list-style-position: inside; font-family: var(--cometchat-font-family);">`);
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
              result.push(`<ul style="list-style-type: ${listStyleForDepth(d)}; list-style-position: inside; font-family: var(--cometchat-font-family);">`);
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
        // Convert inline code: `content` → <code>content</code>
        // Process formatting markers inside backtick content BEFORE wrapping
        // so that `**bold**` becomes <code><b>bold</b></code>
        result = result.replace(/`([\s\S]+?)`/g, (_match, content: string) => {
          let c = content;
          c = c.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
          c = c.replace(/__([^_]+)__/g, '<u>$1</u>');
          c = c.replace(/\+\+([^+]+)\+\+/g, '<u>$1</u>');
          c = c.replace(/_([^_]+)_/g, '<i>$1</i>');
          c = c.replace(/~~([^~]+)~~/g, '<s>$1</s>');
          return `<code>${c}</code>`;
        });

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

        // Renumber ordered list items to maintain continuity across unordered
        // list interruptions (e.g. 1,2,3,•,1,2,3 → 1,2,3,•,4,5,6)
        const olPattern = /^(\d+)\.\s+/;
        const ulPattern = /^[•\-]\s+/;
        let runningCount = 0;
        for (let i = 0; i < processedLines.length; i++) {
          const olMatch = processedLines[i].match(olPattern);
          if (olMatch) {
            runningCount++;
            // Replace the original number with the running count
            processedLines[i] = processedLines[i].replace(olPattern, `${runningCount}. `);
          } else if (ulPattern.test(processedLines[i])) {
            // Unordered list item — keep running count going
          } else if (processedLines[i].trim() === '') {
            // Empty line — keep running count going
          } else {
            // Non-list line with content — reset count
            runningCount = 0;
          }
        }

        return processedLines.join('\n');
      }
}
