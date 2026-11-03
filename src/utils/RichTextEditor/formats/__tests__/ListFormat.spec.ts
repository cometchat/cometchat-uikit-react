/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  applyListStyles,
  BulletListFormat,
  fixOrderedListContinuation,
  handleListEnter,
  handleListIndent,
  handleListOutdent,
  OrderedListFormat,
} from '../ListFormat';
import type { EditorContext } from '../format.types';

function findAncestorIn(element: HTMLElement) {
  return (node: Node | null, tag: string): Node | null => {
    let current: Node | null = node;
    while (current && current !== element) {
      if (current.nodeType === Node.ELEMENT_NODE && (current as Element).tagName === tag) return current;
      current = current.parentNode;
    }
    return null;
  };
}

function createMockCtx(element: HTMLDivElement): EditorContext {
  const findAncestor = findAncestorIn(element);
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

function keyEvent(): KeyboardEvent {
  return new KeyboardEvent('keydown', { key: 'Tab', cancelable: true });
}

function placeCursor(node: Node, offset?: number) {
  const range = document.createRange();
  if (offset === undefined) {
    range.selectNodeContents(node);
    range.collapse(false);
  } else {
    range.setStart(node, offset);
    range.collapse(true);
  }
  const sel = window.getSelection()!;
  sel.removeAllRanges();
  sel.addRange(range);
}

function expectFinalised(ctx: EditorContext) {
  expect(ctx.markFormattingApplied).toHaveBeenCalled();
  expect(ctx.updateFormatState).toHaveBeenCalled();
  expect(ctx.pushHistory).toHaveBeenCalled();
  expect(ctx.emitUpdate).toHaveBeenCalled();
}

describe('ListFormat', () => {
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
    vi.restoreAllMocks();
  });

  describe('fixOrderedListContinuation', () => {
    it('continues numbering across an unordered list and resets after other content', () => {
      editor.innerHTML =
        '<ol><li>a</li><li>b</li></ol><ul><li>x</li></ul><ol><li>c</li></ol><p>break</p><ol><li>d</li></ol>';
      fixOrderedListContinuation(editor);
      const ols = editor.querySelectorAll(':scope > ol');
      expect((ols[0] as HTMLOListElement).start).toBe(1);
      expect((ols[1] as HTMLOListElement).start).toBe(3);
      expect((ols[2] as HTMLOListElement).start).toBe(1);
    });
  });

  describe('applyListStyles', () => {
    it('styles lists by depth and flattens wrapper elements inside items', () => {
      editor.innerHTML = '<ol><li><div>top</div><ol><li>nested</li></ol></li></ol><ul><li>a<ul><li>b</li></ul></li></ul>';
      applyListStyles(editor);

      const [outerOl, innerOl] = Array.from(editor.querySelectorAll('ol')) as [HTMLOListElement, HTMLOListElement];
      expect(outerOl.style.listStyleType).toBe('decimal');
      expect(outerOl.style.paddingLeft).toBe('0px');
      expect(innerOl.style.listStyleType).toBe('lower-alpha');
      expect(innerOl.style.paddingLeft).toBe('1.5em');

      const [outerUl, innerUl] = Array.from(editor.querySelectorAll('ul')) as [HTMLUListElement, HTMLUListElement];
      expect(outerUl.style.listStyleType).toBe('disc');
      expect(innerUl.style.listStyleType).toBe('circle');

      const wrapper = editor.querySelector<HTMLElement>('li > div')!;
      expect(wrapper.style.display).toBe('inline');
      editor.querySelectorAll('li').forEach(li => expect((li as HTMLElement).style.display).toBe('list-item'));
    });
  });

  describe('handleListIndent', () => {
    it('ignores the key outside a list', () => {
      editor.innerHTML = '<p>text</p>';
      placeCursor(editor.querySelector('p')!);
      expect(handleListIndent(keyEvent(), ctx)).toBe(false);
    });

    it('does not indent the first item (nothing to nest under)', () => {
      editor.innerHTML = '<ol><li>first</li><li>second</li></ol>';
      placeCursor(editor.querySelector('li')!);
      expect(handleListIndent(keyEvent(), ctx)).toBe(false);
    });

    it('nests an item under its previous sibling, reusing an existing nested list', () => {
      editor.innerHTML = '<ol><li>one<ol><li>one-a</li></ol></li><li>two</li></ol>';
      const two = editor.querySelectorAll(':scope > ol > li')[1]!;
      placeCursor(two);
      const e = keyEvent();

      expect(handleListIndent(e, ctx)).toBe(true);
      expect(e.defaultPrevented).toBe(true);
      const nested = editor.querySelector('ol > li > ol')!;
      expect(Array.from(nested.children).map(li => li.textContent)).toEqual(['one-a', 'two']);
      expect(editor.querySelectorAll('ol > li > ol').length).toBe(1);
      expectFinalised(ctx);
    });

    it('creates a nested list when the previous item has none', () => {
      editor.innerHTML = '<ul><li>one</li><li>two</li></ul>';
      placeCursor(editor.querySelectorAll('li')[1]!);
      expect(handleListIndent(keyEvent(), ctx)).toBe(true);
      expect(editor.querySelector('ul > li > ul > li')?.textContent).toBe('two');
    });
  });

  describe('handleListOutdent', () => {
    it('ignores a top-level item', () => {
      editor.innerHTML = '<ol><li>one</li></ol>';
      placeCursor(editor.querySelector('li')!);
      expect(handleListOutdent(keyEvent(), ctx)).toBe(false);
    });

    it('moves a nested item up a level and keeps following siblings nested under it', () => {
      editor.innerHTML = '<ol><li>parent<ol><li>a</li><li>b</li><li>c</li></ol></li></ol>';
      const b = Array.from(editor.querySelectorAll('li')).find(li => li.firstChild?.textContent === 'b')!;
      placeCursor(b);
      const e = keyEvent();

      expect(handleListOutdent(e, ctx)).toBe(true);
      expect(e.defaultPrevented).toBe(true);
      const top = Array.from(editor.querySelectorAll(':scope > ol > li'));
      expect(top.map(li => li.firstChild?.textContent)).toEqual(['parent', 'b']);
      // "a" stays nested under parent; "c" becomes nested under the moved "b".
      expect(top[0]!.querySelector('ol > li')?.textContent).toBe('a');
      expect(top[1]!.querySelector('ol > li')?.textContent).toBe('c');
      expectFinalised(ctx);
    });

    it('removes the nested list once it is empty', () => {
      editor.innerHTML = '<ul><li>parent<ul><li>only</li></ul></li></ul>';
      placeCursor(editor.querySelector('ul ul li')!);
      expect(handleListOutdent(keyEvent(), ctx)).toBe(true);
      expect(editor.querySelectorAll('ul ul').length).toBe(0);
      expect(editor.querySelectorAll(':scope > ul > li').length).toBe(2);
    });
  });

  describe('handleListEnter', () => {
    it('ignores Enter outside a list', () => {
      editor.innerHTML = '<p>text</p>';
      placeCursor(editor.querySelector('p')!);
      expect(handleListEnter(keyEvent(), ctx)).toBe(false);
    });

    it('on an empty item, exits the list with a paragraph after it', () => {
      editor.innerHTML = '<ol><li>keep</li><li>​</li></ol>';
      placeCursor(editor.querySelectorAll('li')[1]!);
      expect(handleListEnter(keyEvent(), ctx)).toBe(true);

      expect(editor.querySelectorAll('li').length).toBe(1);
      expect(editor.lastElementChild?.tagName).toBe('P');
      expect(window.getSelection()?.anchorNode).toBe(editor.lastElementChild);
      expectFinalised(ctx);
    });

    it('on the only empty item, replaces the list with a paragraph', () => {
      editor.innerHTML = '<ul><li><br></li></ul>';
      placeCursor(editor.querySelector('li')!);
      expect(handleListEnter(keyEvent(), ctx)).toBe(true);
      expect(editor.querySelector('ul')).toBeNull();
      expect(editor.innerHTML).toBe('<p><br></p>');
    });

    it('on a non-empty item, asks the browser for a new item', () => {
      editor.innerHTML = '<ol><li>text</li></ol>';
      placeCursor(editor.querySelector('li')!);
      expect(handleListEnter(keyEvent(), ctx)).toBe(true);
      expect(ctx.execCommand).toHaveBeenCalledWith('insertParagraph');
    });
  });

  describe.each([
    ['OrderedListFormat', OrderedListFormat, 'OL', 'insertOrderedList'],
    ['BulletListFormat', BulletListFormat, 'UL', 'insertUnorderedList'],
  ] as const)('%s', (_name, format, tag, command) => {
    let execCommand: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      // jsdom has no execCommand; returning false exercises the manual fallback.
      execCommand = vi.fn(() => false);
      (document as unknown as { execCommand: typeof execCommand }).execCommand = execCommand;
    });

    afterEach(() => {
      delete (document as unknown as { execCommand?: unknown }).execCommand;
    });

    it('turns a code block into a list, one item per line', () => {
      editor.innerHTML = '<pre>line one\nline two</pre>';
      placeCursor(editor.querySelector('pre')!.firstChild!, 2);
      format.execute(ctx);

      expect(editor.querySelector('pre')).toBeNull();
      const list = editor.querySelector(tag.toLowerCase())!;
      expect(Array.from(list.querySelectorAll('li')).map(li => li.textContent)).toEqual(['line one', 'line two']);
      expect(window.getSelection()?.anchorNode).toBe(list.lastElementChild);
      expectFinalised(ctx);
    });

    it('toggles off when the cursor is already in that kind of list', () => {
      editor.innerHTML = `<${tag.toLowerCase()}><li>item</li></${tag.toLowerCase()}>`;
      placeCursor(editor.querySelector('li')!.firstChild!, 2);
      format.execute(ctx);

      expect(editor.querySelector(tag.toLowerCase())).toBeNull();
      expect(editor.querySelector('p')?.textContent).toBe('item');
      expect(execCommand).not.toHaveBeenCalled();
    });

    it('falls back to building the list itself when execCommand does nothing', () => {
      editor.innerHTML = '<p>some text</p>';
      placeCursor(editor.querySelector('p')!.firstChild!, 0);
      format.execute(ctx);

      expect(execCommand).toHaveBeenCalledWith(command, false);
      const li = editor.querySelector(`${tag.toLowerCase()} > li`)!;
      expect(li.textContent).toBe('some text');
      expect(window.getSelection()?.anchorNode).toBe(li);
      expectFinalised(ctx);
    });

    it('gives an empty editor a selection and an empty list item', () => {
      editor.innerHTML = '';
      window.getSelection()?.removeAllRanges();
      format.execute(ctx);

      expect(ctx.focus).toHaveBeenCalled();
      const li = editor.querySelector(`${tag.toLowerCase()} > li`)!;
      expect(li.innerHTML).toBe('<br>');
    });

    it('is active only inside that kind of list', () => {
      editor.innerHTML = `<${tag.toLowerCase()}><li>item</li></${tag.toLowerCase()}><p>out</p>`;
      expect(format.isActive(editor.querySelector('li')!.firstChild!, ctx)).toBe(true);
      expect(format.isActive(editor.querySelector('p')!.firstChild!, ctx)).toBe(false);
    });
  });
});
