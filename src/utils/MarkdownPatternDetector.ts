/**
 * MarkdownPatternDetector - Utility for detecting and validating markdown syntax patterns
 * in contenteditable elements for automatic conversion to rich text formatting.
 */

/**
 * Represents a markdown pattern definition
 */
export interface MarkdownPattern {
  type: 'bold' | 'italic' | 'underline' | 'strikethrough' | 'codeInline' | 'codeBlock' | 'link';
  openDelimiter: string;
  closeDelimiter: string;
  priority: number; // Higher priority patterns checked first
  /** If true, use custom detection logic instead of standard delimiter matching */
  customDetection?: boolean;
}

/**
 * Represents a detected markdown pattern match
 */
export interface PatternMatch {
  pattern: MarkdownPattern;
  startOffset: number;    // Position of opening delimiter
  endOffset: number;      // Position of closing delimiter
  contentStart: number;   // Position after opening delimiter
  contentEnd: number;     // Position before closing delimiter
  content: string;        // Text between delimiters
  linkUrl?: string;       // URL for link patterns
}

/**
 * Context information for pattern detection
 */
export interface DetectionContext {
  text: string;           // Full text content
  cursorOffset: number;   // Current cursor position
  triggerChar: string;    // Character that triggered detection
  scopeStart: number;     // Start of current scope (paragraph/line)
  scopeEnd: number;       // End of current scope
}

/**
 * Supported markdown patterns ordered by priority (highest first)
 */
export const MARKDOWN_PATTERNS: MarkdownPattern[] = [
  {
    type: 'codeBlock',
    openDelimiter: '```',
    closeDelimiter: '```',
    priority: 6 // Highest priority (longest delimiter)
  },
  {
    type: 'underline',
    openDelimiter: '<u>',
    closeDelimiter: '</u>',
    priority: 5 // HTML-style underline
  },
  {
    type: 'bold',
    openDelimiter: '**',
    closeDelimiter: '**',
    priority: 4 // Double asterisk checked before single
  },
  {
    type: 'strikethrough',
    openDelimiter: '~~',
    closeDelimiter: '~~',
    priority: 3
  },
  {
    type: 'link',
    openDelimiter: '[',
    closeDelimiter: ')',
    priority: 2,
    customDetection: true // Uses [text](url) pattern
  },
  {
    type: 'codeInline',
    openDelimiter: '`',
    closeDelimiter: '`',
    priority: 1
  },
  {
    type: 'italic',
    openDelimiter: '_',
    closeDelimiter: '_',
    priority: 0
  }
];

/**
 * Map of trigger characters to their associated patterns for efficient lookup
 */
export const TRIGGER_CHARS: Record<string, MarkdownPattern[]> = {
  '*': MARKDOWN_PATTERNS.filter(p => p.closeDelimiter.endsWith('*')),
  '_': MARKDOWN_PATTERNS.filter(p => p.closeDelimiter.endsWith('_')),
  '~': MARKDOWN_PATTERNS.filter(p => p.closeDelimiter.endsWith('~')),
  '`': MARKDOWN_PATTERNS.filter(p => p.closeDelimiter.endsWith('`')),
  '>': MARKDOWN_PATTERNS.filter(p => p.closeDelimiter === '</u>'),
  ')': MARKDOWN_PATTERNS.filter(p => p.type === 'link'),
};

/**
 * Detects markdown patterns in text at cursor position
 * 
 * @param context - Detection context with text, cursor position, and scope boundaries
 * @returns PatternMatch if valid pattern found, null otherwise
 */
export function detectMarkdownPattern(
  context: DetectionContext
): PatternMatch | null {
  const { text, cursorOffset, triggerChar, scopeStart, scopeEnd } = context;
  
  // Get patterns that match the trigger character, sorted by priority (highest first)
  const candidatePatterns = TRIGGER_CHARS[triggerChar];
  if (!candidatePatterns || candidatePatterns.length === 0) {
    return null;
  }
  
  // Sort by priority descending (higher priority first)
  const sortedPatterns = [...candidatePatterns].sort((a, b) => b.priority - a.priority);
  
  // Try each pattern in priority order
  for (const pattern of sortedPatterns) {
    const match = pattern.customDetection
      ? detectLinkPattern(pattern, context)
      : detectSinglePattern(pattern, context);
    if (match) {
      return match;
    }
  }
  
  return null;
}

