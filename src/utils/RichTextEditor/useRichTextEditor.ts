/**
 * useRichTextEditor — React hook wrapping the RichTextEditor class.
 *
 * Creates and manages a RichTextEditor instance tied to a contenteditable ref.
 * Provides reactive format state and formatting action callbacks.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { RichTextEditor } from './RichTextEditor';
import type {
  CometChatRichTextEditorConfig,
  CometChatRichTextFormatState,
} from './RichTextEditor.types';
import { DEFAULT_FORMAT_STATE } from './RichTextEditor.types';

export interface UseRichTextEditorOptions {
  /** Whether rich text formatting is enabled. Default: true. */
  enabled?: boolean;
  /** Placeholder text. */
  placeholder?: string;
  /** ARIA label. */
  ariaLabel?: string;
  /** Called when content changes. */
  onUpdate?: (html: string, text: string) => void;
  /** Called when a link is clicked for editing. */
  onLinkClick?: (url: string, text: string, x: number, y: number) => void;
  /** Called when @ is typed. */
  onMentionStart?: (query: string) => void;
  /** Called when mention suggestions should close. */
  onMentionEnd?: () => void;
  /** Called on focus. */
  onFocus?: () => void;
  /** Called on blur. */
  onBlur?: () => void;
  /**
   * Called when Enter is pressed without Shift.
   * When provided, Enter sends the message instead of inserting a newline.
   * Shift+Enter always inserts a newline.
   */
  onEnterPress?: () => void;
  /**
   * Keyboard event interceptor. Called before the editor processes any keydown.
   * Return `true` to indicate the event was handled (editor skips its own handling).
   */
  onKeyDown?: (e: KeyboardEvent) => boolean;
}

export interface UseRichTextEditorReturn {
  /** Ref to attach to the contenteditable div. */
  editorRef: React.RefObject<HTMLDivElement | null>;
  /** Current format state (reactive). */
  formatState: CometChatRichTextFormatState;
  /** The RichTextEditor instance (null until mounted). */
  editor: RichTextEditor | null;
  // Formatting actions
  toggleBold: () => void;
  toggleItalic: () => void;
  toggleUnderline: () => void;
  toggleStrikethrough: () => void;
  toggleInlineCode: () => void;
  toggleCodeBlock: () => void;
  toggleBlockquote: () => void;
  toggleOrderedList: () => void;
  toggleBulletList: () => void;
  setLink: (url: string | null, text?: string) => void;
  getCurrentLink: () => string | null;
  getCurrentLinkText: () => string | null;
  getSelectedText: () => string;
  undo: () => void;
  redo: () => void;
  /** Insert text at cursor (inherits active formatting). */
  insertText: (text: string) => void;
  /** Insert text at cursor WITHOUT inheriting formatting (for emojis). */
  insertPlainText: (text: string) => void;
  /** Insert a mention node. */
  insertMention: (id: string, label: string, charsToDelete: number, isSelf?: boolean) => void;
  /** Get HTML content. */
  getHTML: () => string;
  /** Get plain text content. */
  getText: () => string;
  /** Get text with mention format (<@uid:xxx>). */
  getTextWithMentionFormat: () => string;
  /** Clear the editor. */
  clear: () => void;
  /** Focus the editor. */
  focus: (position?: 'start' | 'end') => void;
  /** Check if editor is empty. */
  isEmpty: () => boolean;
  /** Save selection for later restoration. */
  saveSelection: () => Range | null;
  /** Restore a saved selection. */
  restoreSelection: (range: Range | null) => void;
}

