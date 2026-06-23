/* eslint-disable @typescript-eslint/no-deprecated */
/**
 * RichTextEditor — thin orchestrator for the contenteditable rich text editor.
 *
 * Delegates formatting to formats/, history to history/, markdown detection
 * to markdown/, and mentions to mentions/. No React imports.
 */

import type {
  CometChatRichTextEditorConfig,
  CometChatRichTextFormatState,
} from './RichTextEditor.types';
import { DEFAULT_FORMAT_STATE } from './RichTextEditor.types';
import {
  BoldFormat,
  ItalicFormat,
  UnderlineFormat,
  StrikethroughFormat,
  InlineCodeFormat,
  CodeBlockFormat,
  BlockquoteFormat,
  OrderedListFormat,
  BulletListFormat,
  LinkFormat,
  clearInlineOverrides,
  handleListEnter,
  handleListIndent,
  handleListOutdent,
  fixOrderedListContinuation,
  applyListStyles,
  setLink as linkSetLink,
  getCurrentLink as linkGetCurrentLink,
  getCurrentLinkText as linkGetCurrentLinkText,
} from './formats';
import type { EditorContext } from './formats';
import { HistoryManager } from './history';
import { detectAndConvertMarkdown } from './markdown/MarkdownDetector';
import { detectAndConvertAutoList } from './markdown/AutoListDetector';
import {
  insertMention,
  getTextWithMentionFormat,
  getUniqueMentionUids,
  checkMentionTrigger,
} from './mentions';
import { escapeUserHtml } from '../sanitizeHtml';

export class RichTextEditor {
  private element: HTMLDivElement;
  private config: CometChatRichTextEditorConfig;
  private destroyed = false;
  private listeners: { target: EventTarget; type: string; fn: EventListener }[] = [];
  private formatState: CometChatRichTextFormatState = { ...DEFAULT_FORMAT_STATE };
  private historyManager = new HistoryManager();
  private justAppliedFormatting = 0;
  private suppressNextSelectionChange = 0;
  private ctx: EditorContext;

  constructor(element: HTMLDivElement, config: CometChatRichTextEditorConfig = {}) {
    this.element = element;
    this.config = config;

    this.ctx = {
      element: this.element,
      focus: () => {
        this.element.focus();
      },
      execCommand: (cmd, val?) => {
        this.getDocument().execCommand(cmd, false, val);
      },
      getDocument: () => this.getDocument(),
      getWindow: () => this.getWindow(),
      findAncestor: (node, tag) => this.findAncestor(node, tag),
      hasAncestor: (node, tag) => this.findAncestor(node, tag) !== null,
      markFormattingApplied: () => {
        this.justAppliedFormatting += 2;
        this.suppressNextSelectionChange += 2;
      },
      pushHistory: () => {
        this.pushHistory();
      },
      emitUpdate: () => {
        this.emitUpdate();
      },
      updateFormatState: () => {
        this.updateFormatState();
      },
    };

    element.contentEditable = config.editable === false ? 'false' : 'true';
    element.setAttribute('role', 'textbox');
    element.setAttribute('aria-multiline', 'true');
    element.setAttribute('aria-label', config.ariaLabel ?? 'Rich text editor');
    if (config.placeholder) element.setAttribute('data-placeholder', config.placeholder);
    if (config.content) element.innerHTML = config.content;

    this.attachListeners();
    this.pushHistory();

    if (config.autofocus) {
      requestAnimationFrame(() => {
        this.focus(config.autofocus === 'start' ? 'start' : 'end');
      });
    }
  }

  // ===== Public: Content =====

  /** Get the document to use for DOM operations. Falls back to global `document`. */
  getDocument(): Document {
    return this.config.ownerDocument ?? document;
  }

  /** Get the window to use for selection APIs. Falls back to global `window`. */
  getWindow(): Window {
    return this.config.ownerWindow ?? window;
  }

  getFormatState(): CometChatRichTextFormatState {
    return { ...this.formatState };
  }
  getHTML(): string {
    return this.element.innerHTML;
  }
  getText(): string {
    return this.element.textContent ?? '';
  }
  isEmpty(): boolean {
    return this.getText().trim() === '';
  }
  isDestroyed(): boolean {
    return this.destroyed;
  }

  setHTML(html: string): void {
    this.element.innerHTML = html;
    this.pushHistory();
    this.emitUpdate();
  }

  clear(): void {
    this.element.innerHTML = '';
    this.formatState = { ...DEFAULT_FORMAT_STATE };
    clearInlineOverrides();
    this.element.focus();
    for (const cmd of ['bold', 'italic', 'underline', 'strikeThrough']) {
      try {
        if (this.getDocument().queryCommandState(cmd)) this.getDocument().execCommand(cmd, false);
      } catch {
        /* ignore */
      }
    }
    // Place the cursor directly on the editor root element so it is NOT
    // inside any formatting element (<code>, <b>, <i>, etc.).
    // Without this, the browser remembers the last caret position was inside
    // a <code> and new typing inherits that formatting even after innerHTML=''.
    const sel = this.getWindow().getSelection();
    if (sel) {
      const range = this.getDocument().createRange();
      range.setStart(this.element, 0);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    }
    this.pushHistory();
    this.emitUpdate();
    this.config.onSelectionUpdate?.(this.formatState);
  }