/**
 * Detects a single markdown pattern in the text
 * 
 * @param pattern - Pattern to detect
 * @param context - Detection context
 * @returns PatternMatch if found, null otherwise
 */
function detectSinglePattern(
  pattern: MarkdownPattern,
  context: DetectionContext
): PatternMatch | null {
  const { text, cursorOffset, scopeStart, scopeEnd } = context;
  const { openDelimiter, closeDelimiter } = pattern;
  
  // Search backward from cursor for closing delimiter
  const closeDelimiterEnd = cursorOffset;
  const closeDelimiterStart = closeDelimiterEnd - closeDelimiter.length;
  
  // Verify we have enough characters for closing delimiter
  if (closeDelimiterStart < scopeStart) {
    return null;
  }
  
  // Verify the closing delimiter matches
  const actualCloseDelimiter = text.substring(closeDelimiterStart, closeDelimiterEnd);
  if (actualCloseDelimiter !== closeDelimiter) {
    return null;
  }
  
  // Check if closing delimiter is escaped
  if (isEscaped(text, closeDelimiterStart)) {
    return null;
  }
  
  // Search backward for opening delimiter
  const contentEnd = closeDelimiterStart;
  const searchStart = scopeStart;
  const searchEnd = contentEnd - 1; // Must have at least 1 char of content
  
  // Search for opening delimiter
  const openDelimiterStart = text.lastIndexOf(openDelimiter, searchEnd);
  
  // Verify opening delimiter exists and is within scope
  if (openDelimiterStart < searchStart) {
    return null;
  }
  
  // Check if opening delimiter is escaped
  if (isEscaped(text, openDelimiterStart)) {
    return null;
  }
  
  const openDelimiterEnd = openDelimiterStart + openDelimiter.length;
  const contentStart = openDelimiterEnd;
  
  // Verify there's content between delimiters
  if (contentStart >= contentEnd) {
    return null;
  }
  
  // Validate word boundary for opening delimiter
  if (!isWordBoundary(text, openDelimiterStart)) {
    return null;
  }
  
  // Extract content
  const content = text.substring(contentStart, contentEnd);
  
  return {
    pattern,
    startOffset: openDelimiterStart,
    endOffset: closeDelimiterEnd,
    contentStart,
    contentEnd,
    content
  };
}

/**
 * Detects a [label](url) link pattern in the text.
 * The trigger character is ')' which closes the URL portion.
 * Pattern: [label](url)
 * 
 * @param pattern - The link pattern definition
 * @param context - Detection context
 * @returns PatternMatch if found, null otherwise
 */
function detectLinkPattern(
  pattern: MarkdownPattern,
  context: DetectionContext
): PatternMatch | null {
  const { text, cursorOffset, scopeStart } = context;

  // The cursor is right after the closing ')'
  if (cursorOffset < 1 || text[cursorOffset - 1] !== ')') {
    return null;
  }

  // Find the matching '(' searching backward from the closing ')'
  const closeParenPos = cursorOffset - 1;
  const openParenPos = text.lastIndexOf('(', closeParenPos - 1);
  if (openParenPos < scopeStart || openParenPos >= closeParenPos) {
    return null;
  }

  // URL is between '(' and ')'
  const url = text.substring(openParenPos + 1, closeParenPos).trim();
  if (!url || url.length === 0) {
    return null;
  }

  // The ']' must be immediately before '('
  if (openParenPos < 1 || text[openParenPos - 1] !== ']') {
    return null;
  }

  // Find the matching '[' searching backward from ']'
  const closeBracketPos = openParenPos - 1;
  const openBracketPos = text.lastIndexOf('[', closeBracketPos - 1);
  if (openBracketPos < scopeStart || openBracketPos >= closeBracketPos) {
    return null;
  }

  // Label is between '[' and ']'
  const label = text.substring(openBracketPos + 1, closeBracketPos).trim();
  if (!label || label.length === 0) {
    return null;
  }

  // Validate word boundary for opening bracket
  if (!isWordBoundary(text, openBracketPos)) {
    return null;
  }

  // The full match is from '[' to ')'
  // content is the label text, but we also need the URL for link creation
  // We store the full inner content "[label](url)" minus the outer delimiters
  return {
    pattern,
    startOffset: openBracketPos,
    endOffset: cursorOffset,
    contentStart: openBracketPos + 1,
    contentEnd: closeBracketPos,
    content: label,
    // Store URL in a way the converter can access it
    linkUrl: url,
  };
}

