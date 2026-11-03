import { describe, it, expect, vi, afterEach } from 'vitest';
import { RichTextEditor } from '../RichTextEditor';
import { DEFAULT_FORMAT_STATE } from '../RichTextEditor.types';
import {
  mountEditor,
  cleanupEditors,
  setCaret,
  selectRange,
  textNodeOf,
  installExecCommand,
  installQueryCommandState,
  keydown,
  input,
  selectionChange,
} from './rteHarness';

afterEach(() => {
  cleanupEditors();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('RichTextEditor — construction', () => {
  it('turns the element into an accessible, editable textbox', () => {
    const { el } = mountEditor();
    expect(el.contentEditable).toBe('true');
    expect(el.getAttribute('role')).toBe('textbox');
    expect(el.getAttribute('aria-multiline')).toBe('true');
    expect(el.getAttribute('aria-label')).toBe('Rich text editor');
    expect(el.hasAttribute('data-placeholder')).toBe(false);
  });

  it('applies editable=false, ariaLabel, placeholder and initial content from config', () => {
    const { el, editor } = mountEditor({
      editable: false,
      ariaLabel: 'Compose',
      placeholder: 'Say hi',
      content: '<p>hello</p>',
    });
    expect(el.contentEditable).toBe('false');
    expect(el.getAttribute('aria-label')).toBe('Compose');
    expect(el.getAttribute('data-placeholder')).toBe('Say hi');
    expect(editor.getHTML()).toBe('<p>hello</p>');
  });

  it.each([
    ['start', 0],
    ['end', 5],
    [true, 5],
  ] as const)('autofocus=%s places the caret on the next frame', (autofocus, expected) => {
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
      frames.push(cb);
      return frames.length;
    });
    const { el } = mountEditor({ autofocus, content: 'hello' });
    expect(frames).toHaveLength(1);
    frames[0]?.(0);
    const sel = window.getSelection()!;
    expect(document.activeElement).toBe(el);
    expect(sel.isCollapsed).toBe(true);
    const range = sel.getRangeAt(0);
    // selectAllChildren + collapse lands on the editor element itself
    expect(range.startContainer).toBe(el);
    expect(range.startOffset).toBe(expected === 0 ? 0 : el.childNodes.length);
  });

  it('does not schedule focus without autofocus', () => {
    const spy = vi.spyOn(window, 'requestAnimationFrame');
    mountEditor();
    expect(spy).not.toHaveBeenCalled();
  });

  it('uses the configured ownerDocument / ownerWindow for DOM operations', () => {
    const exec = vi.fn(() => true);
    const ownerDocument = { execCommand: exec } as unknown as Document;
    const el = document.createElement('div');
    // selectionchange is bound to the owner document, so it needs an addEventListener
    const listeners: string[] = [];
    (ownerDocument as unknown as { addEventListener: (t: string) => void }).addEventListener = (
      t: string
    ) => listeners.push(t);
    (ownerDocument as unknown as { removeEventListener: () => void }).removeEventListener =
      vi.fn();
    const editor = new RichTextEditor(el, { ownerDocument, ownerWindow: window });
    expect(editor.getDocument()).toBe(ownerDocument);
    expect(editor.getWindow()).toBe(window);
    expect(listeners).toEqual(['selectionchange']);
    editor.insertText('x');
    expect(exec).toHaveBeenCalledWith('insertText', false, 'x');
    editor.destroy();
  });

  it('falls back to the global document and window', () => {
    const { editor } = mountEditor();
    expect(editor.getDocument()).toBe(document);
    expect(editor.getWindow()).toBe(window);
  });
});