  focus(position: 'start' | 'end' = 'end'): void {
    this.element.focus();
    const sel = this.getWindow().getSelection();
    if (sel) {
      if (this.element.childNodes.length > 0) {
        sel.selectAllChildren(this.element);
        if (position === 'end') {
          sel.collapseToEnd();
        } else {
          sel.collapseToStart();
        }
      } else {
        // Empty editor — create a range at position 0 so execCommands have a target
        const range = this.getDocument().createRange();
        range.setStart(this.element, 0);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  }

  insertText(text: string): void {
    this.element.focus();
    this.getDocument().execCommand('insertText', false, text);
    this.pushHistory();
    this.emitUpdate();
  }

  /**
   * Insert text without inheriting any active inline formatting.
   * Used for emoji insertion — emojis should never be bold/italic/underlined etc.
   *
   * Strategy: Wrap the emoji in a <span> with explicit style resets so it
   * doesn't inherit bold/italic/underline/strikethrough from parent elements.
   */
  insertPlainText(text: string): void {
    this.element.focus();
    const sel = this.getWindow().getSelection();
    if (!sel || sel.rangeCount === 0) {
      this.getDocument().execCommand('insertText', false, text);
      this.pushHistory();
      this.emitUpdate();
      return;
    }

    const range = sel.getRangeAt(0);
    range.deleteContents();

    // Check if we're inside any formatting elements
    const formattingTags = new Set(['B', 'I', 'U', 'S', 'STRONG', 'EM', 'DEL', 'STRIKE']);
    let insideFormatting = false;
    let node: Node | null = range.startContainer;
    while (node && node !== this.element) {
      if (
        node.nodeType === Node.ELEMENT_NODE &&
        formattingTags.has((node as HTMLElement).tagName)
      ) {
        insideFormatting = true;
        break;
      }
      node = node.parentNode;
    }

    let insertedNode: Node;

    if (insideFormatting) {
      // Wrap emoji in a span that resets all inline formatting
      const span = this.getDocument().createElement('span');
      span.style.fontWeight = 'normal';
      span.style.fontStyle = 'normal';
      span.style.textDecoration = 'none';
      span.textContent = text;
      range.insertNode(span);
      insertedNode = span;
    } else {
      // Not inside formatting — plain text node is fine
      const textNode = this.getDocument().createTextNode(text);
      range.insertNode(textNode);
      insertedNode = textNode;
    }

    // Move cursor after the inserted node
    const newRange = this.getDocument().createRange();
    newRange.setStartAfter(insertedNode);
    newRange.setEndAfter(insertedNode);
    sel.removeAllRanges();
    sel.addRange(newRange);

    this.element.normalize();
    this.pushHistory();
    this.emitUpdate();
  }

  destroy(): void {
    this.destroyed = true;
    for (const { target, type, fn } of this.listeners) target.removeEventListener(type, fn);
    this.listeners = [];
    this.historyManager.destroy();
  }

  // ===== Public: Formatting =====

  applyBold(): void {
    BoldFormat.execute(this.ctx);
  }
  applyItalic(): void {
    ItalicFormat.execute(this.ctx);
  }
  applyUnderline(): void {
    UnderlineFormat.execute(this.ctx);
  }
  applyStrikethrough(): void {
    StrikethroughFormat.execute(this.ctx);
  }
  applyInlineCode(): void {
    InlineCodeFormat.execute(this.ctx);
  }
  applyCodeBlock(): void {
    // §6.4 — clear any armed inline formats before activating code block
    clearInlineOverrides();
    CodeBlockFormat.execute(this.ctx);
  }
  applyBlockquote(): void {
    BlockquoteFormat.execute(this.ctx);
  }
  applyOrderedList(): void {
    OrderedListFormat.execute(this.ctx);
  }
  applyBulletList(): void {
    BulletListFormat.execute(this.ctx);
  }
  setLink(url: string | null, text?: string): void {
    linkSetLink(url, this.ctx, text);
  }
  getCurrentLink(): string | null {
    return linkGetCurrentLink(this.ctx);
  }
  getCurrentLinkText(): string | null {
    return linkGetCurrentLinkText(this.ctx);
  }

  // ===== Public: Selection =====

  getSelectedText(): string {
    return this.getWindow().getSelection()?.toString() ?? '';
  }

  saveSelection(): Range | null {
    const sel = this.getWindow().getSelection();
    return sel && sel.rangeCount > 0 ? sel.getRangeAt(0).cloneRange() : null;
  }

  restoreSelection(range: Range | null): void {
    if (!range) return;
    const sel = this.getWindow().getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }

  // ===== Public: Undo/Redo =====

  undo(): boolean {
    const html = this.historyManager.undo();
    if (html === null) return false;
    this.element.innerHTML = html;
    this.updateFormatState();
    this.emitUpdate();
    return true;
  }

  redo(): boolean {
    const html = this.historyManager.redo();
    if (html === null) return false;
    this.element.innerHTML = html;
    this.updateFormatState();
    this.emitUpdate();
    return true;
  }

  canUndo(): boolean {
    return this.historyManager.canUndo();
  }
  canRedo(): boolean {
    return this.historyManager.canRedo();
  }

  // ===== Public: Mentions =====

  insertMention(id: string, label: string, charsToDelete: number, isSelf = false): void {
    insertMention(this.element, id, label, charsToDelete, isSelf);
    this.pushHistory();
    this.emitUpdate();
  }

  getTextWithMentionFormat(): string {
    return getTextWithMentionFormat(this.element);
  }
  getUniqueMentionUids(): Set<string> {
    return getUniqueMentionUids(this.element);
  }

  // ===== Private: Events =====

  private attachListeners(): void {
    this.on(this.element, 'input', () => {
      this.handleInput();
    });
    this.on(this.element, 'keydown', e => {
      this.handleKeyDown(e as KeyboardEvent);
    });
    this.on(document, 'selectionchange', () => {
      this.handleSelectionChange();
    });
    this.on(this.element, 'focus', () => {
      this.config.onFocus?.();
    });
    this.on(this.element, 'blur', () => {
      this.config.onBlur?.();
    });
    this.on(this.element, 'paste', e => {
      this.handlePaste(e as ClipboardEvent);
    });
    this.on(this.element, 'click', e => {
      this.handleClick(e as MouseEvent);
    });
  }

  private on(target: EventTarget, type: string, fn: EventListener): void {
    target.addEventListener(type, fn);
    this.listeners.push({ target, type, fn });
  }

  private handleInput(): void {
    clearInlineOverrides();
    if (this.justAppliedFormatting > 0) {
      this.justAppliedFormatting--;
      this.pushHistory();
      this.emitUpdate();
      return;
    }
    if (this.config.enableFormatting !== false) {
      if (detectAndConvertMarkdown(this.ctx)) {
        this.justAppliedFormatting += 2;
        this.updateFormatState();
        this.pushHistory();
        this.emitUpdate();
        return;
      }
    }
    // Clean up browser-inserted <div> wrappers inside <li> elements
    this.cleanListDivWrappers();
    // Re-apply list styles after any input (browser may reset inline styles)
    if (this.element.querySelector('ol, ul')) {
      applyListStyles(this.element);
    }
    // §5.5 / §6.7 — suppress mention trigger inside <code> or <pre>
    const sel2 = this.getWindow().getSelection();
    const anchorNode = sel2?.anchorNode ?? null;
    const insideCode = anchorNode
      ? this.findAncestor(anchorNode, 'CODE') !== null ||
        this.findAncestor(anchorNode, 'PRE') !== null
      : false;
    if (!insideCode) {
      checkMentionTrigger(this.config.onMentionStart, this.config.onMentionEnd, this.getWindow());
    } else {
      // Inside code — close any open mention panel
      this.config.onMentionEnd?.();
    }
    if (
      this.getText()
        .replace(/\u200B/g, '')
        .trim() === ''
    ) {
      const html = this.element.innerHTML.trim();
      const hasStructure = this.element.querySelector('ol, ul, li, blockquote, pre') !== null;

      // Bug fix: If structural elements exist but are empty (e.g., empty <pre> after
      // Ctrl+A + Delete), clear the editor entirely.
      if (hasStructure) {
        const structuralEls = this.element.querySelectorAll('ol, ul, li, blockquote, pre');
        const allEmpty = Array.from(structuralEls).every(el => {
          const text = (el.textContent ?? '').replace(/\u200B/g, '').trim();
          return text === '';
        });
        if (allEmpty) {
          this.element.innerHTML = '';
          const sel = this.getWindow().getSelection();
          if (sel) {
            const r = this.getDocument().createRange();
            r.setStart(this.element, 0);
            r.collapse(true);
            sel.removeAllRanges();
            sel.addRange(r);
          }
        }
      } else {
        // Check if the remaining HTML is effectively empty:
        // - Only <br> tags
        // - Empty wrapper tags with whitespace/ZWS
        // - Wrapper tags containing only <br> (e.g., <div><br></div> left by Chrome)
        const isOnlyBr = /^(<br\s*\/?>)+$/i.test(html);
        const isEmptyWrappers = /^(<[^>]+>[\u200B\s]*<\/[^>]+>)+$/i.test(html);
        const isWrappedBr = /^(<[^>]+>(<br\s*\/?>|[\u200B\s])*<\/[^>]+>)+$/i.test(html);

        if (html === '' || isOnlyBr || isEmptyWrappers || isWrappedBr) {
          this.element.innerHTML = '';
          const sel = this.getWindow().getSelection();
          if (sel) {
            const r = this.getDocument().createRange();
            r.setStart(this.element, 0);
            r.collapse(true);
            sel.removeAllRanges();
            sel.addRange(r);
          }
        }
      }
    }
    this.pushHistory();
    this.emitUpdate();
  }

  private handleKeyDown(e: KeyboardEvent): void {
    // Allow external interceptor (e.g., mentions keyboard nav) to handle first
    if (this.config.onKeyDown?.(e)) return;

    const mod = e.ctrlKey || e.metaKey;
    if (mod && !e.shiftKey && this.config.enableFormatting !== false) {
      // Don't apply inline formatting inside code blocks
      const sel = this.getWindow().getSelection();
      const anchorNode = sel?.anchorNode;
      const isInsideCodeBlock =
        anchorNode &&
        (anchorNode.parentElement?.closest('pre') ??
          (anchorNode.nodeType === Node.ELEMENT_NODE && (anchorNode as Element).closest('pre')));

      const key = e.key.toLowerCase();
      if (key === 'b') {
        e.preventDefault();
        if (!isInsideCodeBlock) this.applyBold();
        return;
      }
      if (key === 'i') {
        e.preventDefault();
        if (!isInsideCodeBlock) this.applyItalic();
        return;
      }
      if (key === 'u') {
        e.preventDefault();
        if (!isInsideCodeBlock) this.applyUnderline();
        return;
      }
    }
    if (mod && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      this.undo();
      return;
    }
    if (mod && (e.key === 'y' || (e.key === 'z' && e.shiftKey) || (e.key === 'Z' && e.shiftKey))) {
      e.preventDefault();
      this.redo();
      return;
    }
    if (e.key === 'Escape') this.config.onMentionEnd?.();

    // Backspace/Delete with full selection: clear editor entirely.
    // This handles the case where mention spans (contenteditable="false") survive
    // browser-native deletion after Ctrl+A.
    if ((e.key === 'Backspace' || e.key === 'Delete') && !mod) {
      const sel = this.getWindow().getSelection();
      if (sel && !sel.isCollapsed) {
        const range = sel.getRangeAt(0);
        // Check if the selection covers the entire editor content
        const editorText = this.element.textContent ?? '';
        const selectedText = range.toString();
        if (
          selectedText.length >= editorText.replace(/\u00A0/g, ' ').trim().length &&
          this.element.contains(range.startContainer) &&
          this.element.contains(range.endContainer)
        ) {
          e.preventDefault();
          this.element.innerHTML = '';
          const r = this.getDocument().createRange();
          r.setStart(this.element, 0);
          r.collapse(true);
          sel.removeAllRanges();
          sel.addRange(r);
          this.pushHistory();
          this.emitUpdate();
          return;
        }
      }
    }

    // ArrowRight: exit inline code when cursor is at the end of a <code> element
    if (e.key === 'ArrowRight' && !mod && !e.shiftKey) {
      if (this.handleArrowRightExitInlineCode()) {
        e.preventDefault();
        return;
      }
    }

    // Tab / Shift+Tab: indent / outdent list items
    if (e.key === 'Tab' && !mod && this.config.enableFormatting !== false) {
      if (e.shiftKey) {
        if (handleListOutdent(e, this.ctx)) return;
      } else {
        if (handleListIndent(e, this.ctx)) return;
      }
    }

    // Space key: auto-list trigger (e.g., "1." → ordered list, "- " → unordered list)
    if (e.key === ' ' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (this.config.enableFormatting !== false) {
        if (detectAndConvertAutoList(this.ctx)) {
          e.preventDefault();
          this.cleanListDivWrappers();
          applyListStyles(this.element);
          fixOrderedListContinuation(this.element);
          return;
        }
      }
    }
    if (e.key === 'Enter' && !e.shiftKey && !mod) {
      if (this.config.onEnterPress) {
        e.preventDefault();
        this.config.onEnterPress();
        return;
      }
    }
    // Shift+Enter — new list item / exit list / new line in code block / blockquote
    if (e.key === 'Enter' && e.shiftKey && !mod) {
      if (this.config.enableFormatting !== false) {
        // List: new item or exit on empty item (takes priority)
        if (handleListEnter(e, this.ctx)) return;
        // Code block: double-Shift+Enter exits, single inserts newline
        if (this.handleCodeBlockShiftEnter(e)) return;
        // Blockquote: double-Shift+Enter exits, single inserts newline
        if (this.handleBlockquoteShiftEnter(e)) return;
      }
      // Outside any special block: browser default inserts <br> / newline
    }
  }

  /**
   * Handle ArrowRight to exit inline <code> elements.
   * When the cursor is at the end of an inline <code> span, pressing ArrowRight
   * moves the cursor outside the code element (after it) so the user can type normal text.
   * Returns true if handled.
   */
  private handleArrowRightExitInlineCode(): boolean {
    const sel = this.getWindow().getSelection();
    if (!sel || sel.rangeCount === 0 || !sel.isCollapsed) return false;

    const range = sel.getRangeAt(0);
    let node: Node | null = range.startContainer;

    // Find if we're inside an inline <code> (not inside <pre><code>)
    let codeEl: HTMLElement | null = null;
    while (node && node !== this.element) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        if (el.tagName === 'CODE' && el.parentElement?.tagName !== 'PRE') {
          codeEl = el;
          break;
        }
      }
      node = node.parentNode;
    }

    if (!codeEl) return false;

    // Check if cursor is at the end of the code element
    const textContent = codeEl.textContent ?? '';
    const offset =
      range.startContainer === codeEl
        ? range.startOffset
        : this.getTextOffsetInNode(codeEl, range.startContainer, range.startOffset);

    if (offset < textContent.length) return false;

    // Cursor is at the end — move it after the code element
    const newRange = this.getDocument().createRange();
    if (codeEl.nextSibling) {
      newRange.setStartBefore(codeEl.nextSibling);
    } else {
      // No next sibling — insert a zero-width space after the code and place cursor there
      const textNode = this.getDocument().createTextNode('\u200B');
      codeEl.parentNode?.insertBefore(textNode, codeEl.nextSibling);
      newRange.setStart(textNode, 1);
    }
    newRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newRange);
    return true;
  }

  /**
   * Get text offset within a node by counting characters up to the cursor position.
   */
  private getTextOffsetInNode(container: Node, cursorNode: Node, cursorOffset: number): number {
    let offset = 0;
    const walker = this.getDocument().createTreeWalker(container, NodeFilter.SHOW_TEXT);
    let current = walker.nextNode();
    while (current) {
      if (current === cursorNode) {
        return offset + cursorOffset;
      }
      offset += current.textContent?.length ?? 0;
      current = walker.nextNode();
    }
    return offset;
  }

  /**
   * Handle Shift+Enter inside a code block.
   * - If the code block content ends with a newline (cursor on empty line): exit the code block.
   * - Otherwise: insert a newline character and return true to prevent default.
   * Returns true if handled (caller should return early).
   */
  private handleCodeBlockShiftEnter(e: KeyboardEvent): boolean {
    const sel = this.getWindow().getSelection();
    if (!sel || sel.rangeCount === 0) return false;
    const range = sel.getRangeAt(0);
    const pre = this.findAncestor(range.startContainer, 'PRE') as HTMLElement | null;
    if (!pre) return false;

    e.preventDefault();

    const code = pre.querySelector('code') ?? pre;
    const rawText = code.textContent ?? '';
    // Strip trailing zero-width spaces for the empty-line check
    const text = rawText.replace(/\u200B+$/, '');

    // Compute cursor offset within the code element
    let cursorOffset = 0;
    if (range.startContainer.nodeType === Node.TEXT_NODE) {
      const walker = this.getDocument().createTreeWalker(code, NodeFilter.SHOW_TEXT, null);
      let node: Node | null = walker.nextNode();
      while (node) {
        if (node === range.startContainer) {
          cursorOffset += range.startOffset;
          break;
        }
        cursorOffset += (node.textContent ?? '').length;
        node = walker.nextNode();
      }
    } else {
      // Cursor is positioned on the element itself (not a text node).
      // This happens with freshly created code blocks.
      cursorOffset = rawText.length;

      const textNode =
        code.firstChild?.nodeType === Node.TEXT_NODE ? (code.firstChild as Text) : null;
      if (textNode) {
        const insertAt = Math.min(cursorOffset, textNode.data.length);
        const after = textNode.data.slice(insertAt);
        const needsZws = !after || after === '\n' || after.trim() === '';
        const insert = needsZws ? '\n\u200B' : '\n';
        textNode.data = textNode.data.slice(0, insertAt) + insert + textNode.data.slice(insertAt);
        const newRange = this.getDocument().createRange();
        newRange.setStart(textNode, insertAt + insert.length);
        newRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newRange);
      } else {
        const newText = this.getDocument().createTextNode('\n\u200B');
        code.appendChild(newText);
        const newRange = this.getDocument().createRange();
        newRange.setStart(newText, 2);
        newRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newRange);
      }
      this.justAppliedFormatting += 2;
      this.updateFormatState();
      this.pushHistory();
      this.emitUpdate();
      return true;
    }

    const isAtEnd = cursorOffset >= text.length - 1 || cursorOffset >= rawText.length - 1;
    const endsWithNewline = text.endsWith('\n');

    if (isAtEnd && endsWithNewline) {
      // Double-Shift+Enter: exit the code block
      // Remove the trailing newline
      const textNode = code.firstChild;
      if (textNode?.nodeType === Node.TEXT_NODE) {
        const t = textNode as Text;
        t.data = t.data.replace(/[\n\u200B]+$/, '') || '\u200B';
      }
      // Insert a paragraph after the <pre>
      const p = this.getDocument().createElement('p');
      p.innerHTML = '<br>';
      pre.parentNode?.insertBefore(p, pre.nextSibling);
      const newRange = this.getDocument().createRange();
      newRange.setStart(p, 0);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);
    } else {
      // Single Shift+Enter: insert newline + ZWS so the new line is visible
      const textNode = range.startContainer;
      if (textNode.nodeType === Node.TEXT_NODE) {
        const t = textNode as Text;
        const offset = range.startOffset;
        const after = t.data.slice(offset);
        const needsZws = !after || after === '\n' || after.trim() === '';
        const insert = needsZws ? '\n\u200B' : '\n';
        t.data = t.data.slice(0, offset) + insert + t.data.slice(offset);
        const newRange = this.getDocument().createRange();
        newRange.setStart(t, offset + insert.length);
        newRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newRange);
      }
    }

    this.justAppliedFormatting += 2;
    this.updateFormatState();
    this.pushHistory();
    this.emitUpdate();
    return true;
  }

  /**
   * Handle Shift+Enter inside a blockquote.
   * - If the current line inside the blockquote is empty: exit the blockquote.
   * - Otherwise: let browser insert a newline (return false so default runs).
   * Returns true if handled (caller should return early).
   */
  private handleBlockquoteShiftEnter(e: KeyboardEvent): boolean {
    const sel = this.getWindow().getSelection();
    if (!sel || sel.rangeCount === 0) return false;
    const range = sel.getRangeAt(0);
    const bq = this.findAncestor(range.startContainer, 'BLOCKQUOTE') as HTMLElement | null;
    if (!bq) return false;

    // Find the current block element inside the blockquote
    let block: Node | null = range.startContainer;
    while (block && block !== bq) {
      if (
        block.nodeType === Node.ELEMENT_NODE &&
        ['P', 'DIV', 'LI'].includes((block as Element).tagName)
      )
        break;
      block = block.parentNode;
    }
    const blockEl = block && block !== bq ? (block as HTMLElement) : null;
    const isEmpty = blockEl
      ? (blockEl.textContent ?? '').replace(/\u200B/g, '').trim() === ''
      : (bq.textContent ?? '').replace(/\u200B/g, '').trim() === '';

    if (!isEmpty) {
      // Non-empty line: let browser insert a newline inside the blockquote
      // We still need to prevent this from doing nothing — return false so
      // browser default (newline) runs.
      return false;
    }

    // Empty line: exit the blockquote
    e.preventDefault();
    if (blockEl?.parentNode === bq) blockEl.remove();

    const p = this.getDocument().createElement('p');
    p.innerHTML = '<br>';
    if ((bq.textContent ?? '').replace(/\u200B/g, '').trim() === '') {
      bq.parentNode?.insertBefore(p, bq.nextSibling);
      bq.remove();
    } else {
      bq.parentNode?.insertBefore(p, bq.nextSibling);
    }
    const newRange = this.getDocument().createRange();
    newRange.setStart(p, 0);
    newRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newRange);

    this.justAppliedFormatting += 2;
    this.updateFormatState();
    this.pushHistory();
    this.emitUpdate();
    return true;
  }

  private handleSelectionChange(): void {
    if (this.destroyed) return;
    if (this.suppressNextSelectionChange > 0) {
      this.suppressNextSelectionChange--;
      return;
    }
    if (
      !this.element.contains(this.getDocument().activeElement) &&
      this.getDocument().activeElement !== this.element
    )
      return;
    clearInlineOverrides();
    this.updateFormatState();
  }

  private handlePaste(e: ClipboardEvent): void {
    const data = e.clipboardData;
    if (!data) return;
    for (const item of Array.from(data.items)) {
      if (item.kind === 'file') {
        e.preventDefault();
        return;
      }
    }
    if (this.config.enableFormatting === false) {
      e.preventDefault();
      this.getDocument().execCommand('insertText', false, data.getData('text/plain'));
      return;
    }

    // When pasting inside a code block, always paste as plain text.
    // Rich HTML content should not break out of the code block or introduce formatting.
    const pastedText = data.getData('text/plain').trim();
    const sel = this.getWindow().getSelection();
    if (sel && sel.rangeCount > 0) {
      const pasteNode = sel.getRangeAt(0).startContainer;
      const insidePre = this.findAncestor(pasteNode, 'PRE');
      if (insidePre) {
        e.preventDefault();
        const code = (insidePre as HTMLElement).querySelector('code') ?? insidePre;
        const range = sel.getRangeAt(0);
        const plainText = data.getData('text/plain');

        if (range.startContainer.nodeType === Node.TEXT_NODE) {
          const t = range.startContainer as Text;
          const offset = range.startOffset;
          t.data = t.data.slice(0, offset) + plainText + t.data.slice(offset);
          const newRange = this.getDocument().createRange();
          newRange.setStart(t, offset + plainText.length);
          newRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(newRange);
        } else {
          // Cursor is on the element itself (no text node yet, e.g. freshly created code block)
          const existingText = code.firstChild;
          if (existingText?.nodeType === Node.TEXT_NODE) {
            const t = existingText as Text;
            const childOffset = range.startOffset;
            const insertPos = Math.min(childOffset, t.data.length);
            t.data = t.data.slice(0, insertPos) + plainText + t.data.slice(insertPos);
            const newRange = this.getDocument().createRange();
            newRange.setStart(t, insertPos + plainText.length);
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);
          } else {
            const textNode = this.getDocument().createTextNode(plainText);
            code.appendChild(textNode);
            const newRange = this.getDocument().createRange();
            newRange.setStart(textNode, plainText.length);
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);
          }
        }
        this.pushHistory();
        this.emitUpdate();
        return;
      }
    }

    // §10.5 — Paste URL on selection: if clipboard is a URL and there's a selection, create a link
    const hasSelection = sel && !sel.isCollapsed && sel.toString().trim().length > 0;
    const isUrl = /^https?:\/\/\S+$/.test(pastedText);

    if (isUrl && hasSelection) {
      e.preventDefault();
      const selectedText = sel.toString();
      // Use setLink to create the link with the selected text as display text
      this.setLink(pastedText, selectedText);
      return;
    }

    // §15 — Paste with markdown: convert markdown in pasted plain text
    if (pastedText && !isUrl) {
      const html = data.getData('text/html');
      // Only intercept plain-text pastes (no HTML source) to convert markdown
      if (!html) {
        e.preventDefault();
        const converted = convertMarkdownToHtml(pastedText);
        if (converted !== pastedText) {
          // Has markdown — insert as HTML
          this.getDocument().execCommand('insertHTML', false, converted);
        } else {
          this.getDocument().execCommand('insertText', false, pastedText);
        }
        this.pushHistory();
        this.emitUpdate();
        this.updateFormatState();
        return;
      }

      // HTML paste — aggressively sanitize to keep only content formatting.
      // Strip all component-level markup (chat bubble wrappers, styled divs, etc.)
      // and preserve only semantic formatting tags (bold, italic, lists, links, etc.).
      e.preventDefault();

      // Heuristic: if the HTML contains complex layouts (tables, multi-column),
      // prefer plain text — complex HTML produces garbled output (Slack-style approach).
      const hasComplexLayout = /<(?:table|colgroup|col|thead|tbody)\b/i.test(html);
      if (hasComplexLayout) {
        this.getDocument().execCommand('insertText', false, pastedText);
        this.pushHistory();
        this.emitUpdate();
        this.updateFormatState();
        return;
      }

      const cleanedHtml = this.sanitizePastedHtml(html);
      if (cleanedHtml) {
        this.getDocument().execCommand('insertHTML', false, cleanedHtml);
      } else {
        // Fallback to plain text if sanitization yields nothing
        this.getDocument().execCommand('insertText', false, pastedText);
      }
      this.pushHistory();
      this.emitUpdate();
      this.updateFormatState();
      return;
    }
  }

  /**
   * Sanitize pasted HTML to preserve only content formatting.
   * Strips all component-level markup (chat bubble wrappers, styled containers)
   * and keeps only semantic formatting elements.
   */
  private sanitizePastedHtml(html: string): string {
    // SECURITY: parse into an inert <template> so images don't load and
    // onerror/onload can't fire during parsing.
    const template = this.getDocument().createElement('template');
    template.innerHTML = html;

    // Tags that represent content formatting (keep these)
    const ALLOWED_PASTE_TAGS = new Set([
      'b',
      'strong',
      'i',
      'em',
      'u',
      's',
      'del',
      'strike',
      'a',
      'br',
      'ol',
      'ul',
      'li',
      'p',
      'blockquote',
      'pre',
      'code',
      'sub',
      'sup',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
    ]);

    /**
     * Recursively clean a node tree:
     * - If the element is an allowed formatting tag, keep it but strip all attributes
     *   except href/target on <a> and class on mention spans.
     * - If the element is a mention span (data-uid attribute), preserve it as-is.
     * - Otherwise, unwrap the element (replace with its children).
     */
    const cleanNode = (parent: Node): DocumentFragment => {
      const fragment = this.getDocument().createDocumentFragment();

      for (const child of Array.from(parent.childNodes)) {
        if (child.nodeType === Node.TEXT_NODE) {
          fragment.appendChild(child.cloneNode(true));
          continue;
        }

        if (child.nodeType !== Node.ELEMENT_NODE) continue;

        const el = child as HTMLElement;
        const tagName = el.tagName.toLowerCase();

        // Preserve mention spans (they have data-uid attribute)
        if (tagName === 'span' && el.hasAttribute('data-uid')) {
          const mentionClone = el.cloneNode(true) as HTMLElement;
          // Strip inline styles from mention but keep class and data-uid
          mentionClone.removeAttribute('style');
          fragment.appendChild(mentionClone);
          continue;
        }

        // If it's an allowed formatting tag, keep it with cleaned attributes
        if (ALLOWED_PASTE_TAGS.has(tagName)) {
          const newEl = this.getDocument().createElement(tagName);

          // For links, preserve href and target
          if (tagName === 'a') {
            const href = el.getAttribute('href');
            if (href) newEl.setAttribute('href', href);
            newEl.setAttribute('target', '_blank');
            newEl.setAttribute('rel', 'noopener noreferrer');
          }

          // Recurse into children
          const childContent = cleanNode(el);
          newEl.appendChild(childContent);
          fragment.appendChild(newEl);
          continue;
        }

        // For divs, spans, and any other element: unwrap (keep children, drop the wrapper)
        // This strips all chat bubble containers, layout divs, styled wrappers, etc.
        const childContent = cleanNode(el);

        // If it's a block-level element being unwrapped, add a line break
        // to preserve visual separation (unless it's empty)
        const isBlockElement = [
          'div',
          'section',
          'article',
          'header',
          'footer',
          'main',
          'nav',
          'aside',
          'figure',
          'figcaption',
          'table',
          'thead',
          'tbody',
          'tfoot',
          'tr',
          'td',
          'th',
          'caption',
          'details',
          'summary',
          'dl',
          'dt',
          'dd',
        ].includes(tagName);
        if (isBlockElement && childContent.textContent?.trim()) {
          // Check if the previous sibling is already a <br> to avoid double breaks
          const lastInFragment = fragment.lastChild;
          const lastTagName =
            lastInFragment instanceof HTMLElement ? lastInFragment.tagName.toLowerCase() : '';
          const needsBreak = lastInFragment != null && lastTagName !== 'br';
          if (needsBreak && fragment.childNodes.length > 0) {
            fragment.appendChild(this.getDocument().createElement('br'));
          }
        }

        fragment.appendChild(childContent);
        continue;
      }

      return fragment;
    };

    const cleaned = cleanNode(template.content);
    const wrapper = this.getDocument().createElement('div');
    wrapper.appendChild(cleaned);

    // Final cleanup: collapse multiple consecutive <br> tags into at most 2
    let result = wrapper.innerHTML;
    result = result.replace(/(<br\s*\/?>(\s*)){3,}/gi, '<br><br>');

    // Remove leading/trailing <br>
    result = result.replace(/^(<br\s*\/?>)+|(<br\s*\/?>)+$/gi, '');

    return result.trim();
  }

  private handleClick(e: MouseEvent): void {
    const anchor = (e.target as HTMLElement).closest('a');
    if (anchor && this.config.onLinkClick) {
      e.preventDefault();
      const rect = anchor.getBoundingClientRect();
      // Pass rect.top so the popover appears ABOVE the link text (placement="top")
      this.config.onLinkClick(anchor.href, anchor.textContent ?? '', rect.left, rect.top);
    }
  }

  // ===== Private: Format State =====

  private updateFormatState(): void {
    const sel = this.getWindow().getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const node = sel.anchorNode;
    if (!node || !this.element.contains(node)) return;

    // If cursor is inside a mention span (contenteditable=false), reset format state
    // to avoid false positives from the atomic mention node.
    let current: Node | null = node;
    while (current && current !== this.element) {
      if (current.nodeType === Node.ELEMENT_NODE) {
        const el = current as HTMLElement;
        if (el.getAttribute('contenteditable') === 'false' && el.hasAttribute('data-uid')) {
          this.formatState = { ...DEFAULT_FORMAT_STATE };
          this.config.onSelectionUpdate?.(this.formatState);
          return;
        }
      }
      current = current.parentNode;
    }

    const isInsideLink = LinkFormat.isActive(node, this.ctx);

    this.formatState = {
      bold: BoldFormat.isActive(node, this.ctx),
      italic: ItalicFormat.isActive(node, this.ctx),
      // Suppress underline when inside a link — browsers report queryCommandState('underline')
      // as true inside <a> tags due to the link's text-decoration. This is a false positive.
      underline: isInsideLink ? false : UnderlineFormat.isActive(node, this.ctx),
      strikethrough: StrikethroughFormat.isActive(node, this.ctx),
      code: InlineCodeFormat.isActive(node, this.ctx),
      blockquote: BlockquoteFormat.isActive(node, this.ctx),
      codeBlock: CodeBlockFormat.isActive(node, this.ctx),
      orderedList: OrderedListFormat.isActive(node, this.ctx),
      bulletList: BulletListFormat.isActive(node, this.ctx),
      link: isInsideLink,
    };
    this.config.onSelectionUpdate?.(this.formatState);
  }

  // ===== Private: Helpers =====

  private findAncestor(node: Node | null, tagName: string): Node | null {
    let current = node;
    while (current && current !== this.element) {
      if (current.nodeType === Node.ELEMENT_NODE && (current as Element).tagName === tagName)
        return current;
      current = current.parentNode;
    }
    return null;
  }

  private pushHistory(): void {
    this.historyManager.push(this.element.innerHTML);
  }
  private emitUpdate(): void {
    this.config.onUpdate?.(this.getHTML(), this.getText());
  }

  /**
   * Remove <div> wrappers that browsers insert inside <li> elements.
   * Makes any browser-created div inside li transparent to layout.
   */
  private cleanListDivWrappers(): void {
    this.element.querySelectorAll('li > div, li > p').forEach(wrapper => {
      const el = wrapper as HTMLElement;
      el.style.display = 'inline';
      el.style.margin = '0';
      el.style.padding = '0';
    });
  }
}

