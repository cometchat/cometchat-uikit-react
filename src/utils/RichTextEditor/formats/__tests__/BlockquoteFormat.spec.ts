/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BlockquoteFormat } from '../BlockquoteFormat';
import type { EditorContext } from '../format.types';

function createMockCtx(element: HTMLElement): EditorContext {
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
    hasAncestor: (node: Node | null, tag: string): boolean => {
      let current: Node | null = node;
      while (current && current !== element) {
        if (current.nodeType === Node.ELEMENT_NODE && (current as Element).tagName === tag) {
          return true;
        }
        current = current.parentNode;
      }
      return false;
    },
    findAncestor: (node: Node | null, tag: string) => {
      let current: Node | null = node;
      while (current && current !== element) {
        if (current.nodeType === Node.ELEMENT_NODE && (current as Element).tagName === tag) {
          return current;
        }
        current = current.parentNode;
      }
      return null;
    },
  } as unknown as EditorContext;
}

describe('BlockquoteFormat', () => {
  let editor: HTMLDivElement;

  beforeEach(() => {
    editor = document.createElement('div');
    editor.contentEditable = 'true';
    document.body.appendChild(editor);
  });

  afterEach(() => {
    window.getSelection()?.removeAllRanges();
    if (editor.parentNode) document.body.removeChild(editor);
  });

  function setCursorInside(element: Node, collapseToEnd = true) {
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(!collapseToEnd ? true : false);
    const sel = window.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(range);
    return range;
  }

  function selectNodeContents(element: Node) {
    const range = document.createRange();
    range.selectNodeContents(element);
    const sel = window.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(range);
    return range;
  }

  describe('metadata', () => {
    it('should have id "blockquote"', () => {
      expect(BlockquoteFormat.id).toBe('blockquote');
    });

    it('should have name "Blockquote"', () => {
      expect(BlockquoteFormat.name).toBe('Blockquote');
    });
  });

  describe('isActive', () => {
    it('should return true when node is inside a blockquote', () => {
      editor.innerHTML = '<blockquote><p>quoted</p></blockquote>';
      const ctx = createMockCtx(editor);
      const p = editor.querySelector('p')!;
      expect(BlockquoteFormat.isActive(p, ctx)).toBe(true);
    });

    it('should return false when node is not inside a blockquote', () => {
      editor.innerHTML = '<p>plain</p>';
      const ctx = createMockCtx(editor);
      const p = editor.querySelector('p')!;
      expect(BlockquoteFormat.isActive(p, ctx)).toBe(false);
    });
  });

  describe('execute - no selection', () => {
    it('should do nothing when there is no selection range', () => {
      editor.innerHTML = '<p>hello</p>';
      window.getSelection()?.removeAllRanges();
      const ctx = createMockCtx(editor);

      BlockquoteFormat.execute(ctx);

      expect(editor.querySelector('blockquote')).toBeNull();
      expect(ctx.markFormattingApplied).not.toHaveBeenCalled();
      expect(ctx.emitUpdate).not.toHaveBeenCalled();
    });
  });

  describe('execute - toggle off', () => {
    it('should unwrap content when already inside a blockquote', () => {
      editor.innerHTML = '<blockquote><p>quoted text</p></blockquote>';
      const p = editor.querySelector('p')!;
      setCursorInside(p);
      const ctx = createMockCtx(editor);

      BlockquoteFormat.execute(ctx);

      expect(editor.querySelector('blockquote')).toBeNull();
      expect(editor.querySelector('p')?.textContent).toBe('quoted text');
      expect(ctx.markFormattingApplied).toHaveBeenCalled();
      expect(ctx.updateFormatState).toHaveBeenCalled();
      expect(ctx.pushHistory).toHaveBeenCalled();
      expect(ctx.emitUpdate).toHaveBeenCalled();
    });

    it('should move all children out of the blockquote on unwrap', () => {
      editor.innerHTML = '<blockquote><p>a</p><p>b</p></blockquote>';
      const firstP = editor.querySelector('p')!;
      setCursorInside(firstP);
      const ctx = createMockCtx(editor);

      BlockquoteFormat.execute(ctx);

      expect(editor.querySelector('blockquote')).toBeNull();
      const ps = editor.querySelectorAll('p');
      expect(ps.length).toBe(2);
      expect(ps[0]!.textContent).toBe('a');
      expect(ps[1]!.textContent).toBe('b');
    });
  });

  describe('execute - wrap selected (non-collapsed) range', () => {
    it('should wrap the selected content in a blockquote', () => {
      editor.innerHTML = '<span>selected text</span>';
      selectNodeContents(editor.querySelector('span')!);
      const ctx = createMockCtx(editor);

      BlockquoteFormat.execute(ctx);

      const bq = editor.querySelector('blockquote');
      expect(bq).not.toBeNull();
      expect(bq!.textContent).toContain('selected text');
      expect(ctx.emitUpdate).toHaveBeenCalled();
    });
  });

  describe('execute - wrap from an active code block', () => {
    it('should convert a <pre> code block into a blockquote with <p> per line', () => {
      editor.innerHTML = '<pre><code>line1\nline2</code></pre>';
      const pre = editor.querySelector('pre')!;
      setCursorInside(pre);
      const ctx = createMockCtx(editor);

      BlockquoteFormat.execute(ctx);

      expect(editor.querySelector('pre')).toBeNull();
      const bq = editor.querySelector('blockquote')!;
      expect(bq).not.toBeNull();
      const ps = bq.querySelectorAll('p');
      expect(ps.length).toBe(2);
      expect(ps[0]!.textContent).toBe('line1');
      expect(ps[1]!.textContent).toBe('line2');
    });

    it('should strip zero-width spaces from captured code text', () => {
      editor.innerHTML = '<pre><code>​hello​</code></pre>';
      const pre = editor.querySelector('pre')!;
      setCursorInside(pre);
      const ctx = createMockCtx(editor);

      BlockquoteFormat.execute(ctx);

      const bq = editor.querySelector('blockquote')!;
      expect(bq.textContent).toBe('hello');
    });

    it('should produce a single zero-width-space paragraph for an empty code block', () => {
      editor.innerHTML = '<pre><code></code></pre>';
      const pre = editor.querySelector('pre')!;
      setCursorInside(pre);
      const ctx = createMockCtx(editor);

      BlockquoteFormat.execute(ctx);

      const bq = editor.querySelector('blockquote')!;
      const ps = bq.querySelectorAll('p');
      expect(ps.length).toBe(1);
      expect(ps[0]!.textContent).toBe('​');
    });
  });

  describe('execute - wrap a block element (collapsed in a div/p)', () => {
    it('should wrap a direct-child block element of the editor', () => {
      editor.innerHTML = '<div>block content</div>';
      const block = editor.querySelector('div')!;
      setCursorInside(block);
      const ctx = createMockCtx(editor);

      BlockquoteFormat.execute(ctx);

      const bq = editor.querySelector('blockquote')!;
      expect(bq).not.toBeNull();
      expect(bq.querySelector('div')?.textContent).toBe('block content');
    });

    it('should wrap an entire list when caret is inside a list', () => {
      editor.innerHTML = '<ul><li>one</li><li>two</li></ul>';
      const li = editor.querySelector('li')!;
      setCursorInside(li);
      const ctx = createMockCtx(editor);

      BlockquoteFormat.execute(ctx);

      const bq = editor.querySelector('blockquote')!;
      expect(bq).not.toBeNull();
      expect(bq.querySelector('ul')).not.toBeNull();
      expect(bq.querySelectorAll('li').length).toBe(2);
    });
  });

  describe('execute - wrap flat line nodes (collectCurrentLineNodes)', () => {
    it('should wrap flat text nodes on the current line', () => {
      editor.innerHTML = 'hello world';
      const textNode = editor.firstChild!;
      setCursorInside(textNode);
      const ctx = createMockCtx(editor);

      BlockquoteFormat.execute(ctx);

      const bq = editor.querySelector('blockquote')!;
      expect(bq).not.toBeNull();
      expect(bq.textContent).toContain('hello world');
    });

    it('should bound the line at a <br> separator', () => {
      editor.innerHTML = 'first<br>second';
      // place caret in the "second" text node (after the <br>)
      const secondText = editor.childNodes[2]!;
      setCursorInside(secondText);
      const ctx = createMockCtx(editor);

      BlockquoteFormat.execute(ctx);

      const bq = editor.querySelector('blockquote')!;
      expect(bq).not.toBeNull();
      expect(bq.textContent).toContain('second');
      expect(bq.textContent).not.toContain('first');
    });

    it('should collect multiple flat nodes on a line and stop at a block boundary', () => {
      // multiple inline nodes then a DIV boundary; caret in the last inline node
      editor.innerHTML = 'a<b>bold</b>c<div>blockafter</div>';
      const cNode = editor.childNodes[2]!; // the "c" text node
      setCursorInside(cNode);
      const ctx = createMockCtx(editor);

      BlockquoteFormat.execute(ctx);

      const bq = editor.querySelector('blockquote')!;
      expect(bq).not.toBeNull();
      // line nodes "a", <b>bold</b>, "c" wrapped; the trailing DIV is excluded
      expect(bq.textContent).toContain('a');
      expect(bq.textContent).toContain('bold');
      expect(bq.textContent).toContain('c');
      expect(bq.textContent).not.toContain('blockafter');
    });

    it('should walk backward past inline siblings to the line start', () => {
      editor.innerHTML = '<br>start<b>mid</b>end';
      // caret in "end" (last node); should collect back to "start" but stop at <br>
      const endNode = editor.childNodes[3]!;
      setCursorInside(endNode);
      const ctx = createMockCtx(editor);

      BlockquoteFormat.execute(ctx);

      const bq = editor.querySelector('blockquote')!;
      expect(bq.textContent).toContain('start');
      expect(bq.textContent).toContain('mid');
      expect(bq.textContent).toContain('end');
    });

    it('should insert an empty blockquote when no line nodes are found', () => {
      // empty editor: caret in editor itself with no children
      editor.innerHTML = '';
      const range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(true);
      const sel = window.getSelection()!;
      sel.removeAllRanges();
      sel.addRange(range);
      const ctx = createMockCtx(editor);

      BlockquoteFormat.execute(ctx);

      const bq = editor.querySelector('blockquote')!;
      expect(bq).not.toBeNull();
      expect(bq.innerHTML).toBe('<br>');
    });
  });

  describe('execute - cursor placement and callbacks', () => {
    it('should place the selection inside the new blockquote and fire callbacks', () => {
      editor.innerHTML = '<div>content</div>';
      setCursorInside(editor.querySelector('div')!);
      const ctx = createMockCtx(editor);

      BlockquoteFormat.execute(ctx);

      const sel = window.getSelection()!;
      expect(sel.rangeCount).toBeGreaterThan(0);
      const bq = editor.querySelector('blockquote')!;
      // the new range should be within the blockquote
      expect(bq.contains(sel.getRangeAt(0).startContainer)).toBe(true);
      expect(ctx.markFormattingApplied).toHaveBeenCalled();
      expect(ctx.pushHistory).toHaveBeenCalled();
      expect(ctx.emitUpdate).toHaveBeenCalled();
    });
  });
});
