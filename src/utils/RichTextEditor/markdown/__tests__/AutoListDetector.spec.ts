/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { detectAndConvertAutoList } from '../AutoListDetector';
import type { EditorContext } from '../../formats/format.types';

function createMockCtx(element: HTMLDivElement): EditorContext {
  const findAncestor = (node: Node | null, tag: string): Node | null => {
    let current: Node | null = node;
    while (current && current !== element) {
      if (current.nodeType === Node.ELEMENT_NODE && (current as Element).tagName === tag) return current;
      current = current.parentNode;
    }
    return null;
  };
  return {
    element,
    focus: vi.fn(),
    execCommand: vi.fn(),
    getDocument: () => document,
    getWindow: () => window,
    markFormattingApplied: vi.fn(),
    updateFormatState: vi.fn(),
    pushHistory: vi.fn(),
    emitUpdate: vi.fn(),
    hasAncestor: (node: Node | null, tag: string) => findAncestor(node, tag) !== null,
    findAncestor,
  } as unknown as EditorContext;
}

function caret(node: Node, offset: number) {
  const range = document.createRange();
  range.setStart(node, offset);
  range.collapse(true);
  const sel = window.getSelection()!;
  sel.removeAllRanges();
  sel.addRange(range);
}

/** Put the caret at the end of the paragraph's text — where the user just typed the prefix. */
function typedIn(p: Element) {
  const text = p.lastChild!;
  caret(text, text.textContent!.length);
}

describe('detectAndConvertAutoList', () => {
  let editor: HTMLDivElement;
  let ctx: EditorContext;

  beforeEach(() => {
    editor = document.createElement('div');
    editor.contentEditable = 'true';
    document.body.appendChild(editor);
    ctx = createMockCtx(editor);
  });

  afterEach(() => {
    window.getSelection()?.removeAllRanges();
    editor.remove();
  });

  function expectConverted() {
    expect(ctx.markFormattingApplied).toHaveBeenCalled();
    expect(ctx.updateFormatState).toHaveBeenCalled();
    expect(ctx.pushHistory).toHaveBeenCalled();
    expect(ctx.emitUpdate).toHaveBeenCalled();
  }

  describe('does nothing when', () => {
    it('there is no selection', () => {
      window.getSelection()?.removeAllRanges();
      expect(detectAndConvertAutoList(ctx)).toBe(false);
    });

    it('text is selected rather than a caret', () => {
      editor.innerHTML = '<p>1.</p>';
      const text = editor.querySelector('p')!.firstChild!;
      const range = document.createRange();
      range.setStart(text, 0);
      range.setEnd(text, 2);
      window.getSelection()!.removeAllRanges();
      window.getSelection()!.addRange(range);
      expect(detectAndConvertAutoList(ctx)).toBe(false);
    });

    it('the caret is not in a text node', () => {
      editor.innerHTML = '<p>1.</p>';
      caret(editor.querySelector('p')!, 1);
      expect(detectAndConvertAutoList(ctx)).toBe(false);
    });

    it('the caret is already in a list', () => {
      editor.innerHTML = '<ul><li>-</li></ul>';
      typedIn(editor.querySelector('li')!);
      expect(detectAndConvertAutoList(ctx)).toBe(false);
    });

    it('the text is not one of the patterns', () => {
      editor.innerHTML = '<p>abc</p>';
      typedIn(editor.querySelector('p')!);
      expect(detectAndConvertAutoList(ctx)).toBe(false);
      expect(ctx.markFormattingApplied).not.toHaveBeenCalled();
    });

    it('the prefix is not at the start of the line', () => {
      editor.innerHTML = '<p><b>bold</b>-</p>';
      typedIn(editor.querySelector('p')!);
      expect(detectAndConvertAutoList(ctx)).toBe(false);
    });

    it('">" is typed inside a quote', () => {
      editor.innerHTML = '<blockquote><p>&gt;</p></blockquote>';
      typedIn(editor.querySelector('p')!);
      expect(detectAndConvertAutoList(ctx)).toBe(false);
    });

    it('"```" is typed inside a code block', () => {
      editor.innerHTML = '<pre><code>```</code></pre>';
      typedIn(editor.querySelector('code')!);
      expect(detectAndConvertAutoList(ctx)).toBe(false);
    });
  });

  it('"1." starts a numbered list and removes the prefix', () => {
    editor.innerHTML = '<p>1.</p>';
    typedIn(editor.querySelector('p')!);
    expect(detectAndConvertAutoList(ctx)).toBe(true);
    expect(ctx.execCommand).toHaveBeenCalledWith('insertOrderedList');
    expect(editor.querySelector('p')?.textContent).toBe('');
    expectConverted();
  });

  // Known issue: the split case is read correctly ("1" + "."), but isAtStartOfBlock then
  // counts the "1" as text before the caret and rejects it. `it.fails` passes while the
  // issue is there and fails as soon as this is fixed — then change it back to `it`.
  it.fails('"1." split across two text nodes still counts, and both parts are removed', () => {
    const p = document.createElement('p');
    p.append(document.createTextNode('1'), document.createTextNode('.'));
    editor.appendChild(p);
    typedIn(p);
    expect(detectAndConvertAutoList(ctx)).toBe(true);
    expect(ctx.execCommand).toHaveBeenCalledWith('insertOrderedList');
    expect(p.textContent).toBe('');
  });

  it.each(['-', '*'])('"%s" starts a bullet list', prefix => {
    editor.innerHTML = `<p>${prefix}</p>`;
    typedIn(editor.querySelector('p')!);
    expect(detectAndConvertAutoList(ctx)).toBe(true);
    expect(ctx.execCommand).toHaveBeenCalledWith('insertUnorderedList');
    expectConverted();
  });

  it('">" wraps the current paragraph in a quote', () => {
    editor.innerHTML = '<p>&gt;</p>';
    typedIn(editor.querySelector('p')!);
    expect(detectAndConvertAutoList(ctx)).toBe(true);

    const bq = editor.querySelector('blockquote')!;
    expect(bq.querySelector('p')).not.toBeNull();
    expect(bq.textContent).toBe('');
    expect(window.getSelection()?.anchorNode).toBe(bq.querySelector('p'));
    expectConverted();
  });

  it('">" typed directly in the editor wraps that text in a quoted paragraph', () => {
    editor.innerHTML = '&gt;';
    caret(editor.firstChild!, 1);
    expect(detectAndConvertAutoList(ctx)).toBe(true);
    expect(editor.querySelector('blockquote > p')).not.toBeNull();
  });

  it('"```" replaces an empty paragraph with a code block, caret inside', () => {
    editor.innerHTML = '<p>```</p>';
    typedIn(editor.querySelector('p')!);
    expect(detectAndConvertAutoList(ctx)).toBe(true);

    expect(editor.querySelector('p')).toBeNull();
    const code = editor.querySelector('pre > code')!;
    expect(code.textContent).toBe('​');
    expect(window.getSelection()?.anchorNode).toBe(code.firstChild);
    expectConverted();
  });

  it('"```" typed directly in the editor inserts a code block at the caret', () => {
    editor.innerHTML = '```';
    caret(editor.firstChild!, 3);
    expect(detectAndConvertAutoList(ctx)).toBe(true);
    expect(editor.querySelector('pre > code')).not.toBeNull();
  });
});
