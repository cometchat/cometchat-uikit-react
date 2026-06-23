import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  removeCodeBlockIfActive,
  removeBlockquoteIfActive,
  removeListIfActive,
} from '../blockUtils';
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
    hasAncestor: vi.fn().mockReturnValue(false),
    findAncestor: (node: Node, tag: string) => {
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

describe('blockUtils', () => {
  let editor: HTMLDivElement;

  beforeEach(() => {
    editor = document.createElement('div');
    editor.contentEditable = 'true';
    document.body.appendChild(editor);
  });

  afterEach(() => {
    document.body.removeChild(editor);
  });

  function setCursorInside(element: Node) {
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    const sel = window.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(range);
  }

  describe('removeCodeBlockIfActive', () => {
    it('should return false when no <pre> is present', () => {
      editor.innerHTML = '<p>hello</p>';
      setCursorInside(editor.querySelector('p')!);
      const ctx = createMockCtx(editor);
      expect(removeCodeBlockIfActive(ctx)).toBe(false);
    });

    it('should remove <pre> and replace with <p> elements', () => {
      editor.innerHTML = '<pre><code>line1\nline2</code></pre>';
      const pre = editor.querySelector('pre')!;
      setCursorInside(pre);
      const ctx = createMockCtx(editor);

      const result = removeCodeBlockIfActive(ctx);
      expect(result).toBe(true);
      expect(editor.querySelector('pre')).toBeNull();
      const paragraphs = editor.querySelectorAll('p');
      expect(paragraphs.length).toBe(2);
      expect(paragraphs[0]!.textContent).toBe('line1');
      expect(paragraphs[1]!.textContent).toBe('line2');
    });

    it('should return false when no selection', () => {
      editor.innerHTML = '<pre><code>code</code></pre>';
      // Don't set any selection
      window.getSelection()?.removeAllRanges();
      const ctx = createMockCtx(editor);
      expect(removeCodeBlockIfActive(ctx)).toBe(false);
    });
  });

  describe('removeBlockquoteIfActive', () => {
    it('should return false when no <blockquote> is present', () => {
      editor.innerHTML = '<p>hello</p>';
      setCursorInside(editor.querySelector('p')!);
      const ctx = createMockCtx(editor);
      expect(removeBlockquoteIfActive(ctx)).toBe(false);
    });

    it('should remove <blockquote> and keep children', () => {
      editor.innerHTML = '<blockquote><p>quoted text</p></blockquote>';
      const bq = editor.querySelector('blockquote')!;
      setCursorInside(bq);
      const ctx = createMockCtx(editor);

      const result = removeBlockquoteIfActive(ctx);
      expect(result).toBe(true);
      expect(editor.querySelector('blockquote')).toBeNull();
      expect(editor.querySelector('p')?.textContent).toBe('quoted text');
    });

    it('should return false when no selection', () => {
      editor.innerHTML = '<blockquote><p>text</p></blockquote>';
      window.getSelection()?.removeAllRanges();
      const ctx = createMockCtx(editor);
      expect(removeBlockquoteIfActive(ctx)).toBe(false);
    });
  });

  describe('removeListIfActive', () => {
    it('should return false when no list is present', () => {
      editor.innerHTML = '<p>hello</p>';
      setCursorInside(editor.querySelector('p')!);
      const ctx = createMockCtx(editor);
      expect(removeListIfActive(ctx)).toBe(false);
    });

    it('should remove <ol> and convert items to <p>', () => {
      editor.innerHTML = '<ol><li>first</li><li>second</li></ol>';
      const li = editor.querySelector('li')!;
      setCursorInside(li);
      const ctx = createMockCtx(editor);

      const result = removeListIfActive(ctx);
      expect(result).toBe(true);
      expect(editor.querySelector('ol')).toBeNull();
      const paragraphs = editor.querySelectorAll('p');
      expect(paragraphs.length).toBe(2);
      expect(paragraphs[0]!.textContent).toBe('first');
      expect(paragraphs[1]!.textContent).toBe('second');
    });

    it('should remove <ul> and convert items to <p>', () => {
      editor.innerHTML = '<ul><li>apple</li><li>banana</li></ul>';
      const li = editor.querySelector('li')!;
      setCursorInside(li);
      const ctx = createMockCtx(editor);

      const result = removeListIfActive(ctx);
      expect(result).toBe(true);
      expect(editor.querySelector('ul')).toBeNull();
      const paragraphs = editor.querySelectorAll('p');
      expect(paragraphs.length).toBe(2);
    });

    it('should return false when no selection', () => {
      editor.innerHTML = '<ul><li>item</li></ul>';
      window.getSelection()?.removeAllRanges();
      const ctx = createMockCtx(editor);
      expect(removeListIfActive(ctx)).toBe(false);
    });
  });
});
