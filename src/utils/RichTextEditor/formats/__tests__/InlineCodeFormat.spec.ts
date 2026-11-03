/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { InlineCodeFormat } from '../InlineCodeFormat';
import type { EditorContext } from '../format.types';

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

function select(startNode: Node, startOffset: number, endNode = startNode, endOffset = startOffset) {
  const range = document.createRange();
  range.setStart(startNode, startOffset);
  range.setEnd(endNode, endOffset);
  const sel = window.getSelection()!;
  sel.removeAllRanges();
  sel.addRange(range);
}

describe('InlineCodeFormat', () => {
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

  const cursor = () => window.getSelection()!.getRangeAt(0);

  it('does nothing without a selection', () => {
    editor.innerHTML = '<p>text</p>';
    window.getSelection()?.removeAllRanges();
    InlineCodeFormat.execute(ctx);
    expect(editor.innerHTML).toBe('<p>text</p>');
    expect(ctx.emitUpdate).not.toHaveBeenCalled();
  });

  it('toggles off: inline code becomes plain text and the cursor goes after it', () => {
    editor.innerHTML = '<p>run <code>npm ci</code> now</p>';
    select(editor.querySelector('code')!.firstChild!, 2);
    InlineCodeFormat.execute(ctx);

    expect(editor.querySelector('code')).toBeNull();
    expect(editor.querySelector('p')?.textContent).toBe('run npm ci now');
    expect(ctx.emitUpdate).toHaveBeenCalled();
  });

  it('with a collapsed cursor in text, inserts an empty code span and puts the cursor inside', () => {
    editor.innerHTML = '<p>hello world</p>';
    select(editor.querySelector('p')!.firstChild!, 5);
    InlineCodeFormat.execute(ctx);

    const code = editor.querySelector('p > code')!;
    expect(code.textContent).toBe('​');
    expect(cursor().startContainer).toBe(code.firstChild);
    expect(cursor().startOffset).toBe(1);
  });

  it('at the editor root after a paragraph, puts the code span inside that paragraph', () => {
    editor.innerHTML = '<p>para</p>';
    select(editor, 1);
    InlineCodeFormat.execute(ctx);
    expect(editor.querySelector('p > code')?.textContent).toBe('​');
    expect(editor.children.length).toBe(1);
  });

  it('at the editor root after a bare text node, puts the code span right after it', () => {
    editor.innerHTML = 'bare';
    select(editor, 1);
    InlineCodeFormat.execute(ctx);
    expect(editor.firstChild?.textContent).toBe('bare');
    expect((editor.childNodes[1] as Element).tagName).toBe('CODE');
  });

  it('in an empty editor, inserts the code span at the cursor', () => {
    editor.innerHTML = '';
    select(editor, 0);
    InlineCodeFormat.execute(ctx);
    expect(editor.querySelector('code')?.textContent).toBe('​');
  });

  it('wraps a selection inside one block in a single code span', () => {
    editor.innerHTML = '<p>call foo() here</p>';
    const text = editor.querySelector('p')!.firstChild!;
    select(text, 5, text, 10);
    InlineCodeFormat.execute(ctx);

    expect(editor.querySelector('code')?.textContent).toBe('foo()');
    expect(editor.querySelector('p')?.textContent).toBe('call foo() here');
    expect(cursor().collapsed).toBe(true);
  });

  it('still wraps a selection that cuts across inline tags', () => {
    editor.innerHTML = '<p>plain <b>bold</b> tail</p>';
    const p = editor.querySelector('p')!;
    select(p.firstChild!, 2, editor.querySelector('b')!.firstChild!, 2);
    InlineCodeFormat.execute(ctx);

    expect(editor.querySelector('code')?.textContent).toBe('ain bo');
    expect(p.textContent).toBe('plain bold tail');
  });

  it('across list items, wraps each item separately and keeps the list', () => {
    editor.innerHTML = '<ul><li>alpha</li><li>beta</li><li>gamma</li></ul>';
    const items = editor.querySelectorAll('li');
    select(items[0]!.firstChild!, 2, items[2]!.firstChild!, 3);
    InlineCodeFormat.execute(ctx);

    expect(Array.from(editor.querySelectorAll('li')).length).toBe(3);
    expect(Array.from(editor.querySelectorAll('code')).map(c => c.textContent)).toEqual(['pha', 'beta', 'gam']);
    expect(Array.from(editor.querySelectorAll('li')).map(li => li.textContent)).toEqual(['alpha', 'beta', 'gamma']);
    expect(ctx.emitUpdate).toHaveBeenCalled();
  });

  it('is active inside inline code, but not inside a code block', () => {
    editor.innerHTML = '<p><code>inline</code></p><pre><code>block</code></pre>';
    const [inline, block] = Array.from(editor.querySelectorAll('code'));
    expect(InlineCodeFormat.isActive(inline!.firstChild!, ctx)).toBe(true);
    expect(InlineCodeFormat.isActive(block!.firstChild!, ctx)).toBe(false);
  });
});
