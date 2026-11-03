import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  mountEditor,
  cleanupEditors,
  setCaret,
  textNodeOf,
  installExecCommand,
  input,
} from './rteHarness';

afterEach(() => {
  cleanupEditors();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('input — markdown auto-format', () => {
  it('converts **text** to <strong> as the closing marker is typed', () => {
    const onUpdate = vi.fn();
    const { el } = mountEditor({ onUpdate }, '<p>say **hi**</p>');
    setCaret(textNodeOf(el), 10);
    input(el);
    expect(el.querySelector('strong')?.textContent).toBe('hi');
    expect(el.textContent).toBe('say hi\u200B');
    expect(onUpdate).toHaveBeenLastCalledWith(el.innerHTML, 'say hi\u200B');
  });

  it('converts a [label](url) link', () => {
    const { el } = mountEditor({}, '<p>[site](https://example.com)</p>');
    setCaret(textNodeOf(el), 27);
    input(el);
    const a = el.querySelector('a')!;
    expect(a.getAttribute('href')).toBe('https://example.com');
    expect(a.textContent).toBe('site');
  });

  it('the two input events after a markdown conversion are not re-scanned', () => {
    const { el } = mountEditor({}, '<p>_a_</p>');
    setCaret(textNodeOf(el), 3);
    input(el);
    expect(el.querySelector('em')).not.toBeNull();

    const p = document.createElement('p');
    p.textContent = '_b_';
    el.appendChild(p);
    setCaret(p.firstChild!, 3);
    input(el);
    input(el);
    expect(el.querySelectorAll('em')).toHaveLength(1);
    input(el);
    expect(el.querySelectorAll('em')).toHaveLength(2);
  });

  it('input right after a toolbar format only snapshots and emits', () => {
    installExecCommand();
    const onUpdate = vi.fn();
    const { el, editor } = mountEditor({ onUpdate }, '<p>~~x~~</p>');
    setCaret(textNodeOf(el), 5);
    editor.applyBold();
    onUpdate.mockClear();
    input(el);
    expect(el.querySelector('s')).toBeNull();
    expect(onUpdate).toHaveBeenCalledTimes(1);
  });

  it('does not convert markdown when formatting is disabled', () => {
    const { el } = mountEditor({ enableFormatting: false }, '<p>**hi**</p>');
    setCaret(textNodeOf(el), 6);
    input(el);
    expect(el.querySelector('strong')).toBeNull();
    expect(el.textContent).toBe('**hi**');
  });
});

describe('input — list normalisation', () => {
  it('makes browser-inserted <div>/<p> wrappers inside <li> inline and restyles lists', () => {
    const { el } = mountEditor({}, '<ol><li><div>a</div></li><li><p>b</p></li></ol>');
    setCaret(textNodeOf(el), 1);
    input(el);
    for (const w of Array.from(el.querySelectorAll('li > div, li > p'))) {
      const s = (w as HTMLElement).style;
      expect(s.display).toBe('inline');
      expect(s.margin).toBe('0px');
      expect(s.padding).toBe('0px');
    }
    expect(el.querySelector('ol')!.style.listStyleType).toBe('decimal');
  });
});

describe('input — mention trigger', () => {
  it('reports the query typed after @', () => {
    const onMentionStart = vi.fn();
    const onMentionEnd = vi.fn();
    const { el } = mountEditor({ onMentionStart, onMentionEnd }, 'hi @jo');
    setCaret(textNodeOf(el), 6);
    input(el);
    expect(onMentionStart).toHaveBeenCalledWith('jo');
    expect(onMentionEnd).not.toHaveBeenCalled();
  });

  it('closes the panel when the caret leaves the trigger', () => {
    const onMentionStart = vi.fn();
    const onMentionEnd = vi.fn();
    const { el } = mountEditor({ onMentionStart, onMentionEnd }, 'hi there');
    setCaret(textNodeOf(el), 8);
    input(el);
    expect(onMentionStart).not.toHaveBeenCalled();
    expect(onMentionEnd).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['inline code', '<p><code>@jo</code></p>'],
    ['a code block', '<pre><code>@jo</code></pre>'],
  ])('is suppressed inside %s', (_label, html) => {
    const onMentionStart = vi.fn();
    const onMentionEnd = vi.fn();
    const { el } = mountEditor({ onMentionStart, onMentionEnd }, html);
    setCaret(textNodeOf(el), 3);
    input(el);
    expect(onMentionStart).not.toHaveBeenCalled();
    expect(onMentionEnd).toHaveBeenCalledTimes(1);
  });

  it('does nothing without mention callbacks or without a selection', () => {
    const { el } = mountEditor({}, 'hi @jo');
    setCaret(textNodeOf(el), 6);
    expect(() => {
      input(el);
    }).not.toThrow();
    window.getSelection()!.removeAllRanges();
    const onMentionStart = vi.fn();
    const other = mountEditor({ onMentionStart }, '@a');
    input(other.el);
    expect(onMentionStart).not.toHaveBeenCalled();
  });
});

describe('input — empty-content cleanup', () => {
  it.each([
    ['only <br>', '<br>'],
    ['a <div><br></div> left by Chrome', '<div><br></div>'],
    ['empty wrappers with zero-width spaces', '<p>\u200B</p><span> </span>'],
    ['empty lists / quotes / code blocks', '<ul><li><br></li></ul><blockquote> </blockquote><pre></pre>'],
  ])('wipes %s and parks the caret on the root', (_label, html) => {
    const onUpdate = vi.fn();
    const { el } = mountEditor({ onUpdate }, html);
    el.focus();
    input(el);
    expect(el.innerHTML).toBe('');
    const range = window.getSelection()!.getRangeAt(0);
    expect(range.startContainer).toBe(el);
    expect(range.startOffset).toBe(0);
    expect(onUpdate).toHaveBeenLastCalledWith('', '');
  });

  it('keeps text-less but meaningful content such as an image', () => {
    const { el } = mountEditor({}, '<img alt="">');
    input(el);
    expect(el.innerHTML).toBe('<img alt="">');
  });

  it('keeps real content', () => {
    const { el } = mountEditor({}, '<p>hi</p>');
    setCaret(textNodeOf(el), 2);
    input(el);
    expect(el.innerHTML).toBe('<p>hi</p>');
  });

  it('wipes without touching the selection when there is none', () => {
    const { el } = mountEditor({}, '<br>');
    const getSel = vi.spyOn(window, 'getSelection').mockReturnValue(null);
    input(el);
    expect(el.innerHTML).toBe('');
    getSel.mockRestore();

    const other = mountEditor({}, '<ul><li></li></ul>');
    vi.spyOn(window, 'getSelection').mockReturnValue(null);
    input(other.el);
    expect(other.el.innerHTML).toBe('');
  });

  it('records the result in history so it can be undone', () => {
    vi.useFakeTimers();
    const { el, editor } = mountEditor({ content: 'start' });
    vi.advanceTimersByTime(300);
    el.textContent = 'start!';
    setCaret(textNodeOf(el), 6);
    input(el);
    vi.advanceTimersByTime(300);
    expect(editor.undo()).toBe(true);
    expect(el.innerHTML).toBe('start');
  });
});