describe('RichTextEditor — content API', () => {
  it('getHTML / getText / isEmpty reflect the element', () => {
    const { editor } = mountEditor({}, '<p>Hi <b>there</b></p>');
    expect(editor.getHTML()).toBe('<p>Hi <b>there</b></p>');
    expect(editor.getText()).toBe('Hi there');
    expect(editor.isEmpty()).toBe(false);
  });

  it('isEmpty treats whitespace-only content as empty', () => {
    const { editor } = mountEditor({}, '<p>   </p>');
    expect(editor.isEmpty()).toBe(true);
  });

  it('setHTML replaces content and emits onUpdate', () => {
    const onUpdate = vi.fn();
    const { el, editor } = mountEditor({ onUpdate });
    editor.setHTML('<b>x</b>');
    expect(el.innerHTML).toBe('<b>x</b>');
    expect(onUpdate).toHaveBeenCalledWith('<b>x</b>', 'x');
  });

  it('refresh re-emits content and the format state', () => {
    const onUpdate = vi.fn();
    const onSelectionUpdate = vi.fn();
    const { el, editor } = mountEditor({ onUpdate, onSelectionUpdate }, '<b>bold</b>');
    setCaret(textNodeOf(el), 2);
    editor.refresh();
    expect(onUpdate).toHaveBeenCalledWith('<b>bold</b>', 'bold');
    expect(onSelectionUpdate).toHaveBeenCalledWith(expect.objectContaining({ bold: true }));
  });

  it('clear empties the editor, resets format state and parks the caret on the root', () => {
    const exec = installExecCommand();
    installQueryCommandState(['bold']);
    const onUpdate = vi.fn();
    const onSelectionUpdate = vi.fn();
    const { el, editor } = mountEditor({ onUpdate, onSelectionUpdate }, '<b>bold</b>');
    setCaret(textNodeOf(el), 2);
    editor.refresh();
    expect(editor.getFormatState().bold).toBe(true);

    editor.clear();

    expect(el.innerHTML).toBe('');
    expect(editor.getFormatState()).toEqual(DEFAULT_FORMAT_STATE);
    // bold was reported active, so it is toggled off; the others were not
    expect(exec).toHaveBeenCalledWith('bold', false);
    expect(exec).not.toHaveBeenCalledWith('italic', false);
    const range = window.getSelection()!.getRangeAt(0);
    expect(range.startContainer).toBe(el);
    expect(range.startOffset).toBe(0);
    expect(onUpdate).toHaveBeenLastCalledWith('', '');
    expect(onSelectionUpdate).toHaveBeenLastCalledWith(DEFAULT_FORMAT_STATE);
  });

  it('clear tolerates a document without queryCommandState', () => {
    const { el, editor } = mountEditor({}, 'abc');
    expect(() => {
      editor.clear();
    }).not.toThrow();
    expect(el.innerHTML).toBe('');
  });

  it('getFormatState returns a copy', () => {
    const { editor } = mountEditor();
    const state = editor.getFormatState();
    state.bold = true;
    expect(editor.getFormatState().bold).toBe(false);
  });
});

describe('RichTextEditor — focus', () => {
  it('focus("start") collapses the caret to the start of the content', () => {
    const { el, editor } = mountEditor({}, '<p>a</p><p>b</p>');
    editor.focus('start');
    const sel = window.getSelection()!;
    expect(document.activeElement).toBe(el);
    expect(sel.getRangeAt(0).startContainer).toBe(el);
    expect(sel.getRangeAt(0).startOffset).toBe(0);
  });

  it('focus() defaults to the end of the content', () => {
    const { el, editor } = mountEditor({}, '<p>a</p><p>b</p>');
    editor.focus();
    const range = window.getSelection()!.getRangeAt(0);
    expect(range.startContainer).toBe(el);
    expect(range.startOffset).toBe(2);
  });

  it('focus on an empty editor creates a caret at offset 0', () => {
    const { el, editor } = mountEditor();
    editor.focus('end');
    const sel = window.getSelection()!;
    expect(sel.rangeCount).toBe(1);
    expect(sel.getRangeAt(0).startContainer).toBe(el);
    expect(sel.getRangeAt(0).startOffset).toBe(0);
  });
});

