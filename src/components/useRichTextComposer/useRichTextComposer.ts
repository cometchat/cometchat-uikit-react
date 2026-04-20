import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { createRichTextFormatter, FormatType } from "../../utils/RichTextFormatting";
import { CometChatRichTextFormatter } from "../../formatters/CometChatFormatters/CometChatRichTextFormatter";
import { CometChatMarkdownFormatter } from "../../formatters/CometChatFormatters/CometChatMarkdownFormatter/CometChatMarkdownFormatter";
import { CometChatTextFormatter } from "../../formatters/CometChatFormatters/CometChatTextFormatter";
import { isMobileDevice } from "../../utils/util";
import {
  TRIGGER_CHARS,
  detectMarkdownPattern,
  validatePattern,
  findScopeBoundaries,
  isCursorInsideMention,
  isCursorInsideLink,
  patternCrossesMentionOrLink,
  DetectionContext,
} from "../../utils/MarkdownPatternDetector";

/**
 * Configuration for the useRichTextComposer hook
 */
export interface RichTextComposerConfig {
  enableRichTextEditor: boolean;
  hideRichTextFormattingOptions: boolean;
  showToolbarOnSelection: boolean;
  getCurrentDocument: () => Document;
  getCurrentWindow: () => Window;
  getCurrentInput: () => Element | null | undefined;
  composerContainerClass: string;
  errorHandler: (error: unknown, context: string) => void;
  setTextFormatters: React.Dispatch<React.SetStateAction<CometChatTextFormatter[]>>;
}

export interface LinkPopoverData {
  linkText: string;
  linkUrl: string;
  linkElement: HTMLAnchorElement | null;
  position: { top: number; left: number };
}

export interface LinkEditData {
  url: string;
  text: string;
}

/**
 * State for undoing markdown conversions
 */
export interface MarkdownUndoState {
  originalHtml: string;
  cursorPosition: number;
  timestamp: number;
}

/**
 * Shared hook that encapsulates all rich text formatting logic
 * used by both CometChatMessageComposer and CometChatCompactMessageComposer.
 */
