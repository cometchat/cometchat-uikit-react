/**
 * Rich Text Formatting Utilities for CometChat Message Composer
 * 
 * Provides formatting capabilities: Bold, Italic, Underline, Strikethrough, etc.
 * Uses document.execCommand() for reliable cross-browser formatting.
 * 
 * Based on standard rich text editor patterns:
 * - Use mousedown preventDefault on toolbar buttons to preserve selection
 * - Use execCommand for formatting operations
 * - Support keyboard shortcuts for common formatting
 */
import { emojiToShortcode, shortcodeToEmoji } from './EmojiShortcodeUtils';

export type FormatType = 
  | 'bold' 
  | 'italic' 
  | 'underline' 
  | 'strikethrough'
  | 'link'
  | 'orderedList'
  | 'unorderedList'
  | 'blockquote'
  | 'codeInline'
  | 'codeBlock';

/**
 * Detect if the current platform is macOS
 */
const isMacPlatform = (): boolean => {
  return /mac/i.test(navigator.userAgent);
};

/**
 * Creates a rich text formatting utility bound to a specific document context
 * Supports iframe embedding by accepting document/window from IframeContext
 */
export function createRichTextFormatter(
  getDocument: () => Document,
  getWindow: () => Window
) {
  /**
   * Tracks inline formats that have been "pre-armed" (toggled on via toolbar
   * or keyboard shortcut) while the selection is collapsed and no text exists.
   * Browsers internally arm these formats so the next typed character inherits
   * them, but `queryCommandState` is unreliable at reporting multiple armed
   * formats after focus changes. We maintain this set ourselves and merge it
   * into `getActiveFormats` results.
   */
  const pendingFormats = new Set<FormatType>();

  /** Inline formats that can be pre-armed */
  const INLINE_PENDING_FORMATS: FormatType[] = ['bold', 'italic', 'underline', 'strikethrough'];

  /** Maps our format names to execCommand/queryCommandState command strings */
  const COMMAND_MAP: Record<string, string> = {
    bold: 'bold',
    italic: 'italic',
    underline: 'underline',
    strikethrough: 'strikeThrough',
  };

  /**
   * After toggling an inline format, update pendingFormats if the selection
   * is collapsed (no text selected). This lets us remember armed formats
   * that queryCommandState may fail to report after focus changes.
   *
   * Crucially, when the toolbar button click causes a focus shift, the
   * browser loses its internal "armed" state for previously toggled formats.
   * After tracking the newly toggled format we re-arm all other pending
   * formats via execCommand so the browser will apply ALL of them when the
   * user starts typing.
   */
  const trackPendingFormat = (format: FormatType, containerElement: HTMLElement): void => {
    if (!INLINE_PENDING_FORMATS.includes(format)) return;
    const sel = getSelection();
    const collapsed = !sel || sel.isCollapsed;
    const empty = (containerElement.textContent || '').replace(/\u200B/g, '').trim() === '';
    if (collapsed || empty) {
      // Toggle: if the browser says it's now active, add; otherwise remove
      const cmd = COMMAND_MAP[format];
      const isActive = cmd ? queryCommandState(cmd) : false;
      if (cmd && isActive) {
        pendingFormats.add(format);
      } else {
        pendingFormats.delete(format);
      }

      // Re-arm all other pending formats that the browser may have lost
      // due to the focus shift from the toolbar click. For each pending
      // format (other than the one just toggled), check if the browser
      // still reports it as active; if not, fire execCommand to re-arm it.
      Array.from(pendingFormats).forEach((pendingFmt) => {
        if (pendingFmt === format) return;
        const pendingCmd = COMMAND_MAP[pendingFmt];
        const stillActive = pendingCmd ? queryCommandState(pendingCmd) : false;
        if (pendingCmd && !stillActive) {
          execCommand(pendingCmd);
        }
      });
    } else {
      // There was a real selection — no need to track pending
      pendingFormats.clear();
    }
  };

  /**
   * Clear all pending (pre-armed) formats.
   * Should be called when the user types actual text, since the browser
   * will have consumed the armed formats at that point.
   */
  const clearPendingFormats = (): void => {
    pendingFormats.clear();
  };

  /**
   * Get the current set of pending formats (for merging into activeFormats).
   */
  const getPendingFormats = (): FormatType[] => {
    return Array.from(pendingFormats);
  };

  /**
   * Get the current selection from the correct window context
   */
  const getSelection = (): Selection | null => {
    const win = getWindow();
    return win.getSelection();
  };

  /**
   * Save the current selection state
   */
  const saveSelection = (): Range | null => {
    const sel = getSelection();
    if (sel && sel.rangeCount > 0) {
      return sel.getRangeAt(0).cloneRange();
    }
    return null;
  };

  /**
   * Restore a previously saved selection
   */
  const restoreSelection = (range: Range | null): void => {
    if (!range) return;
    
    const sel = getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }
  };

  /**
   * Check if the current selection has any text selected
   */
  const hasSelection = (): boolean => {
    const sel = getSelection();
    return sel !== null && sel.toString().length > 0;
  };

  /**
   * Get the currently selected text as a string
   * @param savedRange - Optional saved Range to extract text from (useful when selection may have been lost)
   */
  const getSelectedText = (savedRange?: Range | null): string => {
    // If a saved range is provided, extract text from it
    if (savedRange) {
      return savedRange.toString();
    }
    // Otherwise fall back to current selection
    const sel = getSelection();
    return sel ? sel.toString() : '';
  };


  /**
   * Check if the current selection is inside the given container element.
   * This prevents formatting from being applied to elements outside the
   * composer (e.g. message bubbles in the chat list).
   */
  const isSelectionInsideContainer = (containerElement: HTMLElement): boolean => {
    const sel = getSelection();
    if (!sel || sel.rangeCount === 0) return false;
    const range = sel.getRangeAt(0);
    let node: Node | null = range.startContainer;
    while (node) {
      if (node === containerElement) return true;
      node = node.parentNode;
    }
    return false;
  };

  /**
   * Execute a formatting command using document.execCommand
   * This is the most reliable way to apply formatting in contenteditable
   */
  const execCommand = (command: string, value: string | null = null): boolean => {
    const doc = getDocument();
    try {
      return doc.execCommand(command, false, value || '');
    } catch (error) {
      console.warn(`Rich text formatting: execCommand '${command}' failed`, error);
      return false;
    }
  };

  /**
   * Check if a format is currently active at the caret position
   */
  const queryCommandState = (command: string): boolean => {
    const doc = getDocument();
    try {
      return doc.queryCommandState(command);
    } catch (error) {
      return false;
    }
  };

  /**
   * Check if the current selection/caret has a specific format applied
   */
  const isFormatted = (formatType: FormatType, containerElement: HTMLElement): boolean => {
    switch (formatType) {
      case 'bold':
        return queryCommandState('bold');
      case 'italic':
        return queryCommandState('italic');
      case 'underline':
        return queryCommandState('underline');
      case 'strikethrough':
        return queryCommandState('strikeThrough');
      case 'orderedList':
        return queryCommandState('insertOrderedList');
      case 'unorderedList':
        return queryCommandState('insertUnorderedList');
      default:
        return false;
    }
  };

  /**
   * Get active formats for the current selection/caret position.
   * Merges browser-reported state with our pendingFormats set so that
   * pre-armed inline formats (toggled on empty/collapsed content) are
   * always reflected correctly.
   */
  const getActiveFormats = (containerElement: HTMLElement): FormatType[] => {
    const activeFormats: FormatType[] = [];
    
    if (queryCommandState('bold')) activeFormats.push('bold');
    if (queryCommandState('italic')) activeFormats.push('italic');
    if (queryCommandState('strikeThrough')) activeFormats.push('strikethrough');
    if (queryCommandState('insertOrderedList')) activeFormats.push('orderedList');
    if (queryCommandState('insertUnorderedList')) activeFormats.push('unorderedList');
    
    // Hoisted so the pendingFormats merge below can reuse it
    let isInsideLink = false;

    // Check for link, blockquote, code, and underline by examining DOM
    const sel = getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      let node: Node | null = range.startContainer;
      
      // When the startContainer is an element node (e.g. the container DIV
      // itself), the cursor is between child nodes. The actual context node
      // is the child at startOffset (or startOffset-1 for the node just
      // before the cursor). We need to resolve to the correct child so the
      // ancestor walk below can detect <a>, <pre>, <code>, etc.
      if (node.nodeType === Node.ELEMENT_NODE && node.childNodes.length > 0) {
        const offset = range.startOffset;
        // Prefer the node at offset (the node the cursor is "in front of"),
        // but if offset equals childNodes.length the cursor is after the
        // last child, so use the last child instead.
        if (offset < node.childNodes.length) {
          node = node.childNodes[offset];
        } else if (offset > 0) {
          node = node.childNodes[offset - 1];
        }
      }
      
      let isInsideCodeBlock = false;
      let isInsideCode = false;
      
      while (node && node !== containerElement) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          const tagName = element.tagName.toUpperCase();
          
          if (tagName === 'A') {
            isInsideLink = true;
            activeFormats.push('link');
          }
          if (tagName === 'BLOCKQUOTE') activeFormats.push('blockquote');
          if (tagName === 'CODE') {
            isInsideCode = true;
          }
          if (tagName === 'PRE') {
            isInsideCodeBlock = true;
            activeFormats.push('codeBlock');
          }
        }
        node = node.parentNode;
      }
      
      // Only add codeInline if inside <code> AND NOT inside <pre> (code block)
      // This ensures codeBlock and codeInline are mutually exclusive
      if (isInsideCode && !isInsideCodeBlock) {
        activeFormats.push('codeInline');
      }
      
      // Only report underline when NOT inside a link.
      // Browsers report queryCommandState('underline') as true inside <a> tags
      // because of the link's inherent text-decoration. We suppress the
      // underline active state entirely when inside a link.
      if (queryCommandState('underline') && !isInsideLink) {
        activeFormats.push('underline');
      }
    } else {
      // Fallback when no selection available
      if (queryCommandState('underline')) activeFormats.push('underline');
    }

    // Merge pending (pre-armed) inline formats that queryCommandState may
    // have failed to report after focus/selection changes.
    // Skip 'underline' when inside a link to avoid false positives.
    Array.from(pendingFormats).forEach((fmt) => {
      if (fmt === 'underline' && isInsideLink) return;
      if (!activeFormats.includes(fmt)) {
        activeFormats.push(fmt);
      }
    });
    
    return activeFormats;
  };

  /**
   * Toggle bold formatting
   */
  const toggleBold = (containerElement: HTMLElement): void => {
    if (!isSelectionInsideContainer(containerElement)) return;
    execCommand('bold');
    trackPendingFormat('bold', containerElement);
  };

  /**
   * Toggle italic formatting
   */
  const toggleItalic = (containerElement: HTMLElement): void => {
    if (!isSelectionInsideContainer(containerElement)) return;
    execCommand('italic');
    trackPendingFormat('italic', containerElement);
  };

  /**
   * Toggle underline formatting
   */
  const toggleUnderline = (containerElement: HTMLElement): void => {
    if (!isSelectionInsideContainer(containerElement)) return;
    execCommand('underline');
    trackPendingFormat('underline', containerElement);
  };

  /**
   * Toggle strikethrough formatting
   */
  const toggleStrikethrough = (containerElement: HTMLElement): void => {
    if (!isSelectionInsideContainer(containerElement)) return;
    execCommand('strikeThrough');
    trackPendingFormat('strikethrough', containerElement);
  };

  /**
   * Find the nearest ancestor anchor element within a container
   */
  const findParentLink = (node: Node | null, container: HTMLElement): HTMLAnchorElement | null => {
    while (node && node !== container) {
      if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName === 'A') {
        return node as HTMLAnchorElement;
      }
      node = node.parentNode;
    }
    return null;
  };

  /**
   * Insert a link at the current selection
   */
  const insertLink = (
    url: string,
    displayText: string | undefined,
    containerElement: HTMLElement
  ): void => {
    containerElement.focus();
    if (!isSelectionInsideContainer(containerElement)) {
      return;
    }
    
    const sel = getSelection();
    if (!sel || sel.rangeCount === 0) {
      return;
    }
    
    const range = sel.getRangeAt(0);
    const doc = getDocument();
    
    if (hasSelection()) {
      // Check if selection is inside an existing link
      const existingLink = findParentLink(range.startContainer, containerElement);
      
      if (existingLink) {
        // Direct href update path - fix for link paste replacement bug
        existingLink.href = url;
        // Update display text if provided and different
        if (displayText && existingLink.textContent !== displayText) {
          existingLink.textContent = displayText;
        }
        return;
      }
      
      // If displayText is provided, replace selection contents with a
      // manually-built anchor so the display text is always honoured.
      if (displayText) {
        const anchor = doc.createElement('a');
        anchor.href = url;
        anchor.textContent = displayText;
        range.deleteContents();
        range.insertNode(anchor);
        // Move cursor after the anchor
        range.setStartAfter(anchor);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        return;
      }

      // No displayText: wrap the selected content as-is using execCommand
      const success = execCommand('createLink', url);
      
      if (!success || !findParentLink(range.startContainer, containerElement)) {
        // Fallback: manually wrap selection in an anchor
        const anchor = doc.createElement('a');
        anchor.href = url;
        const contents = range.extractContents();
        anchor.appendChild(contents);
        range.insertNode(anchor);
        // Move cursor after the anchor
        range.setStartAfter(anchor);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    } else {
      // No selection: directly create an <a> element
      const text = displayText || url;
      const anchor = doc.createElement('a');
      anchor.href = url;
      anchor.textContent = text;
      range.insertNode(anchor);
      // Move cursor after the anchor
      range.setStartAfter(anchor);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  };

  /**
   * Update an existing link's URL and display text.
   * This is used when editing a link from the link popover.
   */
  const updateLink = (
    url: string,
    displayText: string | undefined,
    containerElement: HTMLElement
  ): void => {
    // Note: caller (handleLinkSubmit) already focuses and restores selection
    // before calling this method. Calling focus() here would clobber the
    // restored selection, causing the link element lookup to fail.
    
    const sel = getSelection();
    if (!sel || sel.rangeCount === 0) return;
    
    // Find the link element in the current selection
    let linkElement: HTMLAnchorElement | null = null;
    let node: Node | null = sel.getRangeAt(0).startContainer;
    while (node && node !== containerElement) {
      if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName === 'A') {
        linkElement = node as HTMLAnchorElement;
        break;
      }
      node = node.parentNode;
    }
    
    if (linkElement) {
      // Update the existing link
      linkElement.href = url;
      if (displayText !== undefined && displayText !== linkElement.textContent) {
        linkElement.textContent = displayText;
      }
    } else {
      // No existing link found, insert a new one
      insertLink(url, displayText, containerElement);
    }
  };

  /**
   * Remove link formatting
   */
  const removeLink = (containerElement: HTMLElement): void => {
    containerElement.focus();
    execCommand('unlink');
  };

  /**
   * Check if inside a link
   */
  const isInsideLink = (containerElement: HTMLElement): boolean => {
    const sel = getSelection();
    if (!sel || sel.rangeCount === 0) return false;
    
    let node: Node | null = sel.getRangeAt(0).startContainer;
    while (node && node !== containerElement) {
      if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName === 'A') {
        return true;
      }
      node = node.parentNode;
    }
    return false;
  };

  /**
   * Apply inline styles to list elements inside a container to ensure
   * list markers (numbers/bullets) are always visible regardless of
   * external CSS resets or specificity conflicts.
   *
   * Nesting: list marker type changes per depth level.
   * Ordered:   1. → a. → i. → 1. → a. → ...
   * Unordered: disc → circle → square → disc → circle → ...
   */
  const applyListInlineStyles = (containerElement: HTMLElement): void => {
    const olStyles = ['decimal', 'lower-alpha', 'lower-roman'];
    const ulStyles = ['disc', 'circle', 'square'];

    const getListDepth = (el: Element): number => {
      let depth = 0;
      let parent = el.parentElement;
      while (parent && parent !== containerElement) {
        if (parent.tagName === 'OL' || parent.tagName === 'UL') {
          depth++;
        }
        parent = parent.parentElement;
      }
      return depth;
    };

    const olElements = containerElement.querySelectorAll('ol');
    const ulElements = containerElement.querySelectorAll('ul');
    const liElements = containerElement.querySelectorAll('li');

    olElements.forEach((ol) => {
      const depth = getListDepth(ol);
      ol.style.listStyleType = olStyles[depth % olStyles.length];
      ol.style.listStylePosition = 'outside';
      ol.style.paddingLeft = '12px';
      ol.style.margin = '0';
    });

    ulElements.forEach((ul) => {
      const depth = getListDepth(ul);
      ul.style.listStyleType = ulStyles[depth % ulStyles.length];
      ul.style.listStylePosition = 'outside';
      ul.style.paddingLeft = '12px';
      ul.style.margin = '0';
    });

    liElements.forEach((li) => {
      li.style.display = 'list-item';
    });
  };

  /**
   * After toggling a list item between ordered/unordered, the browser splits
   * the original <ol> into separate lists. The second <ol> restarts numbering
   * from 1. This function walks through sibling lists at each nesting level
   * and sets the `start` attribute so ordered list numbering stays continuous.
   */
  const fixOrderedListContinuation = (containerElement: HTMLElement): void => {
    const fixLevel = (parent: Element): void => {
      const children = Array.from(parent.children);
      let runningCount = 0;

      for (const child of children) {
        if (child.tagName === 'OL') {
          const ol = child as HTMLOListElement;
          if (runningCount > 0) {
            ol.start = runningCount + 1;
          } else {
            ol.removeAttribute('start');
          }
          runningCount += ol.querySelectorAll(':scope > li').length;
          // Recurse into nested lists inside each <li>
          ol.querySelectorAll(':scope > li').forEach((li) => fixLevel(li));
        } else if (child.tagName === 'UL') {
          runningCount += child.querySelectorAll(':scope > li').length;
          // Recurse into nested lists inside each <li>
          child.querySelectorAll(':scope > li').forEach((li) => fixLevel(li));
        } else {
          // Non-list element resets the running count
          runningCount = 0;
        }
      }
    };

    fixLevel(containerElement);
  };

  /**
   * Replace a code block (<pre><code>) with a list (ol or ul).
   * The text content of the code block becomes the first list item.
   */
  const replaceCodeBlockWithList = (
    codeBlockElement: HTMLElement,
    listTag: 'ol' | 'ul',
    containerElement: HTMLElement
  ): void => {
    const doc = getDocument();
    const sel = getSelection();

    const textContent = (codeBlockElement.textContent || '').replace(/\u200B/g, '');
    const list = doc.createElement(listTag);
    const li = doc.createElement('li');
    const textNode = doc.createTextNode(textContent || '\u200B');
    li.appendChild(textNode);
    list.appendChild(li);

    const parent = codeBlockElement.parentNode;
    if (parent) {
      parent.replaceChild(list, codeBlockElement);

      // Position cursor at end of the list item text
      if (sel) {
        const range = doc.createRange();
        range.setStart(textNode, textNode.textContent!.length);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }

      // Reset font context to clear monospace styling
      resetFontContext(containerElement);
      fixOrderedListContinuation(containerElement);
      applyListInlineStyles(containerElement);
    }
  };

  /**
   * Check if the current line (the line where the cursor is) contains any
   * mention spans. This is more precise than checking the entire container —
   * we only want the manual list-wrapping path when the cursor's own line
   * has mentions, not when mentions exist elsewhere in the composer.
   */
  const hasMentionsOnCurrentLine = (containerElement: HTMLElement): boolean => {
    const sel = getSelection();
    if (!sel || sel.rangeCount === 0) return false;

    const range = sel.getRangeAt(0);
    let anchor: Node | null = range.startContainer;
    if (anchor.nodeType === Node.TEXT_NODE) anchor = anchor.parentNode;

    // Walk up to a direct child of the container
    while (anchor && anchor !== containerElement && anchor.parentNode !== containerElement) {
      anchor = anchor.parentNode;
    }
    if (anchor === containerElement) anchor = null;
    if (!anchor) {
      const offset = range.startOffset;
      if (offset < containerElement.childNodes.length) {
        anchor = containerElement.childNodes[offset];
      } else if (containerElement.childNodes.length > 0) {
        anchor = containerElement.childNodes[containerElement.childNodes.length - 1];
      } else {
        return false;
      }
    }
    if (!anchor) return false;

    const BLOCK_TAGS = new Set(['BR', 'DIV', 'P', 'PRE', 'BLOCKQUOTE', 'OL', 'UL']);

    // Walk backwards to find line start
    let node: Node | null = anchor;
    while (node) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        if ((node as HTMLElement).classList?.contains('cometchat-mentions')) return true;
        if (BLOCK_TAGS.has((node as HTMLElement).tagName)) break;
      }
      node = node.previousSibling;
    }

    // Walk forwards from anchor to find line end
    node = anchor;
    while (node) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        if ((node as HTMLElement).classList?.contains('cometchat-mentions')) return true;
        if (BLOCK_TAGS.has((node as HTMLElement).tagName)) break;
      }
      node = node.nextSibling;
    }

    return false;
  };

  /**
   * Manually wrap the current line's content into a list element.
   * This avoids execCommand('insertOrderedList'/'insertUnorderedList') which
   * breaks when the line contains contentEditable="false" mention spans —
   * the browser splits them into separate list items or pushes them outside
   * the list entirely.
   *
   * Collects all sibling nodes on the current line (between block boundaries),
   * moves them into a new <li>, and wraps that in the requested list tag.
   */
  const wrapLineInList = (
    listTag: 'ol' | 'ul',
    containerElement: HTMLElement
  ): void => {
    const sel = getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    const doc = getDocument();

    // Find the anchor node (where cursor is positioned)
    let anchor: Node | null = range.startContainer;
    if (anchor.nodeType === Node.TEXT_NODE) {
      anchor = anchor.parentNode;
    }

    // Walk up to find a direct child of the container
    while (anchor && anchor !== containerElement && anchor.parentNode !== containerElement) {
      anchor = anchor.parentNode;
    }
    if (anchor === containerElement) anchor = null;

    if (!anchor) {
      const offset = range.startOffset;
      if (offset < containerElement.childNodes.length) {
        anchor = containerElement.childNodes[offset];
      } else if (containerElement.childNodes.length > 0) {
        anchor = containerElement.childNodes[containerElement.childNodes.length - 1];
      } else {
        return;
      }
    }
    if (!anchor) return;

    const BLOCK_TAGS = new Set(['BR', 'DIV', 'P', 'PRE', 'BLOCKQUOTE', 'OL', 'UL']);

    // Collect line start
    let lineStart: Node = anchor;
    let prev: Node | null = lineStart.previousSibling;
    while (prev) {
      if (prev.nodeType === Node.ELEMENT_NODE && BLOCK_TAGS.has((prev as HTMLElement).tagName)) break;
      lineStart = prev;
      prev = prev.previousSibling;
    }

    // Collect line end
    let lineEnd: Node = anchor;
    let next: Node | null = lineEnd.nextSibling;
    while (next) {
      if (next.nodeType === Node.ELEMENT_NODE && BLOCK_TAGS.has((next as HTMLElement).tagName)) break;
      lineEnd = next;
      next = next.nextSibling;
    }

    // Gather all nodes on this line
    const lineNodes: Node[] = [];
    let current: Node | null = lineStart;
    while (current) {
      lineNodes.push(current);
      if (current === lineEnd) break;
      current = current.nextSibling;
    }

    if (lineNodes.length === 0) return;

    // Build <ol>/<ul> > <li> and move nodes into it
    const list = doc.createElement(listTag);
    const li = doc.createElement('li');

    // Insert the list where the first line node was
    const insertBefore = lineNodes[0];
    containerElement.insertBefore(list, insertBefore);

    // Move all line nodes into the <li>
    for (const node of lineNodes) {
      li.appendChild(node);
    }
    list.appendChild(li);

    // Remove a trailing <br> that may have been part of the line boundary
    // (the next sibling of the list could be a leftover <br>)
    const afterList = list.nextSibling;
    if (afterList && afterList.nodeType === Node.ELEMENT_NODE && (afterList as HTMLElement).tagName === 'BR') {
      containerElement.removeChild(afterList);
    }

    // Place cursor at the end of the <li> content
    const lastChild = li.lastChild;
    if (lastChild) {
      const newRange = doc.createRange();
      if (lastChild.nodeType === Node.TEXT_NODE) {
        newRange.setStart(lastChild, (lastChild.textContent || '').length);
      } else {
        newRange.setStartAfter(lastChild);
      }
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);
    }
  };

  /**
   * Toggle ordered list
   */
  const toggleOrderedList = (containerElement: HTMLElement): void => {
      if (!isSelectionInsideContainer(containerElement)) return;

      // If inside a code block, replace it with an ordered list
      const codeBlockElement = isInsideCodeBlock(containerElement);
      if (codeBlockElement) {
        replaceCodeBlockWithList(codeBlockElement, 'ol', containerElement);
        return;
      }

      const insideList = isInsideAnyList(containerElement);

      // When mentions are on the current line and we're not already in a list,
      // manually wrap the line to avoid execCommand splitting mention spans
      // into separate list items.
      const currentLineMentions = !insideList && !hasSelection() && hasMentionsOnCurrentLine(containerElement);
      if (currentLineMentions) {
        wrapLineInList('ol', containerElement);
      } else {
        execCommand('insertOrderedList');
      }

      fixOrderedListContinuation(containerElement);
      applyListInlineStyles(containerElement);
    };

  /**
   * Toggle unordered list
   */
  const toggleUnorderedList = (containerElement: HTMLElement): void => {
      if (!isSelectionInsideContainer(containerElement)) return;

      // If inside a code block, replace it with an unordered list
      const codeBlockElement = isInsideCodeBlock(containerElement);
      if (codeBlockElement) {
        replaceCodeBlockWithList(codeBlockElement, 'ul', containerElement);
        return;
      }

      const insideList = isInsideAnyList(containerElement);

      // When mentions are on the current line and we're not already in a list,
      // manually wrap the line to avoid execCommand splitting mention spans
      // into separate list items.
      const currentLineMentions = !insideList && !hasSelection() && hasMentionsOnCurrentLine(containerElement);
      if (currentLineMentions) {
        wrapLineInList('ul', containerElement);
      } else {
        execCommand('insertUnorderedList');
      }

      fixOrderedListContinuation(containerElement);
      applyListInlineStyles(containerElement);
    };

  /**
   * Check if inside a list
   */
  const isInsideList = (
    listType: 'orderedList' | 'unorderedList',
    containerElement: HTMLElement
  ): HTMLElement | null => {
    const sel = getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    
    const tagName = listType === 'orderedList' ? 'OL' : 'UL';
    let node: Node | null = sel.getRangeAt(0).startContainer;
    
    while (node && node !== containerElement) {
      if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName === tagName) {
        return node as HTMLElement;
      }
      node = node.parentNode;
    }
    return null;
  };

  /**
   * Check if inside any list (ordered or unordered)
   */
  const isInsideAnyList = (containerElement: HTMLElement): HTMLElement | null => {
    const sel = getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    
    let node: Node | null = sel.getRangeAt(0).startContainer;
    
    while (node && node !== containerElement) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = (node as HTMLElement).tagName;
        if (tagName === 'OL' || tagName === 'UL') {
          return node as HTMLElement;
        }
      }
      node = node.parentNode;
    }
    return null;
  };

  /**
   * Get the current list item element
   */
  const getCurrentListItem = (containerElement: HTMLElement): HTMLLIElement | null => {
    const sel = getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    
    let node: Node | null = sel.getRangeAt(0).startContainer;
    
    while (node && node !== containerElement) {
      if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName === 'LI') {
        return node as HTMLLIElement;
      }
      node = node.parentNode;
    }
    return null;
  };

  /**
   * Check if the current list item is empty
   */
  const isCurrentListItemEmpty = (containerElement: HTMLElement): boolean => {
    const listItem = getCurrentListItem(containerElement);
    if (!listItem) return false;
    
    const text = listItem.textContent || '';
    // Consider empty if only whitespace or zero-width spaces
    return text.trim() === '' || text.replace(/\u200B/g, '').trim() === '';
  };

  /**
   * Check if cursor is at the beginning of a list item
   */
  const isCursorAtListItemStart = (containerElement: HTMLElement): boolean => {
    const sel = getSelection();
    if (!sel || sel.rangeCount === 0) return false;
    
    const range = sel.getRangeAt(0);
    if (!range.collapsed) return false;
    
    const listItem = getCurrentListItem(containerElement);
    if (!listItem) return false;
    
    // Check if cursor is at offset 0 of the first text node in the list item
    const startContainer = range.startContainer;
    const startOffset = range.startOffset;
    
    // If cursor is directly in the LI element at offset 0
    if (startContainer === listItem && startOffset === 0) {
      return true;
    }
    
    // If cursor is in a text node
    if (startContainer.nodeType === Node.TEXT_NODE) {
      // Check if offset is 0 (or only zero-width spaces before cursor)
      const textBefore = (startContainer.textContent || '').substring(0, startOffset);
      if (textBefore.replace(/\u200B/g, '').length > 0) {
        return false;
      }
      
      // Check if this is the first text node in the list item
      const doc = getDocument();
      const walker = doc.createTreeWalker(listItem, NodeFilter.SHOW_TEXT, null);
      const firstTextNode = walker.nextNode();
      
      // If this is the first text node, cursor is at start
      if (firstTextNode === startContainer) {
        return true;
      }
      
      // Check if all text nodes before this one are empty/whitespace
      let currentNode: Node | null = walker.currentNode;
      walker.currentNode = listItem;
      let node: Node | null;
      while ((node = walker.nextNode()) && node !== startContainer) {
        const text = (node.textContent || '').replace(/\u200B/g, '');
        if (text.length > 0) {
          return false;
        }
      }
      return true;
    }
    
    // If cursor is in an element node at offset 0
    if (startContainer.nodeType === Node.ELEMENT_NODE && startOffset === 0) {
      // Check if this element is the list item or its first child
      if (startContainer === listItem) {
        return true;
      }
      // Check if there's any text content before this element in the list item
      let node: Node | null = startContainer;
      while (node && node !== listItem) {
        const prevSibling = node.previousSibling;
        if (prevSibling) {
          const text = (prevSibling.textContent || '').replace(/\u200B/g, '');
          if (text.length > 0) {
            return false;
          }
        }
        node = node.parentNode;
      }
      return true;
    }
    
    return false;
  };

  /**
   * Handle Backspace in lists
   * - If cursor is at the beginning of a list item: remove the list formatting
   * - If the list item is empty: remove it and move to previous item or exit list
   * Returns true if handled, false otherwise
   */
  const handleListBackspace = (containerElement: HTMLElement): boolean => {
    const listElement = isInsideAnyList(containerElement);
    if (!listElement) return false;
    
    const listItem = getCurrentListItem(containerElement);
    if (!listItem) return false;
    
    const doc = getDocument();
    const sel = getSelection();
    
    // Case 1: Empty list item - remove it
    if (isCurrentListItemEmpty(containerElement)) {
      const parentList = listItem.parentElement;
      if (!parentList) return false;
      
      const prevSibling = listItem.previousElementSibling;
      const nextSibling = listItem.nextElementSibling;
      
      // Remove the empty list item
      parentList.removeChild(listItem);
      
      // If list is now empty, remove the list entirely
      if (parentList.children.length === 0) {
        const listParent = parentList.parentNode;
        if (listParent) {
          // Create a text node with zero-width space for cursor placement
          const textNode = doc.createTextNode('\u200B');
          listParent.replaceChild(textNode, parentList);
          
          // Move cursor to the text node
          if (sel) {
            const range = doc.createRange();
            range.setStart(textNode, 0);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
          }
        }
      } else if (prevSibling && prevSibling.tagName === 'LI') {
        // Move cursor to end of previous list item
        if (sel) {
          const range = doc.createRange();
          // Find the last text node in the previous sibling
          const walker = doc.createTreeWalker(prevSibling, NodeFilter.SHOW_TEXT, null);
          let lastTextNode: Node | null = null;
          let node: Node | null;
          while ((node = walker.nextNode())) {
            lastTextNode = node;
          }
          if (lastTextNode) {
            range.setStart(lastTextNode, (lastTextNode.textContent || '').length);
          } else {
            range.selectNodeContents(prevSibling);
            range.collapse(false);
          }
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      } else if (nextSibling && nextSibling.tagName === 'LI') {
        // Move cursor to start of next list item
        if (sel) {
          const range = doc.createRange();
          range.selectNodeContents(nextSibling);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
      
      return true;
    }
    
    // Case 2: Cursor at beginning of non-empty list item - convert to regular text
    if (isCursorAtListItemStart(containerElement)) {
      const parentList = listItem.parentElement;
      if (!parentList) return false;
      
      const listParent = parentList.parentNode;
      if (!listParent) return false;
      
      // Get the content of the list item
      const content = doc.createDocumentFragment();
      while (listItem.firstChild) {
        content.appendChild(listItem.firstChild);
      }
      
      // Check if this is the only item in the list
      const isOnlyItem = parentList.children.length === 1;
      const prevSibling = listItem.previousElementSibling;
      
      if (isOnlyItem) {
        // Replace the entire list with the content
        listParent.replaceChild(content, parentList);
      } else if (!prevSibling) {
        // First item in list - insert content before the list
        listParent.insertBefore(content, parentList);
        parentList.removeChild(listItem);
        
        // Add a line break after the extracted content if there are more items
        if (parentList.children.length > 0) {
          const br = doc.createElement('br');
          listParent.insertBefore(br, parentList);
        }
      } else {
        // Middle or last item - merge with previous item or extract
        parentList.removeChild(listItem);
        listParent.insertBefore(content, parentList.nextSibling);
      }
      
      // Move cursor to the beginning of the extracted content
      if (sel) {
        const range = doc.createRange();
        // Find the first text node in the container after extraction
        const walker = doc.createTreeWalker(containerElement, NodeFilter.SHOW_TEXT, null);
        let targetNode: Node | null = null;
        let node: Node | null;
        while ((node = walker.nextNode())) {
          // Find a text node that was part of our extracted content
          if (content.contains && !content.contains(node)) {
            // Content was moved, find it in the DOM
            const text = (node.textContent || '').replace(/\u200B/g, '');
            if (text.length > 0 || node.textContent === '\u200B') {
              targetNode = node;
              break;
            }
          }
        }
        
        if (targetNode) {
          range.setStart(targetNode, 0);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
      
      return true;
    }
    
    return false;
  };

  /**
   * Handle Shift+Enter in lists
   * - If inside a list and current item has content: create new list item
   * - If inside a list and current item is empty: exit the list
   * Returns true if handled, false otherwise
   */
  const handleListEnter = (containerElement: HTMLElement): boolean => {
    const listElement = isInsideAnyList(containerElement);
    if (!listElement) return false;
    
    const listItem = getCurrentListItem(containerElement);
    if (!listItem) return false;
    
    if (isCurrentListItemEmpty(containerElement)) {
      // Exit the list - remove the empty list item and move cursor after the list
      const doc = getDocument();
      const sel = getSelection();
      
      // Remove the empty list item
      const parent = listItem.parentNode;
      if (parent) {
        parent.removeChild(listItem);
        
        // If the list is now empty, remove it too
        if (parent.childNodes.length === 0) {
          const listParent = parent.parentNode;
          if (listParent) {
            // Create a new paragraph/line break after the list position
            const br = doc.createElement('br');
            listParent.replaceChild(br, parent);
            
            // Move cursor after the br
            if (sel) {
              const range = doc.createRange();
              range.setStartAfter(br);
              range.collapse(true);
              sel.removeAllRanges();
              sel.addRange(range);
            }
          }
        } else {
          // List still has items, insert br after the list
          const br = doc.createElement('br');
          const listParent = parent.parentNode;
          if (listParent && parent.nextSibling) {
            listParent.insertBefore(br, parent.nextSibling);
          } else if (listParent) {
            listParent.appendChild(br);
          }
          
          // Move cursor after the br
          if (sel) {
            const range = doc.createRange();
            range.setStartAfter(br);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
          }
        }
      }
      return true;
    } else {
      // Create a new list item - use execCommand for consistency
      execCommand('insertParagraph');
      fixOrderedListContinuation(containerElement);
      applyListInlineStyles(containerElement);
      return true;
    }
  };

  /**
   * Handle Tab / Shift+Tab in lists (nesting)
   * - Tab: indent the current list item into a nested sub-list under the previous sibling
   * - Shift+Tab: outdent the current list item up one level
   * Returns true if handled, false otherwise
   */
  const handleListTab = (containerElement: HTMLElement, shiftKey: boolean): boolean => {
    const listElement = isInsideAnyList(containerElement);
    if (!listElement) return false;

    const listItem = getCurrentListItem(containerElement);
    if (!listItem) return false;

    const doc = getDocument();
    const sel = getSelection();

    if (!shiftKey) {
      // --- INDENT (Tab) ---
      // The item must have a previous sibling <li> to nest under
      const prevSibling = listItem.previousElementSibling;
      if (!prevSibling || prevSibling.tagName !== 'LI') return false;

      // Determine the parent list type so the sub-list matches
      const parentList = listItem.parentElement;
      if (!parentList) return false;
      const subListTag = parentList.tagName; // 'OL' or 'UL'

      // Check if the previous sibling already has a nested list we can append to
      let subList = prevSibling.querySelector(':scope > ol, :scope > ul');
      if (!subList) {
        subList = doc.createElement(subListTag);
        prevSibling.appendChild(subList);
      }

      // Move the current item into the sub-list
      subList.appendChild(listItem);

      // Restore cursor inside the moved item
      if (sel) {
        const range = doc.createRange();
        if (listItem.firstChild) {
          // Place cursor at end of text content
          const textNode = listItem.lastChild;
          if (textNode && textNode.nodeType === Node.TEXT_NODE) {
            range.setStart(textNode, (textNode.textContent || '').length);
          } else {
            range.selectNodeContents(listItem);
            range.collapse(false);
          }
        } else {
          range.selectNodeContents(listItem);
          range.collapse(false);
        }
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }

      fixOrderedListContinuation(containerElement);
      applyListInlineStyles(containerElement);
      return true;
    } else {
      // --- OUTDENT (Shift+Tab) ---
      const parentList = listItem.parentElement;
      if (!parentList || (parentList.tagName !== 'OL' && parentList.tagName !== 'UL')) return false;

      const grandParentLi = parentList.parentElement;
      // If the parent list is the top-level list (not nested), nothing to outdent
      if (!grandParentLi || grandParentLi.tagName !== 'LI') return false;

      const outerList = grandParentLi.parentElement;
      if (!outerList) return false;

      // Any siblings after the current item stay nested — move them into a new sub-list under the outdented item
      const siblingsAfter: HTMLElement[] = [];
      let next = listItem.nextElementSibling;
      while (next) {
        siblingsAfter.push(next as HTMLElement);
        next = next.nextElementSibling;
      }

      // Insert the list item after the grandparent <li> in the outer list
      if (grandParentLi.nextSibling) {
        outerList.insertBefore(listItem, grandParentLi.nextSibling);
      } else {
        outerList.appendChild(listItem);
      }

      // If there were siblings after, nest them under the outdented item
      if (siblingsAfter.length > 0) {
        const newSubList = doc.createElement(parentList.tagName);
        siblingsAfter.forEach(sib => newSubList.appendChild(sib));
        listItem.appendChild(newSubList);
      }

      // Clean up empty sub-lists
      if (parentList.children.length === 0) {
        parentList.parentNode?.removeChild(parentList);
      }

      // Restore cursor
      if (sel) {
        const range = doc.createRange();
        if (listItem.firstChild) {
          const textNode = listItem.lastChild;
          // If last child is a sub-list, find the text before it
          if (textNode && textNode.nodeType === Node.TEXT_NODE) {
            range.setStart(textNode, (textNode.textContent || '').length);
          } else {
            // Find first text node
            const walker = doc.createTreeWalker(listItem, NodeFilter.SHOW_TEXT, null);
            const firstText = walker.nextNode();
            if (firstText) {
              range.setStart(firstText, (firstText.textContent || '').length);
            } else {
              range.selectNodeContents(listItem);
              range.collapse(false);
            }
          }
        } else {
          range.selectNodeContents(listItem);
          range.collapse(false);
        }
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }

      fixOrderedListContinuation(containerElement);
      applyListInlineStyles(containerElement);
      return true;
    }
  };

  /**
   * Handle Shift+Enter in code blocks
   * - If the last line is empty (two consecutive Shift+Enters): exit the code block
   * - Otherwise: insert a new line
   * Returns true if handled, false otherwise
   */
  const handleCodeBlockEnter = (containerElement: HTMLElement): boolean => {
    const codeBlockElement = isInsideCodeBlock(containerElement);
    if (!codeBlockElement) return false;
    
    const doc = getDocument();
    const sel = getSelection();
    if (!sel || sel.rangeCount === 0) return false;
    
    // Get the code element inside pre
    const codeElement = codeBlockElement.querySelector('code') || codeBlockElement;
    let textContent = codeElement.textContent || '';
    
    // Remove trailing ZWS characters for checking (they're just for cursor positioning)
    const textForChecking = textContent.replace(/\u200B+$/, '');
    
    // Check if the text ends with two newlines (empty line at end)
    const endsWithEmptyLine = textForChecking.endsWith('\n\n') || 
                              (textForChecking.endsWith('\n') && textForChecking.trim() !== textForChecking.slice(0, -1));
    
    // Check if cursor is at the end (accounting for trailing ZWS)
    const range = sel.getRangeAt(0);
    let cursorOffset = 0;
    if (range.startContainer.nodeType === Node.TEXT_NODE) {
      const walker = doc.createTreeWalker(codeElement, NodeFilter.SHOW_TEXT, null);
      let currentNode: Node | null = walker.nextNode();
      while (currentNode) {
        if (currentNode === range.startContainer) {
          cursorOffset += range.startOffset;
          break;
        }
        cursorOffset += (currentNode.textContent || '').length;
        currentNode = walker.nextNode();
      }
    } else if (range.startContainer === codeElement || range.startContainer === codeBlockElement) {
      cursorOffset = textContent.length;
    }
    
    // Consider cursor at end if it's at or past the last meaningful character (ignoring trailing ZWS)
    const isAtEnd = cursorOffset >= textForChecking.length - 1 || cursorOffset >= textContent.length - 1;
    
    // If at end and content ends with empty line, exit the code block
    if (isAtEnd && endsWithEmptyLine) {
      // Remove trailing newlines and ZWS from code block content
      let cleanContent = textContent.replace(/[\n\u200B]+$/, '');
      if (!cleanContent) cleanContent = '\u200B';
      
      if (codeElement.tagName === 'CODE') {
        codeElement.textContent = cleanContent;
      } else {
        codeBlockElement.textContent = cleanContent;
      }
      
      // Create a text node after the code block for cursor placement
      const textNode = doc.createTextNode('\u200B');
      const parent = codeBlockElement.parentNode;
      if (parent) {
        if (codeBlockElement.nextSibling) {
          parent.insertBefore(textNode, codeBlockElement.nextSibling);
        } else {
          parent.appendChild(textNode);
        }
        
        // Move cursor to the text node
        const newRange = doc.createRange();
        newRange.setStart(textNode, 1);
        newRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newRange);
      }
      
      return true;
    }
    
    // Otherwise, just insert a newline character
    // Prevent default and manually insert to avoid browser quirks
    // Note: We insert \n\u200B (newline + zero-width space) to ensure the browser
    // renders the new line visually. Without the ZWS, a trailing newline is often
    // collapsed/invisible in contenteditable elements.
    const textNode = range.startContainer;
    if (textNode.nodeType === Node.TEXT_NODE) {
      const text = textNode.textContent || '';
      const offset = range.startOffset;
      const afterCursor = text.slice(offset);
      // If cursor is at end or only whitespace/newlines after, add ZWS to make newline visible
      const needsZWS = !afterCursor || afterCursor === '\n' || afterCursor.trim() === '';
      const insertText = needsZWS ? '\n\u200B' : '\n';
      textNode.textContent = text.slice(0, offset) + insertText + afterCursor;
      
      // Move cursor after the newline (before ZWS if present)
      const newRange = doc.createRange();
      newRange.setStart(textNode, offset + 1);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);
    } else {
      // Fallback: append newline to code element
      const currentText = codeElement.textContent || '';
      // Add ZWS after newline to ensure it's visible
      codeElement.textContent = currentText + '\n\u200B';
      
      // Move cursor to position after newline (before ZWS)
      const newRange = doc.createRange();
      if (codeElement.firstChild) {
        newRange.setStart(codeElement.firstChild, currentText.length + 1);
      }
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);
    }
    
    return true;
  };

  /**
   * Handle Backspace inside a code block.
   * If the code block is empty (only ZWS / whitespace), remove the <pre> entirely
   * and place the cursor in a clean text node. Also handles select-all + backspace
   * where the entire code block content is selected.
   * Returns true if handled, false otherwise.
   */
  const handleCodeBlockBackspace = (containerElement: HTMLElement): boolean => {
    const codeBlockElement = isInsideCodeBlock(containerElement);
    if (!codeBlockElement) return false;

    const sel = getSelection();
    if (!sel || sel.rangeCount === 0) return false;

    const codeElement = codeBlockElement.querySelector('code') || codeBlockElement;
    const visibleText = (codeElement.textContent || '').replace(/\u200B/g, '').trim();

    // Check if entire content is selected (select-all inside code block)
    const range = sel.getRangeAt(0);
    const selectionText = range.toString().replace(/\u200B/g, '').trim();
    const entireSelected = !range.collapsed && selectionText === visibleText;

    if (visibleText === '' || entireSelected) {
      // Remove the <pre> and replace with an empty text node
      const doc = getDocument();
      const parent = codeBlockElement.parentNode;
      if (parent) {
        const textNode = doc.createTextNode('\u200B');
        parent.replaceChild(textNode, codeBlockElement);

        const newRange = doc.createRange();
        newRange.setStart(textNode, 0);
        newRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newRange);
      }
      return true;
    }

    return false;
  };

  /**
   * Toggle blockquote - uses formatBlock command
   */
  const toggleBlockquote = (containerElement: HTMLElement): void => {
      if (!isSelectionInsideContainer(containerElement)) return;
      const sel = getSelection();
      if (!sel || sel.rangeCount === 0) return;

      const range = sel.getRangeAt(0);
      const doc = getDocument();

      // Check if already in blockquote
      let inBlockquote = false;
      let node: Node | null = range.startContainer;

      while (node && node !== containerElement) {
        if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName === 'BLOCKQUOTE') {
          inBlockquote = true;
          break;
        }
        node = node.parentNode;
      }

      if (inBlockquote) {
        // Remove blockquote by formatting as paragraph
        execCommand('formatBlock', 'p');
        return;
      }

      // Check if inside a code block — replace the code block with a blockquote,
      // preserving the text content instead of overriding it
      const codeBlockElement = isInsideCodeBlock(containerElement);
      if (codeBlockElement) {
        const textContent = (codeBlockElement.textContent || '').replace(/\u200B/g, '');
        const blockquote = doc.createElement('blockquote');
        const textNode = doc.createTextNode(textContent || '\u200B');
        blockquote.appendChild(textNode);

        const parent = codeBlockElement.parentNode;
        if (parent) {
          parent.replaceChild(blockquote, codeBlockElement);

          // Position cursor at end of blockquote content
          const newRange = doc.createRange();
          newRange.setStart(textNode, textNode.textContent!.length);
          newRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(newRange);

          // Reset font context to clear monospace styling from the code block
          resetFontContext(containerElement);
        }
        return;
      }

      // Find the current block-level element containing the cursor
      let blockElement: Node | null = range.startContainer;
      if (blockElement.nodeType === Node.TEXT_NODE) {
        blockElement = blockElement.parentNode;
      }

      // Walk up to find the nearest block-level element that is a direct child of the container
      while (
        blockElement &&
        blockElement !== containerElement &&
        blockElement.parentNode !== containerElement
      ) {
        blockElement = blockElement.parentNode;
      }

      // If we couldn't find a suitable block element, or ended up at the container itself,
      // collect all sibling nodes on current line instead of falling back to execCommand
      if (!blockElement || blockElement === containerElement) {
        // Improved logic: collect all nodes on the current line (similar to toggleCodeBlock)
        // This handles the case where content (including mentions) is directly in the container

        const startContainer = range.startContainer;

        // Resolve the anchor to a direct child of the container
        let anchor: Node | null = startContainer;
        while (anchor && anchor.parentNode !== containerElement) {
          anchor = anchor.parentNode;
        }
        
        // If we're at the container itself, try to find the node at the cursor position
        if (!anchor || anchor === containerElement) {
          const offset = range.startOffset;
          if (offset < containerElement.childNodes.length) {
            anchor = containerElement.childNodes[offset];
          } else if (containerElement.childNodes.length > 0) {
            anchor = containerElement.childNodes[containerElement.childNodes.length - 1];
          } else {
            // Empty container - use execCommand
            execCommand('formatBlock', 'blockquote');
            return;
          }
        }

        const lineNodes: Node[] = [];

        // Find the first node of this line (stop at <br>, block elements, or container start)
        let lineStart: Node | null = anchor;
        let prev: Node | null = lineStart.previousSibling;
        while (prev) {
          if (prev.nodeType === Node.ELEMENT_NODE) {
            const tag = (prev as HTMLElement).tagName;
            if (tag === 'BR' || tag === 'DIV' || tag === 'P' || tag === 'PRE' || tag === 'BLOCKQUOTE' || tag === 'OL' || tag === 'UL') {
              break;
            }
          }
          lineStart = prev;
          prev = prev.previousSibling;
        }

        // Collect all nodes from lineStart to end of line (or next <br>/block)
        let lineNode: Node | null = lineStart;
        while (lineNode) {
          if (lineNode.nodeType === Node.ELEMENT_NODE) {
            const tag = (lineNode as HTMLElement).tagName;
            if (tag === 'BR' || tag === 'DIV' || tag === 'P' || tag === 'PRE' || tag === 'BLOCKQUOTE' || tag === 'OL' || tag === 'UL') {
              break;
            }
          }
          lineNodes.push(lineNode);
          lineNode = lineNode.nextSibling;
        }

        // If we collected nodes, wrap them in a blockquote
        if (lineNodes.length > 0) {
          const blockquote = doc.createElement('blockquote');

          // Move all collected nodes into the blockquote
          for (const n of lineNodes) {
            blockquote.appendChild(n.cloneNode(true));
          }

          // Replace the collected nodes with the blockquote
          containerElement.insertBefore(blockquote, lineNodes[0]);
          for (const n of lineNodes) {
            containerElement.removeChild(n);
          }

          // Restore cursor position inside the blockquote
          const newRange = doc.createRange();
          newRange.selectNodeContents(blockquote);
          newRange.collapse(false);
          sel.removeAllRanges();
          sel.addRange(newRange);
          return;
        }

        // Fallback to execCommand if no nodes collected
        execCommand('formatBlock', 'blockquote');
        return;
      }

      // Check if the block element has meaningful text content
      const textContent = (blockElement.textContent || '').trim();
      if (textContent.length === 0) {
        // Empty line — use execCommand to create a new blockquote block
        execCommand('formatBlock', 'blockquote');
        return;
      }

      // Wrap the current block element in a <blockquote> in-place
      const blockquote = doc.createElement('blockquote');
      blockElement.parentNode!.insertBefore(blockquote, blockElement);
      blockquote.appendChild(blockElement);

      // Restore cursor position inside the wrapped content
      const newRange = doc.createRange();
      try {
        newRange.setStart(range.startContainer, range.startOffset);
        newRange.setEnd(range.endContainer, range.endOffset);
      } catch {
        // If the original offsets are no longer valid, place cursor at end of blockquote
        newRange.selectNodeContents(blockquote);
        newRange.collapse(false);
      }
      sel.removeAllRanges();
      sel.addRange(newRange);
    };

  /**
   * Check if inside blockquote
   */
  const isInsideBlockquote = (containerElement: HTMLElement): HTMLElement | null => {
    const sel = getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    
    let node: Node | null = sel.getRangeAt(0).startContainer;
    while (node && node !== containerElement) {
      if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName === 'BLOCKQUOTE') {
        return node as HTMLElement;
      }
      node = node.parentNode;
    }
    return null;
  };

  /**
   * Toggle inline code - wraps selection in <code> tag
   */
  const toggleCodeInline = (containerElement: HTMLElement): void => {
      if (!isSelectionInsideContainer(containerElement)) return;
      const sel = getSelection();
      if (!sel || sel.rangeCount === 0) return;

      const range = sel.getRangeAt(0);
      const doc = getDocument();

      // Check if already in code
      let codeElement: HTMLElement | null = null;
      let node: Node | null = range.startContainer;

      while (node && node !== containerElement) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          if (el.tagName === 'CODE' && el.parentElement?.tagName !== 'PRE') {
            codeElement = el;
            break;
          }
        }
        node = node.parentNode;
      }

      if (codeElement) {
        // Remove code formatting - unwrap the code element
        const parent = codeElement.parentNode;
        if (parent) {
          // Clear inline monospace font from mention spans before unwrapping
          codeElement.querySelectorAll('span.cometchat-mentions > span').forEach((span) => {
            (span as HTMLElement).style.removeProperty('font');
            (span as HTMLElement).style.removeProperty('font-family');
          });
          // Collect children before moving so we can convert shortcodes back to emoji
          const restoredNodes: Node[] = [];
          while (codeElement.firstChild) {
            const child = codeElement.firstChild;
            parent.insertBefore(child, codeElement);
            restoredNodes.push(child);
          }
          parent.removeChild(codeElement);
          // Convert :shortcode: back to emoji in the restored text nodes
          for (const n of restoredNodes) {
            transformTextNodes(n, shortcodeToEmoji);
          }
        }
      } else if (hasSelection()) {
        // Wrap selection in code tag
        const code = doc.createElement('code');
        code.className = 'cometchat-rich-text-code-inline';

        try {
          range.surroundContents(code);
        } catch (e) {
          // surroundContents fails if selection spans multiple elements
          // Fall back to extracting and wrapping
          const contents = range.extractContents();
          code.appendChild(contents);
          range.insertNode(code);
        }

        // Convert unicode emoji to shortcodes inside the newly wrapped code element
        transformTextNodes(code, emojiToShortcode);

        // Move cursor after the code element
        const newRange = doc.createRange();
        newRange.setStartAfter(code);
        newRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newRange);
      } else {
        // No selection - check if mentions exist and wrap current line content
        const hasMentions = containerElement.querySelector('span.cometchat-mentions') !== null;

        if (hasMentions) {
          // Select the current line content (including mentions) before wrapping
          selectCurrentLineContent(containerElement);

          // Now wrap the selected content in a code tag
          const newRange = sel.getRangeAt(0);
          const code = doc.createElement('code');
          code.className = 'cometchat-rich-text-code-inline';

          try {
            const contents = newRange.extractContents();
            code.appendChild(contents);
            newRange.insertNode(code);
          } catch (e) {
            // Fallback: create empty code element
            code.appendChild(doc.createTextNode('\u200B'));
            newRange.insertNode(code);
          }

          // Convert unicode emoji to shortcodes inside the newly wrapped code element
          transformTextNodes(code, emojiToShortcode);

          // Move cursor inside the code element at the end
          const finalRange = doc.createRange();
          finalRange.selectNodeContents(code);
          finalRange.collapse(false);
          sel.removeAllRanges();
          sel.addRange(finalRange);
        } else {
          // No mentions - create empty code element and place cursor inside (original behavior)
          const code = doc.createElement('code');
          code.className = 'cometchat-rich-text-code-inline';
          // Use zero-width space to make the element visible and editable
          code.appendChild(doc.createTextNode('\u200B'));

          range.insertNode(code);

          // Move cursor inside the code element (after the zero-width space)
          const newRange = doc.createRange();
          newRange.setStart(code, 1);
          newRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(newRange);
        }
      }

    };

  /**
   * Check if inside inline code
   */
  const isInsideCodeInline = (containerElement: HTMLElement): HTMLElement | null => {
    const sel = getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    
    let node: Node | null = sel.getRangeAt(0).startContainer;
    while (node && node !== containerElement) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        if (el.tagName === 'CODE' && el.parentElement?.tagName !== 'PRE') {
          return el;
        }
      }
      node = node.parentNode;
    }
    return null;
  };

  /**
   * Extract mention span data from a DOM subtree.
   * Returns an array of { displayText, outerHTML } for each mention span found,
   * preserving the full original HTML so it can be restored exactly.
   */
  const extractMentionData = (root: Node): Array<{ displayText: string; outerHTML: string }> => {
    const mentions: Array<{ displayText: string; outerHTML: string }> = [];
    if (!(root instanceof HTMLElement)) return mentions;
    const spans = root.querySelectorAll('span.cometchat-mentions');
    spans.forEach((span) => {
      const displayText = span.textContent || '';
      mentions.push({ displayText, outerHTML: span.outerHTML });
    });
    return mentions;
  };

  /**
   * Walk all text nodes inside a root node and apply a transform function to their textContent.
   */
  const transformTextNodes = (root: Node, transform: (text: string) => string): void => {
    const walker = getDocument().createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const textNodes: Text[] = [];
    let n: Node | null;
    while ((n = walker.nextNode())) textNodes.push(n as Text);
    for (const textNode of textNodes) {
      const transformed = transform(textNode.textContent || '');
      if (transformed !== textNode.textContent) {
        textNode.textContent = transformed;
      }
    }
  };

  /**
   * Flatten DOM content into a DocumentFragment that contains only text nodes
   * and mention <span> elements (preserving them for the send flow).
   * All other formatting (bold, italic, etc.) is stripped.
   * Zero-width spaces are removed from text nodes.
   */
  const flattenToTextAndMentions = (source: Node): DocumentFragment => {
    const d = getDocument();
    const fragment = d.createDocumentFragment();
    const walk = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = (node.textContent || '').replace(/\u200B/g, '');
        if (text) {
          fragment.appendChild(d.createTextNode(text));
        }
        return;
      }
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        // Preserve mention spans as-is (clone them)
        if (el.classList.contains('cometchat-mentions')) {
          fragment.appendChild(el.cloneNode(true));
          return;
        }
        // For all other elements, recurse into children
        for (let i = 0; i < node.childNodes.length; i++) {
          walk(node.childNodes[i]);
        }
      }
    };
    walk(source);
    return fragment;
  };
  /**
   * Helper function to select all content on the current line.
   * This is used by formatting functions to ensure mention spans and text
   * on the current line are properly selected before applying formatting.
   *
   * Handles edge cases:
   * - Cursor at start of line
   * - Cursor at end of line
   * - Cursor positioned after mention span
   * - Multiple mentions on the same line
   */
  const selectCurrentLineContent = (containerElement: HTMLElement): void => {
    const sel = getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    const doc = getDocument();

    // Find the anchor node (where cursor is positioned)
    let anchor: Node | null = range.startContainer;

    // If anchor is a text node, get its parent
    if (anchor.nodeType === Node.TEXT_NODE) {
      anchor = anchor.parentNode;
    }

    // Walk up to find a direct child of the container.
    while (anchor && anchor !== containerElement && anchor.parentNode !== containerElement) {
      anchor = anchor.parentNode;
    }

    // If we ended up AT the container (e.g. cursor was on the container itself),
    // fall back to the child-offset resolution below by nulling anchor.
    if (anchor === containerElement) {
      anchor = null;
    }

    // If anchor is null (cursor was on the container itself), resolve via child offset
    if (!anchor) {
      const offset = range.startOffset;
      if (offset < containerElement.childNodes.length) {
        anchor = containerElement.childNodes[offset];
      } else if (containerElement.childNodes.length > 0) {
        anchor = containerElement.childNodes[containerElement.childNodes.length - 1];
      } else {
        return; // Empty container
      }
    }

    if (!anchor) return;

    // Find the start of the current line (stop at <br>, block elements, or container start)
    let lineStart: Node | null = anchor;
    let prev: Node | null = lineStart.previousSibling;
    while (prev) {
      if (prev.nodeType === Node.ELEMENT_NODE) {
        const tag = (prev as HTMLElement).tagName;
        if (tag === 'BR' || tag === 'DIV' || tag === 'P' || tag === 'PRE' || tag === 'BLOCKQUOTE' || tag === 'OL' || tag === 'UL') {
          break;
        }
      }
      lineStart = prev;
      prev = prev.previousSibling;
    }

    // Find the end of the current line (stop at <br>, block elements, or container end)
    let lineEnd: Node | null = anchor;
    let next: Node | null = lineEnd.nextSibling;
    while (next) {
      if (next.nodeType === Node.ELEMENT_NODE) {
        const tag = (next as HTMLElement).tagName;
        if (tag === 'BR' || tag === 'DIV' || tag === 'P' || tag === 'PRE' || tag === 'BLOCKQUOTE' || tag === 'OL' || tag === 'UL') {
          break;
        }
      }
      lineEnd = next;
      next = next.nextSibling;
    }

    // Create a new range that selects from lineStart to lineEnd
    const newRange = doc.createRange();

    // Set start: beginning of lineStart node
    if (lineStart.nodeType === Node.TEXT_NODE) {
      newRange.setStart(lineStart, 0);
    } else {
      newRange.setStartBefore(lineStart);
    }

    // Set end: end of lineEnd node
    if (lineEnd.nodeType === Node.TEXT_NODE) {
      newRange.setEnd(lineEnd, (lineEnd.textContent || '').length);
    } else {
      newRange.setEndAfter(lineEnd);
    }

    // Apply the new selection
    sel.removeAllRanges();
    sel.addRange(newRange);
  };

  /**
   * Toggle code block - wraps selection in <pre><code> tags
   * When applying: preserves mention spans inside the code element so the send flow
   * can still find and convert them to uid format.
   * When removing: restores the original mention spans directly in the DOM.
   */
  const toggleCodeBlock = (containerElement: HTMLElement): void => {
    if (!isSelectionInsideContainer(containerElement)) return;
    const sel = getSelection();
    if (!sel || sel.rangeCount === 0) return;
    
    const range = sel.getRangeAt(0);
    const doc = getDocument();
    
    // Check if already in code block
    let preElement: HTMLElement | null = null;
    let node: Node | null = range.startContainer;
    
    while (node && node !== containerElement) {
      if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName === 'PRE') {
        preElement = node as HTMLElement;
        break;
      }
      node = node.parentNode;
    }
    
    if (preElement) {
      // Remove code block - unwrap and restore mentions if data is available
      const parent = preElement.parentNode;
      if (parent) {
        const storedMentions = preElement.getAttribute('data-mentions');
        const text = preElement.textContent || '';

        if (storedMentions) {
          // Restore mention spans by replacing their display text with the original outerHTML
          try {
            const mentionData: Array<{ displayText: string; outerHTML: string }> = JSON.parse(storedMentions);
            let html = text;
            for (const mention of mentionData) {
              // Replace only the first occurrence using indexOf (avoids regex escaping)
              const idx = html.indexOf(mention.displayText);
              if (idx !== -1) {
                html = html.slice(0, idx) + mention.outerHTML + html.slice(idx + mention.displayText.length);
              }
            }
            // Create a temporary container to parse the HTML with restored mention spans
            const tempContainer = doc.createElement('span');
            tempContainer.innerHTML = html;
            // Convert :shortcode: back to emoji in restored text nodes
            transformTextNodes(tempContainer, shortcodeToEmoji);
            const fragment = doc.createDocumentFragment();
            while (tempContainer.firstChild) {
              fragment.appendChild(tempContainer.firstChild);
            }
            parent.replaceChild(fragment, preElement);
          } catch (e) {
            // Fallback: simple text replacement if JSON parse fails
            const textNode = doc.createTextNode(shortcodeToEmoji(text));
            parent.replaceChild(textNode, preElement);
          }
        } else {
          // No mention data stored - simple text replacement, converting shortcodes back to emoji
          const textNode = doc.createTextNode(shortcodeToEmoji(text));
          parent.replaceChild(textNode, preElement);
        }
        
        // Position cursor at end of restored content
        const newRange = doc.createRange();
        newRange.selectNodeContents(containerElement);
        newRange.collapse(false);
        sel.removeAllRanges();
        sel.addRange(newRange);
        
        // Reset font context after removing code block to clear monospace styling
        resetFontContext(containerElement);
      }
    } else {
      // Create code block - wrap current line content instead of inserting at cursor
      const pre = doc.createElement('pre');
      pre.className = 'cometchat-rich-text-code-block';
      const code = doc.createElement('code');
      
      if (hasSelection()) {
        // If there's a selection, wrap the selected content
        const contents = range.extractContents();
        
        // Extract mention data for restoration when toggling off
        const tempHolder = doc.createElement('div');
        tempHolder.appendChild(contents.cloneNode(true));
        const mentionData = extractMentionData(tempHolder);
        
        // Flatten to text + mention spans (preserve mentions, strip other formatting)
        const flatContent = flattenToTextAndMentions(tempHolder);
        // Convert unicode emoji to shortcodes inside the code block content
        transformTextNodes(flatContent, emojiToShortcode);
        if (flatContent.childNodes.length > 0) {
          code.appendChild(flatContent);
        } else {
          code.appendChild(doc.createTextNode('\u200B'));
        }
        pre.appendChild(code);
        
        // Store mention outerHTML on the pre element for later restoration
        if (mentionData.length > 0) {
          pre.setAttribute('data-mentions', JSON.stringify(mentionData));
        }
        
        range.insertNode(pre);
      } else {
        // No selection - find and wrap the current line/block content
        let blockElement: Node | null = range.startContainer;
        const startContainer = range.startContainer;
        
        if (blockElement.nodeType === Node.TEXT_NODE) {
          blockElement = blockElement.parentNode;
        }
        
        // Walk up to find the nearest block-level element that is a direct child of the container
        while (
          blockElement &&
          blockElement !== containerElement &&
          blockElement.parentNode !== containerElement
        ) {
          blockElement = blockElement.parentNode;
        }
        
        // Check if we have a proper block element to replace
        const isBlockLevel = blockElement && blockElement.nodeType === Node.ELEMENT_NODE &&
          /^(DIV|P|BLOCKQUOTE|PRE|UL|OL|LI|H[1-6])$/.test((blockElement as HTMLElement).tagName);
        
        if (blockElement && blockElement !== containerElement && blockElement.parentNode && isBlockLevel) {
          // Block-level element found — wrap just this element
          const mentionData = extractMentionData(blockElement);
          
          // Flatten to text + mention spans (preserve mentions, strip other formatting)
          const flatContent = flattenToTextAndMentions(blockElement);
          // Convert unicode emoji to shortcodes inside the code block content
          transformTextNodes(flatContent, emojiToShortcode);
          if (flatContent.childNodes.length > 0) {
            code.appendChild(flatContent);
          } else {
            code.appendChild(doc.createTextNode('\u200B'));
          }
          pre.appendChild(code);
          
          if (mentionData.length > 0) {
            pre.setAttribute('data-mentions', JSON.stringify(mentionData));
          }
          
          blockElement.parentNode.replaceChild(pre, blockElement);
        } else {
          // Content is directly in the container (no wrapping block element).
          // This happens when mentions and text sit as direct children of the container.
          // Collect all sibling nodes on the same "line" (up to a <br> or block boundary)
          // so the code block wraps the entire line including mentions.
          
          // Resolve the anchor to a direct child of the container.
          // startContainer may be deep inside a mention span, so walk up.
          let anchor: Node | null = startContainer;
          while (anchor && anchor.parentNode !== containerElement) {
            anchor = anchor.parentNode;
          }
          
          // If we're at the container itself, try to find the node at the cursor position
          if (!anchor || anchor === containerElement) {
            const offset = range.startOffset;
            if (offset < containerElement.childNodes.length) {
              anchor = containerElement.childNodes[offset];
            } else if (containerElement.childNodes.length > 0) {
              // Cursor is at the end - use the last child
              anchor = containerElement.childNodes[containerElement.childNodes.length - 1];
            } else {
              // Empty container - create empty code block
              code.appendChild(doc.createTextNode('\u200B'));
              pre.appendChild(code);
              range.insertNode(pre);
              // Move cursor inside
              const newRange = doc.createRange();
              newRange.setStart(code, 0);
              newRange.collapse(true);
              sel.removeAllRanges();
              sel.addRange(newRange);
              return;
            }
          }

          const lineNodes: Node[] = [];

          // Find the first node of this line (stop at <br>, block elements, or container start)
          let lineStart: Node | null = anchor;
          let prev: Node | null = lineStart.previousSibling;
          while (prev) {
            if (prev.nodeType === Node.ELEMENT_NODE) {
              const tag = (prev as HTMLElement).tagName;
              if (tag === 'BR' || tag === 'DIV' || tag === 'P' || tag === 'PRE' || tag === 'BLOCKQUOTE' || tag === 'OL' || tag === 'UL') break;
            }
            lineStart = prev;
            prev = prev.previousSibling;
          }

          // Collect all nodes from lineStart to end of line (or next <br>/block)
          // Enhanced to ensure all nodes including mention spans are identified
          let lineNode: Node | null = lineStart;
          while (lineNode) {
            if (lineNode.nodeType === Node.ELEMENT_NODE) {
              const tag = (lineNode as HTMLElement).tagName;
              if (tag === 'BR' || tag === 'DIV' || tag === 'P' || tag === 'PRE' || tag === 'BLOCKQUOTE' || tag === 'OL' || tag === 'UL') break;
            }
            lineNodes.push(lineNode);
            lineNode = lineNode.nextSibling;
          }

          if (lineNodes.length > 0) {
            // Extract mention data from all line nodes for restoration on toggle-off
            const tempHolder = doc.createElement('div');
            for (const n of lineNodes) {
              tempHolder.appendChild(n.cloneNode(true));
            }
            const mentionData = extractMentionData(tempHolder);

            // Flatten to text + mention spans (preserve mentions, strip other formatting)
            const flatContent = flattenToTextAndMentions(tempHolder);
            // Convert unicode emoji to shortcodes inside the code block content
            transformTextNodes(flatContent, emojiToShortcode);
            if (flatContent.childNodes.length > 0) {
              code.appendChild(flatContent);
            } else {
              code.appendChild(doc.createTextNode('\u200B'));
            }
            pre.appendChild(code);

            if (mentionData.length > 0) {
              pre.setAttribute('data-mentions', JSON.stringify(mentionData));
            }

            // Replace the collected nodes with the code block
            // Insert pre before the first node, then remove all collected nodes
            containerElement.insertBefore(pre, lineNodes[0]);
            for (const n of lineNodes) {
              containerElement.removeChild(n);
            }
          } else {
            // No nodes collected - this shouldn't happen if anchor was resolved correctly
            // Create empty code block at cursor as fallback
            code.appendChild(doc.createTextNode('\u200B'));
            pre.appendChild(code);
            range.insertNode(pre);
          }
        }
      }
      
      // Move cursor inside the code element at the end
      const newRange = doc.createRange();
      if (code.lastChild) {
        const lastNode = code.lastChild;
        if (lastNode.nodeType === Node.TEXT_NODE) {
          const textLength = (lastNode.textContent || '').length;
          newRange.setStart(lastNode, textLength);
        } else {
          // Last child is an element (e.g. mention span) — place cursor after it
          newRange.setStartAfter(lastNode);
        }
      } else {
        newRange.setStart(code, 0);
      }
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);

    }
  };

  /**
   * Check if inside code block
   */
  const isInsideCodeBlock = (containerElement: HTMLElement): HTMLElement | null => {
    const sel = getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    
    let node: Node | null = sel.getRangeAt(0).startContainer;
    while (node && node !== containerElement) {
      if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName === 'PRE') {
        return node as HTMLElement;
      }
      node = node.parentNode;
    }
    return null;
  };

  /**
   * Generic toggle format function
   */
  const toggleFormat = (formatType: FormatType, containerElement: HTMLElement): void => {
    // Guard: only apply formatting if the selection is inside the composer.
    // This prevents toolbar clicks from modifying message bubbles or other
    // elements when the user has selected text outside the composer.
    if (!isSelectionInsideContainer(containerElement)) return;

    switch (formatType) {
      case 'bold':
        toggleBold(containerElement);
        break;
      case 'italic':
        toggleItalic(containerElement);
        break;
      case 'underline':
        toggleUnderline(containerElement);
        break;
      case 'strikethrough':
        toggleStrikethrough(containerElement);
        break;
      case 'orderedList':
        toggleOrderedList(containerElement);
        break;
      case 'unorderedList':
        toggleUnorderedList(containerElement);
        break;
      case 'blockquote':
        toggleBlockquote(containerElement);
        break;
      case 'codeInline':
        toggleCodeInline(containerElement);
        break;
      case 'codeBlock':
        toggleCodeBlock(containerElement);
        break;
    }
  };

  /**
   * Clear all active inline formatting modes by toggling off each active command
   */
  const clearFormattingModes = (): void => {
    const inlineCommands = ['bold', 'italic', 'underline', 'strikeThrough'];
    for (const command of inlineCommands) {
      if (queryCommandState(command)) {
        execCommand(command);
      }
    }
  };

  /**
   * Reset the browser's font context to normal body font.
   * This is needed after removing code block formatting because
   * the browser may retain the monospace font styling.
   * 
   * Strategy:
   * 1. Try document.execCommand('removeFormat') to clear font styling
   * 2. Try document.execCommand('fontSize') to reset font size
   * 3. Insert a span with explicit normal font styling and position cursor INSIDE it
   *    so that typed text inherits the span's font properties
   * 
   * @param containerElement - The contenteditable element (optional, used for context)
   */
  const resetFontContext = (containerElement?: HTMLElement): void => {
    const doc = getDocument();
    const sel = getSelection();
    if (!sel || sel.rangeCount === 0) return;

    // Use removeFormat to clear any residual monospace / code styling
    try {
      doc.execCommand('removeFormat', false, '');
    } catch (e) {
      // Ignore if not supported
    }

    // Insert a plain zero-width space text node (no wrapping span) so the
    // cursor lands in a clean text context that inherits the container's font.
    // This avoids leaving a persistent <span> that leaks into sent messages
    // and interferes with mention detection.
    const range = sel.getRangeAt(0);
    const zwsNode = doc.createTextNode('\u200B');
    range.insertNode(zwsNode);

    const newRange = doc.createRange();
    newRange.setStart(zwsNode, 1);
    newRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newRange);
  };

  /**
   * Handle keyboard shortcuts for formatting
   * Returns true if a shortcut was handled
   */
  const handleKeyboardShortcut = (
    event: KeyboardEvent,
    containerElement: HTMLElement
  ): boolean => {
    const isMac = isMacPlatform();
    const modifier = isMac ? event.metaKey : event.ctrlKey;

    if (!modifier) return false;

    const key = event.key.toLowerCase();

    // When inside a code block, suppress rich text formatting shortcuts
    // (bold, italic, underline, strikethrough, link, inline code)
    const inCodeBlock = !!isInsideCodeBlock(containerElement);

    // Ctrl/Cmd + B = Bold
    if (key === 'b') {
      event.preventDefault();
      if (inCodeBlock) return true;
      toggleBold(containerElement);
      return true;
    }

    // Ctrl/Cmd + I = Italic
    if (key === 'i') {
      event.preventDefault();
      if (inCodeBlock) return true;
      toggleItalic(containerElement);
      return true;
    }

    // Ctrl/Cmd + U = Underline
    if (key === 'u') {
      event.preventDefault();
      if (inCodeBlock) return true;
      toggleUnderline(containerElement);
      return true;
    }

    // Ctrl/Cmd + Shift + X = Strikethrough
    if ((key === 'x' || key === 'X') && event.shiftKey) {
      event.preventDefault();
      if (inCodeBlock) return true;
      toggleStrikethrough(containerElement);
      return true;
    }

    // Ctrl/Cmd + Shift + S = Strikethrough (alternative)
    if ((key === 's' || key === 'S') && event.shiftKey) {
      event.preventDefault();
      if (inCodeBlock) return true;
      toggleStrikethrough(containerElement);
      return true;
    }

    // Ctrl/Cmd + K = Link (return true to indicate link shortcut)
    if (key === 'k') {
      event.preventDefault();
      if (inCodeBlock) return true;
      return true;
    }

    // Ctrl/Cmd + Shift + 7 = Numbered list
    if (event.key === '7' && event.shiftKey) {
      event.preventDefault();
      toggleOrderedList(containerElement);
      return true;
    }

    // Ctrl/Cmd + Shift + 8 = Bulleted list
    if (event.key === '8' && event.shiftKey) {
      event.preventDefault();
      toggleUnorderedList(containerElement);
      return true;
    }

    // Ctrl/Cmd + Shift + 9 = Blockquote
    if (event.key === '9' && event.shiftKey) {
      event.preventDefault();
      toggleBlockquote(containerElement);
      return true;
    }

    // Ctrl/Cmd + E = Inline code
    if (key === 'e') {
      event.preventDefault();
      if (inCodeBlock) return true;
      toggleCodeInline(containerElement);
      return true;
    }

    // Ctrl/Cmd + Shift + C = Code block
    if ((key === 'c' || key === 'C') && event.shiftKey) {
      event.preventDefault();
      toggleCodeBlock(containerElement);
      return true;
    }

    return false;
  };

  /**
   * Handle arrow key navigation for inline code
   * When cursor is at the end of inline code and right arrow is pressed,
   * move cursor outside the code element.
   * Returns true if handled, false otherwise.
   */
  const handleArrowKeyInCode = (
    event: KeyboardEvent,
    containerElement: HTMLElement
  ): boolean => {
    // Only handle right arrow key
    if (event.key !== 'ArrowRight') return false;
    
    const sel = getSelection();
    if (!sel || sel.rangeCount === 0) return false;
    
    const range = sel.getRangeAt(0);
    
    // Only handle collapsed selection (no text selected)
    if (!range.collapsed) return false;
    
    // Check if we're inside an inline code element
    let codeElement: HTMLElement | null = null;
    let node: Node | null = range.startContainer;
    
    while (node && node !== containerElement) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        if (el.tagName === 'CODE' && el.parentElement?.tagName !== 'PRE') {
          codeElement = el;
          break;
        }
      }
      node = node.parentNode;
    }
    
    // Also check if startContainer's parent is code
    if (!codeElement && range.startContainer.parentElement) {
      let parent: HTMLElement | null = range.startContainer.parentElement;
      while (parent && parent !== containerElement) {
        if (parent.tagName === 'CODE' && parent.parentElement?.tagName !== 'PRE') {
          codeElement = parent;
          break;
        }
        parent = parent.parentElement;
      }
    }
    
    if (!codeElement) return false;
    
    // Get the text content and cursor position
    const textContent = codeElement.textContent || '';
    const cleanText = textContent.replace(/\u200B/g, ''); // Remove zero-width spaces
    
    // Calculate cursor position within the code element
    let cursorOffset = 0;
    if (range.startContainer.nodeType === Node.TEXT_NODE) {
      // Walk through all text nodes before the cursor
      const walker = getDocument().createTreeWalker(
        codeElement,
        NodeFilter.SHOW_TEXT,
        null
      );
      
      let currentNode: Node | null = walker.nextNode();
      while (currentNode) {
        if (currentNode === range.startContainer) {
          cursorOffset += range.startOffset;
          break;
        }
        cursorOffset += (currentNode.textContent || '').length;
        currentNode = walker.nextNode();
      }
    } else if (range.startContainer === codeElement) {
      // Cursor is directly in the code element
      for (let i = 0; i < range.startOffset && i < codeElement.childNodes.length; i++) {
        cursorOffset += (codeElement.childNodes[i].textContent || '').length;
      }
    }
    
    // Adjust for zero-width spaces
    const textBeforeCursor = textContent.substring(0, cursorOffset);
    const cleanTextBeforeCursor = textBeforeCursor.replace(/\u200B/g, '');
    
    // Check if cursor is at the end
    const isAtEnd = cleanTextBeforeCursor.length >= cleanText.length;
    
    if (isAtEnd) {
      event.preventDefault();
      
      const doc = getDocument();
      
      // Insert a zero-width space after the code element if there's nothing after it
      let nextSibling = codeElement.nextSibling;
      if (!nextSibling || (nextSibling.nodeType === Node.TEXT_NODE && !(nextSibling.textContent || '').trim())) {
        const space = doc.createTextNode('\u200B');
        if (codeElement.parentNode) {
          codeElement.parentNode.insertBefore(space, codeElement.nextSibling);
          nextSibling = space;
        }
      }
      
      // Move cursor after the code element
      const newRange = doc.createRange();
      if (nextSibling && nextSibling.nodeType === Node.TEXT_NODE) {
        newRange.setStart(nextSibling, 0);
      } else {
        newRange.setStartAfter(codeElement);
      }
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);
      
      return true;
    }
    
    return false;
  };

  /**
   * Get plain text from HTML content
   */
  const getPlainText = (htmlContent: string): string => {
    const doc = getDocument();
    const tempDiv = doc.createElement('div');
    tempDiv.innerHTML = htmlContent;
    return tempDiv.textContent || tempDiv.innerText || '';
  };

  /**
   * Normalize HTML content
   */

  /**
   * Checks if a node is inside a <pre> or <code> element.
   */
  const isPreformattedAncestor = (node: Node): boolean => {
    let current = node.parentElement;
    while (current) {
      const tag = current.tagName.toUpperCase();
      if (tag === 'PRE' || tag === 'CODE') {
        return true;
      }
      current = current.parentElement;
    }
    return false;
  };

  /**
   * Checks if a node has a <u> ancestor (up to the root container).
   * Used to preserve whitespace inside underline tags.
   */
  const hasUnderlineAncestor = (node: Node): boolean => {
    let current = node.parentElement;
    while (current) {
      if (current.tagName === 'U') {
        return true;
      }
      current = current.parentElement;
    }
    return false;
  };


  /**
   * Checks if an element is an inline formatting tag.
   */
  const isInlineFormattingTag = (element: Element): boolean => {
    const inlineTags = new Set(['B', 'STRONG', 'EM', 'I', 'U', 'S', 'STRIKE', 'DEL', 'A', 'SPAN']);
    return inlineTags.has(element.tagName.toUpperCase());
  };

  /**
   * Trims unnecessary whitespace from rich text HTML content.
   * - Trims leading/trailing whitespace inside inline formatting tags
   * - Collapses multiple consecutive whitespace between tags into a single space
   * - Removes leading/trailing <br> tags from the overall content
   * - Preserves whitespace inside <pre> and <code> elements
   */
  const trimRichTextWhitespace = (html: string | null | undefined): string => {
    if (!html || typeof html !== 'string' || html.trim() === '') {
      return '';
    }

    try {
      const doc = getDocument();
      const tempDiv = doc.createElement('div');
      tempDiv.innerHTML = html;

      // Remove leading <br> elements from root
      while (tempDiv.firstChild) {
        if (tempDiv.firstChild.nodeType === Node.ELEMENT_NODE && (tempDiv.firstChild as Element).tagName === 'BR') {
          tempDiv.removeChild(tempDiv.firstChild);
        } else if (tempDiv.firstChild.nodeType === Node.TEXT_NODE && tempDiv.firstChild.textContent?.trim() === '') {
          tempDiv.removeChild(tempDiv.firstChild);
        } else {
          break;
        }
      }

      // Remove trailing <br> elements from root
      while (tempDiv.lastChild) {
        if (tempDiv.lastChild.nodeType === Node.ELEMENT_NODE && (tempDiv.lastChild as Element).tagName === 'BR') {
          tempDiv.removeChild(tempDiv.lastChild);
        } else if (tempDiv.lastChild.nodeType === Node.TEXT_NODE && tempDiv.lastChild.textContent?.trim() === '') {
          tempDiv.removeChild(tempDiv.lastChild);
        } else {
          break;
        }
      }

      // Walk text nodes and trim whitespace inside inline formatting tags
      const walker = doc.createTreeWalker(tempDiv, NodeFilter.SHOW_TEXT, null);
      const textNodes: Text[] = [];
      let node: Text | null;
      while ((node = walker.nextNode() as Text | null)) {
        textNodes.push(node);
      }

      for (const textNode of textNodes) {
        if (isPreformattedAncestor(textNode)) {
          continue;
        }

        const parent = textNode.parentElement;
        if (!parent) continue;

        // Normalize non-breaking spaces to regular spaces, then collapse consecutive whitespace
        // Skip collapsing for text nodes inside <u> tags — underlined spaces are visually meaningful
        if (textNode.textContent) {
          if (hasUnderlineAncestor(textNode)) {
            // Only convert nbsp to regular spaces, but preserve all spacing
            textNode.textContent = textNode.textContent.replace(/\u00A0/g, ' ');
          } else {
            textNode.textContent = textNode.textContent
              .replace(/\u00A0/g, ' ')
              .replace(/[ \t]{2,}/g, ' ');
          }
        }

        // Trim leading whitespace if this is the first text node in a formatting tag
        // Skip trimming for text nodes inside <u> tags — underlined spaces are visually meaningful
        if (isInlineFormattingTag(parent) && !hasUnderlineAncestor(textNode)) {
          const firstTextNode = getFirstTextNode(parent);
          if (textNode === firstTextNode && textNode.textContent) {
            textNode.textContent = textNode.textContent.replace(/^[\t ]+/, '');
          }

          const lastTextNode = getLastTextNode(parent);
          if (textNode === lastTextNode && textNode.textContent) {
            textNode.textContent = textNode.textContent.replace(/[\t ]+$/, '');
          }
        }
      }

      // If the result is empty or whitespace-only, return empty string
      // Preserve content if there's a <u> element with non-empty text (underlined whitespace is meaningful)
      const hasUnderlineContent = tempDiv.querySelector('u') !== null
        && tempDiv.querySelector('u')!.textContent !== '';
      if (!tempDiv.textContent?.trim() && !tempDiv.querySelector('img, video, audio') && !hasUnderlineContent) {
        return '';
      }

      return tempDiv.innerHTML;
    } catch {
      // Fail-safe: return original input if parsing fails
      return html;
    }
  };

  /**
   * Get the first text node descendant of an element.
   */
  const getFirstTextNode = (element: Element): Text | null => {
    const doc = getDocument();
    const walker = doc.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
    return walker.nextNode() as Text | null;
  };

  /**
   * Get the last text node descendant of an element.
   */
  const getLastTextNode = (element: Element): Text | null => {
    const doc = getDocument();
    const walker = doc.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
    let last: Text | null = null;
    let current: Text | null;
    while ((current = walker.nextNode() as Text | null)) {
      last = current;
    }
    return last;
  };

  const normalizeHtml = (htmlContent: string): string => {
    const doc = getDocument();
    const tempDiv = doc.createElement('div');
    tempDiv.innerHTML = htmlContent;

    // Remove zero-width spaces
    tempDiv.innerHTML = tempDiv.innerHTML.replace(/\u200B/g, '');

    // Trim rich text whitespace
    tempDiv.innerHTML = trimRichTextWhitespace(tempDiv.innerHTML);

    return tempDiv.innerHTML;
  };

  /**
   * Auto-list trigger: when the user presses Space after typing
   * "1." at the start of a line, convert to ordered list. Similarly "- " or "* "
   * triggers unordered list. Returns the list type triggered, or null.
   */
  const handleAutoListTrigger = (containerElement: HTMLElement): 'orderedList' | 'unorderedList' | null => {
    const sel = getSelection();
    if (!sel || sel.rangeCount === 0 || !sel.isCollapsed) return null;

    const range = sel.getRangeAt(0);
    const node = range.startContainer;

    // Only works on text nodes
    if (node.nodeType !== Node.TEXT_NODE) return null;

    // Don't trigger if already inside a list
    if (isInsideAnyList(containerElement)) return null;

    const textContent = node.textContent || '';
    const offset = range.startOffset;

    // Get the text before the caret on this text node
    const textBeforeCaret = textContent.substring(0, offset);

    // Check for ordered list trigger: line starts with "1." and caret is right after it
    // We need to check that "1." is at the very beginning of the line/block
    // The text node might be the first child of a div/p/br-separated line
    let isStartOfLine = false;

    // Check if this text node is at the start of its parent block
    const parentBlock = node.parentElement;
    if (parentBlock) {
      const firstTextContent = parentBlock.textContent || '';
      // Find where our text node's content starts within the parent
      let precedingText = '';
      for (let i = 0; i < parentBlock.childNodes.length; i++) {
        const child = parentBlock.childNodes[i];
        if (child === node) break;
        precedingText += child.textContent || '';
      }
      // It's start of line if there's no meaningful text before this node
      isStartOfLine = precedingText.trim().length === 0;
    }

    if (!isStartOfLine) return null;

    let listType: 'orderedList' | 'unorderedList' | null = null;
    let prefixLength = 0;

    // Match "1." at start for ordered list
    if (textBeforeCaret === '1.') {
      listType = 'orderedList';
      prefixLength = 2;
    }
    // Match "-" at start for unordered list
    else if (textBeforeCaret === '-') {
      listType = 'unorderedList';
      prefixLength = 1;
    }
    // Match "*" at start for unordered list
    else if (textBeforeCaret === '*') {
      listType = 'unorderedList';
      prefixLength = 1;
    }

    if (!listType) return null;

    // Delete the prefix text before applying list formatting
    const deleteRange = getDocument().createRange();
    deleteRange.setStart(node, 0);
    deleteRange.setEnd(node, prefixLength);
    deleteRange.deleteContents();

    // Apply the list formatting using existing methods
    if (listType === 'orderedList') {
      toggleOrderedList(containerElement);
    } else {
      toggleUnorderedList(containerElement);
    }

    return listType;
  };

  /**
   * Markdown shortcut definitions.
   * Order matters: double-char delimiters (like __) must be checked before single-char ones (_).
   */
  const markdownShortcuts: Array<{
    delimiter: string;
    tag: string;
    command: string;
  }> = [
    { delimiter: '**', tag: 'b', command: 'bold' },
    { delimiter: '~~', tag: 's', command: 'strikeThrough' },
    { delimiter: '_', tag: 'i', command: 'italic' },
  ];

  /**
   * Handle markdown-style shortcuts in the composer.
   * Detects patterns like **text**, _text_, ~~text~~ and converts
   * them to rich text formatting in the contenteditable.
   *
   * Called on every input event. Scans the text node at the cursor for
   * a closing delimiter that completes a markdown pattern, then replaces
   * the raw markdown with the corresponding HTML tag.
   *
   * Returns true if a shortcut was applied.
   */
  const handleMarkdownShortcuts = (
    containerElement: HTMLElement,
    onBeforeConversion?: () => void
  ): boolean => {
    const sel = getSelection();
    if (!sel || sel.rangeCount === 0 || !sel.isCollapsed) return false;

    const range = sel.getRangeAt(0);
    const node = range.startContainer;

    // Only works on text nodes
    if (node.nodeType !== Node.TEXT_NODE) return false;

    // Don't trigger inside code blocks or inline code
    if (isInsideCodeBlock(containerElement) || isInsideCodeInline(containerElement)) return false;

    // Don't trigger inside mention elements (Req 16.1)
    let mentionCheck: Node | null = node;
    while (mentionCheck && mentionCheck !== containerElement) {
      if (mentionCheck.nodeType === Node.ELEMENT_NODE &&
          (mentionCheck as HTMLElement).classList.contains('cometchat-mentions')) {
        return false;
      }
      mentionCheck = mentionCheck.parentNode;
    }

    // Don't trigger inside link/anchor elements (Req 16.3)
    let linkCheck: Node | null = node;
    while (linkCheck && linkCheck !== containerElement) {
      if (linkCheck.nodeType === Node.ELEMENT_NODE &&
          (linkCheck as HTMLElement).tagName === 'A') {
        return false;
      }
      linkCheck = linkCheck.parentNode;
    }

    const text = node.textContent || '';
    const offset = range.startOffset;

    // We need the text up to the cursor
    const textBeforeCursor = text.substring(0, offset);

    for (const shortcut of markdownShortcuts) {
      const delim = shortcut.delimiter;
      const delimLen = delim.length;

      // Text must end with the closing delimiter
      if (!textBeforeCursor.endsWith(delim)) continue;

      // Find the opening delimiter before the closing one
      // Search backwards from just before the closing delimiter
      const searchArea = textBeforeCursor.substring(0, textBeforeCursor.length - delimLen);
      const openIdx = searchArea.lastIndexOf(delim);

      // Must have an opening delimiter with content between them
      if (openIdx < 0) continue;

      const innerText = searchArea.substring(openIdx + delimLen);

      // Inner text must be non-empty and not just whitespace
      if (!innerText || !innerText.trim()) continue;

      // For single-char delimiters, make sure we're not actually matching a double-char pattern
      // e.g., when typing `__text__`, don't let the single `_` matcher grab it
      if (delim === '_' && openIdx > 0 && searchArea[openIdx - 1] === '_') continue;
      if (delim === '_') {
        // Also check if the closing delimiter is actually part of `__`
        const afterClose = text.substring(offset);
        if (afterClose.startsWith('_')) continue;
      }

      // We have a match! Save state before conversion (for undo)
      if (onBeforeConversion) {
        onBeforeConversion();
      }

      // Replace the markdown with formatted HTML
      const doc = getDocument();

      // Calculate the full range to replace: from openIdx to offset
      const replaceStart = openIdx;
      const replaceEnd = offset;

      // Create the formatted element
      const formattedEl = doc.createElement(shortcut.tag);
      formattedEl.textContent = innerText;

      // Split the text node and replace the markdown portion
      const beforeText = text.substring(0, replaceStart);
      const afterText = text.substring(replaceEnd);

      // Build replacement: textBefore + formattedElement + textAfter
      const parent = node.parentNode;
      if (!parent) return false;

      const frag = doc.createDocumentFragment();
      if (beforeText) {
        frag.appendChild(doc.createTextNode(beforeText));
      }
      frag.appendChild(formattedEl);

      // Add a zero-width space after so the cursor exits the formatted element
      const cursorNode = doc.createTextNode('\u200B' + afterText);
      frag.appendChild(cursorNode);

      parent.replaceChild(frag, node);

      // Place cursor after the formatted element (after the ZWS)
      const newRange = doc.createRange();
      newRange.setStart(cursorNode, 1);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);

      return true;
    }

    return false;
  };

  // Stub functions for compatibility
  const isFormattingModeActive = (): boolean => false;
  const getActiveFormattingModes = (): FormatType[] => [];
  const applyFormat = (): void => {};
  const removeFormat = (): void => {};
  const toggleFormattingMode = (): void => {};
  const findFormattingAncestor = (): HTMLElement | null => null;

  /**
   * Handle input events to preserve inline code formatting when typing
   * over selected text inside a <code> element.
   *
   * Browser behavior: When text inside a <code> is fully selected and the
   * user types, the browser replaces the entire <code> element with a plain
   * text node. This function detects that scenario by checking if the caret
   * is no longer inside a <code> element after an input event, but was
   * previously inside one.
   *
   * @param containerElement - The contenteditable element
   * @param wasInsideInlineCode - Whether the caret was inside inline code before the input
   */
  const handleInlineCodePreservation = (
    containerElement: HTMLElement,
    wasInsideInlineCode: boolean
  ): void => {
    if (!wasInsideInlineCode) return;

    // If still inside inline code, no re-wrapping needed
    if (isInsideCodeInline(containerElement)) return;

    const sel = getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    const textNode = range.startContainer;

    // Only wrap text nodes
    if (textNode.nodeType !== Node.TEXT_NODE || !textNode.parentNode) return;

    const doc = getDocument();
    const code = doc.createElement('code');
    code.className = 'cometchat-rich-text-code-inline';

    try {
      textNode.parentNode.insertBefore(code, textNode);
      code.appendChild(textNode);

      // Restore caret inside the new code element
      const newRange = doc.createRange();
      newRange.setStart(textNode, range.startOffset);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);
    } catch {
      // If wrapping fails, leave the text as-is
    }
  };

  /**
   * Get the current cursor position as a text offset within the container.
   * Traverses all text nodes and calculates the cumulative offset.
   * 
   * @param containerElement - The contenteditable element
   * @returns The text offset of the cursor, or -1 if no selection
   */
  const getTextOffsetAtCursor = (containerElement: HTMLElement): number => {
    const sel = getSelection();
    if (!sel || sel.rangeCount === 0) return -1;

    const range = sel.getRangeAt(0);
    const doc = getDocument();
    
    let offset = 0;
    const walker = doc.createTreeWalker(
      containerElement,
      NodeFilter.SHOW_TEXT,
      null
    );

    let currentNode: Node | null = walker.nextNode();
    while (currentNode) {
      if (currentNode === range.startContainer) {
        offset += range.startOffset;
        break;
      }
      offset += (currentNode.textContent || '').length;
      currentNode = walker.nextNode();
    }

    return offset;
  };

  /**
   * Set the cursor position by text offset within the container.
   * Traverses text nodes to find the target position.
   * 
   * @param containerElement - The contenteditable element
   * @param offset - The text offset where the cursor should be positioned
   */
  const setCursorByTextOffset = (
    containerElement: HTMLElement,
    offset: number
  ): void => {
    const sel = getSelection();
    if (!sel) return;

    const doc = getDocument();
    const walker = doc.createTreeWalker(
      containerElement,
      NodeFilter.SHOW_TEXT,
      null
    );

    let currentOffset = 0;
    let currentNode: Node | null = walker.nextNode();

    while (currentNode) {
      const nodeLength = (currentNode.textContent || '').length;
      
      if (currentOffset + nodeLength >= offset) {
        // Found the target node
        const nodeOffset = offset - currentOffset;
        const range = doc.createRange();
        range.setStart(currentNode, nodeOffset);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        return;
      }

      currentOffset += nodeLength;
      currentNode = walker.nextNode();
    }

    // If offset is beyond all text, place cursor at end
    const range = doc.createRange();
    range.selectNodeContents(containerElement);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  };

  /**
   * Convert markdown pattern to formatted HTML.
   * Removes delimiters, applies formatting, and inserts the formatted content.
   * 
   * @param containerElement - The contenteditable element
   * @param startOffset - Text offset of opening delimiter
   * @param endOffset - Text offset of closing delimiter (end position)
   * @param contentStart - Text offset after opening delimiter
   * @param contentEnd - Text offset before closing delimiter
   * @param formatType - The format to apply
   */
  /**
   * Helper to find the text node and local offset for a given global text offset
   * within a container element. Walks all text nodes in document order.
   */
  const findNodeAtTextOffset = (
    containerElement: HTMLElement,
    targetOffset: number
  ): { node: Node; offset: number } | null => {
    const doc = getDocument();
    const walker = doc.createTreeWalker(containerElement, NodeFilter.SHOW_TEXT, null);
    let currentOffset = 0;
    let node: Node | null = walker.nextNode();
    while (node) {
      const nodeLength = (node.textContent || '').length;
      if (currentOffset + nodeLength >= targetOffset) {
        return { node, offset: targetOffset - currentOffset };
      }
      currentOffset += nodeLength;
      node = walker.nextNode();
    }
    return null;
  };

  const convertMarkdownToFormat = (
    containerElement: HTMLElement,
    startOffset: number,
    endOffset: number,
    contentStart: number,
    contentEnd: number,
    formatType: FormatType,
    linkUrl?: string
  ): void => {
    const doc = getDocument();
    const sel = getSelection();
    if (!sel) return;

    // Locate text nodes for all four boundary points
    const startInfo = findNodeAtTextOffset(containerElement, startOffset);
    const contentStartInfo = findNodeAtTextOffset(containerElement, contentStart);
    const contentEndInfo = findNodeAtTextOffset(containerElement, contentEnd);
    const endInfo = findNodeAtTextOffset(containerElement, endOffset);

    if (!startInfo || !contentStartInfo || !contentEndInfo || !endInfo) return;

    // --- Strategy: remove closing delimiter first (higher offset), then opening,
    // then wrap the content in between. This avoids offset invalidation. ---

    // 1. Build range for closing delimiter and delete it
    const closeRange = doc.createRange();
    closeRange.setStart(contentEndInfo.node, contentEndInfo.offset);
    closeRange.setEnd(endInfo.node, endInfo.offset);
    closeRange.deleteContents();

    // 2. Build range for content between delimiters (after close delimiter removed).
    //    Re-locate content boundaries since DOM may have shifted after close deletion.
    //    The opening delimiter and content are still intact, so re-find from startOffset.
    const openStartInfo = findNodeAtTextOffset(containerElement, startOffset);
    const openEndInfo = findNodeAtTextOffset(containerElement, contentStart);
    if (!openStartInfo || !openEndInfo) return;

    // 3. Delete opening delimiter
    const openRange = doc.createRange();
    openRange.setStart(openStartInfo.node, openStartInfo.offset);
    openRange.setEnd(openEndInfo.node, openEndInfo.offset);
    openRange.deleteContents();

    // 4. Now the content (with any inner formatted elements) sits at startOffset.
    //    Build a range around it and extract it as a DocumentFragment to preserve DOM nodes.
    const contentLen = contentEnd - contentStart;
    const newContentStart = findNodeAtTextOffset(containerElement, startOffset);
    // For the end, we need startOffset + contentLen. But if contentLen is 0 there's nothing.
    if (contentLen <= 0 || !newContentStart) return;

    // Walk to find the end of the content region
    const newContentEnd = findNodeAtTextOffset(containerElement, startOffset + contentLen);
    if (!newContentEnd) return;

    const contentRange = doc.createRange();
    contentRange.setStart(newContentStart.node, newContentStart.offset);
    contentRange.setEnd(newContentEnd.node, newContentEnd.offset);

    // Extract preserves inner DOM elements (e.g. <em>, <strong>)
    const contentFragment = contentRange.extractContents();

    // 5. Create the formatted wrapper element
    let formattedElement: HTMLElement;

    switch (formatType) {
      case 'bold':
        formattedElement = doc.createElement('strong');
        break;
      case 'italic':
        formattedElement = doc.createElement('em');
        break;
      case 'underline':
        formattedElement = doc.createElement('u');
        break;
      case 'strikethrough':
        formattedElement = doc.createElement('s');
        break;
      case 'codeInline':
        formattedElement = doc.createElement('code');
        formattedElement.className = 'cometchat-rich-text-code-inline';
        break;
      case 'codeBlock': {
        const pre = doc.createElement('pre');
        pre.className = 'cometchat-rich-text-code-block';
        const code = doc.createElement('code');
        // Code blocks use plain text content (no nested formatting)
        code.textContent = contentFragment.textContent || '';
        pre.appendChild(code);
        formattedElement = pre;
        break;
      }
      case 'link': {
        const anchor = doc.createElement('a');
        anchor.href = linkUrl || '';
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';
        anchor.className = 'cometchat-rich-text-link';
        formattedElement = anchor;
        break;
      }
      default:
        return;
    }

    // 6. Append the extracted content into the wrapper (preserving inner elements)
    if (formatType !== 'codeBlock') {
      formattedElement.appendChild(contentFragment);
    }

    // 7. Insert the formatted element at the extraction point
    contentRange.insertNode(formattedElement);

    // Position cursor after the formatted element
    positionCursorAfterFormat(containerElement, formattedElement);
  };

  /**
   * Position cursor immediately after a formatted node.
   * Inserts a zero-width space to prevent format inheritance.
   * 
   * @param containerElement - The contenteditable element
   * @param formattedNode - The formatted node that was just inserted
   */
  const positionCursorAfterFormat = (
    containerElement: HTMLElement,
    formattedNode: Node
  ): void => {
    const sel = getSelection();
    if (!sel) return;

    const doc = getDocument();
    const range = doc.createRange();

    // Position after the formatted node
    range.setStartAfter(formattedNode);
    range.collapse(true);

    // Insert zero-width space to prevent format inheritance
    const zws = doc.createTextNode('\u200B');
    range.insertNode(zws);

    // Move cursor after zero-width space
    range.setStartAfter(zws);
    range.collapse(true);

    sel.removeAllRanges();
    sel.addRange(range);

    // Clear any pending formats to ensure new text is unformatted
    clearPendingFormats();
  };

  /**
   * Apply markdown conversion for a detected pattern match.
   * Coordinates pattern match, conversion, and cursor positioning.
   * Handles DOM manipulation errors gracefully with state restoration.
   * 
   * @param containerElement - The contenteditable element
   * @param match - The detected pattern match
   * @param formatType - The format type to apply
   */
  const applyMarkdownConversion = (
    containerElement: HTMLElement,
    match: { startOffset: number; endOffset: number; contentStart: number; contentEnd: number; linkUrl?: string },
    formatType: FormatType
  ): void => {
    // Snapshot DOM state and cursor position before conversion for error recovery (Task 11.2)
    const originalHtml = containerElement.innerHTML;
    const sel = getSelection();
    let savedCursorOffset = -1;
    if (sel && sel.rangeCount > 0 && sel.isCollapsed) {
      savedCursorOffset = getTextOffsetAtCursor(containerElement);
    }

    try {
      convertMarkdownToFormat(
        containerElement,
        match.startOffset,
        match.endOffset,
        match.contentStart,
        match.contentEnd,
        formatType,
        match.linkUrl
      );
    } catch (error) {
      console.error('Markdown conversion DOM manipulation failed:', error);

      // Restore original state on error (Req 6.3, 13.2)
      try {
        containerElement.innerHTML = originalHtml;

        // Restore cursor position
        if (savedCursorOffset >= 0) {
          setCursorByTextOffset(containerElement, savedCursorOffset);
        }
      } catch (restoreError) {
        console.error('Failed to restore state after markdown conversion error:', restoreError);
        // Last resort: ensure cursor is at least somewhere in the container
        try {
          containerElement.focus();
        } catch (_) {
          // Silently fail — nothing more we can do
        }
      }
    }
  };

  return {
    // Selection utilities
    getSelection,
    saveSelection,
    restoreSelection,
    hasSelection,
    getSelectedText,
    
    // Format checking
    isFormatted,
    isFormattingModeActive,
    getActiveFormats,
    getActiveFormattingModes,
    findFormattingAncestor,
    
    // Format operations
    applyFormat,
    removeFormat,
    toggleFormat,
    toggleFormattingMode,
    
    // Convenience methods - basic formatting
    toggleBold,
    toggleItalic,
    toggleUnderline,
    toggleStrikethrough,
    
    // Convenience methods - link
    insertLink,
    updateLink,
    removeLink,
    isInsideLink,
    
    // Convenience methods - lists
    toggleOrderedList,
    toggleUnorderedList,
    fixOrderedListContinuation,
    isInsideList,
    isInsideAnyList,
    getCurrentListItem,
    isCurrentListItemEmpty,
    isCursorAtListItemStart,
    handleListBackspace,
    handleListEnter,
    handleListTab,
    handleCodeBlockEnter,
    handleCodeBlockBackspace,
    handleAutoListTrigger,
    applyListInlineStyles,
    
    // Convenience methods - blockquote
    toggleBlockquote,
    isInsideBlockquote,
    
    // Convenience methods - code
    toggleCodeInline,
    toggleCodeBlock,
    isInsideCodeInline,
    isInsideCodeBlock,
    handleInlineCodePreservation,
    
    // Mode management
    clearFormattingModes,
    resetFontContext,
    
    // Keyboard handling
    handleKeyboardShortcut,
    handleArrowKeyInCode,
    
    // Content utilities
    getPlainText,
    normalizeHtml,
    trimRichTextWhitespace,

    // Markdown shortcuts
    handleMarkdownShortcuts,

    // Pending format tracking (for pre-armed inline formats)
    clearPendingFormats,
    getPendingFormats,

    // Markdown conversion utilities
    getTextOffsetAtCursor,
    setCursorByTextOffset,
    convertMarkdownToFormat,
    positionCursorAfterFormat,
    applyMarkdownConversion,
  };
}

/**
 * React hook for rich text formatting
 */
export function useRichTextFormatting(
  getDocument: () => Document,
  getWindow: () => Window
) {
  return createRichTextFormatter(getDocument, getWindow);
}

export default useRichTextFormatting;