describe('RichTextEditor — text insertion', () => {
  it('insertText delegates to execCommand("insertText") and emits', () => {
    const exec = installExecCommand();
    const onUpdate = vi.fn();
    const { el, editor } = mountEditor({ onUpdate }, 'ab');
    setCaret(textNodeOf(el), 2);
    editor.insertText('<c>');
    expect(exec).toHaveBeenCalledWith('insertText', false, '<c>');
    // inserted as text, not markup
    expect(el.textContent).toBe('ab<c>');
    expect(el.querySelector('c')).toBeNull();
    expect(onUpdate).toHaveBeenLastCalledWith(el.innerHTML, 'ab<c>');
  });

  it('insertPlainText falls back to execCommand when there is no selection', () => {
    const exec = installExecCommand();
    const { editor } = mountEditor({}, 'ab');
    vi.spyOn(window, 'getSelection').mockReturnValue(null);
    editor.insertPlainText('😀');
    expect(exec).toHaveBeenCalledWith('insertText', false, '😀');
  });

  it('insertPlainText inserts a bare text node outside formatting and moves the caret after it', () => {
    const exec = installExecCommand();
    const onUpdate = vi.fn();
    const { el, editor } = mountEditor({ onUpdate }, '<p>ab</p>');
    setCaret(textNodeOf(el), 1);
    editor.insertPlainText('😀');
    expect(exec).not.toHaveBeenCalled();
    // normalize() merges the inserted node with its neighbours
    expect(el.innerHTML).toBe('<p>a😀b</p>');
    expect(el.querySelector('p')!.childNodes).toHaveLength(1);
    expect(onUpdate).toHaveBeenCalledWith('<p>a😀b</p>', 'a😀b');
  });

  it('insertPlainText escapes markup (inserts it as text)', () => {
    const { el, editor } = mountEditor({}, '<p>x</p>');
    setCaret(textNodeOf(el), 1);
    editor.insertPlainText('<img src=x onerror=alert(1)>');
    expect(el.querySelector('img')).toBeNull();
    expect(el.textContent).toBe('x<img src=x onerror=alert(1)>');
  });

  it('insertPlainText inside bold wraps the text in a style-resetting span', () => {
    const { el, editor } = mountEditor({}, '<p><b>bold</b></p>');
    setCaret(textNodeOf(el.querySelector('b')!), 4);
    editor.insertPlainText('😀');
    const span = el.querySelector('b > span')!;
    expect(span.textContent).toBe('😀');
    expect((span as HTMLElement).style.fontWeight).toBe('normal');
    expect((span as HTMLElement).style.fontStyle).toBe('normal');
    expect((span as HTMLElement).style.textDecoration).toBe('none');
    const range = window.getSelection()!.getRangeAt(0);
    // caret is placed right after the span
    expect(range.startContainer).toBe(span.parentNode);
    expect(range.startContainer.childNodes[range.startOffset - 1]).toBe(span);
  });

  it('insertPlainText replaces a non-collapsed selection', () => {
    const { el, editor } = mountEditor({}, '<p>hello</p>');
    const t = textNodeOf(el);
    selectRange(t, 1, t, 4);
    editor.insertPlainText('X');
    expect(el.textContent).toBe('hXo');
  });
});

describe('RichTextEditor — destroy', () => {
  it('removes all listeners so events no longer reach config callbacks', () => {
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    const onKeyDown = vi.fn(() => false);
    const onUpdate = vi.fn();
    const onSelectionUpdate = vi.fn();
    const onLinkClick = vi.fn();
    const { el, editor } = mountEditor(
      { onFocus, onBlur, onKeyDown, onUpdate, onSelectionUpdate, onLinkClick },
      '<a href="#l">l</a>'
    );
    expect(editor.isDestroyed()).toBe(false);
    editor.destroy();
    expect(editor.isDestroyed()).toBe(true);

    el.dispatchEvent(new FocusEvent('focus'));
    el.dispatchEvent(new FocusEvent('blur'));
    keydown(el, { key: 'a' });
    input(el);
    el.focus();
    setCaret(textNodeOf(el), 0);
    selectionChange();
    el.querySelector('a')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(onFocus).not.toHaveBeenCalled();
    expect(onBlur).not.toHaveBeenCalled();
    expect(onKeyDown).not.toHaveBeenCalled();
    expect(onUpdate).not.toHaveBeenCalled();
    expect(onSelectionUpdate).not.toHaveBeenCalled();
    expect(onLinkClick).not.toHaveBeenCalled();
  });

  it('cancels a pending history push', () => {
    vi.useFakeTimers();
    const { editor } = mountEditor({ content: 'a' });
    vi.advanceTimersByTime(300);
    editor.setHTML('b');
    editor.destroy();
    vi.advanceTimersByTime(300);
    // the 'b' snapshot never landed, so there is nothing to undo to
    expect(editor.canUndo()).toBe(false);
  });
});

