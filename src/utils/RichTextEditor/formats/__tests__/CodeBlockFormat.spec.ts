/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CodeBlockFormat } from '../CodeBlockFormat';
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

describe('CodeBlockFormat', () => {
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

  const codeText = () => editor.querySelector('pre > code')?.textContent;

  it('does nothing without a selection', () => {
    editor.innerHTML = '<p>text</p>';
    window.getSelection()?.removeAllRanges();
    CodeBlockFormat.execute(ctx);
    expect(editor.innerHTML).toBe('<p>text</p>');
    expect(ctx.emitUpdate).not.toHaveBeenCalled();
  });

  it('toggles off: a code block becomes one paragraph per line', () => {
    editor.innerHTML = '<pre><code>first\n\nthird</code></pre>';
    select(editor.querySelector('code')!.firstChild!, 2);
    CodeBlockFormat.execute(ctx);

    expect(editor.querySelector('pre')).toBeNull();
    const paragraphs = Array.from(editor.querySelectorAll('p')).map(p => p.textContent);
    expect(paragraphs).toEqual(['first', '​', 'third']);
    expect(window.getSelection()?.anchorNode).toBe(editor.lastElementChild);
    expect(ctx.emitUpdate).toHaveBeenCalled();
  });

  it('converts a list into a code block in the same place, one line per item', () => {
    editor.innerHTML = '<p>before</p><ul><li>a</li><li>b​</li></ul><p>after</p>';
    select(editor.querySelector('li')!.firstChild!, 1);
    CodeBlockFormat.execute(ctx);

    expect(editor.querySelector('ul')).toBeNull();
    expect(codeText()).toBe('a\nb');
    expect(Array.from(editor.children).map(c => c.tagName)).toEqual(['P', 'PRE', 'P']);
  });

  it('converts a blockquote into a code block in the same place', () => {
    editor.innerHTML = '<blockquote>quoted​ text</blockquote><p>after</p>';
    select(editor.querySelector('blockquote')!.firstChild!, 2);
    CodeBlockFormat.execute(ctx);

    expect(editor.querySelector('blockquote')).toBeNull();
    expect(codeText()).toBe('quoted text');
    expect(editor.firstElementChild?.tagName).toBe('PRE');
  });

  it('with a collapsed cursor, wraps the whole current paragraph', () => {
    editor.innerHTML = '<p>keep</p><p>wrap me</p>';
    select(editor.querySelectorAll('p')[1]!.firstChild!, 3);
    CodeBlockFormat.execute(ctx);

    expect(Array.from(editor.children).map(c => c.tagName)).toEqual(['P', 'PRE']);
    expect(codeText()).toBe('wrap me');
    expect(window.getSelection()?.anchorNode).toBe(editor.querySelector('code'));
  });

  it('with a collapsed cursor at the root, wraps all content and keeps line breaks', () => {
    editor.innerHTML = 'one<br>two<div>three</div>';
    select(editor.firstChild!, 1);
    CodeBlockFormat.execute(ctx);

    expect(codeText()).toBe('one\ntwo\nthree');
    expect(editor.children.length).toBe(1);
  });

  it('wraps a selection across paragraphs as plain text, dropping inline formatting', () => {
    editor.innerHTML = '<p>one <b>bold</b></p><p>two</p>';
    const [p1, p2] = Array.from(editor.querySelectorAll('p'));
    select(p1!.firstChild!, 0, p2!.firstChild!, 3);
    CodeBlockFormat.execute(ctx);

    expect(codeText()).toBe('one bold\ntwo');
    expect(editor.querySelector('pre b, pre strong')).toBeNull();
  });

  it('never leaves the code block inside inline formatting', () => {
    editor.innerHTML = '<p><b><i>styled</i></b></p>';
    const text = editor.querySelector('i')!.firstChild!;
    select(text, 0, text, 6);
    CodeBlockFormat.execute(ctx);

    const pre = editor.querySelector('pre')!;
    expect(pre.closest('b, i')).toBeNull();
    expect(codeText()).toBe('styled');
  });

  it('gives an empty paragraph a zero-width placeholder so the cursor has somewhere to go', () => {
    editor.innerHTML = '<p></p>';
    select(editor.querySelector('p')!, 0);
    CodeBlockFormat.execute(ctx);
    expect(codeText()).toBe('​');
  });

  it('is active only inside a code block', () => {
    editor.innerHTML = '<pre><code>x</code></pre><p>y</p>';
    expect(CodeBlockFormat.isActive(editor.querySelector('code')!.firstChild!, ctx)).toBe(true);
    expect(CodeBlockFormat.isActive(editor.querySelector('p')!.firstChild!, ctx)).toBe(false);
  });
});
