import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  mountEditor,
  cleanupEditors,
  setCaret,
  selectRange,
  textNodeOf,
  installExecCommand,
  keydown,
} from './rteHarness';

afterEach(() => {
  cleanupEditors();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

/** Assert the caret is collapsed at (node, offset). */
function expectCaret(node: Node, offset: number) {
  const sel = window.getSelection()!;
  expect(sel.isCollapsed).toBe(true);
  const range = sel.getRangeAt(0);
  expect(range.startContainer).toBe(node);
  expect(range.startOffset).toBe(offset);
}

describe('keydown — external interceptor', () => {
  it('skips all built-in handling when onKeyDown returns true', () => {
    const exec = installExecCommand();
    const onKeyDown = vi.fn(() => true);
    const { el } = mountEditor({ onKeyDown }, 'abc');
    const evt = keydown(el, { key: 'b', ctrlKey: true });
    expect(onKeyDown).toHaveBeenCalledWith(evt);
    expect(exec).not.toHaveBeenCalled();
    expect(evt.defaultPrevented).toBe(false);
  });

  it('continues with built-in handling when onKeyDown returns false', () => {
    const exec = installExecCommand();
    const { el } = mountEditor({ onKeyDown: () => false }, 'abc');
    setCaret(textNodeOf(el), 1);
    keydown(el, { key: 'b', ctrlKey: true });
    expect(exec).toHaveBeenCalledWith('bold', false, undefined);
  });
});

describe('keydown — formatting shortcuts', () => {
  it.each([
    ['b', 'bold', { ctrlKey: true }],
    ['i', 'italic', { ctrlKey: true }],
    ['u', 'underline', { metaKey: true }],
    ['B', 'bold', { metaKey: true }],
  ] as const)('mod+%s runs execCommand("%s")', (key, command, mods) => {
    const exec = installExecCommand();
    const { el } = mountEditor({}, 'abc');
    selectRange(textNodeOf(el), 0, textNodeOf(el), 3);
    const evt = keydown(el, { key, ...mods });
    expect(evt.defaultPrevented).toBe(true);
    expect(exec).toHaveBeenCalledWith(command, false, undefined);
  });

  it.each(['b', 'i', 'u'])(
    'mod+%s inside a code block is swallowed without formatting',
    key => {
      const exec = installExecCommand();
      const { el } = mountEditor({}, '<pre><code>abc</code></pre>');
      setCaret(textNodeOf(el), 1);
      const evt = keydown(el, { key, ctrlKey: true });
      expect(evt.defaultPrevented).toBe(true);
      expect(exec).not.toHaveBeenCalled();
    }
  );

  it('detects a code block when the caret sits on the <pre> element itself', () => {
    const exec = installExecCommand();
    const { el } = mountEditor({}, '<pre></pre>');
    setCaret(el.querySelector('pre')!, 0);
    const evt = keydown(el, { key: 'b', ctrlKey: true });
    expect(evt.defaultPrevented).toBe(true);
    expect(exec).not.toHaveBeenCalled();
  });

  it('formatting shortcuts are inert when enableFormatting is false', () => {
    const exec = installExecCommand();
    const { el } = mountEditor({ enableFormatting: false }, 'abc');
    setCaret(textNodeOf(el), 1);
    const evt = keydown(el, { key: 'b', ctrlKey: true });
    expect(evt.defaultPrevented).toBe(false);
    expect(exec).not.toHaveBeenCalled();
  });

  it('formatting shortcuts work with no selection at all', () => {
    const exec = installExecCommand();
    const { el } = mountEditor({}, 'abc');
    vi.spyOn(window, 'getSelection').mockReturnValue(null);
    keydown(el, { key: 'i', ctrlKey: true });
    expect(exec).toHaveBeenCalledWith('italic', false, undefined);
  });
});

describe('keydown — undo / redo', () => {
  function editorWithHistory() {
    vi.useFakeTimers();
    const ctx = mountEditor({ content: 'one' });
    vi.advanceTimersByTime(300);
    ctx.editor.setHTML('two');
    vi.advanceTimersByTime(300);
    return ctx;
  }

  it('mod+z undoes', () => {
    const { el } = editorWithHistory();
    const evt = keydown(el, { key: 'z', ctrlKey: true });
    expect(evt.defaultPrevented).toBe(true);
    expect(el.innerHTML).toBe('one');
  });

  it.each([
    ['y', false],
    ['z', true],
    ['Z', true],
  ])('mod+%s (shift=%s) redoes', (key, shiftKey) => {
    const { el, editor } = editorWithHistory();
    editor.undo();
    expect(el.innerHTML).toBe('one');
    const evt = keydown(el, { key, metaKey: true, shiftKey });
    expect(evt.defaultPrevented).toBe(true);
    expect(el.innerHTML).toBe('two');
  });
});

describe('keydown — Escape', () => {
  it('closes the mention panel', () => {
    const onMentionEnd = vi.fn();
    const { el } = mountEditor({ onMentionEnd });
    keydown(el, { key: 'Escape' });
    expect(onMentionEnd).toHaveBeenCalledTimes(1);
  });

  it('is harmless without onMentionEnd', () => {
    const { el } = mountEditor();
    expect(keydown(el, { key: 'Escape' }).defaultPrevented).toBe(false);
  });
});

describe('keydown — Backspace / Delete with a full selection', () => {
  it.each(['Backspace', 'Delete'])('%s over all content wipes the editor', key => {
    const onUpdate = vi.fn();
    const { el } = mountEditor(
      { onUpdate },
      '<p>hi <span contenteditable="false" data-uid="u1">@Ann</span>\u00A0</p>'
    );
    const p = el.querySelector('p')!;
    selectRange(p, 0, p, p.childNodes.length);
    const evt = keydown(el, { key });
    expect(evt.defaultPrevented).toBe(true);
    expect(el.innerHTML).toBe('');
    expectCaret(el, 0);
    expect(onUpdate).toHaveBeenLastCalledWith('', '');
  });

  it('a partial selection is left to the browser', () => {
    const { el } = mountEditor({}, '<p>hello</p>');
    const t = textNodeOf(el);
    selectRange(t, 1, t, 3);
    const evt = keydown(el, { key: 'Backspace' });
    expect(evt.defaultPrevented).toBe(false);
    expect(el.innerHTML).toBe('<p>hello</p>');
  });

  it('a collapsed caret is left to the browser', () => {
    const { el } = mountEditor({}, '<p>hello</p>');
    setCaret(textNodeOf(el), 3);
    expect(keydown(el, { key: 'Delete' }).defaultPrevented).toBe(false);
    expect(el.textContent).toBe('hello');
  });

  it('a selection that extends outside the editor is left to the browser', () => {
    const { el } = mountEditor({}, '<p>hello</p>');
    const outside = document.createElement('p');
    outside.textContent = 'outside';
    document.body.appendChild(outside);
    selectRange(textNodeOf(el), 0, outside.firstChild!, 3);
    expect(keydown(el, { key: 'Backspace' }).defaultPrevented).toBe(false);
    expect(el.textContent).toBe('hello');
  });

  it('mod+Backspace is not intercepted', () => {
    const { el } = mountEditor({}, '<p>hello</p>');
    const p = el.querySelector('p')!;
    selectRange(p, 0, p, 1);
    expect(keydown(el, { key: 'Backspace', altKey: true, ctrlKey: true }).defaultPrevented).toBe(
      false
    );
    expect(el.textContent).toBe('hello');
  });
});

describe('keydown — ArrowRight leaves inline code', () => {
  it('moves the caret before the next sibling when at the end of <code>', () => {
    const { el } = mountEditor({}, '<p><code>abc</code> tail</p>');
    const code = el.querySelector('code')!;
    setCaret(code.firstChild!, 3);
    const evt = keydown(el, { key: 'ArrowRight' });
    expect(evt.defaultPrevented).toBe(true);
    const tail = code.nextSibling!;
    expectCaret(code.parentNode!, Array.from(code.parentNode!.childNodes).indexOf(tail as ChildNode));
  });

  it('inserts a zero-width space after a trailing <code> and parks the caret in it', () => {
    const { el } = mountEditor({}, '<p><code>abc</code></p>');
    const code = el.querySelector('code')!;
    setCaret(code.firstChild!, 3);
    const evt = keydown(el, { key: 'ArrowRight' });
    expect(evt.defaultPrevented).toBe(true);
    const zws = code.nextSibling as Text;
    expect(zws.data).toBe('\u200B');
    expectCaret(zws, 1);
  });

  it('measures the offset across several text nodes inside <code>', () => {
    const { el } = mountEditor({}, '<p><code>ab<b>cd</b></code>x</p>');
    const bText = el.querySelector('b')!.firstChild!;
    setCaret(bText, 2);
    expect(keydown(el, { key: 'ArrowRight' }).defaultPrevented).toBe(true);
    setCaret(bText, 1);
    expect(keydown(el, { key: 'ArrowRight' }).defaultPrevented).toBe(false);
  });

  it('handles a caret placed on the <code> element at offset 0 of an empty code', () => {
    const { el } = mountEditor({}, '<p><code></code>x</p>');
    const code = el.querySelector('code')!;
    setCaret(code, 0);
    expect(keydown(el, { key: 'ArrowRight' }).defaultPrevented).toBe(true);
  });

  it('does nothing in the middle of <code>', () => {
    const { el } = mountEditor({}, '<p><code>abc</code></p>');
    setCaret(el.querySelector('code')!.firstChild!, 1);
    expect(keydown(el, { key: 'ArrowRight' }).defaultPrevented).toBe(false);
  });

  it('does nothing inside a code block (<pre><code>)', () => {
    const { el } = mountEditor({}, '<pre><code>abc</code></pre>');
    setCaret(textNodeOf(el), 3);
    expect(keydown(el, { key: 'ArrowRight' }).defaultPrevented).toBe(false);
  });

  it('does nothing outside code, with a range selection, or with modifiers', () => {
    const { el } = mountEditor({}, '<p>plain<code>abc</code></p>');
    setCaret(textNodeOf(el), 5);
    expect(keydown(el, { key: 'ArrowRight' }).defaultPrevented).toBe(false);
    const codeText = el.querySelector('code')!.firstChild!;
    selectRange(codeText, 0, codeText, 3);
    expect(keydown(el, { key: 'ArrowRight' }).defaultPrevented).toBe(false);
    setCaret(codeText, 3);
    expect(keydown(el, { key: 'ArrowRight', shiftKey: true }).defaultPrevented).toBe(false);
    window.getSelection()!.removeAllRanges();
    expect(keydown(el, { key: 'ArrowRight' }).defaultPrevented).toBe(false);
  });

  // Known issue: with the caret on the <code> element itself, its child-index offset is compared to the text length, so a caret after the last child is not treated as "at the end".
  it.fails('treats a caret after the last child of <code> as being at the end', () => {
    const { el } = mountEditor({}, '<p><code>abc</code>x</p>');
    const code = el.querySelector('code')!;
    setCaret(code, 1);
    expect(keydown(el, { key: 'ArrowRight' }).defaultPrevented).toBe(true);
  });
});

describe('keydown — Tab / Shift+Tab in lists', () => {
  it('Tab nests the list item under its previous sibling', () => {
    const onUpdate = vi.fn();
    const { el } = mountEditor({ onUpdate }, '<ul><li>a</li><li>b</li></ul>');
    const b = el.querySelectorAll('li')[1]!;
    setCaret(b.firstChild!, 1);
    const evt = keydown(el, { key: 'Tab' });
    expect(evt.defaultPrevented).toBe(true);
    expect(el.querySelector('ul > li > ul > li')?.textContent).toBe('b');
    expect(onUpdate).toHaveBeenCalled();
  });

  it('Shift+Tab lifts a nested item back out', () => {
    const { el } = mountEditor({}, '<ol><li>a<ol><li>b</li></ol></li></ol>');
    const nested = el.querySelector('ol ol li')!;
    setCaret(nested.firstChild!, 1);
    const evt = keydown(el, { key: 'Tab', shiftKey: true });
    expect(evt.defaultPrevented).toBe(true);
    const top = el.querySelectorAll(':scope > ol > li');
    expect(Array.from(top).map(li => li.textContent)).toEqual(['a', 'b']);
  });

  it('Tab outside a list, or on the first item, is left to the browser', () => {
    const { el } = mountEditor({}, '<p>x</p><ul><li>a</li></ul>');
    setCaret(textNodeOf(el), 0);
    expect(keydown(el, { key: 'Tab' }).defaultPrevented).toBe(false);
    setCaret(el.querySelector('li')!.firstChild!, 0);
    expect(keydown(el, { key: 'Tab' }).defaultPrevented).toBe(false);
    expect(keydown(el, { key: 'Tab', shiftKey: true }).defaultPrevented).toBe(false);
  });

  it('Tab is ignored with a modifier or when formatting is disabled', () => {
    const { el } = mountEditor({}, '<ul><li>a</li><li>b</li></ul>');
    setCaret(el.querySelectorAll('li')[1]!.firstChild!, 0);
    expect(keydown(el, { key: 'Tab', ctrlKey: true }).defaultPrevented).toBe(false);

    const other = mountEditor({ enableFormatting: false }, '<ul><li>a</li><li>b</li></ul>');
    setCaret(other.el.querySelectorAll('li')[1]!.firstChild!, 0);
    expect(keydown(other.el, { key: 'Tab' }).defaultPrevented).toBe(false);
    expect(other.el.querySelector('li ul')).toBeNull();
  });
});

describe('keydown — Space auto-formatting', () => {
  it('"-" + Space turns the line into a bullet list and normalises it', () => {
    const exec = installExecCommand((cmd: string) => {
      if (cmd === 'insertUnorderedList') {
        // what a browser produces: the paragraph becomes a list item wrapping a <div>
        const p = document.querySelector('[role="textbox"] p')!;
        const ul = document.createElement('ul');
        ul.innerHTML = '<li><div>\u200B</div></li>';
        p.replaceWith(ul);
      }
    });
    const { el } = mountEditor({}, '<p>-</p>');
    setCaret(textNodeOf(el), 1);
    const evt = keydown(el, { key: ' ' });
    expect(evt.defaultPrevented).toBe(true);
    expect(exec).toHaveBeenCalledWith('insertUnorderedList', false, undefined);
    const ul = el.querySelector('ul')!;
    expect(ul.style.listStyleType).toBe('disc');
    const div = el.querySelector<HTMLElement>('li > div')!;
    expect(div.style.display).toBe('inline');
    expect(div.style.margin).toBe('0px');
  });

  it('"1." + Space runs insertOrderedList', () => {
    const exec = installExecCommand();
    const { el } = mountEditor({}, '<p>1.</p>');
    setCaret(textNodeOf(el), 2);
    expect(keydown(el, { key: ' ' }).defaultPrevented).toBe(true);
    expect(exec).toHaveBeenCalledWith('insertOrderedList', false, undefined);
  });

  it('">" + Space creates a blockquote', () => {
    const { el } = mountEditor({}, '<p>&gt;</p>');
    setCaret(textNodeOf(el), 1);
    expect(keydown(el, { key: ' ' }).defaultPrevented).toBe(true);
    expect(el.querySelector('blockquote')).not.toBeNull();
    expect(el.textContent).toBe('');
  });

  it('"```" + Space creates a code block', () => {
    const { el } = mountEditor({}, '<p>```</p>');
    setCaret(textNodeOf(el), 3);
    expect(keydown(el, { key: ' ' }).defaultPrevented).toBe(true);
    expect(el.querySelector('pre > code')).not.toBeNull();
  });

  it('Space after ordinary text is left alone', () => {
    const exec = installExecCommand();
    const { el } = mountEditor({}, '<p>hello</p>');
    setCaret(textNodeOf(el), 5);
    expect(keydown(el, { key: ' ' }).defaultPrevented).toBe(false);
    expect(exec).not.toHaveBeenCalled();
  });

  it('Space does not auto-format when formatting is disabled or with a modifier', () => {
    const exec = installExecCommand();
    const { el } = mountEditor({ enableFormatting: false }, '<p>-</p>');
    setCaret(textNodeOf(el), 1);
    expect(keydown(el, { key: ' ' }).defaultPrevented).toBe(false);
    expect(keydown(el, { key: ' ', altKey: true }).defaultPrevented).toBe(false);
    expect(exec).not.toHaveBeenCalled();
    expect(el.innerHTML).toBe('<p>-</p>');
  });
});

describe('keydown — Enter', () => {
  it('Enter calls onEnterPress and suppresses the newline', () => {
    const onEnterPress = vi.fn();
    const { el } = mountEditor({ onEnterPress });
    const evt = keydown(el, { key: 'Enter' });
    expect(onEnterPress).toHaveBeenCalledTimes(1);
    expect(evt.defaultPrevented).toBe(true);
  });

  it('Enter without onEnterPress falls through to the browser', () => {
    const { el } = mountEditor({}, '<p>x</p>');
    setCaret(textNodeOf(el), 1);
    expect(keydown(el, { key: 'Enter' }).defaultPrevented).toBe(false);
  });

  it('mod+Enter and Shift+Enter never call onEnterPress', () => {
    const onEnterPress = vi.fn();
    const { el } = mountEditor({ onEnterPress }, '<p>x</p>');
    setCaret(textNodeOf(el), 1);
    keydown(el, { key: 'Enter', ctrlKey: true });
    keydown(el, { key: 'Enter', shiftKey: true });
    expect(onEnterPress).not.toHaveBeenCalled();
  });
});

describe('keydown — Shift+Enter in lists', () => {
  it('in a non-empty item inserts a new item via insertParagraph', () => {
    const exec = installExecCommand();
    const { el } = mountEditor({}, '<ul><li>a</li></ul>');
    setCaret(el.querySelector('li')!.firstChild!, 1);
    const evt = keydown(el, { key: 'Enter', shiftKey: true });
    expect(evt.defaultPrevented).toBe(true);
    expect(exec).toHaveBeenCalledWith('insertParagraph', false, undefined);
  });

  it('in an empty item exits the list', () => {
    const { el } = mountEditor({}, '<ul><li>a</li><li><br></li></ul>');
    const empty = el.querySelectorAll('li')[1]!;
    setCaret(empty, 0);
    expect(keydown(el, { key: 'Enter', shiftKey: true }).defaultPrevented).toBe(true);
    expect(el.querySelectorAll('li')).toHaveLength(1);
    const p = el.querySelector('ul + p')!;
    expect(p.innerHTML).toBe('<br>');
    expectCaret(p, 0);
  });
});

describe('keydown — Shift+Enter in a code block', () => {
  const shiftEnter = (el: HTMLElement) => keydown(el, { key: 'Enter', shiftKey: true });

  it('in the middle of a line inserts a bare newline', () => {
    const onUpdate = vi.fn();
    const { el } = mountEditor({ onUpdate }, '<pre><code>abcd</code></pre>');
    const t = textNodeOf(el);
    setCaret(t, 2);
    expect(shiftEnter(el).defaultPrevented).toBe(true);
    expect(t.data).toBe('ab\ncd');
    expectCaret(t, 3);
    expect(onUpdate).toHaveBeenCalled();
  });

  it('at the end of a line inserts newline + zero-width space so the new line shows', () => {
    const { el } = mountEditor({}, '<pre><code>ab</code></pre>');
    const t = textNodeOf(el);
    setCaret(t, 2);
    expect(shiftEnter(el).defaultPrevented).toBe(true);
    expect(t.data).toBe('ab\n\u200B');
    expectCaret(t, 4);
  });

  it('on an empty trailing line exits the block into a new paragraph', () => {
    const { el } = mountEditor({}, '<pre><code>ab\n\u200B</code></pre>');
    const t = textNodeOf(el);
    setCaret(t, 4);
    expect(shiftEnter(el).defaultPrevented).toBe(true);
    expect(t.data).toBe('ab');
    const p = el.querySelector('pre + p')!;
    expect(p.innerHTML).toBe('<br>');
    expectCaret(p, 0);
  });

  it('exiting an otherwise empty block leaves a zero-width space behind', () => {
    const { el } = mountEditor({}, '<pre><code>\n</code></pre>');
    const t = textNodeOf(el);
    setCaret(t, 1);
    shiftEnter(el);
    expect(t.data).toBe('\u200B');
    expect(el.querySelector('pre + p')).not.toBeNull();
  });

  it('with the caret on the <code> element appends a new line to its text', () => {
    const onUpdate = vi.fn();
    const { el } = mountEditor({ onUpdate }, '<pre><code>ab</code></pre>');
    const code = el.querySelector('code')!;
    setCaret(code, 0);
    expect(shiftEnter(el).defaultPrevented).toBe(true);
    const t = code.firstChild as Text;
    expect(t.data).toBe('ab\n\u200B');
    expectCaret(t, 4);
    expect(onUpdate).toHaveBeenCalled();
  });

  it('with the caret on an empty <code> element creates the first line', () => {
    const { el } = mountEditor({}, '<pre><code></code></pre>');
    const code = el.querySelector('code')!;
    setCaret(code, 0);
    expect(shiftEnter(el).defaultPrevented).toBe(true);
    expect(code.textContent).toBe('\n\u200B');
    expectCaret(code.firstChild!, 2);
  });

  it('works on a bare <pre> without an inner <code>', () => {
    const { el } = mountEditor({}, '<pre>xy</pre>');
    const t = textNodeOf(el);
    setCaret(t, 1);
    expect(shiftEnter(el).defaultPrevented).toBe(true);
    expect(t.data).toBe('x\ny');
  });

  it('is not intercepted when formatting is disabled', () => {
    const { el } = mountEditor({ enableFormatting: false }, '<pre><code>ab</code></pre>');
    setCaret(textNodeOf(el), 1);
    expect(shiftEnter(el).defaultPrevented).toBe(false);
    expect(el.textContent).toBe('ab');
  });
});

describe('keydown — Shift+Enter in a blockquote', () => {
  const shiftEnter = (el: HTMLElement) => keydown(el, { key: 'Enter', shiftKey: true });

  it('on a non-empty line lets the browser insert the newline', () => {
    const { el } = mountEditor({}, '<blockquote><p>quote</p></blockquote>');
    setCaret(textNodeOf(el), 5);
    expect(shiftEnter(el).defaultPrevented).toBe(false);
    expect(el.innerHTML).toBe('<blockquote><p>quote</p></blockquote>');
  });

  it('on an empty line after content exits, keeping the quote', () => {
    const onUpdate = vi.fn();
    const { el } = mountEditor({ onUpdate }, '<blockquote><p>quote</p><p><br></p></blockquote>');
    const empty = el.querySelectorAll('p')[1]!;
    setCaret(empty, 0);
    expect(shiftEnter(el).defaultPrevented).toBe(true);
    expect(el.querySelector('blockquote')!.innerHTML).toBe('<p>quote</p>');
    const p = el.querySelector('blockquote + p')!;
    expect(p.innerHTML).toBe('<br>');
    expectCaret(p, 0);
    expect(onUpdate).toHaveBeenCalled();
  });

  it('on an empty quote replaces the quote with a paragraph', () => {
    const { el } = mountEditor({}, '<blockquote><p><br></p></blockquote>');
    setCaret(el.querySelector('p')!, 0);
    expect(shiftEnter(el).defaultPrevented).toBe(true);
    expect(el.innerHTML).toBe('<p><br></p>');
  });

  it('on an empty quote with no inner block also exits', () => {
    const { el } = mountEditor({}, '<blockquote>\u200B</blockquote>');
    setCaret(textNodeOf(el), 1);
    expect(shiftEnter(el).defaultPrevented).toBe(true);
    expect(el.querySelector('blockquote')).toBeNull();
    expect(el.querySelector('p')).not.toBeNull();
  });

  it('on a plain paragraph falls through to the browser', () => {
    const { el } = mountEditor({}, '<p>x</p>');
    setCaret(textNodeOf(el), 1);
    expect(shiftEnter(el).defaultPrevented).toBe(false);
  });

  it('with no selection falls through to the browser', () => {
    const { el } = mountEditor({}, '<p>x</p>');
    window.getSelection()!.removeAllRanges();
    expect(shiftEnter(el).defaultPrevented).toBe(false);
  });
});