describe('RichTextEditor — focus / blur callbacks', () => {
  it('forwards focus and blur events', () => {
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    const { el } = mountEditor({ onFocus, onBlur });
    el.dispatchEvent(new FocusEvent('focus'));
    expect(onFocus).toHaveBeenCalledTimes(1);
    el.dispatchEvent(new FocusEvent('blur'));
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('focus / blur without callbacks do not throw', () => {
    const { el } = mountEditor();
    expect(() => {
      el.dispatchEvent(new FocusEvent('focus'));
      el.dispatchEvent(new FocusEvent('blur'));
    }).not.toThrow();
  });
});

describe('RichTextEditor — selection API', () => {
  it('getSelectedText returns the selected string', () => {
    const { el, editor } = mountEditor({}, 'hello world');
    selectRange(textNodeOf(el), 0, textNodeOf(el), 5);
    expect(editor.getSelectedText()).toBe('hello');
  });

  it('getSelectedText returns "" with no selection', () => {
    const { editor } = mountEditor({}, 'x');
    window.getSelection()!.removeAllRanges();
    expect(editor.getSelectedText()).toBe('');
  });

  it('saveSelection clones the range and restoreSelection puts it back', () => {
    const { el, editor } = mountEditor({}, 'hello world');
    const t = textNodeOf(el);
    selectRange(t, 6, t, 11);
    const saved = editor.saveSelection();
    expect(saved).not.toBeNull();
    setCaret(t, 0);
    expect(editor.getSelectedText()).toBe('');
    editor.restoreSelection(saved);
    expect(editor.getSelectedText()).toBe('world');
  });

  it('saveSelection returns null without a range; restoreSelection(null) is a no-op', () => {
    const { el, editor } = mountEditor({}, 'abc');
    window.getSelection()!.removeAllRanges();
    expect(editor.saveSelection()).toBeNull();
    setCaret(textNodeOf(el), 1);
    editor.restoreSelection(null);
    expect(window.getSelection()!.getRangeAt(0).startOffset).toBe(1);
  });
});

describe('RichTextEditor — undo / redo', () => {
  it('walks back and forth through debounced snapshots', () => {
    vi.useFakeTimers();
    const onUpdate = vi.fn();
    const { el, editor } = mountEditor({ content: 'one', onUpdate });
    vi.advanceTimersByTime(300);
    expect(editor.canUndo()).toBe(false);

    editor.setHTML('two');
    vi.advanceTimersByTime(300);
    expect(editor.canUndo()).toBe(true);
    expect(editor.canRedo()).toBe(false);

    expect(editor.undo()).toBe(true);
    expect(el.innerHTML).toBe('one');
    expect(onUpdate).toHaveBeenLastCalledWith('one', 'one');
    expect(editor.canRedo()).toBe(true);
    expect(editor.undo()).toBe(false);

    expect(editor.redo()).toBe(true);
    expect(el.innerHTML).toBe('two');
    expect(editor.redo()).toBe(false);
  });

  it('collapses rapid edits into a single snapshot', () => {
    vi.useFakeTimers();
    const { el, editor } = mountEditor({ content: 'a' });
    vi.advanceTimersByTime(300);
    editor.setHTML('ab');
    editor.setHTML('abc');
    vi.advanceTimersByTime(300);
    editor.undo();
    expect(el.innerHTML).toBe('a');
  });
});

describe('RichTextEditor — formatting commands', () => {
  it.each([
    ['applyBold', 'bold'],
    ['applyItalic', 'italic'],
    ['applyUnderline', 'underline'],
    ['applyStrikethrough', 'strikeThrough'],
  ] as const)('%s runs execCommand("%s") and emits an update', (method, command) => {
    const exec = installExecCommand();
    const onUpdate = vi.fn();
    const { el, editor } = mountEditor({ onUpdate }, 'abc');
    selectRange(textNodeOf(el), 0, textNodeOf(el), 3);
    editor[method]();
    expect(exec).toHaveBeenCalledWith(command, false, undefined);
    expect(document.activeElement).toBe(el);
    expect(onUpdate).toHaveBeenCalled();
  });

  it('applyInlineCode wraps the selection in <code>', () => {
    const { el, editor } = mountEditor({}, '<p>abc</p>');
    selectRange(textNodeOf(el), 0, textNodeOf(el), 3);
    editor.applyInlineCode();
    expect(el.querySelector('code')?.textContent).toBe('abc');
  });

  it('applyInlineCode toggles off an existing inline code', () => {
    const { el, editor } = mountEditor({}, '<p><code>abc</code></p>');
    setCaret(textNodeOf(el), 1);
    editor.applyInlineCode();
    expect(el.querySelector('code')).toBeNull();
    expect(el.textContent).toBe('abc');
  });

  it('applyCodeBlock converts the current block into <pre><code>', () => {
    const onUpdate = vi.fn();
    const { el, editor } = mountEditor({ onUpdate }, '<p>abc</p>');
    setCaret(textNodeOf(el), 1);
    editor.applyCodeBlock();
    expect(el.querySelector('pre')).not.toBeNull();
    expect(el.querySelector('pre')!.textContent).toContain('abc');
    expect(onUpdate).toHaveBeenCalled();
  });

  it('applyCodeBlock toggles off an existing code block', () => {
    const { el, editor } = mountEditor({}, '<pre><code>abc</code></pre>');
    setCaret(textNodeOf(el), 1);
    editor.applyCodeBlock();
    expect(el.querySelector('pre')).toBeNull();
    expect(el.querySelector('p')!.textContent).toBe('abc');
  });

  it('applyBlockquote wraps and unwraps the current block', () => {
    const { el, editor } = mountEditor({}, '<p>quote</p>');
    setCaret(textNodeOf(el), 2);
    editor.applyBlockquote();
    expect(el.querySelector('blockquote')?.textContent).toBe('quote');
    setCaret(textNodeOf(el), 2);
    editor.applyBlockquote();
    expect(el.querySelector('blockquote')).toBeNull();
    expect(el.textContent).toBe('quote');
  });

  it('applyOrderedList / applyBulletList run the list execCommands', () => {
    const exec = installExecCommand();
    const { el, editor } = mountEditor({}, '<p>item</p>');
    setCaret(textNodeOf(el), 2);
    editor.applyOrderedList();
    expect(exec).toHaveBeenCalledWith('insertOrderedList', false);
    // execCommand is a stub, so the fallback builds the list by hand
    expect(el.querySelector('ol > li')?.textContent).toBe('item');

    setCaret(textNodeOf(el.querySelector('li')!), 1);
    editor.applyOrderedList();
    expect(el.querySelector('ol')).toBeNull();

    setCaret(textNodeOf(el), 1);
    editor.applyBulletList();
    expect(exec).toHaveBeenCalledWith('insertUnorderedList', false);
    expect(el.querySelector('ul > li')?.textContent).toBe('item');
  });
});

describe('RichTextEditor — links', () => {
  it('getCurrentLink / getCurrentLinkText read the anchor at the caret', () => {
    const { el, editor } = mountEditor({}, 'see <a href="https://example.com/">site</a>');
    setCaret(textNodeOf(el.querySelector('a')!), 1);
    expect(editor.getCurrentLink()).toBe('https://example.com/');
    expect(editor.getCurrentLinkText()).toBe('site');
    setCaret(textNodeOf(el), 1);
    expect(editor.getCurrentLink()).toBeNull();
    expect(editor.getCurrentLinkText()).toBeNull();
  });

  it('setLink edits an existing anchor in place', () => {
    const onUpdate = vi.fn();
    const { el, editor } = mountEditor({ onUpdate }, '<a href="https://old.test/">old</a>');
    setCaret(textNodeOf(el), 1);
    editor.setLink('https://new.test/', 'new');
    const a = el.querySelector('a')!;
    expect(a.href).toBe('https://new.test/');
    expect(a.textContent).toBe('new');
    expect(a.getAttribute('target')).toBe('_blank');
    expect(a.getAttribute('rel')).toBe('noopener noreferrer');
    expect(onUpdate).toHaveBeenCalled();
  });

  it('setLink creates a new link via execCommand("createLink")', () => {
    const exec = installExecCommand();
    installQueryCommandState();
    const { el, editor } = mountEditor({}, 'text');
    selectRange(textNodeOf(el), 0, textNodeOf(el), 4);
    editor.setLink('https://example.com');
    expect(exec).toHaveBeenCalledWith('createLink', false, 'https://example.com');
  });

  it('setLink(null) selects the whole anchor and unlinks it', () => {
    const exec = installExecCommand();
    const { el, editor } = mountEditor({}, '<a href="https://x.test/">link</a>');
    setCaret(textNodeOf(el), 2);
    editor.setLink(null);
    expect(exec).toHaveBeenCalledWith('unlink', false, undefined);
    expect(editor.getSelectedText()).toBe('link');
  });
});

describe('RichTextEditor — mentions', () => {
  it('insertMention replaces the typed trigger with a mention chip', () => {
    const onUpdate = vi.fn();
    const { el, editor } = mountEditor({ onUpdate }, 'hi @jo');
    setCaret(textNodeOf(el), 6);
    editor.insertMention('uid-1', 'John', 3);
    const chip = el.querySelector('[data-uid="uid-1"]')!;
    expect(chip.textContent).toBe('@John');
    expect(chip.getAttribute('contenteditable')).toBe('false');
    expect(el.textContent).toBe('hi @John\u00A0');
    expect(onUpdate).toHaveBeenCalled();
  });

  it('serialises mentions and lists unique uids', () => {
    const { el, editor } = mountEditor({}, 'x');
    setCaret(textNodeOf(el), 1);
    editor.insertMention('u1', 'Ann', 0);
    editor.insertMention('u2', 'Bob', 0, true);
    editor.insertMention('u1', 'Ann', 0);
    expect(editor.getTextWithMentionFormat()).toBe(
      'x<@uid:u1>\u00A0<@uid:u2>\u00A0<@uid:u1>\u00A0'
    );
    expect([...editor.getUniqueMentionUids()]).toEqual(['u1', 'u2']);
    expect(el.querySelector('[data-uid="u2"]')!.getAttribute('data-mention-type')).toBe('self');
  });
});

describe('RichTextEditor — click handling', () => {
  it('reports link clicks with href, text and position, and prevents navigation', () => {
    const onLinkClick = vi.fn();
    const { el } = mountEditor({ onLinkClick }, '<a href="https://example.com/"><b>site</b></a>');
    const a = el.querySelector('a')!;
    vi.spyOn(a, 'getBoundingClientRect').mockReturnValue({
      left: 10,
      top: 20,
    } as DOMRect);
    const evt = new MouseEvent('click', { bubbles: true, cancelable: true });
    el.querySelector('b')!.dispatchEvent(evt);
    expect(onLinkClick).toHaveBeenCalledWith('https://example.com/', 'site', 10, 20);
    expect(evt.defaultPrevented).toBe(true);
  });

  it('ignores clicks outside links', () => {
    const onLinkClick = vi.fn();
    const { el } = mountEditor({ onLinkClick }, '<p>plain</p>');
    const evt = new MouseEvent('click', { bubbles: true, cancelable: true });
    el.querySelector('p')!.dispatchEvent(evt);
    expect(onLinkClick).not.toHaveBeenCalled();
    expect(evt.defaultPrevented).toBe(false);
  });

  it('does not prevent link clicks when no onLinkClick is configured', () => {
    const { el } = mountEditor({}, '<a href="#site">site</a>');
    const evt = new MouseEvent('click', { bubbles: true, cancelable: true });
    el.querySelector('a')!.dispatchEvent(evt);
    expect(evt.defaultPrevented).toBe(false);
  });
});

describe('RichTextEditor — selectionchange → format state', () => {
  function focusAt(el: HTMLElement, node: Node, offset: number) {
    el.focus();
    setCaret(node, offset);
  }

  it('reports inline and block formats at the caret', () => {
    const onSelectionUpdate = vi.fn();
    const { el, editor } = mountEditor(
      { onSelectionUpdate },
      '<blockquote><p><b><i><s>x</s></i></b></p></blockquote>'
    );
    focusAt(el, textNodeOf(el), 1);
    selectionChange();
    expect(onSelectionUpdate).toHaveBeenLastCalledWith({
      ...DEFAULT_FORMAT_STATE,
      bold: true,
      italic: true,
      strikethrough: true,
      blockquote: true,
    });
    expect(editor.getFormatState().bold).toBe(true);
  });

  it('reports lists, code blocks and inline code', () => {
    const onSelectionUpdate = vi.fn();
    const { el } = mountEditor(
      { onSelectionUpdate },
      '<ol><li>a</li></ol><ul><li>b</li></ul><pre><code>c</code></pre><p><code>d</code></p>'
    );
    const [a, b, c, d] = ['li', 'ul li', 'pre code', 'p code'].map(s =>
      textNodeOf(el.querySelector(s)!)
    );
    focusAt(el, a!, 0);
    selectionChange();
    expect(onSelectionUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({ orderedList: true, bulletList: false })
    );
    setCaret(b!, 0);
    selectionChange();
    expect(onSelectionUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({ orderedList: false, bulletList: true })
    );
    setCaret(c!, 0);
    selectionChange();
    expect(onSelectionUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({ codeBlock: true })
    );
    setCaret(d!, 0);
    selectionChange();
    expect(onSelectionUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({ code: true, codeBlock: false })
    );
  });

  it('suppresses the underline false-positive inside a link', () => {
    const onSelectionUpdate = vi.fn();
    const { el } = mountEditor({ onSelectionUpdate }, '<u><a href="https://x.test/">l</a></u>');
    focusAt(el, textNodeOf(el), 0);
    selectionChange();
    expect(onSelectionUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({ link: true, underline: false })
    );
  });

  it('reports underline outside a link', () => {
    const onSelectionUpdate = vi.fn();
    const { el } = mountEditor({ onSelectionUpdate }, '<u>l</u>');
    focusAt(el, textNodeOf(el), 0);
    selectionChange();
    expect(onSelectionUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({ link: false, underline: true })
    );
  });

  it('resets the format state when the caret is inside a mention chip', () => {
    const onSelectionUpdate = vi.fn();
    const { el } = mountEditor(
      { onSelectionUpdate },
      '<b><span contenteditable="false" data-uid="u1">@Ann</span></b>'
    );
    focusAt(el, textNodeOf(el), 1);
    selectionChange();
    expect(onSelectionUpdate).toHaveBeenLastCalledWith(DEFAULT_FORMAT_STATE);
  });

  it('ignores selection changes while the editor is not focused', () => {
    const onSelectionUpdate = vi.fn();
    const { el } = mountEditor({ onSelectionUpdate }, '<b>x</b>');
    setCaret(textNodeOf(el), 0);
    (document.activeElement as HTMLElement | null)?.blur();
    selectionChange();
    expect(onSelectionUpdate).not.toHaveBeenCalled();
  });

  it('ignores a caret outside the editor even when focused', () => {
    const onSelectionUpdate = vi.fn();
    const { el } = mountEditor({ onSelectionUpdate }, '<b>x</b>');
    const outside = document.createElement('p');
    outside.textContent = 'out';
    document.body.appendChild(outside);
    el.focus();
    setCaret(outside.firstChild!, 0);
    selectionChange();
    window.getSelection()!.removeAllRanges();
    selectionChange();
    expect(onSelectionUpdate).not.toHaveBeenCalled();
  });

  it('skips the selection changes caused by applying a format', () => {
    installExecCommand();
    const onSelectionUpdate = vi.fn();
    const { el, editor } = mountEditor({ onSelectionUpdate }, '<b>x</b>');
    focusAt(el, textNodeOf(el), 0);
    editor.applyBold();
    onSelectionUpdate.mockClear();
    selectionChange();
    selectionChange();
    expect(onSelectionUpdate).not.toHaveBeenCalled();
    selectionChange();
    expect(onSelectionUpdate).toHaveBeenCalledTimes(1);
  });
});