/**
 * §15 — Convert markdown syntax in pasted plain text to HTML.
 * Handles inline: **bold**, *bold*, _italic_, ~~strike~~, `code`, <u>text</u>, [label](url)
 * Handles block: ```code```, - list, * list, 1. list, > blockquote
 */
export function convertMarkdownToHtml(text: string): string {
  const lines = text.split('\n');
  const htmlLines: string[] = [];
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];
  // Stack-based list tracking for nested ordered/unordered lists
  const listStack: { type: 'ol' | 'ul'; depth: number }[] = [];

  const closeListsToDepth = (targetDepth: number) => {
    while (listStack.length > 0 && (listStack[listStack.length - 1]?.depth ?? 0) >= targetDepth) {
      const popped = listStack.pop();
      if (popped) {
        htmlLines.push(`</${popped.type}>`);
      }
    }
  };

  const closeAllLists = () => {
    closeListsToDepth(0);
  };

  // Match ordered list: leading spaces + (digits. | alpha. | roman.) + space + content
  const olRegex = /^( *)(?:(\d+)\.|([a-z])\.|([ivxlcdm]+)\.)\s+(.*)$/;
  // Match unordered list: leading spaces + (• or -) + space + content
  const ulRegex = /^( *)[•-]\s+(.*)$/;

  for (const line of lines) {
    // Code block fence (standalone ```)
    if (line.trim() === '```') {
      closeAllLists();
      if (inCodeBlock) {
        inCodeBlock = false;
        const codeContent = codeBlockLines.join('\n');
        htmlLines.push(`<pre><code>${escapeHtml(codeContent)}</code></pre>`);
        codeBlockLines = [];
      } else {
        inCodeBlock = true;
      }
      continue;
    }
    // Inline code block pattern: ```content``` on a single line (legacy format)
    if (!inCodeBlock) {
      const inlineCodeBlockMatch = /^```([\s\S]+?)```$/.exec(line.trim());
      if (inlineCodeBlockMatch) {
        closeAllLists();
        const codeContent = inlineCodeBlockMatch[1] ?? '';
        htmlLines.push(`<pre><code>${escapeHtml(codeContent)}</code></pre>`);
        continue;
      }
    }
    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // Block patterns
    const olMatch = olRegex.exec(line);
    const ulMatch = ulRegex.exec(line);
    const bqMatch = /^>\s?(.*)$/.exec(line);

    if (olMatch) {
      const leadingSpaces = olMatch[1]?.length ?? 0;
      const content = olMatch[5] ?? '';
      const depth = Math.floor(leadingSpaces / 4);

      // Close any unordered lists and ordered lists deeper than current
      while (listStack.length > 0) {
        const top = listStack[listStack.length - 1];
        if (!top) break;
        if (top.depth > depth || (top.depth === depth && top.type !== 'ol')) {
          htmlLines.push(`</${top.type}>`);
          listStack.pop();
        } else {
          break;
        }
      }

      // Open new ordered lists as needed to reach current depth
      const currentListDepth =
        listStack.length > 0 ? (listStack[listStack.length - 1]?.depth ?? -1) : -1;
      if (currentListDepth < depth || listStack.length === 0) {
        while (
          (listStack.length === 0 ? -1 : (listStack[listStack.length - 1]?.depth ?? -1)) < depth
        ) {
          const newDepth =
            listStack.length === 0 ? 0 : (listStack[listStack.length - 1]?.depth ?? -1) + 1;
          htmlLines.push('<ol>');
          listStack.push({ type: 'ol', depth: newDepth });
          if (newDepth < depth) {
            // Need to wrap in an <li> for proper nesting
            htmlLines.push('<li>');
          }
        }
      }

      htmlLines.push(`<li>${applyInlineMarkdown(content)}</li>`);
    } else if (ulMatch) {
      const leadingSpaces = ulMatch[1]?.length ?? 0;
      const content = ulMatch[2] ?? '';
      const depth = Math.floor(leadingSpaces / 4);

      // Close lists deeper than current
      while (listStack.length > 0) {
        const top = listStack[listStack.length - 1];
        if (!top) break;
        if (top.depth > depth || (top.depth === depth && top.type !== 'ul')) {
          htmlLines.push(`</${top.type}>`);
          listStack.pop();
        } else {
          break;
        }
      }

      const currentListDepth =
        listStack.length > 0 ? (listStack[listStack.length - 1]?.depth ?? -1) : -1;
      if (currentListDepth < depth || listStack.length === 0) {
        while (
          (listStack.length === 0 ? -1 : (listStack[listStack.length - 1]?.depth ?? -1)) < depth
        ) {
          const newDepth =
            listStack.length === 0 ? 0 : (listStack[listStack.length - 1]?.depth ?? -1) + 1;
          htmlLines.push('<ul>');
          listStack.push({ type: 'ul', depth: newDepth });
          if (newDepth < depth) {
            htmlLines.push('<li>');
          }
        }
      }

      htmlLines.push(`<li>${applyInlineMarkdown(content)}</li>`);
    } else if (bqMatch) {
      closeAllLists();
      htmlLines.push(`<blockquote>${applyInlineMarkdown(bqMatch[1] ?? '')}</blockquote>`);
    } else if (line === '') {
      closeAllLists();
      htmlLines.push('<br>');
    } else {
      closeAllLists();
      htmlLines.push(`<p>${applyInlineMarkdown(line)}</p>`);
    }
  }

  // Close any open lists
  closeAllLists();

  // Close any unclosed code block
  if (inCodeBlock && codeBlockLines.length > 0) {
    htmlLines.push(`<pre><code>${escapeHtml(codeBlockLines.join('\n'))}</code></pre>`);
  }

  return htmlLines.join('');
}