export function useRichTextComposer(config: RichTextComposerConfig) {
  const {
    enableRichTextEditor,
    hideRichTextFormattingOptions,
    showToolbarOnSelection,
    getCurrentDocument,
    getCurrentWindow,
    getCurrentInput,
    composerContainerClass,
    errorHandler,
    setTextFormatters,
  } = config;

  // --- State ---
  const [isFixedToolbarVisible, setIsFixedToolbarVisible] = useState(!hideRichTextFormattingOptions);
  const [isFloatingToolbarVisible, setIsFloatingToolbarVisible] = useState(false);
  const [floatingToolbarPosition, setFloatingToolbarPosition] = useState<{ top: number; left: number } | null>(null);
  const [activeFormats, setActiveFormats] = useState<FormatType[]>([]);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [showLinkPopover, setShowLinkPopover] = useState(false);
  const [linkPopoverData, setLinkPopoverData] = useState<LinkPopoverData | null>(null);
  const [isLinkEditMode, setIsLinkEditMode] = useState(false);
  const [linkEditData, setLinkEditData] = useState<LinkEditData | null>(null);
  const [linkDialogSelectedText, setLinkDialogSelectedText] = useState<string>('');

  const savedSelectionRef = useRef<Range | null>(null);
  // Ref to store selected text immediately (avoids React state batching issues)
  const linkDialogSelectedTextRef = useRef<string>('');

  // --- Markdown undo stack ---
  const markdownUndoStack = useRef<MarkdownUndoState[]>([]);

  // --- Rich text formatter instance ---
  const richTextFormatter = useMemo(() => {
    if (!enableRichTextEditor) return null;
    return createRichTextFormatter(getCurrentDocument, getCurrentWindow);
  }, [enableRichTextEditor]);

  // --- CometChatRichTextFormatter for HTML→Markdown conversion on send ---
  const richTextFormatterInstance = useRef<CometChatRichTextFormatter | null>(null);
  // --- CometChatMarkdownFormatter for Markdown→HTML conversion in edit flow ---
  const markdownFormatterInstance = useRef<CometChatMarkdownFormatter | null>(null);

  useEffect(() => {
    if (enableRichTextEditor) {
      if (!richTextFormatterInstance.current) {
        richTextFormatterInstance.current = new CometChatRichTextFormatter();
      }
      if (!markdownFormatterInstance.current) {
        markdownFormatterInstance.current = new CometChatMarkdownFormatter();
      }
      setTextFormatters(prevFormatters => {
        let updated = prevFormatters;
        const rtFormatter = richTextFormatterInstance.current!;
        const mdFormatter = markdownFormatterInstance.current!;
        if (!updated.some(f => f.getId() === rtFormatter.getId())) {
          // Add at the beginning so HTML→Markdown conversion happens first
          updated = [rtFormatter, ...updated];
        }
        if (!updated.some(f => f instanceof CometChatMarkdownFormatter)) {
          // Add after rich text formatter so markdown→HTML runs during edit flow
          const rtIdx = updated.indexOf(rtFormatter);
          updated = [...updated.slice(0, rtIdx + 1), mdFormatter, ...updated.slice(rtIdx + 1)];
        }
        return updated === prevFormatters ? prevFormatters : updated;
      });
    }
  }, [enableRichTextEditor]);

  // --- Link handlers ---
  const handleLinkClick = useCallback(() => {
    let selectedText = '';
    if (richTextFormatter) {
      // Save selection first, then extract text from the saved range
      // This ensures we get the text even if the browser selection is lost on click
      const savedRange = richTextFormatter.saveSelection();
      savedSelectionRef.current = savedRange;
      selectedText = richTextFormatter.getSelectedText(savedRange);
    }
    // Set both ref (immediate) and state (for re-renders)
    // The ref ensures the dialog gets the value immediately on mount
    linkDialogSelectedTextRef.current = selectedText;
    setLinkDialogSelectedText(selectedText);
    setShowLinkInput(true);
  }, [richTextFormatter]);

  const handleLinkSubmit = useCallback((url: string, displayText?: string) => {
    const inputElement = getCurrentInput();
    if (!inputElement || !richTextFormatter) {
      setShowLinkInput(false);
      setIsLinkEditMode(false);
      setLinkEditData(null);
      return;
    }
    const container = inputElement as HTMLElement;
    container.focus();
    if (savedSelectionRef.current) {
      richTextFormatter.restoreSelection(savedSelectionRef.current);
    }
    if (isLinkEditMode) {
      richTextFormatter.updateLink(url, displayText, container);
    } else {
      // When we had selected text before opening the dialog, ensure the
      // selection is still active.  If the browser lost it (e.g. focus moved
      // to the dialog), delete the old selected text first so insertLink
      // won't duplicate it.
      const hadSelectedText = linkDialogSelectedTextRef.current;
      const selNow = (getCurrentWindow()).getSelection();
      const selectionStillActive = selNow && selNow.toString().length > 0;

      if (hadSelectedText && !selectionStillActive && savedSelectionRef.current) {
        // Re-select the saved range and delete its contents so we can
        // insert a clean anchor without leftover text.
        try {
          richTextFormatter.restoreSelection(savedSelectionRef.current);
          const sel2 = (getCurrentWindow()).getSelection();
          if (sel2 && sel2.rangeCount > 0) {
            sel2.getRangeAt(0).deleteContents();
          }
        } catch (_e) {
          // Ignore – insertLink will handle gracefully
        }
      }

      richTextFormatter.insertLink(url, displayText || hadSelectedText, container);
    }
    savedSelectionRef.current = null;
    setShowLinkInput(false);
    setIsLinkEditMode(false);
    setLinkEditData(null);
    linkDialogSelectedTextRef.current = '';
    setLinkDialogSelectedText('');
    // Update toolbar active formats immediately after link insertion
    const formats = richTextFormatter.getActiveFormats(container);
    setActiveFormats(formats);
  }, [richTextFormatter, isLinkEditMode]);

  const handleLinkCancel = useCallback(() => {
    savedSelectionRef.current = null;
    setShowLinkInput(false);
    setIsLinkEditMode(false);
    setLinkEditData(null);
    linkDialogSelectedTextRef.current = '';
    setLinkDialogSelectedText('');
  }, []);

  // --- Input click handler for link popover ---
  const handleInputClick = useCallback((event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    const linkElement = target.tagName === 'A'
      ? target as HTMLAnchorElement
      : target.closest('a') as HTMLAnchorElement | null;

    if (linkElement && enableRichTextEditor) {
      event.preventDefault();
      event.stopPropagation();

      const rect = linkElement.getBoundingClientRect();
      const composerElement = target.closest(`.${composerContainerClass}`);
      const composerRect = composerElement?.getBoundingClientRect();

      const top = rect.top - (composerRect?.top || 0) - 8;
      const left = rect.left - (composerRect?.left || 0);

      setLinkPopoverData({
        linkText: linkElement.textContent || '',
        linkUrl: linkElement.href || '',
        linkElement,
        position: { top, left }
      });
      setShowLinkPopover(true);
    }
  }, [enableRichTextEditor, composerContainerClass]);

  // --- Link popover handlers ---
  const handleLinkPopoverEdit = useCallback(() => {
    if (linkPopoverData?.linkElement && richTextFormatter) {
      const doc = getCurrentDocument();
      const range = doc.createRange();
      range.selectNodeContents(linkPopoverData.linkElement);
      savedSelectionRef.current = range;

      setIsLinkEditMode(true);
      setLinkEditData({
        url: linkPopoverData.linkUrl,
        text: linkPopoverData.linkText
      });
      setShowLinkPopover(false);
      setLinkPopoverData(null);
      setShowLinkInput(true);
    }
  }, [linkPopoverData, richTextFormatter]);

  const handleLinkPopoverRemove = useCallback(() => {
    if (linkPopoverData?.linkElement && richTextFormatter) {
      const inputElement = getCurrentInput();
      if (inputElement) {
        const doc = getCurrentDocument();
        const win = getCurrentWindow();
        const range = doc.createRange();
        range.selectNodeContents(linkPopoverData.linkElement);
        const sel = win.getSelection();
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(range);
        }
        richTextFormatter.removeLink(inputElement as HTMLElement);
      }
    }
    setShowLinkPopover(false);
    setLinkPopoverData(null);
  }, [linkPopoverData, richTextFormatter]);

  const handleLinkPopoverClose = useCallback(() => {
    setShowLinkPopover(false);
    setLinkPopoverData(null);
  }, []);

  // --- Format applied handler ---
  const handleFormatApplied = useCallback(() => {
    if (richTextFormatter) {
      const inputElement = getCurrentInput();
      if (inputElement) {
        const formats = richTextFormatter.getActiveFormats(inputElement as HTMLElement);
        setActiveFormats(formats);
      }
    }
  }, [richTextFormatter]);

  // --- Markdown undo handlers ---
  /**
   * Save the current state before markdown conversion for undo functionality
   */
  const saveMarkdownUndoState = useCallback(() => {
    const inputElement = getCurrentInput();
    if (!inputElement || !richTextFormatter) return;

    const originalHtml = (inputElement as HTMLElement).innerHTML;
    const cursorPosition = richTextFormatter.getTextOffsetAtCursor(inputElement as HTMLElement);

    const undoState: MarkdownUndoState = {
      originalHtml,
      cursorPosition,
      timestamp: Date.now()
    };

    // Keep only the most recent undo state (support one level of undo)
    markdownUndoStack.current = [undoState];
  }, [richTextFormatter]);

  /**
   * Handle undo for markdown conversions (Ctrl+Z / Cmd+Z)
   * Restores the original markdown syntax text and cursor position
   */
  const handleMarkdownUndo = useCallback(() => {
    if (markdownUndoStack.current.length === 0) return false;

    const inputElement = getCurrentInput();
    if (!inputElement || !richTextFormatter) return false;

    const undoState = markdownUndoStack.current.pop();
    if (!undoState) return false;

    // Restore the original HTML
    (inputElement as HTMLElement).innerHTML = undoState.originalHtml;

    // Restore the cursor position
    richTextFormatter.setCursorByTextOffset(
      inputElement as HTMLElement,
      undoState.cursorPosition
    );

    // Update toolbar state
    const formats = richTextFormatter.getActiveFormats(inputElement as HTMLElement);
    setActiveFormats(formats);

    return true;
  }, [richTextFormatter]);

  // --- Markdown trigger character check (Task 4.2) ---
  /**
   * Check if a character is a markdown trigger character.
   * Uses the TRIGGER_CHARS map from MarkdownPatternDetector for efficient lookup.
   */
  const isMarkdownTriggerChar = useCallback((char: string): boolean => {
    return char in TRIGGER_CHARS;
  }, []);

  // --- Markdown detection and conversion coordinator (Task 4.3) ---
  /**
   * Detects and converts markdown patterns at the current cursor position.
   * Coordinates pattern detection, validation, conversion, and toolbar state update.
   *
   * @param containerElement - The contenteditable element
   * @param triggerChar - The character that triggered detection
   * @returns true if a conversion was performed, false otherwise
   */
  const detectAndConvertMarkdown = useCallback((
    containerElement: HTMLElement,
    triggerChar: string
  ): boolean => {
    if (!richTextFormatter) return false;

    // Performance threshold for pattern detection (ms) - Req 6.1, 13.1
    const DETECTION_PERF_THRESHOLD = 100;

    try {
      const win = getCurrentWindow();
      const sel = win.getSelection();
      if (!sel || sel.rangeCount === 0 || !sel.isCollapsed) return false;

      const range = sel.getRangeAt(0);
      const cursorNode = range.startContainer;
      const cursorOffset = range.startOffset;

      // Don't trigger inside code blocks or inline code
      if (richTextFormatter.isInsideCodeBlock(containerElement) ||
          richTextFormatter.isInsideCodeInline(containerElement)) {
        return false;
      }

      // Don't trigger inside mention elements (Req 16.1 / Task 9.1)
      if (isCursorInsideMention(cursorNode, containerElement)) {
        return false;
      }

      // Don't trigger inside link/anchor elements (Req 16.3 / Task 9.2)
      if (isCursorInsideLink(cursorNode, containerElement)) {
        return false;
      }

      // Get scope boundaries for the current block element
      const scopeBounds = findScopeBoundaries(containerElement, cursorNode, cursorOffset);

      // Get full text content and cursor text offset
      const fullText = containerElement.textContent || '';
      const cursorTextOffset = richTextFormatter.getTextOffsetAtCursor(containerElement);
      if (cursorTextOffset < 0) return false;

      // Build detection context
      const context: DetectionContext = {
        text: fullText,
        cursorOffset: cursorTextOffset,
        triggerChar,
        scopeStart: scopeBounds.start,
        scopeEnd: scopeBounds.end,
      };

      // --- Performance monitoring for pattern detection (Task 11.1) ---
      const detectionStart = performance.now();

      // Detect markdown pattern
      const match = detectMarkdownPattern(context);

      // Validate the detected pattern (part of detection phase)
      const isValid = match ? validatePattern(match, context) : false;

      const detectionDuration = performance.now() - detectionStart;
      if (detectionDuration > DETECTION_PERF_THRESHOLD) {
        console.warn(
          `Markdown pattern detection took ${detectionDuration.toFixed(1)}ms (threshold: ${DETECTION_PERF_THRESHOLD}ms). ` +
          `Text length: ${fullText.length}, trigger: '${triggerChar}'`
        );
      }

      if (!match || !isValid) return false;

      // Don't convert if pattern spans across mention or link boundaries (Task 9.1, 9.2)
      if (patternCrossesMentionOrLink(containerElement, match.startOffset, match.endOffset)) {
        return false;
      }

      // Save undo state before conversion
      saveMarkdownUndoState();

      // Map pattern type to FormatType
      const formatType = match.pattern.type as FormatType;

      // Apply the conversion
      richTextFormatter.applyMarkdownConversion(containerElement, match, formatType);

      // --- Focus maintenance verification (Task 11.3) ---
      // Ensure the composer retains focus after conversion (Req 6.4, 8.4)
      if (getCurrentDocument().activeElement !== containerElement &&
          !containerElement.contains(getCurrentDocument().activeElement)) {
        containerElement.focus();
      }

      // Verify cursor is still present and visible after conversion
      const postSel = win.getSelection();
      if (!postSel || postSel.rangeCount === 0) {
        // Cursor was lost during conversion — restore to end of container
        const restoreRange = getCurrentDocument().createRange();
        restoreRange.selectNodeContents(containerElement);
        restoreRange.collapse(false);
        const newSel = win.getSelection();
        if (newSel) {
          newSel.removeAllRanges();
          newSel.addRange(restoreRange);
        }
      }

      // Update toolbar state after conversion
      const formats = richTextFormatter.getActiveFormats(containerElement);
      setActiveFormats(formats);

      return true;
    } catch (error) {
      console.warn('Markdown detection and conversion failed:', error);
      return false;
    }
  }, [richTextFormatter, saveMarkdownUndoState]);

  // --- Markdown input event handler (Task 4.1) ---
  /**
   * Handles beforeinput events to detect markdown trigger characters.
   * Only processes `insertText` input type and checks if the inserted
   * character is a final character of a markdown delimiter.
   */
  const handleMarkdownInput = useCallback((event: InputEvent) => {
    // Only handle insertText input type
    if (event.inputType !== 'insertText') return;

    const data = event.data;
    if (!data || data.length !== 1) return;

    // Check if the character is a markdown trigger character
    if (!isMarkdownTriggerChar(data)) return;

    const inputElement = getCurrentInput() as HTMLElement;
    if (!inputElement) return;

    // Use requestAnimationFrame to let the character be inserted into the DOM first,
    // then run detection on the updated content
    requestAnimationFrame(() => {
      detectAndConvertMarkdown(inputElement, data);
    });
  }, [isMarkdownTriggerChar, detectAndConvertMarkdown]);

  // --- Wire up beforeinput event listener (Task 4.4) ---
  useEffect(() => {
    if (!enableRichTextEditor || !richTextFormatter || hideRichTextFormattingOptions) {
      return;
    }

    const inputElement = getCurrentInput() as HTMLElement;
    if (!inputElement) return;

    const listener = (e: Event) => handleMarkdownInput(e as InputEvent);
    inputElement.addEventListener('beforeinput', listener);

    return () => {
      inputElement.removeEventListener('beforeinput', listener);
    };
  }, [enableRichTextEditor, richTextFormatter, hideRichTextFormattingOptions, handleMarkdownInput]);

  /**
   * Handles rich text keyboard shortcuts inside onKeyDown.
   * Returns true if the event was handled (caller should return early).
   */
  const handleFormattingKeyDown = useCallback((event: KeyboardEvent, contenteditable: Element): boolean => {
    if (!enableRichTextEditor || !richTextFormatter || !contenteditable || hideRichTextFormattingOptions) {
      return false;
    }

    const isMac = /mac/i.test(navigator.userAgent);
    const modifier = isMac ? event.metaKey : event.ctrlKey;

    // Ctrl/Cmd+Z → undo markdown conversion
    if (modifier && event.key.toLowerCase() === 'z' && !event.shiftKey) {
      // Check if we have markdown undo state
      if (markdownUndoStack.current.length > 0) {
        event.preventDefault();
        handleMarkdownUndo();
        return true;
      }
      // If no markdown undo state, let browser handle default undo
      return false;
    }

    // Ctrl/Cmd+K → show link dialog
    if (modifier && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      // Suppress link dialog inside code blocks
      if (richTextFormatter.isInsideCodeBlock(contenteditable as HTMLElement)) {
        return true;
      }
      let selectedText = '';
      if (richTextFormatter) {
        // Save selection first, then extract text from the saved range
        const savedRange = richTextFormatter.saveSelection();
        savedSelectionRef.current = savedRange;
        selectedText = richTextFormatter.getSelectedText(savedRange);
      }
      // Set both ref (immediate) and state (for re-renders)
      linkDialogSelectedTextRef.current = selectedText;
      setLinkDialogSelectedText(selectedText);
      setShowLinkInput(true);
      return true;
    }

    // Shift+Enter for list / code block / inline code behavior
    // List takes precedence over code block when both are active
    if (event.keyCode === 13 && event.shiftKey) {
      const listHandled = richTextFormatter.handleListEnter(contenteditable as HTMLElement);
      if (listHandled) {
        event.preventDefault();
        return true;
      }
      const codeBlockHandled = richTextFormatter.handleCodeBlockEnter(contenteditable as HTMLElement);
      if (codeBlockHandled) {
        event.preventDefault();
        return true;
      }
      const inlineCodeHandled = richTextFormatter.handleInlineCodeEnter(contenteditable as HTMLElement);
      if (inlineCodeHandled) {
        event.preventDefault();
        return true;
      }
    }

    // Tab / Shift+Tab for list indentation (nesting)
    if (event.key === 'Tab') {
      const tabHandled = richTextFormatter.handleListTab(contenteditable as HTMLElement, event.shiftKey);
      if (tabHandled) {
        event.preventDefault();
        return true;
      }
    }

    // Arrow key navigation for inline code
    if (event.key === 'ArrowRight') {
      const handled = richTextFormatter.handleArrowKeyInCode(event, contenteditable as HTMLElement);
      if (handled) {
        return true;
      }
    }

    // Backspace in lists: remove list formatting when at start of list item
    if (event.key === 'Backspace') {
      const backspaceHandled = richTextFormatter.handleListBackspace(contenteditable as HTMLElement);
      if (backspaceHandled) {
        event.preventDefault();
        const formats = richTextFormatter.getActiveFormats(contenteditable as HTMLElement);
        setActiveFormats(formats);
        return true;
      }
      // Backspace in code blocks: remove empty code block entirely
      const codeBlockBackspaceHandled = richTextFormatter.handleCodeBlockBackspace(contenteditable as HTMLElement);
      if (codeBlockBackspaceHandled) {
        event.preventDefault();
        const formats = richTextFormatter.getActiveFormats(contenteditable as HTMLElement);
        setActiveFormats(formats);
        return true;
      }

      // Backspace adjacent to contentEditable="false" anchor: unwrap to editable text (Slack behavior)
      const doc = contenteditable.ownerDocument || document;
      const sel = doc.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        if (range.collapsed) {
          const container = range.startContainer;
          const offset = range.startOffset;

          let anchorToUnwrap: HTMLAnchorElement | null = null;

          // Case 1: Caret is in a text node at offset 0, and the previous sibling is an <a>
          if (container.nodeType === Node.TEXT_NODE && offset === 0) {
            const prev = container.previousSibling;
            if (prev && prev.nodeType === Node.ELEMENT_NODE && (prev as Element).tagName === 'A') {
              anchorToUnwrap = prev as HTMLAnchorElement;
            }
          }
          // Case 2: Caret is in an element node, and the child before offset is an <a>
          else if (container.nodeType === Node.ELEMENT_NODE && offset > 0) {
            const prev = container.childNodes[offset - 1];
            if (prev && prev.nodeType === Node.ELEMENT_NODE && (prev as Element).tagName === 'A') {
              anchorToUnwrap = prev as HTMLAnchorElement;
            }
          }

          if (anchorToUnwrap) {
            event.preventDefault();
            const textContent = anchorToUnwrap.textContent || '';
            const textNode = doc.createTextNode(textContent);
            anchorToUnwrap.parentNode?.replaceChild(textNode, anchorToUnwrap);
            // Also remove the empty text node the caret was in (if it's empty)
            if (container.nodeType === Node.TEXT_NODE && !(container.textContent || '').replace(/\u200B/g, '')) {
              container.parentNode?.removeChild(container);
            }
            // Place caret at end of the unwrapped text
            const newRange = doc.createRange();
            newRange.setStart(textNode, textContent.length);
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);
            const formats = richTextFormatter.getActiveFormats(contenteditable as HTMLElement);
            setActiveFormats(formats);
            return true;
          }
        }
      }
    }

    // Delete key adjacent to contentEditable="false" anchor: unwrap to editable text (Slack behavior)
    if (event.key === 'Delete') {
      const doc = contenteditable.ownerDocument || document;
      const sel = doc.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        if (range.collapsed) {
          const container = range.startContainer;
          const offset = range.startOffset;

          let anchorToUnwrap: HTMLAnchorElement | null = null;

          // Case 1: Caret is in a text node at end, and the next sibling is an <a>
          if (container.nodeType === Node.TEXT_NODE && offset === (container.textContent || '').length) {
            const next = container.nextSibling;
            if (next && next.nodeType === Node.ELEMENT_NODE && (next as Element).tagName === 'A') {
              anchorToUnwrap = next as HTMLAnchorElement;
            }
          }
          // Case 2: Caret is in an element node, and the child at offset is an <a>
          else if (container.nodeType === Node.ELEMENT_NODE && offset < container.childNodes.length) {
            const next = container.childNodes[offset];
            if (next && next.nodeType === Node.ELEMENT_NODE && (next as Element).tagName === 'A') {
              anchorToUnwrap = next as HTMLAnchorElement;
            }
          }

          if (anchorToUnwrap) {
            event.preventDefault();
            const textContent = anchorToUnwrap.textContent || '';
            const textNode = doc.createTextNode(textContent);
            anchorToUnwrap.parentNode?.replaceChild(textNode, anchorToUnwrap);
            // Place caret at start of the unwrapped text
            const newRange = doc.createRange();
            newRange.setStart(textNode, 0);
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);
            const formats = richTextFormatter.getActiveFormats(contenteditable as HTMLElement);
            setActiveFormats(formats);
            return true;
          }
        }
      }
    }

    // Space key: auto-list trigger (e.g., "1. " → ordered list, "- " or "* " → unordered list)
    if (event.key === ' ' && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const autoListResult = richTextFormatter.handleAutoListTrigger(contenteditable as HTMLElement);
      if (autoListResult) {
        event.preventDefault();
        const formats = richTextFormatter.getActiveFormats(contenteditable as HTMLElement);
        setActiveFormats(formats);
        return true;
      }
    }

    // General keyboard shortcuts (Ctrl/Cmd+B, I, U, etc.)
    const handled = richTextFormatter.handleKeyboardShortcut(event, contenteditable as HTMLElement);
    if (handled) {
      const formats = richTextFormatter.getActiveFormats(contenteditable as HTMLElement);
      setActiveFormats(formats);
      return true;
    }

    return false;
  }, [enableRichTextEditor, richTextFormatter, hideRichTextFormattingOptions]);

  // --- Floating toolbar useEffect ---
  useEffect(() => {
    if (!enableRichTextEditor || !showToolbarOnSelection || isMobileDevice()) {
      return;
    }

    let floatingSelectionDebounceTimer: ReturnType<typeof setTimeout> | null = null;

    const handleSelectionChange = () => {
      try {
        if (isFixedToolbarVisible) {
          setIsFloatingToolbarVisible(false);
          return;
        }

        const win = getCurrentWindow();
        const selection = win?.getSelection();
        const inputElement = getCurrentInput();

        if (!selection || !inputElement) {
          setIsFloatingToolbarVisible(false);
          return;
        }
        if (selection.rangeCount === 0) {
          setIsFloatingToolbarVisible(false);
          return;
        }

        const range = selection.getRangeAt(0);
        const isInsideInput = inputElement.contains(range.startContainer) &&
                             inputElement.contains(range.endContainer);
        if (!isInsideInput) {
          setIsFloatingToolbarVisible(false);
          return;
        }

        const selectedText = selection.toString();
        if (!selectedText || selectedText.length === 0) {
          setIsFloatingToolbarVisible(false);
          return;
        }

        const rect = range.getBoundingClientRect();
        const toolbarHeight = 36;
        const toolbarOffset = 8;

        // Calculate position relative to viewport (for fixed positioning)
        const viewportWidth = win?.innerWidth || 800;
        const viewportHeight = win?.innerHeight || 600;

        let top = rect.top - toolbarHeight - toolbarOffset;
        let left = rect.left + (rect.width / 2);

        // If toolbar would be above viewport, position it below the selection
        if (top < 10) {
          top = rect.bottom + toolbarOffset;
        }

        // Ensure toolbar doesn't go below viewport
        if (top + toolbarHeight > viewportHeight - 10) {
          top = viewportHeight - toolbarHeight - 10;
        }

        // Constrain horizontal position to keep toolbar within viewport
        // Compact toolbar width (approx 280px for all buttons)
        const toolbarWidth = 280;
        if (left - (toolbarWidth / 2) < 10) {
          left = (toolbarWidth / 2) + 10;
        } else if (left + (toolbarWidth / 2) > viewportWidth - 10) {
          left = viewportWidth - (toolbarWidth / 2) - 10;
        }

        // Position and show/hide are synchronous (cheap DOM reads)
        setFloatingToolbarPosition({ top, left });
        setIsFloatingToolbarVisible(true);

        // Defer the expensive getActiveFormats DOM walk by 100ms
        if (richTextFormatter) {
          if (floatingSelectionDebounceTimer !== null) {
            clearTimeout(floatingSelectionDebounceTimer);
          }
          floatingSelectionDebounceTimer = setTimeout(() => {
            floatingSelectionDebounceTimer = null;
            try {
              const formats = richTextFormatter.getActiveFormats(inputElement as HTMLElement);
              setActiveFormats(formats);
            } catch (innerError) {
              errorHandler(innerError, "handleSelectionChange (deferred)");
            }
          }, 100);
        }
      } catch (error) {
        errorHandler(error, "handleSelectionChange");
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      try {
        const inputElement = getCurrentInput();
        const target = event.target as Node;
        const floatingToolbar = getCurrentDocument()?.querySelector('.cometchat-formatting-toolbar--floating');
        const isOutsideInput = inputElement && !inputElement.contains(target);
        const isOutsideToolbar = !floatingToolbar || !floatingToolbar.contains(target);
        if (isOutsideInput && isOutsideToolbar) {
          setIsFloatingToolbarVisible(false);
        }
      } catch (error) {
        errorHandler(error, "handleClickOutside");
      }
    };

    const doc = getCurrentDocument();
    doc?.addEventListener('selectionchange', handleSelectionChange);
    doc?.addEventListener('mousedown', handleClickOutside);

    return () => {
      doc?.removeEventListener('selectionchange', handleSelectionChange);
      doc?.removeEventListener('mousedown', handleClickOutside);
      if (floatingSelectionDebounceTimer !== null) {
        clearTimeout(floatingSelectionDebounceTimer);
      }
    };
  }, [enableRichTextEditor, showToolbarOnSelection, richTextFormatter, isFixedToolbarVisible]);

  // --- Fixed toolbar: update activeFormats on every caret movement ---
  useEffect(() => {
    if (!enableRichTextEditor || !richTextFormatter || !isFixedToolbarVisible) {
      return;
    }

    let selectionChangeDebounceTimer: ReturnType<typeof setTimeout> | null = null;

    const handleSelectionChangeForFormats = () => {
      try {
        const inputElement = getCurrentInput();
        if (!inputElement) return;

        // Synchronous validity check: hide toolbar immediately when focus leaves composer
        const win = getCurrentWindow();
        const sel = win?.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          const isInsideInput = inputElement.contains(range.startContainer);
          if (!isInsideInput) {
            setActiveFormats([]);
            return;
          }
        }

        // Defer the expensive DOM walk (getActiveFormats) by 100ms
        if (selectionChangeDebounceTimer !== null) {
          clearTimeout(selectionChangeDebounceTimer);
        }
        selectionChangeDebounceTimer = setTimeout(() => {
          selectionChangeDebounceTimer = null;
          try {
            const formats = richTextFormatter.getActiveFormats(inputElement as HTMLElement);
            setActiveFormats(formats);
          } catch (innerError) {
            errorHandler(innerError, "handleSelectionChangeForFormats (deferred)");
          }
        }, 100);
      } catch (error) {
        errorHandler(error, "handleSelectionChangeForFormats");
      }
    };

    const doc = getCurrentDocument();
    doc?.addEventListener('selectionchange', handleSelectionChangeForFormats);
    return () => {
      doc?.removeEventListener('selectionchange', handleSelectionChangeForFormats);
      if (selectionChangeDebounceTimer !== null) {
        clearTimeout(selectionChangeDebounceTimer);
      }
    };
  }, [enableRichTextEditor, richTextFormatter, isFixedToolbarVisible]);

  return {
    // State
    isFixedToolbarVisible,
    setIsFixedToolbarVisible,
    isFloatingToolbarVisible,
    setIsFloatingToolbarVisible,
    floatingToolbarPosition,
    activeFormats,
    setActiveFormats,
    showLinkInput,
    showLinkPopover,
    linkPopoverData,
    isLinkEditMode,
    linkEditData,
    linkDialogSelectedText,
    linkDialogSelectedTextRef,

    // Formatter
    richTextFormatter,

    // Handlers
    handleLinkClick,
    handleLinkSubmit,
    handleLinkCancel,
    handleInputClick,
    handleLinkPopoverEdit,
    handleLinkPopoverRemove,
    handleLinkPopoverClose,
    handleFormatApplied,
    handleFormattingKeyDown,
    
    // Markdown undo
    saveMarkdownUndoState,
    handleMarkdownUndo,
  };
}
