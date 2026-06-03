import React, { useCallback, useEffect, useRef } from 'react';
import type { CometChatMessageComposerInputProps } from './CometChatMessageComposer.types';
import { useCometChatMessageComposerContext } from './CometChatMessageComposer.context';
import { useLocale } from '../../context/locale/LocaleContext';
import './CometChatMessageComposer.css';

/**
 * CometChatMessageComposerInput — the text input area.
 *
 * Uses a contentEditable div. When `enableRichTextEditor` is true, the
 * RichTextEditor class is attached by the Root component and handles
 * formatting, keyboard shortcuts, and markdown auto-conversion.
 *
 * Auto-resizes up to maxInputHeight. Handles Enter/Shift+Enter behavior.
 */
export const CometChatMessageComposerInput: React.FC<CometChatMessageComposerInputProps> = ({
  className,
}) => {
  const {
    text,
    setText,
    sendMessage,
    editMessage,
    isInEditMode,
    enterKeyBehavior,
    maxInputHeight,
    placeholder,
    inputRef,
    canSend,
    enableRichTextEditor,
    richTextEditorRef,
    disableMentions,
    onMentionQueryChange,
    onMentionEnd,
  } = useCometChatMessageComposerContext();
  const { getLocalizedString } = useLocale();

  const internalRef = useRef<HTMLDivElement>(null);
  const isComposingRef = useRef(false);

  // When rich text is enabled, use the editor ref from Root (shared with toolbar).
  // When plain text, use the local internalRef.
  const activeRef = enableRichTextEditor ? richTextEditorRef : internalRef;

  // Sync the shared inputRef
  useEffect(() => {
    const el = activeRef.current;
    if (el) {
      Object.defineProperty(inputRef, 'current', {
        value: el,
        writable: true,
        configurable: true,
      });
    }
  }, [inputRef, activeRef]);

  // Handle input changes
  const handleInput = useCallback(() => {
    if (enableRichTextEditor) return; // Rich text editor handles this via its own onUpdate
    const el = internalRef.current;
    if (!el) return;
    const newText = el.textContent ?? '';
    setText(newText);

    // Mention detection in plain text mode
    if (!disableMentions && onMentionQueryChange) {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        const textNode = range.startContainer;
        if (textNode.nodeType === Node.TEXT_NODE) {
          const textContent = textNode.textContent ?? '';
          const before = textContent.substring(0, range.startOffset);
          const atMatch = /(^|\s)@([^\s]*)$/.exec(before);
          if (atMatch) {
            console.log('[CometChat Mentions Input] @ pattern matched:', atMatch[2]);
            onMentionQueryChange(atMatch[2] ?? '');
          } else {
            onMentionEnd?.();
          }
        } else {
          onMentionEnd?.();
        }
      }
    }
  }, [setText, enableRichTextEditor, disableMentions, onMentionQueryChange, onMentionEnd]);

  // Handle paste in plain text mode — strip all HTML and paste only text
  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      if (enableRichTextEditor) return; // Rich text editor handles its own paste
      e.preventDefault();
      const plainText = e.clipboardData.getData('text/plain');
      if (plainText) {
        // eslint-disable-next-line @typescript-eslint/no-deprecated -- no modern alternative for inserting plain text at caret in contentEditable
        document.execCommand('insertText', false, plainText);
        setText(internalRef.current?.textContent ?? '');
      }
    },
    [enableRichTextEditor, setText]
  );

  // Handle key down (plain text mode — rich text editor handles its own shortcuts)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (enableRichTextEditor) return;
      if (isComposingRef.current) return;

      if (e.key === 'Enter' && !e.shiftKey) {
        if (enterKeyBehavior === 'send') {
          e.preventDefault();
          if (isInEditMode) {
            if (canSend) {
              void editMessage();
            }
          } else if (canSend) {
            void sendMessage();
          }
        }
        if (enterKeyBehavior === 'none') {
          e.preventDefault();
        }
      }
    },
    [enterKeyBehavior, isInEditMode, canSend, sendMessage, editMessage, enableRichTextEditor]
  );

  // Sync text from state to contentEditable (for programmatic changes like emoji insert)
  useEffect(() => {
    if (enableRichTextEditor) return;
    const el = internalRef.current;
    if (!el) return;
    if (el.textContent !== text) {
      el.textContent = text;
    }
  }, [text, enableRichTextEditor]);

  // Auto-focus on mount (desktop only)
  useEffect(() => {
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    if (!isMobile) {
      activeRef.current?.focus();
    }
  }, [activeRef]);

  const inputClass = [
    'cometchat-message-composer__input',
    'cometchat-message-composer__input',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const showPlaceholder = text.length === 0;

  return (
    <div className={'cometchat-message-composer__input-wrapper'}>
      {showPlaceholder && (
        <div className={'cometchat-message-composer__input-placeholder'} aria-hidden="true">
          {placeholder}
        </div>
      )}
      <div
        ref={activeRef}
        className={inputClass}
        contentEditable
        role="textbox"
        tabIndex={0}
        aria-multiline="true"
        aria-label={
          isInEditMode
            ? getLocalizedString('message_composer_edit_message')
            : getLocalizedString('message_composer_type_message')
        }
        data-placeholder={enableRichTextEditor ? placeholder : undefined}
        style={{ maxHeight: maxInputHeight }}
        onInput={enableRichTextEditor ? undefined : handleInput}
        onKeyDown={enableRichTextEditor ? undefined : handleKeyDown}
        onPaste={enableRichTextEditor ? undefined : handlePaste}
        onCompositionStart={
          enableRichTextEditor
            ? undefined
            : () => {
                isComposingRef.current = true;
              }
        }
        onCompositionEnd={
          enableRichTextEditor
            ? undefined
            : () => {
                isComposingRef.current = false;
              }
        }
        suppressContentEditableWarning
      />
    </div>
  );
};