function applyInlineMarkdown(text: string): string {
  // SECURITY: escape raw HTML before converting markdown markers to tags — output is
  // inserted via insertHTML (e.g. raw paste), so literal tags must stay inert text.
  return escapeUserHtml(text)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<strong>$1</strong>')
    .replace(/~~([^~]+)~~/g, '<s>$1</s>')
    .replace(/(?<!_)_([^_]+)_(?!_)/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/<u>([^<]+)<\/u>/g, '<u>$1</u>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label: string, url: string) => {
      // Block dangerous URL schemes so links can't become script vectors.
      const safeUrl = sanitizeLinkUrl(url);
      return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${label}</a>`;
    });
}

/** Block dangerous URL schemes (javascript:, data:, …) and escape quotes in the href. */
function sanitizeLinkUrl(url: string): string {
  const trimmed = url.trim();
  // Strip whitespace/control chars that can obfuscate the scheme (e.g. "java\tscript:").
  let normalized = '';
  for (const ch of trimmed) {
    if (ch.charCodeAt(0) > 0x20) normalized += ch;
  }
  normalized = normalized.toLowerCase();
  if (/^(?:javascript|data|vbscript|file):/i.test(normalized)) {
    return '#';
  }
  // Escape quotes so the URL can't break out of the href attribute.
  return trimmed.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
