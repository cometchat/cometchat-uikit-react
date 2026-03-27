import { emojiToShortcode } from './EmojiShortcodeUtils';

/**
 * HTML to Markdown Converter
 * 
 * Converts rich text HTML from the message composer to markdown
 * for storage and transmission.
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
 * Convert HTML string to markdown
 */
export function htmlToMarkdown(html: string): string {
  if (!html) return "";

  // Create a temporary container to parse HTML
  const container = document.createElement("div");
  container.innerHTML = html;

  // Process the DOM tree and convert to markdown
  return processNode(container).trim();
}

/**
 * Process a DOM node and its children, converting to markdown
 */
function processNode(node: Node, depth: number = 0): string {
  let result = "";

  for (let i = 0; i < node.childNodes.length; i++) {
    const child = node.childNodes[i];
    result += processChildNode(child, depth);
  }

  return result;
}

/**
 * Process a single child node
 */
function processChildNode(node: Node, depth: number = 0): string {
  // Text node - return text content
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent || "";
  }


  // Element node - process based on tag
  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as HTMLElement;
    const tagName = element.tagName.toUpperCase();
    const innerContent = processNode(element, depth);

    switch (tagName) {
      // Bold
      case "B":
      case "STRONG":
        return `**${innerContent}**`;

      // Italic
      case "I":
      case "EM":
        return `_${innerContent}_`;

      // Underline - use <u> HTML tag syntax
      case "U":
        return `<u>${innerContent}</u>`;

      // Strikethrough
      case "S":
      case "STRIKE":
      case "DEL":
        return `~~${innerContent}~~`;

      // Code block
      case "PRE": {
        const codeEl = element.querySelector("code");
        const sourceEl = codeEl || element;
        // Process children to preserve mention spans as raw HTML
        let codeContent = '';
        for (let i = 0; i < sourceEl.childNodes.length; i++) {
          const child = sourceEl.childNodes[i];
          if (child.nodeType === Node.TEXT_NODE) {
            codeContent += child.textContent || '';
          } else if (child.nodeType === Node.ELEMENT_NODE) {
            const childEl = child as HTMLElement;
            // Preserve mention spans as raw HTML so the mentions formatter can find them
            if (childEl.classList.contains('cometchat-mentions')) {
              codeContent += childEl.outerHTML;
            } else {
              codeContent += childEl.textContent || '';
            }
          }
        }
        return `\`\`\`${emojiToShortcode(codeContent)}\`\`\``;
      }

      // Inline code (only if not inside pre)
      case "CODE": {
        // Check if parent is PRE - if so, skip (handled by PRE)
        if (element.parentElement?.tagName === "PRE") {
          return innerContent;
        }
        // Use textContent to flatten all children (including mention spans) to plain text
        return `\`${emojiToShortcode(element.textContent || '')}\``;
      }

      // Blockquote
      case "BLOCKQUOTE": {
        // Add > prefix to each line, stripping empty trailing lines first
        const lines = innerContent.split("\n");
        while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
          lines.pop();
        }
        return lines.map((line) => `> ${line}`).join("\n");
      }

      // Links
      case "A": {
        const href = element.getAttribute("href") || "";
        const text = innerContent || href;
        return `[${text}](${href})`;
      }

      // Ordered list
      case "OL": {
        let index = 1;
        let listResult = "";
        const indent = "    ".repeat(depth);
        let trailingContent = "";
        for (let i = 0; i < element.childNodes.length; i++) {
          const child = element.childNodes[i];
          if (child.nodeType === Node.ELEMENT_NODE && (child as HTMLElement).tagName === "LI") {
            let textContent = "";
            let nestedListContent = "";
            for (let j = 0; j < child.childNodes.length; j++) {
              const liChild = child.childNodes[j];
              if (liChild.nodeType === Node.ELEMENT_NODE) {
                const liChildTag = (liChild as HTMLElement).tagName.toUpperCase();
                if (liChildTag === "OL" || liChildTag === "UL") {
                  nestedListContent += processChildNode(liChild, depth + 1);
                } else {
                  textContent += processChildNode(liChild, depth);
                }
              } else {
                textContent += liChild.textContent || "";
              }
            }
            const trimmed = textContent.replace(/\n/g, '').trim();
            if (trimmed) {
              listResult += `${indent}${index}. ${textContent}\n`;
              index++;
            }
            if (nestedListContent) {
              listResult += nestedListContent;
            }
          } else {
            const extra = processChildNode(child, depth);
            if (extra.trim()) {
              trailingContent += extra;
            }
          }
        }
        if (trailingContent.trim()) {
          if (listResult) {
            listResult = listResult.replace(/\n$/, '') + trailingContent + "\n";
          } else {
            listResult = `${indent}${index}. ${trailingContent}\n`;
          }
        }
        return listResult;
      }

      // Unordered list
      case "UL": {
        let listResult = "";
        const indent = "    ".repeat(depth);
        let trailingContent = "";
        for (let i = 0; i < element.childNodes.length; i++) {
          const child = element.childNodes[i];
          if (child.nodeType === Node.ELEMENT_NODE && (child as HTMLElement).tagName === "LI") {
            let textContent = "";
            let nestedListContent = "";
            for (let j = 0; j < child.childNodes.length; j++) {
              const liChild = child.childNodes[j];
              if (liChild.nodeType === Node.ELEMENT_NODE) {
                const liChildTag = (liChild as HTMLElement).tagName.toUpperCase();
                if (liChildTag === "OL" || liChildTag === "UL") {
                  nestedListContent += processChildNode(liChild, depth + 1);
                } else {
                  textContent += processChildNode(liChild, depth);
                }
              } else {
                textContent += liChild.textContent || "";
              }
            }
            const trimmed = textContent.replace(/\n/g, '').trim();
            if (trimmed) {
              listResult += `${indent}• ${textContent}\n`;
            }
            if (nestedListContent) {
              listResult += nestedListContent;
            }
          } else {
            const extra = processChildNode(child, depth);
            if (extra.trim()) {
              trailingContent += extra;
            }
          }
        }
        if (trailingContent.trim()) {
          if (listResult) {
            listResult = listResult.replace(/\n$/, '') + trailingContent + "\n";
          } else {
            listResult = `${indent}• ${trailingContent}\n`;
          }
        }
        return listResult;
      }

      // List item - just return content (handled by OL/UL)
      case "LI":
        return innerContent;

      // Line breaks
      case "BR":
        return "\n";

      // Paragraphs and divs - add newline after
      case "P":
      case "DIV":
        return innerContent + "\n";

      // Spans - check for formatting classes
      case "SPAN": {
        const className = element.className || "";
        
        // Preserve mention spans as raw HTML so the mentions formatter can replace them with <@uid:xxx> tokens
        if (className.includes("cometchat-mentions")) {
          return element.outerHTML;
        }
        
        // Check for rich text formatting classes
        if (className.includes("cometchat-rich-text-code-inline")) {
          return `\`${innerContent}\``;
        }
        if (className.includes("cometchat-rich-text-code-block")) {
          return `\`\`\`${innerContent}\`\`\``;
        }
        
        // Default - just return inner content
        return innerContent;
      }

      // Default - return inner content
      default:
        return innerContent;
    }
  }

  return "";
}