/**
 * Checks if a position is at a word boundary (start of text or preceded by whitespace/punctuation)
 * 
 * @param text - Full text content
 * @param position - Position to check
 * @returns true if at word boundary, false otherwise
 */
function isWordBoundary(text: string, position: number): boolean {
  // Start of text is always a word boundary
  if (position === 0) {
    return true;
  }
  
  // Check character before position
  const charBefore = text[position - 1];
  
  // Word boundary if preceded by whitespace or punctuation
  return /[\s\p{P}]/u.test(charBefore);
}

/**
 * Validates that a pattern match is properly formed
 * 
 * @param match - Pattern match to validate
 * @param context - Detection context
 * @returns true if pattern is valid, false otherwise
 */
export function validatePattern(
  match: PatternMatch,
  context: DetectionContext
): boolean {
  const { pattern, content, startOffset, endOffset } = match;
  const { text, scopeStart, scopeEnd } = context;
  
  // Validation 1: Opening and closing delimiters must match
  const actualOpenDelimiter = text.substring(startOffset, startOffset + pattern.openDelimiter.length);
  const actualCloseDelimiter = text.substring(endOffset - pattern.closeDelimiter.length, endOffset);
  
  if (actualOpenDelimiter !== pattern.openDelimiter || actualCloseDelimiter !== pattern.closeDelimiter) {
    return false;
  }
  
  // Validation 2: Content must contain at least one non-whitespace character
  if (!content || content.trim().length === 0) {
    return false;
  }
  
  // Validation 3: Pattern must be within scope boundaries
  if (startOffset < scopeStart || endOffset > scopeEnd) {
    return false;
  }
  
  // Validation 4: Pattern must not span across formatted regions
  // This will be checked at the DOM level during conversion
  // For now, we validate at the text level
  
  return true;
}

/**
 * Checks if a position in text is within an escape sequence
 * 
 * @param text - Full text content
 * @param position - Position to check
 * @returns true if position is escaped, false otherwise
 */
export function isEscaped(
  text: string,
  position: number
): boolean {
  if (position === 0) {
    return false;
  }
  
  // Count consecutive backslashes before the position
  let backslashCount = 0;
  let checkPos = position - 1;
  
  while (checkPos >= 0 && text[checkPos] === '\\') {
    backslashCount++;
    checkPos--;
  }
  
  // Odd number of backslashes means the position is escaped
  // Even number (including 0) means it's not escaped
  return backslashCount % 2 === 1;
}

/**
 * Finds scope boundaries (paragraph/block element) for pattern matching
 * 
 * @param element - Container element
 * @param cursorNode - Current cursor node
 * @param cursorOffset - Current cursor offset
 * @returns Object with start and end offsets of the scope
 */
export function findScopeBoundaries(
  element: HTMLElement,
  cursorNode: Node,
  cursorOffset: number
): { start: number; end: number } {
  // Find the block-level element containing the cursor
  let blockElement: Node | null = cursorNode;
  
  // Traverse up the DOM tree to find a block-level element
  while (blockElement && blockElement !== element) {
    if (blockElement.nodeType === Node.ELEMENT_NODE) {
      const tagName = (blockElement as HTMLElement).tagName;
      if (['P', 'DIV', 'LI', 'BLOCKQUOTE', 'PRE'].includes(tagName)) {
        break;
      }
    }
    blockElement = blockElement.parentNode;
  }
  
  // If no block element found, use the container element
  if (!blockElement || blockElement === element) {
    blockElement = element;
  }
  
  // Extract text content and calculate offsets
  const fullText = element.textContent || '';
  const blockText = blockElement.textContent || '';
  
  // Find where the block text starts in the full text
  const blockStartOffset = getTextOffsetOfNode(element, blockElement);
  const blockEndOffset = blockStartOffset + blockText.length;
  
  return {
    start: blockStartOffset,
    end: blockEndOffset
  };
}

