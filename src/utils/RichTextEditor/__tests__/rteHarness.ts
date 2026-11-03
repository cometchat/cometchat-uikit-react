/* eslint-disable @typescript-eslint/no-deprecated */
/**
 * Shared test harness for the RichTextEditor specs.
 *
 * jsdom has no contenteditable support, no execCommand / queryCommandState and no
 * ClipboardEvent, so these helpers stand in for the browser pieces the editor talks to.
 */
import { vi } from 'vitest';
import type { Mock } from 'vitest';
import { RichTextEditor } from '../RichTextEditor';
import type { CometChatRichTextEditorConfig } from '../RichTextEditor.types';

type ExecCommandFn = (command: string, showUI?: boolean, value?: string) => boolean;

const mounted: { el: HTMLDivElement; editor: RichTextEditor }[] = [];

/** Mount an editor on a fresh, focusable <div> attached to the document. */
export function mountEditor(
  config: CometChatRichTextEditorConfig = {},
  html?: string
): { el: HTMLDivElement; editor: RichTextEditor } {
  const el = document.createElement('div');
  // jsdom does not treat contenteditable elements as focusable; a tabindex does.
  el.tabIndex = 0;
  // jsdom's focus() also resets the selection to (el, 0). A browser keeps a caret that is
  // already inside the focused contenteditable, so model that.
  const nativeFocus = el.focus.bind(el);
  el.focus = (options?: FocusOptions) => {
    const sel = window.getSelection();
    const keep =
      sel && sel.rangeCount > 0 && el.contains(sel.getRangeAt(0).startContainer)
        ? sel.getRangeAt(0).cloneRange()
        : null;
    nativeFocus(options);
    if (sel && keep) {
      sel.removeAllRanges();
      sel.addRange(keep);
    }
  };
  document.body.appendChild(el);
  const editor = new RichTextEditor(el, config);
  if (html !== undefined) el.innerHTML = html;
  mounted.push({ el, editor });
  return { el, editor };
}

/** Tear down everything the harness installed. Call from afterEach. */
export function cleanupEditors(): void {
  for (const { el, editor } of mounted) {
    if (!editor.isDestroyed()) editor.destroy();
    el.remove();
  }
  mounted.length = 0;
  window.getSelection()?.removeAllRanges();
  Reflect.deleteProperty(document, 'execCommand');
  Reflect.deleteProperty(document, 'queryCommandState');
  document.body.innerHTML = '';
}

/** Place a collapsed caret at (node, offset). */
export function setCaret(node: Node, offset: number): void {
  const range = document.createRange();
  range.setStart(node, offset);
  range.collapse(true);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}

/** Select from (startNode, startOffset) to (endNode, endOffset). */
export function selectRange(
  startNode: Node,
  startOffset: number,
  endNode: Node = startNode,
  endOffset: number = startOffset
): void {
  const range = document.createRange();
  range.setStart(startNode, startOffset);
  range.setEnd(endNode, endOffset);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}

/** First text node under `root` (depth-first). */
export function textNodeOf(root: Node): Text {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const node = walker.nextNode();
  if (!node) throw new Error('no text node');
  return node as Text;
}

/** Insert a text node (or parsed HTML) at the current selection, like the browser would. */
function insertAtSelection(build: () => Node): void {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const range = sel.getRangeAt(0);
  range.deleteContents();
  const node = build();
  const last = node.nodeType === Node.DOCUMENT_FRAGMENT_NODE ? node.lastChild : node;
  range.insertNode(node);
  if (last) {
    const after = document.createRange();
    after.setStartAfter(last);
    after.collapse(true);
    sel.removeAllRanges();
    sel.addRange(after);
  }
}

/**
 * Install a fake `document.execCommand`. It records every call and performs a minimal
 * DOM change for `insertText` / `insertHTML` so callers can assert the result.
 * `onCommand` lets a test model what the browser would do for other commands.
 */
export function installExecCommand(
  onCommand?: (command: string, value?: string) => void
): Mock<ExecCommandFn> {
  const fn = vi.fn<ExecCommandFn>((command, _showUI, value) => {
    onCommand?.(command, value);
    if (command === 'insertText') {
      insertAtSelection(() => document.createTextNode(value ?? ''));
    } else if (command === 'insertHTML') {
      insertAtSelection(() => {
        const tpl = document.createElement('template');
        tpl.innerHTML = value ?? '';
        return tpl.content;
      });
    }
    return true;
  });
  document.execCommand = fn;
  return fn;
}

/** Install a fake `document.queryCommandState` that reports the given commands as active. */
export function installQueryCommandState(active: string[] = []): Mock<(cmd: string) => boolean> {
  const fn = vi.fn((cmd: string) => active.includes(cmd));
  document.queryCommandState = fn;
  return fn;
}

/** Dispatch a cancelable keydown on `target` and return the event. */
export function keydown(target: EventTarget, init: KeyboardEventInit): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  return event;
}

/** Dispatch an `input` event on `target`. */
export function input(target: EventTarget): void {
  target.dispatchEvent(new Event('input', { bubbles: true }));
}

/** Dispatch `selectionchange` on the document. */
export function selectionChange(): void {
  document.dispatchEvent(new Event('selectionchange'));
}

interface PasteData {
  text?: string;
  html?: string;
  files?: boolean;
}

/** Dispatch a cancelable paste event carrying fake clipboard data. Returns the event. */
export function paste(target: EventTarget, data: PasteData | null): Event {
  const event = new Event('paste', { bubbles: true, cancelable: true });
  const clipboardData =
    data === null
      ? null
      : {
          items: data.files ? [{ kind: 'file' }] : [{ kind: 'string' }],
          getData: (type: string): string => {
            if (type === 'text/plain') return data.text ?? '';
            if (type === 'text/html') return data.html ?? '';
            return '';
          },
        };
  Object.defineProperty(event, 'clipboardData', { value: clipboardData });
  target.dispatchEvent(event);
  return event;
}