export function useRichTextEditor(options: UseRichTextEditorOptions = {}): UseRichTextEditorReturn {
  const {
    enabled = true,
    placeholder,
    ariaLabel,
    onUpdate,
    onLinkClick,
    onMentionStart,
    onMentionEnd,
    onFocus,
    onBlur,
    onEnterPress,
    onKeyDown,
  } = options;

  const editorRef = useRef<HTMLDivElement | null>(null);
  const editorInstanceRef = useRef<RichTextEditor | null>(null);
  const [formatState, setFormatState] = useState<CometChatRichTextFormatState>({
    ...DEFAULT_FORMAT_STATE,
  });

  // Store latest callbacks in refs to avoid re-creating the editor on every render
  const callbacksRef = useRef({
    onUpdate,
    onLinkClick,
    onMentionStart,
    onMentionEnd,
    onFocus,
    onBlur,
    onEnterPress,
    onKeyDown,
  });
  callbacksRef.current = {
    onUpdate,
    onLinkClick,
    onMentionStart,
    onMentionEnd,
    onFocus,
    onBlur,
    onEnterPress,
    onKeyDown,
  };

  // Create/destroy editor when element mounts or enabled changes
  useEffect(() => {
    const el = editorRef.current;
    if (!el || !enabled) {
      if (editorInstanceRef.current) {
        editorInstanceRef.current.destroy();
        editorInstanceRef.current = null;
      }
      return;
    }

    const config: CometChatRichTextEditorConfig = {
      placeholder,
      ariaLabel,
      enableFormatting: true,
      onUpdate: (html, text) => {
        callbacksRef.current.onUpdate?.(html, text);
      },
      onSelectionUpdate: state => {
        setFormatState({ ...state });
      },
      onLinkClick: (url, text, x, y) => {
        callbacksRef.current.onLinkClick?.(url, text, x, y);
      },
      onMentionStart: query => {
        callbacksRef.current.onMentionStart?.(query);
      },
      onMentionEnd: () => {
        callbacksRef.current.onMentionEnd?.();
      },
      onFocus: () => {
        callbacksRef.current.onFocus?.();
      },
      onBlur: () => {
        callbacksRef.current.onBlur?.();
      },
      onEnterPress: () => {
        callbacksRef.current.onEnterPress?.();
      },
      onKeyDown: (e: KeyboardEvent) => {
        return callbacksRef.current.onKeyDown?.(e) ?? false;
      },
    };

    const instance = new RichTextEditor(el, config);
    editorInstanceRef.current = instance;

    return () => {
      instance.destroy();
      editorInstanceRef.current = null;
    };
  }, [enabled, placeholder, ariaLabel]);

  // --- Action callbacks (stable via useCallback) ---

  /**
   * Ensures the editor has focus before applying a formatting command.
   * If the selection is outside the editor (e.g., user clicked on the
   * conversation list or message list), this focuses the editor at the end
   * so formatting applies only to the composer input.
   */
  const ensureEditorFocus = useCallback(() => {
    const editor = editorInstanceRef.current;
    if (!editor) return;
    const el = editorRef.current;
    if (!el) return;
    const sel = window.getSelection();
    // Only focus if the selection is completely outside the editor.
    // Do NOT re-focus when the editor is empty but already focused — that would
    // trigger selectionchange and clear any armed inline format overrides (bold, italic, etc).
    if (!sel || sel.rangeCount === 0 || !el.contains(sel.anchorNode)) {
      editor.focus('end');
    }
  }, []);

  const toggleBold = useCallback(() => {
    ensureEditorFocus();
    editorInstanceRef.current?.applyBold();
  }, [ensureEditorFocus]);
  const toggleItalic = useCallback(() => {
    ensureEditorFocus();
    editorInstanceRef.current?.applyItalic();
  }, [ensureEditorFocus]);
  const toggleUnderline = useCallback(() => {
    ensureEditorFocus();
    editorInstanceRef.current?.applyUnderline();
  }, [ensureEditorFocus]);
  const toggleStrikethrough = useCallback(() => {
    ensureEditorFocus();
    editorInstanceRef.current?.applyStrikethrough();
  }, [ensureEditorFocus]);
  const toggleInlineCode = useCallback(() => {
    ensureEditorFocus();
    editorInstanceRef.current?.applyInlineCode();
  }, [ensureEditorFocus]);
  const toggleCodeBlock = useCallback(() => {
    ensureEditorFocus();
    editorInstanceRef.current?.applyCodeBlock();
  }, [ensureEditorFocus]);
  const toggleBlockquote = useCallback(() => {
    ensureEditorFocus();
    editorInstanceRef.current?.applyBlockquote();
  }, [ensureEditorFocus]);
  const toggleOrderedList = useCallback(() => {
    ensureEditorFocus();
    editorInstanceRef.current?.applyOrderedList();
  }, [ensureEditorFocus]);
  const toggleBulletList = useCallback(() => {
    ensureEditorFocus();
    editorInstanceRef.current?.applyBulletList();
  }, [ensureEditorFocus]);
  const setLinkAction = useCallback((url: string | null, text?: string) => {
    editorInstanceRef.current?.setLink(url, text);
  }, []);
  const getCurrentLinkAction = useCallback(
    () => editorInstanceRef.current?.getCurrentLink() ?? null,
    []
  );
  const getCurrentLinkTextAction = useCallback(
    () => editorInstanceRef.current?.getCurrentLinkText() ?? null,
    []
  );
  const getSelectedTextAction = useCallback(
    () => editorInstanceRef.current?.getSelectedText() ?? '',
    []
  );
  const undoAction = useCallback(() => {
    editorInstanceRef.current?.undo();
  }, []);
  const redoAction = useCallback(() => {
    editorInstanceRef.current?.redo();
  }, []);
  const insertTextAction = useCallback((text: string) => {
    editorInstanceRef.current?.insertText(text);
  }, []);
  const insertPlainTextAction = useCallback((text: string) => {
    editorInstanceRef.current?.insertPlainText(text);
  }, []);
  const insertMentionAction = useCallback(
    (id: string, label: string, charsToDelete: number, isSelf?: boolean) => {
      editorInstanceRef.current?.insertMention(id, label, charsToDelete, isSelf);
    },
    []
  );
  const getHTMLAction = useCallback(() => editorInstanceRef.current?.getHTML() ?? '', []);
  const getTextAction = useCallback(() => editorInstanceRef.current?.getText() ?? '', []);
  const getTextWithMentionFormatAction = useCallback(
    () => editorInstanceRef.current?.getTextWithMentionFormat() ?? '',
    []
  );
  const clearAction = useCallback(() => {
    editorInstanceRef.current?.clear();
  }, []);
  const focusAction = useCallback((position?: 'start' | 'end') => {
    editorInstanceRef.current?.focus(position);
  }, []);
  const isEmptyAction = useCallback(() => editorInstanceRef.current?.isEmpty() ?? true, []);
  const saveSelectionAction = useCallback(
    () => editorInstanceRef.current?.saveSelection() ?? null,
    []
  );
  const restoreSelectionAction = useCallback((range: Range | null) => {
    editorInstanceRef.current?.restoreSelection(range);
  }, []);

  return {
    editorRef,
    formatState,
    editor: editorInstanceRef.current,
    toggleBold,
    toggleItalic,
    toggleUnderline,
    toggleStrikethrough,
    toggleInlineCode,
    toggleCodeBlock,
    toggleBlockquote,
    toggleOrderedList,
    toggleBulletList,
    setLink: setLinkAction,
    getCurrentLink: getCurrentLinkAction,
    getCurrentLinkText: getCurrentLinkTextAction,
    getSelectedText: getSelectedTextAction,
    undo: undoAction,
    redo: redoAction,
    insertText: insertTextAction,
    insertPlainText: insertPlainTextAction,
    insertMention: insertMentionAction,
    getHTML: getHTMLAction,
    getText: getTextAction,
    getTextWithMentionFormat: getTextWithMentionFormatAction,
    clear: clearAction,
    focus: focusAction,
    isEmpty: isEmptyAction,
    saveSelection: saveSelectionAction,
    restoreSelection: restoreSelectionAction,
  };
}