/**
 * Remove escape backslashes from markdown text before sending.
 * Preserves literal markdown characters that were escaped by the user.
 * 
 * Rules:
 * - Single backslash before markdown character: remove backslash, keep character
 * - Even number of backslashes: keep half of them (they escape each other)
 * - Odd number of backslashes: keep (n-1)/2 backslashes, last one escapes the markdown char
 * 
 * Examples:
 * - \* → *
 * - \\* → \*
 * - \\\* → \*
 * - \\\\* → \\*
 * 
 * @param text - Markdown text that may contain escape sequences
 * @returns Text with escape backslashes removed
 */
export function removeEscapeBackslashes(text: string): string {
  if (!text) return text;
  
  // Markdown characters that can be escaped
  const markdownChars = ['*', '_', '~', '`', '[', ']', '(', ')', '#', '+', '-', '.', '!', '|', '{', '}'];
  
  let result = '';
  let i = 0;
  
  while (i < text.length) {
    const char = text[i];
    
    if (char === '\\') {
      // Count consecutive backslashes
      let backslashCount = 0;
      let j = i;
      while (j < text.length && text[j] === '\\') {
        backslashCount++;
        j++;
      }
      
      // Check if the character after backslashes is a markdown character
      const nextChar = j < text.length ? text[j] : '';
      const isMarkdownChar = markdownChars.includes(nextChar);
      
      if (isMarkdownChar) {
        // Odd number of backslashes: (n-1)/2 backslashes remain, last one escapes the markdown char
        // Even number of backslashes: n/2 backslashes remain, markdown char is not escaped
        const remainingBackslashes = Math.floor(backslashCount / 2);
        result += '\\'.repeat(remainingBackslashes);
        
        // If odd number, the markdown char was escaped - include it
        if (backslashCount % 2 === 1) {
          result += nextChar;
          i = j + 1; // Skip past the markdown char
        } else {
          // Even number - markdown char is not escaped, will be processed normally
          i = j; // Don't skip the markdown char
        }
      } else {
        // Not followed by markdown char - keep all backslashes
        result += '\\'.repeat(backslashCount);
        i = j;
      }
    } else {
      result += char;
      i++;
    }
  }
  
  return result;
}

/**
 * Clean up markdown output
 * - Remove excessive newlines
 * - Trim whitespace
 */
export function cleanMarkdown(markdown: string): string {
  return markdown
    .replace(/\n{3,}/g, "\n\n") // Max 2 consecutive newlines
    .replace(/^\s+|\s+$/g, ""); // Trim
}

/**
 * Convert HTML to clean markdown
 * Removes escape backslashes before sending (Requirement 12.2)
 */
export function convertHtmlToMarkdown(html: string): string {
  const markdown = htmlToMarkdown(html);
  const cleaned = cleanMarkdown(markdown);
  // Remove escape backslashes before sending the message
  return removeEscapeBackslashes(cleaned);
}