/**
 * Gets the text offset of a node within a container element
 * 
 * @param container - Container element
 * @param targetNode - Target node to find offset for
 * @returns Text offset of the target node
 */
function getTextOffsetOfNode(container: Node, targetNode: Node): number {
  let offset = 0;
  
  function traverse(node: Node): boolean {
    if (node === targetNode) {
      return true;
    }
    
    if (node.nodeType === Node.TEXT_NODE) {
      offset += node.textContent?.length || 0;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      for (let i = 0; i < node.childNodes.length; i++) {
        if (traverse(node.childNodes[i])) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  traverse(container);
  return offset;
}


/**
 * Checks if the cursor is currently inside a mention element.
 * Mention elements use `<span class="cometchat-mentions">`.
 *
 * @param cursorNode - The DOM node where the cursor is positioned
 * @param containerElement - The contenteditable container element
 * @returns true if cursor is inside a mention span, false otherwise
 */
export function isCursorInsideMention(
  cursorNode: Node,
  containerElement: HTMLElement
): boolean {
  let node: Node | null = cursorNode;
  while (node && node !== containerElement) {
    if (
      node.nodeType === Node.ELEMENT_NODE &&
      (node as HTMLElement).classList.contains('cometchat-mentions')
    ) {
      return true;
    }
    node = node.parentNode;
  }
  return false;
}

/**
 * Checks if the cursor is currently inside a link (anchor) element.
 *
 * @param cursorNode - The DOM node where the cursor is positioned
 * @param containerElement - The contenteditable container element
 * @returns true if cursor is inside an <a> element, false otherwise
 */
export function isCursorInsideLink(
  cursorNode: Node,
  containerElement: HTMLElement
): boolean {
  let node: Node | null = cursorNode;
  while (node && node !== containerElement) {
    if (
      node.nodeType === Node.ELEMENT_NODE &&
      (node as HTMLElement).tagName === 'A'
    ) {
      return true;
    }
    node = node.parentNode;
  }
  return false;
}

/**
 * Checks if a pattern match spans across a mention or link element boundary.
 * This prevents markdown patterns from being matched when the opening delimiter
 * is outside a mention/link and the closing delimiter is inside (or vice versa).
 *
 * @param containerElement - The contenteditable container element
 * @param startOffset - Text offset of the pattern start (opening delimiter)
 * @param endOffset - Text offset of the pattern end (closing delimiter)
 * @returns true if the pattern crosses a mention or link boundary, false otherwise
 */
export function patternCrossesMentionOrLink(
  containerElement: HTMLElement,
  startOffset: number,
  endOffset: number
): boolean {
  // Collect text offset ranges for all mention and link elements
  const ranges = getSpecialElementRanges(containerElement);

  for (const range of ranges) {
    // Check if pattern partially overlaps with a special element
    // Full containment is fine (pattern entirely inside or entirely outside)
    const patternStartInside = startOffset >= range.start && startOffset < range.end;
    const patternEndInside = endOffset > range.start && endOffset <= range.end;

    // If one boundary is inside and the other is outside, it crosses
    if (patternStartInside !== patternEndInside) {
      return true;
    }

    // If the pattern fully contains the special element, it also crosses
    if (startOffset < range.start && endOffset > range.end) {
      return true;
    }
  }

  return false;
}

/**
 * Gets text offset ranges for all mention spans and link elements
 * within the container.
 */
function getSpecialElementRanges(
  containerElement: HTMLElement
): Array<{ start: number; end: number }> {
  const ranges: Array<{ start: number; end: number }> = [];

  // Find all mention spans and anchor elements
  const specialElements = containerElement.querySelectorAll(
    'span.cometchat-mentions, a'
  );

  for (let i = 0; i < specialElements.length; i++) {
    const el = specialElements[i];
    const start = getTextOffsetOfNode(containerElement, el);
    const textLen = (el.textContent || '').length;
    ranges.push({ start, end: start + textLen });
  }

  return ranges;
}
